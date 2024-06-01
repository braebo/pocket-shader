<script lang="ts">
	import { PocketShader } from 'pocket-shader'
	import Range from '../Range.svelte'

	export let smoothing = 0.1
	export let id: string

	let ps: PocketShader | null = null
	let state = ''
	let t = ''

	$: if (ps) ps.mouseSmoothing = smoothing
	$: disabled = !ps?.state || ps.state === 'disposed' || ps === null

	function run() {
		if (!disabled) return dispose()

		ps = new PocketShader(id, {
			autoStart: true,
			mouseSmoothing: smoothing,
			fragment: /*glsl*/ `#version 300 es
				in vec2 vUv;
				out vec4 fragColor;

				uniform vec2 u_resolution;
				uniform vec2 u_mouse;
				uniform float u_time;

				void main() {
					float size = 1000.1;
					float glow = 0.10;

					vec2 uv = vUv * u_resolution;
					vec2 mousePos = u_mouse * u_resolution;

					float dist = length(uv - mousePos);
					float circle = smoothstep(size, size - 0.1, dist);
					float glowEffect = exp(-dist * glow);

					fragColor = vec4(vec3(circle * glowEffect), 1.0);
			}`,
		})

		ps.on('render', ({ time }) => {
			t = time.toFixed(2)
		})
	}

	function dispose() {
		ps?.dispose()
		ps = null
	}
</script>

<slot name="code" />

<button class="btn" class:active={!disabled} on:click={run}>{disabled ? 'Run' : 'Dispose'}</button>

<p><code>{smoothing.toFixed(2)}</code></p>

<Range min={0} max={1} step={0.001} bind:value={smoothing} />
