import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import FOGMODULE from 'vanta/dist/vanta.fog.min.js'
const FOG = FOGMODULE.default ?? FOGMODULE
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import UploadPage from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'
import TreePage from './pages/TreePage'

console.log('FOG module:', FOG)
console.log('THREE module:', THREE)
 
export default function App() {
  const [page, setPage] = useState('landing')
  const [assetData, setAssetData] = useState(null)
  const vantaRef = useRef(null)
  const vantaEffect = useRef(null)
 
  useEffect(() => {
    if (!vantaEffect.current && vantaRef.current) {
    vantaEffect.current = FOG({
  el: vantaRef.current,
  THREE,
  highlightColor: 0xE8621A,   // your exact orange
  midtoneColor:   0xF07A35,   // slightly lighter orange
  lowlightColor:  0x7A2E00,   // dark burnt orange
  baseColor:      0x1A0800,   // near-black with orange tint
  blurFactor:     0.52,
  speed:          1.4,
  zoom:           0.7,
})
    }
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy()
        vantaEffect.current = null
      }
    }
  }, [])
 
  const navigate = (p, data) => {
    if (data) setAssetData(data)
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
 
  return (
    <>
      {/* ── Layer 1: Vanta fog canvas (fixed, full-screen) ── */}
      <div
        ref={vantaRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
        }}
      />
 
      {/* ── Layer 2: Frosted-glass blur veil ── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          backdropFilter: 'blur(26px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(26px) saturate(1.4)',
          /* very subtle dark tint so text stays legible */
          background: 'rgba(8, 8, 8, 0.55)',
        }}
      />
 
      {/* ── Layer 3: App content ── */}
      <div style={{ position: 'relative', zIndex: 2 ,  paddingTop: 60
      }}>
        <Navbar page={page} navigate={navigate} hasAsset={!!assetData} />
        <main>
          {page === 'landing'   && <LandingPage   navigate={navigate} />}
          {page === 'upload'    && <UploadPage     navigate={navigate} />}
          {page === 'dashboard' && <DashboardPage  assetData={assetData} navigate={navigate} />}
          {page === 'tree'      && <TreePage       assetData={assetData} navigate={navigate} />}
        </main>
      </div>
    </>
  )
}