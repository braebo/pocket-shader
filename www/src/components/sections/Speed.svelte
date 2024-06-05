<script lang="ts">
	import { PocketShader } from 'pocket-shader'
	import Example from '../Example.svelte'
	import Range from '../Range.svelte'

	export let speed = 10
	export let id: string

	let ps: PocketShader | null = null
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

<span><slot /></span>

<Example id="noop" on:toggle={run} />

<p><code>{speed.toFixed(2)}</code></p>

<Range min={1} max={20} step={1} bind:value={speed} />
