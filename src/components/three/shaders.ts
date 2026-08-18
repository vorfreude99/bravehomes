/**
 * GLSL used across the 3D scenes. Kept as plain strings and fed to
 * <shaderMaterial> so no `extend()` / JSX augmentation is needed.
 */

/** Vertical gradient sky dome, rendered on the inside of a sphere. */
export const skyVert = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const skyFrag = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uBottom;
  uniform vec3 uGlow;
  uniform float uTime;
  varying vec3 vWorld;

  void main() {
    float h = normalize(vWorld).y * 0.5 + 0.5;
    vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, h));

    // A soft sun bloom that drifts, so the sky is never quite static.
    vec3 sunDir = normalize(vec3(sin(uTime * 0.05) * 0.4 + 0.5, 0.55, -0.7));
    float sun = pow(max(dot(normalize(vWorld), sunDir), 0.0), 8.0);
    col += uGlow * sun * 0.45;

    gl_FragColor = vec4(col, 1.0);
  }
`;

/**
 * Drifting pollen / firefly points.
 * Each point carries its own phase in the `aSeed` attribute so the
 * whole field animates from one uniform without per-point CPU work.
 */
export const pollenVert = /* glsl */ `
  attribute float aSeed;
  attribute float aScale;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;

  void main() {
    vec3 p = position;

    float t = uTime * 0.25 + aSeed * 6.2831;
    p.x += sin(t * 0.9) * 0.35;
    p.y += sin(t * 0.6 + aSeed) * 0.45 + mod(uTime * 0.08 + aSeed, 1.0) * 2.0 - 1.0;
    p.z += cos(t * 0.7) * 0.35;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * uPixelRatio * (26.0 / -mv.z);

    // Fade at the extremes of the drift so points never pop.
    vAlpha = 0.35 + 0.65 * sin(t * 0.5) * 0.5 + 0.3;
  }
`;

export const pollenFrag = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    // Round, soft-edged sprite from the point coord.
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(uColor, soft * vAlpha);
  }
`;

/**
 * Two generations as two point clusters. `aGroup` is 0 for the younger
 * cluster and 1 for the elder one; the shader tints and orbits each
 * differently, and `uMix` draws them together over time.
 */
export const constellationVert = /* glsl */ `
  attribute float aGroup;
  attribute float aSeed;
  uniform float uTime;
  uniform float uMix;
  uniform float uPixelRatio;
  varying float vGroup;
  varying float vTwinkle;

  void main() {
    vec3 p = position;

    // Each cluster slowly rotates about its own centre.
    float dir = aGroup > 0.5 ? -1.0 : 1.0;
    float a = uTime * 0.12 * dir + aSeed * 0.4;
    float c = cos(a), s = sin(a);
    vec3 centre = vec3(dir * 2.4, 0.0, 0.0);
    vec3 rel = p - centre;
    rel = vec3(rel.x * c - rel.z * s, rel.y, rel.x * s + rel.z * c);

    // uMix pulls both clusters toward the middle — the bridge.
    p = centre + rel;
    p.x = mix(p.x, p.x * 0.35, uMix);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uPixelRatio * (52.0 / -mv.z) * (0.7 + aSeed * 0.6);

    vGroup = aGroup;
    vTwinkle = 0.55 + 0.45 * sin(uTime * 1.6 + aSeed * 12.0);
  }
`;

export const constellationFrag = /* glsl */ `
  uniform vec3 uYoung;
  uniform vec3 uElder;
  varying float vGroup;
  varying float vTwinkle;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, d);
    vec3 col = mix(uYoung, uElder, vGroup);
    gl_FragColor = vec4(col, soft * vTwinkle);
  }
`;

/** Travelling pulse along the connection lines between the clusters. */
export const linkVert = /* glsl */ `
  attribute float aProgress;
  attribute float aSeed;
  varying float vProgress;
  varying float vSeed;

  void main() {
    vProgress = aProgress;
    vSeed = aSeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const linkFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vProgress;
  varying float vSeed;

  void main() {
    // A bright head travelling from one end to the other, on a loop.
    float head = fract(uTime * 0.35 + vSeed);
    float d = abs(vProgress - head);
    d = min(d, 1.0 - d);
    float pulse = smoothstep(0.16, 0.0, d);

    float base = 0.34;
    gl_FragColor = vec4(uColor, (base + pulse * 1.1) * uOpacity);
  }
`;
