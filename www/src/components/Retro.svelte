<script lang="ts">
    import fragmentShader from '../shaders/retro.glsl?raw'
    import { PocketShader } from 'pocket-shader';
    import { onMount } from 'svelte';

    onMount(() => {
        const pocketShader = new PocketShader({
            shadertoy: true,
            fragmentShader
        })
    });
</script>

<div>
    <h1>Retro</h1>

    <div id="retro-canvas"></div>
</div>

<style lang="scss">
    
</style>