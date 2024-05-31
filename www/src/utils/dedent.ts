/**
 * Trims a multiline string by an amount equal to the least indented line.
 * Leading and trailing newlines are removed.
 *
 * If the first line is _not_ empty, it will be _indented_ by the
 * same amount as the rest is _un-indented_.
 *
 * @returns The dedented string.
 */
export function dedent(
	/**
	 * The string to dedent.
	 */
	string: string,
	options = {
		/**
		 * Whether to trim the last line if its empty.
		 * @defaultValue `true`
		 */
		trimEndingNewline: true,
	},
): string {
	const lines = string.split('\n')
	const leadingNewline = string[0] !== '\n'
	const indent = lines
		.filter((line, i) => {
			if (leadingNewline && i === 0) {
				return false
			}
			return line.trim()
		})
		.map(line => line.match(/^\s*/)?.[0].length)
		.filter(indent => indent !== undefined)
		// @ts-ignore - Astro is hallucinating errors here and throwing on build
		.reduce((a, b) => Math.min(a, b), 9999)

	if (leadingNewline) {
		// @ts-ignore - Astro is hallucinating errors here and throwing on build
		lines[0] = ' '.repeat(indent) + lines[0]
	} else {
		lines.shift()
	}

	if (options.trimEndingNewline) {
		if (lines.at(-1) === '') {
			lines.pop()
		}
	}

	return lines.map(line => line.slice(indent)).join('\n')
}
