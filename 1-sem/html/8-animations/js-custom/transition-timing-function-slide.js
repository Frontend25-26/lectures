const stepNameMap = {
    start: 'jump-start',
    end: 'jump-end',
    middle: 'jump-none',
    both: 'jump-both',
}

class TransitionTimingFunctionSlide extends HTMLElement {
    constructor() {
        super();

        const timingName = this.getAttribute('name');
        const bezierAttr = this.getAttribute('bezier');
        const steps = this.getAttribute('steps');
        const stepPos = this.getAttribute('step');

        let P1, P2, functionCss, codeText;

        if (bezierAttr) {
            // Если задана кривая Безье
            const [x1, y1, x2, y2] = this.getAttribute('bezier').split(',').map(i => Number(i.trim()))
            functionCss = `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
            P1 = `${x1},${y1}`;
            P2 = `${x2},${y2}`;
            codeText = `${timingName} == ${functionCss}`;
        } else if (steps && stepPos) {
            // Если заданы шаги
            const n = Number(steps);
            functionCss = `steps(${n}, ${stepNameMap[stepPos]})`;
            P1 = P2 = ''; // Не нужен график Безье
            codeText = functionCss;
        } else {
            functionCss = 'linear';
            codeText = 'linear';
        }


        // Вставляем HTML
        this.innerHTML = `
            <pre class="code-example-one fragment size-l css"><code>${codeText}</code></pre>
            ${this.innerText.trim() ? `<p class="fragment" style="font-size: 20px; text-align: center; margin-bottom: 0;">${this.innerText}</p>` : ''}
            ${bezierAttr ? `<bezier-graph P1="${P1}" P2="${P2}" class="fragment"></bezier-graph>` : ''}
            ${steps && stepPos ? `<step-graph steps="${steps}" step="${stepPos}" class="fragment" width="300" height="300"></step-graph>` : ''}
            <code-example fragment>
                <template data-type="html" no-preview>
                    <div class="animated linear">linear</div>
                    <div class="animated">${stepNameMap[stepPos] || timingName}</div>
                </template>
                <template data-type="css" no-preview>
                    * { box-sizing: border-box; }
                    .animated {
                        transition: width 2s ${functionCss};
                        background: fuchsia;
                        width: 15%;
                        margin: 10px;
                        padding: 10px;
                        border-radius: 10px;
                    }
                    .linear {
                        background: cornflowerblue;
                        transition-timing-function: linear;
                    }
                    .code-example-result:hover .animated {
                        width: 90%;
                    }
                </template>
            </code-example>
        `;
    }
}

// Регистрируем веб-компонент
customElements.define('transition-timing-function-slide', TransitionTimingFunctionSlide);
