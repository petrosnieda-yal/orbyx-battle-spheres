import * as THREE from 'three'
import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Creature, HeadKind, TailKind, WingKind } from '../data/catalog'
import type { CreatureMaterials } from './materials'
import { type SphereAnim, easeInOut, easeOutBack, lerp, seg } from './anim'
import { CORE_R, arc, cached, shapes, shellPatch, surfacePoint, taperTube } from './geometry'

const PI = Math.PI
const GAP = 0.014

export interface SphereCtx {
  anim: RefObject<SphereAnim>
  mats: CreatureMaterials
  creature: Creature
  look?: RefObject<{ x: number; y: number }>
}

export const SphereContext = createContext<SphereCtx | null>(null)
const useSphere = () => useContext(SphereContext)!

const S = () => cached('unit-sphere', () => new THREE.SphereGeometry(1, 40, 28))
const C = () => cached('unit-cone', () => new THREE.ConeGeometry(1, 1, 24))
const O = () => cached('unit-octa', () => new THREE.OctahedronGeometry(1, 0))
const UP = new THREE.Vector3(0, 1, 0)

function Spike({ base, dir, length, radius, material }: { base: THREE.Vector3; dir: THREE.Vector3; length: number; radius: number; material: THREE.Material }) {
  const d = dir.clone().normalize()
  const q = new THREE.Quaternion().setFromUnitVectors(UP, d)
  const p = base.clone().addScaledVector(d, length / 2)
  return <mesh geometry={C()} material={material} position={p} quaternion={q} scale={[radius, length, radius]} />
}

function Mirror({ children }: { children: ReactNode }) {
  return (
    <>
      <group>{children}</group>
      <group scale={[-1, 1, 1]}>{children}</group>
    </>
  )
}

function setScale(obj: THREE.Object3D | null, s: number) {
  if (!obj) return
  obj.visible = s > 0.002
  obj.scale.setScalar(Math.max(s, 0.0001))
}

export function Core() {
  const { anim, mats, creature } = useSphere()
  const gyro = useRef<THREE.Group>(null)
  const seams = useRef<THREE.Group>(null)
  const gem = useRef<THREE.Mesh>(null)
  const spikes = useRef<THREE.Group>(null)
  const spine = creature.head === 'dragon' || creature.head === 'wolf'

  useFrame((_, dt) => {
    const { t, time } = anim.current
    if (gyro.current) {
      gyro.current.rotation.y += dt * (0.5 + t * 2.2)
      gyro.current.rotation.z = 0.35 + Math.sin(time * 0.7) * 0.15
    }
    if (seams.current) {
      const s = seg(t, 0, 0.1)
      seams.current.visible = s < 1
      seams.current.scale.setScalar(1 - 0.1 * s)
    }
    gem.current?.scale.setScalar(0.085 * (1 + Math.sin(time * 4) * 0.08))
    setScale(spikes.current, easeOutBack(seg(t, 0.55, 1)))
  })

  return (
    <group>
      <mesh geometry={S()} material={mats.core} scale={CORE_R} />
      <group ref={gyro}>
        <mesh geometry={cached('gyro-a', () => new THREE.TorusGeometry(CORE_R + 0.01, 0.012, 8, 96))} material={mats.glow} rotation-x={PI / 2} />
        <mesh geometry={cached('gyro-b', () => new THREE.TorusGeometry(CORE_R + 0.03, 0.008, 8, 96))} material={mats.glow} />
      </group>
      <group ref={seams}>
        <mesh geometry={cached('seam-full', () => new THREE.TorusGeometry(0.986, 0.013, 6, 160))} material={mats.seam} rotation-x={PI / 2} />
        <mesh geometry={cached('seam-full', () => new THREE.TorusGeometry(0.986, 0.013, 6, 160))} material={mats.seam} rotation-y={PI / 2} />
        <mesh geometry={cached('seam-half', () => new THREE.TorusGeometry(0.986, 0.013, 6, 80, PI))} material={mats.seam} rotation-z={PI} />
      </group>
      <mesh geometry={cached('plate-chest', () => shellPatch(PI / 2 - 1.15, 2.3, 0.78, 1.55, 32, 20))} material={[mats.shell, mats.inner, mats.rim]} scale={0.895} />
      <mesh geometry={cached('plate-back', () => shellPatch(-PI / 2 - 0.95, 1.9, 0.28, 1.3, 28, 16))} material={[mats.shell, mats.inner, mats.rim]} scale={0.895} />
      {[1.32, 1.62, 1.92].map((theta) => (
        <mesh
          key={theta}
          geometry={cached(`belly-${theta}`, () => new THREE.TorusGeometry(0.9 * Math.sin(theta), 0.02, 6, 32, 1.2))}
          material={mats.trim}
          position-y={0.9 * Math.cos(theta)}
          rotation={[PI / 2, 0, PI / 2 - 0.6]}
        />
      ))}
      <mesh ref={gem} name="gem" geometry={O()} material={mats.glow} position={[0, -0.04, 0.88]} />
      {spine && (
        <group ref={spikes}>
          {[0.35, 0.62, 0.9, 1.18].map((theta, i) => {
            const base = surfacePoint(-PI / 2, theta, CORE_R - 0.02)
            const dir = base.clone().normalize().add(new THREE.Vector3(0, 0.25, -0.35))
            return <Spike key={i} base={base} dir={dir} length={0.34 - i * 0.04} radius={0.07} material={mats.trim} />
          })}
        </group>
      )}
    </group>
  )
}

