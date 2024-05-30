/** @type {import("prettier").Config} */
export default {
	plugins: ['prettier-plugin-astro'],
	overrides: [
		{
			files: '*.astro',
			options: {
				parser: 'astro',
			},
		},
	],
	trailingComma: 'all',
	requirePragma: false,
	arrowParens: 'avoid',
	bracketSpacing: true,
	singleQuote: true,
	printWidth: 100,
	useTabs: true,
	tabWidth: 4,
	semi: false,
}
