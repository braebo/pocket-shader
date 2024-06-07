// @ts-ignore

import type MagicString from 'magic-string'
import type { Plugin } from 'vite'
import ms from 'magic-string'

export default (
	options: {
		filename: string | RegExp
		search: string | RegExp
		replace: string
	}[] = [],
): Plugin => {
	return {
		name: 'vite-plugin-string-replace',
		enforce: 'pre',
		async transform(code: string, id: string) {
			let str: MagicString
			for (const option of options) {
				if (option.filename && !id.match(option.filename)) {
					continue
				}
				const { search, replace } = option
				str = new ms(code)
				str.replace(search, replace)
				return { code: str.toString(), map: str.generateMap() }
			}
			return null
		},
	}
}