const HINGE = new THREE.Vector3(0, 0.98, 0)
const DIR_F = new THREE.Vector3(-1, 0, 1).normalize()
const DIR_B = new THREE.Vector3(-1, 0, -1).normalize()
const AXIS_F = new THREE.Vector3(DIR_F.z, 0, -DIR_F.x)
const AXIS_B = new THREE.Vector3(DIR_B.z, 0, -DIR_B.x)
const PIV_F = DIR_F.clone().multiplyScalar(0.32).setY(-0.95)
const PIV_B = DIR_B.clone().multiplyScalar(0.32).setY(-0.95)

function Quarter({ phi, pivot }: { phi: number; pivot: THREE.Vector3 }) {
  const { mats } = useSphere()
  const geo = cached(`quarter-${phi.toFixed(3)}`, () => shellPatch(phi - PI / 4, PI / 2, PI / 2, PI / 2, 18, 18))
  const claws = useRef<THREE.Group>(null)
  const { anim } = useSphere()
  const dz = Math.sign(Math.sin(phi))
  useFrame(() => setScale(claws.current, easeOutBack(seg(anim.current.t, 0.5, 0.95))))
  return (
    <group position={[-pivot.x - GAP, -pivot.y - GAP, -pivot.z + GAP * dz]}>
      <mesh geometry={geo} material={[mats.shell, mats.inner, mats.rim]} />
      <mesh geometry={cached('rib-quarter', () => arc(1.004, 0.026, 1.26))} material={mats.trim} rotation={[0, phi, PI + 0.14]} />
      <group ref={claws}>
        {[-0.32, 0, 0.32].map((o, i) => {
          const base = surfacePoint(phi + o, PI * 0.72, 0.97)
          const dir = new THREE.Vector3(base.x, 0, base.z).normalize().setY(-0.42)
          return <Spike key={i} base={base} dir={dir} length={i === 1 ? 0.34 : 0.26} radius={0.055} material={mats.trim} />
        })}
      </group>
    </group>
  )
}

