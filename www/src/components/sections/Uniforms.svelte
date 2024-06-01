<script lang="ts">
	import fragment from '../../shaders/glass.glsl?raw'
	import { fadeText } from '../../utils/animations.ts'
	import { PocketShader } from 'pocket-shader'
	import Range from '../Range.svelte'

	export let id: string

	let poly_U = 1 // [0, inf]
	let poly_V = 0.5 // [0, inf]
	let poly_W = 1.0 // [0, inf]
	let octave = 3 // [2, 5]
	let inner_sphere = 1
	let refr_index = 0.9
	let poly_zoom = 2.0

	let ps: PocketShader | null = null
	let btnEl: HTMLButtonElement

	$: if (
		ps &&
		(poly_U || poly_V || poly_W || octave || inner_sphere || refr_index || poly_zoom)
	) {
		if (ps.uniforms.poly_U.value !== poly_U) ps.uniforms.poly_U.value = poly_U
		if (ps.uniforms.poly_V.value !== poly_V) ps.uniforms.poly_V.value = poly_V
		if (ps.uniforms.poly_W.value !== poly_W) ps.uniforms.poly_W.value = poly_W
		if (ps.uniforms.octave.value !== octave) ps.uniforms.octave.value = octave
		if (ps.uniforms.inner_sphere.value !== inner_sphere)
			ps.uniforms.inner_sphere.value = inner_sphere
		if (ps.uniforms.refr_index.value !== refr_index) ps.uniforms.refr_index.value = refr_index
		if (ps.uniforms.poly_zoom.value !== poly_zoom) ps.uniforms.poly_zoom.value = poly_zoom
	}

	$: disabled = !ps?.state || ps.state === 'disposed' || ps === null

	function run() {
		if (!disabled) return dispose()

		ps = new PocketShader(id, {
			vertex: `#version 300 es
                in vec4 a_position;
                void main() {
                    gl_Position = a_position;
                }
            `,
			fragment,
			autoStart: true,
			uniforms: {
				octave: { type: 'int', value: 3 },
				poly_U: { type: 'float', value: 1 },
				poly_V: { type: 'float', value: 0.5 },
				poly_W: { type: 'float', value: 1.0 },
				inner_sphere: { type: 'float', value: 1 },
				refr_index: { type: 'float', value: 0.9 },
				poly_zoom: { type: 'float', value: 2.0 },
			},
		})

		fadeText(btnEl, 'Dispose')
	}

	function dispose() {
		ps?.dispose()
		ps = null
		fadeText(btnEl, 'Run')
	}

	const types = []
</script>

<slot name="code" />

<button class="btn" bind:this={btnEl} class:active={!disabled} on:click={run}>
	{disabled ? 'Run' : 'Dispose'}
</button>

<div class:disabled>
	<div class="left">
		<span>octave</span>
		<div class="label">{octave}</div>
	</div>
	<div class="right">
		<Range min={2} max={5} step={1} bind:value={octave} />
	</div>
</div>

<div class:disabled>
	<div class="left">
		<span>zoom</span>
		<div class="label">{poly_zoom.toFixed(2)}</div>
	</div>
	<div class="right">
		<Range min={0.1} max={5} step={0.01} bind:value={poly_zoom} />
	</div>
</div>

<div class:disabled>
	<div class="left">
		<span>sphere</span>
		<div class="label">{inner_sphere.toFixed(2)}</div>
	</div>
	<div class="right">
		<Range min={0} max={2.5} step={0.01} bind:value={inner_sphere} />
	</div>
</div>

<div class:disabled>
	<div class="left">
		<span>U</span>
		<div class="label">{poly_U.toFixed(2)}</div>
	</div>
	<div class="right">
		<Range min={0} max={5} step={0.01} bind:value={poly_U} />
	</div>
</div>

<div class:disabled>
	<div class="left">
		<span>V</span>
		<div class="label">{poly_V.toFixed(2)}</div>
	</div>
	<div class="right">
		<Range min={0} max={10} step={0.01} bind:value={poly_V} />
	</div>
</div>

<div class:disabled>
	<div class="left">
		<span>W</span>
		<div class="label">{poly_W.toFixed(2)}</div>
	</div>
	<div class="right">
		<Range min={0.5} max={15} step={0.01} bind:value={poly_W} />
	</div>
</div>

<div class:disabled>
	<div class="left">
		<span>refraction idx</span>
		<div class="label">{refr_index.toFixed(2)}</div>
	</div>
	<div class="right">
		<Range min={0.1} max={1} step={0.01} bind:value={refr_index} />
	</div>
</div>

<style lang="scss">
	div {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: auto;

		.left {
			display: flex;
			justify-content: flex-end;
			align-items: center;
			width: 10rem;
			span {
				// font-size: var(--font-sm);
				color: var(--fg-b);
				font-variation-settings: 'wght' 100;
			}
			.label {
				width: 1.85rem;
				height: 1.1rem;
				margin: 0;
				font-size: var(--font-xs);
				font-variation-settings: 'wght' 100;
				text-align: center;
				display: flex;
				justify-content: center;
				align-items: center;
				border-radius: 0.2rem;
				padding: 0.05rem 0.3rem;
				line-height: 1rem;
				font-family: var(--font-mono);
				outline: 1px solid var(--bg-d);
				background: var(--bg-a);
			}
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;

			* {
				pointer-events: none;
				user-select: none;
			}
		}
	}
</style>
