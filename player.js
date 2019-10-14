var SIZE = 4096*4

module.exports = Player

function Player (opts) {
  var self = this
  if (!(self instanceof Player)) return new Player(opts)
  if (!opts) opts = {}
  self._canvas = document.createElement('canvas')
  self._canvas.width = SIZE/4
  self._canvas.height = 1
  self._gl = self._canvas.getContext('webgl2')
  if (!self._gl) throw new Error('unable to initialize webgl2')
  if (!self._gl.getExtension('EXT_color_buffer_float')) {
    throw new Error('failed to load extension EXT_color_buffer_float')
  }
  self._initFramebuffer()
  self._initBuffers()
  self.setSource(opts.source || `
    float sample (float t) { return 0.0 }
  `)
  self._context = new AudioContext
  self._sproc = self._context.createScriptProcessor(SIZE, 1, 1)
  self._sproc.onaudioprocess = function (ev) {
    var output = ev.outputBuffer.getChannelData(0)
    self._fill(output)
  }
  self.time = 0
}

Player.prototype._initFramebuffer = function () {
  this._fb = this._gl.createFramebuffer()
  this._fbtex = this._gl.createTexture()
}

Player.prototype._initBuffers = function () {
  this._buffers = {}
  this._buffers.position = this._gl.createBuffer()
  this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._buffers.position)
  this._gl.bufferData(
    this._gl.ARRAY_BUFFER,
    Float32Array.from([-4,-4,-4,+4,+4,+0]),
    this._gl.STATIC_DRAW
  )
  this._buffers.element = this._gl.createBuffer()
  this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._buffers.element)
  this._gl.bufferData(
    this._gl.ELEMENT_ARRAY_BUFFER,
    Uint16Array.from([0,1,2]),
    this._gl.STATIC_DRAW
  )
}

Player.prototype._fill = function (output) {
  this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._buffers.position)
  this._gl.vertexAttribPointer(
    this._attribLoc.position, 2, this._gl.FLOAT, false, 0, 0)
  this._gl.enableVertexAttribArray(this._attribLoc.position)

  this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._buffers.element)

  this._gl.useProgram(this._program)

  this._gl.uniform3f(this._uniformLoc._sampleInfo,
    this.time, this._context.sampleRate, SIZE)

  this._gl.bindTexture(this._gl.TEXTURE_2D, this._fbtex)
  this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA32F,
    SIZE/4, 1, 0, this._gl.RGBA, this._gl.FLOAT, new Float32Array(SIZE))

  this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._fb)
  this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER,
    this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_2D, this._fbtex, 0)

  var fbStatus = this._gl.checkFramebufferStatus(this._gl.FRAMEBUFFER)
  if (fbStatus !== this._gl.FRAMEBUFFER_COMPLETE) {
    throw new Error('frame buffer not complete')
  }

  this._gl.viewport(0, 0, SIZE/4, 1)
  this._gl.clearColor(1, 2, 3, 4)
  this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT)
  this._gl.drawElements(this._gl.TRIANGLES, 3, this._gl.UNSIGNED_SHORT, 0)

  this._gl.readBuffer(this._gl.COLOR_ATTACHMENT0)
  this._gl.readPixels(0, 0, SIZE/4, 1, this._gl.RGBA, this._gl.FLOAT, output, 0)

  this.time += SIZE / this._context.sampleRate
}

Player.prototype.play = function () {
  this._context.resume()
  this._sproc.connect(this._context.destination)
}

Player.prototype.pause = function () {
  this._sproc.disconnect()
}

Player.prototype.setSource = function (src) {
  var frag = this._gl.createShader(this._gl.FRAGMENT_SHADER)
  this._gl.shaderSource(frag, `
    #version 300 es
    precision highp float;
    uniform vec3 _sampleInfo; // time, rate, size
    in vec2 _vpos;
    out vec4 _sampleOutput;
    ${src}
    void main () {
      float x = _vpos.x*0.5+0.5;
      float dt = 1.0 / _sampleInfo.y;
      float s = _sampleInfo.z * dt;
      float t0 = _sampleInfo.x + s * x + dt * 0.0;
      float t1 = _sampleInfo.x + s * x + dt * 0.25;
      float t2 = _sampleInfo.x + s * x + dt * 0.5;
      float t3 = _sampleInfo.x + s * x + dt * 0.75;
      _sampleOutput = vec4(sound(t0),sound(t1),sound(t2),sound(t3));
    }
  `.trim())
  this._gl.compileShader(frag)
  if (!this._gl.getShaderParameter(frag, this._gl.COMPILE_STATUS)) {
    console.error('error in fragment shader: ' + this._gl.getShaderInfoLog(frag))
    this._gl.deleteShader(frag)
    return
  }
  var vert = this._gl.createShader(this._gl.VERTEX_SHADER)
  this._gl.shaderSource(vert, `
    #version 300 es
    precision highp float;
    in vec2 position;
    out vec2 _vpos;
    void main () {
      _vpos = position;
      gl_Position = vec4(position,0,1);
    }
  `.trim())
  this._gl.compileShader(vert)
  if (!this._gl.getShaderParameter(vert, this._gl.COMPILE_STATUS)) {
    console.error('error in vertex shader: ' + this._gl.getShaderInfoLog(vert))
    this._gl.deleteShader(vert)
    return
  }
  this._program = this._gl.createProgram()
  this._gl.attachShader(this._program, vert)
  this._gl.attachShader(this._program, frag)
  this._gl.linkProgram(this._program)
  if (!this._gl.getProgramParameter(this._program, this._gl.LINK_STATUS)) {
    console.log('linker error: ' + this._gl.getProgramInfoLog(this._program))
  }
  this._attribLoc = {
    position: this._gl.getAttribLocation(this._program, 'position')
  }
  this._uniformLoc = {
    _sampleInfo: this._gl.getUniformLocation(this._program, '_sampleInfo')
  }
}
