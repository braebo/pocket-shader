#version 300 es
precision mediump float;

// Original shadertoy by srtuss, 2013
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_parallax;

in vec2 vUv;
out vec4 fragColor;

const float size = 9.;

// rotate position around axis
vec2 rotate(vec2 p, float a) {
    return vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a));
}

// 1D random numbers
float rand(float n) {
    return fract(sin(n) * 43758.5453123);
}

// 2D random numbers
vec2 rand2(in vec2 p) {
    return fract(vec2(sin(p.x * 591.32 + p.y * 154.077), cos(p.x * 391.32 + p.y * 49.077)));
}

// 1D noise
float noise1(float p) {
    float fl = floor(p);
    float fc = fract(p);
    return mix(rand(fl), rand(fl + 1.0), fc);
}

// voronoi distance noise, based on iq's articles
float voronoi(in vec2 x) {
    vec2 p = floor(x);
    vec2 f = fract(x);

    vec2 res = vec2(8.0);
    for(int j = -1; j <= 1; j++) {
        for(int i = -1; i <= 1; i++) {
            vec2 b = vec2(i, j);
            vec2 r = vec2(b) - f + rand2(p + b);

			// chebyshev distance, one of many ways to do this
            float d = max(abs(r.x), abs(r.y));

            if(d < res.x) {
                res.y = res.x;
                res.x = d;
            } else if(d < res.y) {
                res.y = d;
            }
        }
    }
    return res.y - res.x;
}

void main() {
    float time = u_time * 0.1;
    float flicker = noise1(u_time * 2.0) * 0.8 + 0.4;

    float aspect = u_resolution.x / u_resolution.y;
    float scale = min(1.0, aspect / 1.0);

    vec2 mouse = u_mouse;

    // uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv = vec2(vUv.x * aspect, vUv.y);
    
    //? Zoom out.
    uv *= -10.0;
    
    float brightness =
        0.15 *
        //? Vignette that follows the mouse.
        exp(
            -9.5 * length(vUv - u_mouse)
        ) * 1.2;

    //? Subtle, slow blink effect.
    float blink = 1.8 + sin(time * 6.5) * 0.5;
    brightness *= blink;

	//? Add some noise octaves.
    float a = 0.25;
    float f = 2.0;

    for(int i = 0; i < 2; i++) // 4 octaves also look nice, its getting a bit slow though
    {
        float v1 = voronoi(uv * f + 5.0);
        float v2 = 0.0;

		//? make the moving electrons-effect for higher octaves
        if(i > 0) {
			//? of course everything based on voronoi
            // v2 = voronoi(uv * f * 0.5 + 50.0 + time);
            v2 = voronoi(uv * f * 0.2 + 50.0 + time);
            // v2 = voronoi(uv * f * 0.4 + (50.0 * sin(time * .01)) + time);

            float va = 0.0, vb = 0.0;
            va = 1.0 - smoothstep(0.0, 0.1, v1);
            // vb = 1.0 - smoothstep(0.0, 0.08, v2);
            vb = 1.0 - smoothstep(0.0, 0.08, v2);
            brightness += a * pow(va * (0.5 + vb), 2.0);
        }

		//? make sharp edges
        v1 = 1.0 - smoothstep(0.0, 0.3, v1);

		//? noise is used as intensity map
        v2 = a * (noise1(v1 * 5.5 + 0.1));

		//? octave 0's intensity changes a bit
        if(i == 0)
            brightness += v2 * flicker;
        else
            brightness += v2;

        f *= 3.0;
        a *= 0.7;
    }

    vec3 themeA = vec3(0.57, 0.23, 1.);
    vec3 themeB = vec3(0.2, 0.77, 0.96);
    vec3 themeC = vec3(1., 0.23137254901960785, 0.5254901960784314);
    
    vec3 color1 = themeC;
    vec3 color2 = themeA;
    
    vec3 color = themeA * 14.;
   
    color *= pow(brightness, 14.1);

    fragColor = vec4(color, (color.r + color.g + color.b) / 3.0);
}
