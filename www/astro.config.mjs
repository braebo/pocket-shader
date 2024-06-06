import { defineConfig } from 'astro/config'
import svelte from '@astrojs/svelte'

export default defineConfig({
	vite: {
		define: {
			__DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
		},
	},
	integrations: [svelte()],
})
