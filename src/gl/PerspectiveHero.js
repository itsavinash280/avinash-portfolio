import { HERO_VERTEX_SHADER, HERO_FRAGMENT_SHADER } from './shaders/heroShaders.js'
import { createShader, createProgram, createGridMesh } from './webglUtils.js'

export class PerspectiveHero {
  constructor(containerElement, options = {}) {
    this.container = containerElement
    this.onStateChange = options.onStateChange || (() => {})

    this.canvas = null
    this.gl = null
    this.program = null
    this.mesh = null
    this.settleTimer = null

    this.state = {
      isState1: false, // false = "Avinash & frames.", true = "PHOTOGRAPHER"
      hover: 0,
      targetHover: 0,
      curve: 0,
      targetCurve: 0,
      mouseX: 0,
      mouseY: 0,
      targetMouseX: 0,
      targetMouseY: 0,
      isHovered: false,
      lastTime: performance.now(),
      animationFrameId: null,
      textureInfo0: null,
      textureInfo1: null,
      uResolution: null,
      uHover: null,
      uCurve: null,
      uMouse: null,
      uTextAspect0: null,
      uTextBounds0: null,
      uTextAspect1: null,
      uTextBounds1: null,
      uTexture0: null,
      uTexture1: null,
    }

    this.init()
  }

  init() {
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'perspective-hero-canvas'
    this.canvas.style.touchAction = 'none'
    this.container.appendChild(this.canvas)

    const gl =
      this.canvas.getContext('webgl', { antialias: true, alpha: true }) ||
      this.canvas.getContext('experimental-webgl')

    if (!gl) {
      console.warn('WebGL is not supported in this environment')
      return
    }

    this.gl = gl
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.clearColor(0.0, 0.0, 0.0, 0.0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const vertShader = createShader(gl, gl.VERTEX_SHADER, HERO_VERTEX_SHADER)
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, HERO_FRAGMENT_SHADER)
    const program = createProgram(gl, vertShader, fragShader)

    if (!program) return
    this.program = program
    gl.useProgram(program)

    this.mesh = createGridMesh(gl, 260, 50)
    const aGrid = gl.getAttribLocation(program, 'a_grid')
    gl.enableVertexAttribArray(aGrid)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.posBuffer)
    gl.vertexAttribPointer(aGrid, 2, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer)

    this.state.uResolution = gl.getUniformLocation(program, 'u_resolution')
    this.state.uHover = gl.getUniformLocation(program, 'u_hover')
    this.state.uCurve = gl.getUniformLocation(program, 'u_curve')
    this.state.uMouse = gl.getUniformLocation(program, 'u_mouse')

    this.state.uTextAspect0 = gl.getUniformLocation(program, 'u_textAspect0')
    this.state.uTextBounds0 = gl.getUniformLocation(program, 'u_textBounds0')
    this.state.uTextAspect1 = gl.getUniformLocation(program, 'u_textAspect1')
    this.state.uTextBounds1 = gl.getUniformLocation(program, 'u_textBounds1')

    this.state.uTexture0 = gl.getUniformLocation(program, 'u_texture0')
    this.state.uTexture1 = gl.getUniformLocation(program, 'u_texture1')

    this.createTextures()

    // Recreate textures once web fonts are fully loaded to assure pixel-perfect rendering
    if (document.fonts) {
      document.fonts.load('italic 650 120px Fraunces').then(() => {
        this.createTextures()
      }).catch(() => {})

      document.fonts.ready.then(() => {
        this.createTextures()
      })
    }

