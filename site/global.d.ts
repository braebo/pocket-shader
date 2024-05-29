import 'astro/types'

declare module 'astro/types' {
	namespace JSX {
		interface IntrinsicElements {
			[elemName: string]: any
		}
		interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
			popover?: string
			popovertarget?: string
		}
	}
}
