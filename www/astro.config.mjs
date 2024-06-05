import { defineConfig } from 'astro/config'
import svelte from '@astrojs/svelte'

// https://astro.build/config
/** @type {import('astro/config')} */
export default defineConfig({
	vite: {
		plugins: [],
	},
	integrations: [svelte()],
})
