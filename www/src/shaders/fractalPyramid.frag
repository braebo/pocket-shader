#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

in vec2 vUv;
out vec4 fragColor;

vec3 palette(float d) {
	return mix(vec3(0.2f, 0.7f, 0.9f), vec3(1.f, 0.f, 1.f), d);
}

vec2 rotate(vec2 p, float a) {
	float c = cos(a);
	float s = sin(a);
	return p * mat2(c, s, -s, c);
}

float map(vec3 p) {
	for(int i = 0; i < 8; ++i) {
		float t = u_time * 0.1f;
		p.xz = rotate(p.xz, t);
		p.xy = rotate(p.xy, t * 1.89f);
		p.xz = abs(p.xz);
		p.xz -= .5f;
	}
	return dot(sign(p), p) / 4.f;
}

vec4 rm(vec3 ro, vec3 rd) {
	float t = 0.f;
	vec3 col = vec3(0.f);
	float d;
	for(float i = 0.f; i < 150.f; i++) {
		vec3 p = ro + rd * t;
		d = map(p) * .5f;
		if(d < 0.05f) {
			break;
		}
		if(d > 100.f) {
			break;
		}
		col += palette(length(p) * .1f) / (500.f * (d));
		t += d;
	}
	return vec4(col, 1.f / (d * 100.f));
}


// in vec2 vUv;

void main() {
	// vec2 uv = (vUv - (u_resolution.xy / 2.)) / u_resolution.x;
	vec2 uv = vUv * 2.f - 1.f;
	vec3 ro = vec3(0.f, 0.f, -50.f);
	ro.xz = rotate(ro.xz, u_time);
	vec3 cf = normalize(-ro);
	vec3 cs = normalize(cross(cf, vec3(0.f, 1.f, 0.f)));
	vec3 cu = normalize(cross(cf, cs));

	vec3 uuv = ro + cf * 3.f + uv.x * cs + uv.y * cu;

	vec3 rd = normalize(uuv - ro);

	vec4 col = rm(ro, rd);

	fragColor = col;
}