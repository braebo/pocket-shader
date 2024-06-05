<script lang="ts">
	import { gridColor, gridColors } from '../utils/gridColor'
	import { PocketShader } from '../../../pocket-shader'
	import { fadeText } from '../utils/animations'
	import { createEventDispatcher } from 'svelte'

	const dispatch = createEventDispatcher()

	export let id: string = ''
	export let opts: ConstructorParameters<typeof PocketShader> = [id]
	export let afterRun = (ps: PocketShader) => {}

	let active = false
	let hovering = false
	let pocketShader: PocketShader | null = null

	function toggle(e: Event) {
		const target = e?.target as HTMLButtonElement

		active = !active

		if (active) {
			fadeText(target, 'Dispose')
			if (id !== 'noop') {
				pocketShader = new PocketShader(...opts)
				afterRun(pocketShader)
			}
		} else {
			fadeText(target, 'Run')
			if (id !== 'noop') {
				pocketShader?.dispose()
				pocketShader = null
			}
		}

		if (hovering) {
			morph()
		}

		dispatch('toggle', { active })
	}

	let colorCooldown: ReturnType<typeof setTimeout>

	function setColor(e?: Event) {
		morph()
		hovering = true

		if (e?.type === 'focus') {
			colorCooldown = setTimeout(() => {
				if ($gridColor) {
					clearColor()
				}
			}, 3000)
		}
	}

	function clearColor() {
		gridColor.set(gridColors.greyscale)
		clearInterval(colorMorph)
	}

	let colorMorph: ReturnType<typeof setTimeout>
	function morph() {
		clearInterval(colorMorph)
		gridColor.set(
			gridColors[
				active
					? ('red' as const)
					: ['purple' as const, 'blue' as const][Math.floor(Math.random() * 2)]
			],
		)
		const wait = 1000 * Math.random() * 2
		colorMorph = setTimeout(() => {
			if (hovering) {
				morph()
			}
		}, wait)
	}
</script>

<button
	class="btn"
	class:active
	on:click={toggle}
	on:focus={setColor}
	on:blur={clearColor}
	on:pointerover={setColor}
	on:pointerout={clearColor}
>
	Run
</button>
