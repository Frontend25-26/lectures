class TransitionTimingFunctionSlide extends HTMLElement {
    constructor() {
        super();
        const timingName = this.getAttribute('name');
        const [x1, y1, x2, y2] = this.getAttribute('bezier').split(',').map(i => Number(i.trim()))

        // Вставляем HTML
        this.innerHTML = `
                <pre class="code-example-one fragment size-l"><code>${timingName} == cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})</code></pre>
                <bezier-graph P1="${x1}, ${y1}" P2="${x2}, ${y2}" class="fragment"></bezier-graph>
                <code-example fragment>
                    <template data-type="html" no-preview>
                        <div class="animated linear">linear</div>
                        <div class="animated">${timingName}</div>
                    </template>
                    <template data-type="css" no-preview>
                        * {
                            box-sizing: border-box;
                        }
                        .animated {
                            transition: width 2s ${timingName};
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

                        .code-example-result:hover  .animated {
                            width: 90%;
                        }
                    </template>
                </code-example>
        `;
    }
}

// Регистрируем веб-компонент
customElements.define('transition-timing-function-slide', TransitionTimingFunctionSlide);
