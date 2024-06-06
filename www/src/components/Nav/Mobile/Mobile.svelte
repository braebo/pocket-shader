<script lang="ts">
	import { clickOutside } from '../../../utils/clickOutside'
	import PageFill from './PageFill.svelte'
	import Burger from './Burger.svelte'

	export let showMenu: boolean
</script>

<div
	class="burger"
	use:clickOutside={{ whitelist: ['wrapper'] }}
	on:outclick={() => (showMenu = false)}
>
	<Burger bind:showMenu />
</div>

<PageFill bind:showMenu />

{#if showMenu}
	<slot />
{/if}

<style>
	:global(nav.mobile .active) {
		color: var(--theme-a);
	}
</style>
