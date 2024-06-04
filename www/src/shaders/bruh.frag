#version 300 es
// https://www.shadertoy.com/view/tlVGDt

// precision highp float;
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

float gTime = 0.;
const float REPEAT = 5.0;

// 回転行列
mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, s, -s, c);
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float box(vec3 pos, float scale) {
    pos *= scale;
    float base = sdBox(pos, vec3(.4, .4, .1)) / 1.5;
    pos.xy *= 5.;
    pos.y -= 3.5;
    pos.xy *= rot(.75);
    float result = -base;
    return result;
}

float box_set(vec3 pos, float u_time) {
    vec3 pos_origin = pos;
    pos = pos_origin;
    pos.y += sin(gTime * 0.4) * 2.5;
    pos.xy *= rot(.8);
    float box1 = box(pos, 2. - abs(sin(gTime * 0.4)) * 1.5);
    pos = pos_origin;
    pos.y -= sin(gTime * 0.4) * 2.5;
    pos.xy *= rot(.8);
    float box2 = box(pos, 2. - abs(sin(gTime * 0.4)) * 1.5);
    pos = pos_origin;
    pos.x += sin(gTime * 0.4) * 2.5;
    pos.xy *= rot(.8);
    float box3 = box(pos, 2. - abs(sin(gTime * 0.4)) * 1.5);
    pos = pos_origin;
    pos.x -= sin(gTime * 0.4) * 2.5;
    pos.xy *= rot(.8);
    float box4 = box(pos, 2. - abs(sin(gTime * 0.4)) * 1.5);
    pos = pos_origin;
    pos.xy *= rot(.8);
    float box5 = box(pos, .5) * 6.;
    pos = pos_origin;
    float box6 = box(pos, .5) * 6.;
    float result = max(max(max(max(max(box1, box2), box3), box4), box5), box6);
    return result;
}

float map(vec3 pos, float u_time) {
    vec3 pos_origin = pos;
    float box_set1 = box_set(pos, u_time);

    return box_set1;
}

in vec2 vUv;
out vec4 fragColor;

void main() {
    // vec2 fragCoord = gl_FragCoord.xy;
    vec2 fragCoord = vUv * u_resolution;
    vec2 p = (fragCoord.xy * 2. - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    vec3 ro = vec3(0., -0.2, u_time * 4.);
    vec3 ray = normalize(vec3(p, 1.5));
    ray.xy = ray.xy * rot(sin(u_time * .03) * 5.);
    ray.yz = ray.yz * rot(sin(u_time * .05) * .2);
    float t = 0.1;
    vec3 col = vec3(0.);
    float ac = 0.0;

    // for(int i = 0; i < 99; i++) {
    for(int i = 0; i < 99; i++) {
        vec3 pos = ro + ray * t;
        pos = mod(pos - 2., 4.) - 2.;
        gTime = u_time - float(i) * 0.01;

        float d = map(pos, u_time);

        d = max(abs(d), 0.01);
        ac += exp(-d * 23.);

        t += d * 0.55;
    }

    col = vec3(ac * 0.02);

    col += vec3(0., 0.2 * abs(sin(u_time)), 0.5 + sin(u_time) * 0.2);

    fragColor = vec4(col, 1.0 - t * (0.02 + 0.02 * sin(u_time)));
}
