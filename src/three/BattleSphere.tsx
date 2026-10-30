import * as THREE from 'three'
import { forwardRef, useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import type { Creature, Finish } from '../data/catalog'
import { useCreatureMaterials } from './materials'
import type { SphereAnim } from './anim'
import { Core, HeadRig, Side, SphereContext, TailRig } from './parts'

export interface BattleSphereProps {
  creature: Creature
  finish?: Finish
  open?: number
  driver?: RefObject<number>
  explode?: boolean
  wireframe?: boolean
  look?: RefObject<{ x: number; y: number }>
  anim?: RefObject<SphereAnim>
  smoothing?: number
}

export const BattleSphere = forwardRef<THREE.Group, BattleSphereProps>(function BattleSphere(
  { creature, finish = 'gloss', open = 0, driver, explode = false, wireframe = false, look, anim: external, smoothing = 0.32 },
  ref,
) {
  const internal = useRef<SphereAnim>({ t: open, explode: 0, time: Math.random() * 10 })
  const anim = external ?? internal
  const mats = useCreatureMaterials(creature.palette, finish, wireframe)
  const ctx = useMemo(() => ({ anim, mats, creature, look }), [anim, mats, creature, look])

  useFrame((_, dt) => {
    const a = anim.current
    const target = driver ? driver.current : open
    easing.damp(a, 't', target, smoothing, Math.min(dt, 0.05))
    easing.damp(a, 'explode', explode ? 1 : 0, 0.35, Math.min(dt, 0.05))
    a.time += dt
  })

  return (
    <group ref={ref} name={creature.name}>
      <SphereContext.Provider value={ctx}>
        <Core />
        <Side />
        <group scale={[-1, 1, 1]}>
          <Side />
        </group>
        <HeadRig />
        <TailRig />
      </SphereContext.Provider>
    </group>
  )
})
