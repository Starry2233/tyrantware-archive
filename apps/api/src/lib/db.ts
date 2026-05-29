import { drizzle } from 'drizzle-orm/libsql/http'
import { sql } from 'drizzle-orm'
import { env } from './env'

let db: ReturnType<typeof drizzle> | null = null
let ready: Promise<void> | null = null

export const getDb = async () => {
  if (db) return db
  db = drizzle({
    connection: {
      url: env.databaseUrl,
      authToken: env.databaseAuthToken || undefined
    }
  })
  return db
}

export const initSchema = async () => {
  if (ready) return ready
  ready = (async () => {
    const db = await getDb()
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS malware_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor TEXT NOT NULL,
        software_name TEXT NOT NULL,
        malware_category TEXT NOT NULL,
        description TEXT NOT NULL,
        evidence_urls TEXT NOT NULL DEFAULT '',
        source_submission_id INTEGER,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(vendor, software_name)
      )
    `)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor TEXT NOT NULL,
        software_name TEXT NOT NULL,
        malware_category TEXT NOT NULL,
        description TEXT NOT NULL,
        evidence_urls TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        admin_note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS submission_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        filename TEXT NOT NULL,
        image_data TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS malware_entry_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        malware_entry_id INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        filename TEXT NOT NULL,
        image_data TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS corrections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor TEXT NOT NULL,
        software_name TEXT NOT NULL,
        description TEXT NOT NULL,
        evidence_urls TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        admin_note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS submission_traces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS rate_limit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scope TEXT NOT NULL,
        client_ip TEXT NOT NULL,
        request_key TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_malware_lookup
      ON malware_entries(vendor, software_name)
    `)
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_malware_updated
      ON malware_entries(updated_at, id)
    `)
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_malware_category
      ON malware_entries(malware_category)
    `)
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_submissions_status_created
      ON submissions(status, created_at, id)
    `)
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_corrections_status_created
      ON corrections(status, created_at, id)
    `)
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_submission_images_submission_id
      ON submission_images(submission_id, id)
    `)
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_malware_entry_images_entry_id
      ON malware_entry_images(malware_entry_id, id)
    `)
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_submission_traces_submission_id
      ON submission_traces(submission_id, id)
    `)
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_rate_limit_scope_ip_time
      ON rate_limit_events(scope, client_ip, created_at)
    `)
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_rate_limit_request_key
      ON rate_limit_events(request_key)
    `)
  })()
  return ready
}
