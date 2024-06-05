const hexColorHash = (name: string): string =>
	'#' +
	(0x1000000 + (name.split('').reduce((acc, c) => acc + c.charCodeAt(0) * 42, 0) & 0xffffff))
		.toString(16)
		.slice(1)
		.replace(/^./, 'F')

/**
 * A simple webgl shader renderer.
 * @module
 */

export interface PocketShaderOptions<T extends Record<string, any> = Record<string, any>> {
	/**
	 * The canvas element to render the shader on.
	 * @defaultValue A new canvas element.
	 */
	canvas?: HTMLCanvasElement

	/**
	 * The vertex shader source code.
	 */
	vertex?: string

	/**
	 * The fragment shader source code.
	 */
	fragment?: string

	/**
	 * When true, the render loop will start automatically.  Otherwise, you will need to call the
	 * {@link PocketShader.render|`render`} method manually.
	 * @defaultValue `true`
	 */
	autoStart?: boolean

	/**
	 * A record of uniform values to pass to the shader.  If provided, these values will be merged
	 * with the {@link DEFAULT_UNIFORMS|default uniforms} and made available to the shader.
	 * @defaultValue {@link DEFAULT_UNIFORMS|`DEFAULT_UNIFORMS`}
	 */
	uniforms?: T

	/**
	 * The maximum resolution multiplier, determined by the device pixel ratio by default.
	 * @defaultValue `window.devicePixelRatio || 1`
	 */
	maxPixelRatio?: number

	/**
	 * A time multiplier.
	 * @defaultValue `1`
	 */
	speed?: number

	/**
	 * The mouse smoothing factor.
	 * @defaultValue `0.1`
	 */
	mouseSmoothing?: number

	/**
	 * The initial mouse position, normalized to the range `[0, 1]`.
	 * @defaultValue `[0, 0]`
	 */
	mousePosition?: { x: number; y: number }

	/**
	 * Where to listen for mouse events.  By default, the renderer listens for mouse events on the
	 * canvas element.  You can also listen for mouse events on the container element, or the window
	 * with this option.
	 * @defaultValue `'canvas'`
	 */
	mouseTarget?: 'canvas' | 'container' | 'window'

	/**
	 * When true, the instance will automatically initialize itself.  Otherwise, you will need to
	 * call the {@link PocketShader.init|`init`} method manually.  This is useful for server-side
	 * rendering, or when you need to perform additional setup before initializing the instance.
	 * @defaultValue `true`
	 */
	autoInit?: boolean
}

const DEFAULT_UNIFORMS = {
	u_time: 0,
	u_resolution: [0, 0] as [number, number],
	u_mouse: [0, 0] as [number, number],
}

interface Uniform {
	type: 'int' | 'float' | 'vec2' | 'vec3' | 'vec4'
	value: number | number[]
}

/**
 * A simple canvas-based shader renderer.
 *
 * @param container The element to append the canvas to.  Can be an HTMLElement or a string selector.
 */
@LogMethods()
export class PocketShader<T extends Record<string, Uniform> = Record<string, Uniform>> {
	/**
	 * The container for the canvas element is used to determine the size of the canvas.
	 */
	container!: HTMLElement | null

	/**
	 * The canvas element used to render the shader.
	 */
	canvas!: HTMLCanvasElement

	/**
	 * The WebGL2 rendering context.
	 */
	ctx: WebGL2RenderingContext | null = null

	/**
	 * The vertex shader used by this instance.
	 * @default
	 * ```glsl
	 * #version 300 es
	 * in vec4 a_position;
	 * out vec2 vUv;
	 * void main() {
	 *   vUv = a_position.xy * 0.5 + 0.5;
	 *   gl_Position = a_position;
	 * }
	 * ```
	 */
	vertex!: string

	/**
	 * The fragment shader used by this instance.
	 * @default
	 * ```glsl
	 * #version 300 es
	 * precision mediump float;
	 *
	 * in vec2 vUv;
	 * out vec4 color;
	 *
	 * uniform float u_time;
	 * uniform float u_mouse;
	 * uniform vec2 u_resolution;
	 *
	 * void main() {
	 *   color = vec4(vUv, 0.5 + 0.5 * sin(u_time), 1.0);
	 * }
	 *```
	 */
	fragment!: string

	/**
	 * The maximum resolution multiplier.  By default, this value is set to `2` to avoid nuking
	 * high-dpi phones with expensive shaders _(iPhone is `3` for example, so 3x more expensive)_.
	 * @defaultValue `2`
	 */
	maxPixelRatio!: number

