<script lang="ts">
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

		return () => observer.disconnect()
	})

	const stagger = 0.1
</script>

<nav bind:this={nav}>
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
		// gap: 0.5rem;

		width: fit-content;
		height: fit-content;
		margin: auto 0;
	}

	.h2 {
		font-size: var(--font);
		height: 2rem;
		&:not(:first-of-type) {
			margin-top: 1rem;
		}
	}

	.h3 {
		font-size: var(--font-sm);
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

	:global(.active-section) {
		color: var(--theme-a);
		color: var(--fg-a) !important;
	}
</style>