export function Side() {
  const { anim, mats, creature } = useSphere()
  const crest = useRef<THREE.Group>(null)
  const front = useRef<THREE.Group>(null)
  const back = useRef<THREE.Group>(null)
  const wing = useRef<THREE.Group>(null)
  const plates = useRef<THREE.Group>(null)
  const crestGeo = cached('crest', () => shellPatch(-PI / 2, PI, 0, PI / 2, 36, 18))

  useFrame(() => {
    const { t, explode, time } = anim.current
    const pc = easeInOut(seg(t, 0, 0.55))
    const flap = Math.sin(time * 2.2) * 0.05 * pc
    if (crest.current) {
      crest.current.position.set(HINGE.x - 0.35 * explode, HINGE.y + 0.05 * pc + 0.4 * explode, 0)
      crest.current.rotation.set(0, -creature.sweep * pc, -(creature.spread * pc + flap))
    }
    const pq = easeInOut(seg(t, 0.08, 0.6))
    if (front.current) {
      front.current.position.copy(PIV_F).addScaledVector(DIR_F, 0.08 * pq + 0.6 * explode)
      front.current.position.y -= 0.25 * explode
      front.current.quaternion.setFromAxisAngle(AXIS_F, 0.55 * pq)
    }
    if (back.current) {
      back.current.position.copy(PIV_B).addScaledVector(DIR_B, 0.08 * pq + 0.6 * explode)
      back.current.position.y -= 0.25 * explode
      back.current.quaternion.setFromAxisAngle(AXIS_B, 0.55 * pq)
    }
    setScale(wing.current, easeOutBack(seg(t, 0.45, 1)))
    setScale(plates.current, easeOutBack(seg(t, 0.5, 1)))
  })

  return (
    <group>
      <group ref={crest}>
        <group position={[-HINGE.x - GAP, -HINGE.y + GAP * 0.5, 0]}>
          <mesh geometry={crestGeo} material={[mats.shell, mats.inner, mats.rim]} />
          <group name="crest-mark" position={[-0.74, 0.66, 0]} />
          <mesh geometry={cached('rib-crest', () => arc(1.004, 0.03, 1.3))} material={mats.trim} rotation={[0, 0, PI / 2 + 0.17]} />
          <mesh geometry={cached('rib-crest-s', () => arc(1.002, 0.018, 1.1))} material={mats.trim} rotation={[0, 0.5, PI / 2 + 0.3]} />
          <mesh geometry={cached('rib-crest-s', () => arc(1.002, 0.018, 1.1))} material={mats.trim} rotation={[0, -0.5, PI / 2 + 0.3]} />
          {creature.wings === 'spikes' && (
            <group ref={plates}>
              {[0.5, 0.85, 1.2].map((theta, i) => {
                const base = surfacePoint(0, theta, 0.99)
                const dir = base.clone().normalize().add(new THREE.Vector3(0, 0.35, -0.3))
                return <Spike key={i} base={base} dir={dir} length={0.5 - i * 0.08} radius={0.08} material={mats.trim} />
              })}
            </group>
          )}
        </group>
        <group ref={wing} position={[-0.3, -0.14, -0.2]}>
          <Wing kind={creature.wings} />
        </group>
      </group>
      <group ref={front}>
        <Quarter phi={PI / 4} pivot={PIV_F} />
      </group>
      <group ref={back}>
        <Quarter phi={-PI / 4} pivot={PIV_B} />
      </group>
    </group>
  )
}

