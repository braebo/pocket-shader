/**
 * A simple webgl shader renderer.
 * @module
 */
interface PocketShaderOptions<T extends Record<string, any> = Record<string, any>> {
    /**
     * The canvas element to render the shader on.
     * @default A new canvas element.
     */
    canvas?: HTMLCanvasElement;
    /**
     * The vertex shader source code.
     */
    vertex?: string;
    /**
     * The fragment shader source code.
     */
    fragment?: string;
    /**
     * When true, the render loop will start automatically.  Otherwise, you will need to call the
     * {@link PocketShader.render|`render`} method manually.
     * @default true
     */
    autoStart?: boolean;
    /**
     * A record of uniform values to pass to the shader.
     * @default {}
     */
    uniforms?: T;
    /**
     * The maximum resolution multiplier, determined by the device pixel ratio by default.
     * @default window.devicePixelRatio || 1
     */
    maxPixelRatio?: number;
    /**
     * A time multiplier.
     * @default 1
     */
    speed?: number;
    /**
     * The mouse smoothing factor.
     * @default 0.1
     */
    mouseSmoothing?: number;
    /**
     * The initial mouse position, normalized to the range `[0, 1]`.
     * @default [0, 0]
     */
    mousePosition?: {
        x: number;
        y: number;
    };
    /**
     * Where to listen for mouse events.  By default, the renderer listens for mouse events on the
     * canvas element.  You can also listen for mouse events on the container element, or the window
     * with this option.
     * @default 'canvas'
     */
    mouseTarget?: 'canvas' | 'container' | 'window';
    /**
     * When true, the instance will automatically initialize itself.  Otherwise, you will need to
     * call the {@link PocketShader.init|`init`} method manually.  This is useful for server-side
     * rendering, or when you need to perform additional setup before initializing the instance.
     * @default true
     */
    autoInit?: boolean;
    /**
     * When `true`, touching the canvas on mobile devices will  call preventDefault when capturing
     * touch event {@link PocketShader.mouse|mouse} positions for the
     * {@link PocketShader.builtinUniforms|u_mouse} uniform.
     * @default false
     */
    preventScroll?: boolean;
}
interface Uniform {
    type: 'int' | 'float' | 'vec2' | 'vec3' | 'vec4';
    value: number | number[];
}
/**
 * A simple canvas-based shader renderer.
 *
 * @param container The element to append the canvas to.  Can be an HTMLElement or a string selector.
 */
