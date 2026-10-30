import { useEffect, useRef, type RefObject } from 'react'

export interface DragState {
  yaw: number
  pitch: number
  velocity: number
  dragging: boolean
  zoom: number
  hover: { x: number; y: number }
  inside: boolean
}

interface Options {
  zoom?: boolean
  onTap?: () => void
}

export function useDragRotate(ref: RefObject<HTMLElement | null>, { zoom = false, onTap }: Options = {}) {
  const state = useRef<DragState>({ yaw: 0, pitch: 0, velocity: 0, dragging: false, zoom: 1, hover: { x: 0, y: 0 }, inside: false })
  const tap = useRef(onTap)
  tap.current = onTap

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const s = state.current
    let lastX = 0
    let lastY = 0
    let travel = 0
    let pinch = 0
    const touches = new Map<number, { x: number; y: number }>()

    const down = (e: PointerEvent) => {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (touches.size === 2) {
        const [a, b] = [...touches.values()]
        pinch = Math.hypot(a.x - b.x, a.y - b.y)
        return
      }
      el.setPointerCapture(e.pointerId)
      lastX = e.clientX
      lastY = e.clientY
      travel = 0
      s.dragging = true
    }
    const move = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      s.hover.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      s.hover.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (zoom && touches.size === 2) {
        const [a, b] = [...touches.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        s.zoom = Math.min(1.6, Math.max(0.6, s.zoom * (pinch / d)))
        pinch = d
        return
      }
      if (!s.dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      travel += Math.abs(dx) + Math.abs(dy)
      s.yaw += dx * 0.009
      s.pitch = Math.min(0.55, Math.max(-0.35, s.pitch + dy * 0.004))
      s.velocity = dx * 0.009
    }
    const up = (e: PointerEvent) => {
      touches.delete(e.pointerId)
      if (!s.dragging) return
      s.dragging = false
      if (travel < 5) tap.current?.()
    }
    const enter = () => (s.inside = true)
    const leave = () => (s.inside = false)
    const wheel = (e: WheelEvent) => {
      if (!zoom || !e.ctrlKey) return
      e.preventDefault()
      s.zoom = Math.min(1.6, Math.max(0.6, s.zoom + e.deltaY * 0.01))
    }

    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('wheel', wheel)
    }
  }, [ref, zoom])

  return state
}
