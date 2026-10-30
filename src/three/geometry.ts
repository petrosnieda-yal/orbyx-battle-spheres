import * as THREE from 'three'

export const R = 1
export const SHELL = 0.06
export const CORE_R = 0.84

const cache = new Map<string, THREE.BufferGeometry>()

export function cached<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let geometry = cache.get(key) as T | undefined
  if (!geometry) {
    geometry = make()
    cache.set(key, geometry)
  }
  return geometry
}

const spherePoint = (r: number, phi: number, theta: number, out = new THREE.Vector3()) =>
  out.set(-r * Math.cos(phi) * Math.sin(theta), r * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta))

export const surfacePoint = (phi: number, theta: number, r = R) => spherePoint(r, phi, theta)

export function shellPatch(phiStart: number, phiLength: number, thetaStart: number, thetaLength: number, ws = 36, hs = 18) {
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const v = new THREE.Vector3()
  const groups: [number, number][] = []

  const surface = (radius: number, inward: boolean) => {
    const base = positions.length / 3
    for (let iy = 0; iy <= hs; iy++) {
      for (let ix = 0; ix <= ws; ix++) {
        const u = ix / ws
        const w = iy / hs
        spherePoint(radius, phiStart + u * phiLength, thetaStart + w * thetaLength, v)
        positions.push(v.x, v.y, v.z)
        v.normalize()
        if (inward) v.negate()
        normals.push(v.x, v.y, v.z)
        uvs.push(u, 1 - w)
      }
    }
    const start = indices.length
    for (let iy = 0; iy < hs; iy++) {
      for (let ix = 0; ix < ws; ix++) {
        const a = base + iy * (ws + 1) + ix + 1
        const b = base + iy * (ws + 1) + ix
        const c = base + (iy + 1) * (ws + 1) + ix
        const d = base + (iy + 1) * (ws + 1) + ix + 1
        if (inward) indices.push(a, d, b, b, d, c)
        else indices.push(a, b, d, b, c, d)
      }
    }
    groups.push([start, indices.length - start])
  }

  surface(R, false)
  surface(R - SHELL, true)

  const rimStart = indices.length
  const edge = (points: [number, number][]) => {
    for (let i = 0; i < points.length - 1; i++) {
      const [p0, t0] = points[i]
      const [p1, t1] = points[i + 1]
      const o0 = spherePoint(R, p0, t0)
      const o1 = spherePoint(R, p1, t1)
      const i1 = spherePoint(R - SHELL, p1, t1)
      const i0 = spherePoint(R - SHELL, p0, t0)
      if (o0.distanceToSquared(o1) < 1e-10) continue
      const n = new THREE.Vector3().subVectors(o1, o0).cross(new THREE.Vector3().subVectors(i0, o0)).normalize()
      const base = positions.length / 3
      for (const p of [o0, o1, i1, i0]) {
        positions.push(p.x, p.y, p.z)
        normals.push(n.x, n.y, n.z)
        uvs.push(0, 0)
      }
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
    }
  }
  const along = (fixed: 'phi' | 'theta', value: number, steps: number) =>
    Array.from({ length: steps + 1 }, (_, i) => {
      const k = i / steps
      return fixed === 'phi'
        ? ([value, thetaStart + k * thetaLength] as [number, number])
        : ([phiStart + k * phiLength, value] as [number, number])
    })
  edge(along('theta', thetaStart, ws))
  edge(along('theta', thetaStart + thetaLength, ws))
  edge(along('phi', phiStart, hs))
  edge(along('phi', phiStart + phiLength, hs))
  groups.push([rimStart, indices.length - rimStart])

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  groups.forEach(([start, count], i) => geometry.addGroup(start, count, i))
  geometry.computeBoundingSphere()
  return geometry
}

export function taperTube(points: [number, number, number][], r0: number, r1: number, tubular = 28, radial = 10) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  const geometry = new THREE.TubeGeometry(curve, tubular, 1, radial, false)
  const pos = geometry.attributes.position as THREE.BufferAttribute
  const nor = geometry.attributes.normal as THREE.BufferAttribute
  const c = new THREE.Vector3()
  for (let i = 0; i <= tubular; i++) {
    const k = i / tubular
    curve.getPointAt(k, c)
    const r = THREE.MathUtils.lerp(r0, r1, Math.pow(k, 0.85))
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j
      pos.setXYZ(idx, c.x + nor.getX(idx) * r, c.y + nor.getY(idx) * r, c.z + nor.getZ(idx) * r)
    }
  }
  pos.needsUpdate = true
  geometry.computeBoundingSphere()
  return geometry
}

export function arc(radius: number, tube: number, length: number) {
  return new THREE.TorusGeometry(radius, tube, 8, 48, length)
}

function extrude(shape: THREE.Shape, depth = 0.016) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 1,
    curveSegments: 28,
  })
  geometry.translate(0, 0, -depth / 2)
  geometry.computeVertexNormals()
  return geometry
}

export const shapes = {
  bat: () => {
    const s = new THREE.Shape()
    s.moveTo(0, 0.06)
    s.quadraticCurveTo(-0.9, 0.6, -2.05, 0.38)
    s.quadraticCurveTo(-1.85, -0.05, -1.6, -0.48)
    s.quadraticCurveTo(-1.4, -0.12, -1.18, -0.2)
    s.quadraticCurveTo(-1.0, -0.55, -0.82, -0.66)
    s.quadraticCurveTo(-0.66, -0.26, -0.48, -0.3)
    s.quadraticCurveTo(-0.3, -0.52, -0.12, -0.52)
    s.lineTo(0, -0.1)
    s.closePath()
    return extrude(s)
  },
  fin: () => {
    const s = new THREE.Shape()
    s.moveTo(0, 0)
    s.quadraticCurveTo(-0.55, 0.85, -1.45, 0.72)
    s.quadraticCurveTo(-1.05, 0.38, -1.22, -0.08)
    s.quadraticCurveTo(-0.95, 0.08, -0.9, -0.3)
    s.quadraticCurveTo(-0.5, -0.12, 0, -0.22)
    s.closePath()
    return extrude(s, 0.02)
  },
  insect: () => {
    const s = new THREE.Shape()
    s.moveTo(0, 0)
    s.bezierCurveTo(-0.5, 0.34, -1.5, 0.36, -1.85, 0.08)
    s.bezierCurveTo(-1.6, -0.22, -0.6, -0.2, 0, 0)
    return extrude(s, 0.006)
  },
  feather: () => {
    const s = new THREE.Shape()
    s.moveTo(0, 0)
    s.quadraticCurveTo(-0.5, 0.13, -1, 0)
    s.quadraticCurveTo(-0.5, -0.07, 0, 0)
    return extrude(s, 0.02)
  },
  blade: () => {
    const s = new THREE.Shape()
    s.moveTo(0, 0)
    s.lineTo(-0.35, 0.1)
    s.lineTo(-1, 0)
    s.lineTo(-0.35, -0.08)
    s.closePath()
    return extrude(s, 0.05)
  },
}
