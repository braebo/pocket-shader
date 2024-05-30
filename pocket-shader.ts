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
	vertexShader?: string

	/**
	 * The fragment shader source code.
	 */
	fragmentShader?: string

	/**
	 * When true, the mouse position will be updated on mousemove events and passed to the
	 * shader as `mouse`: `[number, number]`.
	 * @defaultValue `false`
	 */
	mouseEvents?: boolean

	/**
	 * When true, the touch position will be updated on touchmove events and passed to the
	 * shader as `mouse`: `[number, number]`.
	 * @defaultValue `false`
	 */
	touchEvents?: boolean

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
	 * Whether to create common shadertoy uniforms.
	 * @defaultValue `false`
	 */
	shadertoy?: boolean
}

const DEFAULT_UNIFORMS = {
	time: 0,
	resolution: [0, 0] as [number, number],
	mouse: [0, 0] as [number, number],
}

/**
 * A simple canvas-based shader renderer.
 *
 * @param container The element to append the canvas to.  Can be an HTMLElement or a string selector.
 */
export class PocketShader<T extends Record<string, any> = Record<string, any>> {
	/**
	 * The container for the canvas element is used to determine the size of the canvas.
	 */
	container: HTMLElement | null

	/**
	 * The canvas element used to render the shader.
	 */
	canvas: HTMLCanvasElement

	/**
	 * The WebGL2 rendering context.
	 */
	ctx: WebGL2RenderingContext | null = null

	/**
	 * The vertex shader used by this instance.
	 */
	vertexShader: string

	/**
	 * The fragment shader used by this instance.
	 */
	fragmentShader: string

	/**
	 * The maximum resolution multiplier, determined by the device pixel
	 * ratio by default.
	 */
	maxPixelRatio: number

	/**
	 * A time multiplier.
	 * @defaultValue `1`
	 */
	speed: number

	/**
	 * The current state of the renderer.
	 */
	state: 'running' | 'paused' | 'stopped' | 'disposed' = 'stopped'

	/**
	 * The options used to create this instance.
	 */
	opts: PocketShaderOptions<NoInfer<T>>

	/**
	 * The WebGL program used to render the shader.
	 */
	program: WebGLProgram | false = false

	builtinUniforms = {
		time: 0,
		resolution: [0, 0] as [number, number],
		mouse: [0, 0] as [number, number],
	}

	_time = 0
	get time() {
		return this._time
	}
	set time(value) {
		this._time = value
		this.builtinUniforms.time = value
	}

	/**
	 * The position buffer used to render the shader.
	 */
	private _positionBuffer: WebGLBuffer | null = null

	private _l: (...args: any[]) => void

	private _uniforms: { [K in keyof T]: T[K] }
	private _uniformLocations = new Map<string, WebGLUniformLocation>()

	/**
	 * A record of uniform values to pass to the shader.
	 */
	get uniforms() {
		// return this._uniforms
		return new Proxy(this._uniforms, {
			set: (target, property, value) => {
				// @ts-expect-error
				target[property] = value
				// Only manually re-render if the animation loop isn't running.
				if (this.state.match(/paused|stopped/)) {
					this._render()
				}
				return true
			},
		})
	}

	set uniforms(value: T) {
		this._uniforms = value
		//- This runs in the proxy now.
		// // Only manually re-render if the animation loop is paused.
		// if (this.state === 'paused') {
		// 	this.render()
		// }
	}