declare class PocketShader<T extends Record<string, Uniform> = Record<string, Uniform>> {
    /**
     * The container for the canvas element is used to determine the size of the canvas.
     */
    container: HTMLElement | null;
    /**
     * The canvas element used to render the shader.
     */
    canvas: HTMLCanvasElement;
    /**
     * The WebGL2 rendering context.
     */
    ctx: WebGL2RenderingContext | null;
    /**
     * The vertex shader used by this instance.
     * @default
     * ```glsl
     * #version 300 es
     * in vec4 a_position;
     * out vec2 vUv;
     * void main() {
     *   vUv = a_position.xy * 0.5 + 0.5;
     *   gl_Position = a_position;
     * }
     * ```
     */
    vertex: string;
    /**
     * The fragment shader used by this instance.
     * @default
     * ```glsl
     * #version 300 es
     * precision mediump float;
     *
     * in vec2 vUv;
     * out vec4 color;
     *
     * uniform float u_time;
     * uniform float u_mouse;
     * uniform vec2 u_resolution;
     *
     * void main() {
     *   color = vec4(vUv, 0.5 + 0.5 * sin(u_time), 1.0);
     * }
     *```
     */
    fragment: string;
    /**
     * The maximum resolution multiplier.  By default, this value is set to `2` to avoid nuking
     * high-dpi phones with expensive shaders _(iPhone is `3` for example, so 3x more expensive)_.
     * @default 2
     */
    maxPixelRatio: number;
    /**
     * A time multiplier.
     * @default 1
     */
    speed: number;
    /**
     * The current state of the renderer.
     * @default 'stopped'
     */
    state: 'running' | 'paused' | 'stopped' | 'disposed';
    /**
     * The options used to create this instance.
     */
    opts: PocketShaderOptions<NoInfer<T>>;
    /**
     * The WebGL program used to render the shader.
     */
    program: WebGLProgram | false;
    /**
     * The current mouse position normalized, to the range `[0, 1]`.
     * @default { x: 0.5, y: 0.5 }
     */
    mouse: {
        x: number;
        y: number;
    };
    /**
     * The current _smoothed_ mouse position, normalized to the range `[0, 1]`.
     * @default { x: 0.5, y: 0.5 }
     */
    mouseSmoothed: {
        x: number;
        y: number;
    };
    /**
     * The mouse smoothing factor.
     * @default 0.1
     */
    mouseSmoothing: number;
    /**
     * These uniforms are always available to the shader, and are updated automatically whenever
     * the shader state is `running`.
     * @default { u_time: 0, u_resolution: [0, 0], u_mouse: [0.5, 0.5] }
     */
    builtinUniforms: {
        u_time: number;
        u_resolution: [number, number];
        u_mouse: [number, number];
    };
    private _positionBuffer;
    private _builtinUniformLocations;
    private _uniformLocations;
    private _uniforms;
    private _time;
    private _resizeObserver;
    private _canvasRectCache;
    private _listeners;
    private _arg1;
    private _arg2;
    constructor(options?: PocketShaderOptions<T>);
    constructor(
    /**
     * The container element (or query selector) to use for the canvas.  The canvas will
     * automatically adjust its size to fill the container, and re-render whenever the
     * window is resized.
     * @default document.body
     */
    container: HTMLElement | string, 
    /**
     * @see {@link PocketShaderOptions}
     */
    options?: PocketShaderOptions<T>);
    /**
     * A record of uniform values to pass to the shader.
     */
    get uniforms(): T;
    set uniforms(value: T);
    /**
     * The current time in seconds.  This value is updated automatically after calling
     * {@link start|`start()`}, and is reset to `0` when {@link stop|`stop()`} is called.  You can
     * also set this value yourself if you prefer to control the time uniform manually.
     */
    get time(): number;
    set time(value: number);
    /**
     * The current canvas width and height.
     */
    get resolution(): {
        width: number;
        height: number;
    };
    /**
     * Initializes the instance, creating the canvas element and WebGL context, and compiling the
     * shaders.  This method is called automatically when the instance is created, unless the
     * {@link autoInit|`autoInit`} option is set to `false`.
     *
     * All references to {@link Window} and {@link Document} are contained within this method
     * instead of the constructor.
     */
    init(): this;
    /**
     * Starts a render loop, updating the time uniform and re-rendering the shader each frame.
     * If the {@link state} is already `running`, this method does nothing.
     * @throws If the {@link state} is already `disposed`.
     */
    start(): this;
    /**
     * Pauses the render loop.
     */
    pause(): this;
    /**
     * Stops the render loop and resets the time uniform to `0`.
     */
    stop(): this;
    /**
     * Restarts the render loop.  If the WebGL context has already been disposed of, this will
     * call {@link reload} to create a new one.
     */
    restart(): this;
    /**
     * Fully dipsoses the current WebGL context and creates a new one.
     */
    reload(): this;
    /**
     * Resizes the canvas to fill the container.
     */
    private _resize;
    /**
     * A throttled, debounced {@link _resize}.  Resizes the canvas to fill the container.
     */
    resize: () => void;
    /**
     * Performs a single render to the canvas.  This method is called automatically when the
     * instance is created, unless the {@link autoStart|`autoStart`} option is set to `false`.
     *
     * This method is also called automatically when the window is resized, or when the
     * {@link uniforms} are updated.  If the {@link state} is `running`, this method will be called
     * recursively to update the time uniform and re-render the shader each frame.
     *
     * If the {@link state} is `disposed`, this method does nothing.
     */
    render(): this;
    /**
     * This method runs `onmousemove` and does the following:
     * 1. Calculates the mouse position relative to the canvas.
     * 2. Normalizes it to the range `[0, 1]`.
     * 3. Applies the {@link mouseSmoothing|`mouseSmoothing`} factor.
     * 4. Updates the `u_mouse` uniform.
     */
    setMousePosition: (e: MouseEvent | Touch) => void;
    /**
     * Just forwards the first touch event to {@link setMousePosition} on `touchmove`.
     * @todo - Can we just use`onpointermove` and get rid of this?
     */
    setTouchPosition: (e: TouchEvent) => void;
    /**
     * Listen for events emitted by the renderer.
     * @param event The event to listen for.  Currently, only `'render'` is supported, which runs _before_ each render.
     * @param listener The callback to run when the event is emitted.
     */
    on: (event: 'render', listener: (data: {
        time: number;
        delta: number;
    }) => void) => this;
    /**
     * Dispatches the `render` event to all listeners.
     */
    private _emit;
    /**
     * Compiles the shaders and creates the WebGL program.
     */
    compile(): void;
    /**
     * Returns the target element to listen for mouse events on based on the
     * {@link PocketShaderOptions.mouseTarget|mouseTarget} option.
     */
    getMouseTarget: () => HTMLElement | Window;
    private _setupCanvas;
    /**
     * Updates the cached bounding rect of the canvas element.
     */
    private _updateRectCache;
    /**
     * Creates a WebGL program from the provided vertex and fragment shaders.
     */
    private _createProgram;
    /**
     * Creates a WebGL shader from the provided source code.
     */
    private _createShader;
    /**
     * Updates a uniform value on the shader program.
     */
    private _setUniform;
    /**
     * Parses all of the uniforms in the fragment shader string and verifies that they exist in the
     * current {@link uniforms} object, throwing an error
     */
    private _validateUniforms;
    /**
     * Cleans up all event listeners and WebGL resources.
     */
    private _cleanupListeners;
    /**
     * Disposes of all resources and event listeners, the WebGL context, and removes the canvas
     * element from the DOM.
     */
    dispose(): void;
}

export { PocketShader, type PocketShaderOptions };
