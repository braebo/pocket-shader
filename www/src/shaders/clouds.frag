precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

in vec2 vUv;
out vec4 fragColor;

float parameter1 = 0.;

// Protean clouds by nimitz (twitter: @stormoid)
// https://www.shadertoy.com/view/3l23Rh
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
// Contact the author for other licensing options

/*
	Technical details:

	The main volume noise is generated from a deformed periodic grid, which can produce
	a large range of noise-like patterns at very cheap evalutation cost. Allowing for multiple
	fetches of volume gradient computation for improved lighting.

	To further accelerate marching, since the volume is smooth, more than half the density
	information isn't used to rendering or shading but only as an underlying volume	distance to 
	determine dynamic step size, by carefully selecting an equation	(polynomial for speed) to 
	step as a function of overall density (not necessarialy rendered) the visual results can be 
	the	same as a naive implementation with ~40% increase in rendering performance.

	Since the dynamic marching step size is even less uniform due to steps not being rendered at all
	the fog is evaluated as the difference of the fog integral at each rendered step.
*/

mat2 rot(in float a) {
	float c = cos(a), s = sin(a);
	return mat2(c, s, -s, c);
}
const mat3 m3 = mat3(0.33338, 0.56034, -0.71817, -0.87887, 0.32651, -0.15323, 0.15162, 0.69596, 0.61339) * 1.93;
float mag2(vec2 p) {
	return dot(p, p);
}
float linstep(in float mn, in float mx, in float x) {
	return clamp((x - mn) / (mx - mn), 0., 1.);
}

vec2 disp(float t) {
	return vec2(sin(t * 0.22) * 1., cos(t * 0.175) * 1.) * 2.;
}

vec2 map(vec3 p) {
	vec3 p2 = p;
	p2.xy -= disp(p.z).xy;
	p.xy *= rot(sin(p.z + u_time) * (0.1 + parameter1 * 0.05) + u_time * 0.09);
	float cl = mag2(p2.xy);
	float d = 0.;
	p *= .61;
	float z = 1.;
	float trk = 1.;
	float dspAmp = 0.1 + parameter1 * 0.2;
	for(int i = 0; i < 5; i++) {
		p += sin(p.zxy * 0.75 * trk + u_time * trk * .8) * dspAmp;
		d -= abs(dot(cos(p), sin(p.yzx)) * z);
		z *= 0.57;
		trk *= 1.4;
		p = p * m3;
	}
	// d = abs(d + parameter1 * 3.) + parameter1 * .3 - 2.5 + u_mouse.y;
	d = abs(d + parameter1 * 3.) + parameter1 * .3 - 2.5 + pow(sin(u_time * 0.5), 5.0) * 2.;
	return vec2(d + cl * .2 + 0.25, cl);
}

vec4 render(in vec3 ro, in vec3 rd, float u_time) {
	vec4 rez = vec4(0);
	const float ldst = 8.;
	vec3 lpos = vec3(disp(u_time + ldst) * 0.5, u_time + ldst);
	float t = 1.5;
	float fogT = 0.;
	for(int i = 0; i < 130; i++) {
		if(rez.a > 0.99)
			break;

		vec3 pos = ro + t * rd;
		vec2 mpv = map(pos);
		float den = clamp(mpv.x - 0.3, 0., 1.) * 1.12;
		float dn = clamp((mpv.x + 2.), 0., 3.);

		vec4 col = vec4(0);
		if(mpv.x > 0.6) {

			col = vec4(sin(vec3(5., 0.4, 0.2) + mpv.y * 0.1 + sin(pos.z * 0.4) * 0.5 + 1.8) * 0.5 + 0.5, 0.08);
			col *= den * den * den;
			col.rgb *= linstep(4., -2.5, mpv.x) * 2.3;
			float dif = clamp((den - map(pos + .8).x) / 9., 0.001, 1.);
			dif += clamp((den - map(pos + .35).x) / 2.5, 0.001, 1.);
			col.xyz *= den * (vec3(0.005, .045, .075) + 1.5 * vec3(0.033, 0.07, 0.03) * dif);
		}

		float fogC = exp(t * 0.2 - 2.2);
		col.rgba += vec4(0.06, 0.11, 0.11, 0.1) * clamp(fogC - fogT, 0., 1.);
		fogT = fogC;
		rez = rez + col * (1. - rez.a);
		t += clamp(0.5 - dn * dn * .05, 0.09, 0.3);
	}
	return clamp(rez, 0.0, 1.0);
}

float getsat(vec3 c) {
	float mi = min(min(c.x, c.y), c.z);
	float ma = max(max(c.x, c.y), c.z);
	return (ma - mi) / (ma + 1e-7);
}

//from my "Will it blend" shader (https://www.shadertoy.com/view/lsdGzN)
vec3 iLerp(in vec3 a, in vec3 b, in float x) {
	vec3 ic = mix(a, b, x) + vec3(1e-6, 0., 0.);
	float sd = abs(getsat(ic) - mix(getsat(a), getsat(b), x));
	vec3 dir = normalize(vec3(2. * ic.x - ic.y - ic.z, 2. * ic.y - ic.x - ic.z, 2. * ic.z - ic.y - ic.x));
	float lgt = dot(vec3(1.0), ic);
	float ff = dot(dir, normalize(ic));
	ic += 1.5 * dir * sd * ff * lgt;
	return clamp(ic, 0., 1.);
}

void main() {
	vec2 q = vUv;
	vec2 center = (vUv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

	float time = u_time * 2.0;
	vec3 ro = vec3(0, 0, time);

	// ro += vec3(sin(time) * 0.5, sin(time * 1.0) * 0.0, 0);
	ro += vec3(sin(time * 0.5) * 0.5, sin(time * 0.5) * 0.0, 0);

	float displacement = 0.85;
	ro.xy += disp(ro.z) * displacement;
	float target_distance = 3.5;

	vec3 target = normalize(ro - vec3(disp(time + target_distance) * displacement, time + target_distance));

	// Center and scale mouse offset
	vec2 mouseOffset = (u_mouse - 0.5) * vec2(-3.0, 3.0); // Invert x-axis and scale
    ro.xy += mouseOffset;

	vec3 rightdir = normalize(cross(target, vec3(0, 1, 0)));
	vec3 updir = normalize(cross(rightdir, target));
	rightdir = normalize(cross(updir, target));
	vec3 rd = normalize((center.x * rightdir + center.y * updir) - target);

	// float parameter1 = smoothstep(-0.4, 0.4, sin(time * 0.3));
	float parameter1 = smoothstep(-0.4, 0.4, sin(time * 0.25));
	vec4 scn = render(ro, rd, time);

	vec3 col = scn.rgb;
	col = iLerp(col.bgr, col.rgb, clamp(1.0 - parameter1, 0.05, 1.0));

	col = pow(col, vec3(0.55, 0.65, 0.6)) * vec3(1.0, 0.97, 0.9);

	col *= pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.12) * 0.7 + 0.3; // Vignette effect

	fragColor = vec4(col, 1.0);
}
