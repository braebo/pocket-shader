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
<!-- <input type="range" min="1" max="20" bind:value={speed} /> -->

<!-- <style lang="scss">
	input:disabled {
		opacity: 0.5;
		filter: grayscale(1) brightness(0.5);
		cursor: not-allowed;
	}

	$height: 1rem;

	input[type='range'] {
		-webkit-appearance: none;
		width: 20rem;
		height: $height;
		margin: auto;
		
		transition: opacity 0.2s;
		border-radius: $height;
	}

	@mixin thumb {
		-webkit-appearance: none;
		appearance: none;
		width: $height / 4;
		height: $height;
		background: var(--theme-a);
		cursor: pointer;
		transform: translateY(-1px);
		z-index: 1;
	}

	@mixin track {
		width: 100%;
		height: $height;
		cursor: pointer;
		background-color: var(--bg-c);
		border-radius: $height;
		border-radius: 0.5rem;
		outline: 1px solid var(--bg-a);
		border: 1px solid var(--bg-a);
	}

	input[type='range']::-webkit-slider-thumb {
		@include thumb;
	}
	input[type='range']::-moz-range-thumb {
		@include thumb;
	}
	input[type='range']::-webkit-slider-runnable-track {
		@include track;
	}
	input[type='range']::-moz-range-track {
		@include track;
	}
</style> -->
