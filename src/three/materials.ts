import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import type { Finish, Palette } from '../data/catalog'

export interface CreatureMaterials {
  shell: THREE.MeshPhysicalMaterial
  inner: THREE.MeshPhysicalMaterial
  rim: THREE.MeshPhysicalMaterial
  core: THREE.MeshPhysicalMaterial
  trim: THREE.MeshPhysicalMaterial
  glow: THREE.MeshStandardMaterial
  seam: THREE.MeshBasicMaterial
  membrane: THREE.MeshPhysicalMaterial
  veil: THREE.MeshPhysicalMaterial
  crystal: THREE.MeshPhysicalMaterial
}

function shellMaterial(color: string, finish: Finish) {
  const c = new THREE.Color(color)
  switch (finish) {
    case 'satin':
      return new THREE.MeshPhysicalMaterial({
        color: c.clone().multiplyScalar(0.85),
        roughness: 0.42,
        metalness: 0.55,
        clearcoat: 0.35,
        clearcoatRoughness: 0.45,
      })
    case 'chrome':
      return Object.assign(
        new THREE.MeshPhysicalMaterial({
          color: c.clone().lerp(new THREE.Color('#ffffff'), 0.25),
          roughness: 0.08,
          metalness: 1,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          iridescence: 0.85,
          iridescenceIOR: 1.6,
        }),
        { iridescenceThicknessMinimum: 180, iridescenceThicknessMaximum: 620 },
      )
    case 'prism':
      return new THREE.MeshPhysicalMaterial({
        color: c.clone().lerp(new THREE.Color('#ffffff'), 0.55),
        roughness: 0.04,
        metalness: 0,
        transmission: 1,
        thickness: 0.35,
        ior: 1.5,
        dispersion: 3,
        attenuationColor: c,
        attenuationDistance: 1.4,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        side: THREE.DoubleSide,
      })
    default:
      return new THREE.MeshPhysicalMaterial({
        color: c,
        roughness: 0.3,
        metalness: 0.02,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
      })
  }
}

export function createMaterials(palette: Palette, finish: Finish): CreatureMaterials {
  const shell = shellMaterial(palette.shell, finish)
  const prism = finish === 'prism'
  const metalTrim = finish === 'satin' || finish === 'chrome'
  const inner = prism
    ? shell
    : new THREE.MeshPhysicalMaterial({
        color: palette.inner,
        roughness: 0.45,
        metalness: 0.7,
        emissive: new THREE.Color(palette.glow),
        emissiveIntensity: 0.06,
      })
  const rim = prism ? shell : new THREE.MeshPhysicalMaterial({ color: palette.inner, roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide })
  const glowColor = new THREE.Color(palette.glow)

  return {
    shell,
    inner,
    rim,
    core: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(palette.inner).lerp(new THREE.Color(palette.shell), 0.18),
      roughness: 0.32,
      metalness: 0.9,
      clearcoat: 0.6,
      emissive: glowColor,
      emissiveIntensity: prism ? 0.18 : 0.03,
    }),
    trim: new THREE.MeshPhysicalMaterial({
      color: palette.trim,
      roughness: metalTrim ? 0.18 : 0.35,
      metalness: metalTrim ? 1 : 0.25,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
    }),
    glow: new THREE.MeshStandardMaterial({
      color: '#000000',
      emissive: glowColor,
      emissiveIntensity: 3.2,
      toneMapped: false,
    }),
    seam: new THREE.MeshBasicMaterial({ color: glowColor.clone().multiplyScalar(2.2), toneMapped: false }),
    membrane: new THREE.MeshPhysicalMaterial({
      color: palette.membrane,
      roughness: 0.42,
      metalness: 0.1,
      sheen: 1,
      sheenColor: new THREE.Color(palette.glow),
      emissive: glowColor,
      emissiveIntensity: 0.18,
      side: THREE.DoubleSide,
    }),
    veil: new THREE.MeshPhysicalMaterial({
      color: palette.membrane,
      roughness: 0.1,
      transparent: true,
      opacity: 0.38,
      iridescence: 1,
      iridescenceIOR: 1.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    crystal: new THREE.MeshPhysicalMaterial({
      color: palette.membrane,
      roughness: 0.06,
      transmission: 0.92,
      thickness: 0.4,
      ior: 1.6,
      emissive: glowColor,
      emissiveIntensity: 0.35,
      clearcoat: 1,
    }),
  }
}

export function useCreatureMaterials(palette: Palette, finish: Finish, wireframe: boolean) {
  const mats = useMemo(() => createMaterials(palette, finish), [palette, finish])
  useEffect(() => {
    const unique = new Set(Object.values(mats) as THREE.Material[])
    unique.forEach((m) => {
      ;(m as THREE.MeshStandardMaterial).wireframe = wireframe
    })
  }, [mats, wireframe])
  useEffect(
    () => () => {
      new Set(Object.values(mats) as THREE.Material[]).forEach((m) => m.dispose())
    },
    [mats],
  )
  return mats
}
