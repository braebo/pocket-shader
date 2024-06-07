// import vitePluginReplace from './vite-plugin-replace'
import { defineConfig } from 'astro/config'
import svelte from '@astrojs/svelte'

export default defineConfig({
	vite: {
		// define: {
		// 	__DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
		// },
		plugins: [
			// vitePluginReplace([
			// 	{
			// 		filename: 'pocket-shader.ts',
			// 		search: /__DEV__/g,
			// 		replace: `${process.env.NODE_ENV === 'development'}`,
			// 	},
			// 	{
			// 		filename: 'pocket-shader.ts',
			// 		search: '@LogMethods()',
			// 		replace: process.env.NODE_ENV === 'development' ? '@LogMethods()' : '',
			// 	},
			// ]),
		],
	},
	integrations: [svelte()],
})
