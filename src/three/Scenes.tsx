import * as THREE from 'three'
import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, PerspectiveCamera, useGLTF } from '@react-three/drei'
import { easing } from 'maath'
import { type Creature, editionById, creatureById } from '../data/catalog'
import { useShop } from '../store/useShop'
import type { DragState } from '../hooks/useDragRotate'
import { BattleSphere } from './BattleSphere'
import { type SphereAnim, pointer } from './anim'
import { type LightPreset, useEnvMaps } from './env'

export function ViewEnv({ preset = 'studio', intensity = 1 }: { preset?: LightPreset; intensity?: number }) {
  const scene = useThree((s) => s.scene)
  const maps = useEnvMaps((s) => s.maps)
  useEffect(() => {
    if (!maps) return
    scene.environment = maps[preset]
    scene.environmentIntensity = intensity
  }, [maps, preset, intensity, scene])
  return null
}

function Rim({ color, intensity = 40 }: { color: string; intensity?: number }) {
  return (
    <>
      <directionalLight position={[3, 5, 4]} intensity={1.1} />
      <pointLight position={[-2.6, 2.4, -2.4]} color={color} intensity={intensity} distance={12} decay={2} />
      <pointLight position={[2.8, -0.4, -2]} color={color} intensity={intensity * 0.5} distance={10} decay={2} />
    </>
  )
}

export function HeroScene({ progress }: { progress: RefObject<number> }) {
  const creature = creatureById('vyrakh')
  const rig = useRef<THREE.Group>(null)
  const anim = useRef<SphereAnim>({ t: 0, explode: 0, time: 0 })
  const look = useRef({ x: 0, y: 0 })
  const camera = useRef<THREE.PerspectiveCamera>(null)
  const size = useThree((s) => s.size)
  const fit = Math.max(10.4, 7.3 / (size.width / size.height))

  useFrame((_, dt) => {
    const t = anim.current.t
    look.current.x = pointer.x
    look.current.y = pointer.y
    if (rig.current) {
      easing.dampE(
        rig.current.rotation,
        [0.18 - pointer.y * 0.12 + t * 0.06, -0.55 + t * 0.95 + pointer.x * 0.35 + anim.current.time * 0.12 * (1 - t), 0],
        0.25,
        dt,
      )
      rig.current.position.y = -0.15 + Math.sin(anim.current.time * 1.2) * 0.05 * (1 - t) - t * 0.35
    }
    if (camera.current) {
      const d = fit * (1 + t * 0.31)
      camera.current.position.set(0, 0.2 + t * 0.6, d)
      camera.current.lookAt(0, 0.1 + t * 0.35, 0)
    }
  })

  return (
    <>
      <PerspectiveCamera ref={camera} makeDefault fov={28} position={[0, 0.2, 8.6]} />
      <ViewEnv preset="sunset" intensity={1.15} />
      <Rim color="#ff5a1f" intensity={60} />
      <group ref={rig}>
        <BattleSphere creature={creature} driver={progress} anim={anim} look={look} finish="gloss" smoothing={0.22} />
      </group>
    </>
  )
}

export function CardScene({ creature, open, drag }: { creature: Creature; open: boolean; drag: RefObject<DragState> }) {
  const rig = useRef<THREE.Group>(null)
  const anim = useRef<SphereAnim>({ t: 0, explode: 0, time: 0 })
  const camera = useRef<THREE.PerspectiveCamera>(null)
  const idle = useRef(Math.random() * Math.PI * 2)

  useFrame((_, dt) => {
    const d = drag.current
    const t = anim.current.t
    if (!d.dragging) {
      d.velocity *= 0.94
      d.yaw += d.velocity
      idle.current += dt * (0.35 * (1 - t) + 0.08)
    }
    if (rig.current) {
      easing.dampE(rig.current.rotation, [d.pitch * 0.6, -0.5 + d.yaw + idle.current * (1 - t * 0.85), 0], 0.18, dt)
    }
    if (camera.current) {
      camera.current.position.set(0, 0.6 + t * 1.0, 5.9 + t * 3.7)
      camera.current.lookAt(0, 0.05 + t * 0.5, 0)
    }
  })

  return (
    <>
      <PerspectiveCamera ref={camera} makeDefault fov={30} position={[0, 0.6, 5.9]} />
      <ViewEnv preset="studio" />
      <Rim color={creature.palette.glow} intensity={28} />
      <group ref={rig}>
        <BattleSphere creature={creature} open={open ? 1 : 0} anim={anim} />
      </group>
      <ContactShadows position={[0, -1.02, 0]} opacity={0.6} scale={7} blur={2.4} far={3.2} resolution={256} color="#000000" />
    </>
  )
}

