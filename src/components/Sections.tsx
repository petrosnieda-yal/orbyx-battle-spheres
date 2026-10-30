import { useState, type CSSProperties, type FormEvent } from 'react'
import { View } from '@react-three/drei'
import { DROPS, ELEMENTS, PACKS, TESTIMONIALS } from '../data/catalog'
import { money, useShop } from '../store/useShop'
import { scrollToTarget } from '../hooks/useLenis'
import { DropScene } from '../three/Scenes'
import { Button, Reveal, SplitWords, Tag } from './ui'

export function Elements() {
  const setFilter = useShop((s) => s.setFilter)
  return (
    <section className="elements section" id="elements">
      <div className="section-head">
        <div>
          <Tag text="Attributes" />
          <Reveal as="h2" className="display">
            Six
            <br />
            Elements
          </Reveal>
        </div>
        <Button label="Shop all spheres" onClick={() => scrollToTarget('#collection')} />
      </div>
      <div className="elements__grid">
        {ELEMENTS.map((e, i) => (
          <Reveal
            key={e.id}
            as="button"
            type="button"
            className="el-card"
            delay={(i % 3) * 90}
            style={{ '--el': e.color } as CSSProperties}
            onClick={() => {
              setFilter(e.id)
              scrollToTarget('#collection')
            }}
          >
            <span className="el-card__orb" aria-hidden>
              <i />
            </span>
            <h5>{e.name}</h5>
            <ul>
              {e.traits.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <span className="el-card__num">0{i + 1}</span>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function Packs() {
  const addPack = useShop((s) => s.addPack)
  return (
    <section className="packs section" id="packs">
      <div className="section-head">
        <div>
          <Tag text="Pricing" />
          <Reveal as="h2" className="display">
            Battle
            <br />
            Packs
          </Reveal>
        </div>
        <p className="section-note">
          Single spheres start at $16.99 in Core finish.
          <br />
          Bundles save up to 24% and ship free.
        </p>
      </div>
      <div className="packs__grid">
        {PACKS.map((p, i) => (
          <Reveal key={p.id} as="article" className={`pack ${p.highlight ? 'pack--hot' : ''}`} style={{ '--tilt': `${i % 2 ? 3 : -3}deg` } as CSSProperties}>
            <div className="pack__top">
              <span className="pack__idx">/ {p.index}</span>
              <span className="dots" aria-hidden>
                {PACKS.map((_, j) => (
                  <i key={j} className={j <= i ? 'on' : ''} />
                ))}
              </span>
            </div>
            <h4>{p.name}</h4>
            {p.highlight && <span className="pack__badge">Most picked</span>}
            <div className="pack__price">
              <b>{money(p.price).replace('.00', '')}</b>
              {p.compareAt && <s>{money(p.compareAt).replace('.00', '')}</s>}
            </div>
            <ul>
              {p.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
            <p className="pack__blurb">{p.blurb}</p>
            <Button label="Add pack" variant={p.highlight ? 'dark' : 'primary'} onClick={() => addPack(p.id)} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function Testimonials() {
  return (
    <section className="reviews" id="reviews">
      <div className="reviews__title">
        <Tag text="Reviews" align="center" />
        <h2 className="display display--center">
          Trusted by
          <br />
          Brawlers
        </h2>
      </div>
      <div className="reviews__cards">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} as="figure" className={`review review--${i % 2 ? 'right' : 'left'}`}>
            <span className="review__quote" aria-hidden>
              “
            </span>
            <blockquote>{t.quote}</blockquote>
            <figcaption>
              <span className="avatar" aria-hidden>
                {t.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </span>
              <span>
                <b>{t.name}</b>
                <small>{t.role}</small>
              </span>
            </figcaption>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function Drops() {
  return (
    <section className="drops section" id="drops">
      <div className="section-head">
        <div>
          <Tag text="Calendar" />
          <Reveal as="h2" className="display">
            Drop
            <br />
            Schedule
          </Reveal>
        </div>
        <span className="drops__years">2026 — 2027</span>
      </div>
      <div className="drops__grid">
        <div className="drops__visual">
          <View className="drops__view" index={1}>
            <DropScene />
          </View>
          <div className="drops__caption">
            <span>Next drop · Classified</span>
            <b>Dec 12, 2026</b>
          </div>
        </div>
        <div className="drops__list">
          {DROPS.map((d, i) => (
            <Reveal key={d.season} className="drop" delay={i * 60}>
              <div>
                <h5>{d.season}</h5>
                <span className={`drop__status ${i === 0 ? 'is-live' : ''}`}>{d.status}</span>
              </div>
              <ul>
                {d.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Cta() {
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (/\S+@\S+\.\S+/.test(email)) setJoined(true)
  }
  return (
    <section className="cta" id="join">
      <Tag text="Drop list" align="center" />
      <h4 className="cta__title">
        <SplitWords text="Ready to brawl?" />
      </h4>
      <p className="cta__sub">Join the drop list for 24h early access to Prism editions and new seasons.</p>
      {joined ? (
        <p className="cta__done">You are on the list. Watch your inbox on Nov 28.</p>
      ) : (
        <form className="cta__form" onSubmit={submit}>
          <input type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
          <Button label="Join the list" type="submit" />
        </form>
      )}
    </section>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__big" aria-hidden>
        ORBYX
      </div>
      <div className="footer__row">
        <span>© 2026 ORBYX · Demo storefront, all creatures are original designs</span>
        <span>Built with React Three Fiber · Three.js · WebGL</span>
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault()
            scrollToTarget(0)
          }}
        >
          Back to top ↑
        </a>
      </div>
    </footer>
  )
}
