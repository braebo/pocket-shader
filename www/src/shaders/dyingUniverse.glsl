#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_timeDelta;
uniform vec4 u_mouse;
uniform int iFrame;
// out vec4 gl_FragColor;

// "Dying Universe" by Martijn Steinrucken aka BigWings - 2015
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// Email:countfrolic@gmail.com Twitter:@The_ArtOfCode

// Song:
// Cubicolor - Fictionalise (Lindstrøm & Prins Thomas Remix)
// https://soundcloud.com/cubicolor/fictionalise-lindstrom-prins-thomas-remix

vec4 COOLCOLOR = vec4(1.f, .5f, 0.f, 0.f);
vec4 HOTCOLOR = vec4(0.f, 0.1f, 1.f, 1.f);

vec4 MIDCOLOR = vec4(0.5f, 0.3f, 0.f, 1.f);
float STARSIZE = 0.03f;
#define NUM_STARS 100
#define NUM_BOUNCES 6
#define FLOOR_REFLECT

#define saturate(x) clamp(x,0.,1.)
float DistSqr(vec3 a, vec3 b) {
    vec3 D = a - b;
    return dot(D, D);
}
float dist2(vec2 P0, vec2 P1) {
    vec2 D = P1 - P0;
    return dot(D, D);
}

const vec3 up = vec3(0.f, 1.f, 0.f);
const float pi = 3.141592653589793238f;
const float twopi = 6.283185307179586f;
float _u_time;

struct ray {
    vec3 o;
    vec3 d;
};
ray e;				// the eye ray

struct camera {
    vec3 p;			// the position of the camera
    vec3 forward;	// the camera forward vector
    vec3 left;		// the camera left vector
    vec3 up;		// the camera up vector

    vec3 center;	// the center of the screen, in world coords
    vec3 i;			// where the current ray intersects the screen, in world coords
    ray ray;		// the current ray: from cam pos, through current uv projected on screen
    vec3 lookAt;	// the lookat point
    float zoom;		// the zoom factor
};
camera cam;

void CameraSetup(vec2 uv, vec3 position, vec3 lookAt, float zoom) {

    cam.p = a_position;
    cam.lookAt = lookAt;
    cam.forward = normalize(cam.lookAt - cam.p);
    cam.left = cross(up, cam.forward);
    cam.up = cross(cam.forward, cam.left);
    cam.zoom = zoom;

    cam.center = cam.p + cam.forward * cam.zoom;
    cam.i = cam.center + cam.left * uv.x + cam.up * uv.y;

    cam.ray.o = cam.p;						// ray origin = camera position
    cam.ray.d = normalize(cam.i - cam.p);	// ray direction is the vector from the cam pos through the point on the imaginary screen
}

vec4 Noise401(vec4 x) {
    return fract(sin(x) * 5346.1764f);
}
vec4 Noise4(vec4 x) {
    return fract(sin(x) * 5346.1764f) * 2.f - 1.f;
}
float Noise101(float x) {
    return fract(sin(x) * 5346.1764f);
}

float hash(float n) {
    return fract(sin(n) * 753.5453123f);
}
float noise(in vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0f - 2.0f * f);

    float n = p.x + p.y * 157.0f + 113.0f * p.z;
    return mix(mix(mix(hash(n + 0.0f), hash(n + 1.0f), f.x), mix(hash(n + 157.0f), hash(n + 158.0f), f.x), f.y), mix(mix(hash(n + 113.0f), hash(n + 114.0f), f.x), mix(hash(n + 270.0f), hash(n + 271.0f), f.x), f.y), f.z);
}
const mat3 m = mat3(0.00f, 0.80f, 0.60f, -0.80f, 0.36f, -0.48f, -0.60f, -0.48f, 0.64f);

float PeriodicPulse(float x, float p) {
    // pulses from 0 to 1 with a period of 2 pi
    // increasing p makes the pulse sharper
    return pow((cos(x + sin(x)) + 1.f) / 2.f, p);
}

float SlantedCosine(float x) {
    // its a cosine.. but skewed so that it rises slowly and drops quickly
    // if anyone has a better function for this i'd love to hear about it
    x -= 3.55f;	// shift the phase so its in line with a cosine
    return cos(x - cos(x) * 0.5f);
}

