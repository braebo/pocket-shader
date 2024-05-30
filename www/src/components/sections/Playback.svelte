<script lang="ts">
	import { fadeOutUp, fadeInUp, fadeText } from '../../utils/animations.ts'
	import { PocketShader } from 'pocket-shader'

	export let id: string

	let ps: PocketShader | null = null
	let state = ''
	let t = ''
	let stateTextEl: HTMLDivElement
	let btnEl: HTMLButtonElement

	$: disabled = !state || state === 'disposed' || ps === null

	function run() {
		if (!disabled) return dispose()

		ps = new PocketShader(id, {
			speed: 4,
		})

		ps.on('render', ({ time }) => {
			t = time.toFixed(2)
		})

		update()
		fadeText(btnEl, 'Dispose')
	}

	function dispose() {
		fadeText(btnEl, 'Run')
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

	async function update() {
		await fadeOutUp(stateTextEl)
		state = ps?.state ?? ''
		fadeInUp(stateTextEl)
	}
</script>

<slot name="code" />

<button bind:this={btnEl} class="btn" class:active={!disabled} on:click={run}>Run</button>

<div class="flex">
	<button
		class="code"
		class:gradient-outline={!disabled && state !== 'running'}
		class:active={state === 'running'}
		disabled={disabled || state === 'running'}
		on:click={start}>ps.start()</button
	>
	<button
		class="code"
		class:gradient-outline={!disabled && state !== 'paused'}
		class:active={state === 'paused'}
		disabled={disabled || state !== 'running'}
		on:click={pause}>ps.pause()</button
	>
	<button
		class="code"
		class:gradient-outline={!disabled && state !== 'stopped'}
		class:active={state === 'stopped'}
		disabled={disabled || state !== 'running'}
		on:click={stop}>ps.stop()</button
	>
</div>

<div>
	<div class="kv" class:disabled>
		<div class="key"><code>ps.state</code></div>
		<div class="value" class:disabled bind:this={stateTextEl}>{state}</div>
	</div>
	<div class="kv" class:disabled>
		<div class="key"><code>ps.time</code></div>
		<div class="value" class:disabled>{t}</div>
	</div>
</div>

<style lang="scss">
	.kv {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 11rem;
		margin: auto;
		// outline: var(--outline);
		border-radius: 0.15rem;
		overflow: hidden;
		height: 1.75rem;

		&:first-of-type {
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
		}

		&:last-of-type {
			border-top-left-radius: 0;
			border-top-right-radius: 0;
		}

		div {
			display: flex;
			justify-content: center;
			align-items: center;
			flex: 1fr;

			line-height: 1.75rem;
		}

		.key,
		.key code {
			border-radius: 0;
			width: 5.5rem;
			font-variation-settings: 'wght' 100;
			color: var(--fg-b);
			background: none;
			outline: none;
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

	.disabled,
	button:disabled {
		opacity: 0.5;
		// filter: grayscale(1) brightness(0.5);
		cursor: default;
		pointer-events: none;

		&::before {
			display: none;
		}
	}

	button.code {
		color: var(--fg-a) !important;
		font-variation-settings: 'wght' 300;
		font-size: var(--font-sm);
		position: relative;
		background: var(--bg-a);
		border-radius: 0.5rem;

		padding: 0.25rem 0.5rem;

		&.active {
			// color: var(--bg-a);
			// --theme-a: #30d84c;
			// --theme-b: #ff0051;
			// background-position: 25% 50%;
			// background: linear-gradient(
			// 	var(--deg, 45deg),
			// 	var(--theme-a, #33c5f4),
			// 	var(--theme-b, #a269cb) 100%
			// );
			// outline: var(--gradient);
		}
	}
</style>