	constructor(options?: PocketShaderOptions<T>)
	constructor(
		/**
		 * The container element to append the canvas to.
		 * @defaultValue `document.body`
		 */
		container: HTMLElement | string,
		options?: PocketShaderOptions<T>,
	)
	constructor(
		arg1?: HTMLElement | string | PocketShaderOptions<T>,
		arg2?: PocketShaderOptions<T>,
	) {
		let container: HTMLElement | null
		let options: PocketShaderOptions<T> | undefined

		if (arg1 instanceof Element) {
			container = arg1
			options = arg2
		} else if (typeof arg1 === 'string') {
			container = document.querySelector(arg1)
			options = arg2
		} else {
			container = document.body
			options = arg1
		}

		if (options?.canvas) {
			this.canvas = options.canvas
			container = this.canvas.parentElement
		} else {
			this.canvas = document.createElement('canvas')
		}

		this.opts = options ?? {}
		this.speed = options?.speed ?? 1
		this.maxPixelRatio = options?.maxPixelRatio ?? (globalThis.window?.devicePixelRatio || 1)

		this.vertexShader =
			options?.vertexShader ??
			/*glsl*/ `
                attribute vec4 position;
                void main() {
                    gl_Position = position;
                }
            `

		this.fragmentShader =
			options?.fragmentShader ??
			/*glsl*/ `
                precision mediump float;
                uniform vec2 resolution;
                uniform vec2 mouse;
                uniform float time;
                void main() {
                    vec2 uv = gl_FragCoord.xy / resolution.xy;
                    gl_FragColor = vec4(uv, 0.5 + 0.5 * sin(time), 1.0);
                }
            `

		this._uniforms = options?.uniforms ?? ({} as T)

		this.container = container ?? document.body
		this._l = import.meta.env.DEV
			? (fn: string, ...args: any[]) => {
					const id = this.container?.id ?? ''
					const color = getColorFromId(id)
					console.log(`%c#${id} %c${fn}`, `color:${color}`, 'color:gray', ...args)
			  }
			: () => {}

		if (this.container instanceof HTMLBodyElement) {
			this.container = document.body
			const w = window.innerWidth
			const h = window.innerHeight
			this.canvas.style.setProperty('width', w + 'px')
			this.canvas.style.setProperty('height', h + 'px')
			this.canvas.style.setProperty('position', 'fixed')
			this.canvas.style.setProperty('inset', '0')
			this.canvas.style.setProperty('zIndex', '0')
		} else {
			this.canvas.style.setProperty('width', this.container.offsetWidth + 'px')
			this.canvas.style.setProperty('height', this.container.offsetHeight + 'px')
			this.canvas.style.setProperty('position', 'absolute')
			this.canvas.style.setProperty('inset', '0')
			this.canvas.style.setProperty('zIndex', '1')
		}

		this._setupCanvas()
		this.compile()

		if (options?.autoStart === true) {
			this.start()
		} else {
			this.resize()
		}
	}

	private _setupCanvas() {
		this._l('setupCanvas()')
		if (!this.container) throw new Error('Container not found.')

		if (this.opts.mouseEvents) {
			this.canvas.addEventListener('mousemove', this.setMousePosition)
		}
		if (this.opts.touchEvents) {
			this.canvas.addEventListener('touchmove', this.setTouchPosition, { passive: false })
		}

		if (!Array.from(this.container.children).includes(this.canvas)) {
			this.container.appendChild(this.canvas)
		}

		window.addEventListener('resize', this.resize)
	}

	private _removeListeners() {
		this._l('_removeListeners()')
		if (!this.container) throw new Error('Container not found.')

		if (this.opts.mouseEvents) {
			this.canvas.removeEventListener('mousemove', this.setMousePosition)
		}

		if (this.opts.touchEvents) {
			this.canvas.removeEventListener('touchmove', this.setTouchPosition)
		}

		window.addEventListener('resize', this.resize)
	}

	start() {
		this._l('start()')
		switch (this.state) {
			case 'stopped':
			case 'paused':
				this.state = 'running'
				this.resize()
				this._render()
				break
			case 'running':
				break
			case 'disposed':
				throw new Error('Cannot start a disposed PocketShader.  Call restart() instead.')
		}

		return this
	}

	pause() {
		this._l('pause()')
		this.state = 'paused'
		return this
	}

	stop() {
		this._l('stop()')
		this.state = 'stopped'
		this.time = 0

		return this
	}