	/**
	 * A time multiplier.
	 * @defaultValue `1`
	 */
	speed!: number

	/**
	 * The current state of the renderer.
	 * @defaultValue `'stopped'`
	 */
	state: 'running' | 'paused' | 'stopped' | 'disposed' = 'stopped'

	/**
	 * The options used to create this instance.
	 */
	opts = {} as PocketShaderOptions<NoInfer<T>>

	/**
	 * The WebGL program used to render the shader.
	 */
	program: WebGLProgram | false = false

	/**
	 * The current mouse position normalized, to the range `[0, 1]`.
	 * @defaultValue `{ x: 0.5, y: 0.5 }`
	 */
	mouse = { x: 0.5, y: 0.5 }

	/**
	 * The current _smoothed_ mouse position, normalized to the range `[0, 1]`.
	 * @defaultValue `{ x: 0.5, y: 0.5 }`
	 */
	mouseSmoothed = { x: 0.5, y: 0.5 }

	/**
	 * The mouse smoothing factor.
	 * @defaultValue `0.1`
	 */
	mouseSmoothing = 0.1

	/**
	 * These uniforms are always available to the shader, and are updated automatically whenever
	 * the shader state is `running`.
	 * @defaultValue `{ u_time: 0, u_resolution: [0, 0], u_mouse: [0.5, 0.5] }`
	 */
	builtinUniforms = {
		u_time: 0,
		u_resolution: [0, 0] as [number, number],
		u_mouse: [0.5, 0.5] as [number, number],
	}

	private _positionBuffer: WebGLBuffer | null = null
	private _builtinUniformLocations = new Map<string, WebGLUniformLocation>()
	private _uniformLocations = new Map<string, WebGLUniformLocation>()

	private _uniforms!: { [K in keyof T]: T[K] }

	private _time = 0

	private _resizeObserver!: ResizeObserver
	private _canvasRectCache!: DOMRectReadOnly
	private _listeners = new Map<string, (data: { time: number; delta: number }) => void>()

	private _arg1: ConstructorParameters<typeof PocketShader>[0]
	private _arg2: ConstructorParameters<typeof PocketShader>[1]

	constructor(options?: PocketShaderOptions<T>)
	constructor(
		/**
		 * The container element (or query selector) to use for the canvas.  The canvas will
		 * automatically adjust its size to fill the container, and re-render whenever the
		 * window is resized.
		 * @defaultValue `document.body`
		 */
		container: HTMLElement | string,
		options?: PocketShaderOptions<T>,
	)
	constructor(
		arg1?: HTMLElement | string | PocketShaderOptions<T>,
		arg2?: PocketShaderOptions<T>,
	) {
		this._arg1 = arg1 as ConstructorParameters<typeof PocketShader>[0]
		this._arg2 = arg2

		// this.resolution = this.resolution.bind(this)
		// Cannot assign to 'resolution' because it is a read-only property.ts(2540)
		// Property 'bind' does not exist on type '{ width: number; height: number; }'.ts(2339)

		let init = true
		if (typeof arg1 === 'object' && 'autoInit' in arg1 && arg1.autoInit === false) {
			init = false
		}
		if (typeof arg2 === 'object' && 'autoInit' in arg2 && arg2.autoInit === false) {
			init = false
		}

		if (init) {
			if (typeof globalThis.window === 'undefined') {
				if (import.meta.env?.DEV) {
					console.warn(
						'PocketShader is not running in a browser environment.  Aborting automatic initialization.',
					)
				}
				return
			}

			if (globalThis.document?.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', this.init)
			} else {
				this.init()
			}
		}
	}

	/**
	 * A record of uniform values to pass to the shader.
	 */
	get uniforms(): T {
		return this._uniforms
	}
	set uniforms(value: T) {
		this._uniforms = value
		if (this.state.match(/paused|stopped/)) {
			this.render()
		}
	}

	/**
	 * The current time in seconds.  This value is updated automatically after calling
	 * {@link start|`start()`}, and is reset to `0` when {@link stop|`stop()`} is called.  You can
	 * also set this value yourself if you prefer to control the time uniform manually.
	 */
	get time(): number {
		return this._time
	}
	set time(value: number) {
		this._time = value
		this.builtinUniforms.u_time = value
	}

	get resolution(): { width: number; height: number } {
		return {
			width: this.canvas?.width,
			height: this.canvas?.height,
		}
	}

