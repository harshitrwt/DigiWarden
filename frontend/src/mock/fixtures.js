export const MOCK_ANALYSIS = {
  id: 'img_9f3a2b',
  filename: 'sports_photo_original.jpg',
  uploadTime: new Date().toISOString(),
  integrityScore: 62,
  similarityScore: 86,
  copiesDetected: 7,
  infringementCount: 2,
  platforms: ['Twitter/X', 'Reddit', 'Instagram', 'Telegram', 'Facebook'],
  fingerprints: {
    phash: 'a4f2e8c1d9b372fa',
    orb: { keypoints: 847, descriptors: '256-bit' },
    clip: { dim: 512, similarity: 0.84 }
  },
  scores: { phash: 78, orb: 83, clip: 91, combined: 86 }
}

export const MOCK_TREE = {
  id: 'n0',
  label: 'ORIGINAL', platform: 'Your Upload', similarity: 100,
  transformation: 'None', type: 'Original', time: 'Registered now',
  url: 'https://example.com/original.jpg',
  scores: { phash: 100, orb: 100, clip: 100, combined: 100 },
  explanation: 'This is the original registered asset. No modifications detected.',
  children: [
    {
      id: 'n1', label: 'MODIFIED', platform: 'Twitter/X', similarity: 87,
      transformation: 'Crop 35%', type: 'Modified', time: '1h 22m ago',
      url: 'https://example.com/n1.jpg',
      scores: { phash: 84, orb: 89, clip: 88, combined: 87 },
      explanation: 'Image has been cropped approximately 35% from the right edge. Likely resized for platform requirements.',
      children: [
        {
          id: 'n3', label: 'MODIFIED', platform: 'Facebook', similarity: 71,
          transformation: 'Brightness +40%', type: 'Modified', time: '4h 18m ago',
          url: 'https://example.com/n3.jpg',
          scores: { phash: 69, orb: 74, clip: 70, combined: 71 },
          explanation: 'Brightness and contrast adjusted significantly. Original crop retained.',
          children: [
            {
              id: 'n6', label: 'INFRINGING', platform: 'Telegram', similarity: 58,
              transformation: 'Crop + Filter + Text', type: 'Infringing', time: '11h ago',
              url: 'https://example.com/n6.jpg',
              scores: { phash: 54, orb: 61, clip: 59, combined: 58 },
              explanation: 'Heavy modification: original watermark removed, promotional text overlay added, and color grading applied. Likely commercial redistribution without license.',
              children: []
            }
          ]
        },
        {
          id: 'n4', label: 'INFRINGING', platform: 'Instagram', similarity: 52,
          transformation: 'Watermark Stripped', type: 'Infringing', time: '9h ago',
          url: 'https://example.com/n4.jpg',
          scores: { phash: 48, orb: 55, clip: 53, combined: 52 },
          explanation: 'Original watermark and rights attribution have been removed. Image redistributed without authorization on commercial Instagram account.',
          children: []
        }
      ]
    },
    {
      id: 'n2', label: 'MODIFIED', platform: 'Reddit', similarity: 74,
      transformation: 'JPEG Compression 55%', type: 'Modified', time: '3h 05m ago',
      url: 'https://example.com/n2.jpg',
      scores: { phash: 73, orb: 76, clip: 73, combined: 74 },
      explanation: 'Significant JPEG compression artifacts introduced. Typical of re-upload to Reddit via mobile.',
      children: [
        {
          id: 'n5', label: 'MODIFIED', platform: 'WhatsApp', similarity: 66,
          transformation: 'Text Overlay + Compress', type: 'Modified', time: '7h ago',
          url: 'https://example.com/n5.jpg',
          scores: { phash: 63, orb: 68, clip: 67, combined: 66 },
          explanation: 'Meme-style text added in upper and lower thirds. Image further compressed from Reddit version.',
          children: []
        }
      ]
    }
  ]
}

export const PIPELINE_STEPS = [
  { id: 'upload',    label: 'Upload & Validate',      desc: 'MIME check · UUID assign · S3 storage',    duration: 600 },
  { id: 'phash',     label: 'Perceptual Hash',         desc: 'pHash 64-bit fingerprint computed',         duration: 700 },
  { id: 'orb',       label: 'ORB Feature Extraction',  desc: '847 keypoints detected & described',        duration: 900 },
  { id: 'clip',      label: 'CLIP Embedding',          desc: '512-dimensional semantic vector',           duration: 1100 },
  { id: 'match',     label: 'Similarity Search',       desc: 'Score fusion across candidate index',       duration: 800 },
  { id: 'tree',      label: 'Propagation Tree',        desc: 'DAG constructed · 7 nodes · 2 infringing',  duration: 600 },
]
