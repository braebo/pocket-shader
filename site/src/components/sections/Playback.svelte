<script lang="ts">
	import { PocketShader } from 'pocket-shader'

	let ps: PocketShader | null = null
	let state = ''
	let t = ''

	$: disabled = !state || state === 'disposed' || ps === null

	function run() {
		if (!disabled) return dispose()

		ps = new PocketShader('#codeblock4', {
			speed: 4,
		})

		ps.on('render', ({ time }) => {
			t = time.toFixed(2)
		})

		update()
	}

	function dispose() {
		ps?.dispose()
		ps = null
		update()
	}

	function start() {
		ps?.start()
		update()
	}

	function stop() {
		ps?.stop()
		t = '0.00'
		update()
	}

	function pause() {
		ps?.pause()
		update()
	}

	function update() {
		state = ps?.state ?? ''
	}
</script>

<slot name="code" />

<button class="btn" on:click={run}>{disabled ? 'Run' : 'Dispose'}</button>

<div class="kv" class:disabled>
	<div class="key"><code>ps.state</code></div>
	<div class="value" class:disabled>{state}</div>
</div>

<div class="kv" class:disabled>
	<div class="key"><code>ps.time</code></div>
	<div class="value" class:disabled>{t}</div>
</div>

<div class="flex">
	<button class="code gradient-outline" {disabled} on:click={start}>ps.start()</button>
	<button class="code gradient-outline" {disabled} on:click={pause}>ps.pause()</button>
	<button class="code gradient-outline" {disabled} on:click={stop}>ps.stop()</button>
</div>

<style lang="scss">
	.kv {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 11rem;
		margin: auto;
		outline: var(--outline);
		border-radius: var(--radius);
		overflow: hidden;
		height: 1.75rem;

		div {
			display: flex;
			justify-content: center;
			align-items: center;
			flex: 1fr;

			line-height: 1.75rem;
		}

		.value {
			margin: auto;
		}
	}

	.flex {
		display: flex;
		gap: 1rem;
		width: fit-content;
		margin: auto;
	}

	button.code {
		color: var(--fg-a);
		font-variation-settings: 'wght' 300;
		font-size: var(--font-sm);
		position: relative;

		padding: 0.25rem 0.5rem;
	}

	.disabled,
	button:disabled {
		opacity: 0.5;
		filter: grayscale(1) brightness(0.5);
		cursor: not-allowed;

		&::before {
			display: none;
		}
	}
</style>
