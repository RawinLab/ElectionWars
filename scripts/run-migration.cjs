#!/usr/bin/env node
/**
 * Run SQL migration on Supabase PostgreSQL database
 */
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function runMigration() {
  const migrationFile = process.argv[2]

  if (!migrationFile) {
    console.error('Usage: node run-migration.js <migration-file.sql>')
    process.exit(1)
  }

  const fullPath = path.resolve(migrationFile)

  if (!fs.existsSync(fullPath)) {
    console.error(`Migration file not found: ${fullPath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(fullPath, 'utf8')

  // Use direct database connection (not pooler)
  const client = new Client({
    host: 'db.gltmvgqbknslnkcortgu.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '8_U#hWbKEJL76i',
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('Connecting to database...')
    await client.connect()
    console.log('Connected successfully!')

    console.log(`Running migration: ${path.basename(migrationFile)}`)
    await client.query(sql)

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error.message)
    if (error.detail) console.error('Detail:', error.detail)
    if (error.hint) console.error('Hint:', error.hint)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()
