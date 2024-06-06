<script lang="ts">
	import Copy from './Copy.svelte'

	let hovering = false
</script>

<main>
	<br />

	<h1 class="hero-text text-gradient-animated">Pocket Shader</h1>

	<p class="description">A pocket-sized javascript library for easy WebGL shader rendering.</p>

	<br />
	<div
		class="install-wrapper"
		on:pointerover={() => (hovering = true)}
		on:pointerout={() => (hovering = false)}
	>
		<code class="install plain gradient-outline">
			<div style="color:#e24e69">npx</div>
			<div class="jsr-add" style="color:#d1d1d1">jsr add</div>
			<div class="namespace">
				<span class="braebo text-gradient">@braebo</span>
				<span class="slash">/</span>
				<span class="pocket-shader text-gradient">pocket-shader</span>
				<br />
			</div>
		</code>

		<span class="copy">
			<Copy
				text="npx jsr add @braebo/pocket-shader"
				--bg-active="transparent"
				--bg-hover="transparent"
				--blur="0"
				style="
					box-sizing: border-box;
					position: absolute;
					inset: 0;
					margin: 0;
					padding: .6rem;
					width: 100%;
					height: 100%;
				"
			/>
		</span>
	</div>
</main>

<style lang="scss">
	.hero-text {
		margin: 0 auto;
		font-size: 5.5rem;
		padding: 0 1rem;
		letter-spacing: -3px;
	}

	.description {
		position: relative;

		box-sizing: border-box;
		padding: 1rem;
		padding-top: 1.25rem;
		padding-bottom: 2.25rem;
		max-width: 27rem;

		// background: var(--bg-b);
		border-radius: var(--radius);

		text-wrap: balance;

		font-size: 1.15rem;
		font-variation-settings: 'wght' 200;
		letter-spacing: 0.3px;
		word-spacing: 2px;
	}

	.install-wrapper {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;

		width: fit-content;
		height: fit-content;
		margin: auto;

		background: var(--bg-b);
		border-radius: 0.2rem;

		transform: translate3d(0, -1rem, -1rem);
	}

	code.install {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;

		padding: 0.75rem 1.5rem;
		margin: auto;

		background: color-mix(in lch, var(--bg-a), var(--bg-b) 75%);
		border-radius: 1rem;
		outline: none;

		font-size: var(--font-sm);
		font-size: 1rem;
		transition: opacity 0.2s;

		@media (max-width: 600px) {
			gap: 0.5rem;
			white-space: nowrap;
			font-size: min(1.1rem, 3.5vw);
		}

		&::before {
			inset: unset;
			animation: none;
			background-image: linear-gradient(to right, #111, #111, #222, #292929, #111);
			box-shadow:
				0 3px 5px #0004,
				0 5px 10px #0002,
				0 10px 20px #0001;
		}

		div {
			filter: saturate(0.75);
		}
	}

	.jsr-add {
		margin: 0 0.75rem;
		opacity: 0.75;
	}

	.namespace {
		display: flex;
	}

	.braebo {
		display: inline-block;
		background-image: linear-gradient(to right, #0094b5, #4f6bff);
		/* firefox fallback */
		color: rgb(65, 143, 221);
	}
	.slash {
		color: #7037ff;
	}
	.pocket-shader {
		display: inline-block;
		background-image: var(--ps-gradient);
		/* firefox fallback */
		color: #7037ff;
	}

	.copy {
		position: absolute;
		inset: 0;

		width: 100%;
		height: 100%;

		color: var(--fg-a);
		background: transparent;
		border-radius: 1rem;
		opacity: 0;

		font-family: var(--font-mono);

		backdrop-filter: blur(0px);
		transition:
			opacity 0.2s,
			backdrop-filter 0.2s;

		z-index: 2;
	}

	.install-wrapper:hover {
		div {
			cursor: pointer;
			z-index: 0;
		}

		code.install {
			background: var(--bg-a);

			&::before {
				box-shadow:
					0 3px 5px #0004,
					0 5px 10px #0002,
					0 10px 20px #0001;
			}
		}

		.copy {
			pointer-events: all;
			opacity: 1;
			z-index: 1;
			backdrop-filter: blur(2px);
		}
	}

	:global(.icon.copy:not(.active) .back) {
		transition-duration: 0.5s;
		transition-delay: 0.1s;
		transform: translate(15%, 15%);
	}
	:global(.install-wrapper:hover .icon.copy:not(.active) .back) {
		transform: translate(0, 0) scale(0.9);
	}
</style>
