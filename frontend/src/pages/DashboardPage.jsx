import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Fingerprint,
  GitBranch,
  Image as ImageIcon,
  Search,
  Shield,
  TrendingUp,
} from 'lucide-react'
import SimilarityGauge from '../components/SimilarityGauge'
import DMCAModal from '../components/DMCAModal'
import { formatRelativeTime, getDisplayLabel } from '../hooks/useApi'

function formatScore(value) {
  return Math.round(Number(value) || 0)
}

function getTypeStyle(label) {
  if (label === 'Original') {
    return { color: 'var(--green)', background: 'rgba(34,197,94,0.1)' }
  }
  if (label === 'Infringing' || label === 'Exact Copy') {
    return { color: 'var(--red)', background: 'rgba(255,59,92,0.1)' }
  }
  if (label === 'Unmatched') {
    return { color: 'var(--text2)', background: 'rgba(255,255,255,0.06)' }
  }
  return { color: 'var(--orange)', background: 'rgba(255,107,26,0.1)' }
}

function TypeBadge({ label }) {
  const typeStyle = getTypeStyle(label)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 999,
        background: typeStyle.background,
        border: `1px solid ${typeStyle.color}25`,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.05em',
        color: typeStyle.color,
      }}
    >
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: typeStyle.color }} />
      {label}
    </span>
  )
}

