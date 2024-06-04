<script lang="ts">
	import fragment from '../shaders/retro.frag?raw'
	import { PocketShader } from 'pocket-shader'
	import { onMount } from 'svelte'

	onMount(() => {
		const ps = new PocketShader({
			uniforms: {
				u_timeDelta: { type: 'float', value: 0 },
				// u_audioData: { type: 'float32Array', value: new Float32Array(16) },
			},
			fragment,
		})

		ps.on('render', ({ delta }) => {
			ps.uniforms.u_timeDelta.value = delta
		})
	})
</script>

<div>
	<h1>Retro</h1>

	<div id="retro-canvas"></div>
</div>

<style lang="scss">
	#retro-canvas {
		width: 100%;
		height: 100vh;
	}
</style>
