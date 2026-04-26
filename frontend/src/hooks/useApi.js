import { useCallback, useState } from 'react'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const POLL_INTERVAL_MS = 1200
const POLL_TIMEOUT_MS = 45000

export const PIPELINE_STEPS = [
  { id: 'upload', label: 'Register Original Asset', desc: 'POST /api/upload stores the source image and creates an asset ID.' },
  { id: 'variants', label: 'Attach Candidate Copies', desc: 'Optional variants are uploaded and linked to the root asset.' },
  { id: 'analyze', label: 'Start Analysis Job', desc: 'POST /api/analyze/{image_id} launches fingerprinting and scoring.' },
  { id: 'poll', label: 'Track Live Job Status', desc: 'GET /api/images/{image_id}/status is polled until the job completes.' },
  { id: 'results', label: 'Load Scores And Matches', desc: 'Analysis, similarity, fingerprint, and variant data are fetched live.' },
  { id: 'tree', label: 'Build Propagation Tree', desc: 'GET /api/tree/{image_id} returns the graph rendered by the frontend.' },
]

function getRuntimeOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'http://localhost:5173'
}

function getApiOrigin() {
  return new URL(API_BASE_URL, getRuntimeOrigin()).origin
}

function sleep(ms) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

async function parseResponse(response) {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return { detail: text }
  }
}

function getErrorMessage(response, payload, fallback) {
  if (typeof payload?.detail === 'string') {
    return payload.detail
  }

  if (typeof payload?.message === 'string') {
    return payload.message
  }

  return fallback || `Request failed with status ${response.status}.`
}

async function apiRequest(path, options = {}, config = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)
  const payload = await parseResponse(response)
  const allowStatusCodes = config.allowStatusCodes || []

  if (!response.ok && !allowStatusCodes.includes(response.status)) {
    throw new Error(getErrorMessage(response, payload))
  }

  return { status: response.status, payload }
}

function normalizeUrl(value) {
  if (!value) {
    return value
  }

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  return new URL(value, getApiOrigin()).toString()
}

function normalizeWorkflowPayload(workflow) {
  return {
    ...workflow,
    image: workflow.image
      ? {
          ...workflow.image,
          url: normalizeUrl(workflow.image.url),
        }
      : null,
    similarity: workflow.similarity
      ? {
          ...workflow.similarity,
          matches: workflow.similarity.matches.map((match) => ({
            ...match,
            url: normalizeUrl(match.url),
          })),
        }
      : { root_image_id: workflow.analysis?.image_id, matches: [] },
    tree: workflow.tree
      ? {
          ...workflow.tree,
          nodes: workflow.tree.nodes.map((node) => ({
            ...node,
            url: normalizeUrl(node.url),
          })),
        }
      : null,
    variants: Array.isArray(workflow.variants)
      ? workflow.variants.map((variant) => ({
          ...variant,
          url: normalizeUrl(variant.url),
        }))
      : [],
  }
}

async function uploadFile(path, file) {
  const form = new FormData()
  form.append('file', file)
  const { payload } = await apiRequest(path, { method: 'POST', body: form })
  return payload?.data
}

async function waitForCompletion(imageId, onStatus) {
  const deadline = Date.now() + POLL_TIMEOUT_MS

  while (Date.now() < deadline) {
    const { payload } = await apiRequest(`/images/${imageId}/status`)
    const status = payload?.data
    onStatus?.(status)

    if (status?.status === 'complete') {
      return status
    }

    if (status?.status === 'failed') {
      throw new Error(status.error || 'Analysis failed during background processing.')
    }

    await sleep(POLL_INTERVAL_MS)
  }

  throw new Error('Analysis timed out before the backend reported a completed result.')
}

async function fetchWorkflow(imageId) {
  const [imageResponse, resultResponse, similarityResponse, treeResponse, fingerprintResponse, variantsResponse] = await Promise.all([
    apiRequest(`/images/${imageId}`),
    apiRequest(`/analyze/${imageId}/result`),
    apiRequest(`/similarity/${imageId}`),
    apiRequest(`/tree/${imageId}`),
    apiRequest(`/fingerprint/${imageId}`),
    apiRequest(`/images/${imageId}/variants?include_demo=true`),
  ])

  return normalizeWorkflowPayload({
    image: imageResponse.payload?.data || null,
    analysis: resultResponse.payload?.data || null,
    similarity: similarityResponse.payload?.data || { root_image_id: imageId, matches: [] },
    tree: treeResponse.payload?.data || null,
    fingerprint: fingerprintResponse.payload?.data || null,
    variants: variantsResponse.payload?.data || [],
  })
}

export function getDisplayLabel(label) {
  if (label === 'Likely Infringing') {
    return 'Infringing'
  }
  if (label === 'No Match') {
    return 'Unmatched'
  }
  return label || 'Unknown'
}

export function formatRelativeTime(value) {
  if (!value) {
    return 'Just now'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown time'
  }

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000))
  if (diffMinutes < 1) {
    return 'Just now'
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

export async function fetchNodeExplanation(imageId, nodeId) {
  const { payload } = await apiRequest(`/explain/${imageId}/node`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ node_id: nodeId }),
  })

  return payload?.data?.explanation || ''
}

export function useUploadAndAnalyze() {
  const [step, setStep] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)

  const upload = useCallback(async ({ file, variantFiles = [] }) => {
    if (!file) {
      setError('Select an original image before starting analysis.')
      return null
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setJobStatus(null)

    try {
      setStep(0)
      const uploadData = await uploadFile('/upload', file)
      const imageId = uploadData?.image_id

      setStep(1)
      const uploadedVariants = []
      for (const variantFile of variantFiles) {
        const variantData = await uploadFile(`/images/${imageId}/variants`, variantFile)
        uploadedVariants.push(variantData)
      }

      setStep(2)
      await apiRequest(`/analyze/${imageId}`, { method: 'POST' })

      setStep(3)
      const finalJobStatus = await waitForCompletion(imageId, setJobStatus)

      setStep(4)
      const workflow = await fetchWorkflow(imageId)

      setStep(5)
      const nextResult = {
        ...workflow,
        uploadedOriginal: uploadData,
        uploadedVariants,
        jobStatus: finalJobStatus,
      }
      setResult(nextResult)
      return nextResult
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Analysis failed. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { upload, step, loading, result, error, jobStatus }
}

export function useDMCA() {
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState(null)

  const generate = useCallback(async ({ rootImageId, nodeId, ownerName, ownerEmail }) => {
    setLoading(true)
    setError(null)

    try {
      const { payload } = await apiRequest('/dmca/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          root_image_id: rootImageId,
          infringing_node_id: nodeId,
          owner_name: ownerName || undefined,
          owner_email: ownerEmail || undefined,
        }),
      })

      const data = payload?.data
      const nextDraft = {
        dmcaId: data?.dmca_id,
        draftText: data?.draft_text || '',
        evidence: data?.evidence || null,
      }
      setDraft(nextDraft)
      return nextDraft
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to generate a DMCA notice right now.'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    generate,
    loading,
    draft,
    error,
    reset: () => {
      setDraft(null)
      setError(null)
    },
  }
}
