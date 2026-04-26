import { useEffect, useRef } from 'react'

export default function SecurityBackground() {
  const canvasRef = useRef()
  const scrollRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let W, H, nodes = [], frameId, t = 0

    const resize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }

    const create = () => {
      nodes = []
      const count = Math.floor((W * H) / 22000)
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * W, baseX: 0,
          y: Math.random() * H, baseY: 0,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: 1.5 + Math.random() * 2.5,
          opacity: 0.06 + Math.random() * 0.18,
          type: ['shield','hex','ring','dot','lock'][Math.floor(Math.random()*5)],
          size: 5 + Math.random() * 12,
          phase: Math.random() * Math.PI * 2,
          spd: 0.003 + Math.random() * 0.004,
          pf: 0.03 + Math.random() * 0.07,
          col: Math.random() > 0.5 ? '#FF6B1A' : Math.random() > 0.5 ? '#FF8C47' : '#4A4A4A',
        })
        nodes[nodes.length-1].baseX = nodes[nodes.length-1].x
        nodes[nodes.length-1].baseY = nodes[nodes.length-1].y
      }
    }

    const draw = (ctx, type, x, y, sz, col, op) => {
      ctx.save(); ctx.globalAlpha = op; ctx.strokeStyle = col; ctx.lineWidth = 1
      if (type === 'shield') {
        ctx.beginPath()
        ctx.moveTo(x, y-sz); ctx.lineTo(x+sz*.7, y-sz*.4)
        ctx.lineTo(x+sz*.7, y+sz*.2)
        ctx.quadraticCurveTo(x, y+sz*.9, x, y+sz*.9)
        ctx.quadraticCurveTo(x-sz*.7, y+sz*.2, x-sz*.7, y+sz*.2)
        ctx.lineTo(x-sz*.7, y-sz*.4); ctx.closePath(); ctx.stroke()
      } else if (type === 'hex') {
        ctx.beginPath()
        for (let i=0;i<6;i++){const a=(i*Math.PI/3)-Math.PI/6;i===0?ctx.moveTo(x+sz*Math.cos(a),y+sz*Math.sin(a)):ctx.lineTo(x+sz*Math.cos(a),y+sz*Math.sin(a))}
        ctx.closePath(); ctx.stroke()
      } else if (type === 'ring') {
        ctx.beginPath(); ctx.arc(x,y,sz*.7,0,Math.PI*2); ctx.stroke()
        ctx.beginPath(); ctx.arc(x,y,sz*.3,0,Math.PI*2); ctx.stroke()
      } else if (type === 'lock') {
        ctx.strokeRect(x-sz*.45,y-sz*.1,sz*.9,sz*.7)
        ctx.beginPath(); ctx.arc(x,y-sz*.1,sz*.3,Math.PI,0); ctx.stroke()
      } else {
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x,y,sz*.2,0,Math.PI*2); ctx.fill()
      }
      ctx.restore()
    }

    const tick = () => {
      ctx.clearRect(0, 0, W, H)
      // subtle dot grid
      ctx.fillStyle = 'rgba(255,107,26,0.03)'
      for (let x=0;x<W;x+=48) for (let y=0;y<H;y+=48) { ctx.beginPath(); ctx.arc(x,y,1,0,Math.PI*2); ctx.fill() }

      // connections
      for (let i=0;i<nodes.length;i++) for (let j=i+1;j<nodes.length;j++) {
        const a=nodes[i],b=nodes[j], dx=a.x-b.x, dy=a.y-b.y, d=Math.sqrt(dx*dx+dy*dy)
        if (d<140) { ctx.beginPath(); ctx.strokeStyle=`rgba(255,107,26,${(1-d/140)*0.07})`; ctx.lineWidth=.5; ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke() }
      }

      // scanline
      const sy = ((t*.5) % (H*2)) - H*.3
      const sg = ctx.createLinearGradient(0,sy-50,0,sy+50)
      sg.addColorStop(0,'rgba(255,107,26,0)'); sg.addColorStop(.5,'rgba(255,107,26,0.025)'); sg.addColorStop(1,'rgba(255,107,26,0)')
      ctx.fillStyle=sg; ctx.fillRect(0,sy-50,W,100)

      nodes.forEach(n => {
        n.y = n.baseY + scrollRef.current*n.pf + Math.sin(t*n.spd+n.phase)*8
        n.x += n.vx
        if (n.x<-40) n.x=W+40; if (n.x>W+40) n.x=-40
        if (n.y>H+40) n.baseY=-40; if (n.y<-40) n.baseY=H+40
        draw(ctx, n.type, n.x, n.y, n.size, n.col, n.opacity)
      })

      t++; frameId = requestAnimationFrame(tick)
    }

    const onScroll = () => { scrollRef.current = window.scrollY }
    resize(); create(); tick()
    window.addEventListener('resize', () => { resize(); create() })
    window.addEventListener('scroll', onScroll)
    return () => { cancelAnimationFrame(frameId); window.removeEventListener('resize',resize); window.removeEventListener('scroll',onScroll) }
  }, [])

  return <canvas ref={canvasRef} style={{ position:'fixed',top:0,left:0,zIndex:0,pointerEvents:'none' }} />
}