	init(): this {
		let container: HTMLElement | null
		let options: PocketShaderOptions<T> | undefined

		if (this._arg1 instanceof Element) {
			container = this._arg1
			options = this._arg2 as PocketShaderOptions<T>
		} else if (typeof this._arg1 === 'string') {
			container = document.querySelector(this._arg1)
			options = this._arg2 as PocketShaderOptions<T>
		} else {
			container = document.body
			options = this._arg1
		}

		this.opts = options ?? {}
		this.opts.mouseTarget = options?.mouseTarget ?? 'canvas'

		this.speed = options?.speed ?? 1
		this.mouseSmoothing = options?.mouseSmoothing ?? 0.1
		this.maxPixelRatio = options?.maxPixelRatio ?? (globalThis.window?.devicePixelRatio || 1)

		if (options?.canvas) {
			this.canvas = options.canvas
			container = this.canvas.parentElement
		} else {
			this.canvas = document.createElement('canvas')
		}

		this.container = container ?? document.body
		this._canvasRectCache = this.canvas.getBoundingClientRect()

		this.vertex =
			options?.vertex ??
			`#version 300 es\nlayout(location = 0) in vec4 a_position;out vec2 vUv;void main() {vUv = a_position.xy * 0.5 + 0.5;gl_Position = a_position;}`

		this.fragment =
			options?.fragment ??
			`#version 300 es\nprecision mediump float;uniform float u_time;in vec2 vUv;out vec4 color;void main() {color = vec4(vUv, 0.5 + 0.5 * sin(u_time), 1.0);}`

		if (!this.vertex.startsWith('#version')) {
			this.vertex = '#version 300 es\n' + this.vertex
		}

		// Fill in `#version` / `precision` directives if missing.

		const parts = this.fragment.split('\n')
		// prettier-ignore
		const prepends = [
			parts[0].startsWith('#version')
				? parts.shift()
				: '#version 300 es'
		]
		if (!this.fragment.includes('precision')) {
			prepends.push('precision mediump float;\n')
		}

		this.fragment = prepends.concat(parts).join('\n')

		this._uniforms = options?.uniforms ?? ({} as T)

		if (this.container instanceof HTMLBodyElement) {
			const w = window.innerWidth
			const h = window.innerHeight
			this.canvas.style.setProperty('width', `${w}px`)
			this.canvas.style.setProperty('height', `${h}px`)
			this.canvas.style.setProperty('position', 'fixed')
			this.canvas.style.setProperty('inset', '0')
			this.canvas.style.setProperty('zIndex', '0')
		} else {
			this.canvas.style.setProperty('width', `${this.container.clientWidth}px`)
			this.canvas.style.setProperty('height', `${this.container.clientHeight}px`)
			this.canvas.style.setProperty('position', 'absolute')
			this.canvas.style.setProperty('inset', '0')
			this.canvas.style.setProperty('zIndex', '1')
			if (this.container.style.position === '') {
				this.container.style.position = 'relative'
			}
		}

		this._setupCanvas()

		this._resizeObserver = new ResizeObserver(this.resize)
		this._resizeObserver.observe(this.canvas)
		this._resizeObserver.observe(this.container)

		this.compile()

		if (options?.mousePosition) {
			this.mouse = options.mousePosition
		}

		if (options?.autoStart === true) {
			this.start()
		} else {
			this._resize()
		}

		if (
			import.meta.env?.DEV &&
			(this.container.clientWidth === 0 || this.container.clientHeight === 0)
		) {
			console.error(
				`PocketShader container has a width or height of 0px.  The canvas will not be visible until the container has a non-zero size size.`,
				{
					container: this.container,
					canvas: this.canvas,
					this: this,
				},
			)
		}

		return this
	}

	/**
	 * Starts a render loop, updating the time uniform and re-rendering the shader each frame.
	 * If the {@link state} is already `running`, this method does nothing.
	 * @throws If the {@link state} is already `disposed`.
	 */
	start(): this {
		switch (this.state) {
			case 'stopped':
			case 'paused':
				this.state = 'running'
				this._resize()
				this.render()
				break
			case 'running':
				break
			case 'disposed':
				throw new Error('Cannot start a disposed PocketShader.  Call restart() instead.')
		}
		return this
	}

	/**
	 * Pauses the render loop.
	 */
	pause(): this {
		this.state = 'paused'
		return this
	}

