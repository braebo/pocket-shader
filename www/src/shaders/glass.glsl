#version 300 es
precision mediump float;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

uniform float poly_U;
uniform float poly_V;
uniform float poly_W;
uniform int octave;
uniform float inner_sphere;
uniform float refr_index;
uniform float poly_zoom;

//! ------------------------------------------------------

// CC0: Let's self reflect - https://www.shadertoy.com/view/XfyXRV
// Function to generate the solid found here: https://www.shadertoy.com/view/MsKGzw

// Tinker with these parameters to create different solids
// -------------------------------------------------------
const float rotation_speed = 0.25f;
// const float poly_U = 1.f;   // [0, inf]
// const float poly_V = 0.5f;  // [0, inf]
// const float poly_W = 1.0f;  // [0, inf]
// const int octave = 3;    // [2, 5]
// const float inner_sphere = 1.f;
// const float refr_index = 0.9f;
// const float poly_zoom = 2.0f;

#define MAX_BOUNCES2        6
// -------------------------------------------------------

#define TIME        u_time
#define RESOLUTION  u_resolution
#define PI          3.141592654
#define TAU         (2.0*PI)

// License: WTFPL, author: sam hocevar, found: https://stackoverflow.com/a/17897228/418488
const vec4 hsv2rgb_K = vec4(1.0f, 2.0f / 3.0f, 1.0f / 3.0f, 3.0f);
vec3 hsv2rgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + hsv2rgb_K.xyz) * 6.0f - hsv2rgb_K.www);
    return c.z * mix(hsv2rgb_K.xxx, clamp(p - hsv2rgb_K.xxx, 0.0f, 1.0f), c.y);
}
// License: WTFPL, author: sam hocevar, found: https://stackoverflow.com/a/17897228/418488
//  Macro version of above to enable compile-u_time constants
#define HSV2RGB(c)  (c.z * mix(hsv2rgb_K.xxx, clamp(abs(fract(c.xxx + hsv2rgb_K.xyz) * 6.0 - hsv2rgb_K.www) - hsv2rgb_K.xxx, 0.0, 1.0), c.y))

#define TOLERANCE2          0.0005
//#define MAX_RAY_LENGTH2   10.0
#define MAX_RAY_MARCHES2    50
#define NORM_OFF2           0.005
#define BACKSTEP2

#define TOLERANCE3          0.0005
#define MAX_RAY_LENGTH3     10.0
#define MAX_RAY_MARCHES3    90
#define NORM_OFF3           0.005

const vec3 rayOrigin = vec3(0.0f, 1.f, -5.f);
const vec3 sunDir = normalize(-rayOrigin);

const vec3 sunCol = HSV2RGB(vec3(0.06f, 0.90f, 1E-2f)) * 1.f;
// const vec3 sunCol = HSV2RGB(vec3(0.506f, 0.90f, 1E-2f)) * 1.f;
const vec3 bottomBoxCol = HSV2RGB(vec3(0.66f, 0.80f, 0.5f)) * 1.f;
const vec3 topBoxCol = HSV2RGB(vec3(0.60f, 0.90f, 1.f)) * 1.f;
const vec3 glowCol0 = HSV2RGB(vec3(0.05f, 0.7f, 1E-3f)) * 1.f;
const vec3 glowCol1 = HSV2RGB(vec3(0.95f, 0.7f, 1E-3f)) * 1.f;
const vec3 beerCol = -HSV2RGB(vec3(0.15f + 0.5f, 0.7f, 2.f));
// const vec3 beerCol = -HSV2RGB(vec3(0.715f + 0.5f, 0.7f, 2.f));
// float rrefr_index = 1.f / refr_index;

