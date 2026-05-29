import { and, asc, desc, eq, sql } from 'drizzle-orm'
import type { MalwareEntry, PendingCorrection, PendingSubmission } from '@tyrantware/shared'
import {
  corrections,
  malwareEntries,
  malwareEntryImages,
  submissionTraces,
  submissionImages,
  submissions
} from './schema'
import { getDb } from './db'

type ImageInput = {
  filename: string
  mimeType: string
  imageData: string
}

const withUrl = (base: string, image: any) => ({
  id: image.id,
  filename: image.filename,
  mime_type: image.mimeType || image.mime_type,
  url: `${base}/api/public-images/${image.id}`
})

const asDataUrl = (image: { imageData: string; mimeType: string }) =>
  `data:${image.mimeType};base64,${image.imageData}`

type EntryImageRow = {
  id: number
  filename: string
  mimeType: string
  imageData: string
}

type SubmissionRow = {
  id: number
  vendor: string
  softwareName: string
  malwareCategory: string
  description: string
  evidenceUrls: string
  status: string
  adminNote: string
  createdAt: string
  updatedAt: string
}

type CorrectionRow = {
  id: number
  vendor: string
  softwareName: string
  description: string
  evidenceUrls: string
  status: string
  adminNote: string
  createdAt: string
  updatedAt: string
}

type MalwareRow = {
  id: number
  vendor: string
  softwareName: string
  malwareCategory: string
  description: string
  evidenceUrls: string
  createdAt: string
  updatedAt: string
}

export const createSubmission = async (
  payload: {
    vendor: string
    softwareName: string
    malwareCategory: string
    description: string
    evidenceUrls: string
    images: ImageInput[]
  }
) => {
  const db = await getDb()
  const result = await db
    .insert(submissions)
    .values({
      vendor: payload.vendor,
      softwareName: payload.softwareName,
      malwareCategory: payload.malwareCategory,
      description: payload.description,
      evidenceUrls: payload.evidenceUrls
    })
    .returning({ id: submissions.id })

  const id = result[0]?.id
  if (!id) throw new Error('提交创建失败。')
  if (payload.images.length) {
    await db.insert(submissionImages).values(
      payload.images.map((image) => ({
        submissionId: id,
        mimeType: image.mimeType,
        filename: image.filename,
        imageData: image.imageData
      }))
    )
  }
  return id
}

export const deleteSubmission = async (id: number) => {
  const db = await getDb()
  await db.delete(submissionImages).where(eq(submissionImages.submissionId, id))
  await db.delete(submissionTraces).where(eq(submissionTraces.submissionId, id))
  await db.delete(submissions).where(eq(submissions.id, id))
}

export const createCorrection = async (
  payload: {
    vendor: string
    softwareName: string
    description: string
    evidenceUrls: string
  }
) => {
  const db = await getDb()
  const hit = await db
    .select({ id: malwareEntries.id })
    .from(malwareEntries)
    .where(
      and(
        sql`lower(${malwareEntries.vendor}) = lower(${payload.vendor})`,
        sql`lower(${malwareEntries.softwareName}) = lower(${payload.softwareName})`
      )
    )
    .limit(1)

  if (!hit.length) {
    throw new Error('该厂商下的软件名称不在档案库中，不能提交更正请求。')
  }

  await db.insert(corrections).values(payload)
}

export const searchMalware = async (
  base: string,
  vendor: string,
  softwareName: string
): Promise<MalwareEntry | null> => {
  const db = await getDb()
  const rows = await db
    .select()
    .from(malwareEntries)
    .where(
      and(
        sql`lower(${malwareEntries.vendor}) = lower(${vendor})`,
        sql`lower(${malwareEntries.softwareName}) = lower(${softwareName})`
      )
    )
    .limit(1)

  const row = rows[0]
  if (!row) return null
  const images = await db
    .select()
    .from(malwareEntryImages)
    .where(eq(malwareEntryImages.malwareEntryId, row.id))
    .orderBy(asc(malwareEntryImages.id))

  return {
    id: row.id,
    vendor: row.vendor,
    software_name: row.softwareName,
    malware_category: row.malwareCategory,
    description: row.description,
    evidence_urls: row.evidenceUrls,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    images: images.map((image: EntryImageRow) => withUrl(base, image))
  }
}

