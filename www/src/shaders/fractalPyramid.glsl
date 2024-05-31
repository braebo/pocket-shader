#version 330 core	
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

in vec2 vUv;
out vec4 color;

vec3 palette(float d) {
	return mix(vec3(0.2, 0.7, 0.9), vec3(1., 0., 1.), d);
}

vec2 rotate(vec2 p, float a) {
	float c = cos(a);
	float s = sin(a);
	return p * mat2(c, s, -s, c);
}

float map(vec3 p) {
	for(int i = 0; i < 8; ++i) {
		float t = u_time * 0.1;
		p.xz = rotate(p.xz, t);
		p.xy = rotate(p.xy, t * 1.89);
		p.xz = abs(p.xz);
		p.xz -= .5;
	}
	return dot(sign(p), p) / 4.;
}

vec4 rm(vec3 ro, vec3 rd) {
	float t = 0.;
	vec3 col = vec3(0.);
	float d;
	for(float i = 0.; i < 150.; i++) {
		vec3 p = ro + rd * t;
		d = map(p) * .5;
		if(d < 0.05) {
			break;
		}
		if(d > 100.) {
			break;
		}
		col += palette(length(p) * .1) / (500. * (d));
		t += d;
	}
	return vec4(col, 1. / (d * 100.));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
	// vec2 uv = (fragCoord - (u_resolution.xy / 2.)) / u_resolution.x;
	vec2 uv = vUv;
	vec3 ro = vec3(0., 0., -50.);
	ro.xz = rotate(ro.xz, u_time);
	vec3 cf = normalize(-ro);
	vec3 cs = normalize(cross(cf, vec3(0., 1., 0.)));
	vec3 cu = normalize(cross(cf, cs));

	vec3 uuv = ro + cf * 3. + uv.x * cs + uv.y * cu;

	vec3 rd = normalize(uuv - ro);

	vec4 col = rm(ro, rd);

	fragColor = col;
}

void main() {
	mainImage(color, gl_FragCoord.xy);
}