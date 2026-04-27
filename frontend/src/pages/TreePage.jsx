import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { AlertTriangle, FileText, GitBranch, LayoutDashboard, Maximize2, Shield, ZoomIn, ZoomOut } from 'lucide-react'
import NodeDetailPanel from '../components/NodeDetailPanel'
import DMCAModal from '../components/DMCAModal'
import { fetchNodeExplanation, formatRelativeTime, getDisplayLabel } from '../hooks/useApi'

const NODE_COLORS = {
  Original: { fill: '#22C55E', stroke: '#16A34A', glow: 'rgba(34,197,94,0.5)' },
  Modified: { fill: '#FF6B1A', stroke: '#E05A10', glow: 'rgba(255,107,26,0.5)' },
  Infringing: { fill: '#FF3B5C', stroke: '#CC2E4A', glow: 'rgba(255,59,92,0.5)' },
  Unmatched: { fill: '#999999', stroke: '#777777', glow: 'rgba(153,153,153,0.35)' },
}

function score(value) {
  return Math.round(Number(value) || 0)
}

function shortLabel(value, maxLength = 18) {
  if (!value) {
    return 'Unknown'
  }
  if (value.length <= maxLength) {
    return value
  }
  return `${value.slice(0, maxLength - 3)}...`
}

function buildHierarchy(treeData) {
  if (!treeData?.nodes?.length) {
    return null
  }

  const parentById = new Map(treeData.edges.map((edge) => [edge.target, edge.source]))
  return d3
    .stratify()
    .id((node) => node.id)
    .parentId((node) => parentById.get(node.id) || null)(treeData.nodes)
}

function mapTreeNode(node) {
  const type = getDisplayLabel(node.authenticity_label)
  return {
    ...node,
    type,
    displayName: node.id === 'node-0' ? 'Original asset' : node.filename || node.image_id,
    sourceLabel:
      node.source_kind === 'demo'
        ? 'Demo variant'
        : node.source_kind === 'user_upload'
          ? 'Uploaded variant'
          : 'Registered upload',
    transformation: node.mutation_type || 'Unknown',
    similarity: score(node.similarity_score),
    time: node.id === 'node-0' ? 'Registered asset' : formatRelativeTime(node.created_at),
    scores: {
      phash: node.breakdown?.phash_score ?? 0,
      orb: node.breakdown?.orb_score ?? 0,
      clip: node.breakdown?.semantic_score ?? 0,
      combined: node.similarity_score ?? 0,
    },
  }
}

