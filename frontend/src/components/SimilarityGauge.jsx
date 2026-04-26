import { useEffect, useState } from 'react'

export default function SimilarityGauge({ score, size=140, label='Similarity Score' }) {
  const [display, setDisplay] = useState(0)
  useEffect(()=>{
    let s=0
    const t=setInterval(()=>{ s+=2; setDisplay(Math.min(s,score)); if(s>=score)clearInterval(t) },18)
    return ()=>clearInterval(t)
  },[score])

  const r = size/2 - 12
  const c = 2*Math.PI*r
  const filled = (display/100)*c
  const color = display>75?'#22C55E':display>50?'#FF6B1A':display>30?'#F59E0B':'#FF3B5C'

  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:10 }}>
      <div style={{ position:'relative',width:size,height:size }}>
        <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
            strokeDasharray={c} strokeDashoffset={c-filled} strokeLinecap="round"
            style={{transition:'stroke-dashoffset 0.04s linear',filter:`drop-shadow(0 0 8px ${color}88)`}}/>
        </svg>
        <div style={{
          position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'
        }}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:size>120?30:22,fontWeight:800,color,lineHeight:1}}>{display}</div>
          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:9,color:'var(--text3)',letterSpacing:'0.06em'}}>/100</div>
        </div>
      </div>
      <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--text2)',letterSpacing:'0.08em',textTransform:'uppercase'}}>{label}</div>
    </div>
  )
}