export const listPendingSubmissions = async (): Promise<PendingSubmission[]> => {
  const db = await getDb()
  const rows = await db
    .select()
    .from(submissions)
    .where(eq(submissions.status, 'pending'))
    .orderBy(asc(submissions.createdAt), asc(submissions.id))

  return Promise.all(
    rows.map(async (row: SubmissionRow) => {
      const images = await db
        .select()
        .from(submissionImages)
        .where(eq(submissionImages.submissionId, row.id))
        .orderBy(asc(submissionImages.id))

      return {
        id: row.id,
        vendor: row.vendor,
        software_name: row.softwareName,
        malware_category: row.malwareCategory,
        description: row.description,
        evidence_urls: row.evidenceUrls,
        status: row.status,
        admin_note: row.adminNote,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
        images: images.map((image: EntryImageRow) => ({
          id: image.id,
          filename: image.filename,
          mime_type: image.mimeType,
          url: asDataUrl(image)
        }))
      }
    })
  )
}

export const listPendingCorrections = async (): Promise<PendingCorrection[]> => {
  const db = await getDb()
  const rows = await db
    .select()
    .from(corrections)
    .where(eq(corrections.status, 'pending'))
    .orderBy(asc(corrections.createdAt), asc(corrections.id))

  return rows.map((row: CorrectionRow) => ({
    id: row.id,
    vendor: row.vendor,
    software_name: row.softwareName,
    description: row.description,
    evidence_urls: row.evidenceUrls,
    status: row.status,
    admin_note: row.adminNote,
    created_at: row.createdAt,
    updated_at: row.updatedAt
  }))
}

export const listMalwareEntries = async (): Promise<MalwareEntry[]> => {
  const db = await getDb()
  const rows = await db
    .select()
    .from(malwareEntries)
    .orderBy(desc(malwareEntries.updatedAt), desc(malwareEntries.id))

  return Promise.all(
    rows.map(async (row: MalwareRow) => {
      const images = await db
        .select()
        .from(malwareEntryImages)
        .where(eq(malwareEntryImages.malwareEntryId, row.id))
        .orderBy(asc(malwareEntryImages.id))

      return {
        id: row.id,
        vendor: row.vendor,
        software_name: row.softwareName,
        malware_category: row.malwareCategory,
        description: row.description,
        evidence_urls: row.evidenceUrls,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
        images: images.map((image: EntryImageRow) => ({
          id: image.id,
          filename: image.filename,
          mime_type: image.mimeType,
          url: asDataUrl(image)
        }))
      }
    })
  )
}