export const studioModel: { current: THREE.Object3D | null } = { current: null }

export interface HotspotPin {
  target: string
  el: HTMLElement | null
}

function CustomModel({ url }: { url: string }) {
  const gltf = useGLTF(url)
  const object = useMemo(() => {
    const root = gltf.scene.clone(true)
    const box = new THREE.Box3().setFromObject(root)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    root.position.sub(center)
    const wrap = new THREE.Group()
    wrap.add(root)
    const scale = 3 / Math.max(size.x, size.y, size.z, 0.0001)
    wrap.scale.setScalar(scale)
    wrap.position.y = -1 + (size.y * scale) / 2
    return wrap
  }, [gltf])
  useEffect(() => () => useGLTF.clear(url), [url])
  return <primitive object={object} />
}

export function StudioScene({ drag, pins }: { drag: RefObject<DragState>; pins: RefObject<HotspotPin[]> }) {
  const { selectedId, edition, form, explode, wireframe, autoRotate, light, customModel, hotspots } = useShop()
  const creature = creatureById(selectedId)
  const finish = editionById(edition).finish
  const rig = useRef<THREE.Group>(null)
  const model = useRef<THREE.Group>(null)
  const anim = useRef<SphereAnim>({ t: 1, explode: 0, time: 0 })
  const camera = useRef<THREE.PerspectiveCamera>(null)
  const look = useRef({ x: 0, y: 0 })
  const size = useThree((s) => s.size)
  const v = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    studioModel.current = customModel ? rig.current : model.current
  })

  useEffect(() => {
    anim.current.t = 0
  }, [creature.id])

  useFrame((_, dt) => {
    const d = drag.current
    if (!d.dragging) {
      d.velocity *= 0.93
      d.yaw += d.velocity + (autoRotate ? dt * 0.22 : 0)
    }
    look.current.x = d.inside ? d.hover.x : 0
    look.current.y = d.inside ? d.hover.y : 0
    if (rig.current) easing.dampE(rig.current.rotation, [d.pitch, -0.45 + d.yaw, 0], 0.15, dt)
    const t = customModel ? 1 : anim.current.t
    if (camera.current) {
      const dist = (size.width < 700 ? 10.4 + t * 1.6 : 7.8 + t * 2.4) * d.zoom
      easing.damp3(camera.current.position, [0, 0.7 + t * 0.7, dist], 0.25, dt)
      camera.current.lookAt(0, 0.12 + t * 0.42, 0)
    }

    const list = pins.current
    const showPins = hotspots && !customModel && model.current && camera.current
    for (const pin of list) {
      if (!pin.el) continue
      const obj = showPins ? model.current!.getObjectByName(pin.target) : undefined
      if (!obj) {
        pin.el.style.opacity = '0'
        continue
      }
      obj.getWorldPosition(v)
      v.project(camera.current!)
      const x = ((v.x + 1) / 2) * size.width
      const y = ((1 - v.y) / 2) * size.height
      const visible = anim.current.t > 0.85 && v.z < 1
      pin.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      pin.el.style.opacity = visible ? '1' : '0'
      pin.el.style.pointerEvents = visible ? 'auto' : 'none'
    }
  })

  return (
    <>
      <PerspectiveCamera ref={camera} makeDefault fov={30} position={[0, 1.2, 9]} />
      <ViewEnv preset={light} intensity={light === 'neon' ? 1.2 : 1} />
      <Rim color={light === 'neon' ? '#ff2fb0' : creature.palette.glow} intensity={light === 'studio' ? 30 : 45} />
      <group ref={rig}>
        {customModel ? (
          <Suspense fallback={null}>
            <CustomModel url={customModel.url} />
          </Suspense>
        ) : (
          <BattleSphere
            key={creature.id}
            ref={model}
            creature={creature}
            finish={finish}
            open={form === 'brawl' ? 1 : 0}
            explode={explode}
            wireframe={wireframe}
            anim={anim}
            look={look}
          />
        )}
      </group>
      <ContactShadows position={[0, -1.02, 0]} opacity={0.7} scale={9} blur={2.2} far={3.5} resolution={512} color="#000000" />
    </>
  )
}

