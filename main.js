var html = require('choo/html')
var app = require('choo')()
var css = require('./style.js')
var player = require('./player.js')
var toggleSwitch = require('./ui/toggle-switch')

var svg = {
  play: () => html`<svg xmlns="https://www.w3.org/2000/svg"
    width="15" height="15"><path style="fill:#f08;stroke:none;"
      d="M 0,0 0,15 15,7.5 z" /></svg>`,
  pause: () => html`<svg xmlns="https://www.w3.org/2000/svg"
    width="15" height="15"><path style="fill:#f08;stroke:none;"
      d="M 0,0 0,15 5,15 5,0 z M 10,0 10,15 15,15 15,0 z" /></svg>`,
  settings: (() => {
    var points = [], n0 = 10, n1 = 8, r0 = 10.5, r1 = 14, r2 = 2
    for (var i = 0; i < n0; i++) {
      var t0 = i/n0*2*Math.PI, t1 = (i+0.15)/n0*2*Math.PI
      var t2 = (i+0.45)/n0*2*Math.PI, t3 = (i+0.6)/n0*2*Math.PI
      points.push(
        [Math.cos(t0)*r0+r1,Math.sin(t0)*r0+r1],
        [Math.cos(t1)*r1+r1,Math.sin(t1)*r1+r1],
        [Math.cos(t2)*r1+r1,Math.sin(t2)*r1+r1],
        [Math.cos(t3)*r0+r1,Math.sin(t3)*r0+r1]
      )
    }
    points.push('z M')
    for (var i = 0; i < n1; i++) {
      var t = -i/n1*2*Math.PI
      points.push([Math.cos(t)*r2+r1,Math.sin(t)*r2+r1])
    }
    return () => html`<svg xmlns="https://www.w3.org/2000/svg"
      width="${r1*2}" height="${r1*2}"><path
        d="M ${points.join(' ')} z" /></svg>`
  })()
}

app.use(function (state, emitter) {
  state.hotkeys = {
    play: { ctrlKey: true, code: 'Space' },
    'live-updates': { ctrlKey: true, code: 'KeyU' },
    'show-settings': { ctrlKey: true, code: 'Period' }
  }
  hotkeyUpdate()
  emitter.on('set-hotkey', setHotkey)
  function setHotkey (name, props) {
    state.hotkeys[name] = props
    hotkeyUpdate()
  }
  function hotkeyUpdate () {
    state.hotkeyKeys = Object.keys(state.hotkeys)
    state.hotkeyKeyKeys = {}
    for (var i = 0; i < state.hotkeyKeys.length; i++) {
      var key = state.hotkeyKeys[i]
      state.hotkeyKeyKeys[key] = Object.keys(state.hotkeys[key])
    }
  }
  window.addEventListener('keydown', function (ev) {
    for (var i = 0; i < state.hotkeyKeys.length; i++) {
      var key = state.hotkeyKeys[i]
      var match = true
      for (var j = 0; j < state.hotkeyKeyKeys[key].length; j++) {
        var k = state.hotkeyKeyKeys[key][j]
        if (ev[k] !== state.hotkeys[key][k]) {
          match = false
          break
        }
      }
      if (match) {
        ev.preventDefault()
        emitter.emit('toggle-' + key)
        return
      }
    }
  })
})

app.use(function (state, emitter) {
  state.code = `
    const float PI = ${Math.PI.toFixed(7)};

    float sound (float t) {
      return sin(t*2.0*PI*800.0)*0.8;
    }
  `.trim().replace(/\r?\n    /g,'\n')
  state.player = player({ source: state.code })
  state.playing = false
  state.liveUpdates = true
  state.showSettings = false
  state.showHotkey = null
  emitter.on('open-hotkey', function (name) {
    state.showHotkey = name
    emitter.emit('render')
  })
  emitter.on('close-hotkey', function () {
    state.showHotkey = null
    emitter.emit('render')
  })

  emitter.on('toggle-play', function () {
    state.playing = !state.playing
    if (!state.playing) state.player.pause()
    else state.player.play()
    emitter.emit('render')
  })
  emitter.on('toggle-live-updates', function () {
    state.liveUpdates = !state.liveUpdates
    emitter.emit('render')
    if (state.liveUpdates) {
      state.player.setSource(state.code)
    }
  })
  emitter.on('toggle-show-settings', function () {
    state.showSettings = !state.showSettings
    emitter.emit('render')
  })
  emitter.on('set-code', function (src) {
    if (src === state.code) return
    state.code = src
    if (state.liveUpdates) {
      emitter.emit('render')
      state.player.setSource(state.code)
    }
  })
})

