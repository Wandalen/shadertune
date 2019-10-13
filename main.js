var html = require('choo/html')
var app = require('choo')()
var css = require('./style.js')
var player = require('./player.js')
var { nextTick } = process

var svg = {
  play: () => html`<svg xmlns="https://www.w3.org/2000/svg"
    width="15" height="15"> <path style="fill:#f08;stroke:none;"
      d="M 0,0 0,15 15,7.5 z" /></svg>`,
  pause: () => html`<svg xmlns="https://www.w3.org/2000/svg"
    width="15" height="15"><path style="fill:#f08;stroke:none;"
      d="M 0,0 0,15 5,15 5,0 z M 10,0 10,15 15,15 15,0 z" /></svg>`
}

app.use(function (state, emitter) {
  state.code = `
    const float PI = ${Math.PI.toFixed(7)};

    float sample (float t) {
      return sin(t*2.0*PI*800.0)*0.8;
    }
  `.trim().replace(/\r?\n    /g,'\n')
  state.player = player({ source: state.code })
  state.playing = false
  emitter.on('play-toggle', function () {
    state.playing = !state.playing
    if (!state.playing) state.player.pause()
    else state.player.play()
    emitter.emit('render')
  })
  emitter.on('set-code', function (src) {
    if (src === state.code) return
    state.code = src
    emitter.emit('render')
    state.player.setSource(state.code)
  })
})

app.route('/', function (state, emit) {
  return html`<body>
    <style>${css}</style>
    <div id="topbar">
      <button class="play" onclick=${playToggle}>
        ${svg[state.playing ? 'pause' : 'play']()}
      </button>
      <div class="title">shadertune</div>
    </div>
    <div id="codebox">
      <textarea id="code" spellcheck="false" autocomplete="off"
      autocorrect="off" autocapitalize="off" oninput=${onCodeChange}
      >${state.code}</textarea>
    </div>
  </body>`
  function playToggle () { emit('play-toggle') }
  function onCodeChange (ev) {
    nextTick(function () {
      emit('set-code', ev.target.value)
    })
  }
})
app.mount(document.body)
