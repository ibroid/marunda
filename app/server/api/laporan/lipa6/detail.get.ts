import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const month = query.month && !isNaN(Number(query.month)) ? Number(query.month) : currentMonth
  const role = query.role === 'semua' ? 'semua' : 'ketua'
  const hakimId = query.hakim_id && !isNaN(Number(query.hakim_id)) ? Number(query.hakim_id) : null
  const kategori = (query.kategori as string) || 'semua'
  const alur = (query.alur as string) || 'all'
  const search = ((query.search as string) || '').trim()

  const page = query.page && !isNaN(Number(query.page)) ? Math.max(1, Number(query.page)) : 1
  const pageSize = query.pageSize !== undefined && !isNaN(Number(query.pageSize)) ? Number(query.pageSize) : 25
  const offset = (page - 1) * pageSize

  const monthStr = month < 10 ? `0${month}` : `${month}`
  const periode = `${year}-${monthStr}`
  const awalPeriode = `${periode}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const akhirPeriode = `${periode}-${String(lastDay).padStart(2, '0')}`

  try {
    let hakimCondition = ''
    if (hakimId) {
      hakimCondition = role === 'semua'
        ? `AND FIND_IN_SET('${hakimId}', pt.majelis_hakim_id) > 0`
        : `AND CAST(SUBSTRING_INDEX(pt.majelis_hakim_id, ',', 1) AS UNSIGNED) = ${hakimId}`
    }

    let alurCondition = ''
    if (alur === 'G') {
      alurCondition = `AND (p.alur_perkara_id IN (15, 17) OR p.nomor_perkara LIKE '%/Pdt.G/%')`
    } else if (alur === 'P') {
      alurCondition = `AND (p.alur_perkara_id = 16 OR p.nomor_perkara LIKE '%/Pdt.P/%')`
    }

    let kategoriCondition = ''
    if (kategori === 'sisa_lalu') {
      kategoriCondition = `
        AND pt.penetapan_majelis_hakim < '${awalPeriode}'
        AND (pp.tanggal_putusan IS NULL OR pp.tanggal_putusan >= '${awalPeriode}')
      `
    } else if (kategori === 'tambah') {
      kategoriCondition = `
        AND pt.penetapan_majelis_hakim >= '${awalPeriode}'
        AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
      `
    } else if (kategori === 'putus') {
      kategoriCondition = `
        AND pp.tanggal_putusan >= '${awalPeriode}'
        AND pp.tanggal_putusan <= '${akhirPeriode}'
        AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
      `
    } else if (kategori === 'sisa_ybs') {
      kategoriCondition = `
        AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
        AND (pp.tanggal_putusan IS NULL OR pp.tanggal_putusan > '${akhirPeriode}')
      `
    } else if (kategori === 'minutir') {
      kategoriCondition = `
        AND pp.tanggal_minutasi >= '${awalPeriode}'
        AND pp.tanggal_minutasi <= '${akhirPeriode}'
        AND pp.tanggal_minutasi != '0000-00-00'
        AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
      `
    } else if (kategori === 'belum_minutir') {
      kategoriCondition = `
        AND pp.tanggal_putusan IS NOT NULL
        AND pp.tanggal_putusan <= '${akhirPeriode}'
        AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi > '${akhirPeriode}')
        AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
      `
    } else {
      // Semua beban perkara bulan ini (sisa lalu + tambah bulan ini)
      kategoriCondition = `
        AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
        AND (pp.tanggal_putusan IS NULL OR pp.tanggal_putusan >= '${awalPeriode}')
      `
    }

    let searchCondition = ''
    if (search) {
      const escaped = search.replace(/['"\\]/g, '')
      searchCondition = `
        AND (
          p.nomor_perkara LIKE '%${escaped}%'
          OR p.jenis_perkara_nama LIKE '%${escaped}%'
          OR p.para_pihak LIKE '%${escaped}%'
          OR pt.majelis_hakim_nama LIKE '%${escaped}%'
        )
      `
    }

    const whereClause = `
      WHERE 1=1
      ${hakimCondition}
      ${alurCondition}
      ${kategoriCondition}
      ${searchCondition}
    `

    // Count Total
    const countSql = `
      SELECT COUNT(DISTINCT p.perkara_id) AS total
      FROM perkara_penetapan pt
      JOIN perkara p ON p.perkara_id = pt.perkara_id
      LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
      ${whereClause}
    `
    const countRes = await prisma.$queryRawUnsafe<any[]>(countSql).catch(() => [{ total: 0 }])
    const total = Number(countRes[0]?.total || 0)

    // Data List
    const limitClause = pageSize > 0 ? `LIMIT ${pageSize} OFFSET ${offset}` : ''
    const listSql = `
      SELECT
        p.perkara_id,
        p.nomor_perkara,
        p.jenis_perkara_nama,
        p.tanggal_pendaftaran,
        p.alur_perkara_id,
        p.para_pihak,
        pt.penetapan_majelis_hakim,
        pt.majelis_hakim_nama,
        pp.tanggal_putusan,
        pp.tanggal_minutasi,
        pp.amar_putusan,
        CASE
          WHEN pp.tanggal_putusan IS NOT NULL AND pp.tanggal_minutasi IS NOT NULL AND pp.tanggal_minutasi != '0000-00-00' THEN 'Sudah Minutasi'
          WHEN pp.tanggal_putusan IS NOT NULL THEN 'Putus Belum Minutasi'
          ELSE 'Dalam Pemeriksaan'
        END AS status_tahapan
      FROM perkara_penetapan pt
      JOIN perkara p ON p.perkara_id = pt.perkara_id
      LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
      ${whereClause}
      ORDER BY p.tanggal_pendaftaran DESC, p.perkara_id DESC
      ${limitClause}
    `

    const listRes = await prisma.$queryRawUnsafe<any[]>(listSql).catch((err) => {
      console.error('Error detail LIPA 6:', err)
      return []
    })

    return serializeBigInt({
      success: true,
      total,
      page,
      pageSize,
      totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 1,
      data: listRes
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat detail perkara LIPA 6',
      total: 0,
      data: []
    }
  }
})