// // License: Unknown, author: knighty, found: https://www.shadertoy.com/view/MsKGzw
// float poly_cospin = cos(PI / float(octave));
// float poly_scospin = sqrt(0.75f - poly_cospin * poly_cospin);
// vec3 poly_nc = vec3(-0.5f, -poly_cospin, poly_scospin);
// vec3 poly_pab = vec3(0.f, 0.f, 1.f);
// vec3 poly_pbc_ = vec3(poly_scospin, 0.f, 0.5f);
// vec3 poly_pca_ = vec3(0.f, poly_scospin, poly_cospin);
// vec3 poly_p = normalize((poly_U * poly_pab + poly_V * poly_pbc_ + poly_W * poly_pca_));
// vec3 poly_pbc = normalize(poly_pbc_);
// vec3 poly_pca = normalize(poly_pca_);
float rrefr_index;
float poly_cospin;
float poly_scospin;
vec3 poly_nc;
vec3 poly_pab;
vec3 poly_pbc_;
vec3 poly_pca_;
vec3 poly_p;
vec3 poly_pbc;
vec3 poly_pca;

void initializeGlobals() {
    rrefr_index = 1.0f / refr_index;
    poly_cospin = cos(PI / float(octave));
    poly_scospin = sqrt(0.75f - poly_cospin * poly_cospin);
    poly_nc = vec3(-0.5f, -poly_cospin, poly_scospin);
    poly_pab = vec3(0.0f, 0.0f, 1.0f);
    poly_pbc_ = vec3(poly_scospin, 0.0f, 0.5f);
    poly_pca_ = vec3(0.0f, poly_scospin, poly_cospin);
    poly_p = normalize((poly_U * poly_pab + poly_V * poly_pbc_ + poly_W * poly_pca_));
    poly_pbc = normalize(poly_pbc_);
    poly_pca = normalize(poly_pca_);
}

mat3 g_rot;
vec2 g_gd;

// License: MIT, author: Inigo Quilez, found: https://iquilezles.org/articles/noacos/
mat3 rot(vec3 d, vec3 z) {
    vec3 v = cross(z, d);
    float c = dot(z, d);
    float k = 1.0f / (1.0f + c);

    return mat3(v.x * v.x * k + c, v.y * v.x * k - v.z, v.z * v.x * k + v.y, v.x * v.y * k + v.z, v.y * v.y * k + c, v.z * v.y * k - v.x, v.x * v.z * k - v.y, v.y * v.z * k + v.x, v.z * v.z * k + c);
}

// License: Unknown, author: Matt Taylor (https://github.com/64), found: https://64.github.io/tonemapping/
vec3 aces_approx(vec3 v) {
    v = max(v, 0.0f);
    v *= 0.6f;
    float a = 2.51f;
    float b = 0.03f;
    float c = 2.43f;
    float d = 0.59f;
    float e = 0.14f;
    return clamp((v * (a * v + b)) / (v * (c * v + d) + e), 0.0f, 1.0f);
}

float sphere(vec3 p, float r) {
    return length(p) - r;
}

// License: MIT, author: Inigo Quilez, found: https://iquilezles.org/articles/distfunctions/
float box(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0f)) + min(max(d.x, d.y), 0.0f);
}

// License: Unknown, author: knighty, found: https://www.shadertoy.com/view/MsKGzw
void poly_fold(inout vec3 pos) {
    vec3 p = pos;

    for(int i = 0; i < octave; ++i) {
        p.xy = abs(p.xy);
        p -= 2.f * min(0.f, dot(p, poly_nc)) * poly_nc;
    }

    pos = p;
}

float poly_plane(vec3 pos) {
    float d0 = dot(pos, poly_pab);
    float d1 = dot(pos, poly_pbc);
    float d2 = dot(pos, poly_pca);
    float d = d0;
    d = max(d, d1);
    d = max(d, d2);
    return d;
}

float poly_corner(vec3 pos) {
    float d = length(pos) - .0125f;
    return d;
}

float dot2(vec3 p) {
    return dot(p, p);
}

float poly_edge(vec3 pos) {
    float dla = dot2(pos - min(0.f, pos.x) * vec3(1.f, 0.f, 0.f));
    float dlb = dot2(pos - min(0.f, pos.y) * vec3(0.f, 1.f, 0.f));
    float dlc = dot2(pos - min(0.f, dot(pos, poly_nc)) * poly_nc);
    return sqrt(min(min(dla, dlb), dlc)) - 2E-3f;
}

