<script lang="ts">
	import fragmentShader from '../../shaders/clouds.glsl?raw'
	import { fadeText } from '../../utils/animations.ts'
	import { PocketShader } from 'pocket-shader'

	export let id: string

	let ps: PocketShader | null = null
	let btnEl: HTMLButtonElement
	let t = ''

	$: disabled = !ps?.state || ps.state === 'disposed' || ps === null

	function run() {
		if (!disabled) return dispose()

		ps = new PocketShader(id, {
			autoStart: true,
			speed: 1,
			fragmentShader,
		})

		ps.on('render', ({ time }) => {
			t = time.toFixed(2)
		})
		fadeText(btnEl, 'Dispose')
	}

	function dispose() {
		ps?.dispose()
		ps = null
		fadeText(btnEl, 'Run')
	}
</script>

<section>
	<p>
		Bundlers like <code>vite</code> make it easy to import your shaders directly from
		<code>.glsl</code> files.
	</p>

	<slot name="code4" />

	<button class="btn" bind:this={btnEl} class:active={!disabled} on:click={run}>Run</button>
</section>
