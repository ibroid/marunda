import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const month = query.month && !isNaN(Number(query.month)) ? Number(query.month) : currentMonth

  const monthStr = month < 10 ? `0${month}` : `${month}`
  const periode = `${year}-${monthStr}`

  const alur = (query.alur as string) || 'all'
  const search = ((query.search as string) || '').trim()

  const page = query.page && !isNaN(Number(query.page)) ? Math.max(1, Number(query.page)) : 1
  const pageSize = query.pageSize !== undefined && !isNaN(Number(query.pageSize)) ? Number(query.pageSize) : 25

  try {
    let alurCondition = 'AND perkara.alur_perkara_id IN (15, 16, 17)'
    if (alur === '15' || alur === '16' || alur === '17') {
      alurCondition = `AND perkara.alur_perkara_id = ${alur}`
    }

    let searchCondition = ''
    if (search) {
      const escaped = search.replace(/['"\\]/g, '')
      searchCondition = `
        AND (
          perkara.nomor_perkara LIKE '%${escaped}%'
          OR perkara.jenis_perkara_nama LIKE '%${escaped}%'
          OR perkara_penetapan.majelis_hakim_text LIKE '%${escaped}%'
          OR perkara_penetapan.panitera_pengganti_text LIKE '%${escaped}%'
          OR status_putusan.nama LIKE '%${escaped}%'
        )
      `
    }

    // 1. Kueri Hitung Total
    const countSql = `
      SELECT COUNT(DISTINCT perkara.perkara_id) AS total
      FROM perkara
      LEFT JOIN perkara_penetapan ON perkara_penetapan.perkara_id = perkara.perkara_id
      LEFT JOIN perkara_putusan ON perkara_putusan.perkara_id = perkara.perkara_id
      LEFT JOIN status_putusan ON status_putusan.id = perkara_putusan.status_putusan_id
      WHERE (
        LEFT(perkara.tanggal_pendaftaran, 7) <= '${periode}'
        AND (perkara_putusan.tanggal_putusan IS NULL OR LEFT(perkara_putusan.tanggal_putusan, 7) >= '${periode}')
      )
      ${alurCondition}
      ${searchCondition}
    `

    const countRes = await prisma.$queryRawUnsafe<any[]>(countSql).catch((err) => {
      console.error('Error count LIPA 1:', err)
      return [{ total: 0 }]
    })
    const total = Number(countRes[0]?.total || 0)

    // 2. Kueri Data List
    let paginationClause = ''
    if (pageSize > 0) {
      const offset = (page - 1) * pageSize
      paginationClause = `LIMIT ${pageSize} OFFSET ${offset}`
    }

    const dataSql = `
      SELECT
        perkara.perkara_id,
        perkara.alur_perkara_id AS alur_perkara_id,
        perkara.nomor_perkara AS nomor_perkara,
        perkara.jenis_perkara_nama AS kode_perkara,
        IF(LEFT(perkara_penetapan.penetapan_majelis_hakim, 7) > '${periode}', '', perkara_penetapan.majelis_hakim_text) AS majelis_hakim,
        SUBSTRING_INDEX(perkara_penetapan.panitera_pengganti_text, ': ', -1) AS panitera_pengganti,
        perkara.tanggal_pendaftaran AS tanggal_pendaftaran,
        IF(LEFT(perkara_penetapan.penetapan_majelis_hakim, 7) > '${periode}', '', perkara_penetapan.penetapan_majelis_hakim) AS pmh,
        IF(LEFT(perkara_penetapan.penetapan_hari_sidang, 7) > '${periode}', '', perkara_penetapan.penetapan_hari_sidang) AS phs,
        IF(LEFT(perkara_penetapan.penetapan_hari_sidang, 7) > '${periode}', '', perkara_penetapan.sidang_pertama) AS sidang_pertama,
        IF(LEFT(perkara_putusan.tanggal_putusan, 7) > '${periode}', '', perkara_putusan.tanggal_putusan) AS tanggal_putusan,
        IF(LEFT(perkara_putusan.tanggal_putusan, 7) > '${periode}' OR perkara_putusan.tanggal_putusan IS NULL, '', status_putusan.nama) AS jenis_putusan,
        IF(LEFT(perkara_penetapan.penetapan_majelis_hakim, 7) > '${periode}' OR perkara_penetapan.penetapan_majelis_hakim IS NULL, perkara.nomor_perkara, '') AS belum_dibagi,
        IF(LEFT(perkara_putusan.tanggal_putusan, 7) > '${periode}' OR perkara_putusan.tanggal_putusan IS NULL, perkara.nomor_perkara, '') AS belum_diputus
      FROM perkara
      LEFT JOIN perkara_penetapan ON perkara_penetapan.perkara_id = perkara.perkara_id
      LEFT JOIN perkara_putusan ON perkara_putusan.perkara_id = perkara.perkara_id
      LEFT JOIN status_putusan ON status_putusan.id = perkara_putusan.status_putusan_id
      WHERE (
        LEFT(perkara.tanggal_pendaftaran, 7) <= '${periode}'
        AND (perkara_putusan.tanggal_putusan IS NULL OR LEFT(perkara_putusan.tanggal_putusan, 7) >= '${periode}')
      )
      ${alurCondition}
      ${searchCondition}
      GROUP BY perkara.perkara_id
      ORDER BY perkara.alur_perkara_id ASC, perkara.tanggal_pendaftaran ASC, perkara.nomor_perkara ASC
      ${paginationClause}
    `

    const rows = await prisma.$queryRawUnsafe<any[]>(dataSql).catch((err) => {
      console.error('Error fetch LIPA 1 rows:', err)
      return []
    })

    const startNo = pageSize > 0 ? (page - 1) * pageSize + 1 : 1

    const data = rows.map((r, idx) => ({
      no: startNo + idx,
      perkara_id: r.perkara_id,
      alur_perkara_id: r.alur_perkara_id,
      nomor_perkara: r.nomor_perkara || '-',
      kode_perkara: r.kode_perkara || '-',
      majelis_hakim: r.majelis_hakim || '',
      panitera_pengganti: r.panitera_pengganti || '-',
      tanggal_pendaftaran: r.tanggal_pendaftaran,
      pmh: r.pmh,
      phs: r.phs,
      sidang_pertama: r.sidang_pertama,
      tanggal_putusan: r.tanggal_putusan,
      jenis_putusan: r.jenis_putusan || '',
      belum_dibagi: r.belum_dibagi || '',
      belum_diputus: r.belum_diputus || '',
      ket: ''
    }))

    const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1

    return serializeBigInt({
      success: true,
      year,
      month,
      periode,
      total,
      page,
      pageSize,
      totalPages,
      data
    })
  } catch (error: any) {
    console.error('Error in lipa1/list:', error)
    return {
      success: false,
      message: error?.message || 'Gagal memuat data perkara LIPA 1',
      total: 0,
      page: 1,
      pageSize: 25,
      totalPages: 1,
      data: []
    }
  }
})