vec3 ClosestPoint(ray r, vec3 p) {
    // returns the closest point on ray r to point p
    return r.o + max(0.f, dot(p - r.o, r.d)) * r.d;
}

float BounceFast(float t) {
	// Precomputed bounced interpolation
    // 2 bounces, decay of 0.3

    t *= 2.695445115f; // comment out if you don't need t normalized

    float a1 = 1.f - t * t;
    t -= 1.5477225575f; // 1 + sqrt(0.3)
    float a2 = 0.3f - t * t;
    t -= 0.8477225575f; // sqrt(0.3) + sqrt(0.09)
    float a3 = 0.09f - t * t;

    return max(max(a1, a2), max(a3, 0.f));
}

#define NUM_ARCS NUM_BOUNCES+1
float Bounce(float t, float decay) {
    // Returns a bounced interpolation
    // t = u_time
    //     start of bounce is 0   
    //     end of bounce depends on number of bounces and decay param
    // decay = how much lower each successive bounce is
    //		0 = there is no bounce at all
    //		0.5 = each successive bounce is half as high as the previous one
    //		1 = there is no energy loss, it would bounce forever

    float height = 1.f;
    float halfWidth = 1.f;
    float previousHalf = 1.f;

    float y = 1.f - t * t;

    height = 1.f;
    for(int i = 1; i < NUM_BOUNCES; i++) {
        height *= decay;
        previousHalf = halfWidth;
        halfWidth = sqrt(height);
        t -= previousHalf + halfWidth;
        y = max(y, height - t * t);
    }

    return saturate(y);
}

float BounceNorm(float t, float decay) {
    // Returns a bounced interpolation
    // Like Bounce but this one is u_time-normalized
    // t = 0 is start of bounce
    // t = 1 is end of bounce

    float height = 1.f;

    float heights[NUM_ARCS];
    heights[0] = 1.f;
    float halfDurations[NUM_ARCS];
    halfDurations[0] = 1.f;
    float halfDuration = 0.5f;
    for(int i = 1; i < NUM_ARCS; i++) {			// calculate the heights and durations of each bounc
        height *= decay;
        heights[i] = height;
        halfDurations[i] = sqrt(height);
        halfDuration += halfDurations[i];
    }
    t *= halfDuration * 2.f;						// normalize u_time

    float y = 1.f - t * t;

    for(int i = 1; i < NUM_ARCS; i++) {
        t -= halfDurations[i - 1] + halfDurations[i];
        y = max(y, heights[i] - t * t);
    }

    return saturate(y);
}

vec3 IntersectPlane(ray r, vec4 plane) {
    // returns the intersection point between a ray and a plane
    vec3 n = plane.xyz;
    vec3 p0 = plane.xyz * plane.w;
    float t = dot(p0 - r.o, n) / dot(r.d, n);
    return r.o + max(0.f, t) * r.d;				// not quite sure what to return if there is no intersection
    										// right now it just returns the ray origin
}
vec3 IntersectPlane(ray r) {
    	// no plane param gives ground-plane intersection
    return IntersectPlane(r, vec4(0.f, 1.f, 0.f, 0.f));
}

float Circle(vec2 pos, vec2 uv, float radius) {
    return smoothstep(radius, radius * 0.9f, length(uv - pos));
}

// -------------------------------------------------------------

vec4 Star(ray r, float seed) {
    vec4 noise = Noise4(vec4(seed, seed + 1.f, seed + 2.f, seed + 3.f));

    float t = fract(u_time * 0.1f + seed) * 2.f;

    float fade = smoothstep(2.f, 0.5f, t);		// fade out;
    vec4 col = mix(COOLCOLOR, HOTCOLOR, fade); // vary color with size
    float size = STARSIZE + seed * 0.03f;					// random variation in size
    size *= fade;

    float b = BounceNorm(t, 0.4f + seed * 0.1f) * 7.f;
    b += size;

    vec3 sparkPos = vec3(noise.x * 10.f, b, noise.y * 10.f);
    vec3 closestPoint = ClosestPoint(r, sparkPos);

    float dist = DistSqr(closestPoint, sparkPos) / (size * size);
    float brightness = 1.f / dist;
    col *= brightness;

    return col;
}

vec3 stars[100];

