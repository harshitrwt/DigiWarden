export function Skeleton({ w='100%', h=16, br=6, style={} }) {
  return <div className="skeleton" style={{ width:w, height:h, borderRadius:br, flexShrink:0, ...style }} />
}

export function SkeletonDashboard() {
  return (
    <div style={{ maxWidth:1280,margin:'0 auto',padding:'48px 28px' }}>
      <div style={{ display:'grid',gridTemplateColumns:'260px 1fr',gap:20,marginBottom:20 }}>
        <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:16,padding:28,display:'flex',flexDirection:'column',alignItems:'center',gap:16 }}>
          <Skeleton w={100} h={10} />
          <Skeleton w={120} h={120} br="50%" />
          <Skeleton w="80%" h={12} />
          <Skeleton w="60%" h={10} />
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14 }}>
          {[...Array(6)].map((_,i)=>(
            <div key={i} style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:14,padding:20,display:'flex',flexDirection:'column',gap:12 }}>
              <Skeleton w={36} h={36} br={8}/>
              <Skeleton w="50%" h={24}/>
              <Skeleton w="80%" h={10}/>
              <Skeleton w="60%" h={10}/>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden' }}>
        <div style={{ padding:'20px 24px',borderBottom:'1px solid var(--border2)',display:'flex',gap:12 }}>
          <Skeleton w={140} h={16}/><Skeleton w={240} h={10}/>
        </div>
        {[...Array(5)].map((_,i)=>(
          <div key={i} style={{ padding:'14px 24px',borderBottom:'1px solid var(--border2)',display:'flex',gap:20,alignItems:'center' }}>
            <Skeleton w={80} h={22} br={999}/><Skeleton w={120} h={14}/><Skeleton w={160} h={12}/><Skeleton w={100} h={8}/>
          </div>
        ))}
      </div>
    </div>
  )
}
