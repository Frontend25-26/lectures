const stepTemplate = document.createElement('template');
stepTemplate.innerHTML = `
  <style>
    :host { display:inline-block; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
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
    .bg-art { position:absolute; inset:12px; background-color: lightgray; opacity:0.12; pointer-events:none; filter: saturate(0.6) blur(0px);}
    .stage { position:relative; display:flex; gap:12px; }
    canvas {
      border-radius:8px;
      background: linear-gradient(180deg, rgba(245,247,255,0.8), rgba(250,251,255,0.9));
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
      display:block;
    }
  </style>
  <div class="card">
    <div class="bg-art" aria-hidden="true"></div>
    <div class="stage">
      <canvas></canvas>
    </div>
  </div>
`;

class StepGraph extends HTMLElement {
    static get observedAttributes() {
        return ['steps', 'step', 'width', 'height'];
    }

    constructor() {
        super();
        this._shadow = this.attachShadow({mode: 'open'});
        this._shadow.appendChild(stepTemplate.content.cloneNode(true));

        this._canvas = this._shadow.querySelector('canvas');
        this._ctx = null;
        this._dpr = Math.max(window.devicePixelRatio || 1, 1);
        this._width = parseInt(this.getAttribute('width') || '350');
        this._height = parseInt(this.getAttribute('height') || '350');

        this._steps = parseInt(this.getAttribute('steps') || 5, 10);
        this._stepPos = this.getAttribute('step') || 'middle';

        // bind
        this._onResize = this._onResize.bind(this);
    }

    connectedCallback() {
        this._ctx = this._canvas.getContext('2d');
        this._resizeCanvas();
        window.addEventListener('resize', this._onResize);
        this._draw();
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this._onResize);
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === 'steps') this._steps = parseInt(newVal || 5, 10);
        if (name === 'step') this._stepPos = newVal;
        if (name === 'width' || name === 'height') {
            this._width = parseInt(this.getAttribute('width') || this._width);
            this._height = parseInt(this.getAttribute('height') || this._height);
            this._resizeCanvas();
        }
        this._draw();
    }

    _resizeCanvas() {
        const w = this._width, h = this._height;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        this._canvas.width = Math.round(w * this._dpr);
        this._canvas.height = Math.round(h * this._dpr);
        this._ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    }

    _toPx(p) {
        const padL = 48, padR = 18, padT = 18, padB = 48;
        const innerW = this._canvas.width / this._dpr - padL - padR;
        const innerH = this._canvas.height / this._dpr - padT - padB;
        return {x: padL + p.x * innerW, y: padT + (1 - p.y) * innerH};
    }

    _drawGrid(ctx, w, h) {
        const padL = 48, padR = 18, padT = 18, padB = 48;
        const innerW = w - padL - padR, innerH = h - padT - padB;
        ctx.save();
        ctx.translate(padL, padT);
        ctx.fillStyle = 'rgba(246,249,255,0.86)';
        ctx.fillRect(0, 0, innerW, innerH);

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

        ctx.restore();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px system-ui, Arial';
        ctx.fillText('Time', w / 2 - 12, h - 14);
        ctx.save();
        ctx.translate(10, h / 2 + 12);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Progress', 0, 0);
        ctx.restore();
        ctx.fillStyle = '#475569';
        ctx.fillText('(0,0)', 10, h - 6);
        ctx.fillText('(1,1)', w - 40, 18);
    }

    _draw() {
        if (!this._ctx) return;

        const ctx = this._ctx;
        const w = this._canvas.width / this._dpr;
        const h = this._canvas.height / this._dpr;

        ctx.clearRect(0, 0, w, h);
        this._drawGrid(ctx, w, h);

        // linear reference line
        ctx.save();
        ctx.strokeStyle = 'rgba(99,102,241,0.16)';
        ctx.lineWidth = 3;
        let p0 = this._toPx({x: 0, y: 0});
        let p1 = this._toPx({x: 1, y: 1});
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
        ctx.restore();

        const n = this._steps;

        let points = []; // массив {x, y}

        points.push({x: 0, y: 0});

        if (this._stepPos === 'start') {
            for (let i = 0; i < n; i++) {
                let x = i / n;
                let y = (i + 1) / n;
                points.push({x, y});
            }
        } else if (this._stepPos === 'end') {
            for (let i = 0; i < n; i++) {
                let x = i / n;
                let y = i / n;
                points.push({x, y});
            }

        } else if (this._stepPos === 'middle' || this._stepPos === 'none') {
            points.push({x: 0.5 / n, y: 0})
            for (let i = 0; i < n - 1; i++) {
                let x = points.at(-1).x + 1 / n;
                let y = points.at(-1).y + 1 / (n - 1);
                points.push({x, y});
            }
        } else if (this._stepPos === 'both') {
            points.push({x: 0, y: 1 / (n + 1)})
            points.push({x: 0.5 / n, y: 2 / (n + 1)})
            for (let i = 0; i < n - 1; i++) {
                let x = points.at(-1).x + 1 / n;
                let y = points.at(-1).y + 1 / (n + 1);
                points.push({x, y});
            }
        }

        points.push({x: 1, y: 1});

        //
        // Рисуем ступень
        //
        console.log("%c 1 --> Line: 269||step-graph.js\n this._stepPos: " +
            "", "color:#f0f;", this._stepPos);
        console.log("%c 2 --> Line: 271||step-graph.js\n points: ", "color:#0f0;", points);
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = '#3367ff';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // старт
        let pStart = this._toPx(points[0]);
        ctx.moveTo(pStart.x, pStart.y);

        for (let i = 1; i < points.length; i++) {

            // горизонтальная линия
            let pA = this._toPx({x: points[i].x, y: points[i - 1].y});
            ctx.lineTo(pA.x, pA.y);

            // вертикальный скачок (если уровень изменился)
            let pB = this._toPx(points[i]);
            ctx.lineTo(pB.x, pB.y);
        }

        ctx.stroke();
        ctx.restore();
    }


    _onResize() {
        this._resizeCanvas();
        this._draw();
    }
}

window.customElements.define('step-graph', StepGraph);
