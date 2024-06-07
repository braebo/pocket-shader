import { readFile, writeFile } from 'node:fs/promises'
import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['./pocket-shader.ts'],
	format: ['esm'],
	clean: true,
	dts: true,
	async onSuccess() {
		const data = await readFile('./dist/pocket-shader.js', 'utf-8');
		await writeFile('./dist/pocket-shader.js', `// @ts-self-types="./pocket-shader.d.ts"\n${data}`, 'utf-8')
	},
})
