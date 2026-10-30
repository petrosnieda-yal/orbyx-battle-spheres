import { useEffect, useRef } from 'react'
import { View } from '@react-three/drei'
import { creatureById, priceOf } from '../data/catalog'
import { useShop } from '../store/useShop'
import { scrollToTarget } from '../hooks/useLenis'
import { AuraScene, HeroScene } from '../three/Scenes'
import { pointer } from '../three/anim'
import { Button, Reveal, Tag } from './ui'

export function Hero() {
  const section = useRef<HTMLElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const progress = useRef(0)
  const hero = creatureById('vyrakh')

  useEffect(() => {
    let raf = 0
    const tilt = { x: 0, y: 0 }
    const loop = () => {
      const el = section.current
      if (el) {
        const rect = el.getBoundingClientRect()
        const total = Math.max(1, el.offsetHeight - window.innerHeight)
        const p = Math.min(1, Math.max(0, -rect.top / (total * 0.8)))
        progress.current = p
        el.style.setProperty('--hp', p.toFixed(4))
      }
      tilt.x += (pointer.x - tilt.x) * 0.06
      tilt.y += (pointer.y - tilt.y) * 0.06
      card.current?.style.setProperty('--rx', `${(tilt.y * 7).toFixed(2)}deg`)
      card.current?.style.setProperty('--ry', `${(tilt.x * 9).toFixed(2)}deg`)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section id="top" ref={section} className="hero">
      <div className="hero__sticky">
        <div className="hero__marquee" aria-hidden>
          <div className="hero__track">
            <span>Orbyx battle spheres —&nbsp;</span>
            <span>Orbyx battle spheres —&nbsp;</span>
          </div>
        </div>
        <div className="hero__card" ref={card}>
          <div className="hero__card-inner">
            <span className="hero__card-label">/ 01 · {hero.name}</span>
            <span className="hero__card-power">{hero.power} G</span>
          </div>
        </div>
        <View className="hero__view" index={2}>
          <HeroScene progress={progress} />
        </View>
        <h1 className="sr-only">ORBYX — collectible battle sphere store</h1>
        <p className="hero__sub">
          Collectible battle spheres,
          <br />
          engineered in real-time 3D
        </p>
        <div className="hero__side hero__side--left">
          <span>S01 · Ember Rising</span>
          <b>Live now</b>
        </div>
        <div className="hero__side hero__side--right">
          <span>{hero.name} · Legendary</span>
          <b>From ${priceOf(hero, 'core')}</b>
        </div>
        <div className="hero__hint">
          <span>Scroll to transform</span>
          <i />
        </div>
      </div>
    </section>
  )
}

export function About() {
  const select = useShop((s) => s.select)
  return (
    <section className="about" id="about">
      <View className="about__aura" index={1}>
        <AuraScene />
      </View>
      <div className="about__panel">
        <Tag text="Who we are" align="center" />
        <Reveal as="h4" className="statement">
          Every sphere in our store is sculpted in real-time 3D. Spin it, crack it open and inspect every hinge before it ships. No renders, no guesswork.
        </Reveal>
        <div className="about__stats">
          {[
            ['06', 'Elements'],
            ['24', 'Editions'],
            ['60fps', 'WebGL viewer'],
          ].map(([n, l], i) => (
            <Reveal key={l} className="stat" delay={i * 90}>
              <b>{n}</b>
              <span>{l}</span>
            </Reveal>
          ))}
        </div>
        <div className="about__cta">
          <Button label="Explore the roster" onClick={() => scrollToTarget('#collection')} />
          <Button
            label="Open the studio"
            variant="ghost"
            onClick={() => {
              select('vyrakh')
              scrollToTarget('#studio')
            }}
          />
        </div>
      </div>
    </section>
  )
}