	restart() {
		this._l('restart()')
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

	reload() {
		this._l('reload()')
		this.pause()
		this.state = 'disposed'
		this.canvas = this.canvas.cloneNode() as HTMLCanvasElement
		this.ctx?.getExtension('WEBGL_lose_context')?.loseContext()
		this.ctx = null
		this.state = 'paused'
		this.start()

		return this
	}

	resize = () => {
		this._l('resize()')
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

			this.builtinUniforms.resolution[0] = width * this.maxPixelRatio
			this.builtinUniforms.resolution[1] = height * this.maxPixelRatio
		}

		if (this.state.match(/paused|stopped/)) {
			this._render()
		}

		return this
	}

	setMousePosition = (e: MouseEvent | Touch) => {
		const rect = this.canvas.getBoundingClientRect()
		this.builtinUniforms.mouse[0] = e.clientX - rect.left
		// bottom is 0 in WebGL
		this.builtinUniforms.mouse[1] = rect.height - (e.clientY - rect.top) - 1
	}

	setTouchPosition = (e: TouchEvent) => {
		e.preventDefault()
		this.setMousePosition(e.touches[0])
	}

	createProgram(
		gl: WebGL2RenderingContext,
		vertexShader: WebGLShader,
		fragmentShader: WebGLShader,
	) {
		this._l('createProgram()')
		const program = gl.createProgram()!
		gl.attachShader(program, vertexShader)
		gl.attachShader(program, fragmentShader)
		gl.linkProgram(program)

		const success = gl.getProgramParameter(program, gl.LINK_STATUS)

		if (success) return program

		console.error(gl.getProgramInfoLog(program))
		gl.deleteProgram(program)

		return false
	}

	createShader(gl: WebGL2RenderingContext, type: number, source: string) {
		this._l('createShader()')
		const shader = gl.createShader(type)!
		gl.shaderSource(shader, source)
		gl.compileShader(shader)

		const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)

		if (success) return shader

		console.error(gl.getShaderInfoLog(shader))
		gl.deleteShader(shader)

