const template = document.createElement('template');
template.innerHTML = `
      <style>
        :host {
          display: inline-block;
          font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        }
        .card {
        margin-top: 16px;
          width: 100%;
          max-width: 100%;
          background: linear-gradient(180deg, #ffffff, #fbfdff);
          border-radius: 12px;
          box-shadow: 0 6px 24px rgba(17,24,39,0.08);
          padding: 16px;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }

        .bg-art {
          position: absolute;
          inset: 12px;
          background-color: lightgray;
          opacity: 0.12;
          pointer-events: none;
          filter: saturate(0.6) blur(0px);
        }

        .top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .title {
          font-size: 14px;
          color: #0f172a;
          font-weight: 600;
        }

        .controls {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .btn {
          appearance: none;
          border: 0;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          background: linear-gradient(180deg,#2563eb,#1d4ed8);
          color: white;
          font-weight: 600;
          box-shadow: 0 6px 14px rgba(37,99,235,0.18);
        }

        .btn.secondary {
          background: transparent;
          border: 1px solid rgba(15,23,42,0.07);
          color: #0f172a;
          box-shadow: none;
        }

        .stage {
          position: relative;
          display: flex;
          gap: 12px;
        }

        canvas {
          border-radius: 8px;
          background: linear-gradient(180deg, rgba(245,247,255,0.8), rgba(250,251,255,0.9));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
          display: block;
        }

        .legend {
          display:flex;
          flex-direction: column;
          gap:6px;
          min-width: 140px;
          align-items: flex-start;
        }

        .legend .row {
          display:flex;
          gap:8px;
          align-items:center;
          font-size:13px;
          color:#334155;
        }
        .swatch {
          width:12px;
          height:12px;
          border-radius:3px;
        }

        .note {
          margin-top:8px;
          font-size:12px;
          color:#6b7280;
        }

        /* responsive */
        @media (max-width:520px){
          .stage { flex-direction: column; align-items:center; }
          .legend { flex-direction:row; gap:12px; }
        }
      </style>

      <div class="card">
        <div class="bg-art" aria-hidden="true"></div>

        <div class="stage">
          <canvas></canvas>
        </div>

      </div>
    `;

class BezierGraph extends HTMLElement {
    static get observedAttributes() {
        return ['p1', 'p2', 'width', 'height'];
    }

    constructor() {
        super();
        this._shadow = this.attachShadow({mode: 'open'});
        this._shadow.appendChild(template.content.cloneNode(true));

        this._canvas = this._shadow.querySelector('canvas');

        this._ctx = null;
        this._dpr = Math.max(window.devicePixelRatio || 1, 1);
        this._width = parseInt(this.getAttribute('width') || '350', 10);
        this._height = parseInt(this.getAttribute('height') || '350', 10);

        let p1 = this.getAttribute('P1').split(',');
        this._P1 = {x: parseInt(p1[0].trim()), y: parseInt(p1[1].trim())};
        let p2 = this.getAttribute('P2').split(',');
        this._P1 = {x: parseInt(p2[0].trim()), y: parseInt(p2[1].trim())};

        // bind
        this._onResize = this._onResize.bind(this);
        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);