export default function DashboardPage({ workflow, navigate }) {
  const [dmcaNode, setDmcaNode] = useState(null)

  const image = workflow?.image
  const analysis = workflow?.analysis
  const fingerprint = workflow?.fingerprint
  const similarity = workflow?.similarity
  const tree = workflow?.tree

  const rows = useMemo(() => {
    if (!similarity?.matches || !tree?.nodes) {
      return []
    }

    const nodesByImageId = new Map(tree.nodes.map((node) => [node.image_id, node]))

    return similarity.matches
      .map((match) => {
        const node = nodesByImageId.get(match.image_id)
        const label = getDisplayLabel(match.authenticity_label)
        return {
          ...match,
          nodeId: match.node_id || node?.id,
          label,
          filename: match.filename || node?.filename || 'Unnamed file',
          source: match.source_kind === 'demo' ? 'Demo variant' : 'Uploaded variant',
          mutation: match.mutation_type || 'Unknown',
          similarityScore: formatScore(match.similarity_score),
          createdAt: match.created_at,
          breakdown: match.breakdown || node?.breakdown || {},
        }
      })
      .sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0
        return rightTime - leftTime
      })
  }, [similarity, tree])

  if (!analysis || !image) {
    return (
      <div style={{ maxWidth: 840, margin: '0 auto', padding: '72px 28px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 12 }}>No Analysis Loaded</div>
        <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.8, marginBottom: 26 }}>
          Upload an original asset and run the live analysis workflow before opening the dashboard.
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

  const infringingRows = rows.filter((row) => row.label !== 'Unmatched' && row.label !== 'Original')
  const hasMatches = rows.length > 0

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 36 }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <div
            style={{
              width: 108,
              height: 108,
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.04)',
              flexShrink: 0,
            }}
          >
            <img src={image.url} alt={image.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--orange)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
              LIVE ANALYSIS RESULT
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
              Results <span style={{ color: 'var(--orange)' }}>Dashboard</span>
            </h2>
            <div style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7 }}>
              <div>{image.filename}</div>
              <div>Asset ID: {analysis.image_id}</div>
              <div>Registered {formatRelativeTime(image.upload_time)}</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate('tree')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 22px',
              background: 'var(--orange)',
              color: '#111',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 22px var(--orange-glow)',
            }}
          >
            <GitBranch size={14} /> View Propagation Tree
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 18, marginBottom: 18 }}>
        <div
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 18,
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18 }}>
            Content Integrity
          </div>
          <SimilarityGauge score={analysis.integrity_score} size={130} label="Integrity Score" />
          <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            {hasMatches ? (
              <>
                <span style={{ color: infringingRows.length ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>
                  {infringingRows.length ? `${infringingRows.length} DMCA-ready matches` : 'No infringing matches'}
                </span>
                <div>{analysis.total_copies_detected} candidate copies analyzed</div>
              </>
            ) : (
              <span>No copies were attached for this run yet.</span>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { icon: Eye, value: analysis.total_copies_detected, label: 'Copies Detected', sub: hasMatches ? `${rows.length} result rows` : 'Root-only analysis', color: 'var(--text)' },
            { icon: AlertTriangle, value: analysis.infringing_copies, label: 'Likely Infringing', sub: infringingRows.length ? 'DMCA generation ready' : 'None detected', color: analysis.infringing_copies ? 'var(--red)' : 'var(--text)' },
            { icon: TrendingUp, value: analysis.modified_copies, label: 'Modified Copies', sub: analysis.modified_copies ? 'Tracked in similarity report' : 'None detected', color: analysis.modified_copies ? 'var(--orange)' : 'var(--text)' },
            { icon: Search, value: rows.length, label: 'Matches Loaded', sub: similarity?.matches?.length ? 'Similarity payload synced' : 'Waiting for candidate copies', color: 'var(--text)' },
            { icon: Clock, value: formatRelativeTime(image.upload_time), label: 'Tracking Window', sub: image.upload_time ? 'Based on asset registration time' : 'No timestamp available', color: 'var(--text)' },
            { icon: Shield, value: `${analysis.integrity_score}%`, label: 'Integrity Index', sub: analysis.integrity_score < 70 ? 'Needs attention' : 'Healthy baseline', color: analysis.integrity_score < 70 ? 'var(--orange)' : 'var(--green)' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 20px' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: 9,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <stat.icon size={15} color={stat.color} />
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{stat.label}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: '22px 26px',
          marginBottom: 18,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 20,
          alignItems: 'stretch',
        }}
      >
        {[
          { label: 'pHash', value: fingerprint?.phash || 'Unavailable', icon: Fingerprint },
          { label: 'ORB descriptors', value: fingerprint?.orb_descriptor_count ?? 0, icon: Search },
          { label: 'Semantic dimension', value: fingerprint?.semantic_dim ?? 'N/A', icon: Shield },
          { label: 'Variants linked', value: workflow?.variants?.length ?? 0, icon: ImageIcon },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border2)', borderRadius: 14, padding: '16px 18px' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(255,107,26,0.08)',
                border: '1px solid rgba(255,107,26,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <item.icon size={16} color="var(--orange)" />
            </div>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text3)', marginBottom: 5 }}>{item.label.toUpperCase()}</div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, wordBreak: 'break-word' }}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: '#fff' }}>Detected Matches</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              {hasMatches ? 'Matches are sourced from the live similarity payload.' : 'Attach candidate copies to populate the propagation report.'}
            </div>
          </div>
          <button
            onClick={() => navigate('tree')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'transparent',
              color: 'var(--text2)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Tree View <ChevronRight size={13} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '140px 170px 1fr 130px 110px 110px', padding: '10px 24px', background: 'rgba(0,0,0,0.2)' }}>
          {['Status', 'Source', 'Transformation', 'Similarity', 'Observed', 'Action'].map((heading) => (
            <div key={heading} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {heading}
            </div>
          ))}
        </div>

        {hasMatches ? (
          rows.map((row, index) => (
            <div
              key={row.nodeId || `${row.filename}-${index}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 170px 1fr 130px 110px 110px',
                padding: '13px 24px',
                borderBottom: index < rows.length - 1 ? '1px solid var(--border2)' : 'none',
                alignItems: 'center',
              }}
            >
              <div>
                <TypeBadge label={row.label} />
              </div>
              <div>
                <div style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{row.source}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{row.filename}</div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text2)' }}>{row.mutation}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 2,
                        width: `${row.similarityScore}%`,
                        background: row.similarityScore >= 80 ? 'var(--green)' : row.similarityScore >= 50 ? 'var(--orange)' : 'var(--red)',
                      }}
                    />
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text2)', minWidth: 34 }}>{row.similarityScore}%</span>
                </div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text3)' }}>{formatRelativeTime(row.createdAt)}</div>
              <div>
                {(row.label !== 'Unmatched' && row.label !== 'Original') ? (
                  <button
                    onClick={() => setDmcaNode(row)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 11px',
                      background: 'rgba(255,59,92,0.1)',
                      color: 'var(--red)',
                      border: '1px solid rgba(255,59,92,0.22)',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <FileText size={11} /> DMCA
                  </button>
                ) : (
                  <span style={{ color: 'var(--text3)', fontSize: 12 }}>-</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '28px 24px', color: 'var(--text2)', fontSize: 14, lineHeight: 1.8 }}>
            No candidate copies were analyzed in this run. Upload suspected variants alongside the original asset to generate a populated similarity report and propagation tree.
          </div>
        )}
      </div>

      {dmcaNode ? <DMCAModal rootImageId={analysis.image_id} nodeData={dmcaNode} onClose={() => setDmcaNode(null)} /> : null}
    </div>
  )
}
