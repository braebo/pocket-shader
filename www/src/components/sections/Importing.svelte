<script lang="ts">
	import fragment from '../../shaders/clouds.glsl?raw'
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
			fragment,
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

<span><slot /></span>

	<button class="btn" bind:this={btnEl} class:active={!disabled} on:click={run}>Run</button>
</section>