const mystery: Creature = {
  ...creatureById('noctyr'),
  id: 'mystery',
  name: 'Classified',
  palette: { shell: '#141414', inner: '#050505', trim: '#3a3a3a', glow: '#fd321c', membrane: '#fd321c' },
}

export function DropScene() {
  const rig = useRef<THREE.Group>(null)
  const anim = useRef<SphereAnim>({ t: 0, explode: 0, time: 0 })
  useFrame((_, dt) => {
    if (!rig.current) return
    rig.current.rotation.y += dt * 0.35
    rig.current.rotation.x = Math.sin(anim.current.time * 0.6) * 0.2
    rig.current.position.y = Math.sin(anim.current.time * 1.1) * 0.08
  })
  return (
    <>
      <PerspectiveCamera makeDefault fov={30} position={[0, 0, 7.6]} />
      <ViewEnv preset="sunset" intensity={1.4} />
      <Rim color="#fd321c" intensity={70} />
      <group ref={rig}>
        <BattleSphere creature={mystery} finish="chrome" open={0.04} anim={anim} />
      </group>
    </>
  )
}

const auraVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const auraFragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec2 uRes;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
float ribbon(vec2 p, float seed, float freq, float amp, float width, float t) {
  float y = sin(p.x * freq + t + seed) * amp + (fbm(vec2(p.x * 0.7 + t * 0.35, seed)) - 0.5) * 0.9;
  float d = abs(p.y - y);
  return width / (d + width * 0.5);
}
void main() {
  vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 2.2;
  float t = uTime * 0.22;
  vec2 q = p + 0.25 * vec2(fbm(p + t), fbm(p - t + 3.1));
  vec3 col = vec3(0.0);
  col += vec3(1.0, 0.36, 0.08) * pow(ribbon(q, 0.0, 1.1, 0.42, 0.045, t), 1.7) * 0.55;
  col += vec3(0.12, 0.32, 1.0) * pow(ribbon(q + vec2(0.0, 0.35), 2.1, 0.8, 0.5, 0.035, t * 0.8), 1.7) * 0.5;
  col += vec3(1.0, 0.1, 0.16) * pow(ribbon(q - vec2(0.0, 0.4), 4.2, 1.5, 0.3, 0.028, t * 1.25), 1.7) * 0.4;
  float haze = fbm(p * 1.4 + t) * 0.12;
  col += vec3(1.0, 0.3, 0.1) * haze * smoothstep(0.8, -0.6, p.y);
  float vig = smoothstep(1.9, 0.2, length(p * vec2(0.55, 1.0)));
  col *= vig;
  col = col / (1.0 + col);
  col = pow(col, vec3(0.9));
  gl_FragColor = vec4(col, 1.0);
}
`

export function AuraScene() {
  const size = useThree((s) => s.size)
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: auraVertex,
        fragmentShader: auraFragment,
        uniforms: { uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
        depthWrite: false,
        depthTest: false,
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])
  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt
    material.uniforms.uRes.value.set(size.width, size.height)
  })
  return (
    <mesh frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}
