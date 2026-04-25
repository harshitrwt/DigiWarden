import { useMemo, useState } from 'react'
import './App.css'
import {
  analyzeImage,
  generateDmca,
  getAnalysisResult,
  getBackendOrigin,
  getTree,
  uploadImage,
} from './api/api'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function App() {
  const backendOrigin = useMemo(() => getBackendOrigin(), [])
  const [file, setFile] = useState(null)
  const [root, setRoot] = useState(null)
  const [result, setResult] = useState(null)
  const [tree, setTree] = useState(null)
  const [dmca, setDmca] = useState(null)
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [selectedNodeId, setSelectedNodeId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function runPipeline() {
    if (!file) return
    setBusy(true)
    setError('')
    setResult(null)
    setTree(null)
    setDmca(null)

    try {
      const up = await uploadImage(file)
      setRoot(up?.data || null)
      const imageId = up?.data?.image_id
      if (!imageId) throw new Error('Upload did not return image_id')

      await analyzeImage(imageId)

      // Poll result (demo: up to ~30s)
      let lastErr = null
      for (let i = 0; i < 30; i++) {
        try {
          const r = await getAnalysisResult(imageId)
          setResult(r?.data || null)
          lastErr = null
          break
        } catch (e) {
          lastErr = e
          await sleep(1000)
        }
      }
      if (lastErr) throw lastErr

      const t = await getTree(imageId)
      setTree(t?.data || null)
      const firstChild = (t?.data?.nodes || []).find((n) => n.id !== 'node-0')
      setSelectedNodeId(firstChild?.id || '')
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  async function onGenerateDmca() {
    if (!root?.image_id || !selectedNodeId) return
    setBusy(true)
    setError('')
    setDmca(null)
    try {
      const res = await generateDmca({
        root_image_id: root.image_id,
        infringing_node_id: selectedNodeId,
        owner_name: ownerName || undefined,
        owner_email: ownerEmail || undefined,
      })
      setDmca(res?.data || null)
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>ContentGenome MVP Demo</h1>
      <p style={{ marginTop: 0, opacity: 0.85 }}>
        This UI is a placeholder for the real dashboard (TreeViz / ScoreCards / DMCA
        modal). It exists so you can exercise the backend end-to-end.
      </p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={busy}
        />
        <button className="counter" onClick={runPipeline} disabled={!file || busy}>
          {busy ? 'Working…' : 'Upload & Analyze'}
        </button>
        <span style={{ opacity: 0.7 }}>
          Backend: <code>{backendOrigin}</code>
        </span>
      </div>

      {error ? (
        <pre style={{ background: '#2a0f14', padding: 12, borderRadius: 8, color: '#ffd6d6' }}>
          {error}
        </pre>
      ) : null}

      {root ? (
        <section style={{ marginTop: 18 }}>
          <h2>Upload</h2>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <img
              src={`${backendOrigin}/assets/${root.image_id}.png`}
              alt="root"
              style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 8 }}
              onError={(e) => {
                // If original wasn't png, fall back to showing nothing
                e.currentTarget.style.display = 'none'
              }}
            />
            <div>
              <div>
                <strong>image_id:</strong> <code>{root.image_id}</code>
              </div>
              <div>
                <strong>filename:</strong> <code>{root.filename}</code>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {result ? (
        <section style={{ marginTop: 18 }}>
          <h2>Result</h2>
          <pre style={{ background: '#12151b', padding: 12, borderRadius: 8 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      ) : null}

      {tree ? (
        <section style={{ marginTop: 18 }}>
          <h2>Propagation Tree (JSON)</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label>
              Node:
              <select
                value={selectedNodeId}
                onChange={(e) => setSelectedNodeId(e.target.value)}
                disabled={busy}
                style={{ marginLeft: 8 }}
              >
                {(tree.nodes || [])
                  .filter((n) => n.id !== 'node-0')
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.id} — {n.mutation_type} — {Math.round(n.similarity_score)}%
                    </option>
                  ))}
              </select>
            </label>
            <input
              placeholder="Owner name (optional)"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              disabled={busy}
              style={{ padding: 8, borderRadius: 8, border: '1px solid #2b3340' }}
            />
            <input
              placeholder="Owner email (optional)"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              disabled={busy}
              style={{ padding: 8, borderRadius: 8, border: '1px solid #2b3340' }}
            />
            <button className="counter" onClick={onGenerateDmca} disabled={!selectedNodeId || busy}>
              Generate DMCA (demo)
            </button>
          </div>
          <pre style={{ background: '#12151b', padding: 12, borderRadius: 8 }}>
            {JSON.stringify(tree, null, 2)}
          </pre>
        </section>
      ) : null}

      {dmca ? (
        <section style={{ marginTop: 18 }}>
          <h2>DMCA Draft</h2>
          <pre style={{ background: '#12151b', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
            {dmca.draft_text}
          </pre>
        </section>
      ) : null}
    </div>
  )
}

export default App
