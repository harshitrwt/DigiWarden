import { Fingerprint, GitBranch, FileText, ArrowRight, Shield, Zap, Globe, Upload, Search, TreePine } from 'lucide-react'

// ── Reusable card shell ──────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 12, padding: 24, ...style,
  }}>{children}</div>
)

// ── Mini dashboard mockup (right side of hero) ───────────────
function DashboardMockup() {
  return (
    <div style={{
      background: '#111', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
    }}>
      {/* Browser bar */}
      <div style={{ background: '#1A1A1A', padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, alignItems: 'center' }}>
        {['#FF5F57','#FEBC2E','#28C840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        <div style={{ flex: 1, marginLeft: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '3px 12px', fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono,monospace' }}>
          digipatron.app/dashboard
        </div>
      </div>

      {/* Dashboard content */}
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 0 }}>
        {/* Sidebar */}
        <div style={{ background: '#0F0F0F', borderRight: '1px solid var(--border)', padding: '16px 12px', fontSize: 12 }}>
          <div style={{ color: 'var(--orange)', fontWeight: 700, marginBottom: 16, fontSize: 13 }}>DigiPatron</div>
          {['Dashboard','Products','Analyze','Done','Settings'].map((item, i) => (
            <div key={item} style={{
              padding: '7px 10px', borderRadius: 6, marginBottom: 2,
              background: i === 0 ? 'rgba(232,98,26,0.15)' : 'transparent',
              color: i === 0 ? 'var(--orange)' : 'var(--text3)', cursor: 'pointer', fontSize: 12,
            }}>{item}</div>
          ))}
        </div>

        {/* Main area */}
        <div style={{ padding: 16 }}>
          {/* Upload panel */}
          <div style={{ background: '#1A1A1A', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>Upload Image</div>
            <div style={{ width: 36, height: 36, background: 'rgba(232,98,26,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <Upload size={16} color="var(--orange)" />
            </div>
            <div style={{ background: 'var(--orange)', color: '#fff', fontSize: 11, padding: '6px 16px', borderRadius: 6, display: 'inline-block', fontWeight: 600 }}>Upload Image</div>
          </div>

          {/* Score + Tree row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            {/* Score */}
            <div style={{ background: '#1A1A1A', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 8 }}>Similarity Score</div>
              <div style={{ position: 'relative', width: 60, height: 60, margin: '0 auto' }}>
                <svg width={60} height={60} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={30} cy={30} r={22} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
                  <circle cx={30} cy={30} r={22} fill="none" stroke="var(--orange)" strokeWidth={6}
                    strokeDasharray={138} strokeDashoffset={138 * 0.14} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: 'var(--orange)' }}>86</div>
              </div>
            </div>
            {/* Tree mini */}
            <div style={{ background: '#1A1A1A', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 8 }}>Propagation Tree</div>
              <svg width="100%" height={56} viewBox="0 0 120 56">
                <line x1="20" y1="10" x2="50" y2="28" stroke="rgba(232,98,26,0.4)" strokeWidth="1.5" strokeDasharray="3,2"/>
                <line x1="20" y1="10" x2="50" y2="46" stroke="rgba(232,98,26,0.4)" strokeWidth="1.5" strokeDasharray="3,2"/>
                <line x1="50" y1="28" x2="90" y2="18" stroke="rgba(255,59,92,0.5)" strokeWidth="1.5" strokeDasharray="3,2"/>
                <line x1="50" y1="28" x2="90" y2="38" stroke="rgba(232,98,26,0.4)" strokeWidth="1.5" strokeDasharray="3,2"/>
                <circle cx="20" cy="10" r="7" fill="#22C55E"/>
                <circle cx="50" cy="28" r="5" fill="var(--orange)"/>
                <circle cx="50" cy="46" r="5" fill="var(--orange)"/>
                <circle cx="90" cy="18" r="5" fill="#FF3B5C"/>
                <circle cx="90" cy="38" r="5" fill="var(--orange)"/>
              </svg>
            </div>
          </div>

          {/* Infringement alert */}
          <div style={{ background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.2)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF3B5C' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#FF3B5C' }}>Infringement Alert</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.5 }}>
              That image copies into anartis infringement alert takedown-ready reports in one place.
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              <div style={{ background: 'var(--orange)', color: '#fff', fontSize: 10, padding: '4px 10px', borderRadius: 4, fontWeight: 600 }}>Generate draft</div>
              <div style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text2)', fontSize: 10, padding: '4px 10px', borderRadius: 4 }}>View 10.10.2006 PM</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage({ navigate }) {
  const features = [
    { icon: Fingerprint, title: 'Fingerprint Detection', desc: 'Track image roots via fingerprint detection in aneyxs glace.' },
    { icon: GitBranch,   title: 'Propagation Mapping',  desc: 'Track image copies, map propagation trees, and place.' },
    { icon: FileText,    title: 'DMCA Workflow',         desc: 'Generate react violites in fiest dortam in DMCA workflow.' },
  ]

  const howSteps = [
    { n: 1, title: 'Upload',  desc: 'Upload your original image. ContentGenome assigns a unique ID and begins fingerprinting immediately.' },
    { n: 2, title: 'Analyze', desc: 'Three fingerprint methods run in parallel: pHash, ORB, and CLIP embeddings fused into a combined score.' },
    { n: 3, title: 'Trace',   desc: 'Matched copies are arranged in a directed propagation tree, with mutation type labeled on each edge.' },
    { n: 4, title: 'Act',     desc: 'Generate a complete DMCA notice with pre-filled evidence. Copy, download, or send directly to platforms.' },
  ]

  const why = [
    { icon: Shield, title: 'Copyright protection',    desc: 'Protecting copyright protection with eone ream-violet copyright protection.' },
    { icon: Zap,    title: 'Rapid evidence gathering', desc: 'Rapid evidence xe onio evidence gathers oaaid and unsosavble sollance.' },
    { icon: Globe,  title: 'Easy response actions',    desc: 'Easy easy andenmatle actions and udoreces and oet and response responses.' },
  ]

  const Btn = ({ children, onClick, style = {}, outline = false }) => (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '11px 24px', borderRadius: 8, border: outline ? '1.5px solid rgba(255,255,255,0.2)' : 'none',
      background: outline ? 'transparent' : 'var(--orange)', color: '#fff',
      fontSize: 15, fontWeight: 600, cursor: 'pointer',
      fontFamily: 'Inter, sans-serif', transition: 'all 0.18s', ...style,
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; if (!outline) e.currentTarget.style.background = 'var(--orange2)' }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; if (!outline) e.currentTarget.style.background = 'var(--orange)' }}
    >
      {children}
    </button>
  )

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ padding: '80px 0 72px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          {/* Left */}
          <div style={{ animation: 'fadeUp 0.5s ease forwards' }}>
             <h1 style={{
            fontFamily:'Syne,sans-serif',fontWeight:800,
            fontSize:'clamp(38px,4.5vw,58px)',lineHeight:1.08,letterSpacing:'-0.03em',
            marginBottom:20,
          }}>
            <span style={{color:'#fff'}}>Protect Sports Media From</span>{' '}
            <span style={{
              background:'linear-gradient(90deg,var(--orange),#FF9040)',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
            }}>Unauthorized Reuse</span>
          </h1>
            <p style={{ fontSize: 16, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 32, maxWidth: 460 }}>
              Track image copies, map propagation trees, and generate takedown-ready reports in one place.
            </p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 52 }}>
              <Btn onClick={() => navigate('upload')}>Start Tracking</Btn>
              <Btn onClick={() => navigate('dashboard')} outline>View Demo</Btn>
            </div>

            {/* Feature pills */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {features.map(f => (
                <div key={f.title} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px 16px',
                  flex: 1, minWidth: 160,
                }}>
                  <div style={{ width: 32, height: 32, background: 'var(--orange-dim)', border: '1px solid var(--orange-border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <f.icon size={15} color="var(--orange)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{f.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — mockup */}
          <div style={{ animation: 'fadeIn 0.6s 0.1s ease both' }}>
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ── WHY SECTION ──────────────────────────────────────── */}
      <section id="features" style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 36, letterSpacing: '-0.02em' }}>
            Why Sports Media Teams Use It
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {why.map(w => (
              <div key={w.title} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '22px 20px',
                display: 'flex', gap: 14,
              }}>
                <div style={{ width: 40, height: 40, flexShrink: 0, background: 'var(--orange-dim)', border: '1px solid var(--orange-border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <w.icon size={17} color="var(--orange)" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{w.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>{w.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 36, letterSpacing: '-0.02em' }}>
            How It Works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {howSteps.map(h => (
              <div key={h.n} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '20px 18px', position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: 14, right: 16,
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700,
                  color: 'rgba(232,98,26,0.15)',
                }}>{h.n}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{h.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.65 }}>{h.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

  
     
      {/* ── CTA ──────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '60px 32px 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg,rgba(232,98,26,0.08),rgba(232,98,26,0.03))',
            border: '1px solid rgba(232,98,26,0.2)', borderRadius: 16,
            padding: '52px 40px', textAlign: 'center',
          }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '-0.02em' }}>
              Ready to protect your content?
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 28 }}>Register your first image in under 30 seconds.</p>
            <Btn onClick={() => navigate('upload')}>Start Tracking <ArrowRight size={15} /></Btn>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 32px', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
        © 2025 DigiWarden · Content Genome System · Built for H2S × Google for Developers Hackathon
      </footer>
    </div>
  )
}
