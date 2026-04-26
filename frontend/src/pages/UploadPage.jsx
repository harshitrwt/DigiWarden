import { useMemo, useRef, useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle, Image, Loader, Plus, Upload, X } from 'lucide-react'
import { PIPELINE_STEPS, useUploadAndAnalyze } from '../hooks/useApi'

function formatFileSize(file) {
  if (!file) {
    return ''
  }

  const sizeKb = file.size / 1024
  if (sizeKb < 1024) {
    return `${sizeKb.toFixed(0)} KB`
  }

  return `${(sizeKb / 1024).toFixed(2)} MB`
}

export default function UploadPage({ navigate, workflow }) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [variantFiles, setVariantFiles] = useState([])
  const fileRef = useRef(null)
  const variantsRef = useRef(null)
  const { upload, step, loading, result, error, jobStatus } = useUploadAndAnalyze()

  const latestAssetId = workflow?.analysis?.image_id || workflow?.image?.image_id

  const variantSummary = useMemo(() => {
    if (!variantFiles.length) {
      return 'No candidate copies attached yet. The analysis will still complete, but the tree will only include the root asset.'
    }

    return `${variantFiles.length} candidate ${variantFiles.length === 1 ? 'copy' : 'copies'} will be analyzed against the root asset in this run.`
  }, [variantFiles])

  const handleFile = (nextFile) => {
    if (!nextFile || !nextFile.type.startsWith('image/')) {
      return
    }

    setFile(nextFile)
    setPreview(URL.createObjectURL(nextFile))
  }

  const handleVariantSelection = (event) => {
    const files = Array.from(event.target.files || []).filter((candidate) => candidate.type.startsWith('image/'))
    if (!files.length) {
      return
    }

    setVariantFiles((current) => [...current, ...files])
    event.target.value = ''
  }

  const removeVariant = (index) => {
    setVariantFiles((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const handleUpload = async () => {
    await upload({ file, variantFiles })
  }

  const toDashboard = () => {
    if (result) {
      navigate('dashboard', result)
    }
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '60px 28px' }}>
      <div style={{ textAlign: 'center', marginBottom: 52, animation: 'fadeUp 0.5s ease' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '5px 14px',
            borderRadius: 999,
            background: 'var(--orange-dim)',
            border: '1px solid var(--orange-border)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: 'var(--orange)',
            letterSpacing: '0.08em',
            marginBottom: 20,
          }}
        >
          LIVE ANALYSIS WORKFLOW
        </div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 40, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
          Register And Analyze Your Asset
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text2)', maxWidth: 620, margin: '0 auto', lineHeight: 1.7 }}>
          Upload the original file, optionally attach suspected copies, then let the backend build the live similarity report and propagation tree.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24 }}>
        <div>
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragOver(false)
              handleFile(event.dataTransfer.files[0])
            }}
            onClick={() => {
              if (!file && !loading) {
                fileRef.current?.click()
              }
            }}
            style={{
              border: `2px dashed ${dragOver ? 'var(--orange)' : file ? 'rgba(255,107,26,0.35)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 18,
              background: dragOver ? 'rgba(255,107,26,0.04)' : 'rgba(20,20,20,0.6)',
              backdropFilter: 'blur(12px)',
              cursor: file || loading ? 'default' : 'pointer',
              transition: 'all 0.25s',
              textAlign: 'center',
              minHeight: file ? 360 : 240,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: dragOver ? '0 0 40px rgba(255,107,26,0.1)' : 'none',
            }}
          >
            {!file ? (
              <div>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    background: 'rgba(255,107,26,0.08)',
                    border: '1px solid rgba(255,107,26,0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 18px',
                  }}
                >
                  <Image size={28} color="var(--orange)" strokeWidth={1.5} />
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                  Drop the original image here
                </div>
                <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 22 }}>JPG | PNG | WebP | GIF</div>
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '11px 24px',
                    background: 'var(--orange)',
                    color: '#111',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif',
                    boxShadow: '0 0 20px var(--orange-glow)',
                  }}
                >
                  <Upload size={14} /> Browse Files
                </button>
              </div>
            ) : (
              <div style={{ width: '100%', position: 'relative' }}>
                <img src={preview} alt="Original asset preview" style={{ width: '100%', maxHeight: 380, objectFit: 'contain', borderRadius: 16, display: 'block' }} />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(17,17,17,0.95))',
                    borderRadius: '0 0 16px 16px',
                    padding: '40px 20px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--orange)', marginBottom: 4, letterSpacing: '0.1em' }}>
                      ORIGINAL ASSET
                    </div>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{file.name}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text3)' }}>
                      {formatFileSize(file)} | {(file.type.split('/')[1] || 'image').toUpperCase()}
                    </div>
                  </div>
                  {!loading && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        setFile(null)
                        setPreview(null)
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: 'none',
                        color: 'var(--text2)',
                        padding: '6px 14px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Change
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(event) => handleFile(event.target.files[0])} />

          <div style={{ marginTop: 18, background: 'rgba(20,20,20,0.8)', border: '1px solid var(--border)', borderRadius: 18, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 5 }}>
                  OPTIONAL VARIANT INPUTS
                </div>
                <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>Attach suspected copies for real comparison</div>
              </div>
              <button
                onClick={() => variantsRef.current?.click()}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 14px',
                  background: 'rgba(255,107,26,0.08)',
                  color: 'var(--orange)',
                  border: '1px solid rgba(255,107,26,0.2)',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loading ? 'default' : 'pointer',
                }}
              >
                <Plus size={14} /> Add Variants
              </button>
            </div>
            <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>{variantSummary}</p>

            {variantFiles.length ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {variantFiles.map((variantFile, index) => (
                  <div
                    key={`${variantFile.name}-${index}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '12px 14px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                    }}
                  >
                    <div>
                      <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{variantFile.name}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text3)' }}>
                        {formatFileSize(variantFile)} | {(variantFile.type.split('/')[1] || 'image').toUpperCase()}
                      </div>
                    </div>
                    {!loading && (
                      <button
                        onClick={() => removeVariant(index)}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--text2)',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
            <input ref={variantsRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleVariantSelection} />
          </div>

          {error ? (
            <div
              style={{
                marginTop: 12,
                padding: '12px 16px',
                background: 'rgba(255,59,92,0.08)',
                border: '1px solid rgba(255,59,92,0.2)',
                borderRadius: 10,
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <AlertCircle size={14} color="var(--red)" />
              <span style={{ fontSize: 13, color: 'var(--red)' }}>{error}</span>
            </div>
          ) : null}

          {file && !loading && !result ? (
            <button
              onClick={handleUpload}
              style={{
                marginTop: 14,
                width: '100%',
                padding: 16,
                background: 'linear-gradient(135deg, var(--orange), #FF9040)',
                color: '#111',
                border: 'none',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                fontFamily: 'Syne, sans-serif',
                boxShadow: '0 4px 28px var(--orange-glow)',
              }}
            >
              <Upload size={17} /> Start Live Analysis <ArrowRight size={16} />
            </button>
          ) : null}

          {result ? (
            <button
              onClick={toDashboard}
              style={{
                marginTop: 14,
                width: '100%',
                padding: 16,
                background: 'var(--orange)',
                color: '#111',
                border: 'none',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                fontFamily: 'Syne, sans-serif',
                boxShadow: '0 4px 28px var(--orange-glow)',
              }}
            >
              <CheckCircle size={17} /> View Results Dashboard <ArrowRight size={16} />
            </button>
          ) : null}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'rgba(20,20,20,0.8)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', borderRadius: 18, padding: 24 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
              Live Pipeline
            </div>
            {PIPELINE_STEPS.map((pipelineStep, index) => {
              const isActive = loading && step === index
              const isDone = result || (loading && step > index)
              return (
                <div key={pipelineStep.id} style={{ display: 'flex', gap: 13, alignItems: 'flex-start', paddingBottom: index < PIPELINE_STEPS.length - 1 ? 18 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: `2px solid ${isDone ? 'var(--green)' : isActive ? 'var(--orange)' : 'rgba(255,255,255,0.08)'}`,
                        background: isDone ? 'rgba(34,197,94,0.1)' : isActive ? 'rgba(255,107,26,0.1)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s',
                      }}
                    >
                      {isDone ? (
                        <CheckCircle size={13} color="var(--green)" />
                      ) : isActive ? (
                        <Loader size={13} color="var(--orange)" style={{ animation: 'spin 0.8s linear infinite' }} />
                      ) : (
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text3)' }} />
                      )}
                    </div>
                    {index < PIPELINE_STEPS.length - 1 ? <div style={{ width: 1.5, height: 22, background: isDone ? 'var(--green)' : 'rgba(255,255,255,0.06)', marginTop: 4 }} /> : null}
                  </div>
                  <div style={{ paddingTop: 5 }}>
                    <div style={{ fontSize: 13, fontWeight: isDone || isActive ? 600 : 400, color: isDone ? 'var(--green)' : isActive ? 'var(--orange)' : 'var(--text2)' }}>
                      {pipelineStep.label}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{pipelineStep.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ background: 'rgba(20,20,20,0.8)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 12 }}>LIVE STATUS</div>
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ color: 'var(--text3)', fontSize: 12 }}>Current asset</span>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{latestAssetId || 'Not created yet'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ color: 'var(--text3)', fontSize: 12 }}>Variants in this run</span>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{variantFiles.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ color: 'var(--text3)', fontSize: 12 }}>Job state</span>
                <span style={{ color: loading ? 'var(--orange)' : result ? 'var(--green)' : 'var(--text2)', fontSize: 12, fontWeight: 600 }}>
                  {jobStatus?.status || (result ? 'complete' : loading ? 'processing' : 'idle')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ color: 'var(--text3)', fontSize: 12 }}>Result mode</span>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{variantFiles.length ? 'Root + variants' : 'Root only'}</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(20,20,20,0.8)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 12 }}>ENDPOINTS USED</div>
            {[
              ['POST', '/api/upload'],
              ['POST', '/api/images/{root}/variants'],
              ['POST', '/api/analyze/{id}'],
              ['GET', '/api/images/{id}/status'],
              ['GET', '/api/analyze/{id}/result'],
              ['GET', '/api/tree/{id}'],
            ].map(([method, path]) => (
              <div key={path} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: method === 'POST' ? 'rgba(255,107,26,0.15)' : 'rgba(59,130,246,0.15)',
                    color: method === 'POST' ? 'var(--orange)' : 'var(--blue)',
                    fontWeight: 600,
                  }}
                >
                  {method}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text)' }}>{path}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