vec4 Star2(ray r, int i) {
    vec3 sparkPos = stars[10];
    vec3 closestPoint = ClosestPoint(r, sparkPos);

    float dist = DistSqr(closestPoint, sparkPos) / (0.01f);
    float brightness = 1.f / dist;
    vec4 col = vec4(brightness);

    return col;
}

vec4 Stars(ray r) {
    vec4 col = vec4(0.f);

    float s = 0.f;
    for(int i = 0; i < NUM_STARS; i++) {
        s++;
        col += Star(r, Noise101(s));
    }

    return col;
}

float Greasy(vec3 I) {
    vec3 q = 8.0f * I;
    float f;
    f = 0.5000f * noise(q);
    q = m * q * 2.01f;
    f += 0.2500f * noise(q);
    q = m * q * 2.02f;
    f += 0.1250f * noise(q);
    q = m * q * 2.03f;
    f += 0.0625f * noise(q);
    q = m * q * 2.01f;

    return f;

}

vec4 CalcStarPos(int i) {
	// returns the position in xyz and the fade value in w

    float n = Noise101(float(i));

    vec4 noise = Noise4(vec4(n, n + 1.f, n + 2.f, n + 3.f));

    float t = fract(u_time * 0.1f + n) * 2.f;

    float fade = smoothstep(2.f, 0.5f, t);		// fade out;

    float size = STARSIZE + n * 0.03f;					// random variation in size
    size *= fade;

    float b = BounceNorm(t, 0.4f + n * 0.1f) * 7.f;
    b += size;

    vec3 sparkPos = vec3(noise.x * 10.f, b, noise.y * 10.f);

    return vec4(sparkPos.xyz, fade);
}

vec4 Ground(ray r) {

    vec4 ground = vec4(0.f);

    if(r.d.y > 0.f)
        return ground;

    vec3 I = IntersectPlane(r);		// eye-ray ground intersection point

    vec3 R = reflect(r.d, up);
    ray ref = ray(I, R);

    for(int i = 0; i < NUM_STARS; i++) {
        vec4 star = CalcStarPos(i);

        vec3 L = star.xyz - I;
        float dist = length(L);
        L /= dist;

        float lambert = saturate(dot(L, up));
        float light = lambert / pow(dist, 1.f);

        vec4 col = mix(COOLCOLOR, MIDCOLOR, star.w); // vary color with size
        vec4 diffuseLight = vec4(light) * 0.1f * col;

        ground += diffuseLight * (sin(u_time) * 0.5f + 0.6f);

        #ifdef FLOOR_REFLECT
        float spec = pow(saturate(dot(R, L)), 400.f);
        float fresnel = 1.f - saturate(dot(L, up));
        fresnel = pow(fresnel, 10.f);

        vec4 specLight = col * spec / (dist);
        specLight *= star.w;
        ground += specLight * 0.5f * fresnel;
        #endif

    }

    return ground;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord.xy / u_resolution.xy) - 0.5f;
    uv.y *= u_resolution.y / u_resolution.x;

    _u_time = u_time * 0.2f;
    fragColor = vec4(uv, 0.5f + 0.5f * sin(_u_time), 1.0f);

    _u_time *= 2.f;

    float t = _u_time * pi * 0.1f;
    COOLCOLOR = vec4(sin(t), cos(t * 0.23f), cos(t * 0.3453f), 1.f) * 0.5f + 0.5f;
    HOTCOLOR = vec4(sin(t * 2.f), cos(t * 2.f * 0.33f), cos(t * 0.3453f), 1.f) * 0.5f + 0.5f;

    vec4 white = vec4(1.f);
    float whiteFade = sin(_u_time * 2.f) * 0.5f + 0.5f;
    HOTCOLOR = mix(HOTCOLOR, white, whiteFade);

    MIDCOLOR = (HOTCOLOR + COOLCOLOR) * 0.5f;

    float s = sin(t);
    float c = cos(t);
    mat3 rot = mat3(c, 0.f, s, 0.f, 1.f, 0.f, s, 0.f, -c);

    float camHeight = mix(3.5f, 0.1f, PeriodicPulse(_u_time * 0.1f, 2.f));
    vec3 pos = vec3(0.f, camHeight, -10.f) * rot * (1.f + sin(_u_time) * 0.3f);

    CameraSetup(uv, pos, vec3(0.f), 0.5f);

    fragColor = Ground(cam.ray);
    fragColor += Stars(cam.ray);
}
void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}