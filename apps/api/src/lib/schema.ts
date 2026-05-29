import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

const currentTimestamp = sql`CURRENT_TIMESTAMP`

export const malwareEntries = sqliteTable(
  'malware_entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    vendor: text('vendor').notNull(),
    softwareName: text('software_name').notNull(),
    malwareCategory: text('malware_category').notNull(),
    description: text('description').notNull(),
    evidenceUrls: text('evidence_urls').notNull().default(''),
    sourceSubmissionId: integer('source_submission_id'),
    createdAt: text('created_at').notNull().default(currentTimestamp),
    updatedAt: text('updated_at').notNull().default(currentTimestamp)
  },
  (table) => [
    uniqueIndex('idx_malware_unique').on(table.vendor, table.softwareName),
    index('idx_malware_lookup').on(table.vendor, table.softwareName),
    index('idx_malware_updated').on(table.updatedAt, table.id),
    index('idx_malware_category').on(table.malwareCategory)
  ]
)

export const submissions = sqliteTable(
  'submissions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    vendor: text('vendor').notNull(),
    softwareName: text('software_name').notNull(),
    malwareCategory: text('malware_category').notNull(),
    description: text('description').notNull(),
    evidenceUrls: text('evidence_urls').notNull().default(''),
    status: text('status').notNull().default('pending'),
    adminNote: text('admin_note').notNull().default(''),
    createdAt: text('created_at').notNull().default(currentTimestamp),
    updatedAt: text('updated_at').notNull().default(currentTimestamp)
  },
  (table) => [index('idx_submissions_status_created').on(table.status, table.createdAt, table.id)]
)

export const submissionImages = sqliteTable(
  'submission_images',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    submissionId: integer('submission_id').notNull(),
    mimeType: text('mime_type').notNull(),
    filename: text('filename').notNull(),
    imageData: text('image_data').notNull(),
    createdAt: text('created_at').notNull().default(currentTimestamp)
  },
  (table) => [index('idx_submission_images_submission_id').on(table.submissionId, table.id)]
)

export const malwareEntryImages = sqliteTable(
  'malware_entry_images',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    malwareEntryId: integer('malware_entry_id').notNull(),
    mimeType: text('mime_type').notNull(),
    filename: text('filename').notNull(),
    imageData: text('image_data').notNull(),
    createdAt: text('created_at').notNull().default(currentTimestamp)
  },
  (table) => [
    index('idx_malware_entry_images_entry_id').on(table.malwareEntryId, table.id)
  ]
)

export const corrections = sqliteTable(
  'corrections',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    vendor: text('vendor').notNull(),
    softwareName: text('software_name').notNull(),
    description: text('description').notNull(),
    evidenceUrls: text('evidence_urls').notNull().default(''),
    status: text('status').notNull().default('pending'),
    adminNote: text('admin_note').notNull().default(''),
    createdAt: text('created_at').notNull().default(currentTimestamp),
    updatedAt: text('updated_at').notNull().default(currentTimestamp)
  },
  (table) => [index('idx_corrections_status_created').on(table.status, table.createdAt, table.id)]
)

export const submissionTraces = sqliteTable(
  'submission_traces',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    submissionId: integer('submission_id').notNull(),
    payload: text('payload').notNull(),
    createdAt: text('created_at').notNull().default(currentTimestamp)
  },
  (table) => [index('idx_submission_traces_submission_id').on(table.submissionId, table.id)]
)

export const rateLimitEvents = sqliteTable(
  'rate_limit_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    scope: text('scope').notNull(),
    clientIp: text('client_ip').notNull(),
    requestKey: text('request_key').notNull(),
    createdAt: integer('created_at').notNull()
  },
  (table) => [
    index('idx_rate_limit_scope_ip_time').on(table.scope, table.clientIp, table.createdAt),
    index('idx_rate_limit_request_key').on(table.requestKey)
  ]
)