vec3 shape(vec3 pos) {
    pos *= g_rot;
    pos /= poly_zoom;
    poly_fold(pos);
    pos -= poly_p;

    return vec3(poly_plane(pos), poly_edge(pos), poly_corner(pos)) * poly_zoom;
}

vec3 render0(vec3 ro, vec3 rd) {
    vec3 col = vec3(0.0f);

    float srd = sign(rd.y);
    float tp = -(ro.y - 6.f) / abs(rd.y);

    if(srd < 0.f) {
        col += bottomBoxCol * exp(-0.5f * (length((ro + tp * rd).xz)));
    }

    if(srd > 0.0f) {
        vec3 pos = ro + tp * rd;
        vec2 pp = pos.xz;
        float db = box(pp, vec2(5.0f, 9.0f)) - 3.0f;

        col += topBoxCol * rd.y * rd.y * smoothstep(0.25f, 0.0f, db);
        col += 0.2f * topBoxCol * exp(-0.5f * max(db, 0.0f));
        col += 0.05f * sqrt(topBoxCol) * max(-db, 0.0f);
    }

    col += sunCol / (1.001f - dot(sunDir, rd));
    return col;
}

float df2(vec3 p) {
    vec3 ds = shape(p);
    float d2 = ds.y - 5E-3f;
    float d0 = min(-ds.x, d2);
    float d1 = sphere(p, inner_sphere);
    g_gd = min(g_gd, vec2(d2, d1));
    float d = (min(d0, d1));
    return d;
}

float rayMarch2(vec3 ro, vec3 rd, float tinit) {
    float t = tinit;
#if defined(BACKSTEP2)
    vec2 dti = vec2(1e10f, 0.0f);
#endif
    int i;
    for(i = 0; i < MAX_RAY_MARCHES2; ++i) {
        float d = df2(ro + rd * t);
#if defined(BACKSTEP2)
        if(d < dti.x) {
            dti = vec2(d, t);
        }
#endif  
    // Bouncing in a closed shell, will never miss
        if(d < TOLERANCE2/* || t > MAX_RAY_LENGTH3 */) {
            break;
        }
        t += d;
    }
#if defined(BACKSTEP2)
    if(i == MAX_RAY_MARCHES2) {
        t = dti.y;
    };
#endif  
    return t;
}

vec3 normal2(vec3 pos) {
    vec2 eps = vec2(NORM_OFF2, 0.0f);
    vec3 nor;
    nor.x = df2(pos + eps.xyy) - df2(pos - eps.xyy);
    nor.y = df2(pos + eps.yxy) - df2(pos - eps.yxy);
    nor.z = df2(pos + eps.yyx) - df2(pos - eps.yyx);
    return normalize(nor);
}

vec3 render2(vec3 ro, vec3 rd, float db) {
    vec3 agg = vec3(0.0f);
    float ragg = 1.f;
    float tagg = 0.f;

    for(int bounce = 0; bounce < MAX_BOUNCES2; ++bounce) {
        if(ragg < 0.1f)
            break;
        g_gd = vec2(1E3f);
        float t2 = rayMarch2(ro, rd, min(db + 0.05f, 0.3f));
        vec2 gd2 = g_gd;
        tagg += t2;

        vec3 p2 = ro + rd * t2;
        vec3 n2 = normal2(p2);
        vec3 r2 = reflect(rd, n2);
        vec3 rr2 = refract(rd, n2, rrefr_index);
        float fre2 = 1.f + dot(n2, rd);

        vec3 beer = ragg * exp(0.2f * beerCol * tagg);
        agg += glowCol1 * beer * ((1.f + tagg * tagg * 4E-2f) * 6.f / max(gd2.x, 5E-4f + tagg * tagg * 2E-4f / ragg));
        vec3 ocol = 0.2f * beer * render0(p2, rr2);
        if(gd2.y <= TOLERANCE2) {
            ragg *= 1.f - 0.9f * fre2;
        } else {
            agg += ocol;
            ragg *= 0.8f;
        }

        ro = p2;
        rd = r2;
        db = gd2.x;
    }

    return agg;
}

