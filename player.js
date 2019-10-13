var regl = require('regl')
var SIZE = 4096*4

module.exports = Player

function Player (opts) {
  var self = this
  if (!(self instanceof Player)) return new Player(opts)
  if (!opts) opts = {}
  self._regl = regl({
    extensions: [ 'oes_texture_float', 'webgl_color_buffer_float' ]
  })
  window.regl = self._regl
  self._fb = self._regl.framebuffer()
  self._draw = self._createDraw(opts.source || `
    float sample (float t) { return 0.0 }
  `)
  self._context = new AudioContext
  self._sproc = self._context.createScriptProcessor(SIZE, 1, 1)
  self._sproc.onaudioprocess = function (ev) {
    var output = ev.outputBuffer.getChannelData(0)
    //var input = ev.inputBuffer.getChannelData(0)
    self._fill(output)
  }
  self.time = 0
}

Player.prototype._fill = function (output) {
  var self = this
  self._fb({
    data: output,
    colorType: 'float',
    width: SIZE/4,
    height: 1
  })
  self._fb.use(function () {
    self._draw()
    self._regl.read({
      framebuffer: self._fb,
      data: output
    })
  })
  self.time += SIZE / self._context.sampleRate
}

Player.prototype._createDraw = function (src) {
  var self = this
  return self._regl({
    frag: `
      precision highp float;
      uniform float _time, _sampleRate, _sampleSize;
      varying vec2 _vpos;
      ${src}
      void main () {
        float x = _vpos.x*0.5+0.5;
        float dt = 1.0 / _sampleRate;
        float s = _sampleSize * dt;
        float t0 = _time + s * x + dt * 0.0;
        float t1 = _time + s * x + dt * 0.25;
        float t2 = _time + s * x + dt * 0.5;
        float t3 = _time + s * x + dt * 0.75;
        gl_FragColor = vec4(sample(t0),sample(t1),sample(t2),sample(t3));
      }
    `,
    vert: `
      precision highp float;
      attribute vec2 position;
      varying vec2 _vpos;
      void main () {
        _vpos = position;
        gl_Position = vec4(position,0,1);
      }
    `,
    attributes: {
      position: [-4,-4,-4,+4,+4,0]
    },
    elements: [[0,1,2]],
    uniforms: {
      _time: function () { return self.time },
      _sampleRate: function () { return self._context.sampleRate },
      _sampleSize: SIZE
    },
    framebuffer: self._fb
  })
}

Player.prototype.play = function () {
  this._context.resume()
  this._sproc.connect(this._context.destination)
}

Player.prototype.pause = function () {
  this._sproc.disconnect()
}

Player.prototype.setSource = function (src) {
  this._draw = this._createDraw(src)
}
