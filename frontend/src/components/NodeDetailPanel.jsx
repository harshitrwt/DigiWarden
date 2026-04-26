import { ExternalLink, FileText, Info, Loader, X } from 'lucide-react'

const TYPE_COLORS = {
  Original: { fill: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
  Modified: { fill: '#FF6B1A', bg: 'rgba(255,107,26,0.1)', border: 'rgba(255,107,26,0.2)' },
  Infringing: { fill: '#FF3B5C', bg: 'rgba(255,59,92,0.1)', border: 'rgba(255,59,92,0.2)' },
  Unmatched: { fill: '#999999', bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.12)' },
}

function scoreValue(value) {
  if (value === null || value === undefined) {
    return 'N/A'
  }
  return `${Math.round(Number(value) || 0)}%`
}

export default function NodeDetailPanel({ node, loadingExplanation, explanationError, onDMCA, onClose, onViewSource }) {
  if (!node) {
    return null
  }

  const colors = TYPE_COLORS[node.type] || TYPE_COLORS.Modified

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 320,
        background: 'rgba(20,20,20,0.97)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        zIndex: 20,
      }}
    >
      <div style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}`, padding: '16px 18px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 6, padding: 5, cursor: 'pointer' }}>
          <X size={12} color="var(--text2)" />
        </button>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: colors.fill, letterSpacing: '0.1em', marginBottom: 4 }}>
          {node.type.toUpperCase()}
        </div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: '#fff' }}>{node.displayName}</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{node.sourceLabel}</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>{node.time}</div>
      </div>

      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border2)' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text3)', marginBottom: 10, letterSpacing: '0.08em' }}>
          SCORE BREAKDOWN
        </div>
        {[
          ['pHash', node.scores.phash, '#3B82F6'],
          ['ORB', node.scores.orb, '#8B5CF6'],
          ['Semantic', node.scores.clip, '#EC4899'],
          ['Combined', node.scores.combined, colors.fill],
        ].map(([label, value, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text2)', minWidth: 68 }}>{label}</div>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, width: `${Math.round(Number(value) || 0)}%`, background: color }} />
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color, minWidth: 42, textAlign: 'right' }}>{scoreValue(value)}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border2)' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text3)', marginBottom: 6, letterSpacing: '0.08em' }}>
          TRANSFORMATION
        </div>
        <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{node.transformation}</div>
      </div>

      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border2)' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <Info size={11} color="var(--orange)" />
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text3)', letterSpacing: '0.08em' }}>
            NODE EXPLANATION
          </div>
        </div>
        {loadingExplanation ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text2)', fontSize: 12 }}>
            <Loader size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
            Loading explanation...
          </div>
        ) : explanationError ? (
          <div style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.7 }}>{explanationError}</div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>{node.explanation || 'No explanation available for this node yet.'}</div>
        )}
      </div>

      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {node.type === 'Infringing' ? (
          <button
            onClick={() => onDMCA(node)}
            style={{
              width: '100%',
              padding: 11,
              background: 'var(--red)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
            }}
          >
            <FileText size={13} /> Generate DMCA Notice
          </button>
        ) : null}
        <button
          onClick={onViewSource}
          disabled={!node.url}
          style={{
            width: '100%',
            padding: 9,
            background: 'rgba(255,255,255,0.05)',
            color: node.url ? 'var(--text2)' : 'var(--text3)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            fontSize: 13,
            cursor: node.url ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <ExternalLink size={12} /> View Source
        </button>
      </div>
    </div>
  )
}
