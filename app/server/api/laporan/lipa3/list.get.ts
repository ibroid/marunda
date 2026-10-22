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

  const status = (query.status as string) || 'all'
  const search = ((query.search as string) || '').trim()

  const page = query.page && !isNaN(Number(query.page)) ? Math.max(1, Number(query.page)) : 1
  const pageSize = query.pageSize !== undefined && !isNaN(Number(query.pageSize)) ? Number(query.pageSize) : 25

  try {
    let statusCondition = ''
    if (status === 'mohon_bulan_ini') {
      statusCondition = `AND LEFT(ks.permohonan_kasasi, 7) = '${periode}'`
    } else if (status === 'belum_kirim') {
      statusCondition = `AND ks.pengiriman_berkas_kasasi IS NULL`
    } else if (status === 'proses_ma') {
      statusCondition = `AND ks.pengiriman_berkas_kasasi IS NOT NULL AND (ks.putusan_kasasi IS NULL OR LEFT(ks.putusan_kasasi, 7) > '${periode}')`
    } else if (status === 'putus_bulan_ini') {
      statusCondition = `AND LEFT(ks.putusan_kasasi, 7) = '${periode}'`
    } else if (status === 'belum_kembali') {
      statusCondition = `AND ks.putusan_kasasi IS NOT NULL AND ks.penerimaan_berkas_kasasi IS NULL`
    } else if (status === 'tms') {
      statusCondition = `AND (ks.tidak_memenuhi_syarat IS NOT NULL OR (SELECT MAX(tidak_memenuhi_syarat) FROM perkara_kasasi_detil WHERE perkara_id = ks.perkara_id) IS NOT NULL)`
    }

    let searchCondition = ''
    if (search) {
      const escaped = search.replace(/['"\\]/g, '')
      searchCondition = `
        AND (
          ks.nomor_perkara_pn LIKE '%${escaped}%'
          OR ks.nomor_perkara_banding LIKE '%${escaped}%'
          OR bdg.nomor_perkara_banding LIKE '%${escaped}%'
          OR ks.nomor_perkara_kasasi LIKE '%${escaped}%'
          OR ks.pemohon_kasasi LIKE '%${escaped}%'
          OR ks.catatan_putusan_kasasi LIKE '%${escaped}%'
        )
      `
    }

    const baseWhere = `
      WHERE LEFT(ks.permohonan_kasasi, 7) <= '${periode}'
        AND (ks.putusan_kasasi IS NULL OR LEFT(ks.putusan_kasasi, 7) >= '${periode}')
        ${statusCondition}
        ${searchCondition}
    `

    // 1. Kueri Hitung Total
    const countSql = `
      SELECT COUNT(DISTINCT ks.perkara_id) AS total
      FROM perkara_kasasi AS ks
      LEFT JOIN perkara_banding AS bdg ON bdg.perkara_id = ks.perkara_id
      ${baseWhere}
    `

    const countRes = await prisma.$queryRawUnsafe<any[]>(countSql).catch((err) => {
      console.error('Error count LIPA 3:', err)
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
        ks.perkara_id,
        ks.nomor_perkara_pn AS nomor_perkara_pa,
        COALESCE(ks.nomor_perkara_banding, bdg.nomor_perkara_banding) AS nomor_perkara_banding,
        ks.permohonan_kasasi,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(penerimaan_memori_kasasi, '%Y-%m-%d') SEPARATOR '\n')
           FROM perkara_kasasi_detil
           WHERE perkara_id = ks.perkara_id AND penerimaan_memori_kasasi IS NOT NULL),
          ks.penerimaan_memori_kasasi
        ) AS penerimaan_memori_kasasi,
        COALESCE(
          ks.tidak_memenuhi_syarat,
          (SELECT MAX(tidak_memenuhi_syarat) FROM perkara_kasasi_detil WHERE perkara_id = ks.perkara_id)
        ) AS penetapan_tms,
        ks.pengiriman_berkas_kasasi AS pengiriman_berkas_ma,
        IF(LEFT(ks.putusan_kasasi, 7) > '${periode}', NULL, ks.putusan_kasasi) AS putusan_kasasi,
        IF(LEFT(ks.penerimaan_berkas_kasasi, 7) > '${periode}', NULL, ks.penerimaan_berkas_kasasi) AS penerimaan_kembali_pa,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(pemberitahuan_putusan_kasasi, '%Y-%m-%d') SEPARATOR '\n')
           FROM perkara_kasasi_detil
           WHERE perkara_id = ks.perkara_id AND (status_pihak_id = 1 OR status_pihak_text LIKE '%Pemohon%') AND pemberitahuan_putusan_kasasi IS NOT NULL),
          ks.pemberitahuan_putusan_kasasi_pihak1,
          ks.pemberitahuan_putusan_kasasi
        ) AS pemberitahuan_putusan_p,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(pemberitahuan_putusan_kasasi, '%Y-%m-%d') SEPARATOR '\n')
           FROM perkara_kasasi_detil
           WHERE perkara_id = ks.perkara_id AND (status_pihak_id IN (3, 4) OR status_pihak_text LIKE '%Termohon%') AND pemberitahuan_putusan_kasasi IS NOT NULL),
          ks.pemberitahuan_putusan_kasasi_pihak2
        ) AS pemberitahuan_putusan_t,
        ks.nomor_perkara_kasasi,
        ks.status_putusan_kasasi_text,
        ks.catatan_putusan_kasasi,
        ks.tanggal_cabut
      FROM perkara_kasasi AS ks
      LEFT JOIN perkara_banding AS bdg ON bdg.perkara_id = ks.perkara_id
      ${baseWhere}
      ORDER BY ks.permohonan_kasasi ASC, ks.perkara_id ASC
      ${paginationClause}
    `

    const rows = await prisma.$queryRawUnsafe<any[]>(dataSql).catch((err) => {
      console.error('Error data LIPA 3:', err)
      return []
    })

    const startIndex = pageSize > 0 ? (page - 1) * pageSize : 0
    const formattedData = rows.map((r, idx) => {
      // Bentuk teks keterangan yang rapi
      const parts: string[] = []
      if (r.tanggal_cabut) {
        parts.push(`Dicabut (${r.tanggal_cabut instanceof Date ? r.tanggal_cabut.toISOString().split('T')[0] : String(r.tanggal_cabut).split(' ')[0]})`)
      }
      if (r.status_putusan_kasasi_text) {
        parts.push(r.status_putusan_kasasi_text)
      }
      if (r.nomor_perkara_kasasi) {
        parts.push(`No. MA: ${r.nomor_perkara_kasasi}`)
      }
      if (r.catatan_putusan_kasasi) {
        parts.push(r.catatan_putusan_kasasi)
      }

      return {
        no: startIndex + idx + 1,
        perkara_id: r.perkara_id,
        nomor_perkara_pa: r.nomor_perkara_pa || '-',
        nomor_perkara_banding: r.nomor_perkara_banding || '-',
        permohonan_kasasi: r.permohonan_kasasi,
        penerimaan_memori_kasasi: r.penerimaan_memori_kasasi,
        penetapan_tms: r.penetapan_tms,
        pengiriman_berkas_ma: r.pengiriman_berkas_ma,
        putusan_kasasi: r.putusan_kasasi,
        penerimaan_kembali_pa: r.penerimaan_kembali_pa,
        pemberitahuan_putusan_p: r.pemberitahuan_putusan_p,
        pemberitahuan_putusan_t: r.pemberitahuan_putusan_t,
        keterangan: parts.join(' | ') || '-'
      }
    })

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
      data: formattedData
    })
  } catch (error: any) {
    console.error('Error in lipa3/list:', error)
    return {
      success: false,
      message: error.message || 'Gagal memuat data perkara kasasi',
      total: 0,
      page,
      pageSize,
      totalPages: 1,
      data: []
    }
  }
})
