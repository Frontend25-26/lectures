class CodeExample extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const htmlTemplate = this.querySelector('template[data-type="html"]');
        const cssTemplate = this.querySelector('template[data-type="css"]');
        const jsTemplate = this.querySelector('template[data-type="js"]');

        const html = htmlTemplate ? this.cleanTemplate(htmlTemplate.innerHTML) : '';
        const css = cssTemplate ? this.cleanTemplate(cssTemplate.innerHTML) : '';
        const js = jsTemplate ? this.cleanTemplate(jsTemplate.innerHTML) : '';

        const size = this.getAttribute('size') || 'm';
        const showPreview = !this.hasAttribute('no-preview');
        const isFragment = this.hasAttribute('fragment');

        const codeContainer = document.createElement('div');
        codeContainer.className = 'code-example';

        if (html && !htmlTemplate.hasAttribute('no-preview')) {
            const pre = document.createElement('pre');
            pre.className = `code-example-one html size-${ size } ${htmlTemplate.className}`;
            const code = document.createElement('code');
            code.textContent = html;
            pre.appendChild(code);
            codeContainer.appendChild(pre);
        }

        if (css && !cssTemplate.hasAttribute('no-preview')) {
            const pre = document.createElement('pre');
            pre.className = `code-example-one css size-${ size } ${cssTemplate.className}`;
            const code = document.createElement('code');
            code.textContent = css;
            pre.appendChild(code);
            codeContainer.appendChild(pre);
        }

        if (js && !jsTemplate.hasAttribute('no-preview')) {
            const pre = document.createElement('pre');
            pre.className = `code-example-one js size-${ size } ${jsTemplate.className}`;
            const code = document.createElement('code');
            code.textContent = js;
            pre.appendChild(code);
            codeContainer.appendChild(pre);
        }

        // Создаем превью в Shadow DOM
        if (showPreview) {
            const previewHost = document.createElement('div');
            previewHost.className = `${ isFragment ? 'fragment' : '' }`;

            const shadow = previewHost.attachShadow({ mode: 'open' });
            shadow.innerHTML = `
        <style>
          :host .code-example-result {
            display: block;
            border-radius: 6px;
            background: white;
            text-align: left;
            padding: 5px;
            margin-top: 16px;
          }
          ${ css }
        </style>
        <div class="code-example-result">${ html }</div>
        ${ js ? `<script>${ js }<\/script>` : '' }
      `;

            this.appendChild(previewHost);
        }

        this.insertBefore(codeContainer, this.firstChild);
    }

    cleanTemplate(content) {
        const lines = content.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return '';
        const minIndent = Math.min(...lines.map(line => line.match(/^\s*/)[0].length));
        return lines.map(line => line.slice(minIndent)).join('\n').trim();
    }
}

customElements.define('code-example', CodeExample);

const style = document.createElement('style');
style.textContent = `
  .code-example {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  pre.code-example-one {
    padding: 5px;
    background: rgba(150, 150, 150, 0.2);
    border-radius: 10px;   
  }
`;
document.head.appendChild(style);