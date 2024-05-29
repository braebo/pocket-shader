import { createProgram, createShader, resizeCanvasToDisplaySize } from './utils'
import vert from './shaders/vert.glsl?raw'

export function render(
	/** Main shader canvas. */
	canvas: HTMLCanvasElement,
	/** Fragment Shader */
	fs: string,
) {
	const gl = canvas.getContext('webgl2')
	if (!gl) throw new Error('WebGL2 context not found.')

	// Create GLSL shaders, upload the GLSL source, compile the shaders.
	const vertexShader = createShader(gl, gl.VERTEX_SHADER, vert)
	const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fs)

	// Link the two shaders into a program.
	const program = createProgram(gl, vertexShader, fragmentShader)

	// Look up where the vertex data needs to go.
	const positionAttributeLocation = gl.getAttribLocation(program, 'a_position')

	// Look up uniform locations.
	const resolutionLocation = gl.getUniformLocation(program, 'iResolution')
	const mouseLocation = gl.getUniformLocation(program, 'iMouse')
	const timeLocation = gl.getUniformLocation(program, 'iTime')

	// Create a buffer to put three 2d clip space points in.
	const positionBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

	// Fill it with a 2 triangles that cover clipspace.
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([
			-1,
			-1, // first triangle
			1,
			-1,
			-1,
			1,
			-1,
			1, // second triangle
			1,
			-1,
			1,
			1,
		]),
		gl.STATIC_DRAW,
	)

	let mouseX = 0
	let mouseY = 0

	function setMousePosition(e: MouseEvent | Touch) {
		const rect = canvas.getBoundingClientRect()
		mouseX = e.clientX - rect.left
		mouseY = rect.height - (e.clientY - rect.top) - 1 // bottom is 0 in WebGL
	}

	canvas.addEventListener('mousemove', setMousePosition)
	canvas.addEventListener(
		'touchmove',
		(e) => {
			e.preventDefault()
			setMousePosition(e.touches[0])
		},
		{ passive: false },
	)

	let then = 0
	let time = 0
	function render(now: number) {
		if (!gl) throw new Error('WebGL context lost.')

		now *= 0.001 // convert to seconds
		const elapsedTime = Math.min(now - then, 0.1)
		time += elapsedTime
		then = now

		resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement)

		// Tell WebGL how to convert from clip space to pixels.
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

		// Tell it to use our program (pair of shaders).
		gl.useProgram(program)

		// Turn on the attribute.
		gl.enableVertexAttribArray(positionAttributeLocation)

		// Bind the position buffer.
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

		// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER).
		gl.vertexAttribPointer(
			positionAttributeLocation,
			2, // 2 components per iteration
			gl.FLOAT, // the data is 32bit floats
			false, // don't normalize the data
			0, // 0 = move forward size * sizeof(type) each iteration to get the next position
			0, // start at the beginning of the buffer
		)

		gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height)
		gl.uniform2f(mouseLocation, mouseX, mouseY)
		gl.uniform1f(timeLocation, time)

		gl.drawArrays(
			gl.TRIANGLES,
			0, // offset
			6, // num vertices to process
		)

		requestAnimationFrame(render)
	}

	requestAnimationFrame(render)
}
