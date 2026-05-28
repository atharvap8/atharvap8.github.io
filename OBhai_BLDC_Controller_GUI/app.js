/**
 * app.js — OBhai BLDC Controller GUI main logic
 * Wires UI to protocol layer. Manages tabs, gauges, charts, control, config, terminal.
 */

// ══════════════════════════════════════════════════════
// Globals
// ══════════════════════════════════════════════════════
const serial   = new SerialManager();
const protocol = new Protocol(serial);

let isConnected = false;
let currentMode = 0;
let motorEnabled = false;
let maxRpm = 5000;  // updated when cfg-max-rpm is read

// ══════════════════════════════════════════════════════
// Utility
// ══════════════════════════════════════════════════════
const $ = id => document.getElementById(id);

function setGauge(id, value, decimals = 1) {
    const el = $(id);
    if (el) el.textContent = value == null ? '—' : parseFloat(value).toFixed(decimals);
}

function setStatus(state, text) {
    const cs  = $('conn-status');
    const cst = $('conn-status-text');
    cs.setAttribute('data-state', state);
    cst.textContent = text;
}

function log(text, cls = 'line-rx') {
    const out = $('terminal-output');
    const line = document.createElement('div');
    line.className = cls;
    line.textContent = text;
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
}

const MODES = ['IDLE', 'VELOCITY', 'TORQUE', 'OPEN LOOP'];

// ══════════════════════════════════════════════════════
// Browser check
// ══════════════════════════════════════════════════════
if (!('serial' in navigator)) {
    $('browser-warning').classList.remove('hidden');
    $('connect-btn').disabled = true;
} else {
    $('browser-warning').classList.add('hidden');
}

// ══════════════════════════════════════════════════════
// Tab switching
// ══════════════════════════════════════════════════════
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
        btn.classList.add('active');
        $(`tab-${tab}`).classList.remove('hidden');
    });
});

// ══════════════════════════════════════════════════════
// Connection
// ══════════════════════════════════════════════════════
$('connect-btn').addEventListener('click', async () => {
    if (isConnected) {
        await doDisconnect();
    } else {
        await doConnect();
    }
});

serial.onDisconnect(() => {
    isConnected = false;
    setStatus('disconnected', 'Disconnected');
    $('connect-btn').textContent = 'Connect';
    $('connect-btn').classList.remove('connected');
    const badge = $('device-badge');
    badge.classList.remove('connected');
    $('device-text').textContent = 'Not connected';
    log('[disconnected from device]', 'line-sys');
});

async function doConnect() {
    setStatus('connecting', 'Connecting…');
    $('connect-btn').textContent = '…';
    $('connect-btn').disabled = true;
    try {
        await serial.connect();
        setStatus('connecting', 'Handshaking…');
        log('[port opened — waiting for handshake…]', 'line-sys');

        const info = await protocol.handshake();
        isConnected = true;

        setStatus('connected', 'Connected');
        $('connect-btn').textContent = 'Disconnect';
        $('connect-btn').classList.add('connected');
        $('connect-btn').disabled = false;

        const badge = $('device-badge');
        badge.classList.add('connected');
        $('device-text').textContent = `OBhai BLDC · fw:${info.fw} · hw:${info.hw}`;
        log(`[connected: ${info.raw}]`, 'line-sys');

        setupTelemetry();

    } catch (err) {
        isConnected = false;
        setStatus('error', 'Failed');
        $('connect-btn').textContent = 'Connect';
        $('connect-btn').disabled = false;
        log(`[error: ${err.message}]`, 'line-err');
    }
}

async function doDisconnect() {
    await serial.disconnect();
    isConnected = false;
    setStatus('disconnected', 'Disconnected');
    $('connect-btn').textContent = 'Connect';
    $('connect-btn').classList.remove('connected');
    $('device-badge').classList.remove('connected');
    $('device-text').textContent = 'Not connected';
}

// ══════════════════════════════════════════════════════
// Charts
// ══════════════════════════════════════════════════════
const chartRpm  = new RollingChart($('chart-rpm'),  { color: '#38bdf8', unit: 'RPM',  windowSec: 30 });
const chartVbus = new RollingChart($('chart-vbus'), { color: '#4ade80', unit: 'V',    windowSec: 30 });
const chartDq   = new RollingChart($('chart-dq'),   { color: '#38bdf8', color2: '#f87171', unit: 'A', windowSec: 30 });

