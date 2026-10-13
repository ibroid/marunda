import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const page = query.page && !isNaN(Number(query.page)) && Number(query.page) > 0 ? Number(query.page) : 1
  const limit = query.limit && !isNaN(Number(query.limit)) && Number(query.limit) > 0 ? Math.min(100, Number(query.limit)) : 10
  const offset = (page - 1) * limit

  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  try {
    const [countQuery, daftar] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(p.perkara_id) AS total
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_ikrar_talak it ON p.perkara_id = it.perkara_id
        WHERE p.jenis_perkara_id = 346
          AND pp.tanggal_bht >= '${startDate}' AND pp.tanggal_bht <= '${endDate}'
          AND (it.tgl_ikrar_talak IS NULL)
      `),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.para_pihak,
          pp.tanggal_putusan,
          pp.tanggal_bht
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_ikrar_talak it ON p.perkara_id = it.perkara_id
        WHERE p.jenis_perkara_id = 346
          AND pp.tanggal_bht >= '${startDate}' AND pp.tanggal_bht <= '${endDate}'
          AND (it.tgl_ikrar_talak IS NULL)
        ORDER BY pp.tanggal_bht DESC
        LIMIT ${limit} OFFSET ${offset}
      `)
    ])

    const total = Number(countQuery[0]?.total || 0)

    return serializeBigInt({
      success: true,
      year,
      page,
      limit,
      total,
      daftar
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil data Cerai Talak belum Ikrar Talak'
    }
  }
})
