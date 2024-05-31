<script>
	export let value = 1
	export let min = 0
	export let max = 1
	export let step = 0.1
</script>

<input type="range" {min} {max} {step} bind:value />

<style lang="scss">
	input:disabled {
		opacity: 0.5;
		filter: grayscale(1) brightness(0.5);
		cursor: not-allowed;
	}

	$height: 1.25rem;

	input[type='range'] {
		-webkit-appearance: none;
		width: 20rem;
		height: $height;
		margin: auto;

		transition: opacity 0.2s;
		border-radius: $height;

		&:hover {
			filter: brightness(1.1);
		}
	}

	@mixin thumb {
		-webkit-appearance: none;
		appearance: none;
		width: calc($height / 3);
		height: $height;
		background: linear-gradient(to top, var(--theme-a, #33c5f4) 50%, #000 84%);
		cursor: pointer;
		z-index: 1;
	}

	@mixin track {
		width: 100%;
		height: $height;
		cursor: pointer;
		background-color: var(--bg-c);
		box-shadow:
			0 3px 1px #0008 inset,
			0 2px 5px #0007 inset,
			0 1px 6px #0006 inset;
		border-radius: 0.4rem;
		overflow: hidden;
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
</style>
