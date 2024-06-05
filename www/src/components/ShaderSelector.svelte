<script>
	import { PocketShader } from 'pocket-shader'
	import { onMount } from 'svelte'

	import fractalPyramid from '../shaders/fractalPyramid.frag?raw'
	import retro from '../shaders/retro.frag?raw'
	import bruh from '../shaders/bruh.frag?raw'
	import grid from '../shaders/grid.frag?raw'

	let ps

	const shaders = [
		{
			name: 'Grid',
			fragment: grid,
		},
		{
			name: 'Pyramid',
			fragment: fractalPyramid,
		},
		{
			name: 'Bruh',
			fragment: bruh,
		},
		// {
		// 	name: 'Retro',
		// 	fragment: retro,
		// },
	]

	$: active = shaders[0]

	onMount(() => {
		ps = new PocketShader({
			fragment: active.fragment,
			// fragment: bruh,
			autoStart: true,
			// uniforms: {
			//     u_time: { type: 'float', value: 0 },
			//     u_resolution: { type: 'vec2', value: [0, 0] },
			// },
		})

		// active
		return () => {
			ps.stop().dispose()
		}
	})

	function swap() {
		ps.stop().dispose()

		ps = new PocketShader({
			fragment: active.fragment,
			autoStart: true,
		})
	}
</script>

<div style="height:80vh" />

<select bind:value={active} on:change={() => swap()}>
	{#each shaders as shader}
		<option value={shader}>{shader.name}</option>
	{/each}
</select>

<style lang="scss">
	select {
		position: absolute;
		top: 1rem;
		right: 0;
		left: 0;
		margin: auto;
		width: 10rem;
		font-family: var(--font-a);
		z-index: 100;
		background: var(--bg-a);
		color: var(--fg-a);
	}
</style>
