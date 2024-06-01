<script lang="ts">
	import { PocketShader } from 'pocket-shader'
	import { fadeText } from '../../utils/animations.ts'

	export let id: string

	let btnEl: HTMLButtonElement
	let ps: PocketShader | null = null
	$: disabled = !ps?.state || ps.state === 'disposed' || ps === null

	function run() {
		if (!disabled) return dispose()

		ps = new PocketShader(id, {
			autoStart: true,
			fragment: /*glsl*/ `#version 300 es
                // These 3 uniforms are always available. // [!code highlight]
                uniform float u_time;
                uniform vec2 u_mouse;
                uniform vec2 u_resolution;

                in vec2 vUv;
                out vec4 color;

                void main() {
                  vec2 p = vUv - 0.5, m = u_mouse - 0.5;
                  float a = atan(p.y, p.x) - atan(m.y, m.x);
                  float c = 0.5 + 0.5 * cos(a);
                  color = vec4(c, m.x + 0.5 * c, m.y + 0.5 * c, 1.0);
                }
            `,
		})

		ps.mouse = { x: 0.51, y: 0.1 }
		fadeText(btnEl, 'Dispose')
	}

	function dispose() {
		ps?.dispose()
		ps = null
		fadeText(btnEl, 'Run')
	}
</script>

<span><slot /></span>

<button class="btn" bind:this={btnEl} class:active={!disabled} on:click={run}>Run</button>
