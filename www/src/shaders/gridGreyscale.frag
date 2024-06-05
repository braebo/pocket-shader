#version 300 es
precision mediump float;

// Original shadertoy by srtuss, 2013
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

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
    float gridSize = size * 1.0 * scale;
    
    
    vec2 mouse = u_mouse;
    
    float zoom = -10.0;

    // uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv = vec2(vUv.x * aspect, vUv.y);

    uv *= zoom;

    // Center the coordinates around the middle of the screen.
    // uv -= 0.5;

    // float zoomSpeed = 0.5;

    // Scale the coordinates for zoom / zoom the camera in and out, but stay centered.
    // vec2 zoomLevel = vec2(sin(u_time * zoomSpeed) * (0.5 + 1.5)); // This will vary between 1 and 2 over time

    // uv *= zoomLevel - 13.;

    // Translate the coordinates back.
    // uv += 0.5;

    // // a bit of camera movement
	// uv *= 0.6 + sin(time * 0.1) * 0.4;
	// uv = rotate(uv, sin(time * 0.3) * 1.0);
	// uv += time * 0.4;

    // // vignette that follows the mouse
    float blinkSpeed = 6.5;
    float blinkFrequency = 0.5;
    float blinkAmplitude = .5;
    float blinkOffset = 1.8;
    float blink = blinkOffset + (sin(time * blinkSpeed) * blinkAmplitude);
    
    float brightness = 0.15 * exp(
        -9.5 * length(vUv - u_mouse)
    ) * 1.2;

    // float spreadSpeed = 75.0;

    // brightness *= exp(
    //     -01.5 *
    //     pow(
    //         length(vUv - mouse),
    //         1.1 + sin(time * spreadSpeed)
    //     )
    // ) * 1.9;

    // Apply the blink effect
    brightness *= blink;

	//? add some noise octaves
    // float a = 0.26, f = 2.0;
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

            float va = 0.0, vb = 0.0;
            va = 1.0 - smoothstep(0.0, 0.1, v1);
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
    
    vec3 color1 = vec3(0.1);
    vec3 color2 = vec3(0.1);

    vec3 grid = color1 * 50.0 + color2;
    grid *= 1.9;

    vec3 color = vec3(pow(brightness, grid.x), pow(brightness, grid.y), pow(brightness, grid.z)) * 2.0;

    fragColor = vec4(color, (color.r + color.g + color.b) / 3.0);
}



// #version 300 es
// precision mediump float;

// // Original shadertoy by srtuss, 2013
// uniform vec2 u_resolution;
// uniform float u_time;
// uniform vec2 u_mouse;

// in vec2 vUv;
// out vec4 fragColor;

// const float size = 9.;

// // rotate position around axis
// vec2 rotate(vec2 p, float a) {
//     return vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a));
// }

// // 1D random numbers
// float rand(float n) {
//     return fract(sin(n) * 43758.5453123);
// }

// // 2D random numbers
// vec2 rand2(in vec2 p) {
//     return fract(vec2(sin(p.x * 591.32 + p.y * 154.077), cos(p.x * 391.32 + p.y * 49.077)));
// }

// // 1D noise
// float noise1(float p) {
//     float fl = floor(p);
//     float fc = fract(p);
//     return mix(rand(fl), rand(fl + 1.0), fc);
// }

// // voronoi distance noise, based on iq's articles
// float voronoi(in vec2 x) {
//     vec2 p = floor(x);
//     vec2 f = fract(x);

//     vec2 res = vec2(8.0);
//     for(int j = -1; j <= 1; j++) {
//         for(int i = -1; i <= 1; i++) {
//             vec2 b = vec2(i, j);
//             vec2 r = vec2(b) - f + rand2(p + b);

// 			// chebyshev distance, one of many ways to do this
//             float d = max(abs(r.x), abs(r.y));

//             if(d < res.x) {
//                 res.y = res.x;
//                 res.x = d;
//             } else if(d < res.y) {
//                 res.y = d;
//             }
//         }
//     }
//     return res.y - res.x;
// }

// void main() {
//     float flicker = noise1(u_time * 2.0) * 0.8 + 0.4;

//     float aspect = u_resolution.x / u_resolution.y;
//     float scale = min(1.0, aspect / 1.0);
//     float gridSize = size * 1.0 * scale;
//     // vec2 uv = vUv * gridSize;
//     vec2 uv = vUv;
//     // vec2 mouse = (u_mouse / u_resolution) * gridSize;
//     // vec2 mouse = (u_mouse) * gridSize;
//     vec2 mouse = u_mouse;

//     // vec2 p = uv + vec2(0.5);

//     // float brightness = 0.15;
//     // float brightness = 0.3;
//     // float brightness = 0.5;

