import { X, FileText, ExternalLink, Info } from 'lucide-react'

const TYPE_COLORS = {
  Original:   { fill:'#22C55E', bg:'rgba(34,197,94,0.1)',   border:'rgba(34,197,94,0.2)' },
  Modified:   { fill:'#FF6B1A', bg:'rgba(255,107,26,0.1)', border:'rgba(255,107,26,0.2)' },
  Infringing: { fill:'#FF3B5C', bg:'rgba(255,59,92,0.1)',  border:'rgba(255,59,92,0.2)' },
}

export default function NodeDetailPanel({ node, onDMCA, onClose }) {
  if (!node) return null
  const c = TYPE_COLORS[node.data?.type || 'Modified']
  const d = node.data

  return (
    <div style={{
      position:'absolute',top:16,right:16,width:290,
      background:'rgba(20,20,20,0.97)',backdropFilter:'blur(20px)',
      border:`1px solid ${c.border}`,borderRadius:16,
      boxShadow:'0 20px 60px rgba(0,0,0,0.6)',overflow:'hidden',
      animation:'slideLeft 0.25s ease forwards',zIndex:20,
    }}>
      {/* Header */}
      <div style={{ background:c.bg, borderBottom:`1px solid ${c.border}`, padding:'16px 18px', position:'relative' }}>
        <button onClick={onClose} style={{ position:'absolute',top:10,right:10,background:'rgba(255,255,255,0.07)',border:'none',borderRadius:6,padding:5,cursor:'pointer' }}>
          <X size={12} color="var(--text2)"/>
        </button>
        <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:10,color:c.fill,letterSpacing:'0.1em',marginBottom:4 }}>{d.label}</div>
        <div style={{ fontFamily:'Syne,sans-serif',fontSize:17,fontWeight:700,color:'#fff' }}>{d.platform}</div>
        <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--text3)',marginTop:3 }}>{d.time}</div>
      </div>

      {/* Scores */}
      <div style={{ padding:'14px 18px',borderBottom:'1px solid var(--border2)' }}>
        <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'var(--text3)',marginBottom:10,letterSpacing:'0.08em' }}>SCORE BREAKDOWN</div>
        {[['pHash',d.scores?.phash,'#3B82F6'],['ORB',d.scores?.orb,'#8B5CF6'],['CLIP',d.scores?.clip,'#EC4899'],['Combined',d.scores?.combined,c.fill]].map(([k,v,col])=>(
          <div key={k} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:7 }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--text2)',minWidth:60 }}>{k}</div>
            <div style={{ flex:1,height:5,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden' }}>
              <div style={{ height:'100%',borderRadius:3,width:(v||0)+'%',background:col,transition:'width 0.8s ease' }}/>
            </div>
            <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:11,color:col,minWidth:32,textAlign:'right' }}>{v}%</div>
          </div>
        ))}
      </div>

      {/* Transformation */}
      <div style={{ padding:'12px 18px',borderBottom:'1px solid var(--border2)' }}>
        <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'var(--text3)',marginBottom:6,letterSpacing:'0.08em' }}>TRANSFORMATION</div>
        <div style={{ fontSize:13,color:'#fff',fontWeight:500 }}>{d.transformation}</div>
      </div>

      {/* Explanation */}
      {d.explanation && (
        <div style={{ padding:'12px 18px',borderBottom:'1px solid var(--border2)' }}>
          <div style={{ display:'flex',gap:6,marginBottom:6 }}>
            <Info size={11} color="var(--orange)"/>
            <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'var(--text3)',letterSpacing:'0.08em' }}>LLM EXPLANATION</div>
          </div>
          <div style={{ fontSize:12,color:'var(--text2)',lineHeight:1.7 }}>{d.explanation}</div>
        </div>
      )}

      {/* Actions */}
      <div style={{ padding:'14px 18px',display:'flex',flexDirection:'column',gap:8 }}>
        {d.type==='Infringing' && (
          <button onClick={()=>onDMCA(d)} style={{
            width:'100%',padding:11,background:'var(--red)',color:'#fff',border:'none',borderRadius:10,
            fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7,
            fontFamily:'Outfit,sans-serif',boxShadow:'0 4px 16px rgba(255,59,92,0.3)',
          }}>
            <FileText size={13}/> Generate DMCA Notice
          </button>
        )}
        <button style={{
          width:'100%',padding:9,background:'rgba(255,255,255,0.05)',color:'var(--text2)',
          border:'1px solid var(--border)',borderRadius:10,fontSize:13,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:'Outfit,sans-serif',
        }}>
          <ExternalLink size={12}/> View Source
        </button>
      </div>
    </div>
  )
}