	/**
	 * Stops the render loop and resets the time uniform to `0`.
	 */
	stop(): this {
		this.state = 'stopped'
		this.time = 0
		return this
	}

	/**
	 * Restarts the render loop.  If the WebGL context has already been disposed of, this will
	 * call {@link reload} to create a new one.
	 */
	restart(): this {
		switch (this.state) {
			case 'running':
				break
			case 'stopped':
			case 'paused':
				this.start()
				break
			case 'disposed':
				this.reload()
		}
		return this
	}

	/**
	 * Fully dipsoses the current WebGL context and creates a new one.
	 */
	reload(): this {
		const running = this.state === 'running'
		if (running) {
			this.pause()
		}
		this.dispose()
		this.state = 'stopped'
		this.compile()
		this._resize()
		if (running) {
			this.start()
		}
		return this
	}

	/**
	 * Resizes the canvas to fill the container.
	 */
	_resize = (): this => {
		const width =
			this.container instanceof HTMLBodyElement
				? window.innerWidth
				: this.container!.clientWidth
		const height =
			this.container instanceof HTMLBodyElement
				? window.innerHeight
				: this.container!.clientHeight

		if (
			this.canvas.width !== width ||
			this.canvas.height !== height ||
			this.maxPixelRatio !== this.opts.maxPixelRatio
		) {
			this.canvas.width = width * this.maxPixelRatio
			this.canvas.height = height * this.maxPixelRatio

			this.canvas.style.width = width + 'px'
			this.canvas.style.height = height + 'px'

			this.builtinUniforms.u_resolution[0] = width * this.maxPixelRatio
			this.builtinUniforms.u_resolution[1] = height * this.maxPixelRatio
		}

		this._canvasRectCache = this.canvas.getBoundingClientRect()

		if (this.state.match(/paused|stopped/)) {
			this.render()
		}

		return this
	}

	/**
	 * A throttled, debounced {@link _resize}.  Resizes the canvas to fill the container.
	 */
	resize = throttledDebounce(this._resize)

	render(): this {
		let then = 0

		const _render = (now: number) => {
			if (this.state === 'disposed') return
			if (!this.ctx) throw new Error('WebGL context lost.')

			now *= 0.001 // convert to seconds
			const elapsedTime = Math.min(now - then, 0.1)

			if (this._listeners.size) {
				this._emit(this.time, elapsedTime)
			}

			// Only update the time if the shader is running.
			if (this.state === 'running') {
				this.time += elapsedTime * this.speed
			}

			then = now

			this.mouseSmoothed.x +=
				(this.mouse.x - this.mouseSmoothed.x) * (1 - this.mouseSmoothing)
			this.mouseSmoothed.y +=
				(this.mouse.y - this.mouseSmoothed.y) * (1 - this.mouseSmoothing)

			this.builtinUniforms.u_mouse[0] = this.mouseSmoothed.x
			this.builtinUniforms.u_mouse[1] = this.mouseSmoothed.y

			// Tell WebGL how to convert from clip space to pixels.
			this.ctx.viewport(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

			// Tell it to use our program (pair of shaders).
			this.ctx.useProgram(this.program)

			const positionAttributeLocation = this._builtinUniformLocations.get('a_position')!
			const resolutionLocation = this._builtinUniformLocations.get('u_resolution')!
			const mouseLocation = this._builtinUniformLocations.get('u_mouse')!
			const timeLocation = this._builtinUniformLocations.get('u_time')!

			// Turn on the attribute.
			this.ctx.enableVertexAttribArray(positionAttributeLocation as number)

			// Bind the position buffer.
			this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this._positionBuffer)

			// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER).
			this.ctx.vertexAttribPointer(
				positionAttributeLocation as number,
				2, // 2 components per iteration
				this.ctx.FLOAT, // the data is 32bit floats
				false, // don't normalize the data
				0, // 0 = move forward size * sizeof(type) each iteration to get the next position
				0, // start at the beginning of the buffer
			)

			this.ctx.uniform2f(
				resolutionLocation,
				this.builtinUniforms.u_resolution[0],
				this.builtinUniforms.u_resolution[1],
			)
			this.ctx.uniform2f(
				mouseLocation,
				this.builtinUniforms.u_mouse[0],
				this.builtinUniforms.u_mouse[1],
			)
			this.ctx.uniform1f(timeLocation, this.builtinUniforms.u_time)

			for (const [key, value] of this._uniformLocations) {
				this._setUniform(this.ctx, value, this.uniforms[key])
			}

			this.ctx.drawArrays(
				this.ctx.TRIANGLES,
				0, // offset
				6, // num vertices to process
			)

			if (this.state === 'running') {
				requestAnimationFrame(_render)
			}
		}

		requestAnimationFrame(_render)

		return this
	}