// ══════════════════════════════════════════════════════
// Telemetry subscriptions
// ══════════════════════════════════════════════════════
function setupTelemetry() {
    const T = (key, fn) => protocol.onTelemetry(key, fn);
    const now = () => Date.now();

    T('rpm',      v => { setGauge('val-rpm', v, 1);    chartRpm.push(now(), v);  updateRpmBar(v); });
    T('vbus',     v => { setGauge('val-vbus', v, 2);   chartVbus.push(now(), v); applyVbusState(v); });
    T('ibus',     v =>   setGauge('val-ibus', v, 2));
    T('temp',     v => { setGauge('val-temp', v, 1);   applyTempState(v); });
    T('ia',       v =>   setGauge('val-ia', v, 2));
    T('ib',       v =>   setGauge('val-ib', v, 2));
    T('id',       v => { setGauge('val-id', v, 3);     chartDq.push(now(), v, 1); });
    T('iq',       v => { setGauge('val-iq', v, 3);     chartDq.push(now(), v, 2); });
    T('enc_pos',  v =>   setGauge('val-enc-pos', v, 3));
    T('enc_vel',  v =>   setGauge('val-enc-vel', v, 2));
    T('fault',    v =>   updateFault(v));
    T('mode',     v =>   updateModeDisplay(v));
    T('enable',   v =>   updateEnableDisplay(v));
}

function updateRpmBar(rpm) {
    const pct = Math.min(100, Math.abs(rpm) / maxRpm * 100);
    $('bar-rpm').style.width = pct + '%';
}

function applyVbusState(v) {
    const card = $('card-vbus');
    card.classList.remove('state-fault', 'state-warn');
    if (v < 10) card.classList.add('state-fault');
    else if (v < 15) card.classList.add('state-warn');
}

function applyTempState(v) {
    const card  = $('card-temp');
    const gauge = $('val-temp');
    card.classList.remove('state-fault', 'state-warn');
    gauge.style.color = '';
    if (v > 80) { card.classList.add('state-fault'); gauge.style.color = 'var(--red)'; }
    else if (v > 65) { card.classList.add('state-warn'); gauge.style.color = 'var(--yellow)'; }
}

function updateFault(v) {
    const banner = $('fault-banner');
    if (v === 0) {
        banner.classList.add('hidden');
        $('card-rpm').classList.remove('state-fault');
    } else {
        $('fault-text').textContent = `FAULT: 0x${Math.round(v).toString(16).toUpperCase().padStart(4,'0')}`;
        banner.classList.remove('hidden');
        $('card-rpm').classList.add('state-fault');
    }
}

function updateModeDisplay(v) {
    const m = MODES[Math.round(v)] ?? 'UNKNOWN';
    $('dash-mode').textContent = m;

    // Sync mode buttons
    document.querySelectorAll('.mode-select-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.mode) === Math.round(v));
    });
    currentMode = Math.round(v);
}

function updateEnableDisplay(v) {
    motorEnabled = v > 0;
    const pill  = $('dash-enable');
    const ebtn  = $('enable-btn');
    const etext = $('enable-text');
    const eicon = $('enable-icon');

    if (motorEnabled) {
        pill.textContent = 'ENABLED';
        pill.classList.add('on');
        ebtn.classList.add('on');
        etext.textContent = 'ENABLED';
        eicon.textContent = '▶';
    } else {
        pill.textContent = 'DISABLED';
        pill.classList.remove('on');
        ebtn.classList.remove('on');
        etext.textContent = 'DISABLED';
        eicon.textContent = '⏸';
    }
}

// ══════════════════════════════════════════════════════
// Control Tab
// ══════════════════════════════════════════════════════
$('enable-btn').addEventListener('click', async () => {
    if (!isConnected) return;
    try {
        await protocol.write('enable', motorEnabled ? 0 : 1);
    } catch (e) { log(`[err] ${e.message}`, 'line-err'); }
});

// Mode buttons
document.querySelectorAll('.mode-select-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (!isConnected) return;
        try {
            await protocol.write('mode', btn.dataset.mode);
        } catch (e) { log(`[err] ${e.message}`, 'line-err'); }
    });
});

// Velocity slider ↔ number sync
const velSlider = $('vel-slider');
const velNum    = $('vel-num');
velSlider.addEventListener('input', () => {
    velNum.value = velSlider.value;
    $('vel-display').innerHTML = `${velSlider.value} <span>RPM</span>`;
});
velNum.addEventListener('input', () => {
    velSlider.value = velNum.value;
    $('vel-display').innerHTML = `${velNum.value} <span>RPM</span>`;
});
$('vel-set-btn').addEventListener('click', async () => {
    if (!isConnected) return;
    try { await protocol.write('vel_setpoint', velNum.value); }
    catch (e) { log(`[err] ${e.message}`, 'line-err'); }
});

// Torque slider ↔ number sync
const torqueSlider = $('torque-slider');
const torqueNum    = $('torque-num');
torqueSlider.addEventListener('input', () => {
    torqueNum.value = torqueSlider.value;
    $('torque-display').innerHTML = `${parseFloat(torqueSlider.value).toFixed(2)} <span>A</span>`;
});
torqueNum.addEventListener('input', () => {
    torqueSlider.value = torqueNum.value;
    $('torque-display').innerHTML = `${parseFloat(torqueNum.value).toFixed(2)} <span>A</span>`;
});
$('torque-set-btn').addEventListener('click', async () => {
    if (!isConnected) return;
    try { await protocol.write('torque_setpoint', torqueNum.value); }
    catch (e) { log(`[err] ${e.message}`, 'line-err'); }
});

