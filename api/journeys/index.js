import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed'
      })
    }

    const journey = req.body

    if (!journey || typeof journey !== 'object') {
      return res.status(400).json({
        error: 'Data cerita tidak valid.'
      })
    }

    if (!journey.recipient || !Array.isArray(journey.memories)) {
      return res.status(400).json({
        error: 'Data cerita tidak lengkap.'
      })
    }

    const result = await sql`
      INSERT INTO journeys (data)
      VALUES (${JSON.stringify(journey)}::jsonb)
      RETURNING id
    `

    return res.status(201).json({
      id: result[0].id
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      error: 'Gagal menyimpan cerita.'
    })
  }
}