		return false
	}

	_listeners = new Map<string, (data: { time: number; delta: number }) => void>()
	on = (event: 'render', listener: (data: { time: number; delta: number }) => void) => {
		this._listeners.set(event, listener)
	}

	emit = (time: number, delta: number) => {
		for (const [event, listener] of this._listeners) {
			switch (event) {
				case 'render':
					listener({ time, delta })
					break
			}
		}
	}

	private _builtinUniformLocations = new Map<string, WebGLUniformLocation>()

	compile() {
		this._l('compile()')
		this.ctx = this.canvas.getContext('webgl2')
		if (!this.ctx) throw new Error('WebGL2 context not found.')

		// Create / upload / compile the shaders.
		const vertexShader = this.createShader(this.ctx, this.ctx.VERTEX_SHADER, this.vertexShader)
		const fragmentShader = this.createShader(
			this.ctx,
			this.ctx.FRAGMENT_SHADER,
			this.fragmentShader,
		)
		this.program = this.createProgram(this.ctx, vertexShader, fragmentShader)

		this._builtinUniformLocations.set(
			'position',
			this.ctx.getUniformLocation(this.program, 'position')!,
		)
		this._builtinUniformLocations.set(
			'resolution',
			this.ctx.getUniformLocation(this.program, 'resolution')!,
		)
		this._builtinUniformLocations.set(
			'mouse',
			this.ctx.getUniformLocation(this.program, 'mouse')!,
		)
		this._builtinUniformLocations.set(
			'time',
			this.ctx.getUniformLocation(this.program, 'time')!,
		)

		if (this.opts.fragmentShader) {
			this._extractUniforms(this.opts.fragmentShader)
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

	private _render() {
		this._l('render()')
		let then = 0

		const render = (now: number) => {
			if (this.state === 'disposed') return
			if (!this.ctx) throw new Error('WebGL context lost.')

			now *= 0.001 // convert to seconds
			const elapsedTime = Math.min(now - then, 0.1)

			if (this._listeners.size) {
				this.emit(this.time, elapsedTime)
			}

			this.time += elapsedTime * this.speed
			then = now

			// Tell WebGL how to convert from clip space to pixels.
			this.ctx.viewport(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

			// Tell it to use our program (pair of shaders).
			this.ctx.useProgram(this.program)

			const positionAttributeLocation = this._builtinUniformLocations.get('position')!
			//// const positionAttributeLocation = this.ctx.getAttribLocation(this.program, 'position')
			const resolutionLocation = this._builtinUniformLocations.get('resolution')!
			const mouseLocation = this._builtinUniformLocations.get('mouse')!
			const timeLocation = this._builtinUniformLocations.get('time')!

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

			// this.ctx.uniform2f(resolutionLocation, this.ctx.canvas.width, this.ctx.canvas.height)
			this.ctx.uniform2f(
				resolutionLocation,
				this.builtinUniforms.resolution[0],
				this.builtinUniforms.resolution[1],
			)
			this.ctx.uniform2f(
				mouseLocation,
				this.builtinUniforms.mouse[0],
				this.builtinUniforms.mouse[1],
			)
			this.ctx.uniform1f(timeLocation, this.builtinUniforms.time)

			// todo - Dynamic uniforms instead?
			for (const [key, value] of this._uniformLocations) {
				this._setUniform(this.ctx, value, this.uniforms[key])
			}

			this.ctx.drawArrays(
				this.ctx.TRIANGLES,
				0, // offset
				6, // num vertices to process
			)

			if (this.state === 'running') {
				requestAnimationFrame(render)
			} else {
				this._l('render() - paused')
			}
		}

		requestAnimationFrame(render)

		return this
	}

	private _setUniform(
		ctx: WebGL2RenderingContext,
		location: WebGLUniformLocation | null,
		value: any,
	) {
		if (location === null) return

		if (typeof value === 'number') {
			ctx.uniform1f(location, value)
		} else if (Array.isArray(value)) {
			switch (value.length) {
				case 2:
					ctx.uniform2fv(location, new Float32Array(value))
					break
				case 3:
					ctx.uniform3fv(location, new Float32Array(value))
					break
				case 4:
					ctx.uniform4fv(location, new Float32Array(value))
					break
				default:
					throw new Error('Unsupported uniform value')
			}
		} else {
			throw new Error('Unsupported uniform type')
		}
	}

	private _extractUniforms(source: string): { [key: string]: any } {
		const uniformRegex = /uniform\s+(\w+)\s+(\w+)\s*;/g

		let match
		while ((match = uniformRegex.exec(source)) !== null) {
			const [, type, name] = match

			if (
				[...this._builtinUniformLocations.keys(), ...Object.keys(this.uniforms)].some(
					k => k === name,
				)
			) {
				console.log('%cSkipping', 'color:orange', name)
				continue
			}

			console.log('%cAdding', 'color:lightgreen', name)

			switch (type) {
				case 'int':
					// @ts-expect-error
					this.uniforms[name] = 0
					break
				case 'float':
					// @ts-expect-error
					this.uniforms[name] = 0
					break
				case 'vec2':
					// @ts-expect-error
					this.uniforms[name] = [0, 0]
					break
				case 'vec3':
					// @ts-expect-error
					this.uniforms[name] = [0, 0, 0]
					break
				case 'vec4':
					// @ts-expect-error
					this.uniforms[name] = [0, 0, 0, 0]
					break
				default:
					console.warn(`Unsupported uniform type: ${type}`)
			}
		}

		return this
	}

	dispose() {
		this._l('dispose()')
		this.state = 'disposed'
		this._removeListeners()

		this.ctx?.getExtension('WEBGL_lose_context')?.loseContext()
		this.ctx = null

		this.canvas?.remove()
	}
}

function getColorFromId(id: string): string {
	let hash = 0
	for (let i = 0; i < id.length; i++) {
		hash = id.charCodeAt(i) + ((hash << 5) - hash)
	}
	let color = '#'
	for (let i = 0; i < 3; i++) {
		const value = (hash >> (i * 8)) & 0xff
		color += ('00' + value.toString(16)).substr(-2)
	}
	return color
}
