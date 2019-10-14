var html = require('choo/html')

module.exports = (opts) => {
  if (!opts) opts = {}
  return html`<label
    class="toggle-switch ${opts.class || ''}"
    title=${opts.title || ''}
  >
    <input type="checkbox"
      ${opts.value ? { checked: 'checked' } : {}}
      ${opts.onchange ? { onchange: opts.onchange } : {}}>
    <span class="slider"></span>
  </label>`
}
