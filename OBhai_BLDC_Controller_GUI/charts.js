/**
 * charts.js — Lightweight rolling timeseries chart (Canvas, no dependencies)
 * Usage:
 *   const chart = new RollingChart(canvasEl, { color: '#38bdf8', unit: 'RPM', windowSec: 30 });
 *   chart.push(Date.now(), 1234.5);
 */

class RollingChart {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.color       = options.color       ?? '#38bdf8';
        this.color2      = options.color2      ?? null;   // second series (e.g. Iq)
        this.unit        = options.unit        ?? '';
        this.windowSec   = options.windowSec   ?? 30;
        this.yMin        = options.yMin        ?? null;   // null = auto
        this.yMax        = options.yMax        ?? null;

        this._data  = [];   // [{t, v}]
        this._data2 = [];   // second series

        this._rafId = null;
        this._dirty = false;

        this._resize();
        window.addEventListener('resize', () => this._resize());
        this._loop();
    }

    push(timestamp, value, series = 1) {
        const arr = series === 2 ? this._data2 : this._data;
        arr.push({ t: timestamp, v: value });
        this._dirty = true;
    }

    clear() {
        this._data  = [];
        this._data2 = [];
        this._dirty = true;
    }

    _resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width  = rect.width  * dpr;
        this.canvas.height = (this.canvas.height || 120) * dpr;
        this.ctx.scale(dpr, dpr);
        this._logicalW = rect.width;
        this._logicalH = this.canvas.offsetHeight || 120;
        this._dirty = true;
    }

    _loop() {
        if (this._dirty) {
            this._render();
            this._dirty = false;
        }
        this._rafId = requestAnimationFrame(() => this._loop());
    }

    _prune(now) {
        const cutoff = now - this.windowSec * 1000;
        this._data  = this._data.filter(p => p.t >= cutoff);
        this._data2 = this._data2.filter(p => p.t >= cutoff);
    }

    _render() {
        const ctx = this.ctx;
        const W = this._logicalW;
        const H = this._logicalH;
        const now = Date.now();

        this._prune(now);

        ctx.clearRect(0, 0, W, H);

        // Background
        ctx.fillStyle = 'rgba(3, 7, 18, 0)';
        ctx.fillRect(0, 0, W, H);

        // Grid lines
        const gridColor = 'rgba(226, 232, 240, 0.06)';
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (H / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }
        for (let i = 1; i <= 5; i++) {
            const x = (W / 6) * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }

        if (this._data.length < 2) return;

        // Auto Y range from primary series
        const allVals = [...this._data.map(p => p.v), ...this._data2.map(p => p.v)];
        let yMin = this.yMin ?? Math.min(...allVals);
        let yMax = this.yMax ?? Math.max(...allVals);
        if (yMin === yMax) { yMin -= 1; yMax += 1; }
        const yRange = yMax - yMin;

        const xFor = t => ((t - (now - this.windowSec * 1000)) / (this.windowSec * 1000)) * W;
        const yFor = v => H - ((v - yMin) / yRange) * H * 0.85 - H * 0.075;

        const drawSeries = (data, color) => {
            if (data.length < 2) return;
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            data.forEach((p, i) => {
                const x = xFor(p.t);
                const y = yFor(p.v);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Fill gradient
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, color.replace(')', ', 0.15)').replace('rgb', 'rgba'));
            grad.addColorStop(1, color.replace(')', ', 0)').replace('rgb', 'rgba'));
            ctx.lineTo(xFor(data[data.length - 1].t), H);
            ctx.lineTo(xFor(data[0].t), H);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();
        };

        drawSeries(this._data, this.color);
        if (this._data2.length > 1 && this.color2) {
            drawSeries(this._data2, this.color2);
        }

        // Latest value label
        const last = this._data[this._data.length - 1];
        ctx.fillStyle = this.color;
        ctx.font = '700 11px "Space Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${last.v.toFixed(1)} ${this.unit}`, W - 6, 14);
    }

    destroy() {
        cancelAnimationFrame(this._rafId);
    }
}
