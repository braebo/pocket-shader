#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_timeDelta;
// uniform sampler2D iChannel0;
uniform float32Array u_audioData;

in vec2 vUv;
out vec4 fragColor;

//#define AA 2
//#define VAPORWAVE
//#define stereo 1. // -1. for cross-eyed (defaults to parallel view)
#define speed -10. 
#define wave_thing
//#define city

//you can add any sound texture in iChannel0 to turn it into a cool audio visualizer 
// (it looks better with lower speeds though)
//you should commment out or remove the following line to enable it (it's disabled mainly for performance reasons):
// #define disable_sound_texture_sampling

#ifndef disable_sound_texture_sampling
    #undef speed 
    // lower value of speed when using as audio visualizer
    #define speed -5.
#endif

//self-explainatory
#define audio_vibration_amplitude .9125

float jTime;

#ifdef disable_sound_texture_sampling
#define textureMirror(a, b) vec4(0)
#else
vec4 textureMirror(sampler2D tex, vec2 c) {
    vec2 cf = fract(c);
    return texture(tex, mix(cf, 1.f - cf, mod(floor(c), 2.f)));
}
#endif

float amp(vec2 p) {
    return smoothstep(1.f, 8.f, abs(p.x));
}

float pow512(float a) {
    a *= a;//^2
    a *= a;//^4
    a *= a;//^8
    a *= a;//^16
    a *= a;//^32
    a *= a;//^64
    a *= a;//^128
    a *= a;//^256
    return a * a;
}
float pow1d5(float a) {
    return a * sqrt(a);
}
float hash21(vec2 co) {
    return fract(sin(dot(co.xy, vec2(1.9898f, 7.233f))) * 45758.5433f);
}
float hash(vec2 uv) {
    float a = amp(uv);

    // Get the audio spectrum data
    vec2 audioSpectrum = textureMirror(iChannel0, vec2(uv.x, 0.0f)).xy;

    // Map the audio spectrum to terrain height
    float bassHeight = audioSpectrum.x * 0.1f;
    float trebleHeight = audioSpectrum.y * 2.0f;

    float w = mix(bassHeight, trebleHeight, uv.x);

    return (a > 0.0f ? a * pow1d5(hash21(uv)) * w : 0.0f) - (textureMirror(iChannel0, vec2((uv.x * 29.0f + uv.y) * 0.03125f, 2.0f)).x) * audio_vibration_amplitude;
}

float edgeMin(float dx, vec2 da, vec2 db, vec2 uv) {
    uv.x += 5.f;
    vec3 c = fract((round(vec3(uv, uv.x + uv.y))) * (vec3(0, 1, 2) + 0.61803398875f));
    float a1 = textureMirror(iChannel0, vec2(c.y, 0.f)).x > .6f ? .15f : 1.f;
    float a2 = textureMirror(iChannel0, vec2(c.x, 0.f)).x > .6f ? .15f : 1.f;
    float a3 = textureMirror(iChannel0, vec2(c.z, 0.f)).x > .6f ? .15f : 1.f;

    return min(min((1.f - dx) * db.y * a3, da.x * a2), da.y * a1);
}

vec2 trinoise(vec2 uv) {
    const float sq = sqrt(3.f / 2.f);
    uv.x *= sq;
    uv.y -= .5f * uv.x;
    vec2 d = fract(uv);
    uv -= d;

    bool c = dot(d, vec2(1)) > 1.f;

    vec2 dd = 1.f - d;
    vec2 da = c ? dd : d, db = c ? d : dd;

    float nn = hash(uv + float(c));
    float n2 = hash(uv + vec2(1, 0));
    float n3 = hash(uv + vec2(0, 1));

    float nmid = mix(n2, n3, d.y);
    float ns = mix(nn, c ? n2 : n3, da.y);
    float dx = da.x / db.y;
    return vec2(mix(ns, nmid, dx), edgeMin(dx, da, db, uv + d));
}

vec2 map(vec3 p) {
    vec2 n = trinoise(p.xz);
    return vec2(p.y - 2.f * n.x, n.y);
}

vec3 grad(vec3 p) {
    const vec2 e = vec2(.005f, 0);
    float a = map(p).x;
    return vec3(map(p + e.xyy).x - a, map(p + e.yxy).x - a, map(p + e.yyx).x - a) / e.x;
}

vec2 intersect(vec3 ro, vec3 rd) {
    float d = 0.f, h = 0.f;
    for(int i = 0; i < 500; i++) { //look nice with 50 iterations
        vec3 p = ro + d * rd;
        vec2 s = map(p);
        h = s.x;
        d += h * .5f;
        if(abs(h) < .003f * d)
            return vec2(d, s.y);
        if(d > 150.f || p.y > 2.f)
            break;
    }

    return vec2(-1);
}

void addsun(vec3 rd, vec3 ld, inout vec3 col) {

    float sun = smoothstep(.21f, .2f, distance(rd, ld));

    if(sun > 0.f) {
        float yd = (rd.y - ld.y);

        float a = sin(3.1f * exp(-(yd) * 14.f));

        sun *= smoothstep(-.8f, 0.f, a);

        col = mix(col, vec3(1.f, .8f, .4f) * .75f, sun);
    }
}

