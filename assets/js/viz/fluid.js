/*!
 * Fluid card visualization adapted from "WebGL Fluid Simulation" by Pavel Dobryakov
 * https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
 *
 * MIT License
 *
 * Copyright (c) 2017 Pavel Dobryakov
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Modifications (Manuel Caipo): scoped to a card canvas; bloom, sunrays, GUI and
 * analytics removed; turquoise/blue palette; autonomous emitters; iso-line shading;
 * NaN/overflow probe with automatic reset; pause when off-screen.
 */
(function () {
  'use strict';

  var DPR_MAX = 1.5;
  var FRAME_MS = 1000 / 30;
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var small = Math.min(window.screen.width, window.screen.height) < 768;

  var config = {
    SIM_RESOLUTION: small ? 64 : 112,
    DYE_RESOLUTION: small ? 320 : 640,
    DENSITY_DISSIPATION: 0.6,
    VELOCITY_DISSIPATION: 0.45,
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: small ? 12 : 18,
    CURL: 6,
    SPLAT_RADIUS: 0.22,
    EMIT_RADIUS: 0.1,
    SPLAT_FORCE: 2600,
    EMIT_FORCE: 600,
    BACK: [7 / 255, 13 / 255, 20 / 255]
  };

  // #38D9E6, #4285F4 and a pale cyan
  var PALETTE = [[0.22, 0.85, 0.9], [0.26, 0.52, 0.96], [0.5, 0.9, 0.97]];

  var BASE_VERT = [
    'precision highp float;',
    'attribute vec2 aPosition;',
    'varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;',
    'uniform vec2 texelSize;',
    'void main () {',
    '  vUv = aPosition * 0.5 + 0.5;',
    '  vL = vUv - vec2(texelSize.x, 0.0); vR = vUv + vec2(texelSize.x, 0.0);',
    '  vT = vUv + vec2(0.0, texelSize.y); vB = vUv - vec2(0.0, texelSize.y);',
    '  gl_Position = vec4(aPosition, 0.0, 1.0);',
    '}'
  ].join('\n');

  var CLEAR_FRAG = [
    'precision mediump float; precision mediump sampler2D;',
    'varying highp vec2 vUv; uniform sampler2D uTexture; uniform float value;',
    'void main () { gl_FragColor = value * texture2D(uTexture, vUv); }'
  ].join('\n');

  var SPLAT_FRAG = [
    'precision highp float; precision highp sampler2D;',
    'varying vec2 vUv; uniform sampler2D uTarget; uniform float aspectRatio;',
    'uniform vec3 color; uniform vec2 point; uniform float radius;',
    'void main () {',
    '  vec2 p = vUv - point.xy; p.x *= aspectRatio;',
    '  vec3 splat = exp(-dot(p, p) / radius) * color;',
    '  gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + splat, 1.0);',
    '}'
  ].join('\n');

  var ADVECTION_FRAG = [
    'precision highp float; precision highp sampler2D;',
    'varying vec2 vUv; uniform sampler2D uVelocity; uniform sampler2D uSource;',
    'uniform vec2 texelSize; uniform vec2 dyeTexelSize; uniform float dt; uniform float dissipation;',
    'vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {',
    '  vec2 st = uv / tsize - 0.5; vec2 iuv = floor(st); vec2 fuv = fract(st);',
    '  vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);',
    '  vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);',
    '  vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);',
    '  vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);',
    '  return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);',
    '}',
    'void main () {',
    '#ifdef MANUAL_FILTERING',
    '  vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;',
    '  vec4 result = bilerp(uSource, coord, dyeTexelSize);',
    '#else',
    '  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;',
    '  vec4 result = texture2D(uSource, coord);',
    '#endif',
    '  gl_FragColor = result / (1.0 + dissipation * dt);',
    '}'
  ].join('\n');

  var DIVERGENCE_FRAG = [
    'precision mediump float; precision mediump sampler2D;',
    'varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;',
    'uniform sampler2D uVelocity;',
    'void main () {',
    '  float L = texture2D(uVelocity, vL).x; float R = texture2D(uVelocity, vR).x;',
    '  float T = texture2D(uVelocity, vT).y; float B = texture2D(uVelocity, vB).y;',
    '  vec2 C = texture2D(uVelocity, vUv).xy;',
    '  if (vL.x < 0.0) { L = -C.x; } if (vR.x > 1.0) { R = -C.x; }',
    '  if (vT.y > 1.0) { T = -C.y; } if (vB.y < 0.0) { B = -C.y; }',
    '  gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);',
    '}'
  ].join('\n');

  var CURL_FRAG = [
    'precision mediump float; precision mediump sampler2D;',
    'varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;',
    'uniform sampler2D uVelocity;',
    'void main () {',
    '  float L = texture2D(uVelocity, vL).y; float R = texture2D(uVelocity, vR).y;',
    '  float T = texture2D(uVelocity, vT).x; float B = texture2D(uVelocity, vB).x;',
    '  gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);',
    '}'
  ].join('\n');

  var VORTICITY_FRAG = [
    'precision highp float; precision highp sampler2D;',
    'varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;',
    'uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt;',
    'void main () {',
    '  float L = texture2D(uCurl, vL).x; float R = texture2D(uCurl, vR).x;',
    '  float T = texture2D(uCurl, vT).x; float B = texture2D(uCurl, vB).x;',
    '  float C = texture2D(uCurl, vUv).x;',
    '  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));',
    '  force /= length(force) + 0.0001; force *= curl * C; force.y *= -1.0;',
    '  vec2 velocity = texture2D(uVelocity, vUv).xy + force * dt;',
    '  gl_FragColor = vec4(clamp(velocity, -1000.0, 1000.0), 0.0, 1.0);',
    '}'
  ].join('\n');

  var PRESSURE_FRAG = [
    'precision mediump float; precision mediump sampler2D;',
    'varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;',
    'uniform sampler2D uPressure; uniform sampler2D uDivergence;',
    'void main () {',
    '  float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x;',
    '  float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x;',
    '  float divergence = texture2D(uDivergence, vUv).x;',
    '  gl_FragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);',
    '}'
  ].join('\n');

  var GRADIENT_SUBTRACT_FRAG = [
    'precision mediump float; precision mediump sampler2D;',
    'varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;',
    'uniform sampler2D uPressure; uniform sampler2D uVelocity;',
    'void main () {',
    '  float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x;',
    '  float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x;',
    '  vec2 velocity = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);',
    '  gl_FragColor = vec4(velocity, 0.0, 1.0);',
    '}'
  ].join('\n');

  // Shading from the original display pass, plus faint iso-lines of dye concentration and a soft tone map
  var DISPLAY_FRAG = [
    'precision highp float; precision highp sampler2D;',
    'varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;',
    'uniform sampler2D uTexture; uniform vec2 texelSize; uniform vec3 back;',
    'void main () {',
    '  vec3 c = texture2D(uTexture, vUv).rgb;',
    '  float dx = length(texture2D(uTexture, vR).rgb) - length(texture2D(uTexture, vL).rgb);',
    '  float dy = length(texture2D(uTexture, vT).rgb) - length(texture2D(uTexture, vB).rgb);',
    '  vec3 n = normalize(vec3(dx, dy, length(texelSize)));',
    '  c *= clamp(dot(n, vec3(0.0, 0.0, 1.0)) + 0.7, 0.7, 1.0);',
    '  float s = length(c);',
    '  float band = abs(fract(s * 4.0) - 0.5);',
    '  float iso = smoothstep(0.40, 0.5, band) * smoothstep(0.03, 0.2, s);',
    '  c += iso * 0.07 * vec3(0.75, 0.97, 1.0);',
    '  c = 1.0 - exp(-c * 1.6);',
    '  gl_FragColor = vec4(back + c * (1.0 - back), 1.0);',
    '}'
  ].join('\n');

  // Samples a coarse grid and writes 1.0 when it finds NaN or near-saturated values
  var PROBE_FRAG = [
    'precision highp float; precision highp sampler2D;',
    'uniform sampler2D uVelocity; uniform sampler2D uDye;',
    'void main () {',
    '  float bad = 0.0;',
    '  for (int i = 0; i < 5; i++) {',
    '    for (int j = 0; j < 5; j++) {',
    '      vec2 uv = (vec2(float(i), float(j)) + 0.5) / 5.0;',
    '      vec2 v = texture2D(uVelocity, uv).xy; vec3 d = texture2D(uDye, uv).rgb;',
    '      if (!(v.x == v.x) || !(v.y == v.y) || !(d.r == d.r)) bad = 1.0;',
    '      if (max(abs(v.x), abs(v.y)) > 900.0 || d.r + d.g + d.b > 60.0) bad = 1.0;',
    '    }',
    '  }',
    '  gl_FragColor = vec4(bad, 0.0, 0.0, 1.0);',
    '}'
  ].join('\n');

  function supportRenderTextureFormat(gl, internalFormat, format, type) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(texture);
    return ok;
  }

  function getSupportedFormat(gl, internalFormat, format, type) {
    if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
      if (internalFormat === gl.R16F) return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
      if (internalFormat === gl.RG16F) return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
      return null;
    }
    return { internalFormat: internalFormat, format: format };
  }

  function getWebGLContext(canvas) {
    var params = { alpha: false, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false, powerPreference: 'low-power' };
    var gl = canvas.getContext('webgl2', params);
    var isWebGL2 = !!gl;
    if (!gl) gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);
    if (!gl) return null;

    var halfFloat, linear;
    if (isWebGL2) {
      gl.getExtension('EXT_color_buffer_float');
      linear = gl.getExtension('OES_texture_float_linear');
    } else {
      halfFloat = gl.getExtension('OES_texture_half_float');
      linear = gl.getExtension('OES_texture_half_float_linear');
      if (!halfFloat) return null;
    }
    var type = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
    var rgba, rg, r;
    if (isWebGL2) {
      rgba = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
      rg = getSupportedFormat(gl, gl.RG16F, gl.RG, type);
      r = getSupportedFormat(gl, gl.R16F, gl.RED, type);
    } else {
      rgba = rg = r = getSupportedFormat(gl, gl.RGBA, gl.RGBA, type);
    }
    if (!rgba || !rg || !r) return null;
    return { gl: gl, ext: { rgba: rgba, rg: rg, r: r, type: type, linear: !!linear } };
  }

  function init(stage) {
    var canvas = stage.querySelector('canvas');
    if (!canvas) return;
    var ctx = getWebGLContext(canvas);
    if (!ctx) return; // CSS fallback stays visible
    var gl = ctx.gl, ext = ctx.ext;

    var P = {}, owned = [], dye, velocity, divergence, curl, pressure, probe;
    var raf = 0, last = 0, visible = false, lost = false;
    var simTime = Math.random() * 100, probeTimer = 0, puffTimer = 3;
    var pointer = { x: 0, y: 0, dx: 0, dy: 0, inside: false, moved: false };
    var emitters = [0, 1].map(function (i) {
      return {
        sign: i ? -1 : 1,
        a: 0.21 + Math.random() * 0.08,
        b: 0.29 + Math.random() * 0.08,
        c: 0.11 + Math.random() * 0.05,
        p: Math.random() * 6.283,
        q: Math.random() * 6.283,
        color: PALETTE[i],
        pos: null
      };
    });

    function compileShader(type, source, keywords) {
      if (keywords) source = keywords.map(function (k) { return '#define ' + k + '\n'; }).join('') + source;
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) console.warn(gl.getShaderInfoLog(shader));
      return shader;
    }

    function createProgram(vs, fsSource, keywords) {
      var program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSource, keywords));
      gl.bindAttribLocation(program, 0, 'aPosition');
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        if (!gl.isContextLost()) console.warn(gl.getProgramInfoLog(program));
        return null;
      }
      var uniforms = {};
      var count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (var i = 0; i < count; i++) {
        var name = gl.getActiveUniform(program, i).name;
        uniforms[name] = gl.getUniformLocation(program, name);
      }
      return { program: program, uniforms: uniforms, bind: function () { gl.useProgram(program); } };
    }

    function createFBO(w, h, internalFormat, format, type, param) {
      gl.activeTexture(gl.TEXTURE0);
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
      var fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      owned.push(texture, fbo);
      return {
        fbo: fbo, width: w, height: h, texelSizeX: 1 / w, texelSizeY: 1 / h,
        attach: function (id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, texture); return id; }
      };
    }

    function createDoubleFBO(w, h, internalFormat, format, type, param) {
      var a = createFBO(w, h, internalFormat, format, type, param);
      var b = createFBO(w, h, internalFormat, format, type, param);
      return {
        width: w, height: h, texelSizeX: a.texelSizeX, texelSizeY: a.texelSizeY,
        get read() { return a; },
        get write() { return b; },
        swap: function () { var t = a; a = b; b = t; }
      };
    }

    function freeFramebuffers() {
      owned.forEach(function (o) {
        if (o instanceof WebGLTexture) gl.deleteTexture(o); else gl.deleteFramebuffer(o);
      });
      owned = [];
    }

    function getResolution(resolution) {
      var aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      if (aspect < 1) aspect = 1 / aspect;
      var min = Math.round(resolution), max = Math.round(resolution * aspect);
      return gl.drawingBufferWidth > gl.drawingBufferHeight ? { width: max, height: min } : { width: min, height: max };
    }

    function initFramebuffers() {
      freeFramebuffers();
      var simRes = getResolution(config.SIM_RESOLUTION);
      var dyeRes = getResolution(config.DYE_RESOLUTION);
      var filtering = ext.linear ? gl.LINEAR : gl.NEAREST;
      gl.disable(gl.BLEND);
      gl.clearColor(0, 0, 0, 1);
      dye = createDoubleFBO(dyeRes.width, dyeRes.height, ext.rgba.internalFormat, ext.rgba.format, ext.type, filtering);
      velocity = createDoubleFBO(simRes.width, simRes.height, ext.rg.internalFormat, ext.rg.format, ext.type, filtering);
      divergence = createFBO(simRes.width, simRes.height, ext.r.internalFormat, ext.r.format, ext.type, gl.NEAREST);
      curl = createFBO(simRes.width, simRes.height, ext.r.internalFormat, ext.r.format, ext.type, gl.NEAREST);
      pressure = createDoubleFBO(simRes.width, simRes.height, ext.r.internalFormat, ext.r.format, ext.type, gl.NEAREST);
      probe = createFBO(1, 1, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST);
    }

    function blit(target) {
      if (target == null) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    function setup() {
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);

      var vs = compileShader(gl.VERTEX_SHADER, BASE_VERT);
      P.clear = createProgram(vs, CLEAR_FRAG);
      P.splat = createProgram(vs, SPLAT_FRAG);
      P.advection = createProgram(vs, ADVECTION_FRAG, ext.linear ? null : ['MANUAL_FILTERING']);
      P.divergence = createProgram(vs, DIVERGENCE_FRAG);
      P.curl = createProgram(vs, CURL_FRAG);
      P.vorticity = createProgram(vs, VORTICITY_FRAG);
      P.pressure = createProgram(vs, PRESSURE_FRAG);
      P.gradientSubtract = createProgram(vs, GRADIENT_SUBTRACT_FRAG);
      P.display = createProgram(vs, DISPLAY_FRAG);
      P.probe = createProgram(vs, PROBE_FRAG);
      for (var k in P) if (!P[k]) return false;

      resizeCanvas();
      initFramebuffers();
      seed();
      return true;
    }

    function resizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
      var w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      var h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width === w && canvas.height === h) return false;
      canvas.width = w;
      canvas.height = h;
      return true;
    }

    function correctRadius(radius) {
      var aspect = canvas.width / canvas.height;
      return aspect > 1 ? radius * aspect : radius;
    }

    function splat(x, y, dx, dy, color, radius) {
      P.splat.bind();
      gl.uniform1i(P.splat.uniforms.uTarget, velocity.read.attach(0));
      gl.uniform1f(P.splat.uniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(P.splat.uniforms.point, x, y);
      gl.uniform3f(P.splat.uniforms.color, dx, dy, 0);
      gl.uniform1f(P.splat.uniforms.radius, correctRadius((radius || config.SPLAT_RADIUS) / 100));
      blit(velocity.write);
      velocity.swap();

      gl.uniform1i(P.splat.uniforms.uTarget, dye.read.attach(0));
      gl.uniform3f(P.splat.uniforms.color, color[0], color[1], color[2]);
      blit(dye.write);
      dye.swap();
    }

    function scaled(c, k) { return [c[0] * k, c[1] * k, c[2] * k]; }
    function pick() { return PALETTE[Math.floor(Math.random() * PALETTE.length)]; }

    function puff(strength) {
      var a = Math.random() * Math.PI * 2, f = 180 + Math.random() * 140;
      splat(0.2 + Math.random() * 0.6, 0.2 + Math.random() * 0.6, Math.cos(a) * f, Math.sin(a) * f, scaled(pick(), strength), 0.3);
    }

    function seed() {
      emitters.forEach(function (e) { e.pos = null; });
      for (var i = 0; i < 2; i++) puff(0.25);
    }

    function emitterPos(e, t) {
      return [
        0.5 + e.sign * (0.27 * Math.sin(e.a * t + e.p) + 0.06 * Math.sin(e.c * 2.7 * t)),
        0.5 + e.sign * 0.22 * Math.sin(e.b * t + e.q) + 0.05 * Math.cos(e.c * t + e.q)
      ];
    }

    function emit(dt) {
      emitters.forEach(function (e) {
        var p = emitterPos(e, simTime);
        if (e.pos) {
          var vx = (p[0] - e.pos[0]) / dt, vy = (p[1] - e.pos[1]) / dt;
          splat(p[0], p[1], vx * config.EMIT_FORCE, vy * config.EMIT_FORCE, scaled(e.color, 0.03), config.EMIT_RADIUS);
        }
        e.pos = p;
      });
    }

    function applyPointer() {
      if (!pointer.moved) return;
      pointer.moved = false;
      var aspect = canvas.width / canvas.height;
      var dx = pointer.dx * (aspect < 1 ? aspect : 1), dy = pointer.dy / (aspect > 1 ? aspect : 1);
      pointer.dx = pointer.dy = 0;
      splat(pointer.x, pointer.y, dx * config.SPLAT_FORCE, dy * config.SPLAT_FORCE, scaled(PALETTE[0], 0.12));
    }

    function step(dt) {
      gl.disable(gl.BLEND);

      P.curl.bind();
      gl.uniform2f(P.curl.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(P.curl.uniforms.uVelocity, velocity.read.attach(0));
      blit(curl);

      P.vorticity.bind();
      gl.uniform2f(P.vorticity.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(P.vorticity.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(P.vorticity.uniforms.uCurl, curl.attach(1));
      gl.uniform1f(P.vorticity.uniforms.curl, config.CURL);
      gl.uniform1f(P.vorticity.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();

      P.divergence.bind();
      gl.uniform2f(P.divergence.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(P.divergence.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence);

      P.clear.bind();
      gl.uniform1i(P.clear.uniforms.uTexture, pressure.read.attach(0));
      gl.uniform1f(P.clear.uniforms.value, config.PRESSURE);
      blit(pressure.write);
      pressure.swap();

      P.pressure.bind();
      gl.uniform2f(P.pressure.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(P.pressure.uniforms.uDivergence, divergence.attach(0));
      for (var i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(P.pressure.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }

      P.gradientSubtract.bind();
      gl.uniform2f(P.gradientSubtract.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(P.gradientSubtract.uniforms.uPressure, pressure.read.attach(0));
      gl.uniform1i(P.gradientSubtract.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      P.advection.bind();
      gl.uniform2f(P.advection.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (!ext.linear) gl.uniform2f(P.advection.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
      var velocityId = velocity.read.attach(0);
      gl.uniform1i(P.advection.uniforms.uVelocity, velocityId);
      gl.uniform1i(P.advection.uniforms.uSource, velocityId);
      gl.uniform1f(P.advection.uniforms.dt, dt);
      gl.uniform1f(P.advection.uniforms.dissipation, config.VELOCITY_DISSIPATION);
      blit(velocity.write);
      velocity.swap();

      if (!ext.linear) gl.uniform2f(P.advection.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
      gl.uniform1i(P.advection.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(P.advection.uniforms.uSource, dye.read.attach(1));
      gl.uniform1f(P.advection.uniforms.dissipation, config.DENSITY_DISSIPATION);
      blit(dye.write);
      dye.swap();
    }

    function render() {
      P.display.bind();
      gl.uniform2f(P.display.uniforms.texelSize, 1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight);
      gl.uniform3f(P.display.uniforms.back, config.BACK[0], config.BACK[1], config.BACK[2]);
      gl.uniform1i(P.display.uniforms.uTexture, dye.read.attach(0));
      blit(null);
    }

    function unstable() {
      P.probe.bind();
      gl.uniform1i(P.probe.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(P.probe.uniforms.uDye, dye.read.attach(1));
      blit(probe);
      var px = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      return px[0] > 127;
    }

    function tick(dt) {
      if (resizeCanvas()) { initFramebuffers(); seed(); }
      simTime += dt;
      emit(dt);
      applyPointer();
      puffTimer -= dt;
      if (puffTimer <= 0) { puff(0.15); puffTimer = 5 + Math.random() * 4; }
      step(dt);
      probeTimer += dt;
      if (probeTimer > 4) {
        probeTimer = 0;
        if (unstable()) { initFramebuffers(); seed(); }
      }
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      var elapsed = now - last;
      if (elapsed < FRAME_MS - 2) return;
      last = now;
      tick(Math.min(elapsed / 1000, 1 / 30));
      render();
    }

    function play() {
      if (raf || lost || reduceMotion || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function pause() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function staticFrame() {
      for (var i = 0; i < 90; i++) tick(1 / 30);
      render();
    }

    function destroy() {
      pause();
      freeFramebuffers();
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    }

    if (!setup()) return;
    if (reduceMotion) staticFrame(); else render();
    stage.classList.add('is-ready');

    canvas.addEventListener('pointermove', function (e) {
      if (reduceMotion) return;
      var r = canvas.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
      if (pointer.inside) {
        pointer.dx += x - pointer.x;
        pointer.dy += y - pointer.y;
        pointer.moved = true;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.inside = true;
    });
    ['pointerleave', 'pointercancel'].forEach(function (t) {
      canvas.addEventListener(t, function () { pointer.inside = false; pointer.moved = false; pointer.dx = pointer.dy = 0; });
    });

    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      lost = true;
      pause();
      owned = [];
      stage.classList.remove('is-ready');
    });
    canvas.addEventListener('webglcontextrestored', function () {
      lost = false;
      canvas.width = canvas.height = 1;
      if (!setup()) return;
      render();
      stage.classList.add('is-ready');
      play();
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) play(); else pause();
      }).observe(stage);
    } else {
      visible = true;
      play();
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause(); else play();
    });
    window.addEventListener('pagehide', function (e) { if (!e.persisted) destroy(); });
    if (reduceMotion && window.ResizeObserver) {
      new ResizeObserver(function () { if (resizeCanvas()) { initFramebuffers(); seed(); staticFrame(); } }).observe(stage);
    }
  }

  document.querySelectorAll('[data-mc-viz="fluid"]').forEach(init);
})();
