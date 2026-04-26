import { useState, useCallback } from 'react'
import { MOCK_ANALYSIS, MOCK_TREE, PIPELINE_STEPS } from '../mock/fixtures'

// Simulates POST /api/upload + full pipeline
export function useUploadAndAnalyze() {
  const [step, setStep] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const upload = useCallback(async (file) => {
    setLoading(true); setError(null); setResult(null); setStep(0)
    try {
      for (let i = 0; i < PIPELINE_STEPS.length; i++) {
        setStep(i)
        await new Promise(r => setTimeout(r, PIPELINE_STEPS[i].duration + Math.random() * 200))
      }
      setResult({ ...MOCK_ANALYSIS, filename: file.name })
    } catch (e) {
      setError('Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  return { upload, step, loading, result, error }
}

// Simulates GET /api/analyze/{id}/result
export function useAnalysisResult(id) {
  return { data: id ? MOCK_ANALYSIS : null, loading: false }
}

// Simulates GET /api/tree/{id}
export function useTree(id) {
  return { data: id ? MOCK_TREE : null, loading: false }
}

// Simulates POST /api/dmca/generate
export function useDMCA() {
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState(null)

  const generate = useCallback(async ({ ownerName, ownerEmail, nodeData }) => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setDraft({
      to: `${nodeData.platform} Copyright Agent`,
      subject: `DMCA Takedown Notice — Unauthorized Use of Copyrighted Image`,
      body: `TO: ${nodeData.platform} DMCA Agent / Legal Department
SUBJECT: DMCA Takedown Notice

Dear Sir or Madam,

I am writing on behalf of ${ownerName || '[Rights Holder]'}, the exclusive copyright owner of the image described below.

INFRINGING CONTENT:
— Platform:          ${nodeData.platform}
— Content URL:       ${nodeData.url || '[discovered URL]'}
— Transformation:    ${nodeData.transformation}
— Similarity Score:  ${nodeData.similarity}% (DigiPatron ContentGenome v2)
— Detection Method:  pHash (${nodeData.scores?.phash}%) + ORB (${nodeData.scores?.orb}%) + CLIP (${nodeData.scores?.clip}%)
— Classification:    ${nodeData.label}

ORIGINAL WORK:
— Registered with DigiPatron ContentGenome on ${new Date().toLocaleDateString()}
— Unique Asset ID: img_9f3a2b
— Fingerprint: pHash a4f2e8c1d9b372fa

I have a good faith belief that the use of the material described above is not authorized by the copyright owner, its agent, or the law.

I declare under penalty of perjury that the information in this notification is accurate and that I am the copyright owner or am authorized to act on behalf of the copyright owner.

Signature:  ${ownerName || '[Your Name]'}
Email:      ${ownerEmail || '[Your Email]'}
Date:       ${new Date().toLocaleDateString()}

This notice is submitted pursuant to 17 U.S.C. § 512(c)(3).`,
      generatedAt: new Date().toISOString()
    })
    setLoading(false)
  }, [])

  return { generate, loading, draft, reset: () => setDraft(null) }
}
