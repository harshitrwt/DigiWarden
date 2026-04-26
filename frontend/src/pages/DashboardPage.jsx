import { useState } from 'react'
import { Shield, AlertTriangle, Eye, Globe, Clock, Fingerprint, GitBranch, FileText, TrendingUp, ChevronRight, ExternalLink } from 'lucide-react'
import SimilarityGauge from '../components/SimilarityGauge'
import DMCAModal from '../components/DMCAModal'
import { MOCK_ANALYSIS, MOCK_TREE } from '../mock/fixtures'

const getNodes = (node, arr=[]) => { arr.push(node); node.children?.forEach(c=>getNodes(c,arr)); return arr }

export default function DashboardPage({ assetData, navigate }) {
  const [dmcaNode, setDmcaNode] = useState(null)
  const data = assetData?.id ? assetData : MOCK_ANALYSIS
  const allNodes = getNodes(MOCK_TREE).filter(n=>n.id!=='n0')

  const TypeBadge = ({ type, label }) => {
    const c = type==='Original'?'var(--green)':type==='Infringing'?'var(--red)':'var(--orange)'
    const bg = type==='Original'?'rgba(34,197,94,0.1)':type==='Infringing'?'rgba(255,59,92,0.1)':'rgba(255,107,26,0.1)'
    return (
      <span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:999,background:bg,border:`1px solid ${c}25`,fontFamily:'JetBrains Mono,monospace',fontSize:10,fontWeight:600,letterSpacing:'0.05em',color:c }}>
        <div style={{ width:5,height:5,borderRadius:'50%',background:c,boxShadow:`0 0 5px ${c}` }}/>{label}
      </span>
    )
  }

  return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'48px 28px' }}>
      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:36,animation:'fadeUp 0.5s ease' }}>
        <div>
          <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'var(--orange)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:8 }}>
            ◈ GET /api/analyze/{data.id}/result
          </div>
          <h2 style={{ fontFamily:'Syne,sans-serif',fontSize:34,fontWeight:800,color:'#fff',letterSpacing:'-0.025em',marginBottom:10 }}>
            Results <span style={{color:'var(--orange)'}}>Dashboard</span>
          </h2>
          <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
            {['pHash: a4f2e8c1d9b372fa','ORB: 847 keypoints','CLIP: 512-dim','Score fusion: 0.25+0.35+0.40'].map(t=>(
              <span key={t} style={{ fontFamily:'JetBrains Mono,monospace',fontSize:11,padding:'3px 10px',borderRadius:999,background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',color:'var(--text2)' }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={()=>navigate('tree')} style={{
            display:'flex',alignItems:'center',gap:8,padding:'11px 22px',
            background:'var(--orange)',color:'#111',border:'none',borderRadius:10,
            fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif',
            boxShadow:'0 0 22px var(--orange-glow)',
          }}>
            <GitBranch size={14}/> View Propagation Tree
          </button>
        </div>
      </div>

      {/* Score + Stats row */}
      <div style={{ display:'grid',gridTemplateColumns:'240px 1fr',gap:18,marginBottom:18 }}>
        {/* Integrity card */}
        <div style={{
          background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:18,
          padding:28,display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',
          animation:'fadeUp 0.5s 0.05s ease both',
          boxShadow:'0 0 40px rgba(255,107,26,0.04)',
        }}>
          <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'var(--text3)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:18 }}>Content Integrity</div>
          <SimilarityGauge score={data.integrityScore||62} size={130} label="Integrity Score"/>
          <div style={{ marginTop:16,fontSize:13,color:'var(--text2)',lineHeight:1.6 }}>
            <span style={{color:'var(--red)',fontWeight:600}}>At Risk</span> — 2 infringing nodes
          </div>
          <div style={{ marginTop:14,width:'100%',background:'rgba(255,59,92,0.07)',border:'1px solid rgba(255,59,92,0.18)',borderRadius:8,padding:'10px 12px' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--red)',display:'flex',alignItems:'center',gap:5,justifyContent:'center' }}>
              <AlertTriangle size={11}/> 2 DMCA Notices Ready
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14 }}>
          {[
            { icon:Eye,          val:'7',    label:'Copies Detected',    sub:'5 platforms',     color:'var(--text)',  delay:0.1 },
            { icon:AlertTriangle,val:'2',    label:'Likely Infringing',  sub:'DMCA ready',      color:'var(--red)',   delay:0.13 },
            { icon:TrendingUp,   val:'4',    label:'Modified Reshares',  sub:'No license',      color:'var(--orange)',delay:0.16 },
            { icon:Globe,        val:'5',    label:'Platforms',          sub:'Twitter +4',      color:'var(--text)',  delay:0.19 },
            { icon:Clock,        val:'24h',  label:'Tracking Period',    sub:'Since upload',    color:'var(--text)',  delay:0.22 },
            { icon:Shield,       val:'62',   label:'Integrity Index',    sub:'Needs attention', color:'var(--orange)',delay:0.25 },
          ].map(s=>(
            <div key={s.label} style={{
              background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:14,
              padding:'20px 20px',animation:`fadeUp 0.5s ${s.delay}s ease both`,
              transition:'all 0.2s',
            }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,107,26,0.2)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
            >
              <div style={{ width:36,height:36,background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14 }}>
                <s.icon size={15} color={s.color==='var(--text)'?'var(--text2)':s.color}/>
              </div>
              <div style={{ fontFamily:'Syne,sans-serif',fontSize:26,fontWeight:800,color:s.color,lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:13,color:'var(--text2)',marginTop:4 }}>{s.label}</div>
              <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--text3)',marginTop:5 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Fingerprint scores */}
      <div style={{
        background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:18,
        padding:'22px 26px',marginBottom:18,animation:'fadeUp 0.5s 0.28s ease both',
        display:'grid',gridTemplateColumns:'auto 1fr 1fr 1fr 1px 1fr',gap:20,alignItems:'center',
      }}>
        <div>
          <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'var(--text3)',letterSpacing:'0.1em',marginBottom:6,textTransform:'uppercase' }}>Score Fusion</div>
          <div style={{ fontFamily:'Syne,sans-serif',fontSize:22,fontWeight:800,color:'var(--orange)' }}>{data.scores?.combined||86}%</div>
        </div>
        {[
          { k:'pHash',  v:data.scores?.phash||78,  col:'#3B82F6', desc:'Global' },
          { k:'ORB',    v:data.scores?.orb||83,    col:'#8B5CF6', desc:'Structural' },
          { k:'CLIP',   v:data.scores?.clip||91,   col:'#EC4899', desc:'Semantic' },
        ].map(s=>(
          <div key={s.k}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
              <span style={{ fontSize:13,fontWeight:600,color:s.col }}>{s.k}</span>
              <span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'var(--text2)' }}>{s.v}%</span>
            </div>
            <div style={{ height:6,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden',marginBottom:4 }}>
              <div style={{ height:'100%',borderRadius:3,width:s.v+'%',background:s.col,boxShadow:`0 0 8px ${s.col}66`,transition:'width 1s ease' }}/>
            </div>
            <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'var(--text3)' }}>{s.desc}</div>
          </div>
        ))}
        <div style={{ width:1,height:'100%',background:'var(--border)' }}/>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'var(--text3)',marginBottom:4 }}>Fusion weight</div>
          <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--text2)',lineHeight:1.9 }}>pHash · 25%<br/>ORB · 35%<br/>CLIP · 40%</div>
        </div>
      </div>

      {/* Detected mutations table */}
      <div style={{
        background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:18,
        overflow:'hidden',animation:'fadeUp 0.5s 0.33s ease both',
      }}>
        <div style={{ padding:'18px 24px',borderBottom:'1px solid var(--border2)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif',fontSize:17,fontWeight:700,color:'#fff' }}>Detected Mutations</div>
            <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--text3)',marginTop:2 }}>All matches sorted by discovery time</div>
          </div>
          <button onClick={()=>navigate('tree')} style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',border:'1px solid var(--border)',borderRadius:8,background:'transparent',color:'var(--text2)',fontSize:13,cursor:'pointer',fontFamily:'Outfit,sans-serif' }}>
            Tree View <ChevronRight size={13}/>
          </button>
        </div>

        {/* Table head */}
        <div style={{ display:'grid',gridTemplateColumns:'150px 160px 1fr 140px 90px 120px',padding:'10px 24px',background:'rgba(0,0,0,0.2)' }}>
          {['Status','Platform','Transformation','Similarity','Time','Action'].map(h=>(
            <div key={h} style={{ fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'var(--text3)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{h}</div>
          ))}
        </div>

        {allNodes.map((m,i)=>(
          <div key={m.id} style={{
            display:'grid',gridTemplateColumns:'150px 160px 1fr 140px 90px 120px',
            padding:'13px 24px',
            borderBottom:i<allNodes.length-1?'1px solid var(--border2)':'none',
            alignItems:'center',transition:'background 0.15s',
            animation:`fadeUp 0.4s ${0.05*i}s ease both`,
          }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,107,26,0.02)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          >
            <div><TypeBadge type={m.type} label={m.label}/></div>
            <div style={{ fontSize:14,color:'#fff',fontWeight:500 }}>{m.platform}</div>
            <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'var(--text2)' }}>{m.transformation}</div>
            <div>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <div style={{ flex:1,height:4,background:'rgba(255,255,255,0.06)',borderRadius:2,overflow:'hidden' }}>
                  <div style={{ height:'100%',borderRadius:2,width:m.similarity+'%',background:m.similarity>75?'var(--green)':m.similarity>55?'var(--orange)':'var(--red)',transition:'width 1s ease' }}/>
                </div>
                <span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'var(--text2)',minWidth:34 }}>{m.similarity}%</span>
              </div>
            </div>
            <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--text3)' }}>{m.time}</div>
            <div>
              {m.type==='Infringing'&&(
                <button onClick={()=>setDmcaNode(m)} style={{
                  display:'flex',alignItems:'center',gap:5,padding:'6px 11px',
                  background:'rgba(255,59,92,0.1)',color:'var(--red)',
                  border:'1px solid rgba(255,59,92,0.22)',borderRadius:8,
                  fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Outfit,sans-serif',
                }}>
                  <FileText size={11}/> DMCA
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {dmcaNode && <DMCAModal nodeData={dmcaNode} onClose={()=>setDmcaNode(null)}/>}
    </div>
  )
}