export const approveSubmission = async (
  id: number,
  adminNote: string,
  malwareCategory: string
) => {
  const db = await getDb()
  const rows = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.id, id), eq(submissions.status, 'pending')))
    .limit(1)

  const submission = rows[0]
  if (!submission) return false

  const images = await db
    .select()
    .from(submissionImages)
    .where(eq(submissionImages.submissionId, id))
    .orderBy(asc(submissionImages.id))

  const existing = await db
    .select({ id: malwareEntries.id })
    .from(malwareEntries)
    .where(
      and(
        sql`lower(${malwareEntries.vendor}) = lower(${submission.vendor})`,
        sql`lower(${malwareEntries.softwareName}) = lower(${submission.softwareName})`
      )
    )
    .limit(1)

  let entryId = existing[0]?.id

  if (entryId) {
    await db
      .update(malwareEntries)
      .set({
        malwareCategory,
        description: submission.description,
        evidenceUrls: submission.evidenceUrls,
        sourceSubmissionId: submission.id,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(malwareEntries.id, entryId))
  } else {
    const created = await db
      .insert(malwareEntries)
      .values({
        vendor: submission.vendor,
        softwareName: submission.softwareName,
        malwareCategory,
        description: submission.description,
        evidenceUrls: submission.evidenceUrls,
        sourceSubmissionId: submission.id
      })
      .returning({ id: malwareEntries.id })
    entryId = created[0]?.id
  }

  if (!entryId) return false

  await db
    .delete(malwareEntryImages)
    .where(eq(malwareEntryImages.malwareEntryId, entryId))

  if (images.length) {
    await db.insert(malwareEntryImages).values(
      images.map((image: EntryImageRow) => ({
        malwareEntryId: entryId!,
        mimeType: image.mimeType,
        filename: image.filename,
        imageData: image.imageData
      }))
    )
  }

  await db
    .update(submissions)
    .set({
      status: 'approved',
      adminNote: adminNote.trim(),
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(submissions.id, id))

  return true
}

export const rejectSubmission = async (id: number, adminNote: string) => {
  const db = await getDb()
  const result = await db
    .update(submissions)
    .set({
      status: 'rejected',
      adminNote: adminNote.trim(),
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(and(eq(submissions.id, id), eq(submissions.status, 'pending')))
    .returning({ id: submissions.id })

  return Boolean(result[0]?.id)
}

export const approveCorrection = async (id: number, adminNote: string) => {
  const db = await getDb()
  const rows = await db
    .select()
    .from(corrections)
    .where(and(eq(corrections.id, id), eq(corrections.status, 'pending')))
    .limit(1)

  const correction = rows[0]
  if (!correction) return false

  const hits = await db
    .select({ id: malwareEntries.id })
    .from(malwareEntries)
    .where(
      and(
        sql`lower(${malwareEntries.vendor}) = lower(${correction.vendor})`,
        sql`lower(${malwareEntries.softwareName}) = lower(${correction.softwareName})`
      )
    )

  for (const hit of hits) {
    await db
      .delete(malwareEntryImages)
      .where(eq(malwareEntryImages.malwareEntryId, hit.id))
  }

  await db
    .delete(malwareEntries)
    .where(
      and(
        sql`lower(${malwareEntries.vendor}) = lower(${correction.vendor})`,
        sql`lower(${malwareEntries.softwareName}) = lower(${correction.softwareName})`
      )
    )

  await db
    .update(corrections)
    .set({
      status: 'approved',
      adminNote: adminNote.trim(),
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(corrections.id, id))

  return true
}

export const rejectCorrection = async (id: number, adminNote: string) => {
  const db = await getDb()
  const result = await db
    .update(corrections)
    .set({
      status: 'rejected',
      adminNote: adminNote.trim(),
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(and(eq(corrections.id, id), eq(corrections.status, 'pending')))
    .returning({ id: corrections.id })

  return Boolean(result[0]?.id)
}

export const deleteMalwareEntry = async (id: number) => {
  const db = await getDb()
  await db
    .delete(malwareEntryImages)
    .where(eq(malwareEntryImages.malwareEntryId, id))
  const result = await db
    .delete(malwareEntries)
    .where(eq(malwareEntries.id, id))
    .returning({ id: malwareEntries.id })
  return Boolean(result[0]?.id)
}

export const readSubmissionImage = async (id: number) => {
  const db = await getDb()
  const rows = await db
    .select({
      id: submissionImages.id,
      filename: submissionImages.filename,
      mimeType: submissionImages.mimeType,
      imageData: submissionImages.imageData
    })
    .from(submissionImages)
    .innerJoin(submissions, eq(submissions.id, submissionImages.submissionId))
    .where(and(eq(submissionImages.id, id), eq(submissions.status, 'pending')))
    .limit(1)

  return rows[0] || null
}

export const readMalwareImage = async (id: number) => {
  const db = await getDb()
  const rows = await db
    .select({
      id: malwareEntryImages.id,
      filename: malwareEntryImages.filename,
      mimeType: malwareEntryImages.mimeType,
      imageData: malwareEntryImages.imageData
    })
    .from(malwareEntryImages)
    .where(eq(malwareEntryImages.id, id))
    .limit(1)

  return rows[0] || null
}