function Wing({ kind }: { kind: WingKind }) {
  const { mats } = useSphere()
  switch (kind) {
    case 'bat':
      return (
        <group rotation-z={0.5}>
          <mesh geometry={cached('w-bat', shapes.bat)} material={mats.membrane} />
          <mesh geometry={cached('w-bat-b1', () => taperTube([[0, 0.06, 0], [-0.95, 0.52, 0.03], [-2.05, 0.38, 0]], 0.05, 0.008))} material={mats.trim} />
          <mesh geometry={cached('w-bat-b2', () => taperTube([[-0.95, 0.5, 0.02], [-1.3, 0.05, 0.01], [-1.6, -0.48, 0]], 0.032, 0.004))} material={mats.trim} />
          <mesh geometry={cached('w-bat-b3', () => taperTube([[-0.95, 0.5, 0.02], [-0.9, -0.1, 0.01], [-0.82, -0.66, 0]], 0.03, 0.004))} material={mats.trim} />
          <mesh geometry={cached('w-bat-b4', () => taperTube([[-0.6, 0.4, 0.02], [-0.35, -0.1, 0.01], [-0.12, -0.52, 0]], 0.026, 0.004))} material={mats.trim} />
          <Spike base={new THREE.Vector3(-0.95, 0.52, 0.02)} dir={new THREE.Vector3(-0.2, 1, 0)} length={0.26} radius={0.045} material={mats.trim} />
        </group>
      )
    case 'fin':
      return (
        <group rotation-z={0.45}>
          <mesh geometry={cached('w-fin', shapes.fin)} material={mats.membrane} />
          {[[-1.45, 0.72], [-1.22, -0.08], [-0.9, -0.3]].map(([x, y], i) => (
            <mesh key={i} geometry={cached(`w-fin-r${i}`, () => taperTube([[0, 0, 0.02], [x * 0.55, y * 0.55 + 0.1, 0.02], [x, y, 0.01]], 0.035, 0.004))} material={mats.trim} />
          ))}
        </group>
      )
    case 'insect':
      return (
        <group rotation-z={0.85}>
          <mesh geometry={cached('w-insect', shapes.insect)} material={mats.veil} />
          <mesh geometry={cached('w-insect', shapes.insect)} material={mats.veil} rotation-z={0.3} position-z={-0.05} scale={0.85} />
          <mesh geometry={cached('w-insect-v', () => taperTube([[0, 0, 0], [-0.9, 0.16, 0], [-1.8, 0.08, 0]], 0.014, 0.003))} material={mats.trim} />
        </group>
      )
    case 'feather':
      return (
        <group>
          {[1.02, 1.2, 1.36, 1.5, 1.6, 1.5].map((len, i) => (
            <mesh
              key={i}
              geometry={cached('w-feather', shapes.feather)}
              material={i % 2 === 0 ? mats.membrane : mats.trim}
              rotation-z={0.75 - i * 0.17}
              position-z={-i * 0.012}
              scale={[len, 1.4, 1]}
            />
          ))}
        </group>
      )
    case 'crystal':
      return (
        <group rotation-z={0.6}>
          {[
            [1.0, 0.38, 0.85],
            [1.7, 0, 1.2],
            [1.25, -0.36, 1],
          ].map(([len, rot, w], i) => (
            <mesh key={i} geometry={cached('w-blade', shapes.blade)} material={mats.crystal} rotation-z={rot} scale={[len, w * 1.6, 1]} />
          ))}
        </group>
      )
    default:
      return null
  }
}

const HEAD_POS: Record<HeadKind, [number, number, number]> = {
  dragon: [0, 0.74, 0.92],
  serpent: [0, 0.84, 0.94],
  beetle: [0, 0.28, 1.0],
  bird: [0, 0.82, 0.86],
  knight: [0, 0.96, 0.56],
  wolf: [0, 0.6, 1.0],
}

export function HeadRig() {
  const { anim, creature, look } = useSphere()
  const ref = useRef<THREE.Group>(null)
  const pos = HEAD_POS[creature.head]
  const lookState = useRef({ x: 0, y: 0 })

  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const { t, explode, time } = anim.current
    const p = seg(t, 0.3, 0.9)
    const pm = easeInOut(p)
    g.position.set(0, lerp(0.06, pos[1], pm) + Math.sin(time * 1.6) * 0.025 * pm + 0.3 * explode, lerp(0.04, pos[2], pm) + 0.55 * explode)
    g.scale.setScalar(lerp(0.16, 1.28, easeOutBack(p)))
    const target = look?.current ?? { x: 0, y: 0 }
    const k = 1 - Math.exp(-dt * 4)
    lookState.current.x += (target.x - lookState.current.x) * k
    lookState.current.y += (target.y - lookState.current.y) * k
    g.rotation.set((0.12 - lookState.current.y * 0.35) * pm, lookState.current.x * 0.6 * pm + Math.sin(time * 0.9) * 0.08 * pm, 0)
  })

  return (
    <group ref={ref} name="head">
      <Head kind={creature.head} />
    </group>
  )
}

