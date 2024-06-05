<!-- 
    @component
    An interactive, fullscreen background shader.
 -->

<script lang="ts">
	import { gridColor } from '../utils/gridColor'
	import { PocketShader } from 'pocket-shader'
	import grid from '../shaders/grid.frag?raw'
	import { onMount } from 'svelte'

	let ps: PocketShader

	$: if (ps) {
		ps.uniforms.u_color.value = $gridColor
	}

	onMount(() => {
		ps = new PocketShader({
			autoStart: true,
			fragment: grid,
			mouseListener: 'window',

			uniforms: {
				u_parallax: { type: 'float', value: 0 },
				u_greyscale: { type: 'float', value: 0 },
				u_color: { type: 'vec3', value: $gridColor },
			},
		})

		return () => ps.stop().dispose()
	})
</script>

<svelte:window
	on:scroll={() =>
		ps &&
		// todo - really need to expose resolution lol
		(ps.uniforms.u_parallax.value = (window.scrollY / ps.canvas.height) * ps.maxPixelRatio)}
/>
