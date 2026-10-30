import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { CREATURES, type EditionId, type ElementId, creatureById, packById, priceOf } from '../data/catalog'
import type { LightPreset } from '../three/env'

export interface CartLine {
  key: string
  kind: 'sphere' | 'pack'
  refId: string
  edition?: EditionId
  qty: number
}

export interface Toast {
  id: number
  title: string
  detail: string
}

interface ShopState {
  cart: CartLine[]
  cartOpen: boolean
  menuOpen: boolean
  toast: Toast | null
  filter: ElementId | 'all'

  selectedId: string
  edition: EditionId
  qty: number
  form: 'sphere' | 'brawl'
  explode: boolean
  wireframe: boolean
  autoRotate: boolean
  hotspots: boolean
  light: LightPreset
  customModel: { url: string; name: string } | null

  addSphere: (id: string, edition: EditionId, qty?: number) => void
  addPack: (id: string) => void
  setQty: (key: string, qty: number) => void
  remove: (key: string) => void
  clearCart: () => void
  setCartOpen: (open: boolean) => void
  setMenuOpen: (open: boolean) => void
  setFilter: (filter: ElementId | 'all') => void
  select: (id: string) => void
  set: (patch: Partial<Pick<ShopState, 'edition' | 'qty' | 'form' | 'explode' | 'wireframe' | 'autoRotate' | 'hotspots' | 'light'>>) => void
  setCustomModel: (model: { url: string; name: string } | null) => void
  dismissToast: () => void
}

const money = (n: number) => `$${n.toFixed(2)}`

export const useShop = create<ShopState>()(
  persist(
    (set, get) => ({
      cart: [],
      cartOpen: false,
      menuOpen: false,
      toast: null,
      filter: 'all',

      selectedId: CREATURES[0].id,
      edition: 'chrome',
      qty: 1,
      form: 'brawl',
      explode: false,
      wireframe: false,
      autoRotate: true,
      hotspots: true,
      light: 'studio',
      customModel: null,

      addSphere: (id, edition, qty = 1) => {
        const key = `sphere:${id}:${edition}`
        const creature = creatureById(id)
        set((s) => {
          const existing = s.cart.find((l) => l.key === key)
          const cart = existing
            ? s.cart.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
            : [...s.cart, { key, kind: 'sphere' as const, refId: id, edition, qty }]
          return {
            cart,
            toast: { id: Date.now(), title: `${creature.name} · ${edition}`, detail: `${qty} × ${money(priceOf(creature, edition))}` },
          }
        })
      },
      addPack: (id) => {
        const key = `pack:${id}`
        const pack = packById(id)
        set((s) => {
          const existing = s.cart.find((l) => l.key === key)
          const cart = existing
            ? s.cart.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l))
            : [...s.cart, { key, kind: 'pack' as const, refId: id, qty: 1 }]
          return { cart, toast: { id: Date.now(), title: pack.name, detail: money(pack.price) } }
        })
      },
      setQty: (key, qty) =>
        set((s) => ({
          cart: qty <= 0 ? s.cart.filter((l) => l.key !== key) : s.cart.map((l) => (l.key === key ? { ...l, qty } : l)),
        })),
      remove: (key) => set((s) => ({ cart: s.cart.filter((l) => l.key !== key) })),
      clearCart: () => set({ cart: [] }),
      setCartOpen: (cartOpen) => set({ cartOpen, menuOpen: false }),
      setMenuOpen: (menuOpen) => set({ menuOpen, cartOpen: false }),
      setFilter: (filter) => set({ filter }),
      select: (selectedId) => {
        if (get().selectedId !== selectedId) set({ selectedId, customModel: null, qty: 1 })
      },
      set: (patch) => set(patch),
      setCustomModel: (customModel) => {
        const prev = get().customModel
        if (prev) URL.revokeObjectURL(prev.url)
        set({ customModel })
      },
      dismissToast: () => set({ toast: null }),
    }),
    {
      name: 'orbyx-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ cart: s.cart }),
    },
  ),
)

export function lineDetails(line: CartLine) {
  if (line.kind === 'pack') {
    const pack = packById(line.refId)
    return { title: pack.name, subtitle: 'Battle pack', unit: pack.price, color: '#fd321c' }
  }
  const creature = creatureById(line.refId)
  return {
    title: creature.name,
    subtitle: `${line.edition} edition`,
    unit: priceOf(creature, line.edition ?? 'core'),
    color: creature.palette.shell,
  }
}

export const cartTotals = (cart: CartLine[]) => {
  const subtotal = cart.reduce((sum, l) => sum + lineDetails(l).unit * l.qty, 0)
  const count = cart.reduce((n, l) => n + l.qty, 0)
  const shipping = subtotal === 0 || subtotal >= 60 ? 0 : 6.9
  return { subtotal, count, shipping, total: subtotal + shipping }
}

export { money }
