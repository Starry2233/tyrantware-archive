import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { env } from './env'
import { readAdminToken, signAdminToken, verifyAdmin } from './auth'
import { checkRate } from './rate'
import {
  approveCorrection,
  approveSubmission,
  createCorrection,
  createSubmission,
  deleteMalwareEntry,
  deleteSubmission,
  rejectCorrection,
  rejectSubmission,
  listMalwareEntries,
  listPendingCorrections,
  listPendingSubmissions,
  readMalwareImage,
  readSubmissionImage,
  searchMalware
} from './repo'
import {
  validateAgreement,
  validateDescription,
  validateEvidenceUrls,
  validateImages,
  validateMalwareCategory,
  validateSoftwareName,
  validateVendor
} from './validate'
import { writeTrace } from './trace'

const rateMessage = '请求过于频繁，请稍后再试。'

const bytesOf = (base64: string) =>
  typeof Buffer !== 'undefined'
    ? Buffer.from(base64, 'base64')
    : Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))

const fail = (message: string, status = 400) =>
  new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  })

const ok = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }
  })

const tooLarge = (request: Request) =>
  Number(request.headers.get('content-length') || '0') > env.maxContentLength

const replyError = (error: unknown, fallback: string) =>
  error instanceof Error && error.message === 'RATE_LIMIT'
    ? fail(rateMessage, 429)
    : fail(error instanceof Error ? error.message : fallback)

const auth = async (request: Request) => {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) throw new HTTPException(401, { message: '未登录。' })
  await readAdminToken(token)
}

const applyHeaders = (response: Response) => {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )
  return response
}

