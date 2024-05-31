<script lang="ts">
	import Copy from './Copy.svelte'

	let hovering = false
</script>

<div style="height:3rem"></div>
<h1 class="hero-text text-gradient-animated">Pocket Shader</h1>

<p class="description gradient-outline">
	A typescript package that makes it easy to render WebGL shaders.
</p>

<div
	class="install-wrapper"
	on:pointerover={() => (hovering = true)}
	on:pointerout={() => (hovering = false)}
>
	<code class="install">
		<div style="color:#cf8f8f">npx</div>
		<div style="color:#dcdca5">jsr add</div>
		<div class="text-gradient">@braebo/pocket-shader</div>
		<br />
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
					padding: .5rem;
					width: 100%;
					height: 100%;
				"
		/>
	</span>
</div>

<style lang="scss">
	.hero-text {
		margin: 2rem auto 1rem auto;
		font-size: 5rem;
		padding: 0 1rem;
	}

	.description {
		position: relative;

		box-sizing: border-box;
		padding: 1rem;
		padding-top: 1.25rem;
		padding-bottom: 2.25rem;

		background: var(--bg-b);
		border-radius: var(--radius);

		text-wrap: balance;
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
		gap: 0.75rem;

		padding: 0.5rem 0.75rem;
		margin: auto;

		background: var(--bg-b);
		outline: none;

		font-size: var(--font-sm);
		transition: opacity 0.2s;
	}

	/* firefox fallback */
	.text-gradient {
		color: rgb(65, 143, 221);
	}

	.copy {
		position: absolute;
		inset: 0;

		width: 100%;
		height: 100%;

		color: var(--fg-a);
		background: transparent;
		opacity: 0;

		font-family: var(--font-mono);

		transition: opacity 0.2s;
		z-index: 2;
	}

	.install-wrapper:hover {
		code {
			opacity: 0.25;
		}
		div {
			cursor: pointer;
			z-index: 0;
		}

		.copy {
			pointer-events: all;
			opacity: 1;
			z-index: 1;
		}
	}

	:global(.icon.copy:not(.active) .back) {
		transition-duration: 0.5s;
		transition-delay: 0.1s;
		transform: translate(15%, 15%);
	}
	:global(.install-wrapper:hover .icon.copy:not(.active) .back) {
		transform: translate(0, 0);
	}
</style>
