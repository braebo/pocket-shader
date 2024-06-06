/**
 * Like `scrollIntoView({ behavior: 'instant' })` with a quick fade/transform animation.
 */
export function teleportIntoView(
	target: Element,
	{
		yAmount = 0.5,
		durationOut = 200,
		durationIn = 300,
		easingOut = 'ease',
		easeIn = 'ease-out',
	} = {},
) {
	// return if the target is already in view

	setTimeout(async () => {
		const rect = target.getBoundingClientRect()

		if (rect.top >= -100 && rect.top <= window.innerHeight / 3) {
			// The element is in the viewport
			return
		}

		const direction = rect.top > 0 ? 1 : -1
		
		await document.querySelector('.page')?.animate(
			[
				{ opacity: 1, transform: 'translateY(0)' },
				{
					opacity: 0,
					transform: `translateY(${-direction * yAmount}rem)`,
				},
			],
			{
				duration: durationOut,
				easing: easingOut,
			},
		).finished
		target.scrollIntoView({
			behavior: 'instant',
			block: 'start',
		})
		document.querySelector('.page')?.animate(
			[
				{
					opacity: 0,
					transform: `translateY(${direction * yAmount}rem)`,
				},
				{ opacity: 1, transform: 'translateY(0)' },
			],
			{
				duration: durationIn,
				easing: easeIn,
			},
		)
	})
}
