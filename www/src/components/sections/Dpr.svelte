<script lang="ts">
	import fragmentShader from '../../shaders/dyingUniverse.glsl?raw'
	import { PocketShader } from 'pocket-shader'
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
			fragmentShader,
			maxPixelRatio: dpr,
			autoStart: true,
		})
	}

	function dispose() {
		ps?.dispose()
		ps = null
	}
</script>

<slot name="code" />

<button class="btn" class:active={!disabled} on:click={run}>{disabled ? 'Run' : 'Dispose'}</button>

<p><code>{dpr.toFixed(1)}</code></p>

<Range min={0.1} max={2} bind:value={dpr} />

<!-- <input type="range" min="1" max="20" bind:value={dpr} /> -->

<!-- 
<style lang="scss">
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
