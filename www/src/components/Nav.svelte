<script lang="ts">
	import Mobile from './Nav/Mobile/Mobile.svelte'
	import { onMount } from 'svelte'

	type Id = string
	interface Section {
		el: HTMLElement
		title: string
		id: string
		children: { el: HTMLElement; title: string; id: string }[]
	}

	let nav: HTMLElement
	let sections: Map<Id, Section>

	let mobile = globalThis.window?.innerWidth < 900
	let showMenu = false

	function getSections(headings: NodeListOf<HTMLElement>) {
		const sections = new Map<Id, Section>()
		let currentSection: Section

		headings.forEach(h => {
			if (h.tagName === 'H2') {
				currentSection = {
					el: h,
					title: h.textContent!,
					id: h.id,
					children: [],
				}
				sections.set(h.id, currentSection)
			} else if (h.tagName === 'H3') {
				currentSection.children.push({
					el: h,
					title: h.textContent!,
					id: h.id,
				})
			}
		})

		return sections
	}

	onMount(() => {
		mobile = globalThis.window?.innerWidth < 900

		const headings = document.querySelectorAll<HTMLElement>('h2, h3')

		sections = getSections(headings)

		const observer = new IntersectionObserver(
			entries => {
				entries.forEach(e => {
					const a = nav.querySelector(`a[href="/#${e.target.id}"]`)
					a?.classList.toggle('active-section', e.isIntersecting)
				})
			},
			{ threshold: 0.5 },
		)

		headings.forEach(h => observer.observe(h))

		return () => {
			observer.disconnect()
		}
	})

	const stagger = 0.1
</script>

<svelte:window on:resize={() => (mobile = globalThis.window.innerWidth < 900)} />

{#if mobile && sections}
	<Mobile bind:showMenu />
{/if}

<nav bind:this={nav} class:mobile class:showMenu class:hide={mobile && !showMenu}>
	{#each sections?.values() ?? [] as h2, i}
		<a style:animation-delay="{i * stagger}s" class="h2" href="/#{h2.id}">{h2.title}</a>
		{#each h2.children as h3, j}
			<a
				class="h3"
				href="/#{h3.id}"
				style:animation-delay="{i * stagger + j * (stagger / 2)}s"
			>
				{h3.title}
			</a>
		{/each}
	{/each}
</nav>

<style lang="scss">
	nav {
		position: fixed;
		left: 1rem;
		top: 0;
		bottom: 0;

		display: flex;
		flex-direction: column;

		width: fit-content;
		height: fit-content;
		margin: auto 0;

		z-index: 10;
	}

	nav.mobile {
		position: fixed;
		left: 0;
		right: 0;
		gap: 0.25rem;

		margin: auto;

		z-index: 25;

		&:not(.showMenu) {
			pointer-events: none !important;
		}
	}

	.h2 {
		letter-spacing: 1px;
		font-size: var(--font);
		height: 2rem;
		&:not(:first-of-type) {
			margin-top: 1rem;
		}
	}

	.h3 {
		font-size: var(--font-sm);
		font-variation-settings: 'wght' 200;
		padding-left: 1rem;
		height: 1.5rem;
	}

	.h2,
	.h3 {
		opacity: 0;
		animation: flyIn 0.5s ease forwards;

		transition: color 0.2s;
		text-decoration: none;
		color: color-mix(in lch, var(--fg-d), var(--bg-d));

		&:hover {
			color: var(--fg-a) !important;
		}
	}

	nav:hover {
		.h2,
		.h3 {
			color: var(--fg-d);
		}
	}

	@keyframes flyIn {
		from {
			opacity: 0;
			transform: translateX(-1rem);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes flyUp {
		from {
			transform: translateY(1rem);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@keyframes flyDown {
		from {
			transform: translateY(0);
			opacity: 1;
		}
		to {
			transform: translateY(1rem);
			opacity: 0;
		}
	}

	nav.mobile {
		.h2,
		.h3 {
			animation: flyUp 0.5s ease forwards;
			font-size: var(--font);
		}
	}

	nav.mobile:not(.showMenu) {
		.h2,
		.h3 {
			animation: flyOut 0.5s ease forwards reverse;
			pointer-events: none !important;
		}
	}

	:global(.active-section) {
		color: var(--theme-a);
		color: var(--fg-a) !important;
	}
</style>
