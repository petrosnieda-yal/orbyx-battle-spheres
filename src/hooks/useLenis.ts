import { useEffect } from 'react'
import Lenis from 'lenis'

let lenis: Lenis | null = null

export function useLenis() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    lenis = new Lenis({ autoRaf: true, lerp: 0.11, wheelMultiplier: 0.95 })
    return () => {
      lenis?.destroy()
      lenis = null
    }
  }, [])
}

export function scrollToTarget(target: string | HTMLElement | number, offset = 0) {
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.4 })
    return
  }
  if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: 'smooth' })
    return
  }
  const el = typeof target === 'string' ? document.querySelector(target) : target
  el?.scrollIntoView({ behavior: 'smooth' })
}

export function setScrollLocked(locked: boolean) {
  if (!lenis) {
    document.documentElement.style.overflow = locked ? 'hidden' : ''
    return
  }
  if (locked) lenis.stop()
  else lenis.start()
}