function Eyes({ x, y, z, s = [0.05, 0.035, 0.045] }: { x: number; y: number; z: number; s?: [number, number, number] }) {
  const { mats } = useSphere()
  return (
    <Mirror>
      <mesh geometry={S()} material={mats.glow} position={[x, y, z]} scale={s} />
    </Mirror>
  )
}

function Halo() {
  const { mats, anim } = useSphere()
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (ref.current) ref.current.rotation.z = anim.current.time * 0.8
  })
  return (
    <group position={[0, 0.4, -0.12]} rotation-x={1.15}>
      <mesh ref={ref} geometry={cached('halo', () => new THREE.TorusGeometry(0.3, 0.016, 8, 64))} material={mats.glow} />
    </group>
  )
}

function Head({ kind }: { kind: HeadKind }) {
  const { mats } = useSphere()
  switch (kind) {
    case 'dragon':
      return (
        <group>
          <mesh geometry={S()} material={mats.shell} scale={[0.27, 0.23, 0.33]} />
          <mesh geometry={S()} material={mats.shell} position={[0, -0.04, 0.3]} scale={[0.17, 0.12, 0.23]} />
          <mesh geometry={S()} material={mats.inner} position={[0, -0.15, 0.22]} scale={[0.14, 0.06, 0.22]} rotation-x={0.28} />
          <Eyes x={0.125} y={0.05} z={0.21} />
          <Mirror>
            <mesh geometry={S()} material={mats.trim} position={[0.13, 0.12, 0.17]} scale={[0.1, 0.025, 0.09]} rotation-z={-0.35} />
            <mesh geometry={cached('h-dragon-horn', () => taperTube([[0.1, 0.13, -0.04], [0.24, 0.3, -0.24], [0.3, 0.44, -0.56]], 0.065, 0.004))} material={mats.trim} />
            <mesh geometry={cached('h-dragon-horn2', () => taperTube([[0.2, 0.0, -0.08], [0.32, 0.02, -0.26], [0.38, 0.1, -0.42]], 0.04, 0.003))} material={mats.trim} />
          </Mirror>
          <Spike base={new THREE.Vector3(0, 0.06, 0.42)} dir={new THREE.Vector3(0, 1, 0.5)} length={0.14} radius={0.035} material={mats.trim} />
          <mesh geometry={cached('h-dragon-neck', () => taperTube([[0, -0.06, -0.12], [0, -0.3, -0.42], [0, -0.58, -0.62]], 0.15, 0.22))} material={mats.inner} />
        </group>
      )
    case 'serpent':
      return (
        <group>
          <mesh geometry={S()} material={mats.shell} scale={[0.22, 0.19, 0.34]} />
          <mesh geometry={S()} material={mats.shell} position={[0, -0.03, 0.3]} scale={[0.15, 0.1, 0.26]} />
          <mesh geometry={S()} material={mats.inner} position={[0, -0.13, 0.24]} scale={[0.12, 0.05, 0.24]} rotation-x={0.2} />
          <Eyes x={0.13} y={0.06} z={0.12} s={[0.05, 0.04, 0.05]} />
          <Mirror>
            <mesh geometry={cached('w-fin', shapes.fin)} material={mats.membrane} position={[0.18, 0.02, -0.08]} rotation-y={PI + 0.5} scale={0.32} />
          </Mirror>
          <mesh geometry={cached('w-fin', shapes.fin)} material={mats.membrane} position={[0, 0.17, 0]} rotation-y={-PI / 2} scale={0.38} />
          <mesh geometry={cached('h-serpent-neck', () => taperTube([[0, -0.05, -0.15], [0, -0.38, -0.42], [0, -0.74, -0.58]], 0.13, 0.2))} material={mats.inner} />
        </group>
      )
    case 'beetle':
      return (
        <group>
          <mesh geometry={S()} material={mats.shell} scale={[0.3, 0.2, 0.26]} />
          <mesh geometry={S()} material={mats.trim} position={[0, 0.02, 0.16]} scale={[0.22, 0.12, 0.12]} />
          <mesh geometry={cached('h-beetle-horn', () => taperTube([[0, 0.06, 0.18], [0, 0.22, 0.44], [0, 0.56, 0.54], [0, 0.76, 0.4]], 0.095, 0.004))} material={mats.trim} />
          <Eyes x={0.2} y={0.04} z={0.13} s={[0.06, 0.06, 0.06]} />
          <Mirror>
            <mesh geometry={cached('h-beetle-mand', () => taperTube([[0.12, -0.1, 0.18], [0.22, -0.12, 0.36], [0.06, -0.13, 0.52]], 0.048, 0.004))} material={mats.trim} />
            <Spike base={new THREE.Vector3(0.16, 0.1, 0.12)} dir={new THREE.Vector3(0.6, 1, 0.4)} length={0.2} radius={0.035} material={mats.trim} />
          </Mirror>
          <mesh geometry={cached('h-beetle-neck', () => taperTube([[0, 0, -0.1], [0, -0.12, -0.38]], 0.2, 0.24))} material={mats.inner} />
        </group>
      )
    case 'bird':
      return (
        <group>
          <mesh geometry={S()} material={mats.shell} scale={[0.22, 0.21, 0.24]} />
          <mesh geometry={C()} material={mats.trim} position={[0, -0.01, 0.38]} rotation-x={PI / 2} scale={[0.085, 0.36, 0.06]} />
          <mesh geometry={C()} material={mats.inner} position={[0, -0.07, 0.32]} rotation-x={PI / 2 + 0.15} scale={[0.06, 0.24, 0.04]} />
          <Eyes x={0.12} y={0.06} z={0.14} />
          {[-0.07, 0, 0.07].map((x, i) => (
            <mesh
              key={i}
              geometry={cached('h-bird-crest', () => taperTube([[0, 0.17, 0.02], [0, 0.33, -0.16], [0, 0.42, -0.46]], 0.045, 0.003))}
              material={i === 1 ? mats.trim : mats.membrane}
              position-x={x}
              rotation-z={-x * 2.2}
              scale={i === 1 ? 1.15 : 0.9}
            />
          ))}
          <mesh geometry={cached('h-bird-neck', () => taperTube([[0, -0.08, -0.1], [0, -0.36, -0.34], [0, -0.62, -0.5]], 0.12, 0.2))} material={mats.inner} />
        </group>
      )
    case 'knight':
      return (
        <group>
          <mesh geometry={S()} material={mats.shell} scale={[0.24, 0.27, 0.25]} />
          <mesh geometry={S()} material={mats.glow} position={[0, 0.03, 0.2]} scale={[0.2, 0.028, 0.07]} />
          <mesh geometry={S()} material={mats.trim} position={[0, -0.1, 0.13]} scale={[0.19, 0.12, 0.13]} />
          <mesh geometry={cached('h-knight-crest', () => taperTube([[0, 0.22, 0.14], [0, 0.33, -0.06], [0, 0.34, -0.38]], 0.05, 0.005))} material={mats.trim} />
          <Mirror>
            <Spike base={new THREE.Vector3(0.2, 0.08, 0)} dir={new THREE.Vector3(1, 0.5, -0.4)} length={0.24} radius={0.04} material={mats.trim} />
          </Mirror>
          <Halo />
          <mesh geometry={cached('h-knight-neck', () => taperTube([[0, -0.12, -0.04], [0, -0.42, -0.24]], 0.12, 0.18))} material={mats.inner} />
        </group>
      )
    case 'wolf':
      return (
        <group>
          <mesh geometry={S()} material={mats.shell} scale={[0.24, 0.22, 0.27]} />
          <mesh geometry={C()} material={mats.shell} position={[0, -0.07, 0.34]} rotation-x={PI / 2} scale={[0.12, 0.38, 0.1]} />
          <mesh geometry={S()} material={mats.inner} position={[0, -0.06, 0.52]} scale={0.035} />
          <Eyes x={0.11} y={0.04} z={0.2} s={[0.05, 0.025, 0.04]} />
          <Mirror>
            <mesh geometry={C()} material={mats.shell} position={[0.13, 0.24, -0.04]} rotation-z={-0.35} scale={[0.07, 0.24, 0.05]} />
          </Mirror>
          {Array.from({ length: 7 }, (_, i) => {
            const a = -PI * 0.75 + (i / 6) * PI * 1.5
            const base = new THREE.Vector3(Math.sin(a) * 0.2, Math.cos(a) * 0.18, -0.16)
            const dir = new THREE.Vector3(Math.sin(a) * 0.6, Math.cos(a) * 0.6, -1)
            return <Spike key={i} base={base} dir={dir} length={0.3} radius={0.055} material={mats.trim} />
          })}
          <mesh geometry={cached('h-wolf-neck', () => taperTube([[0, -0.05, -0.1], [0, -0.3, -0.36], [0, -0.55, -0.56]], 0.18, 0.24))} material={mats.inner} />
        </group>
      )
  }
}

