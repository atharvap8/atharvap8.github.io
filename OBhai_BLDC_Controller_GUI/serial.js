/**
 * serial.js — WebSerial abstraction for OBhai BLDC Controller GUI
 * Provides line-by-line reading and queued writes over USB CDC VCP.
 */

class SerialManager {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this._lineHandlers = [];
        this._disconnectHandlers = [];
        this._reading = false;
    }

    get isOpen() {
        return this.port !== null && this._reading;
    }

    /** Register a handler called with each complete line received */
    onLine(handler) {
        this._lineHandlers.push(handler);
    }

    /** Register a handler called when the port unexpectedly closes */
    onDisconnect(handler) {
        this._disconnectHandlers.push(handler);
    }

    _emit(line) {
        this._lineHandlers.forEach(h => h(line));
    }

    _emitDisconnect() {
        this._disconnectHandlers.forEach(h => h());
    }

    /** Open a port. Shows browser picker. Returns true on success. */
    async connect() {
        if (!('serial' in navigator)) {
            throw new Error('WebSerial not supported. Use Chrome or Edge.');
        }

        this.port = await navigator.serial.requestPort();
        await this.port.open({ baudRate: 115200 });

        // Assert DTR — triggers STM32 handshake
        try {
            await this.port.setSignals({ dataTerminalReady: true, requestToSend: true });
        } catch (_) { /* some ports don't support setSignals */ }

        this._setupWriter();
        this._startReading();

        return true;
    }

    _setupWriter() {
        const encoder = new TextEncoderStream();
        encoder.readable.pipeTo(this.port.writable).catch(() => {});
        this.writer = encoder.writable.getWriter();
    }

    async _startReading() {
        this._reading = true;
        const decoder = new TextDecoderStream();
        this.port.readable.pipeTo(decoder.writable).catch(() => this._onPortClosed());

        const reader = decoder.readable.getReader();
        this.reader = reader;

        let buffer = '';
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += value;
                const lines = buffer.split('\n');
                buffer = lines.pop(); // keep incomplete last chunk
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.length > 0) this._emit(trimmed);
                }
            }
        } catch (_) {
            // port closed or error
        } finally {
            this._reading = false;
            this._emitDisconnect();
        }
    }

    _onPortClosed() {
        this._reading = false;
        this._emitDisconnect();
    }

    /** Send a raw line (newline appended automatically) */
    async send(line) {
        if (!this.writer) throw new Error('Port not open');
        await this.writer.write(line + '\n');
    }

    /** Gracefully close the port */
    async disconnect() {
        this._reading = false;
        try { this.reader?.cancel(); } catch (_) {}
        try { await this.writer?.close(); } catch (_) {}
        try { await this.port?.close(); } catch (_) {}
        this.port = null;
        this.reader = null;
        this.writer = null;
    }
}
