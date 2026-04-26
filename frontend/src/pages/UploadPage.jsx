import { useState, useRef, useCallback } from 'react'
import { Upload, Image, CheckCircle, Loader, ArrowRight, AlertCircle } from 'lucide-react'
import { useUploadAndAnalyze } from '../hooks/useApi'
import { PIPELINE_STEPS } from '../mock/fixtures'

export default function UploadPage({ navigate }) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()
  const { upload, step, loading, result, error } = useUploadAndAnalyze()

  const handleFile = f => {
    if (!f || !f.type.startsWith('image/')) return
    setFile(f); setPreview(URL.createObjectURL(f))
  }
  const onDrop = useCallback(e=>{ e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) },[])

  const handleUpload = () => upload(file)
  const toDashboard = () => navigate('dashboard', { ...result, preview })

  return (
    <div style={{ maxWidth:960, margin:'0 auto', padding:'60px 28px' }}>
      {/* Header */}
      <div style={{ textAlign:'center', marginBottom:52, animation:'fadeUp 0.5s ease' }}>
        <div style={{ display:'inline-flex',alignItems:'center',gap:7,padding:'5px 14px',borderRadius:999,background:'var(--orange-dim)',border:'1px solid var(--orange-border)',fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--orange)',letterSpacing:'0.08em',marginBottom:20 }}>
          POST /api/upload
        </div>
        <h2 style={{ fontFamily:'Syne,sans-serif',fontSize:40,fontWeight:800,color:'#fff',letterSpacing:'-0.03em',marginBottom:12 }}>
          Register Your Asset
        </h2>
        <p style={{ fontSize:16,color:'var(--text2)',maxWidth:460,margin:'0 auto',lineHeight:1.7 }}>
          Upload your original image to generate fingerprints and begin tracking across the internet.
        </p>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 320px',gap:24 }}>
        {/* Upload zone */}
        <div>
          <div
            onDragOver={e=>{e.preventDefault();setDragOver(true)}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={onDrop}
            onClick={()=>!file&&!loading&&fileRef.current.click()}
            style={{
              border:`2px dashed ${dragOver?'var(--orange)':file?'rgba(255,107,26,0.35)':'rgba(255,255,255,0.1)'}`,
              borderRadius:18,background:dragOver?'rgba(255,107,26,0.04)':'rgba(20,20,20,0.6)',
              backdropFilter:'blur(12px)',cursor:file||loading?'default':'pointer',
              transition:'all 0.25s',textAlign:'center',
              minHeight:file?360:240,display:'flex',alignItems:'center',justifyContent:'center',
              position:'relative',overflow:'hidden',
              boxShadow:dragOver?'0 0 40px rgba(255,107,26,0.1)':'none',
            }}
          >
            {/* Corner decorations */}
            {[['top:12px','left:12px','borderTop,borderLeft'],['top:12px','right:12px','borderTop,borderRight'],['bottom:12px','left:12px','borderBottom,borderLeft'],['bottom:12px','right:12px','borderBottom,borderRight']].map(([t,s,b],i)=>(
              <div key={i} style={{ position:'absolute',[t.split(':')[0]]:t.split(':')[1],[s.split(':')[0]]:s.split(':')[1],width:18,height:18,...Object.fromEntries(b.split(',').map(k=>[k,'2px solid rgba(255,107,26,0.3)'])) }}/>
            ))}

            {!file ? (
              <div>
                <div style={{ width:72,height:72,background:'rgba(255,107,26,0.08)',border:'1px solid rgba(255,107,26,0.2)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px' }}>
                  <Image size={28} color="var(--orange)" strokeWidth={1.5}/>
                </div>
                <div style={{ fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:700,color:'#fff',marginBottom:8 }}>Drop your image here</div>
                <div style={{ color:'var(--text2)',fontSize:14,marginBottom:22 }}>JPG · PNG · WebP · GIF — max 10MB</div>
                <button style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'11px 24px',background:'var(--orange)',color:'#111',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif',boxShadow:'0 0 20px var(--orange-glow)' }}>
                  <Upload size={14}/> Browse Files
                </button>
              </div>
            ) : (
              <div style={{ width:'100%',position:'relative' }}>
                <img src={preview} alt="preview" style={{ width:'100%',maxHeight:380,objectFit:'contain',borderRadius:16,display:'block' }}/>
                <div style={{ position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(transparent,rgba(17,17,17,0.95))',borderRadius:'0 0 16px 16px',padding:'40px 20px 18px',display:'flex',justifyContent:'space-between',alignItems:'flex-end' }}>
                  <div>
                    <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'var(--orange)',marginBottom:4,letterSpacing:'0.1em' }}>ASSET LOADED</div>
                    <div style={{ color:'#fff',fontSize:14,fontWeight:600 }}>{file.name}</div>
                    <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--text3)' }}>{(file.size/1024).toFixed(0)} KB · {file.type.split('/')[1].toUpperCase()}</div>
                  </div>
                  {!loading&&!result&&(
                    <button onClick={e=>{e.stopPropagation();setFile(null);setPreview(null)}} style={{ background:'rgba(255,255,255,0.08)',border:'none',color:'var(--text2)',padding:'6px 14px',borderRadius:8,cursor:'pointer',fontSize:12 }}>Change</button>
                  )}
                </div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])}/>

          {/* Error */}
          {error && (
            <div style={{ marginTop:12,padding:'12px 16px',background:'rgba(255,59,92,0.08)',border:'1px solid rgba(255,59,92,0.2)',borderRadius:10,display:'flex',gap:8,alignItems:'center' }}>
              <AlertCircle size={14} color="var(--red)"/>
              <span style={{ fontSize:13,color:'var(--red)' }}>{error}</span>
            </div>
          )}

          {/* Analyze button */}
          {file && !loading && !result && (
            <button onClick={handleUpload} style={{
              marginTop:14,width:'100%',padding:16,
              background:'linear-gradient(135deg,var(--orange),#FF9040)',
              color:'#111',border:'none',borderRadius:14,fontSize:16,fontWeight:700,
              cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,
              fontFamily:'Syne,sans-serif',letterSpacing:'-0.01em',
              boxShadow:'0 4px 28px var(--orange-glow)',animation:'fadeUp 0.3s ease',
            }}>
              <Upload size={17}/> Analyze Image <ArrowRight size={16}/>
            </button>
          )}

          {/* View results */}
          {result && (
            <button onClick={toDashboard} style={{
              marginTop:14,width:'100%',padding:16,
              background:'var(--orange)',color:'#111',border:'none',borderRadius:14,fontSize:16,fontWeight:700,
              cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,
              fontFamily:'Syne,sans-serif',boxShadow:'0 4px 28px var(--orange-glow)',animation:'scaleIn 0.35s ease',
            }}>
              <CheckCircle size={17}/> View Results Dashboard <ArrowRight size={16}/>
            </button>
          )}
        </div>

        {/* Pipeline panel */}
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div style={{ background:'rgba(20,20,20,0.8)',backdropFilter:'blur(16px)',border:'1px solid var(--border)',borderRadius:18,padding:24,animation:'slideLeft 0.5s 0.1s ease both' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'var(--text3)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:20 }}>
              Analysis Pipeline
            </div>
            {PIPELINE_STEPS.map((ps,i)=>{
              const isActive = loading && step===i
              const isDone   = result || (loading && step>i)
              return (
                <div key={i} style={{ display:'flex',gap:13,alignItems:'flex-start',paddingBottom:i<PIPELINE_STEPS.length-1?18:0 }}>
                  <div style={{ display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0 }}>
                    <div style={{
                      width:32,height:32,borderRadius:'50%',flexShrink:0,
                      border:`2px solid ${isDone?'var(--green)':isActive?'var(--orange)':'rgba(255,255,255,0.08)'}`,
                      background:isDone?'rgba(34,197,94,0.1)':isActive?'rgba(255,107,26,0.1)':'transparent',
                      display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.3s',
                      boxShadow:isDone?'0 0 10px rgba(34,197,94,0.3)':isActive?'0 0 10px rgba(255,107,26,0.35)':'none',
                    }}>
                      {isDone?<CheckCircle size={13} color="var(--green)"/>
                      :isActive?<Loader size={13} color="var(--orange)" style={{animation:'spin 0.8s linear infinite'}}/>
                      :<div style={{width:6,height:6,borderRadius:'50%',background:'var(--text3)'}}/>}
                    </div>
                    {i<PIPELINE_STEPS.length-1&&<div style={{width:1.5,height:22,background:isDone?'var(--green)':'rgba(255,255,255,0.06)',marginTop:4,transition:'background 0.3s'}}/>}
                  </div>
                  <div style={{paddingTop:5}}>
                    <div style={{fontSize:13,fontWeight:isDone||isActive?600:400,color:isDone?'var(--green)':isActive?'var(--orange)':'var(--text2)',transition:'color 0.3s'}}>{ps.label}</div>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--text3)',marginTop:1}}>{ps.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* API info */}
          <div style={{ background:'rgba(20,20,20,0.8)',border:'1px solid var(--border)',borderRadius:14,padding:18,animation:'slideLeft 0.5s 0.2s ease both' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'var(--text3)',letterSpacing:'0.1em',marginBottom:12 }}>ENDPOINTS CALLED</div>
            {[
              ['POST','/api/upload','Upload image'],
              ['GET', '/api/analyze/{id}/result','Get scores'],
              ['GET', '/api/tree/{id}','Build tree'],
            ].map(([m,p,d])=>(
              <div key={p} style={{marginBottom:9}}>
                <div style={{display:'flex',gap:7,alignItems:'center'}}>
                  <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:10,padding:'2px 7px',borderRadius:4,background:m==='POST'?'rgba(255,107,26,0.15)':'rgba(59,130,246,0.15)',color:m==='POST'?'var(--orange)':'var(--blue)',fontWeight:600}}>{m}</span>
                  <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--text)'}}>{p}</span>
                </div>
                <div style={{fontSize:11,color:'var(--text3)',marginTop:2,marginLeft:47}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
