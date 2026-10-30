import * as THREE from 'three'
import { create } from 'zustand'

export type LightPreset = 'studio' | 'sunset' | 'neon'

export const LIGHT_PRESETS: { id: LightPreset; name: string }[] = [
  { id: 'studio', name: 'Studio' },
  { id: 'sunset', name: 'Sunset' },
  { id: 'neon', name: 'Neon' },
]

interface Panel {
  color: string
  intensity: number
  size: [number, number]
  position: [number, number, number]
}

const SCENES: Record<LightPreset, { base: string; panels: Panel[] }> = {
  studio: {
    base: '#060606',
    panels: [
      { color: '#ffffff', intensity: 5, size: [5, 2.4], position: [0, 4.6, 2.2] },
      { color: '#ffffff', intensity: 1.6, size: [1.6, 5], position: [-4.8, 1.4, 1.2] },
      { color: '#ffffff', intensity: 2.6, size: [1.2, 5], position: [4.6, 1.8, -2.6] },
      { color: '#ff5a2a', intensity: 2.2, size: [8, 0.5], position: [0, 0.6, -4.8] },
      { color: '#9fb6ff', intensity: 0.5, size: [9, 9], position: [0, -2.8, 0] },
    ],
  },
  sunset: {
    base: '#0a0402',
    panels: [
      { color: '#ff6a2a', intensity: 5.5, size: [4, 3], position: [-3.6, 2.2, 3.2] },
      { color: '#ffb36b', intensity: 2.2, size: [6, 1.2], position: [0, 4.8, 0] },
      { color: '#2a5cff', intensity: 2.4, size: [2, 5], position: [4.6, 1.2, -2.2] },
      { color: '#ff2e55', intensity: 1.6, size: [8, 0.6], position: [0, 0.4, -4.8] },
    ],
  },
  neon: {
    base: '#030308',
    panels: [
      { color: '#ff2fb0', intensity: 5, size: [1.2, 6], position: [-4.6, 1.5, 1.5] },
      { color: '#19e3ff', intensity: 5, size: [1.2, 6], position: [4.6, 1.5, 1.5] },
      { color: '#ffffff', intensity: 1.4, size: [4, 1.4], position: [0, 4.8, 1] },
      { color: '#7c4dff', intensity: 2.4, size: [9, 0.6], position: [0, 0.2, -4.8] },
    ],
  },
}

function buildScene(preset: LightPreset) {
  const { base, panels } = SCENES[preset]
  const scene = new THREE.Scene()
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(11, 9, 11),
    new THREE.MeshBasicMaterial({ color: base, side: THREE.BackSide }),
  )
  room.position.y = 1.5
  scene.add(room)
  for (const p of panels) {
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
    material.color.set(p.color).multiplyScalar(p.intensity)
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...p.size), material)
    mesh.position.set(...p.position)
    mesh.lookAt(0, 0.4, 0)
    scene.add(mesh)
  }
  return scene
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose()
      ;(o.material as THREE.Material).dispose()
    }
  })
}

export function bakeEnvironments(gl: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(gl)
  const out = {} as Record<LightPreset, THREE.Texture>
  for (const preset of Object.keys(SCENES) as LightPreset[]) {
    const scene = buildScene(preset)
    out[preset] = pmrem.fromScene(scene, 0.035).texture
    disposeScene(scene)
  }
  pmrem.dispose()
  return out
}

export const useEnvMaps = create<{ maps: Record<LightPreset, THREE.Texture> | null }>(() => ({ maps: null }))
