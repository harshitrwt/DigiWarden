import { useState } from 'react'
import { X, Zap, Download, Copy, CheckCircle, Loader } from 'lucide-react'
import { useDMCA } from '../hooks/useApi'

export default function DMCAModal({ nodeData, onClose }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const { generate, loading, draft } = useDMCA()

  const handleGenerate = () => generate({ ownerName:name, ownerEmail:email, nodeData })

  const handleCopy = () => {
    navigator.clipboard.writeText(draft.body)
    setCopied(true); setTimeout(()=>setCopied(false),2000)
  }

  const input = (placeholder, value, onChange) => (
    <input
      placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}
      style={{
        width:'100%',padding:'10px 14px',
        background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',
        borderRadius:8,fontSize:14,color:'#fff',outline:'none',
        fontFamily:'Outfit,sans-serif',transition:'border-color 0.2s',
      }}
      onFocus={e=>e.target.style.borderColor='rgba(255,107,26,0.4)'}
      onBlur={e=>e.target.style.borderColor='var(--border)'}
    />
  )

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(10px)',
      display:'flex',alignItems:'center',justifyContent:'center',animation:'fadeIn 0.2s ease',padding:24,
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'#181818',border:'1px solid rgba(255,59,92,0.2)',
        borderRadius:20,width:'100%',maxWidth:580,maxHeight:'90vh',overflow:'auto',
        boxShadow:'0 0 80px rgba(255,59,92,0.12)',animation:'scaleIn 0.25s ease',
      }}>
        {/* Header */}
        <div style={{ padding:'24px 28px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
          <div>
            <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'var(--red)',letterSpacing:'0.1em',marginBottom:6 }}>DMCA TAKEDOWN NOTICE</div>
            <div style={{ fontFamily:'Syne,sans-serif',fontSize:22,fontWeight:800,color:'#fff' }}>Generate Notice</div>
            <div style={{ fontSize:13,color:'var(--text2)',marginTop:4 }}>
              Platform: <span style={{color:'#fff'}}>{nodeData.platform}</span>
              <span style={{margin:'0 8px',color:'var(--text3)'}}>·</span>
              Score: <span style={{color:'var(--red)'}}>{nodeData.similarity}%</span>
            </div>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.06)',border:'none',borderRadius:8,padding:8,cursor:'pointer'}}>
            <X size={15} color="var(--text2)"/>
          </button>
        </div>

        <div style={{ padding:'24px 28px' }}>
          {!draft ? (
            <>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:13,color:'var(--text2)',marginBottom:14,lineHeight:1.6 }}>
                  Fill in your details to pre-fill the notice. Leave blank to use placeholders.
                </div>
                <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                  {input('Your name / rights holder name', name, setName)}
                  {input('Your email address', email, setEmail)}
                </div>
              </div>

              {/* Evidence summary */}
              <div style={{ background:'rgba(255,59,92,0.05)',border:'1px solid rgba(255,59,92,0.12)',borderRadius:12,padding:16,marginBottom:20 }}>
                <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'var(--red)',marginBottom:10,letterSpacing:'0.08em' }}>EVIDENCE ATTACHED</div>
                {[
                  ['Platform',nodeData.platform],
                  ['Transformation',nodeData.transformation],
                  ['Similarity',nodeData.similarity+'%'],
                  ['pHash',nodeData.scores?.phash+'%'],
                  ['ORB',nodeData.scores?.orb+'%'],
                  ['CLIP',nodeData.scores?.clip+'%'],
                ].map(([k,v])=>(
                  <div key={k} style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                    <span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--text3)' }}>{k}</span>
                    <span style={{ fontSize:12,color:'#fff',fontWeight:500 }}>{v}</span>
                  </div>
                ))}
              </div>

              <button onClick={handleGenerate} disabled={loading} style={{
                width:'100%',padding:14,
                background:loading?'rgba(255,107,26,0.5)':'var(--orange)',
                color:'#111',border:'none',borderRadius:12,fontSize:14,fontWeight:700,
                cursor:loading?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                fontFamily:'Outfit,sans-serif',boxShadow:'0 4px 20px var(--orange-glow)',
              }}>
                {loading ? <><Loader size={15} style={{animation:'spin 0.8s linear infinite'}}/>Drafting with AI...</> : <><Zap size={15}/>Generate DMCA Notice</>}
              </button>
            </>
          ) : (
            <>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16,padding:'10px 14px',background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.18)',borderRadius:8 }}>
                <CheckCircle size={14} color="var(--green)"/>
                <span style={{ fontSize:13,color:'var(--green)',fontWeight:500 }}>Notice generated successfully</span>
              </div>
              <div style={{
                background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',borderRadius:12,
                padding:18,fontFamily:'JetBrains Mono,monospace',fontSize:11,lineHeight:1.9,
                color:'var(--text2)',marginBottom:16,maxHeight:320,overflow:'auto',whiteSpace:'pre-wrap',
              }}>
                {draft.body}
              </div>
              <div style={{ display:'flex',gap:10 }}>
                <button onClick={handleCopy} style={{
                  flex:1,padding:12,background:copied?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.06)',
                  color:copied?'var(--green)':'var(--text)',border:`1px solid ${copied?'rgba(34,197,94,0.3)':'var(--border)'}`,
                  borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:7,fontFamily:'Outfit,sans-serif',
                }}>
                  {copied?<><CheckCircle size={13}/>Copied!</>:<><Copy size={13}/>Copy Notice</>}
                </button>
                <button style={{
                  flex:1,padding:12,background:'var(--red)',color:'#fff',border:'none',borderRadius:10,
                  fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7,
                  fontFamily:'Outfit,sans-serif',boxShadow:'0 4px 16px rgba(255,59,92,0.3)',
                }}>
                  <Zap size={13}/>Send Notice
                </button>
                <button style={{
                  padding:'12px 16px',background:'transparent',color:'var(--text2)',border:'1px solid var(--border)',borderRadius:10,fontSize:13,cursor:'pointer',fontFamily:'Outfit,sans-serif',
                  display:'flex',alignItems:'center',gap:6,
                }}>
                  <Download size={13}/>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
