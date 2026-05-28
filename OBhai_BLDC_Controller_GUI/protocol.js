/**
 * protocol.js — OBhai BLDC ASCII protocol layer
 *
 * Wire format (ASCII, newline-terminated):
 *   GUI → MCU:   w <key> <value>\n   (write)
 *                r <key>\n           (read)
 *                ping\n              (re-trigger handshake)
 *
 *   MCU → GUI:   OBHAI_BLDC fw:x.x.x hw:vx\n   (handshake / identity)
 *                <key>=<value>\n                 (read response)
 *                OK\n                            (write ack)
 *                ERR:<message>\n                 (error)
 *                T <key>=<value>\n               (telemetry push)
 */

const HANDSHAKE_PREFIX = 'OBHAI_BLDC';
const HANDSHAKE_TIMEOUT_MS = 3000;
const RESPONSE_TIMEOUT_MS = 2000;

class Protocol {
    constructor(serial) {
        this._serial = serial;

        /** Map of key → [callbacks] for telemetry subscriptions */
        this._telemetryHandlers = new Map();

        /** Map of key → {resolve, reject, timer} for pending read/write responses */
        this._pending = new Map();

        /** Raw line log for terminal (all lines in/out) */
        this._rawLineHandlers = [];

        /** Handshake info after successful connect */
        this.deviceInfo = null;

        // Wire up incoming lines
        this._serial.onLine(line => this._handleLine(line));
    }

    /** Subscribe to raw lines for terminal display */
    onRawLine(handler) {
        this._rawLineHandlers.push(handler);
    }

    /** Subscribe to telemetry for a specific key (or '*' for all) */
    onTelemetry(key, handler) {
        if (!this._telemetryHandlers.has(key)) {
            this._telemetryHandlers.set(key, []);
        }
        this._telemetryHandlers.get(key).push(handler);
    }

    /** Remove all telemetry handlers */
    clearTelemetry() {
        this._telemetryHandlers.clear();
    }

    /**
     * Perform handshake after port open.
     * Waits up to HANDSHAKE_TIMEOUT_MS for the OBHAI_BLDC line.
     * @returns {Promise<{fw, hw}>} device info
     */
    async handshake() {
        // Send ping to prompt STM32 (DTR may have already done it)
        await this._serial.send('ping');

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Handshake timeout — is this an OBhai BLDC Controller?'));
            }, HANDSHAKE_TIMEOUT_MS);

            // One-shot listener for OBHAI_BLDC line
            const handler = (line) => {
                if (line.startsWith(HANDSHAKE_PREFIX)) {
                    clearTimeout(timer);
                    this._serial._lineHandlers = this._serial._lineHandlers.filter(h => h !== handler);
                    const info = this._parseHandshake(line);
                    this.deviceInfo = info;
                    resolve(info);
                }
            };
            this._serial.onLine(handler);
        });
    }

    _parseHandshake(line) {
        // "OBHAI_BLDC fw:1.0.0 hw:v2"
        const fw = line.match(/fw:([\S]+)/)?.[1] ?? '?';
        const hw = line.match(/hw:([\S]+)/)?.[1] ?? '?';
        return { fw, hw, raw: line };
    }

    /**
     * Write a parameter to the MCU.
     * Sends "w <key> <value>\n", waits for OK or ERR.
     * @returns {Promise<void>}
     */
    async write(key, value) {
        const cmd = `w ${key} ${value}`;
        await this._serial.send(cmd);
        this._logRaw(`>> ${cmd}`);

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this._pending.delete(`__wr_${key}`);
                reject(new Error(`Write timeout for key: ${key}`));
            }, RESPONSE_TIMEOUT_MS);

            this._pending.set(`__wr_${key}`, { resolve, reject, timer, type: 'write' });
        });
    }

    /**
     * Read a parameter from the MCU.
     * Sends "r <key>\n", waits for "<key>=<value>" response.
     * @returns {Promise<string>} the value string
     */
    async read(key) {
        const cmd = `r ${key}`;
        await this._serial.send(cmd);
        this._logRaw(`>> ${cmd}`);

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this._pending.delete(key);
                reject(new Error(`Read timeout for key: ${key}`));
            }, RESPONSE_TIMEOUT_MS);

            this._pending.set(key, { resolve, reject, timer, type: 'read' });
        });
    }

    /** Send a raw string (for terminal tab) */
    async sendRaw(line) {
        await this._serial.send(line);
        this._logRaw(`>> ${line}`);
    }

    // ==================== Internal line dispatcher ====================
    _handleLine(line) {
        this._logRaw(`<< ${line}`);

        // Handshake re-broadcast (already handled in handshake() one-shot)
        if (line.startsWith(HANDSHAKE_PREFIX)) {
            this.deviceInfo = this._parseHandshake(line);
            return;
        }

        // Telemetry: "T key=value"
        if (line.startsWith('T ')) {
            const rest = line.slice(2);
            const eq = rest.indexOf('=');
            if (eq !== -1) {
                const key = rest.slice(0, eq).trim();
                const val = rest.slice(eq + 1).trim();
                this._dispatchTelemetry(key, parseFloat(val));
            }
            return;
        }

        // OK (write ack) — resolve oldest pending write
        if (line === 'OK') {
            for (const [pkey, p] of this._pending.entries()) {
                if (p.type === 'write') {
                    clearTimeout(p.timer);
                    this._pending.delete(pkey);
                    p.resolve();
                    return;
                }
            }
            return;
        }

        // Error response: "ERR:message"
        if (line.startsWith('ERR:')) {
            const msg = line.slice(4);
            // Reject the first pending write, or oldest pending read
            for (const [pkey, p] of this._pending.entries()) {
                clearTimeout(p.timer);
                this._pending.delete(pkey);
                p.reject(new Error(msg));
                return;
            }
            return;
        }

        // Read response: "key=value"
        const eq = line.indexOf('=');
        if (eq !== -1) {
            const key = line.slice(0, eq).trim();
            const val = line.slice(eq + 1).trim();
            if (this._pending.has(key)) {
                const p = this._pending.get(key);
                clearTimeout(p.timer);
                this._pending.delete(key);
                p.resolve(val);
            }
        }
    }

    _dispatchTelemetry(key, value) {
        // Specific handlers
        if (this._telemetryHandlers.has(key)) {
            this._telemetryHandlers.get(key).forEach(h => h(value));
        }
        // Wildcard handlers
        if (this._telemetryHandlers.has('*')) {
            this._telemetryHandlers.get('*').forEach(h => h(key, value));
        }
    }

    _logRaw(line) {
        this._rawLineHandlers.forEach(h => h(line));
    }
}
