import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function GET() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  })

  try {
    const result = await pool.query(`
      SELECT id, email, username, "createdAt"
      FROM "User"
      ORDER BY "createdAt" DESC
    `)

    await pool.end()

    return NextResponse.json({
      total: result.rows.length,
      users: result.rows,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      db_url: process.env.DATABASE_URL?.split('@')[1] || 'hidden'
    }, { status: 500 })
  }
}
