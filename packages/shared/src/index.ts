export const vendors = [
  '微软', '苹果', '谷歌', 'Adobe', '亚马逊', 'Meta',
  '惠普', '三星', '特斯拉', '索尼', '任天堂', '高通',
  '腾讯', '阿里巴巴', '百度', '字节跳动', '华为', '小米',
  '京东', '美团', '网易', '滴滴', '360', '中兴',
  '联想', 'OPPO', 'vivo', '步步高', '小天才'
] as const

export const malwareCategories = [
  '监视', '后门', 'DRM', '诈骗', '欺骗', '强制',
  '成瘾', '审查', '掩盖', '不兼容', '不安全', '干扰',
  '监狱', '操纵', '过时', '破坏', '订阅', '束缚', '独裁'
] as const

export const imageTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
] as const

export const apiPaths = {
  submission: '/api/submissions',
  correction: '/api/corrections',
  adminMalware: '/api/admin/malware',
  adminDashboard: '/api/admin/dashboard',
  adminLogin: '/api/admin/login',
  adminLogout: '/api/admin/logout',
  adminImages: '/api/admin',
  search: '/api/search'
} as const

export type Vendor = (typeof vendors)[number]
export type MalwareCategory = (typeof malwareCategories)[number]

export type SearchQuery = {
  vendor: string
  software_name: string
}

export type ImageItem = {
  id: number
  filename: string
  mime_type: string
  url: string
}

export type MalwareEntry = {
  id: number
  vendor: string
  software_name: string
  malware_category: string
  description: string
  evidence_urls: string
  created_at: string
  updated_at: string
  images: ImageItem[]
}

export type SearchPayload = {
  success: boolean
  found: boolean
  query: SearchQuery
  entry: MalwareEntry | null
}

export type ApiError = {
  success: false
  error: string
}

export type SubmissionImage = {
  id: number
  filename: string
  mime_type: string
  url: string
}

export type PendingSubmission = {
  id: number
  vendor: string
  software_name: string
  malware_category: string
  description: string
  evidence_urls: string
  status: string
  admin_note: string
  created_at: string
  updated_at: string
  images: SubmissionImage[]
}

export type PendingCorrection = {
  id: number
  vendor: string
  software_name: string
  description: string
  evidence_urls: string
  status: string
  admin_note: string
  created_at: string
  updated_at: string
}

export type DashboardPayload = {
  submissions: PendingSubmission[]
  corrections: PendingCorrection[]
  malwareEntries: MalwareEntry[]
}

export type AuthPayload = {
  token: string
  expiresAt: string
}

export type FlashKind = 'success' | 'error'

export type FlashMessage = {
  kind: FlashKind
  message: string
}

const localTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'medium'
})

type TimeFields = {
  created_at?: string
  updated_at?: string
}

const formatLocalTime = (value: string) => {
  const iso = value.replace(' ', 'T')
  const utc = /(?:Z|[+-]\d\d:\d\d)$/.test(iso) ? iso : `${iso}Z`
  const date = new Date(utc)
  return Number.isNaN(date.getTime()) ? value : localTimeFormat.format(date)
}

export const localizeTimeFields = <T extends TimeFields>(value: T): T => {
  const localized = { ...value } as T & Record<keyof TimeFields, string | undefined>

  if (typeof value.created_at === 'string') {
    localized.created_at = formatLocalTime(value.created_at)
  }
  if (typeof value.updated_at === 'string') {
    localized.updated_at = formatLocalTime(value.updated_at)
  }

  return localized
}
