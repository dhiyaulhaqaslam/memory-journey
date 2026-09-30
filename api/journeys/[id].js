import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({
        error: 'Method not allowed'
      })
    }

    const { id } = req.query

    const result = await sql`
      SELECT data
      FROM journeys
      WHERE id = ${id}::uuid
      LIMIT 1
    `

    if (result.length === 0) {
      return res.status(404).json({
        error: 'Cerita tidak ditemukan.'
      })
    }

    return res.status(200).json(result[0].data)
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      error: 'Gagal mengambil cerita.'
    })
  }
}