	/**
	 * This method runs in the `mousemove` event listener on the canvas element, and:
	 * 1. Calculates the mouse position relative to the canvas.
	 * 1. Normalizes it to the range `[0, 1]`.
	 * 1. Applies the {@link mouseSmoothing|`mouseSmoothing`} factor.
	 * 1. Updates the `u_mouse` uniform.
	 */
	setMousePosition = (e: MouseEvent | Touch): void => {
		this.mouse.x = (e.clientX - this._canvasRectCache.left) / this._canvasRectCache.width
		this.mouse.y =
			(this._canvasRectCache.height - (e.clientY - this._canvasRectCache.top) - 1) /
			this._canvasRectCache.height
	}

	setTouchPosition = (e: TouchEvent): void => {
		e.preventDefault()
		this.setMousePosition(e.touches[0])
	}

	/**
	 * Listen for events emitted by the renderer.
	 * @param event The event to listen for.  Currently, only `'render'` is supported, which runs _before_ each render.
	 * @param listener The callback to run when the event is emitted.
	 */
	on = (event: 'render', listener: (data: { time: number; delta: number }) => void): this => {
		this._listeners.set(event, listener)
		return this
	}

	private _emit = (time: number, delta: number): void => {
		for (const [event, listener] of this._listeners) {
			switch (event) {
				case 'render':
					listener({ time, delta })
					break
			}
		}
	}

	compile() {
		this.ctx = this.canvas.getContext('webgl2')
		if (!this.ctx) throw new Error('WebGL2 context not found.')

		// Create / upload / compile the shaders.
		const vertex = this._createShader(this.ctx, this.ctx.VERTEX_SHADER, this.vertex)
		const fragment = this._createShader(this.ctx, this.ctx.FRAGMENT_SHADER, this.fragment)
		this.program = this._createProgram(this.ctx, vertex, fragment)

		this._builtinUniformLocations.set(
			'a_position',
			this.ctx.getUniformLocation(this.program, 'a_position')!,
		)
		this._builtinUniformLocations.set(
			'u_resolution',
			this.ctx.getUniformLocation(this.program, 'u_resolution')!,
		)
		this._builtinUniformLocations.set(
			'u_mouse',
			this.ctx.getUniformLocation(this.program, 'u_mouse')!,
		)
		this._builtinUniformLocations.set(
			'u_time',
			this.ctx.getUniformLocation(this.program, 'u_time')!,
		)

		if (this.opts.fragment) {
			this._validateUniforms(this.opts.fragment)
		}

		for (const key in this.uniforms) {
			this._uniformLocations.set(key, this.ctx.getUniformLocation(this.program, key)!)
		}

		// Create a buffer to put three 2d clip space points in.
		this._positionBuffer = this.ctx.createBuffer()
		this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this._positionBuffer)