float df3(vec3 p) {
    vec3 ds = shape(p);
    g_gd = min(g_gd, ds.yz);
    const float sw = 0.02f;
    float d1 = min(ds.y, ds.z) - sw;
    float d0 = ds.x;
    d0 = min(d0, ds.y);
    d0 = min(d0, ds.z);
    return d0;
}

float rayMarch3(vec3 ro, vec3 rd, float tinit, out int iter) {
    float t = tinit;
    int i;
    for(i = 0; i < MAX_RAY_MARCHES3; ++i) {
        float d = df3(ro + rd * t);
        if(d < TOLERANCE3 || t > MAX_RAY_LENGTH3) {
            break;
        }
        t += d;
    }
    iter = i;
    return t;
}

vec3 normal3(vec3 pos) {
    vec2 eps = vec2(NORM_OFF3, 0.0f);
    vec3 nor;
    nor.x = df3(pos + eps.xyy) - df3(pos - eps.xyy);
    nor.y = df3(pos + eps.yxy) - df3(pos - eps.yxy);
    nor.z = df3(pos + eps.yyx) - df3(pos - eps.yyx);
    return normalize(nor);
}

vec3 render3(vec3 ro, vec3 rd) {
    int iter;

    vec3 skyCol = render0(ro, rd);
    vec3 col = skyCol;

    g_gd = vec2(1E3f);
    float t1 = rayMarch3(ro, rd, 0.1f, iter);
    vec2 gd1 = g_gd;
    vec3 p1 = ro + t1 * rd;
    vec3 n1 = normal3(p1);
    vec3 r1 = reflect(rd, n1);
    vec3 rr1 = refract(rd, n1, refr_index);
    float fre1 = 1.f + dot(rd, n1);
    fre1 *= fre1;

    float ifo = mix(0.5f, 1.f, smoothstep(1.0f, 0.9f, float(iter) / float(MAX_RAY_MARCHES3)));

    if(t1 < MAX_RAY_LENGTH3) {
        col = render0(p1, r1) * (0.5f + 0.5f * fre1) * ifo;
        vec3 icol = render2(p1, rr1, gd1.x);
        if(gd1.x > TOLERANCE3 && gd1.y > TOLERANCE3 && rr1 != vec3(0.f)) {
            col += icol * (1.f - 0.75f * fre1) * ifo;
        }
    }

    col += (glowCol0 + 1.f * fre1 * (glowCol0)) / max(gd1.x, 3E-4f);
    return col;

}

vec3 effect(vec2 p, vec2 pp) {
    const float fov = 2.0f;

    const vec3 up = vec3(0.f, 1.f, 0.f);
    const vec3 la = vec3(0.0f);

    const vec3 ww = normalize(normalize(la - rayOrigin));
    const vec3 uu = normalize(cross(up, ww));
    const vec3 vv = cross(ww, uu);

    vec3 rd = normalize(-p.x * uu + p.y * vv + fov * ww);

    vec3 col = vec3(0.0f);
    col = render3(rayOrigin, rd);

    col -= 2E-2f * vec3(2.f, 3.f, 1.f) * (length(p) + 0.25f);
    col = aces_approx(col);
    col = sqrt(col);
    return col;
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 q = fragCoord / RESOLUTION.xy;
    vec2 p = -1.0f + 2.0f * q;
    vec2 pp = p;
    p.x *= RESOLUTION.x / RESOLUTION.y;

    initializeGlobals();

    float a = TIME * rotation_speed;
    vec3 r0 = vec3(1.0f, sin(vec2(sqrt(0.5f), 1.0f) * a));
    vec3 r1 = vec3(cos(vec2(sqrt(0.5f), 1.0f) * 0.913f * a), 1.0f);
    mat3 rot = rot(normalize(r0), normalize(r1));
    g_rot = rot;

    vec3 col = effect(p, pp);

    fragColor = vec4(col, 1.0f);
}