export default function TreePage({ workflow, navigate }) {
  const svgRef = useRef(null)
  const zoomRef = useRef(null)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [dmcaNode, setDmcaNode] = useState(null)
  const [explanations, setExplanations] = useState({})
  const [loadingExplanationId, setLoadingExplanationId] = useState(null)
  const [explanationErrors, setExplanationErrors] = useState({})

  const imageId = workflow?.analysis?.image_id
  const treeData = workflow?.tree

  const hierarchy = useMemo(() => buildHierarchy(treeData), [treeData])
  const nodes = useMemo(() => (treeData?.nodes || []).map(mapTreeNode), [treeData])
  const nodesById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])
  const selectedNode = selectedNodeId ? nodesById.get(selectedNodeId) : null

  useEffect(() => {
    if (!selectedNodeId || !imageId) {
      return
    }

    // Use 'in' operator instead of truthiness check — an empty-string explanation
    // is a valid cached result and must not trigger a re-fetch.
    if (selectedNodeId in explanations || loadingExplanationId === selectedNodeId || explanationErrors[selectedNodeId]) {
      return
    }

    let cancelled = false
    setLoadingExplanationId(selectedNodeId)
    fetchNodeExplanation(imageId, selectedNodeId)
      .then((explanation) => {
        if (!cancelled) {
          // Store the result even if it's an empty string so we don't re-fetch.
          setExplanations((current) => ({ ...current, [selectedNodeId]: explanation || 'No explanation available.' }))
          setExplanationErrors((current) => {
            const next = { ...current }
            delete next[selectedNodeId]
            return next
          })
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setExplanationErrors((current) => ({
            ...current,
            [selectedNodeId]: error instanceof Error ? error.message : 'Unable to load a node explanation.',
          }))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingExplanationId(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedNodeId, imageId, explanations, loadingExplanationId, explanationErrors])

  useEffect(() => {
    if (!hierarchy || !svgRef.current) {
      return
    }

    const container = svgRef.current.parentElement
    const width = container?.clientWidth || 1000
    const height = Math.max(580, hierarchy.descendants().length * 90)
    const root = hierarchy.copy()
    const layout = d3.tree().size([height - 120, Math.max(320, width - 260)])
    layout(root)

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').interrupt()
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)

    const defs = svg.append('defs')
    defs
      .append('pattern')
      .attr('id', 'dotgrid')
      .attr('width', 32)
      .attr('height', 32)
      .attr('patternUnits', 'userSpaceOnUse')
      .append('circle')
      .attr('cx', 1)
      .attr('cy', 1)
      .attr('r', 1)
      .attr('fill', 'rgba(255,107,26,0.08)')

    Object.entries(NODE_COLORS).forEach(([type, colors]) => {
      const filter = defs.append('filter').attr('id', `glow-${type}`).attr('x', '-100%').attr('y', '-100%').attr('width', '300%').attr('height', '300%')
      filter.append('feGaussianBlur').attr('stdDeviation', 5).attr('result', 'blur')
      const merge = filter.append('feMerge')
      merge.append('feMergeNode').attr('in', 'blur')
      merge.append('feMergeNode').attr('in', 'SourceGraphic')

      const gradient = defs.append('radialGradient').attr('id', `grad-${type}`)
      gradient.append('stop').attr('offset', '0%').attr('stop-color', colors.fill).attr('stop-opacity', 1)
      gradient.append('stop').attr('offset', '100%').attr('stop-color', colors.stroke).attr('stop-opacity', 0.85)
    })

    defs
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 0 8 8')
      .attr('refX', 6)
      .attr('refY', 4)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L0,8 L8,4 z')
      .attr('fill', 'rgba(255,107,26,0.35)')

    svg.append('rect').attr('width', width).attr('height', height).attr('fill', 'url(#dotgrid)')

    const content = svg.append('g')
    const initialTransform = d3.zoomIdentity.translate(80, 60)
    const zoom = d3.zoom().scaleExtent([0.4, 2.5]).on('zoom', (event) => content.attr('transform', event.transform))
    svg.call(zoom)
    svg.call(zoom.transform, initialTransform)
    zoomRef.current = { svg, zoom, initialTransform }

    content
      .selectAll('path.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', (link) => {
        const type = getDisplayLabel(link.target.data.authenticity_label)
        return type === 'Infringing' ? 'rgba(255,59,92,0.28)' : 'rgba(255,107,26,0.22)'
      })
      .attr('stroke-width', (link) => Math.max(1.5, score(link.target.data.similarity_score) / 28))
      .attr('stroke-dasharray', (link) => (getDisplayLabel(link.target.data.authenticity_label) === 'Infringing' ? '6,4' : 'none'))
      .attr('marker-end', 'url(#arrow)')
      .attr(
        'd',
        d3
          .linkHorizontal()
          .x((point) => point.y)
          .y((point) => point.x),
      )

    const nodeGroups = content
      .selectAll('g.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('transform', (node) => `translate(${node.y},${node.x})`)
      .style('cursor', 'pointer')
      .on('click', (event, node) => {
        event.stopPropagation()
        setSelectedNodeId(node.data.id)
      })

    nodeGroups.each(function drawNode(node) {
      const type = getDisplayLabel(node.data.authenticity_label)
      const colors = NODE_COLORS[type] || NODE_COLORS.Modified
      const group = d3.select(this)
      const radius = type === 'Original' ? 18 : type === 'Infringing' ? 15 : 13

      group
        .append('circle')
        .attr('r', type === 'Original' ? 28 : 22)
        .attr('fill', colors.fill)
        .attr('opacity', 0.12)
        .attr('filter', `url(#glow-${type})`)

      group
        .append('circle')
        .attr('r', radius)
        .attr('fill', `url(#grad-${type})`)
        .attr('stroke', colors.fill)
        .attr('stroke-width', 2)
        .attr('filter', `url(#glow-${type})`)

      if (node.depth > 0) {
        const arcRadius = radius + 8
        group
          .append('path')
          .attr(
            'd',
            d3
              .arc()
              .innerRadius(arcRadius)
              .outerRadius(arcRadius + 3)
              .startAngle(-Math.PI / 2)
              .endAngle(-Math.PI / 2 + (score(node.data.similarity_score) / 100) * 2 * Math.PI),
          )
          .attr('fill', colors.fill)
          .attr('opacity', 0.45)
      }

      group
        .append('text')
        .attr('y', -(radius + 14))
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Outfit, sans-serif')
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .attr('fill', '#F0F0F0')
        .text(node.data.id === 'node-0' ? 'Original' : shortLabel(node.data.filename || node.data.image_id))

      group
        .append('text')
        .attr('y', radius + 15)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-size', 10)
        .attr('fill', colors.fill)
        .text(node.depth === 0 ? '100%' : `${score(node.data.similarity_score)}%`)

      if (type === 'Infringing') {
        group.append('circle').attr('cx', 14).attr('cy', -14).attr('r', 8).attr('fill', '#FF3B5C').attr('stroke', '#111').attr('stroke-width', 2)
        group.append('text').attr('x', 14).attr('y', -10).attr('text-anchor', 'middle').attr('font-size', 9).attr('font-weight', 700).attr('fill', '#fff').text('!')
      }
    })

    svg.on('click', () => setSelectedNodeId(null))
  }, [hierarchy])

  const zoomIn = () => {
    if (!zoomRef.current) {
      return
    }
    zoomRef.current.svg.transition().duration(250).call(zoomRef.current.zoom.scaleBy, 1.25)
  }

  const zoomOut = () => {
    if (!zoomRef.current) {
      return
    }
    zoomRef.current.svg.transition().duration(250).call(zoomRef.current.zoom.scaleBy, 0.8)
  }

  const zoomFit = () => {
    if (!zoomRef.current) {
      return
    }
    zoomRef.current.svg.transition().duration(300).call(zoomRef.current.zoom.transform, zoomRef.current.initialTransform)
  }

  if (!treeData || !nodes.length) {
    return (
      <div style={{ maxWidth: 840, margin: '0 auto', padding: '72px 28px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 12 }}>No Propagation Tree Loaded</div>
        <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.8, marginBottom: 26 }}>
          Run the upload and analysis workflow first so the backend can return a propagation graph.
        </p>
        <button
          onClick={() => navigate('upload')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            background: 'var(--orange)',
            color: '#111',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Open Upload Workflow
        </button>
      </div>
    )
  }

  const selectedNodeView = selectedNode
    ? {
        ...selectedNode,
        explanation: explanations[selectedNode.id] || '',
      }
    : null

  const totalNodes = nodes.length
  const totalInfringing = nodes.filter((node) => node.type === 'Infringing').length
  const treeDepth = hierarchy ? hierarchy.height + 1 : 1

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--orange)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            LIVE PROPAGATION GRAPH
          </div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: '#fff' }}>
            Propagation <span style={{ color: 'var(--orange)' }}>Tree</span>
          </h2>
          <p style={{ color: 'var(--text2)', marginTop: 6, fontSize: 14 }}>
            Click any node to inspect it. The graph is rendered from the backend tree response in real time.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {['Original', 'Modified', 'Infringing'].map((label) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: NODE_COLORS[label].fill }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text2)' }}>{label}</span>
            </div>
          ))}
          <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              [ZoomIn, zoomIn],
              [ZoomOut, zoomOut],
              [Maximize2, zoomFit],
            ].map(([Icon, action], index) => (
              <button
                key={index}
                onClick={action}
                style={{
                  width: 32,
                  height: 32,
                  background: 'var(--bg3)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Icon size={13} color="var(--text2)" />
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 16px',
              background: 'rgba(255,107,26,0.08)',
              border: '1px solid rgba(255,107,26,0.2)',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--orange)',
              cursor: 'pointer',
            }}
          >
            <LayoutDashboard size={13} /> Dashboard
          </button>
        </div>
      </div>

      <div
        style={{
          background: '#141414',
          border: '1px solid rgba(255,107,26,0.1)',
          borderRadius: 20,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 600,
          boxShadow: '0 0 60px rgba(255,107,26,0.04)',
        }}
      >
        <svg ref={svgRef} style={{ display: 'block', width: '100%', position: 'relative', zIndex: 1 }} />
        {selectedNodeView ? (
          <NodeDetailPanel
            node={selectedNodeView}
            loadingExplanation={loadingExplanationId === selectedNodeView.id}
            explanationError={explanationErrors[selectedNodeView.id]}
            onDMCA={setDmcaNode}
            onClose={() => setSelectedNodeId(null)}
            onViewSource={() => {
              if (selectedNodeView.url) {
                window.open(selectedNodeView.url, '_blank', 'noopener,noreferrer')
              }
            }}
          />
        ) : null}
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total Nodes', value: totalNodes, icon: GitBranch, color: 'var(--orange)' },
          { label: 'Tree Depth', value: `${treeDepth} levels`, icon: Shield, color: 'var(--orange)' },
          { label: 'Infringing', value: `${totalInfringing} nodes`, icon: AlertTriangle, color: totalInfringing ? 'var(--red)' : 'var(--text2)' },
          { label: 'DMCA Ready', value: `${totalInfringing} notices`, icon: FileText, color: totalInfringing ? 'var(--red)' : 'var(--text2)' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
            <div
              style={{
                width: 36,
                height: 36,
                flexShrink: 0,
                background: stat.color === 'var(--red)' ? 'rgba(255,59,92,0.1)' : 'rgba(255,107,26,0.1)',
                border: `1px solid ${stat.color === 'var(--red)' ? 'rgba(255,59,92,0.2)' : 'rgba(255,107,26,0.2)'}`,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <stat.icon size={15} color={stat.color} />
            </div>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#fff' }}>{stat.value}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text3)' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {dmcaNode ? <DMCAModal rootImageId={imageId} nodeData={dmcaNode} onClose={() => setDmcaNode(null)} /> : null}
    </div>
  )
}
