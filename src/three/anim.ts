export interface SphereAnim {
  t: number
  explode: number
  time: number
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
export const easeOutBack = (x: number) => {
  const c1 = 1.5
  const c3 = c1 + 1
  return x <= 0 ? 0 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const pointer = { x: 0, y: 0 }

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
    },
    { passive: true },
  )
}
