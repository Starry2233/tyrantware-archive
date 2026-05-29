import {
  apiPaths,
  localizeTimeFields,
  type FlashMessage,
  type MalwareEntry,
  type SearchPayload
} from '@tyrantware/shared'
import { isPureFrontend, loadStaticEntries } from './pure-frontend'

const messageFrom = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const text = value.trim()
    return text || null
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return (
      messageFrom(record.message) ||
      messageFrom(record.error) ||
      messageFrom(record.cause) ||
      null
    )
  }

  return null
}

const textOf = async (response: Response) => {
  const payload = await response.json().catch(() => null)
  return messageFrom(payload) || '请求失败。'
}

export const publicApi = {
  async correction(body: Record<string, unknown>) {
    if (isPureFrontend()) {
      throw new Error('PURE_FRONTEND')
    }
    const response = await fetch(apiPaths.correction, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!response.ok) throw new Error(await textOf(response))
    return textOf(response)
  },
  async submit(form: FormData) {
    if (isPureFrontend()) {
      throw new Error('PURE_FRONTEND')
    }
    const response = await fetch(apiPaths.submission, {
      method: 'POST',
      body: form
    })
    if (!response.ok) throw new Error(await textOf(response))
    return textOf(response)
  },
  async search(vendor: string, softwareName: string) {
    if (isPureFrontend()) {
      const base = import.meta.env.BASE_URL || '/'
      const entries = await loadStaticEntries(base)

      let entry: MalwareEntry | null = null
      if (softwareName && vendor) {
        entry = entries.find(
          (e) => e.vendor === vendor && e.software_name === softwareName
        ) || null
      } else if (vendor) {
        entry = entries.find((e) => e.vendor === vendor) || null
      }

      return {
        success: true,
        found: Boolean(entry),
        query: { vendor, software_name: softwareName },
        entry: entry ? localizeTimeFields(entry) : null
      } as SearchPayload
    }
    const query = new URLSearchParams({ vendor, software_name: softwareName })
    const response = await fetch(`${apiPaths.search}?${query}`, {
      headers: { Accept: 'application/json' }
    })
    const payload = (await response.json()) as SearchPayload & { error?: unknown; message?: unknown }
    if (!response.ok || !payload.success) {
      throw new Error(messageFrom(payload) || '查询失败。')
    }
    return payload.entry
      ? { ...payload, entry: localizeTimeFields(payload.entry) }
      : payload
  }
}

export const messageOf = (kind: FlashMessage['kind'], message: string): FlashMessage => ({
  kind,
  message
})
