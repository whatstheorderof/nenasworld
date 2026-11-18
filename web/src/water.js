// Cartoon water: blue cells with bright foam lines between them, the cells slowly drifting and
// changing shape, a darker blue pooled inside each one. Used for the pond, river, waterfall,
// beach sea and the ocean far below the island. One clock drives them all.
import * as THREE from 'three';

const mats = [];
const vert = `varying vec3 vW; varying vec2 vUv;
  #include <fog_pars_vertex>
  void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const frag = `uniform float uTime, uScale, uSpeed, uEdge, uNight, uFall, uAlpha; uniform vec3 uDeep, uMid, uFoam; uniform vec2 uFlow;
  varying vec3 vW; varying vec2 vUv;
  #include <fog_pars_fragment>
  vec2 hash2(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    float a = dot(hash2(i) - 0.5, f), b = dot(hash2(i + vec2(1, 0)) - 0.5, f - vec2(1, 0)), c = dot(hash2(i + vec2(0, 1)) - 0.5, f - vec2(0, 1)), d = dot(hash2(i + vec2(1, 1)) - 0.5, f - vec2(1, 1));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y); }
  // distance to the nearest and second-nearest moving cell centre
  vec2 cells(vec2 p, float t) { vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)), o = hash2(i + g);
      o = 0.5 + 0.42 * sin(t + 6.2831 * o); float d = length(g + o - f); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
    return vec2(d1, d2); }
  void main() {
    vec2 p = (uFall > 0.5 ? vec2(vUv.x * 3.0, vUv.y * 6.0 + uTime * 1.6) : vW.xz / uScale + uFlow * uTime);
    p += vec2(noise(p * 1.7 + uTime * 0.15), noise(p * 1.7 - 3.1 + uTime * 0.12)) * 0.55;   // wobbly, hand-drawn edges
    float t = uTime * uSpeed;
    vec2 c = cells(p, t), c2 = cells(p * 1.35 + vec2(4.7, 1.3), t * 0.8);
    float edge = c.y - c.x;
    vec3 col = uMid;
    col = mix(col, uDeep, step(0.32, c2.x) * 0.85);                         // darker pools inside each cell
    col = mix(col, uFoam, 1.0 - smoothstep(uEdge, uEdge + 0.035, edge));     // the bright lines between cells
    col = mix(col, col * vec3(0.18, 0.24, 0.42), uNight);
    gl_FragColor = vec4(col, uAlpha);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }`;

export function waterMaterial({ deep = 0x138ccc, mid = 0x2ea0d8, foam = 0xe0ffff, scale = 3.2, speed = 0.55, edge = 0.075, flow = [0.04, 0.02], fall = false, alpha = 1, fog = true } = {}) {
  const m = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, fog, transparent: alpha < 1, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: { value: 0 }, uScale: { value: scale }, uSpeed: { value: speed }, uEdge: { value: edge }, uNight: { value: 0 }, uFall: { value: fall ? 1 : 0 }, uAlpha: { value: alpha },
      uDeep: { value: new THREE.Color(deep) }, uMid: { value: new THREE.Color(mid) }, uFoam: { value: new THREE.Color(foam) }, uFlow: { value: new THREE.Vector2(...flow) } } });
  mats.push(m); return m;
}
// call every frame
export function tickWater(t, night = 0) { for (const m of mats) { m.uniforms.uTime.value = t; m.uniforms.uNight.value = night; } }