export const mountRoutes = (api: Hono) => {
  api.use('*', async (c, next) => {
    await next()
    applyHeaders(c.res)
  })

  api.use('/api/search', cors({ origin: '*' }))

  api.get('/api/public-images/:id', async (c) => {
    await checkRate('malware_image', 180, 300, c.req.raw)
    const image = await readMalwareImage(Number(c.req.param('id')))
    if (!image) throw new HTTPException(404)
    return new Response(bytesOf(image.imageData), {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'Content-Type': image.mimeType
      }
    })
  })

  api.get('/api/search', async (c) => {
    try {
      await checkRate('api_search', 60, 300, c.req.raw)
      const vendor = validateVendor(c.req.query('vendor') || '')
      const softwareName = validateSoftwareName(c.req.query('software_name') || '')
      const entry = await searchMalware(
        `${new URL(c.req.url).origin}`,
        vendor,
        softwareName
      )

      return ok(
        {
          success: true,
          found: Boolean(entry),
          query: { vendor, software_name: softwareName },
          entry
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=60, s-maxage=120'
          }
        }
      )
    } catch (error) {
      return replyError(error, '查询失败。')
    }
  })

  api.post('/api/search', async (c) => {
    try {
      await checkRate('api_search', 60, 300, c.req.raw)
      const body = await c.req.json()
      const vendor = validateVendor(String(body.vendor || ''))
      const softwareName = validateSoftwareName(String(body.software_name || ''))
      const entry = await searchMalware(
        `${new URL(c.req.url).origin}`,
        vendor,
        softwareName
      )

      return ok(
        {
          success: true,
          found: Boolean(entry),
          query: { vendor, software_name: softwareName },
          entry
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store'
          }
        }
      )
    } catch (error) {
      return replyError(error, '查询失败。')
    }
  })

  api.post('/api/submissions', async (c) => {
    try {
      if (tooLarge(c.req.raw)) return fail('请求体过大。', 413)
      await checkRate('submission', 10, 600, c.req.raw)
      const form = await c.req.formData()
      const vendor = validateVendor(String(form.get('vendor') || ''))
      const softwareName = validateSoftwareName(String(form.get('software_name') || ''))
      const malwareCategory = validateMalwareCategory(String(form.get('malware_category') || ''))
      const description = validateDescription(String(form.get('description') || ''))
      const evidenceUrls = validateEvidenceUrls(String(form.get('evidence_urls') || ''))
      validateAgreement(form.get('license_agreement')?.toString() || null)
      const images = await validateImages(form.getAll('images') as File[])

      const payload = {
        vendor,
        softwareName,
        malwareCategory,
        description,
        evidenceUrls,
        images
      }
      const id = await createSubmission(payload)

      try {
        await writeTrace(id, payload, c.req.raw)
      } catch (error) {
        await deleteSubmission(id)
        throw error
      }

      return ok({ success: true, message: '恶意软件记录已提交，等待管理员审核。' })
    } catch (error) {
      return replyError(error, '提交失败。')
    }
  })

  api.post('/api/corrections', async (c) => {
    try {
      if (tooLarge(c.req.raw)) return fail('请求体过大。', 413)
      await checkRate('correction', 10, 600, c.req.raw)
      const body = await c.req.json()
      const vendor = validateVendor(String(body.vendor || ''))
      const softwareName = validateSoftwareName(String(body.software_name || ''))
      const description = validateDescription(String(body.description || ''))
      const evidenceUrls = validateEvidenceUrls(String(body.evidence_urls || ''))
      validateAgreement(String(body.license_agreement || null))
      await createCorrection({ vendor, softwareName, description, evidenceUrls })
      return ok({ success: true, message: '更正请求已提交，等待管理员审核。' })
    } catch (error) {
      return replyError(error, '更正请求提交失败。')
    }
  })

  api.post('/api/admin/login', async (c) => {
    try {
      await checkRate('admin_login', 8, 300, c.req.raw)
      const body = await c.req.json()
      const username = String(body.username || '')
      const password = String(body.password || '')
      if (!(await verifyAdmin(username, password))) {
        return fail('账号或密码错误。', 401)
      }
      return ok(await signAdminToken())
    } catch (error) {
      return replyError(error, '登录失败。')
    }
  })

  api.post('/api/admin/logout', async (c) => {
    await auth(c.req.raw)
    return ok({ success: true })
  })

  api.get('/api/admin/dashboard', async (c) => {
    await auth(c.req.raw)
    return ok({
      submissions: await listPendingSubmissions(),
      corrections: await listPendingCorrections(),
      malwareEntries: await listMalwareEntries()
    })
  })

  api.post('/api/admin/submissions/:id/approve', async (c) => {
    await auth(c.req.raw)
    const body = await c.req.json()
    const id = Number(c.req.param('id'))
    const done = await approveSubmission(
      id,
      String(body.admin_note || ''),
      validateMalwareCategory(String(body.malware_category || ''))
    )
    return done
      ? ok({ success: true, message: `提交 #${id} 已通过并写入恶意软件档案库。` })
      : fail(`提交 #${id} 不存在或已处理。`, 404)
  })

  api.post('/api/admin/submissions/:id/reject', async (c) => {
    await auth(c.req.raw)
    const id = Number(c.req.param('id'))
    const body = await c.req.json()
    const done = await rejectSubmission(id, String(body.admin_note || ''))
    return done
      ? ok({ success: true, message: `提交 #${id} 已驳回。` })
      : fail(`提交 #${id} 不存在或已处理。`, 404)
  })

  api.post('/api/admin/corrections/:id/approve', async (c) => {
    await auth(c.req.raw)
    const id = Number(c.req.param('id'))
    const body = await c.req.json()
    const done = await approveCorrection(id, String(body.admin_note || ''))
    return done
      ? ok({ success: true, message: `更正请求 #${id} 已通过，档案记录已删除。` })
      : fail(`更正请求 #${id} 不存在或已处理。`, 404)
  })

  api.post('/api/admin/corrections/:id/reject', async (c) => {
    await auth(c.req.raw)
    const id = Number(c.req.param('id'))
    const body = await c.req.json()
    const done = await rejectCorrection(id, String(body.admin_note || ''))
    return done
      ? ok({ success: true, message: `更正请求 #${id} 已驳回。` })
      : fail(`更正请求 #${id} 不存在或已处理。`, 404)
  })

  api.post('/api/admin/malware/:id/delete', async (c) => {
    await auth(c.req.raw)
    const id = Number(c.req.param('id'))
    const done = await deleteMalwareEntry(id)
    return done
      ? ok({ success: true, message: `档案条目 #${id} 已删除。` })
      : fail(`档案条目 #${id} 不存在。`, 404)
  })

  api.get('/api/admin/submission-images/:id', async (c) => {
    await auth(c.req.raw)
    const image = await readSubmissionImage(Number(c.req.param('id')))
    if (!image) throw new HTTPException(404)
    return new Response(bytesOf(image.imageData), {
      headers: { 'Content-Type': image.mimeType }
    })
  })

  api.get('/api/admin/malware-images/:id', async (c) => {
    await auth(c.req.raw)
    const image = await readMalwareImage(Number(c.req.param('id')))
    if (!image) throw new HTTPException(404)
    return new Response(bytesOf(image.imageData), {
      headers: { 'Content-Type': image.mimeType }
    })
  })

  api.onError((error) => {
    if (error instanceof HTTPException) {
      return fail(error.message || '请求失败。', error.status)
    }
    return fail(error instanceof Error ? error.message : '服务器错误。', 500)
  })
}
