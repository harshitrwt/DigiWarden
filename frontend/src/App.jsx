import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import FOGMODULE from 'vanta/dist/vanta.fog.min.js'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import UploadPage from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'
import TreePage from './pages/TreePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VaultPage from './pages/VaultPage'

const FOG = FOGMODULE.default ?? FOGMODULE
const WORKFLOW_STORAGE_KEY = 'digiwarden.workflow'

function loadStoredWorkflow() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.sessionStorage.getItem(WORKFLOW_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function App() {
  const [page, setPage] = useState('landing')
  const [workflow, setWorkflow] = useState(loadStoredWorkflow)
  const vantaRef = useRef(null)
  const vantaEffect = useRef(null)

  useEffect(() => {
    if (!vantaEffect.current && vantaRef.current) {
      vantaEffect.current = FOG({
        el: vantaRef.current,
        THREE,
        highlightColor: 0xe8621a,
        midtoneColor: 0xf07a35,
        lowlightColor: 0x7a2e00,
        baseColor: 0x1a0800,
        blurFactor: 0.52,
        speed: 1.4,
        zoom: 0.7,
      })
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy()
        vantaEffect.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      if (workflow) {
        window.sessionStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(workflow))
      } else {
        window.sessionStorage.removeItem(WORKFLOW_STORAGE_KEY)
      }
    } catch {
      // Ignore storage failures and keep the in-memory workflow.
    }
  }, [workflow])

  const navigate = (nextPage, nextWorkflow) => {
    if (nextWorkflow) {
      setWorkflow(nextWorkflow)
    }

    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <div
        ref={vantaRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          backdropFilter: 'blur(26px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(26px) saturate(1.4)',
          background: 'rgba(8, 8, 8, 0.55)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, paddingTop: 60 }}>
        <Navbar page={page} navigate={navigate} hasAsset={Boolean(workflow?.analysis?.image_id)} />
        <main>
          {page === 'landing' && <LandingPage navigate={navigate} />}
          {page === 'upload' && <UploadPage navigate={navigate} workflow={workflow} />}
          {page === 'dashboard' && <DashboardPage workflow={workflow} navigate={navigate} />}
          {page === 'tree' && <TreePage workflow={workflow} navigate={navigate} />}
          {page === 'login' && <LoginPage navigate={navigate} />}
          {page === 'register' && <RegisterPage navigate={navigate} />}
          {page === 'vault' && <VaultPage navigate={navigate} />}
        </main>
      </div>
    </>
  )
}