//     // uv = gl_FragCoord.xy / u_resolution.xy;
//     uv = vec2(uv.x * aspect, uv.y);

//     // Center the coordinates around the middle of the screen.
//     uv -= 0.5;

//     // Scale the coordinates for zoom.
//     vec2 zoomLevel = vec2(sin(u_time * 0.1) * (0.5 + 1.5)); // This will vary between 1 and 2 over time
//     uv *= zoomLevel - 13.;

//     // Translate the coordinates back.
//     uv += 0.5;

//     // brightness *= exp(-1.5 * length(uv - mouse)) * 1.2;

//     // vec2 uv = vUv / u_resolution.xy;
//     // uv *= size;
//     // vec2 mouse = vUv - u_mouse;

//     // // vignette that follows the mouse
//     float brightness = 0.15 * exp(-1.5 * length(vUv - u_mouse)) * 1.2;

//     // zoom the camera in and out, but stay centered
    

//     float time = u_time * 0.1;

//     // float brightness = 0.5;
//     // brightness *= exp(-1.5 * length(uv - mouse)) * 1.2;
//     // brightness *= exp(-0.5 * pow(length(uv - mouse), 0.175 + (1.1 + sin(time * 75.)))) * 1.2;
//     // brightness *= exp(-01.5 * pow(length(vUv - mouse), 0.175 + (1.1 + sin(time * 75.)))) * 1.2;
//     brightness *= exp(
//         -01.5 *
//         pow(
//             length(vUv - mouse),
//             0.1175 +
//                 (
//                     1.1 + sin(time * 75.)
//                 )
//             )
//         ) * 1.9;

// 	//? add some noise octaves
//     // float a = 0.26, f = 2.0;
//     float a = 0.25;
//     float f = 2.0;

//     for(int i = 0; i < 2; i++) // 4 octaves also look nice, its getting a bit slow though
//     {
//         float v1 = voronoi(uv * f + 5.0);
//         float v2 = 0.0;

// 		//? make the moving electrons-effect for higher octaves
//         if(i > 0) {
// 			//? of course everything based on voronoi
//             // v2 = voronoi(uv * f * 0.5 + 50.0 + time);
//             v2 = voronoi(uv * f * 0.2 + 50.0 + time);

//             float va = 0.0, vb = 0.0;
//             va = 1.0 - smoothstep(0.0, 0.1, v1);
//             vb = 1.0 - smoothstep(0.0, 0.08, v2);
//             brightness += a * pow(va * (0.5 + vb), 2.0);
//         }

// 		//? make sharp edges
//         v1 = 1.0 - smoothstep(0.0, 0.3, v1);

// 		//? noise is used as intensity map
//         v2 = a * (noise1(v1 * 5.5 + 0.1));

// 		//? octave 0's intensity changes a bit
//         if(i == 0)
//             brightness += v2 * flicker;
//         else
//             brightness += v2;

//         f *= 3.0;
//         a *= 0.7;
//     }

//     vec3 themeA = vec3(0.57, 0.23, 1.);
//     vec3 themeB = vec3(0.2, 0.77, 0.96);
//     vec3 themeC = vec3(1., 0.23137254901960785, 0.5254901960784314);

// 	//? use texture channel0 for color? why not.
//     //- We don't have textures in PocketShader
//     //- vec3 cexp = texture(iChannel0, uv * 0.001).xyz * 3.0 + texture(iChannel0, uv * 0.01).xyz;
//     // vec3 color1 = vec3(0.1, 0.1, 0.1); // RGB color based on uv coordinates
//     // vec3 color2 = vec3(0.1, 0.075, 0.0); // RGB color based on inverted uv coordinates
//     vec3 color1 = themeA;
//     vec3 color2 = themeA;
//     // vec3 color2 = themeB;

//     // vec3 cexp = color1 * 3.0 + color2;
//     // vec3 cexp = color1 * 50.0 + color2;
//     // blend between two colors based on uv
//     vec3 cexp = mix(color1, color2, uv.y / size) * 20.1;

//     // cexp *= 1.4;
//     cexp *= 1.9;

// 	//? old blueish color set
// 	// cexp = vec3(6.0, 4.0, 2.0);

//     // vec3 col = vec3(
//     //         pow(brightness, cexp.x),
//     //         pow(brightness, cexp.y),
//     //         pow(brightness, cexp.z)
//     //     ) * 2.0;

//     // vec3 col = vec3(pow(v, cexp.x), pow(v, cexp.y), pow(v, cexp.z)) * 2.0;

//     vec3 col = vec3(pow(brightness, cexp.x), pow(brightness, cexp.y), pow(brightness, cexp.z)) * 2.0;

//     fragColor = vec4(col, 0.925);

//     // fragColor = vec4(col, 1.0);
//     // fragColor = vec4(col, (col.r + col.g + col.b) / 3.0);
// }

