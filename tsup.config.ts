import { defineConfig } from 'tsup'

export default defineConfig([
	{
		entry: {
			'pocket-shader.min': 'src/pocket-shader.ts',
		},
		minify: !0,
		name: 'minified',
		format: ['esm'],
		clean: true,
		dts: !!0,
	},
	{
		entry: ['src/pocket-shader.ts'],
		name: 'standard',
		format: ['esm'],
		clean: true,
		dts: true,
	},
])
