<script lang="ts">
	import fragment from '../../shaders/dyingUniverse.glsl?raw'
	import { fadeText } from '../../utils/animations.ts'
	import { PocketShader } from 'pocket-shader'
	import Range from '../Range.svelte'

	export let dpr: number
	export let id: string

	let ps: PocketShader | null = null
	let btnEl: HTMLButtonElement

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

		fadeText(btnEl, 'Dispose')
	}

	function dispose() {
		ps?.dispose()
		ps = null
		fadeText(btnEl, 'Run')
	}
</script>

<slot name="code" />

<button class="btn" bind:this={btnEl} class:active={!disabled} on:click={run}>
	{disabled ? 'Run' : 'Dispose'}
</button>

<p><code>{dpr.toFixed(1)}</code></p>

<Range min={0.1} max={2} bind:value={dpr} />
