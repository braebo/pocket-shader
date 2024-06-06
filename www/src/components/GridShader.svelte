<!-- 
    @component
    An interactive, fullscreen background shader.
 -->

<script lang="ts">
	import { gridColor, gridColors, gridYeet } from '../utils/gridColor'
	import { PocketShader } from 'pocket-shader'
	import grid from '../shaders/grid.frag?raw'
	import { quadIn } from 'svelte/easing'
	import { onMount } from 'svelte'

	let ps: PocketShader

	$: if (ps) {
		ps.uniforms.u_color.value = $gridColor
	}

	const subs = [] as (() => void)[]

	subs.push(
		gridColor.subscribe(value => {
			if (ps) {
				ps.uniforms.u_color.value = value
			}
		}),
	)

	subs.push(
		gridYeet.subscribe(value => {
			if (ps) {
				ps.uniforms.u_yeet.value = value
			}
		}),
	)

	onMount(() => {
		ps = new PocketShader({
			autoStart: true,
			fragment: grid,
			mouseTarget: 'window',
			uniforms: {
				u_parallax: { type: 'float', value: 0 },
				u_greyscale: { type: 'float', value: 0 },
				u_color: { type: 'vec3', value: $gridColor },
				u_yeet: { type: 'float', value: 1.0 },
			},
		})

		ps.canvas.style.setProperty('pointer-events', 'none')
		ps.canvas.style.setProperty('contain', 'strict')

		return () => {
			ps.stop().dispose()
			for (const unsub of subs) {
				unsub()
			}
		}
	})

	let clickCooldown: ReturnType<typeof setTimeout>
	let yeetCooldown: ReturnType<typeof setTimeout>
	const yeet = async () => {
		gridYeet.set(1.75, { duration: 50 })
		// gridYeet.set(2, { duration: 50 })
		clearTimeout(yeetCooldown)
		yeetCooldown = setTimeout(() => {
			gridYeet.set(1, { duration: 1000, easing: quadIn })
		}, 50)
		clearTimeout(clickCooldown)
		clickCooldown = setTimeout(() => {
			gridColor.set(gridColors.greyscale, { duration: 1000, easing: quadIn })
		}, 1000)
	}

	const setYeet = (e: KeyboardEvent) => {
		let num: number
		try {
			num = parseInt(e.key)
			if (typeof num === 'number' && !isNaN(num)) {
				gridYeet.set(1 + num * 0.2, { duration: 50 })
			}
		} catch (e) {}
	}
</script>

<svelte:window
	on:scroll={() => {
		if (ps) {
			ps.uniforms.u_parallax.value = window.scrollY / ps.resolution.height
		}
	}}
	on:pointerdown={yeet}
	on:keydown={setYeet}
/>
