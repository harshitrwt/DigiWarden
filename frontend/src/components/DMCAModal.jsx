import { useEffect, useState } from 'react'
import { CheckCircle, Copy, Download, FileText, Loader, RotateCcw, X } from 'lucide-react'
import { useDMCA } from '../hooks/useApi'

function downloadDraft(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function DMCAModal({ rootImageId, nodeData, onClose }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [editableText, setEditableText] = useState('')
  const [copied, setCopied] = useState(false)
  const { generate, loading, draft, error, reset } = useDMCA()

  useEffect(() => {
    if (draft?.draftText) {
      setEditableText(draft.draftText)
    }
  }, [draft])

  const handleGenerate = async () => {
    await generate({
      rootImageId,
      nodeId: nodeData.nodeId || nodeData.id,
      ownerName: name,
      ownerEmail: email,
    })
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editableText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const noticeFilename = `dmca-notice-${nodeData.nodeId || nodeData.id || 'draft'}.txt`
  const evidence = draft?.evidence || null

  const input = (placeholder, value, onChange) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{
        width: '100%',
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        fontSize: 14,
        color: '#fff',
        outline: 'none',
      }}
    />
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={() => {
        reset()
        onClose()
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          background: '#181818',
          border: '1px solid rgba(255,59,92,0.2)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 0 80px rgba(255,59,92,0.12)',
        }}
      >
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--red)', letterSpacing: '0.1em', marginBottom: 6 }}>
              DMCA TAKEDOWN NOTICE
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff' }}>Generate Notice</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
              Candidate: <span style={{ color: '#fff' }}>{nodeData.filename || nodeData.displayName || nodeData.id}</span>
              <span style={{ margin: '0 8px', color: 'var(--text3)' }}>|</span>
              Score: <span style={{ color: 'var(--red)' }}>{Math.round(Number(nodeData.similarityScore ?? nodeData.similarity ?? 0))}%</span>
            </div>
          </div>
          <button
            onClick={() => {
              reset()
              onClose()
            }}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' }}
          >
            <X size={15} color="var(--text2)" />
          </button>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {!draft ? (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.6 }}>
                  Fill in your contact details to prefill the DMCA notice. Only the notice text itself becomes editable after generation.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {input('Rights holder or authorized representative', name, setName)}
                  {input('Contact email address', email, setEmail)}
                </div>
              </div>

              <div style={{ background: 'rgba(255,59,92,0.05)', border: '1px solid rgba(255,59,92,0.12)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--red)', marginBottom: 10, letterSpacing: '0.08em' }}>
                  EVIDENCE ATTACHED
                </div>
                {[
                  ['Classification', nodeData.label || nodeData.type || 'Infringing'],
                  ['Transformation', nodeData.mutation || nodeData.transformation || 'Unknown'],
                  ['Similarity', `${Math.round(Number(nodeData.similarityScore ?? nodeData.similarity ?? 0))}%`],
                  ['pHash', nodeData.breakdown?.phash_score !== undefined ? `${Math.round(Number(nodeData.breakdown.phash_score))}%` : 'N/A'],
                  ['ORB', nodeData.breakdown?.orb_score !== undefined ? `${Math.round(Number(nodeData.breakdown.orb_score))}%` : 'N/A'],
                  ['Semantic', nodeData.breakdown?.semantic_score !== undefined && nodeData.breakdown?.semantic_score !== null ? `${Math.round(Number(nodeData.breakdown.semantic_score))}%` : 'N/A'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text3)' }}>{label}</span>
                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>

              {error ? <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--red)' }}>{error}</div> : null}

              <button
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: 14,
                  background: loading ? 'rgba(255,107,26,0.5)' : 'var(--orange)',
                  color: '#111',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 20px var(--orange-glow)',
                }}
              >
                {loading ? (
                  <>
                    <Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                    Drafting notice...
                  </>
                ) : (
                  <>
                    <FileText size={15} />
                    Generate DMCA Notice
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 8 }}>
                <CheckCircle size={14} color="var(--green)" />
                <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>Notice generated successfully</span>
              </div>

              {evidence ? (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text3)', letterSpacing: '0.08em', marginBottom: 8 }}>
                    LOCKED EVIDENCE SUMMARY
                  </div>
                  {[
                    ['Source URL', evidence.url || 'N/A'],
                    ['Transformation', evidence.mutation_type || 'Unknown'],
                    ['Classification', evidence.authenticity_label || 'Unknown'],
                    ['Similarity', evidence.similarity_score !== undefined ? `${Math.round(Number(evidence.similarity_score))}%` : 'N/A'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text3)' }}>{label}</span>
                      <span style={{ fontSize: 12, color: '#fff', fontWeight: 500, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text3)', letterSpacing: '0.08em', marginBottom: 8 }}>
                EDITABLE NOTICE CONTENT
              </div>
              <textarea
                value={editableText}
                onChange={(event) => setEditableText(event.target.value)}
                style={{
                  width: '100%',
                  minHeight: 320,
                  padding: 16,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  color: 'var(--text2)',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  lineHeight: 1.8,
                  resize: 'vertical',
                  marginBottom: 16,
                }}
              />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={handleCopy}
                  style={{
                    flex: 1,
                    minWidth: 150,
                    padding: 12,
                    background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                    color: copied ? 'var(--green)' : 'var(--text)',
                    border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                  }}
                >
                  {copied ? (
                    <>
                      <CheckCircle size={13} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      Copy Notice
                    </>
                  )}
                </button>
                <button
                  onClick={() => downloadDraft(noticeFilename, editableText)}
                  style={{
                    flex: 1,
                    minWidth: 150,
                    padding: 12,
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
                  <Download size={13} />
                  Download Notice
                </button>
                <button
                  onClick={() => setEditableText(draft.draftText)}
                  style={{
                    padding: '12px 16px',
                    background: 'transparent',
                    color: 'var(--text2)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <RotateCcw size={13} />
                  Reset Text
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