export function TailRig() {
  const { anim, creature } = useSphere()
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const { t, explode, time } = anim.current
    const p = seg(t, 0.4, 0.95)
    setScale(g, easeOutBack(p))
    g.position.set(0, -0.12, -0.52 - 0.55 * explode)
    g.rotation.y = Math.sin(time * 1.7) * 0.18 * p
  })
  if (creature.tail === 'none') return null
  return (
    <group ref={ref}>
      <Tail kind={creature.tail} />
    </group>
  )
}

function Tail({ kind }: { kind: TailKind }) {
  const { mats } = useSphere()
  switch (kind) {
    case 'spiked':
      return (
        <group>
          <mesh geometry={cached('t-spiked', () => taperTube([[0, 0, 0], [0, -0.06, -0.45], [0, 0.14, -0.95], [0, 0.55, -1.25]], 0.17, 0.03))} material={mats.shell} />
          <mesh geometry={cached('w-blade', shapes.blade)} material={mats.trim} position={[0, 0.55, -1.25]} rotation={[0, PI / 2, -1.1]} scale={[0.34, 0.9, 1]} />
          {[[0, 0.1, -0.35], [0, 0.08, -0.7], [0, 0.32, -1.02]].map((p, i) => (
            <Spike key={i} base={new THREE.Vector3(...p)} dir={new THREE.Vector3(0, 1, -0.6)} length={0.16} radius={0.04} material={mats.trim} />
          ))}
        </group>
      )
    case 'long':
      return (
        <group>
          <mesh geometry={cached('t-long', () => taperTube([[0, 0, 0], [0, -0.16, -0.5], [0.28, -0.1, -1.0], [-0.12, 0.16, -1.45], [0, 0.52, -1.7]], 0.15, 0.012, 48))} material={mats.shell} />
          <mesh geometry={cached('w-fin', shapes.fin)} material={mats.membrane} position={[0, 0.5, -1.68]} rotation-y={-PI / 2} scale={0.42} />
        </group>
      )
    case 'fan':
      return (
        <group rotation-x={-0.35}>
          {[-0.5, -0.25, 0, 0.25, 0.5].map((a, i) => (
            <group key={i} rotation-y={-PI / 2 + a}>
              <mesh geometry={cached('w-feather', shapes.feather)} material={i % 2 ? mats.trim : mats.membrane} rotation-x={PI / 2} scale={[1.05 - Math.abs(a) * 0.4, 1.5, 1]} />
            </group>
          ))}
        </group>
      )
    case 'bushy':
      return (
        <group>
          <mesh geometry={cached('t-bushy', () => taperTube([[0, 0, 0], [0, -0.12, -0.42], [0, 0.08, -0.86], [0, 0.52, -1.08]], 0.2, 0.05))} material={mats.shell} />
          <mesh geometry={S()} material={mats.glow} position={[0, 0.54, -1.08]} scale={0.06} />
          {[[0, 0.06, -0.4], [0, 0.12, -0.72], [0, 0.38, -0.98]].map((p, i) => (
            <Spike key={i} base={new THREE.Vector3(...p)} dir={new THREE.Vector3(0, 1, -0.4)} length={0.2} radius={0.05} material={mats.trim} />
          ))}
        </group>
      )
    default:
      return null
  }
}
