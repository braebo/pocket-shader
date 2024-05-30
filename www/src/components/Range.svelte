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
		width: calc($height / 4);
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
</style>
