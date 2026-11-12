// engine/post3d.js - cinematic post chain for 3D shots: depth of field, display-space colour grade (exposure, warm/teal,
// contrast, saturation, god rays, optional vignette/grain) and SMAA. The grade shader is ported from
// thuann-vn/claude-3d-animated-shorts engine/post.js (MIT), rebuilt on three's own passes (no extra npm packages).
// Used by three-kit stage({ post: {...} }). The player still applies the style grade, vignette and grain on the final frame,
// so the defaults here stay gentle (vignette 0, grain 0).
import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uExp: { value: 1 }, uWarm: { value: 0 }, uTeal: { value: 0 }, uCon: { value: 1 }, uSat: { value: 1 }, uVig: { value: 1 },
    uLift: { value: new THREE.Vector3() }, uMul: { value: new THREE.Vector3(1, 1, 1) }, uShTint: { value: new THREE.Vector3(0.82, 0.98, 1.12) },
    uSun: { value: new THREE.Vector2(0.5, 1.2) }, uRays: { value: 0 }, uGrain: { value: 0 }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1080, 1920) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uExp, uWarm, uTeal, uCon, uSat, uVig, uRays, uGrain, uTime; uniform vec3 uLift, uMul, uShTint; uniform vec2 uSun, uRes; varying vec2 vUv;
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
    vec3 toS(vec3 c){ return mix(c * 12.92, 1.055 * pow(max(c, 0.0), vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }
    vec3 toL(vec3 c){ return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    vec3 rays(vec2 uv){ vec2 d = (uv - uSun) / 40.0; vec2 p = uv; float il = 1.0; vec3 acc = vec3(0.0);
      for (int i = 0; i < 40; i++){ p -= d; vec3 s = toS(aces(texture2D(tDiffuse, clamp(p, 0.001, 0.999)).rgb * uExp)); float b = max(0.0, dot(s, vec3(0.3, 0.59, 0.11)) - 0.72); acc += s * b * il; il *= 0.955; }
      return acc * 0.09 * uRays; }
    void main(){
      vec3 c = toS(aces(texture2D(tDiffuse, vUv).rgb * uExp)); if (uRays > 0.0) c += rays(vUv) * vec3(1.0, 0.86, 0.6);
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(c, c * uShTint, (1.0 - l) * uTeal); c = mix(c, c * vec3(1.14, 1.0, 0.82), l * uWarm);
      c = (c - 0.5) * uCon + 0.5; c = mix(vec3(dot(c, vec3(0.299, 0.587, 0.114))), c, uSat);
      float v = smoothstep(1.05, 0.3, length((vUv - 0.5) * vec2(1.0, 1.25))); c *= mix(uVig, 1.0, v);
      c = c * uMul + uLift; if (uGrain > 0.0) c += (h(vUv * uRes + uTime * 60.0) - 0.5) * uGrain;
      gl_FragColor = vec4(toL(clamp(c, 0.0, 1.0)), 1.0); }`,
};

// presets: neutral keeps the studio look; cinematic = the 3D repo's measured "darker, warmer" grade (exposure handled by the renderer)
export const POST_PRESETS = {
  neutral: { exp: 1, sat: 1, con: 1, warm: 0, teal: 0 },
  cinematic: { exp: 1.05, sat: 1.04, con: 1.06, warm: 0.06, teal: 0.1 },
  warm: { exp: 1.02, sat: 1.15, con: 1.06, warm: 0.14, teal: 0.05 },
  cool: { exp: 1, sat: 0.95, con: 1.12, warm: 0, teal: 0.3 },
};

// cinematic(composer, { scene, camera, w, h }, o) — call after the bloom pass and the OutputPass have been added.
// Order: Render -> (Bokeh) -> Bloom -> Grade (ACES + display-space grade, back to linear) -> SMAA -> Output (sRGB only).
// The stage must render with renderer.toneMapping = NoToneMapping (three-kit does this when post is on).
// o: preset name or { preset, exp, sat, con, warm, teal, vignette, grain, rays, sun:[u,v], dof:{ focus, aperture, maxblur }, smaa }
// returns { grade (uniforms), bokeh (BokehPass or null), set(o) }
export function cinematic(composer, ctx, o = {}) {
  if (typeof o === 'string') o = { preset: o };
  const { scene, camera, w, h } = ctx;
  let bokeh = null;
  if (o.dof) { // depth of field goes right after the scene render (before bloom), so it blurs the lit HDR image
    bokeh = new BokehPass(scene, camera, { focus: o.dof.focus ?? 5, aperture: o.dof.aperture ?? 0.004, maxblur: o.dof.maxblur ?? 0.01 });
    composer.insertPass(bokeh, 1);
  }
  const pass = new ShaderPass(GradeShader); const U = pass.uniforms; U.uRes.value.set(w, h);
  const outIdx = composer.passes.length - 1;   // the OutputPass stays last
  composer.insertPass(pass, outIdx);
  if (o.smaa !== false) composer.insertPass(new SMAAPass(w, h), outIdx + 1);
  const set = (p = {}) => {
    const v = { ...POST_PRESETS[p.preset || o.preset || 'cinematic'], ...p };
    U.uExp.value = v.exp ?? 1; U.uSat.value = v.sat ?? 1; U.uCon.value = v.con ?? 1; U.uWarm.value = v.warm ?? 0; U.uTeal.value = v.teal ?? 0;
    U.uVig.value = 1 - (v.vignette ?? 0); U.uGrain.value = v.grain ?? 0; U.uRays.value = v.rays ?? 0; if (v.sun) U.uSun.value.set(...v.sun);
    if (v.mul) U.uMul.value.set(...v.mul); if (v.lift) U.uLift.value.set(...v.lift);
  };
  set(o);
  // focusOn(worldPoint, aperture?) — set DOF focus to the camera distance of a point (call per frame after moving the camera)
  const focusOn = (p, aperture) => { if (!bokeh) return; const P = Array.isArray(p) ? new THREE.Vector3(...p) : p; bokeh.uniforms.focus.value = camera.position.distanceTo(P); if (aperture != null) bokeh.uniforms.aperture.value = aperture; };
  return { grade: U, bokeh, set, focusOn };
}