        this._dragTarget = null;
    }

    connectedCallback() {
        // read initial attributes
        this._applyAttributes();

        // canvas sizing
        this._ctx = this._canvas.getContext('2d');
        this._resizeCanvas();

        // listeners
        window.addEventListener('resize', this._onResize);

        // interaction: drag control points
        this._canvas.addEventListener('pointerdown', this._onPointerDown);
        window.addEventListener('pointermove', this._onPointerMove);
        window.addEventListener('pointerup', this._onPointerUp);

        this._draw();
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this._onResize);

        this._canvas.removeEventListener('pointerdown', this._onPointerDown);
        window.removeEventListener('pointermove', this._onPointerMove);
        window.removeEventListener('pointerup', this._onPointerUp);
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === 'p1' || name === 'p2') this._applyAttributes();
        if (name === 'width' || name === 'height') {
            this._width = parseInt(this.getAttribute('width') || this._width, 10);
            this._height = parseInt(this.getAttribute('height') || this._height, 10);
            this._resizeCanvas();
        }
        this._draw();
    }

    _applyAttributes() {
        const p1Attr = (this.getAttribute('p1') || '0.3,0.2').split(',').map(x => parseFloat(x));
        const p2Attr = (this.getAttribute('p2') || '0.8,0.9').split(',').map(x => parseFloat(x));
        if (p1Attr.length >= 2 && !isNaN(p1Attr[0]) && !isNaN(p1Attr[1])) this._P1 = {
            x: this._clamp(p1Attr[0], 0, 1),
            y: this._clamp(p1Attr[1], 0, 1)
        };
        if (p2Attr.length >= 2 && !isNaN(p2Attr[0]) && !isNaN(p2Attr[1])) this._P2 = {
            x: this._clamp(p2Attr[0], 0, 1),
            y: this._clamp(p2Attr[1], 0, 1)
        };
    }

    _clamp(v, a, b) {
        return Math.min(Math.max(v, a), b);
    }

    _resizeCanvas() {
        const w = this._width;
        const h = this._height;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        this._canvas.width = Math.round(w * this._dpr);
        this._canvas.height = Math.round(h * this._dpr);
        this._ctx = this._canvas.getContext('2d');
        this._ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0); // work in CSS pixels
    }

    // cubic bezier (P0=(0,0), P1, P2, P3=(1,1))
    _bezier(t) {
        const P0 = {x: 0, y: 0}, P3 = {x: 1, y: 1};
        const p1 = this._P1, p2 = this._P2;
        const u = 1 - t;
        const uu = u * u, uuu = uu * u;
        const tt = t * t, ttt = tt * t;
        return {
            x: uuu * P0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * P3.x,
            y: uuu * P0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * P3.y
        };
    }

    _toPx(p) {
        // leave some margin for axes/labels
        const padL = 48, padR = 18, padT = 18, padB = 48;
        const w = this._canvas.width / this._dpr;
        const h = this._canvas.height / this._dpr;
        const innerW = w - padL - padR;
        const innerH = h - padT - padB;
        return {
            x: padL + p.x * innerW,
            y: padT + (1 - p.y) * innerH
        };
    }

    _drawGrid(ctx, w, h) {
        const padL = 48, padR = 18, padT = 18, padB = 48;
        const innerW = w - padL - padR;
        const innerH = h - padT - padB;
        ctx.save();
        ctx.translate(padL, padT);

        // background rect
        ctx.fillStyle = 'rgba(246,249,255,0.86)';
        ctx.fillRect(0, 0, innerW, innerH);

        // minor grid
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(15,23,42,0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const x = i / 10 * innerW;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, innerH);
        }
        for (let j = 0; j <= 10; j++) {
            const y = j / 10 * innerH;
            ctx.moveTo(0, y);
            ctx.lineTo(innerW, y);
        }
        ctx.stroke();

        // axes
        ctx.restore();

        // X axis label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px system-ui, Arial';
        ctx.fillText('Time', w / 2 - 12, h - 14);

        // Y axis label (vertical)
        ctx.save();
        ctx.translate(10, h / 2 + 12);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Progress', 0, 0);
        ctx.restore();

        // corners labels
        ctx.fillStyle = '#475569';
        ctx.font = '12px system-ui, Arial';
        ctx.fillText('(0,0)', 10, h - 6);
        ctx.fillText('(1,1)', w - 40, 18);
    }

    _draw() {
        if (!this._ctx) return;
        const ctx = this._ctx;
        const w = this._canvas.width / this._dpr;
        const h = this._canvas.height / this._dpr;

        // clear
        ctx.clearRect(0, 0, w, h);

        // grid + axes
        this._drawGrid(ctx, w, h);

        // draw linear (faint)
        ctx.save();
        ctx.beginPath();
        const pA = this._toPx({x: 0, y: 0});
        const pB = this._toPx({x: 1, y: 1});
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.strokeStyle = 'rgba(99,102,241,0.16)'; // pale indigo
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();

        // bezier curve
        ctx.save();
        ctx.beginPath();
        const steps = 320;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const p = this._bezier(t);
            const px = this._toPx(p);
            if (i === 0) ctx.moveTo(px.x, px.y);
            else ctx.lineTo(px.x, px.y);
        }
        ctx.strokeStyle = '#3367ff';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        // control points and lines
        ctx.save();
        const P0px = this._toPx({x: 0, y: 0});
        const P1px = this._toPx(this._P1);
        const P2px = this._toPx(this._P2);
        const P3px = this._toPx({x: 1, y: 1});

        // helper lines
        ctx.beginPath();
        ctx.moveTo(P0px.x, P0px.y);
        ctx.lineTo(P1px.x, P1px.y);
        ctx.lineTo(P2px.x, P2px.y);
        ctx.lineTo(P3px.x, P3px.y);
        ctx.strokeStyle = 'rgba(15,23,42,0.06)';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

        // points
        const drawDot = (pt, color) => {
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
        };
        drawDot(P1px, '#27ae60');
        drawDot(P2px, '#e63946');

        // small labels for control points
        ctx.fillStyle = '#0f172a';
        ctx.font = '11px system-ui, Arial';
        ctx.fillText(`P1 (${this._P1.x.toFixed(2)}, ${this._P1.y.toFixed(2)})`, P1px.x + 10, P1px.y - 8);
        ctx.fillText(`P2 (${this._P2.x.toFixed(2)}, ${this._P2.y.toFixed(2)})`, P2px.x + 10, P2px.y - 8);

        ctx.restore();
    }

    _onResize() {
        // try to keep provided width/height; support responsive when container changes
        this._resizeCanvas();
        this._draw();
    }

    _pointHitTest(mouse, ptPx, r = 10) {
        const dx = mouse.x - ptPx.x;
        const dy = mouse.y - ptPx.y;
        return dx * dx + dy * dy <= r * r;
    }

    _onPointerDown(e) {
        const rect = this._canvas.getBoundingClientRect();
        const mouse = {x: (e.clientX - rect.left), y: (e.clientY - rect.top)};
        const p1px = this._toPx(this._P1);
        const p2px = this._toPx(this._P2);
        if (this._pointHitTest(mouse, p1px, 12)) {
            this._dragTarget = 'p1';
            e.preventDefault();
            return;
        }
        if (this._pointHitTest(mouse, p2px, 12)) {
            this._dragTarget = 'p2';
            e.preventDefault();
            return;
        }
    }

    _onPointerMove(e) {
        if (!this._dragTarget) return;
        const rect = this._canvas.getBoundingClientRect();
        const x = this._clamp((e.clientX - rect.left - 48) / (rect.width - 48 - 18), 0, 1);
        const y = this._clamp(1 - (e.clientY - rect.top - 18) / (rect.height - 18 - 48), 0, 1);

        if (this._dragTarget === 'p1') {
            this._P1.x = x;
            this._P1.y = y;
            this.setAttribute('p1', `${this._P1.x.toFixed(3)},${this._P1.y.toFixed(3)}`);
        } else if (this._dragTarget === 'p2') {
            this._P2.x = x;
            this._P2.y = y;
            this.setAttribute('p2', `${this._P2.x.toFixed(3)},${this._P2.y.toFixed(3)}`);
        }
        this._draw();
    }

    _onPointerUp() {
        this._dragTarget = null;
    }
}

window.customElements.define('bezier-graph', BezierGraph);