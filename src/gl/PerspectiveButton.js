import { BUTTON_VERTEX_SHADER, BUTTON_FRAGMENT_SHADER } from './shaders/buttonShaders.js'
import { createShader, createProgram, createGridMesh } from './webglUtils.js'

export class PerspectiveButton {
  constructor(element, options = {}) {
    this.container = element
    this.text = options.text || element.getAttribute('data-text') || element.textContent.trim() || 'BUTTON'
    this.href = options.href || element.getAttribute('href') || null
    this.isDark = options.isDark || false

    this.canvas = null
    this.gl = null
    this.program = null
    this.mesh = null
    this.textureInfo = null
    this.animationFrameId = null

    this.state = {
      isHovered: false,
      hover: 0,
      targetHover: 0,
      mouseX: 0,
      mouseY: 0,
      targetMouseX: 0,
      targetMouseY: 0,
      flatHalfW: 0.35,
      flatHalfH: 0.30,
      lastTime: performance.now(),
      uResolution: null,
      uHover: null,
      uMouse: null,
      uTextBounds: null,
      uFlatHalfW: null,
      uFlatHalfH: null,
      uTexture: null,
    }

    this.init()
  }

  init() {
    this.container.classList.add('perspective-btn')
    this.container.setAttribute('aria-label', this.text)

    // Hidden accessible text
    const srSpan = document.createElement('span')
    srSpan.className = 'sr-only'
    srSpan.textContent = this.text
    this.container.innerHTML = ''
    this.container.appendChild(srSpan)

    // Canvas
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'perspective-btn-canvas'
    this.container.appendChild(this.canvas)

    const gl =
      this.canvas.getContext('webgl', { antialias: true, alpha: false }) ||
      this.canvas.getContext('experimental-webgl')

    if (!gl) {
      this.container.textContent = this.text
      return
    }

    this.gl = gl
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    this.updateClearColor()

    const vertShader = createShader(gl, gl.VERTEX_SHADER, BUTTON_VERTEX_SHADER)
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, BUTTON_FRAGMENT_SHADER)
    const program = createProgram(gl, vertShader, fragShader)

    if (!program) return
    this.program = program
    gl.useProgram(program)

