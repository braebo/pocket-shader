import { defineConfig } from 'astro/config';

/** @type {import('astro/config')} */
import solid from "@astrojs/solid-js";

import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: []
  },
  integrations: [solid(), svelte()]
});