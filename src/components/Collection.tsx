import { useRef, useState, type CSSProperties } from 'react'
import { View } from '@react-three/drei'
import { CREATURES, ELEMENTS, type Creature, elementById, priceOf } from '../data/catalog'
import { useShop } from '../store/useShop'
import { useDragRotate } from '../hooks/useDragRotate'
import { scrollToTarget } from '../hooks/useLenis'
import { CardScene } from '../three/Scenes'
import { Button, Reveal, Tag } from './ui'

function ProductCard({ creature, order }: { creature: Creature; order: number }) {
  const [open, setOpen] = useState(false)
  const view = useRef<HTMLDivElement>(null)
  const drag = useDragRotate(view, { onTap: () => setOpen((o) => !o) })
  const element = elementById(creature.element)
  const addSphere = useShop((s) => s.addSphere)
  const select = useShop((s) => s.select)

  return (
    <Reveal
      as="article"
      className="card"
      delay={(order % 3) * 90}
      style={{ '--glow': creature.palette.glow, '--el': element.color } as CSSProperties}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="card__stage">
        <View ref={view} className="card__view">
          <CardScene creature={creature} open={open} drag={drag} />
        </View>
        <span className="card__idx">/ {creature.index}</span>
        <span className="chip">
          <i />
          {element.name}
        </span>
        <span className={`card__hint ${open ? 'is-open' : ''}`}>{open ? 'Brawl form' : 'Hover · drag to spin'}</span>
      </div>
      <div className="card__body">
        <div className="card__title">
          <h3>{creature.name}</h3>
          <p>{creature.tagline}</p>
        </div>
        <div className="card__meta">
          <span>{creature.power} G</span>
          <span>{creature.rarity}</span>
        </div>
        <div className="card__foot">
          <div className="price">
            <small>From</small>${priceOf(creature, 'core').toFixed(2)}
          </div>
          <div className="card__actions">
            <Button
              label="Inspect"
              variant="ghost"
              size="sm"
              onClick={() => {
                select(creature.id)
                scrollToTarget('#studio')
              }}
            />
            <Button label="Add" size="sm" onClick={() => addSphere(creature.id, 'core')} />
          </div>
        </div>
      </div>
    </Reveal>
  )
}

export function Collection() {
  const filter = useShop((s) => s.filter)
  const setFilter = useShop((s) => s.setFilter)
  const list = filter === 'all' ? CREATURES : CREATURES.filter((c) => c.element === filter)

  return (
    <section className="collection section" id="collection">
      <div className="section-head">
        <div>
          <Tag text="Roster" />
          <Reveal as="h2" className="display">
            The
            <br />
            Collection
          </Reveal>
        </div>
        <div className="filters" role="tablist" aria-label="Filter by element">
          <button type="button" className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>
            All
          </button>
          {ELEMENTS.map((e) => (
            <button
              key={e.id}
              type="button"
              className={filter === e.id ? 'is-active' : ''}
              style={{ '--el': e.color } as CSSProperties}
              onClick={() => setFilter(e.id)}
            >
              <i />
              {e.name}
            </button>
          ))}
        </div>
      </div>
      <div className="grid">
        {list.map((c, i) => (
          <ProductCard key={c.id} creature={c} order={i} />
        ))}
      </div>
    </section>
  )
}
