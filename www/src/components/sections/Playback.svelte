<script lang="ts">
	import { PocketShader } from 'pocket-shader'
	import Example from '../Example.svelte'

	export let id: string

	let ps: PocketShader | null = null
	let state = ''
	let t = ''
	let stateTextEl: HTMLDivElement

	$: disabled = !state || state === 'disposed' || ps === null

	function run() {
		if (!disabled) return dispose()

		ps = new PocketShader(id, {
			speed: 4,
		})

		ps.on('render', ({ time }) => {
			t = time.toFixed(2)
		})

		ps.start()

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

	async function update() {
		state = ps?.state ?? ''
	}
</script>

<span><slot /></span>

<Example id="noop" on:toggle={run} />

<div class="controls">
	<div class="flex">
		<button
			class="code plain"
			class:gradient-outline={!disabled && state !== 'running'}
			class:active={state === 'running'}
			disabled={disabled || state === 'running'}
			on:click={start}
			><span class="g-blue">ps</span>.<span class="g-red">start</span>()</button
		>
		<button
			class="code plain"
			class:gradient-outline={!disabled && state !== 'paused'}
			class:active={state === 'paused'}
			disabled={disabled || state !== 'running'}
			on:click={pause}
			><span class="g-blue">ps</span>.<span class="g-red">pause</span>()</button
		>
		<button
			class="code plain"
			class:gradient-outline={!disabled && state !== 'stopped'}
			class:active={state === 'stopped'}
			disabled={disabled || state !== 'running'}
			on:click={stop}><span class="g-blue">ps</span>.<span class="g-red">stop</span>()</button
		>
	</div>

	<div>
		<div class="kv" class:disabled>
			<div class="key">
				<code class="plain">
					<span class="g-blue">ps</span>
					.
					<span class="">state</span>
				</code>
			</div>
			<div class="value" class:disabled bind:this={stateTextEl}>{state}</div>
		</div>

		<div class="kv" class:disabled>
			<div class="key">
				<code class="plain">
					<span class="g-blue">ps</span>
					.
					<span class="">time</span>
				</code>
			</div>
			<div class="value" class:disabled>{t}</div>
		</div>
	</div>
</div>

<style lang="scss">
	.kv {
		display: flex;
		align-items: center;
		justify-content: space-between;

		width: 11rem;
		height: 1.75rem;
		margin: auto;

		border-radius: 0.15rem;
		overflow: hidden;

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
			width: 5rem;

			color: var(--fg-b);
			background: none;
			border-radius: 0.1rem;
			margin-left: 1px;
			filter: saturate(0.7);
			outline-color: var(--bg-c);
			// outline: none;

			font-variation-settings: 'wght' 100;
		}

		.value {
			margin: auto;
		}
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		width: fit-content;
		margin: 0 auto;
		margin-top: -0.5rem;
		padding: 1rem;

		background: color-mix(in lch, var(--bg-b), transparent 70%);
		backdrop-filter: blur(3px);
		border-radius: 0.5rem;
		outline: 1px solid var(--bg-c);
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
		cursor: default;
		pointer-events: none;

		&::before {
			display: none;
		}
	}

	button.code {
		position: relative;

		padding: 0.25rem 0.5rem;

		color: var(--fg-a) !important;
		background: var(--bg-a);
		border-radius: 0.5rem;

		font-variation-settings: 'wght' 300;
		font-size: var(--font-sm);
	}
</style>
