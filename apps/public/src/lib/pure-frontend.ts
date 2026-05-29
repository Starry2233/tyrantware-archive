import type { MalwareEntry } from '@tyrantware/shared'

export const isPureFrontend = () => import.meta.env.VITE_PURE_FRONTEND === 'true'

const ghRepo = () => import.meta.env.VITE_GH_REPO || ''

const prBranch = () => import.meta.env.VITE_GH_BRANCH || 'main'

const timestamp = () => {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

const sanitizeFilename = (name: string) =>
  name.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fff]/g, '_').toLowerCase()

export const buildSubmissionYaml = (data: {
  vendor: string
  software_name: string
  malware_category: string
  description: string
  evidence_urls: string
}) => `# Tyrantware Archive Submission
# Created at: ${new Date().toISOString()}

vendor: ${data.vendor}
software_name: ${data.software_name}
malware_category: ${data.malware_category}
description: |-
${data.description.split('\n').map((l) => '  ' + l).join('\n')}
evidence_urls: ${data.evidence_urls}
`

export const buildCorrectionYaml = (data: {
  vendor: string
  software_name: string
  description: string
  evidence_urls: string
}) => `# Tyrantware Archive Correction Request
# Created at: ${new Date().toISOString()}

vendor: ${data.vendor}
software_name: ${data.software_name}
description: |-
${data.description.split('\n').map((l) => '  ' + l).join('\n')}
evidence_urls: ${data.evidence_urls}
`

export const buildPrUrl = (filename: string) => {
  const repo = ghRepo()
  if (!repo) return null
  return `https://github.com/${repo}/new/${prBranch()}/data/submissions/?filename=${encodeURIComponent(filename)}`
}

export const buildSubmissionFilename = (vendor: string, softwareName: string) =>
  `submit-${sanitizeFilename(vendor)}-${sanitizeFilename(softwareName)}-${timestamp()}.yml`

export const buildCorrectionFilename = (vendor: string, softwareName: string) =>
  `correction-${sanitizeFilename(vendor)}-${sanitizeFilename(softwareName)}-${timestamp()}.yml`

export const loadStaticEntries = async (base: string): Promise<MalwareEntry[]> => {
  try {
    const response = await fetch(`${base}data/entries.json`)
    if (!response.ok) return []
    return (await response.json()) as MalwareEntry[]
  } catch {
    return []
  }
}
