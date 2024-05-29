/**
 * Creates and mounts a canvas element to the DOM.
 * @param target The element to append the canvas to.
 */
export function createCanvas(target = document.body) {
	const canvas = document.createElement('canvas')

	canvas.width = target.offsetWidth
	canvas.height = target.offsetHeight

	target.appendChild(canvas)

	window.addEventListener('resize', () => {
		resizeCanvasToDisplaySize(canvas)
	})

	return canvas
}

export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, multiplier = 1) {
	const width = canvas.clientWidth * multiplier
	const height = canvas.clientHeight * multiplier

	if (canvas.width !== width || canvas.height !== height) {
		canvas.width = width
		canvas.height = height

		return true
	}

	return false
}

export function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
	const shader = gl.createShader(type)!
	gl.shaderSource(shader, source)
	gl.compileShader(shader)

	const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)

	if (success) return shader

	console.error(gl.getShaderInfoLog(shader))
	gl.deleteShader(shader)

	return false
}

export function createProgram(
	gl: WebGL2RenderingContext,
	vertexShader: WebGLShader,
	fragmentShader: WebGLShader,
) {
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