    this.mesh = createGridMesh(gl, 80, 20)
    const aGrid = gl.getAttribLocation(program, 'a_grid')
    gl.enableVertexAttribArray(aGrid)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.posBuffer)
    gl.vertexAttribPointer(aGrid, 2, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer)

    this.state.uResolution = gl.getUniformLocation(program, 'u_resolution')
    this.state.uHover = gl.getUniformLocation(program, 'u_hover')
    this.state.uMouse = gl.getUniformLocation(program, 'u_mouse')
    this.state.uTextBounds = gl.getUniformLocation(program, 'u_textBounds')
    this.state.uFlatHalfW = gl.getUniformLocation(program, 'u_flatHalfW')
    this.state.uFlatHalfH = gl.getUniformLocation(program, 'u_flatHalfH')
    this.state.uTexture = gl.getUniformLocation(program, 'u_texture')

    this.createTextTexture()
    this.resize()

    if (document.fonts) {
      document.fonts.ready.then(() => {
        this.createTextTexture()
        this.resize()
      })
    }

    this.bindEvents()
    this.startLoop()
  }

  updateClearColor() {
    if (!this.gl) return
    if (this.isDark) {
      // Dark mode: pill background is dark with white text
      this.gl.clearColor(14 / 255, 14 / 255, 14 / 255, 1.0)
    } else {
      // Crimson mode / light: rich deep ruby pill
      this.gl.clearColor(116 / 255, 0 / 255, 23 / 255, 1.0)
    }
  }

  createTextTexture() {
    const gl = this.gl
    if (!gl) return

    const offCanvas = document.createElement('canvas')
    const width = 1024
    const height = 256
    offCanvas.width = width
    offCanvas.height = height
    const ctx = offCanvas.getContext('2d')

    // Solid background matching button theme
    ctx.fillStyle = this.isDark ? '#0e0e0e' : '#740017'
    ctx.fillRect(0, 0, width, height)

    // Crisp typography
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '700 96px "JetBrains Mono", "Inter", sans-serif'
    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = '4px'
    }
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.text.toUpperCase(), width / 2, height / 2)

    const metrics = ctx.measureText(this.text.toUpperCase())
    const textWidth = metrics.width
    const ascent = metrics.actualBoundingBoxAscent || 70
    const descent = metrics.actualBoundingBoxDescent || 20
    const textHeight = ascent + descent

    const minX = (width / 2 - textWidth / 2) / width
    const maxX = (width / 2 + textWidth / 2) / width
    const topY = height / 2 - ascent
    const botY = height / 2 + descent
    const vTop = 1.0 - topY / height
    const vBot = 1.0 - botY / height

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offCanvas)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    this.textureInfo = {
      texture,
      bounds: [minX, maxX, vBot, vTop],
      textWidth,
      textHeight,
    }
  }

  setTheme(isDark) {
    this.isDark = isDark
    this.updateClearColor()
    this.createTextTexture()
    this.resize()
  }

  resize() {
    if (!this.canvas || !this.gl || !this.textureInfo) return
    const rect = this.container.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.floor(rect.width * dpr)
    const height = Math.floor(rect.height * dpr)

    if (width === 0 || height === 0) return

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
      this.gl.viewport(0, 0, width, height)
    }

    const nativeFontPx = 13.5
    const canvasRefFontPx = 96
    const renderScale = nativeFontPx / canvasRefFontPx
    const naturalW = this.textureInfo.textWidth * renderScale
    const naturalH = this.textureInfo.textHeight * renderScale

    this.state.flatHalfW = Math.min(naturalW / rect.width, 0.95)
    this.state.flatHalfH = Math.min(naturalH / rect.height, 0.95)
  }

  bindEvents() {
    this.container.addEventListener('mouseenter', () => {
      this.state.isHovered = true
      this.state.targetHover = 1.0
    })

    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      this.state.targetMouseX = Math.max(-1, Math.min(1, x))
      this.state.targetMouseY = Math.max(-1, Math.min(1, y))
    })

    this.container.addEventListener('mouseleave', () => {
      this.state.isHovered = false
      this.state.targetHover = 0.0
      this.state.targetMouseX = 0
      this.state.targetMouseY = 0
    })

    if (this.href) {
      this.container.addEventListener('click', (e) => {
        if (this.href.startsWith('#')) {
          e.preventDefault()
          const target = document.querySelector(this.href)
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' })
          }
        }
      })
    }

    window.addEventListener('resize', () => this.resize())
  }

  startLoop() {
    const gl = this.gl
    const render = (now) => {
      const dt = Math.min((now - this.state.lastTime) / 1000, 0.1)
      this.state.lastTime = now

      const hoverSpeed = 5.2
      this.state.hover += (this.state.targetHover - this.state.hover) * (1.0 - Math.exp(-hoverSpeed * dt))

      const mouseSpeed = 6.5
      this.state.mouseX += (this.state.targetMouseX - this.state.mouseX) * (1.0 - Math.exp(-mouseSpeed * dt))
      this.state.mouseY += (this.state.targetMouseY - this.state.mouseY) * (1.0 - Math.exp(-mouseSpeed * dt))

      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.useProgram(this.program)
      gl.uniform2f(this.state.uResolution, this.canvas.width, this.canvas.height)
      gl.uniform1f(this.state.uHover, this.state.hover)
      gl.uniform2f(this.state.uMouse, this.state.mouseX, this.state.mouseY)
      gl.uniform1f(this.state.uFlatHalfW, this.state.flatHalfW)
      gl.uniform1f(this.state.uFlatHalfH, this.state.flatHalfH)

      if (this.textureInfo) {
        gl.uniform4f(
          this.state.uTextBounds,
          this.textureInfo.bounds[0],
          this.textureInfo.bounds[1],
          this.textureInfo.bounds[2],
          this.textureInfo.bounds[3]
        )
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.textureInfo.texture)
        gl.uniform1i(this.state.uTexture, 0)
      }

      gl.drawElements(gl.TRIANGLES, this.mesh.indexCount, gl.UNSIGNED_SHORT, 0)

      this.animationFrameId = requestAnimationFrame(render)
    }

    this.state.lastTime = performance.now()
    this.animationFrameId = requestAnimationFrame(render)
  }

  destroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)
    if (this.gl && this.mesh) {
      this.gl.deleteBuffer(this.mesh.posBuffer)
      this.gl.deleteBuffer(this.mesh.indexBuffer)
    }
  }
}