float starnoise(vec3 rd) {
    float c = 0.8f;
    vec3 p = normalize(rd) * 300.f;
    for(float i = 0.f; i < 4.f; i++) {
        vec3 q = fract(p) - .5f;
        vec3 id = floor(p);
        float c2 = smoothstep(.5f, 0.f, length(q));
        c2 *= step(hash21(id.xz / id.y), .06f - i * i * 0.005f);
        c += c2;
        p = p * .6f + .5f * p * mat3(3.f / 5.f, 0, 4.f / 5.f, 0, 1, 0, -4.f / 5.f, 0, 3.f / 5.f);
    }
    c *= c;
    float g = dot(sin(rd * 10.512f), cos(rd.yzx * 10.512f));
    c *= smoothstep(-3.14f, -.9f, g) * .5f + .5f * smoothstep(-.3f, 1.f, g);
    return c * c;
}

vec3 gsky(vec3 rd, vec3 ld, bool mask) {
    float haze = exp2(-5.f * (abs(rd.y) - .2f * dot(rd, ld)));

    //float st = mask?pow512(texture(iChannel0,(rd.xy+vec2(300.1,100)*rd.z)*10.).r)*(1.-min(haze,1.)):0.;
    //float st = mask?pow512(hash21((rd.xy+vec2(300.1,100)*rd.z)*10.))*(1.-min(haze,1.)):0.;
    float st = mask ? (starnoise(rd)) * (1.f - min(haze, 1.f)) : 0.f;
    vec3 back = vec3(.4f, .1f, .7f) * (1.f - .5f * textureMirror(iChannel0, vec2(.5f + .05f * rd.x / rd.y, 0.f)).x * exp2(-.1f * abs(length(rd.xz) / rd.y)) * max(sign(rd.y), 0.f));
    #ifdef city
    float x = round(rd.x * 30.f);
    float h = hash21(vec2(x - 166.f));
    bool building = (h * h * .125f * exp2(-x * x * x * x * .0025f) > rd.y);
    if(mask && building)
        back *= 0.f, haze = .8f, mask = mask && !building;
    #endif
    // vec3 col=clamp(mix(back,vec3(.7,.1,.4),haze)+st,0.,1.);
    // if(mask)addsun(rd,ld,col);
    vec3 col = st * vec3(0.f, 0.1f, 0.1f);
    return col;
}

void main() {
    fragColor = vec4(0);
    #ifdef AA
    for(float x = 0.f; x < 1.f; x += 1.f / float(AA)) {
        for(float y = 0.f; y < 1.f; y += 1.f / float(AA)) {
    #else
            const float AA = 1.f, x = 0.f, y = 0.f;
    #endif
            // vec2 uv = (2.f * (vUv + vec2(x, y)) - u_resolution.xy) / u_resolution.y;
            vec2 uv = vUv;
            const float shutter_speed = 1.25f; // for motion blur
            float dt = fract(texture(iChannel0, float(AA) * (vUv + vec2(x, y)) / iChannelResolution[0].xy).r + u_time) * shutter_speed;
            // float dt = fract(hash21(float(AA) * (vUv + vec2(x, y))) + u_time) * shutter_speed;
            jTime = mod(u_time - dt * u_timeDelta, 4000.f);
            vec3 ro = vec3(0.f, 1, (-20000.f + jTime * speed));

        #ifdef stereo
            ro += stereo * vec3(.2f * (float(uv.x > 0.f) - .5f), 0.f, 0.f);
            const float de = .9f;
            uv.x = uv.x + .5f * (uv.x > 0.f ? -de : de);
            uv *= 2.f;
		#endif

            vec3 rd = normalize(vec3(uv, 4.f / 3.f));//vec3(uv,sqrt(1.-dot(uv,uv)));

            vec2 i = intersect(ro, rd);
            float d = i.x;

            vec3 ld = normalize(vec3(0, .125f + .05f * sin(.1f * jTime), 1));

            vec3 fog = d > 0.f ? exp2(-d * vec3(.14f, .1f, .28f)) : vec3(0.f);
            vec3 sky = gsky(rd, ld, d < 0.f);

            vec3 p = ro + d * rd;
            vec3 n = normalize(grad(p));

            float diff = dot(n, ld) + .1f * n.y;
            vec3 col = vec3(.1f, .11f, .18f) * diff;

            vec3 rfd = reflect(rd, n);
            vec3 rfcol = gsky(rfd, ld, true);

            col = mix(col, rfcol, .05f + .95f * pow(max(1.f + dot(rd, n), 0.f), 1.f));
    #ifdef VAPORWAVE
            col = mix(col, vec3(.4f, .5f, 1.f), smoothstep(.05f, .0f, i.y));
            col = mix(sky, col, fog);
            col = sqrt(col);
    #else
            col = mix(col, vec3(.18f, .1f, .92f), smoothstep(.05f, .0f, i.y));
            col = mix(sky, col, fog);
    //no gamma for that old cg look
    #endif
            if(d < 0.f)
                d = 1e6f;
            d = min(d, 10.f);
            fragColor += vec4(clamp(col, 0.f, 1.f), d < 0.f ? 0.f : .1f + exp2(-d));
     #ifdef AA
        }
    }
    fragColor /= float(AA * AA);
    #endif
}
