import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const page = query.page && !isNaN(Number(query.page)) && Number(query.page) > 0 ? Number(query.page) : 1
  const limit = query.limit && !isNaN(Number(query.limit)) && Number(query.limit) > 0 ? Math.min(100, Number(query.limit)) : 10
  const offset = (page - 1) * limit
  const q = typeof query.q === 'string' ? query.q.trim() : ''

  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  try {
    let searchCondition = ''
    if (q) {
      const safeQ = q.replace(/['"\\]/g, '')
      searchCondition = `AND (p.nomor_perkara LIKE '%${safeQ}%' OR p.para_pihak LIKE '%${safeQ}%' OR pn.nama_gelar LIKE '%${safeQ}%' OR pt.majelis_hakim_nama LIKE '%${safeQ}%')`
    }

    const [countResult, daftar] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(pp.perkara_id) AS total
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        LEFT JOIN panitera_pn pn ON pn.id = pt.panitera_pengganti_id
        WHERE pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi = '')
          ${searchCondition}
      `),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          p.para_pihak,
          pp.tanggal_putusan,
          DATEDIFF(CURDATE(), pp.tanggal_putusan) AS selisih_hari,
          pt.majelis_hakim_nama,
          pn.nama_gelar AS panitera_pengganti_nama
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        LEFT JOIN panitera_pn pn ON pn.id = pt.panitera_pengganti_id
        WHERE pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi = '')
          ${searchCondition}
        ORDER BY pp.tanggal_putusan DESC
        LIMIT ${limit} OFFSET ${offset}
      `)
    ])

    const total = Number(countResult[0]?.total || 0)

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
      message: error.message || 'Terjadi kesalahan saat mengambil daftar perkara belum minutasi'
    }
  }
})
