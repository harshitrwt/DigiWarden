const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options)
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && (data.detail || data.message)) ||
      `Request failed (${res.status})`
    throw new Error(message)
  }
  return data
}

export function getBackendOrigin() {
  return API_BASE.replace(/\/api\/?$/, '')
}

export async function uploadImage(file) {
  const form = new FormData()
  form.append('file', file)
  return apiFetch('/upload', { method: 'POST', body: form })
}

export async function analyzeImage(imageId) {
  return apiFetch(`/analyze/${encodeURIComponent(imageId)}`, { method: 'POST' })
}

export async function getAnalysisResult(imageId) {
  return apiFetch(`/analyze/${encodeURIComponent(imageId)}/result`)
}

export async function getTree(imageId) {
  return apiFetch(`/tree/${encodeURIComponent(imageId)}`)
}

export async function getSimilarity(imageId) {
  return apiFetch(`/similarity/${encodeURIComponent(imageId)}`)
}

export async function generateDmca(payload) {
  return apiFetch('/dmca/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

