import type { Plugin } from 'vite'

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
			for (const option of options) {
				if (option.filename && !id.match(option.filename)) {
					continue
				}
				code = code.replace(option.search, option.replace)
			}
			return { code, map: null }
		},
	}
}
