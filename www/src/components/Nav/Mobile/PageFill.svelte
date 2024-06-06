<script lang="ts">
	export let showMenu = false
</script>

<div class="page-fill" class:showMenu />

<style>
	.page-fill {
		--quint: cubic-bezier(.05,1,.38,.97);
		position: fixed;
		/* top: 0.5rem; */
		bottom: 0.5rem;
		right: 1rem;

		width: 200vh;
		height: 200vh;
		bottom: -100vh;
		right: -100vh;

		background-color: var(--bg-a);
		border-radius: 100%;
		opacity: 0;

		transition: transform 0.5s var(--quint), opacity 0.5s ease-out;
		pointer-events: none;
		z-index: 20;

		transform: scale(0.00001);
	}

	.page-fill.showMenu {
		opacity: 1;
		transition: transform 1s var(--quint), opacity 0.5s ease;
		transform: scale(1);
	}
</style>
