import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const kategori = typeof query.kategori === 'string' ? query.kategori.trim() : 'all'
  const page = query.page && !isNaN(Number(query.page)) && Number(query.page) > 0 ? Number(query.page) : 1
  const limit = query.limit && !isNaN(Number(query.limit)) && Number(query.limit) > 0 ? Math.min(100, Number(query.limit)) : 10
  const offset = (page - 1) * limit
  const q = typeof query.q === 'string' ? query.q.trim() : ''

  try {
    let kategoriCondition = ''
    if (kategori === '3_5_bulan') {
      kategoriCondition = 'AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) BETWEEN 91 AND 150'
    } else if (kategori === '5_6_bulan') {
      kategoriCondition = 'AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) BETWEEN 151 AND 180'
    } else if (kategori === '6_12_bulan') {
      kategoriCondition = 'AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) BETWEEN 181 AND 365'
    } else if (kategori === 'diatas_1_tahun') {
      kategoriCondition = 'AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) > 365'
    } else {
      // 'all' / default (> 90 hari)
      kategoriCondition = 'AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) >= 91'
    }

    let searchCondition = ''
    if (q) {
      const safeQ = q.replace(/['"\\]/g, '')
      searchCondition = `AND (
        p.nomor_perkara LIKE '%${safeQ}%'
        OR p.para_pihak LIKE '%${safeQ}%'
        OR p.jenis_perkara_nama LIKE '%${safeQ}%'
        OR pt.majelis_hakim_nama LIKE '%${safeQ}%'
        OR pn.nama_gelar LIKE '%${safeQ}%'
      )`
    }

    const baseWhere = `
      WHERE p.tanggal_pendaftaran >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
        AND NOT EXISTS (
          SELECT 1 FROM perkara_putusan pp
          WHERE pp.perkara_id = p.perkara_id AND pp.tanggal_putusan IS NOT NULL AND pp.tanggal_putusan != '0000-00-00'
        )
        ${kategoriCondition}
        ${searchCondition}
    `

    const [countResult, daftar] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(p.perkara_id) AS total
        FROM perkara p
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        LEFT JOIN panitera_pn pn ON pn.id = pt.panitera_pengganti_id
        ${baseWhere}
      `),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          p.para_pihak,
          p.tanggal_pendaftaran,
          DATEDIFF(CURDATE(), p.tanggal_pendaftaran) AS usia_hari,
          pt.majelis_hakim_nama,
          pn.nama_gelar AS panitera_pengganti_nama,
          p.proses_terakhir_text
        FROM perkara p
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        LEFT JOIN panitera_pn pn ON pn.id = pt.panitera_pengganti_id
        ${baseWhere}
        ORDER BY p.tanggal_pendaftaran ASC
        LIMIT ${limit} OFFSET ${offset}
      `)
    ])

    const total = Number(countResult[0]?.total || 0)

    return serializeBigInt({
      success: true,
      year,
      kategori,
      page,
      limit,
      total,
      daftar
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat detail perkara aging'
    }
  }
})
