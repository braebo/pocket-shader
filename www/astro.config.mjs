import cloudflare from '@astrojs/cloudflare'
import { defineConfig } from 'astro/config'
import svelte from '@astrojs/svelte'

export default defineConfig({
	output: 'server',
	adapter: cloudflare(),
	integrations: [svelte()],
})
