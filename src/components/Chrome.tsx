import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { cartTotals, lineDetails, money, useShop } from '../store/useShop'
import { useEnvMaps } from '../three/env'
import { scrollToTarget, setScrollLocked } from '../hooks/useLenis'
import { Button, RollText } from './ui'

export function Preloader() {
  const [pct, setPct] = useState(0)
  const [phase, setPhase] = useState<'loading' | 'leaving' | 'done'>('loading')
  const ready = useEnvMaps((s) => !!s.maps)
  const fonts = useRef(false)

  useEffect(() => {
    document.fonts?.ready.then(() => (fonts.current = true))
  }, [])

  useEffect(() => {
    if (phase !== 'loading') return
    let raf = 0
    let value = 0
    const start = performance.now()
    const tick = (now: number) => {
      const cap = ready && fonts.current ? 100 : 88
      const target = Math.min(cap, ((now - start) / 1300) * 100)
      value += (target - value) * 0.12
      const shown = Math.min(100, Math.round(value + 0.4))
      setPct(shown)
      if (shown >= 100) {
        setPhase('leaving')
        window.setTimeout(() => setPhase('done'), 1100)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ready, phase])

  useEffect(() => {
    setScrollLocked(phase === 'loading')
    document.documentElement.classList.toggle('is-loaded', phase !== 'loading')
  }, [phase])

  if (phase === 'done') return null
  return (
    <div className={`preloader ${phase === 'leaving' ? 'is-leaving' : ''}`} aria-hidden>
      <div className="preloader__mark">
        <svg viewBox="0 0 64 64" width="44" height="44">
          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M4 32h56M32 4v56" stroke="currentColor" strokeWidth="3" />
          <circle cx="32" cy="32" r="7" fill="#fd321c" />
        </svg>
        <span>{pct}%</span>
      </div>
      <div className="preloader__bar">
        <i style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
    </div>
  )
}

const LINKS = [
  { href: '#collection', label: 'Collection' },
  { href: '#studio', label: 'Studio' },
  { href: '#elements', label: 'Elements' },
  { href: '#packs', label: 'Packs' },
  { href: '#drops', label: 'Drops' },
]

export function Nav() {
  const { menuOpen, setMenuOpen, setCartOpen } = useShop(useShallow((s) => ({ menuOpen: s.menuOpen, setMenuOpen: s.setMenuOpen, setCartOpen: s.setCartOpen })))
  const count = useShop((s) => cartTotals(s.cart).count)
  const bar = useRef<HTMLElement>(null)
  const [bump, setBump] = useState(false)

  useEffect(() => {
    let raf = 0
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      bar.current?.style.setProperty('--p', String(max > 0 ? window.scrollY / max : 0))
      raf = 0
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!count) return
    setBump(true)
    const id = window.setTimeout(() => setBump(false), 500)
    return () => clearTimeout(id)
  }, [count])

  return (
    <>
      <header className="nav">
        <a className="nav__logo" href="#top" onClick={(e) => (e.preventDefault(), scrollToTarget(0))}>
          <RollText text="ORBYX" />
        </a>
        <button type="button" className="nav__menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
          <span className="nav__bar">
            <i ref={bar} />
          </span>
          <span>{menuOpen ? 'Close' : 'Menu'}</span>
        </button>
        <button type="button" className={`nav__cart ${bump ? 'is-bump' : ''}`} onClick={() => setCartOpen(true)}>
          <RollText text="Cart" />
          <span className="nav__count">{count}</span>
        </button>
      </header>
      <div className={`menu ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
        <nav className="menu__links">
          {LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              style={{ transitionDelay: menuOpen ? `${120 + i * 60}ms` : '0ms' }}
              onClick={(e) => {
                e.preventDefault()
                setMenuOpen(false)
                scrollToTarget(l.href)
              }}
            >
              <small>/ 0{i + 1}</small>
              <RollText text={l.label} />
            </a>
          ))}
        </nav>
        <div className="menu__foot">
          <span>Season 01 · Ember Rising</span>
          <span>Free shipping over $60</span>
        </div>
      </div>
    </>
  )
}

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQty, remove, clearCart } = useShop(
    useShallow((s) => ({ cart: s.cart, cartOpen: s.cartOpen, setCartOpen: s.setCartOpen, setQty: s.setQty, remove: s.remove, clearCart: s.clearCart })),
  )
  const totals = cartTotals(cart)
  const [placed, setPlaced] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCartOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setCartOpen])

  useEffect(() => {
    setScrollLocked(cartOpen)
    if (!cartOpen) setPlaced(false)
  }, [cartOpen])

  return (
    <div className={`drawer ${cartOpen ? 'is-open' : ''}`} aria-hidden={!cartOpen}>
      <div className="drawer__backdrop" onClick={() => setCartOpen(false)} />
      <aside className="drawer__panel" role="dialog" aria-label="Cart">
        <div className="drawer__head">
          <h5>Cart ({totals.count})</h5>
          <button type="button" className="drawer__close" onClick={() => setCartOpen(false)}>
            <RollText text="Close" />
          </button>
        </div>
        {placed ? (
          <div className="drawer__empty">
            <p className="drawer__big">Order placed</p>
            <p>This is a demo storefront, so nothing was charged. Your spheres are safe in the vault.</p>
            <Button label="Keep browsing" onClick={() => setCartOpen(false)} />
          </div>
        ) : cart.length === 0 ? (
          <div className="drawer__empty">
            <p className="drawer__big">Your cart is empty</p>
            <p>Pick a sphere, choose an edition and it will land here.</p>
            <Button
              label="Browse collection"
              onClick={() => {
                setCartOpen(false)
                scrollToTarget('#collection')
              }}
            />
          </div>
        ) : (
          <>
            <ul className="drawer__list" data-lenis-prevent>
              {cart.map((line) => {
                const d = lineDetails(line)
                return (
                  <li key={line.key} className="line">
                    <span className="line__swatch" style={{ background: `radial-gradient(circle at 35% 30%, #fff8, ${d.color} 45%, #000 100%)` }} />
                    <div className="line__info">
                      <b>{d.title}</b>
                      <small>{d.subtitle}</small>
                      <div className="qty">
                        <button type="button" onClick={() => setQty(line.key, line.qty - 1)} aria-label="Decrease">
                          −
                        </button>
                        <span>{line.qty}</span>
                        <button type="button" onClick={() => setQty(line.key, line.qty + 1)} aria-label="Increase">
                          +
                        </button>
                      </div>
                    </div>
                    <div className="line__price">
                      <b>{money(d.unit * line.qty)}</b>
                      <button type="button" onClick={() => remove(line.key)}>
                        Remove
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="drawer__summary">
              <div>
                <span>Subtotal</span>
                <span>{money(totals.subtotal)}</span>
              </div>
              <div>
                <span>Shipping</span>
                <span>{totals.shipping === 0 ? 'Free' : money(totals.shipping)}</span>
              </div>
              {totals.shipping > 0 && <p className="drawer__hint">Add {money(60 - totals.subtotal)} more for free shipping</p>}
              <div className="drawer__total">
                <span>Total</span>
                <span>{money(totals.total)}</span>
              </div>
              <Button
                label="Checkout"
                className="btn--block"
                onClick={() => {
                  clearCart()
                  setPlaced(true)
                }}
              />
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

export function Toast() {
  const toast = useShop((s) => s.toast)
  const dismiss = useShop((s) => s.dismissToast)
  const setCartOpen = useShop((s) => s.setCartOpen)
  const [shown, setShown] = useState(toast)
  useEffect(() => {
    if (!toast) return
    setShown(toast)
    const id = window.setTimeout(dismiss, 2800)
    return () => clearTimeout(id)
  }, [toast, dismiss])
  return (
    <div className={`toast ${toast ? 'is-on' : ''}`} role="status">
      {shown && (
        <>
          <span className="toast__dot" />
          <div>
            <b>{shown.title}</b>
            <small>Added · {shown.detail}</small>
          </div>
          <button type="button" onClick={() => setCartOpen(true)}>
            View cart
          </button>
        </>
      )}
    </div>
  )
}
