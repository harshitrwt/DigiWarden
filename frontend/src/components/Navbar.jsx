import { Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar({ page, navigate, hasAsset }) {
  const { isAuthenticated, logout } = useAuth()
  const links = [
    { label: 'Features',     id: 'landing', section: 'features' },
    { label: 'How It Works', id: 'landing', section: 'how-it-works' },
    { label: 'Demo',         id: 'upload'  },
  ]

  return (
    <nav style={{
      position: 'fixed',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 48px)',
      maxWidth: 1200,
      zIndex: 100,
      background: 'rgba(12,12,12,0.75)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60,
      }}>
        {/* Logo */}
        <div onClick={() => navigate('landing')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{
            width: 32, height: 32, background: 'var(--orange)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.02em' }}>
              Digi<span style={{ color: 'var(--orange)' }}>Warden</span>
            </span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--text3)', marginLeft: 6 }}>v2</span>
          </div>
        </div>

        {/* Center nav */}
        <div style={{ display: 'flex', gap: 4 }}>
          {links.map((l, i) => (
            <button key={i} onClick={() => {
              navigate(l.id);
              if (l.section) {
                setTimeout(() => {
                  const element = document.getElementById(l.section);
                  if (element) {
                    const offsetTop = element.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                  }
                }, 100);
              }
            }} style={{
              padding: '6px 16px', background: 'none', border: 'none',
              color: 'var(--text2)', fontSize: 14, cursor: 'pointer',
              borderRadius: 6, transition: 'color 0.15s',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12 }}>
          {isAuthenticated ? (
            <>
              <button onClick={() => navigate('vault')} style={{
                padding: '8px 20px', background: 'transparent',
                color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s',
              }}>
                My Vault
              </button>
              <button onClick={() => navigate('upload')} style={{
                padding: '8px 20px', background: 'var(--orange)',
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s',
              }}>
                Open Workflow
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('login')} style={{
                padding: '8px 20px', background: 'transparent',
                color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s',
              }}>
                Login
              </button>
              <button onClick={() => navigate('upload')} style={{
                padding: '8px 20px', background: 'var(--orange)',
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s',
              }}>
                Open Workflow
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