    this.resize()
    this.bindEvents()
    this.startLoop()
  }

  /**
   * Render Texture 0 ("Avinash & frames.") in ultra-high-resolution italic Fraunces display serif
   * with crystal-clear glyph rendering, anisotropic filtering, and mipmaps
   */
  renderAvinashFramesTexture() {
    const gl = this.gl
    const offCanvas = document.createElement('canvas')
    // 4096 x 2048: Power-of-two (POT) texture for hardware mipmapping and razor-sharp clarity
    const width = 4096
    const height = 2048
    offCanvas.width = width
    offCanvas.height = height
    const ctx = offCanvas.getContext('2d')

    ctx.clearRect(0, 0, width, height)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Ultra-high-resolution font size so letters use maximal native texture pixels
    const fontSize = 560
    const fontPrimary = `italic 650 ${fontSize}px "Fraunces", Georgia, serif`
    ctx.font = fontPrimary
    ctx.textBaseline = 'alphabetic'

    // Measure Line 1: "Avinash " + "&"
    const textAvinash = 'Avinash'
    const textAmp = ' &'
    const widthAvinash = ctx.measureText(textAvinash).width
    const widthAmp = ctx.measureText(textAmp).width
    const totalLine1Width = widthAvinash + widthAmp

    // Measure Line 2: "frames."
    const textFrames = 'frames.'
    const totalLine2Width = ctx.measureText(textFrames).width

    // Line heights and spacing
    const lineGap = fontSize * 0.90
    const centerY = height / 2
    const line1Y = centerY - lineGap * 0.38
    const line2Y = line1Y + lineGap

    // Render Line 1 centered
    const line1StartX = width / 2 - totalLine1Width / 2

    // "Avinash" in crisp bright white
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(textAvinash, line1StartX, line1Y)

    // " &" in soft rose-tinted translucent white (matching screenshot)
    ctx.fillStyle = 'rgba(255, 232, 238, 0.58)'
    ctx.fillText(textAmp, line1StartX + widthAvinash, line1Y)

    // Render Line 2: "frames." in crisp bright white
    const line2StartX = width / 2 - totalLine2Width / 2
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(textFrames, line2StartX, line2Y)

    // Compute precise bounding box
    const maxLineWidth = Math.max(totalLine1Width, totalLine2Width)
    const metrics1 = ctx.measureText(textAvinash)
    const ascent = metrics1.actualBoundingBoxAscent || fontSize * 0.8
    const metrics2 = ctx.measureText(textFrames)
    const descent = metrics2.actualBoundingBoxDescent || fontSize * 0.25
    const totalHeight = (line2Y + descent) - (line1Y - ascent)

    const padX = 60
    const padY = 60
    const minX = Math.max(0, (width / 2 - maxLineWidth / 2 - padX) / width)
    const maxX = Math.min(1, (width / 2 + maxLineWidth / 2 + padX) / width)
    const topY = Math.max(0, line1Y - ascent - padY)
    const botY = Math.min(height, line2Y + descent + padY)

    const vTop = 1.0 - topY / height
    const vBot = 1.0 - botY / height

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offCanvas)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // Enable Anisotropic Filtering for crystal-clear perspective oblique rendering
    const ext = (
      gl.getExtension('EXT_texture_filter_anisotropic') ||
      gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
      gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
    )
    if (ext) {
      const maxAniso = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 16
      gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(maxAniso, 16))
    }

    // Hardware Mipmapping eliminates texture blur and sparkling
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    return {
      texture,
      bounds: [minX, maxX, vBot, vTop],
      aspect: maxLineWidth / totalHeight,
    }
  }

  /**
   * Render Texture 1 ("PHOTOGRAPHER") for State 1 in Ultra-HD resolution
   */
  renderPhotographerTexture() {
    const gl = this.gl
    const offCanvas = document.createElement('canvas')
    const width = 4096
    const height = 2048
    offCanvas.width = width
    offCanvas.height = height
    const ctx = offCanvas.getContext('2d')

    ctx.clearRect(0, 0, width, height)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    const label = 'PHOTOGRAPHER'
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '900 440px "Inter", -apple-system, sans-serif'
    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = '-2px'
    }
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, width / 2, height / 2)

    const metrics = ctx.measureText(label)
    const textWidth = metrics.width
    const ascent = metrics.actualBoundingBoxAscent || 340
    const descent = metrics.actualBoundingBoxDescent || 90
    const textHeight = ascent + descent

    const padX = 60
    const padY = 60
    const minX = Math.max(0, (width / 2 - textWidth / 2 - padX) / width)
    const maxX = Math.min(1, (width / 2 + textWidth / 2 + padX) / width)
    const topY = Math.max(0, height / 2 - ascent - padY)
    const botY = Math.min(height, height / 2 + descent + padY)

    const vTop = 1.0 - topY / height
    const vBot = 1.0 - botY / height

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offCanvas)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    const ext = (
      gl.getExtension('EXT_texture_filter_anisotropic') ||
      gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
      gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
    )
    if (ext) {
      const maxAniso = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 16
      gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(maxAniso, 16))
    }

    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    return {
      texture,
      bounds: [minX, maxX, vBot, vTop],
      aspect: textWidth / textHeight,
    }
  }

  createTextures() {
    if (!this.gl) return
    this.state.textureInfo0 = this.renderAvinashFramesTexture()
    this.state.textureInfo1 = this.renderPhotographerTexture()
  }

  resize() {
    if (!this.canvas || !this.gl) return
    const rect = this.container.getBoundingClientRect()
    // Support up to 2.5x DPR for high-DPI and Retina displays
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
    const width = Math.floor(rect.width * dpr)
    const height = Math.floor(rect.height * dpr)

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
      this.gl.viewport(0, 0, width, height)
    }
  }

  toggleState(targetState1) {
    if (this.state.isState1 === targetState1) return
    if (this.settleTimer) clearTimeout(this.settleTimer)

    if (targetState1) {
      // Flip to State 1 (PHOTOGRAPHER)
      this.state.isState1 = true
      this.state.targetCurve = 1.0
      this.onStateChange(true)
      this.container.classList.add('state-photographer')
      this.container.classList.remove('state-avinash')
    } else {
      // Flip back to State 0 (Avinash & frames.)
      this.state.isState1 = false
      this.state.targetCurve = 0.0
      this.onStateChange(false)
      this.container.classList.add('state-avinash')
      this.container.classList.remove('state-photographer')
    }

    if (!this.state.isHovered) {
      this.state.targetHover = 0.0
      this.state.targetMouseX = 0
      this.state.targetMouseY = 0
    }
  }

  bindEvents() {
    let lastToggleTime = 0

    // Wheel listener: Single gesture flips state on scroll
    const handleWheel = (e) => {
      // Only capture wheel when near top hero section
      if (window.scrollY > 150) return

      const now = performance.now()
      if (now - lastToggleTime < 450) return

      if (e.deltaY > 15) {
        if (!this.state.isState1) {
          this.toggleState(true)
          lastToggleTime = now
          e.preventDefault()
        }
      } else if (e.deltaY < -15) {
        if (this.state.isState1) {
          this.toggleState(false)
          lastToggleTime = now
          e.preventDefault()
        }
      }
    }

    // Touch interaction
    let touchStartY = 0
    let isTouching = false

    const handleTouchStart = (e) => {
      if (e.touches && e.touches.length > 0) {
        touchStartY = e.touches[0].clientY
        isTouching = true

        const rect = this.container.getBoundingClientRect()
        const x = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1
        const y = -(((e.touches[0].clientY - rect.top) / rect.height) * 2 - 1)

        const screenAspect = rect.width / Math.max(rect.height, 1)
        const isMobile = screenAspect < 1.2
        const boxHalfW = isMobile ? 0.86 : 0.44
        const boxHalfH = isMobile ? 0.40 : 0.42
        const inBox = Math.abs(x) <= boxHalfW && Math.abs(y) <= boxHalfH

        if (inBox) {
          this.state.isHovered = true
          this.state.targetHover = 1.0
          this.state.targetMouseX = Math.max(-1, Math.min(1, x / boxHalfW))
          this.state.targetMouseY = Math.max(-1, Math.min(1, y / boxHalfH))
        } else {
          this.state.isHovered = false
          this.state.targetHover = 0.0
          this.state.targetMouseX = 0
          this.state.targetMouseY = 0
        }
      }
    }

    const handleTouchMove = (e) => {
      if (!isTouching || !e.touches || e.touches.length === 0) return
      const rect = this.container.getBoundingClientRect()
      const x = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.touches[0].clientY - rect.top) / rect.height) * 2 - 1)

      const screenAspect = rect.width / Math.max(rect.height, 1)
      const isMobile = screenAspect < 1.2
      const boxHalfW = isMobile ? 0.86 : 0.44
      const boxHalfH = isMobile ? 0.40 : 0.42
      const inBox = Math.abs(x) <= boxHalfW && Math.abs(y) <= boxHalfH

      if (inBox) {
        this.state.isHovered = true
        this.state.targetHover = 1.0
        this.state.targetMouseX = Math.max(-1, Math.min(1, x / boxHalfW))
        this.state.targetMouseY = Math.max(-1, Math.min(1, y / boxHalfH))
      } else {
        this.state.isHovered = false
        this.state.targetHover = 0.0
        this.state.targetMouseX = 0
        this.state.targetMouseY = 0
      }
    }

    const handleTouchEnd = (e) => {
      if (!isTouching) return
      isTouching = false
      const deltaY = touchStartY - (e.changedTouches[0]?.clientY || touchStartY)
      const now = performance.now()

      if (now - lastToggleTime >= 450) {
        if (deltaY > 35 && !this.state.isState1) {
          this.toggleState(true)
          lastToggleTime = now
          return
        } else if (deltaY < -35 && this.state.isState1) {
          this.toggleState(false)
          lastToggleTime = now
          return
        }
      }

      this.state.targetHover = 0.0
      this.state.targetMouseX = 0
      this.state.targetMouseY = 0
      this.state.isHovered = false
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    // Mouse movement inside hero container
    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)

      // Defined box region (matching the center typography & subtitle area)
      const screenAspect = rect.width / Math.max(rect.height, 1)
      const isMobile = screenAspect < 1.2
      const boxHalfW = isMobile ? 0.86 : 0.44
      const boxHalfH = isMobile ? 0.40 : 0.42

      const inBox = Math.abs(x) <= boxHalfW && Math.abs(y) <= boxHalfH

      if (inBox) {
        // Cursor is inside the box: engage 3D perspective warp
        this.state.isHovered = true
        this.state.targetHover = 1.0
        this.state.targetMouseX = Math.max(-1, Math.min(1, x / boxHalfW))
        this.state.targetMouseY = Math.max(-1, Math.min(1, y / boxHalfH))
      } else {
        // Cursor is outside the box: return immediately to normal (flat / idle)
        this.state.isHovered = false
        this.state.targetHover = 0.0
        this.state.targetMouseX = 0
        this.state.targetMouseY = 0
      }
    })

    this.container.addEventListener('mouseleave', () => {
      // Cursor left the hero container: return immediately to normal
      this.state.isHovered = false
      this.state.targetHover = 0.0
      this.state.targetMouseX = 0
      this.state.targetMouseY = 0
    })

    window.addEventListener('resize', () => this.resize())
  }

  startLoop() {
    const gl = this.gl
    const render = (now) => {
      const dt = Math.min((now - this.state.lastTime) / 1000, 0.1)
      this.state.lastTime = now

      const hoverSpeed = 5.2
      this.state.hover += (this.state.targetHover - this.state.hover) * (1.0 - Math.exp(-hoverSpeed * dt))

      const curveSpeed = 6.0
      this.state.curve += (this.state.targetCurve - this.state.curve) * (1.0 - Math.exp(-curveSpeed * dt))

      const mouseSpeed = 6.5
      this.state.mouseX += (this.state.targetMouseX - this.state.mouseX) * (1.0 - Math.exp(-mouseSpeed * dt))
      this.state.mouseY += (this.state.targetMouseY - this.state.mouseY) * (1.0 - Math.exp(-mouseSpeed * dt))

      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.useProgram(this.program)
      gl.uniform2f(this.state.uResolution, this.canvas.width, this.canvas.height)
      gl.uniform1f(this.state.uHover, this.state.hover)
      gl.uniform1f(this.state.uCurve, this.state.curve)
      gl.uniform2f(this.state.uMouse, this.state.mouseX, this.state.mouseY)

      if (this.state.textureInfo0) {
        gl.uniform1f(this.state.uTextAspect0, this.state.textureInfo0.aspect)
        gl.uniform4f(
          this.state.uTextBounds0,
          this.state.textureInfo0.bounds[0],
          this.state.textureInfo0.bounds[1],
          this.state.textureInfo0.bounds[2],
          this.state.textureInfo0.bounds[3]
        )
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.state.textureInfo0.texture)
        gl.uniform1i(this.state.uTexture0, 0)
      }

      if (this.state.textureInfo1) {
        gl.uniform1f(this.state.uTextAspect1, this.state.textureInfo1.aspect)
        gl.uniform4f(
          this.state.uTextBounds1,
          this.state.textureInfo1.bounds[0],
          this.state.textureInfo1.bounds[1],
          this.state.textureInfo1.bounds[2],
          this.state.textureInfo1.bounds[3]
        )
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, this.state.textureInfo1.texture)
        gl.uniform1i(this.state.uTexture1, 1)
      }

      gl.drawElements(gl.TRIANGLES, this.mesh.indexCount, gl.UNSIGNED_SHORT, 0)

      // Update subtitle opacity based on hover
      const subtitle = this.container.querySelector('.perspective-subtitle')
      if (subtitle) {
        if (!this.state.isState1 && this.state.hover < 0.25) {
          subtitle.style.opacity = '1'
          subtitle.style.pointerEvents = 'auto'
        } else {
          subtitle.style.opacity = '0'
          subtitle.style.pointerEvents = 'none'
        }
      }

      this.state.animationFrameId = requestAnimationFrame(render)
    }

    this.state.lastTime = performance.now()
    this.state.animationFrameId = requestAnimationFrame(render)
  }

  destroy() {
    if (this.state.animationFrameId) cancelAnimationFrame(this.state.animationFrameId)
    if (this.gl && this.mesh) {
      this.gl.deleteBuffer(this.mesh.posBuffer)
      this.gl.deleteBuffer(this.mesh.indexBuffer)
    }
  }
}