		// Fill it with a 2 triangles that cover clipspace.
		this.ctx.bufferData(
			this.ctx.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
			this.ctx.STATIC_DRAW,
		)
	}

	getMouseTarget = (): HTMLElement | Window => {
		switch (this.opts.mouseTarget) {
			case 'container':
				return this.container ?? window
			case 'window':
				return window
			case 'canvas':
			default:
				return this.canvas
		}
	}

	private _setupCanvas(): void {
		if (!this.container) throw new Error('Container not found.')

		this.getMouseTarget().addEventListener('mousemove', this.setMousePosition as EventListener)
		this.getMouseTarget().addEventListener(
			'touchmove',
			this.setTouchPosition as EventListener,
			{
				passive: false,
			},
		)

		if (!Array.from(this.container.children).includes(this.canvas)) {
			this.container.appendChild(this.canvas)
		}

		window.addEventListener('resize', this.resize)
		window.addEventListener('scroll', this._updateRectCache)
	}

	private _updateRectCache = throttledDebounce((): void => {
		this._canvasRectCache = this.canvas.getBoundingClientRect()
	})

	private _createProgram(
		gl: WebGL2RenderingContext,
		vertex: WebGLShader,
		fragment: WebGLShader,
	): WebGLProgram {
		const program = gl.createProgram()!
		gl.attachShader(program, vertex)
		gl.attachShader(program, fragment)
		gl.linkProgram(program)

		const success = gl.getProgramParameter(program, gl.LINK_STATUS)

		if (success) return program

		console.error(gl.getProgramInfoLog(program))
		gl.deleteProgram(program)

		return false
	}

	private _createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
		const shader = gl.createShader(type)!
		gl.shaderSource(shader, source)
		gl.compileShader(shader)

		const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)

		if (success) return shader

		console.error('Failed to compile shader:')
		console.error({ type, source, this: this })
		console.error(gl.getShaderInfoLog(shader))
		gl.deleteShader(shader)

		return false
	}

	test = 0
	private _setUniform(
		ctx: WebGL2RenderingContext,
		location: WebGLUniformLocation | null,
		uniform: Uniform,
	) {
		if (location === null) return

		const { type, value } = uniform

		switch (type) {
			case 'float':
				ctx.uniform1f(location, value as number)
				break
			case 'vec2':
				ctx.uniform2fv(location, value as any as Float32Array)
				break
			case 'vec3':
				ctx.uniform3fv(location, value as any as Float32Array)
				break
			case 'vec4':
				ctx.uniform4fv(location, value as any as Float32Array)
				break
			case 'int':
				ctx.uniform1i(location, value as number)
				break
			default:
				throw new Error(`Unsupported uniform type: ${type}`)
		}
	}

	private _validateUniforms(source: string): { [key: string]: any } {
		const uniformRegex = /uniform\s+(\w+)\s+(\w+)\s*;/g

		let match
		while ((match = uniformRegex.exec(source)) !== null) {
			const [, , name] = match

			if (
				[...this._builtinUniformLocations.keys(), ...Object.keys(this.uniforms)].some(
					k => k === name,
				)
			) {
				// console.log('%cUniform found:', 'color:lightgreen', name)
				continue
			}

			throw new Error(`Uniform not found: ${name}`)
		}

		return this
	}

	private _cleanupListeners(): void {
		this.canvas.removeEventListener('mousemove', this.setMousePosition)
		this.canvas.removeEventListener('touchmove', this.setTouchPosition)
		window.removeEventListener('resize', this.resize)
		window.removeEventListener('scroll', this._updateRectCache)
		this._resizeObserver.disconnect()
		this._listeners.clear()
	}

	dispose() {
		this.state = 'disposed'

		this._cleanupListeners()

		this._builtinUniformLocations.clear()
		this._uniformLocations.clear()

		this.ctx?.getExtension('WEBGL_lose_context')?.loseContext()
		this.ctx = null

		this.canvas?.remove()
	}
}

/**
 * Creates a throttled, debounced version of a function.
 * @param fn - The function to throttle and debounce.
 * @param throttleMs - The time in milliseconds to wait in between calls.
 * @param debounceMs - The time in milliseconds to wait before running the function after the last call.
 * @returns A new function that will only run once every `throttleMs` milliseconds, and will wait `debounceMs` milliseconds after the last call before running.
 */
function throttledDebounce(
	/**
	 * The function to throttle and debounce.
	 */
	fn: (...args: any[]) => void,
	/**
	 * The time in milliseconds to wait in between calls.
	 * @defaultValue `50`
	 */
	throttleMs = 50,
	/**
	 * The time in milliseconds to wait before running the function after the last call.
	 * @defaultValue `75`
	 */
	debounceMs = 75,
): (...args: any[]) => void {
	let debounceTimeout: ReturnType<typeof setTimeout>
	let lastExecution = 0

	return function (...args: any[]) {
		const now = performance.now()
		clearTimeout(debounceTimeout)

		if (now - lastExecution >= throttleMs) {
			lastExecution = now
			fn(...args)
		}

		debounceTimeout = setTimeout(() => {
			fn(...args)
		}, debounceMs)
	}
}

function LogMethods(): ClassDecorator {
	return function (target: Function) {
		for (const key of Object.getOwnPropertyNames(target.prototype)) {
			const method = target.prototype[key]
			if (key !== 'constructor' && typeof method === 'function') {
				const color = hexColorHash(key)
				target.prototype[key] = function (...args: any[]) {
					if (import.meta.env?.DEV && !key.match(/_setUniform/)) {
						console.log(`%c${key}%c()`, `color:${color}`, `color:inherit`, {
							this: this,
						})
					}
					return method.apply(this, args)
				}
			}
		}
	}
}
