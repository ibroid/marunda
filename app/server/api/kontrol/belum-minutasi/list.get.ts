import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawYear = query.year
  const aging = typeof query.aging === 'string' ? query.aging.trim() : 'all'
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const sort = typeof query.sort === 'string' ? query.sort.trim() : 'putusan_desc'
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 25))
  const offset = (page - 1) * limit

  try {
    let yearCondition = ''
    if (rawYear && rawYear !== 'all' && !isNaN(Number(rawYear)) && Number(rawYear) > 0) {
      yearCondition = `AND YEAR(pp.tanggal_putusan) = ${Number(rawYear)}`
    }

    let agingCondition = ''
    if (aging === 'satu_hari') {
      agingCondition = 'AND DATEDIFF(CURDATE(), pp.tanggal_putusan) <= 1'
    } else if (aging === 'aman') {
      agingCondition = 'AND DATEDIFF(CURDATE(), pp.tanggal_putusan) <= 7'
    } else if (aging === 'atensi') {
      agingCondition = 'AND DATEDIFF(CURDATE(), pp.tanggal_putusan) > 7 AND DATEDIFF(CURDATE(), pp.tanggal_putusan) <= 14'
    } else if (aging === 'terlambat') {
      agingCondition = 'AND DATEDIFF(CURDATE(), pp.tanggal_putusan) > 14'
    }

    let searchCondition = ''
    if (search) {
      const safeQ = search.replace(/['"\\]/g, '')
      searchCondition = `AND (
        p.nomor_perkara LIKE '%${safeQ}%'
        OR p.para_pihak LIKE '%${safeQ}%'
        OR p.jenis_perkara_nama LIKE '%${safeQ}%'
        OR pt.majelis_hakim_nama LIKE '%${safeQ}%'
        OR pn.nama_gelar LIKE '%${safeQ}%'
        OR js.nama_gelar LIKE '%${safeQ}%'
      )`
    }

    let orderByClause = 'ORDER BY pp.tanggal_putusan DESC, pp.perkara_id DESC'
    if (sort === 'putusan_asc') {
      orderByClause = 'ORDER BY pp.tanggal_putusan ASC, pp.perkara_id ASC'
    } else if (sort === 'hari_desc') {
      orderByClause = 'ORDER BY DATEDIFF(CURDATE(), pp.tanggal_putusan) DESC, pp.tanggal_putusan ASC'
    } else if (sort === 'hari_asc') {
      orderByClause = 'ORDER BY DATEDIFF(CURDATE(), pp.tanggal_putusan) ASC, pp.tanggal_putusan DESC'
    } else if (sort === 'nomor_asc') {
      orderByClause = 'ORDER BY p.nomor_perkara ASC'
    }

    const whereClause = `
      WHERE pp.tanggal_putusan IS NOT NULL
        AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi = '')
        ${yearCondition}
        ${agingCondition}
        ${searchCondition}
    `

    const [countResult, items] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(pp.perkara_id) AS total
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        LEFT JOIN panitera_pn pn ON pn.id = pt.panitera_pengganti_id
        LEFT JOIN jurusita js ON js.id = pt.jurusita_id
        ${whereClause}
      `),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          p.para_pihak,
          p.tanggal_pendaftaran,
          pp.tanggal_putusan,
          pp.tanggal_minutasi,
          COALESCE(sp.nama, pp.status_putusan_nama, '-') AS status_putusan_nama,
          DATEDIFF(CURDATE(), pp.tanggal_putusan) AS selisih_hari,
          pt.majelis_hakim_nama,
          pn.nama_gelar AS panitera_pengganti_nama,
          js.nama_gelar AS jurusita_nama
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        LEFT JOIN status_putusan sp ON sp.id = pp.status_putusan_id
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        LEFT JOIN panitera_pn pn ON pn.id = pt.panitera_pengganti_id
        LEFT JOIN jurusita js ON js.id = pt.jurusita_id
        ${whereClause}
        ${orderByClause}
        LIMIT ${limit} OFFSET ${offset}
      `)
    ])

    const total = Number(countResult[0]?.total || 0)
    const totalPages = Math.ceil(total / limit)

    return serializeBigInt({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages
      },
      items
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil daftar perkara belum minutasi'
    }
  }
})
