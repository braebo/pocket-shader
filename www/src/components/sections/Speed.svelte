<script lang="ts">
	import { PocketShader } from 'pocket-shader'
	import Range from '../Range.svelte'

	export let speed = 10
	export let id: string

	let ps: PocketShader | null = null
	let state = ''
	let t = ''

	$: if (ps) ps.speed = speed
	$: disabled = !ps?.state || ps.state === 'disposed' || ps === null

	function run() {
		if (!disabled) return dispose()

		ps = new PocketShader(id, {
			autoStart: true,
			speed,
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

<p><code>{speed.toFixed(2)}</code></p>

<Range min={1} max={20} step={1} bind:value={speed} />
