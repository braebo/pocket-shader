const easeOut = 'cubic-bezier(.12,.75,.13,.99)'

export async function fadeOutUp(el: Element) {
	return await el.animate(
		[
			{ transform: 'translateY(0)', opacity: 1 },
			{ transform: 'translateY(-0.2rem)', opacity: 0 },
		],
		{
			duration: 200,
			easing: easeOut,
			fill: 'forwards',
		},
	).finished
}

export async function fadeInUp(el: Element) {
	return await el.animate(
		[
			{ transform: 'translateY(0.2rem)', opacity: 0 },
			{ transform: 'translateY(0)', opacity: 1 },
		],
		{
			duration: 200,
			easing: easeOut,
			fill: 'forwards',
		},
	).finished
}

/**
 * Swaps an element's text with a fade animation.
 */
export async function fadeText(el: Element, text: string) {
	const elText = el.textContent
	const wrapper = document.createElement('div')
	wrapper.textContent = elText
	el.innerHTML = ''
	el.appendChild(wrapper)
	await fadeOutUp(wrapper)
	wrapper.textContent = text
	await fadeInUp(wrapper)
	el.innerHTML = text
}