// Ramp rate
$('ramp-set-btn').addEventListener('click', async () => {
    if (!isConnected) return;
    try { await protocol.write('vel_ramp_rate', $('ramp-num').value); }
    catch (e) { log(`[err] ${e.message}`, 'line-err'); }
});

// E-Stop: disable + back to idle mode
$('estop-btn').addEventListener('click', async () => {
    if (!isConnected) return;
    try {
        await protocol.write('enable', 0);
        await protocol.write('mode', 0);
    } catch (e) { log(`[err] ${e.message}`, 'line-err'); }
});

// Zero encoder (sends w enc_pos 0)
$('zero-btn').addEventListener('click', async () => {
    if (!isConnected) return;
    try { await protocol.write('enc_pos', 0); }
    catch (e) { log(`[err] ${e.message}`, 'line-err'); }
});

// ══════════════════════════════════════════════════════
// Config Tab
// ══════════════════════════════════════════════════════
const CFG_ALL_KEYS = [
    { key: 'kp_vel',       target: 'cfg-kp-vel'       },
    { key: 'ki_vel',       target: 'cfg-ki-vel'        },
    { key: 'kp_curr_d',    target: 'cfg-kp-curr-d'    },
    { key: 'ki_curr_d',    target: 'cfg-ki-curr-d'    },
    { key: 'kp_curr_q',    target: 'cfg-kp-curr-q'    },
    { key: 'ki_curr_q',    target: 'cfg-ki-curr-q'    },
    { key: 'pole_pairs',   target: 'cfg-pole-pairs'   },
    { key: 'flux_linkage', target: 'cfg-flux-linkage'  },
    { key: 'deadtime_ns',  target: 'cfg-deadtime'      },
    { key: 'encoder_cpr',  target: 'cfg-encoder-cpr'  },
    { key: 'max_rpm',      target: 'cfg-max-rpm'       },
    { key: 'max_current',  target: 'cfg-max-current'   },
    { key: 'vel_ramp_rate',target: 'cfg-ramp-rate'    },
];

// Individual ↓ read / ↑ write buttons
document.querySelectorAll('.btn-rw').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (!isConnected) return;
        const key    = btn.dataset.key;
        const target = btn.dataset.target;
        const action = btn.dataset.action;
        try {
            if (action === 'read') {
                const val = await protocol.read(key);
                $(target).value = val;
                if (key === 'max_rpm') maxRpm = parseFloat(val) || 5000;
            } else {
                const val = $(target).value;
                if (val === '') { alert(`Enter a value for ${key} first.`); return; }
                await protocol.write(key, val);
            }
        } catch (e) { log(`[err] ${e.message}`, 'line-err'); }
    });
});

$('cfg-read-all-btn').addEventListener('click', async () => {
    if (!isConnected) return;
    for (const { key, target } of CFG_ALL_KEYS) {
        try {
            const val = await protocol.read(key);
            $(target).value = val;
            if (key === 'max_rpm') maxRpm = parseFloat(val) || 5000;
        } catch (_) {}
        await new Promise(r => setTimeout(r, 30)); // small gap between reads
    }
    log('[config: all parameters read]', 'line-sys');
});

$('cfg-write-all-btn').addEventListener('click', async () => {
    if (!isConnected) return;
    for (const { key, target } of CFG_ALL_KEYS) {
        const v = $(target).value;
        if (v === '') continue;
        try { await protocol.write(key, v); }
        catch (e) { log(`[err writing ${key}]: ${e.message}`, 'line-err'); }
        await new Promise(r => setTimeout(r, 30));
    }
    log('[config: all parameters written]', 'line-sys');
});

// Fault clear
$('clear-fault-btn').addEventListener('click', async () => {
    if (!isConnected) return;
    try { await protocol.write('fault', 0); }
    catch (e) { log(`[err] ${e.message}`, 'line-err'); }
});

// ══════════════════════════════════════════════════════
// Terminal Tab
// ══════════════════════════════════════════════════════
protocol.onRawLine(line => {
    let cls = 'line-rx';
    if (line.startsWith('>>'))         cls = 'line-tx';
    else if (line.startsWith('ERR'))   cls = 'line-err';
    else if (line === '<< OK')         cls = 'line-ok';
    else if (line.startsWith('<< T ')) cls = 'line-tele';
    log(line, cls);
});

$('term-send-btn').addEventListener('click', sendTerminal);
$('terminal-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') sendTerminal();
});

async function sendTerminal() {
    const input = $('terminal-input');
    const cmd = input.value.trim();
    if (!cmd || !isConnected) return;
    input.value = '';
    try { await protocol.sendRaw(cmd); }
    catch (e) { log(`[err] ${e.message}`, 'line-err'); }
}

$('term-clear-btn').addEventListener('click', () => {
    $('terminal-output').innerHTML = '';
});

// ══════════════════════════════════════════════════════
// Init
// ══════════════════════════════════════════════════════
console.log('OBhai BLDC Controller GUI — ready');
