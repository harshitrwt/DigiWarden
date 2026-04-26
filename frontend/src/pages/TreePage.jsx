import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { LayoutDashboard, Shield, AlertTriangle, GitBranch, FileText, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import NodeDetailPanel from '../components/NodeDetailPanel'
import DMCAModal from '../components/DMCAModal'
import { MOCK_TREE } from '../mock/fixtures'

const NC = {
  Original:   { fill:'#22C55E', stroke:'#16A34A', glow:'rgba(34,197,94,0.5)'  },
  Modified:   { fill:'#FF6B1A', stroke:'#E05A10', glow:'rgba(255,107,26,0.5)' },
  Infringing: { fill:'#FF3B5C', stroke:'#CC2E4A', glow:'rgba(255,59,92,0.5)'  },
}

export default function TreePage({ navigate }) {
  const svgRef = useRef()
  const gRef   = useRef()
  const [selected, setSelected] = useState(null)
  const [dmcaNode, setDmcaNode]= useState(null)
  const [built, setBuilt]      = useState(false)
  const zoomRef = useRef()

  useEffect(()=>{
    const el = svgRef.current.parentElement
    const W = el.clientWidth || 1000, H = 580
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width',W).attr('height',H)

    // Defs
    const defs = svg.append('defs')
    // Dot bg pattern
    defs.append('pattern').attr('id','dotgrid').attr('width',32).attr('height',32).attr('patternUnits','userSpaceOnUse')
      .append('circle').attr('cx',1).attr('cy',1).attr('r',1).attr('fill','rgba(255,107,26,0.08)')
    // Glow filters
    Object.entries(NC).forEach(([type,c])=>{
      const f = defs.append('filter').attr('id','glow-'+type).attr('x','-100%').attr('y','-100%').attr('width','300%').attr('height','300%')
      f.append('feGaussianBlur').attr('stdDeviation',5).attr('result','blur')
      const m = f.append('feMerge'); m.append('feMergeNode').attr('in','blur'); m.append('feMergeNode').attr('in','SourceGraphic')
      // Radial gradient per type
      const rg = defs.append('radialGradient').attr('id','grad-'+type)
      rg.append('stop').attr('offset','0%').attr('stop-color',c.fill).attr('stop-opacity',1)
      rg.append('stop').attr('offset','100%').attr('stop-color',c.stroke).attr('stop-opacity',0.85)
    })
    // Arrow marker
    defs.append('marker').attr('id','arrow').attr('viewBox','0 0 8 8').attr('refX',6).attr('refY',4)
      .attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto')
      .append('path').attr('d','M0,0 L0,8 L8,4 z').attr('fill','rgba(255,107,26,0.4)')

    // Background
    svg.append('rect').attr('width',W).attr('height',H).attr('fill','url(#dotgrid)')

    // Zoom
    const zoom = d3.zoom().scaleExtent([0.4,2.5]).on('zoom',e=>{ g.attr('transform',e.transform) })
    svg.call(zoom)
    zoomRef.current = { svg, zoom, W, H }

    const g = svg.append('g').attr('transform',`translate(80,${H/2})`)
    gRef.current = g

    const root = d3.hierarchy(MOCK_TREE)
    const tree = d3.tree().size([H-120,W-300])
    tree(root)

    // Links
    root.links().forEach((link,i)=>{
      const isInfring = link.target.data.type==='Infringing'
      const path = g.append('path')
        .attr('fill','none')
        .attr('stroke', isInfring?'rgba(255,59,92,0.25)':'rgba(255,107,26,0.2)')
        .attr('stroke-width', Math.max(1.5,(link.target.data.similarity/100)*4))
        .attr('stroke-dasharray',isInfring?'6,4':'none')
        .attr('marker-end','url(#arrow)')
        .attr('d', d3.linkHorizontal().x(d=>d.y).y(d=>d.x))
        .style('opacity',0)

      // Edge label (mutation type)
      const mid = { x:(link.source.x+link.target.x)/2, y:(link.source.y+link.target.y)/2 }
      const edgeLbl = g.append('text')
        .attr('x',mid.y).attr('y',mid.x-6)
        .attr('text-anchor','middle')
        .attr('font-family','JetBrains Mono,monospace').attr('font-size',9)
        .attr('fill','rgba(255,107,26,0.5)')
        .text(link.target.data.transformation.split(' ')[0])
        .style('opacity',0)

      setTimeout(()=>{
        path.transition().duration(500).style('opacity',1)
        edgeLbl.transition().duration(500).delay(200).style('opacity',1)
      }, i*280+100)
    })

    // Nodes
    root.descendants().forEach((node,i)=>{
      const c = NC[node.data.type]
      const nodeG = g.append('g')
        .attr('transform',`translate(${node.y},${node.x})`)
        .style('opacity',0).style('cursor','pointer')

      setTimeout(()=>{
        nodeG.transition().duration(200).style('opacity',1)

        // Outer pulse ring (infringing only)
        if (node.data.type==='Infringing') {
          nodeG.append('circle').attr('r',0).attr('fill','none').attr('stroke',c.fill).attr('stroke-width',1.5).attr('opacity',0.3)
            .transition().duration(700).ease(d3.easeBackOut).attr('r',32)
          // pulse anim via repeated transitions
          const pulse = (circ) => { circ.transition().duration(1200).attr('r',36).attr('opacity',0.1).transition().duration(1200).attr('r',28).attr('opacity',0.35).on('end',()=>pulse(circ)) }
          pulse(nodeG.select('circle'))
        }

        // Glow halo
        nodeG.append('circle').attr('r',0).attr('fill',c.fill).attr('opacity',0.1)
          .attr('filter',`url(#glow-${node.data.type})`)
          .transition().duration(600).ease(d3.easeBackOut)
          .attr('r', node.data.type==='Original'?30:node.data.type==='Infringing'?26:22)

        // Main circle
        const r = node.data.type==='Original'?18:node.data.type==='Infringing'?15:13
        nodeG.append('circle').attr('r',0)
          .attr('fill',`url(#grad-${node.data.type})`)
          .attr('stroke',c.fill).attr('stroke-width',2)
          .attr('filter',`url(#glow-${node.data.type})`)
          .transition().duration(600).ease(d3.easeBackOut).attr('r',r)

        // Similarity arc (non-root)
        if (node.depth>0) {
          const arcR=r+8
          nodeG.append('path')
            .attr('d',d3.arc().innerRadius(arcR).outerRadius(arcR+3).startAngle(-Math.PI/2).endAngle(-Math.PI/2+(node.data.similarity/100)*2*Math.PI))
            .attr('fill',c.fill).attr('opacity',0.45)
        }

        // Platform label (above)
        nodeG.append('text').attr('y',-(r+12)).attr('text-anchor','middle')
          .attr('font-family','Outfit,sans-serif').attr('font-size',12).attr('font-weight',600).attr('fill','#F0F0F0')
          .text(node.data.platform)

        // Score label (below)
        if (node.depth>0) {
          nodeG.append('text').attr('y',r+15).attr('text-anchor','middle')
            .attr('font-family','JetBrains Mono,monospace').attr('font-size',10).attr('fill',c.fill)
            .text(node.data.similarity+'%')
        }

        // Alert badge
        if (node.data.type==='Infringing') {
          nodeG.append('circle').attr('cx',14).attr('cy',-14).attr('r',8).attr('fill','#FF3B5C').attr('stroke','#111').attr('stroke-width',2)
          nodeG.append('text').attr('x',14).attr('y',-10).attr('text-anchor','middle').attr('font-size',9).attr('font-weight',700).attr('fill','#fff').text('!')
        }

        nodeG.on('click',e=>{ e.stopPropagation(); setSelected(node) })
        nodeG.on('mouseenter',function(){ d3.select(this).select('circle:nth-child(2)').transition().duration(120).attr('stroke-width',4) })
        nodeG.on('mouseleave',function(){ d3.select(this).select('circle:nth-child(2)').transition().duration(120).attr('stroke-width',2) })
      }, i*260+200)
    })

    svg.on('click',()=>setSelected(null))
    setTimeout(()=>setBuilt(true), root.descendants().length*260+700)
  },[])

  const zoomIn  = ()=>{ const {svg,zoom,W,H}=zoomRef.current; svg.transition().duration(300).call(zoom.scaleBy,1.3) }
  const zoomOut = ()=>{ const {svg,zoom}=zoomRef.current; svg.transition().duration(300).call(zoom.scaleBy,0.77) }
  const zoomFit = ()=>{ const {svg,zoom,W,H}=zoomRef.current; svg.transition().duration(400).call(zoom.transform,d3.zoomIdentity.translate(80,H/2)) }

  return (
    <div style={{ maxWidth:1280,margin:'0 auto',padding:'48px 28px' }}>
      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24,animation:'fadeUp 0.5s ease' }}>
        <div>
          <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'var(--orange)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:8 }}>◈ GET /api/tree/{'{id}'}</div>
          <h2 style={{ fontFamily:'Syne,sans-serif',fontSize:32,fontWeight:800,color:'#fff',letterSpacing:'-0.025em' }}>
            Propagation <span style={{color:'var(--orange)'}}>Tree</span>
          </h2>
          <p style={{ color:'var(--text2)',marginTop:6,fontSize:14 }}>Click any node to inspect · Red nodes are DMCA-eligible · Drag to pan · Scroll to zoom</p>
        </div>
        <div style={{ display:'flex',gap:10,alignItems:'center' }}>
          {[['Original','var(--green)'],['Modified','var(--orange)'],['Infringing','var(--red)']].map(([l,c])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:9,height:9,borderRadius:'50%',background:c,boxShadow:`0 0 7px ${c}`}}/>
              <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--text2)'}}>{l}</span>
            </div>
          ))}
          <div style={{width:1,height:18,background:'var(--border)',margin:'0 4px'}}/>
          {/* Zoom controls */}
          <div style={{ display:'flex',gap:4 }}>
            {[[ZoomIn,zoomIn],[ZoomOut,zoomOut],[Maximize2,zoomFit]].map(([Icon,fn],i)=>(
              <button key={i} onClick={fn} style={{ width:32,height:32,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,107,26,0.3)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
              >
                <Icon size={13} color="var(--text2)"/>
              </button>
            ))}
          </div>
          <button onClick={()=>navigate('dashboard')} style={{
            display:'flex',alignItems:'center',gap:7,padding:'9px 16px',
            background:'rgba(255,107,26,0.08)',border:'1px solid rgba(255,107,26,0.2)',
            borderRadius:10,fontSize:13,fontWeight:600,color:'var(--orange)',
            cursor:'pointer',fontFamily:'Outfit,sans-serif',
          }}>
            <LayoutDashboard size={13}/> Dashboard
          </button>
        </div>
      </div>

      {/* Tree container */}
      <div style={{
        background:'#141414',border:'1px solid rgba(255,107,26,0.1)',
        borderRadius:20,position:'relative',overflow:'hidden',
        minHeight:600,animation:'fadeUp 0.5s 0.1s ease both',
        boxShadow:'0 0 60px rgba(255,107,26,0.04)',
      }}>
        {!built && (
          <div style={{
            position:'absolute',top:18,left:'50%',transform:'translateX(-50%)',
            background:'rgba(255,107,26,0.08)',border:'1px solid rgba(255,107,26,0.2)',
            color:'var(--orange)',padding:'7px 18px',borderRadius:999,
            fontFamily:'JetBrains Mono,monospace',fontSize:12,
            display:'flex',alignItems:'center',gap:8,zIndex:5,
            animation:'pulse 1.5s ease infinite',
          }}>
            <div style={{width:7,height:7,borderRadius:'50%',background:'var(--orange)',animation:'pulse 1s ease infinite'}}/>
            Constructing genome tree...
          </div>
        )}
        <svg ref={svgRef} style={{display:'block',width:'100%',position:'relative',zIndex:1}}/>
        {selected && <NodeDetailPanel node={selected} onDMCA={setDmcaNode} onClose={()=>setSelected(null)}/>}
      </div>

      {/* Bottom stats */}
      {built && (
        <div style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,animation:'fadeUp 0.4s ease'}}>
          {[
            {label:'Total Nodes',   val:'7',      icon:GitBranch,   color:'var(--orange)'},
            {label:'Tree Depth',    val:'4 levels',icon:Shield,      color:'var(--orange)'},
            {label:'Infringing',    val:'2 nodes', icon:AlertTriangle,color:'var(--red)'},
            {label:'DMCA Ready',    val:'2 notices',icon:FileText,   color:'var(--red)'},
          ].map(s=>(
            <div key={s.label} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:14,padding:'16px 20px',display:'flex',gap:14,alignItems:'center'}}>
              <div style={{width:36,height:36,flexShrink:0,background:`${s.color==='var(--red)'?'rgba(255,59,92,0.1)':'rgba(255,107,26,0.1)'}`,border:`1px solid ${s.color==='var(--red)'?'rgba(255,59,92,0.2)':'rgba(255,107,26,0.2)'}`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <s.icon size={15} color={s.color}/>
              </div>
              <div>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800,color:'#fff'}}>{s.val}</div>
                <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--text3)'}}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {dmcaNode && <DMCAModal nodeData={dmcaNode} onClose={()=>setDmcaNode(null)}/>}
    </div>
  )
}
