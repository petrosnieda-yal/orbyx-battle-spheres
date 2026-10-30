import { useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { PerformanceMonitor, View } from '@react-three/drei'
import { bakeEnvironments, useEnvMaps } from './env'

function EnvBaker() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const maps = bakeEnvironments(gl)
    useEnvMaps.setState({ maps })
    return () => {
      Object.values(maps).forEach((t) => t.dispose())
      useEnvMaps.setState({ maps: null })
    }
  }, [gl])
  return null
}

export default function SceneCanvas() {
  const max = Math.min(2, window.devicePixelRatio || 1)
  const [dpr, setDpr] = useState(Math.min(1.5, max))
  return (
    <Canvas
      className="webgl"
      eventSource={document.getElementById('root')!}
      eventPrefix="client"
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100lvh', pointerEvents: 'none', zIndex: 5 }}
    >
      <PerformanceMonitor onIncline={() => setDpr(max)} onDecline={() => setDpr(1)} flipflops={3} onFallback={() => setDpr(1)} />
      <EnvBaker />
      <View.Port />
    </Canvas>
  )
}
