# ORBYX — Battle Sphere Store

A real-time 3D storefront for collectible battle spheres. Every product is a procedural model that unfolds from a closed sphere into a creature, so shoppers can spin it, open it, explode it and compare finishes before they buy.

**Live:** https://petrosnieda-yal.github.io/orbyx-battle-spheres/

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
```

## Stack

React 19 · TypeScript · Vite · Three.js r187 · React Three Fiber 9 · drei · zustand · Lenis

## What's inside

- **One WebGL context for the whole page.** Hero, six product cards, the studio and the drop teaser are all drei `View`s scissored out of a single fixed canvas. Off-screen views are skipped, and `PerformanceMonitor` lowers DPR on slow devices.
- **Procedural creatures.** Thick shell panels with rims, glowing seams, hinged crests that become wings, splaying leg plates, pop-up heads and tails. Six head, wing and tail variants are composed from cached geometry (`src/three/parts.tsx`).
- **PBR editions.** Gloss clearcoat, satin metal, iridescent chrome and a transmissive Prism crystal with dispersion. Each edition changes the material and the price.
- **Studio configurator.** Drag to orbit, pinch to zoom, head tracking that follows the cursor, exploded view, wireframe, three baked lighting presets (PMREM from emissive panels, no HDRI downloads), 3D-tracked hotspots, **Export .glb** (GLTFExporter) and **Load .glb** by file picker or drag-and-drop.
- **Shop.** Element filters, editions and bundle pricing, a persisted cart drawer, free-shipping threshold and toast feedback.
- **Scroll-driven hero.** The sphere transforms as you scroll, in front of a tilting CSS card. The "Who we are" panel sits on a GLSL aura behind a glass backdrop.

All creature names and designs are original.
