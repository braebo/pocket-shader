<script lang="ts">
	import fragment from '../../shaders/dyingUniverse.glsl?raw'
	import { PocketShader } from 'pocket-shader'
	import Example from '../Example.svelte'
	import Range from '../Range.svelte'

	export let dpr: number
	export let id: string

	let ps: PocketShader | null = null

	$: if (dpr && ps) {
		ps.maxPixelRatio = dpr
		ps.resize()
	}
	$: disabled = !ps?.state || ps.state === 'disposed' || ps === null

	function run() {
		if (!disabled) return dispose()

		ps = new PocketShader(id, {
			fragment,
			maxPixelRatio: dpr,
			autoStart: true,
		})
	}

	function dispose() {
		ps?.dispose()
		ps = null
	}
</script>

<span><slot /></span>

<Example id="noop" on:toggle={run} />

<p><code>{dpr.toFixed(1)}</code></p>

<Range min={0.1} max={2} bind:value={dpr} />
