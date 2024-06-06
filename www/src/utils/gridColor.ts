import { quintOut } from 'svelte/easing'
import { tweened } from 'svelte/motion'

export const gridColors = {
	greyscale: [0.1, 0.1, 0.1],
	purple: [0.57, 0.23, 1],
	cyan: [0.2, 0.77, 0.96],
	red: [1, 0.23137254901960785, 0.5254901960784314],
	blue: [0.27450980392156865, 0.5215686274509804, 0.9254901960784314],
}

export const gridColor = tweened(gridColors.greyscale, {
	duration: 1500,
	easing: quintOut,
})

export const gridYeet = tweened(1.0, {
	duration: 1500,
	easing: quintOut,
})
