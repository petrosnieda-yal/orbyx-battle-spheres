import { useLenis } from './hooks/useLenis'
import SceneCanvas from './three/SceneCanvas'
import { CartDrawer, Nav, Preloader, Toast } from './components/Chrome'
import { About, Hero } from './components/Hero'
import { Collection } from './components/Collection'
import { Studio } from './components/Studio'
import { Cta, Drops, Elements, Footer, Packs, Testimonials } from './components/Sections'

export default function App() {
  useLenis()
  return (
    <>
      <Preloader />
      <Nav />
      <main>
        <Hero />
        <About />
        <Collection />
        <Studio />
        <Elements />
        <Packs />
        <Testimonials />
        <Drops />
        <Cta />
      </main>
      <Footer />
      <CartDrawer />
      <Toast />
      <SceneCanvas />
    </>
  )
}