app.route('*', function (state, emit) {
  return html`<body>
    <style>${css}</style>
    <div id="topbar">
      <button class="play" onclick=${playToggle} title="[ctrl+space]">
        ${svg[state.playing ? 'pause' : 'play']()}
      </button>
      <div class="title">shadertune</div>
      <label class="settings" title="[ctrl+.]">
        <input type="checkbox" class="settings" onchange=${settingsToggle}
          ${state.showSettings ? { checked: 'checked' } : {}}>
        ${svg.settings()}
      </label>
      ${toggleSwitch({
        value: state.liveUpdates,
        class: 'live',
        title: `live updates are ${state.liveUpdates ? 'ON' : 'OFF'}. [ctrl+u]`,
        onchange: liveUpdateToggle
      })}
    </div>
    <div id="codebox">
      <textarea id="code" spellcheck="false" autocomplete="off"
      autocorrect="off" autocapitalize="off" oninput=${onCodeChange}
      >${state.code}</textarea>
    </div>
    ${showSettings(state, emit)}
    ${showHotkeys(state, emit)}
  </body>`
  function playToggle () { emit('toggle-play') }
  function liveUpdateToggle () { emit('toggle-live-updates') }
  function settingsToggle () { emit('toggle-show-settings') }
  function onCodeChange (ev) { emit('set-code', ev.target.value) }
})
app.mount(document.body)

function showHotkeys (state, emit) {
  return html`<div id="hotkey" class=${state.showHotkey ? 'show' : ''}>
    <div class="content ${state.showHotkey ? 'show' : ''}">
      <h1>hotkey for ${state.showHotkey}</h1>
      <button>ctrl</button>
      <button>shift</button>
      <button>alt</button>
      <button>meta</button>
      <hr>
      <button>space</button>
      <button>\`</button>
      <button>-</button>
      <button>=</button>
      <button>[</button>
      <button>]</button>
      <button>\\</button>
      <button>;</button>
      <button>'</button>
      <button>,</button>
      <button>.</button>
      <button>/</button>
      <hr>
      <button>0</button>
      <button>1</button>
      <button>2</button>
      <button>3</button>
      <button>4</button>
      <button>5</button>
      <button>6</button>
      <button>7</button>
      <button>8</button>
      <button>9</button>
      <hr>
      <button>A</button>
      <button>B</button>
      <button>C</button>
      <button>D</button>
      <button>E</button>
      <button>F</button>
      <button>G</button>
      <button>H</button>
      <button>I</button>
      <button>J</button>
      <button>K</button>
      <button>L</button>
      <button>M</button>
      <button>N</button>
      <button>O</button>
      <button>P</button>
      <button>Q</button>
      <button>R</button>
      <button>S</button>
      <button>T</button>
      <button>U</button>
      <button>V</button>
      <button>W</button>
      <button>X</button>
      <button>Y</button>
      <button>Z</button>
      <hr>
      <button onclick=${close}>close</button>
    </div>
  </div>`
  function close () { emit('close-hotkey') }
}

function showSettings (state, emit) {
  var tabs = { tabindex: state.showSettings ? '0' : '-1' }
  return html`<div id="settings" class="${state.showSettings ? 'show' : ''}
      ${state.showHotkey ? '' : 'active'}"
    >
    <div class="content ${state.showSettings ? 'show' : ''}">
      <h1>settings</h1>
      <table>
        <tr>
          <th>toggle play/pause</th>
          <td>
            <button onclick=${openKey('play')} ${tabs}>
              [ctrl+space]
            </button>
          </td>
        </tr>
        <tr>
          <th>toggle live updates</th>
          <td>
            <button onclick=${openKey('live-updates')} ${tabs}>
              [ctrl+u]
            </button>
          </td>
        </tr>
        <tr>
          <th>toggle settings view</th>
          <td>
            <button onclick=${openKey('show-settings')} ${tabs}>
              [ctrl+.]
            </button>
          </td>
        </tr>
      </table>
    </div>
  </div>`

  function openKey (name) {
    return function () { emit('open-hotkey', name) }
  }
}
