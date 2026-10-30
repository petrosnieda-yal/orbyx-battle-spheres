import { useRef, useState, type CSSProperties } from 'react'
import { View } from '@react-three/drei'
import { useShallow } from 'zustand/react/shallow'
import { CREATURES, EDITIONS, creatureById, elementById, priceOf } from '../data/catalog'
import { money, useShop } from '../store/useShop'
import { useDragRotate } from '../hooks/useDragRotate'
import { LIGHT_PRESETS } from '../three/env'
import { type HotspotPin, StudioScene, studioModel } from '../three/Scenes'
import { Button, Reveal, Tag } from './ui'

const HOTSPOTS = [
  { target: 'head', label: 'Pop-up head', detail: 'Spring neck · unfolds in 0.9s' },
  { target: 'crest-mark', label: 'Crest armor', detail: 'Hinged shell plates become wings' },
  { target: 'gem', label: 'G-core gem', detail: 'Glows with the battle rating' },
]

async function exportGlb(name: string) {
  const object = studioModel.current
  if (!object) return
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
  const result = await new GLTFExporter().parseAsync(object, { binary: true, onlyVisible: true })
  const blob = new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.toLowerCase()}.glb`
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" className={`toggle ${on ? 'is-on' : ''}`} onClick={onClick} aria-pressed={on}>
      <i />
      {label}
    </button>
  )
}

export function Studio() {
  const s = useShop(
    useShallow((st) => ({
      selectedId: st.selectedId,
      edition: st.edition,
      qty: st.qty,
      form: st.form,
      explode: st.explode,
      wireframe: st.wireframe,
      autoRotate: st.autoRotate,
      hotspots: st.hotspots,
      light: st.light,
      customModel: st.customModel,
      select: st.select,
      set: st.set,
      addSphere: st.addSphere,
      setCustomModel: st.setCustomModel,
    })),
  )
  const creature = creatureById(s.selectedId)
  const element = elementById(creature.element)
  const price = priceOf(creature, s.edition)
  const stage = useRef<HTMLDivElement>(null)
  const drag = useDragRotate(stage, { zoom: true, onTap: () => s.set({ form: s.form === 'brawl' ? 'sphere' : 'brawl' }) })
  const pins = useRef<HotspotPin[]>(HOTSPOTS.map((h) => ({ target: h.target, el: null })))
  const file = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [exporting, setExporting] = useState(false)

  const loadFile = (f: File | undefined) => {
    if (!f || !/\.(glb|gltf)$/i.test(f.name)) return
    s.setCustomModel({ url: URL.createObjectURL(f), name: f.name })
  }

  const zoom = (delta: number) => {
    drag.current.zoom = Math.min(1.6, Math.max(0.6, drag.current.zoom + delta))
  }

  return (
    <section className="studio section" id="studio" style={{ '--glow': creature.palette.glow, '--el': element.color } as CSSProperties}>
      <div className="section-head">
        <div>
          <Tag text="Inspect" />
          <Reveal as="h2" className="display">
            Battle
            <br />
            Studio
          </Reveal>
        </div>
        <p className="section-note">
          Drag to orbit · pinch or ⌘/ctrl + scroll to zoom · tap to transform.
          <br />
          Hover the stage and the creature tracks your cursor.
        </p>
      </div>

      <div className="studio__grid">
        <div
          className={`studio__stage ${dragOver ? 'is-drop' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            loadFile(e.dataTransfer.files[0])
          }}
        >
          <div className="studio__ghost" aria-hidden>
            {s.customModel ? 'Custom' : creature.name}
          </div>
          <View ref={stage} className="studio__view" index={3}>
            <StudioScene drag={drag} pins={pins} />
          </View>

          <div className="studio__hud">
            <div className="studio__hud-left">
              <span className="chip">
                <i />
                {element.name} · {s.edition}
              </span>
              {s.customModel && (
                <button type="button" className="chip chip--file" onClick={() => s.setCustomModel(null)}>
                  {s.customModel.name} ✕
                </button>
              )}
            </div>
            <div className="studio__hud-right">
              <button
                type="button"
                className="mini"
                disabled={exporting || !!s.customModel}
                onClick={async () => {
                  setExporting(true)
                  await exportGlb(creature.name).finally(() => setExporting(false))
                }}
              >
                {exporting ? 'Exporting…' : 'Export .glb'}
              </button>
              <button type="button" className="mini" onClick={() => file.current?.click()}>
                Load .glb
              </button>
              <input ref={file} type="file" accept=".glb,.gltf" hidden onChange={(e) => loadFile(e.target.files?.[0])} />
            </div>
          </div>

          <div className="pins" aria-hidden={!s.hotspots}>
            {HOTSPOTS.map((h, i) => (
              <div
                key={h.target}
                className="pin"
                ref={(el) => {
                  pins.current[i].el = el
                }}
              >
                <span className="pin__dot" />
                <span className="pin__label">
                  <b>{h.label}</b>
                  {h.target === 'gem' ? `${creature.power} G battle rating` : h.detail}
                </span>
              </div>
            ))}
          </div>

          <div className="studio__toolbar">
            <div className="seg">
              {(['sphere', 'brawl'] as const).map((f) => (
                <button key={f} type="button" className={s.form === f ? 'is-on' : ''} onClick={() => s.set({ form: f })}>
                  {f === 'sphere' ? 'Sphere' : 'Brawl'}
                </button>
              ))}
            </div>
            <Toggle on={s.explode} label="Explode" onClick={() => s.set({ explode: !s.explode })} />
            <Toggle on={s.wireframe} label="Wire" onClick={() => s.set({ wireframe: !s.wireframe })} />
            <Toggle on={s.autoRotate} label="Spin" onClick={() => s.set({ autoRotate: !s.autoRotate })} />
            <Toggle on={s.hotspots} label="Pins" onClick={() => s.set({ hotspots: !s.hotspots })} />
            <div className="seg">
              {LIGHT_PRESETS.map((l) => (
                <button key={l.id} type="button" className={s.light === l.id ? 'is-on' : ''} onClick={() => s.set({ light: l.id })}>
                  {l.name}
                </button>
              ))}
            </div>
            <div className="seg seg--zoom">
              <button type="button" onClick={() => zoom(0.15)} aria-label="Zoom out">
                −
              </button>
              <button type="button" onClick={() => zoom(-0.15)} aria-label="Zoom in">
                +
              </button>
            </div>
          </div>
          <div className="studio__dropzone">Drop a .glb to preview it on the stage</div>
        </div>

        <aside className="studio__panel">
          <div className="picker">
            {CREATURES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={c.id === creature.id ? 'is-on' : ''}
                onClick={() => s.select(c.id)}
                style={{ '--c': c.palette.shell, '--g': c.palette.glow } as CSSProperties}
                aria-label={c.name}
              >
                <i />
                <span>{c.name}</span>
              </button>
            ))}
          </div>

          <div className="panel__head">
            <span className="panel__idx">
              / {creature.index} · {element.name} · {creature.rarity}
            </span>
            <h3>{creature.name}</h3>
            <p className="panel__tag">{creature.tagline}</p>
          </div>
          <p className="panel__desc">{creature.description}</p>

          <div className="stats">
            <div className="stats__power">
              <b>{creature.power}</b>
              <span>G power</span>
            </div>
            <div className="stats__bars">
              {Object.entries(creature.stats).map(([k, v]) => (
                <div key={k} className="bar">
                  <span>{k}</span>
                  <div>
                    <i style={{ transform: `scaleX(${v / 100})` }} />
                  </div>
                  <b>{v}</b>
                </div>
              ))}
            </div>
          </div>

          <div className="editions" role="radiogroup" aria-label="Edition">
            {EDITIONS.map((e) => (
              <button key={e.id} type="button" role="radio" aria-checked={s.edition === e.id} className={s.edition === e.id ? 'is-on' : ''} onClick={() => s.set({ edition: e.id })}>
                <span className={`edition__swatch edition__swatch--${e.finish}`} />
                <b>{e.name}</b>
                <small>{e.note}</small>
                <em>{money(priceOf(creature, e.id))}</em>
              </button>
            ))}
          </div>

          <div className="buy">
            <div className="qty qty--lg">
              <button type="button" onClick={() => s.set({ qty: Math.max(1, s.qty - 1) })} aria-label="Decrease">
                −
              </button>
              <span>{s.qty}</span>
              <button type="button" onClick={() => s.set({ qty: Math.min(9, s.qty + 1) })} aria-label="Increase">
                +
              </button>
            </div>
            <div className="buy__price">
              <small>Total</small>
              <b>{money(price * s.qty)}</b>
            </div>
          </div>
          <Button label="Add to cart" className="btn--block" onClick={() => s.addSphere(creature.id, s.edition, s.qty)} />
        </aside>
      </div>
    </section>
  )
}
