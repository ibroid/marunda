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
      statusCondition = `AND LEFT(bdg.permohonan_banding, 7) = '${periode}'`
    } else if (status === 'belum_kirim') {
      statusCondition = `AND bdg.pengiriman_berkas_banding IS NULL`
    } else if (status === 'proses_pta') {
      statusCondition = `AND bdg.pengiriman_berkas_banding IS NOT NULL AND (bdg.putusan_banding IS NULL OR LEFT(bdg.putusan_banding, 7) > '${periode}')`
    } else if (status === 'putus_bulan_ini') {
      statusCondition = `AND LEFT(bdg.putusan_banding, 7) = '${periode}'`
    } else if (status === 'belum_kembali') {
      statusCondition = `AND bdg.putusan_banding IS NOT NULL AND bdg.penerimaan_kembali_berkas_banding IS NULL`
    }

    let searchCondition = ''
    if (search) {
      const escaped = search.replace(/['"\\]/g, '')
      searchCondition = `
        AND (
          bdg.nomor_perkara_pn LIKE '%${escaped}%'
          OR bdg.nomor_perkara_banding LIKE '%${escaped}%'
          OR perkara_penetapan.majelis_hakim_nama LIKE '%${escaped}%'
          OR bdg.pemohon_banding LIKE '%${escaped}%'
          OR bdg.catatan_banding LIKE '%${escaped}%'
        )
      `
    }

    const baseWhere = `
      WHERE LEFT(bdg.permohonan_banding, 7) <= '${periode}'
        AND (bdg.putusan_banding IS NULL OR LEFT(bdg.putusan_banding, 7) >= '${periode}')
        ${statusCondition}
        ${searchCondition}
    `

    // 1. Kueri Hitung Total
    const countSql = `
      SELECT COUNT(DISTINCT bdg.perkara_id) AS total
      FROM perkara_banding AS bdg
      LEFT JOIN perkara_penetapan ON perkara_penetapan.perkara_id = bdg.perkara_id
      ${baseWhere}
    `

    const countRes = await prisma.$queryRawUnsafe<any[]>(countSql).catch((err) => {
      console.error('Error count LIPA 2:', err)
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
        bdg.perkara_id,
        perkara_penetapan.majelis_hakim_nama AS majelis_hakim,
        bdg.nomor_perkara_pn AS nomor_perkara_pa,
        bdg.nomor_perkara_banding AS nomor_perkara_banding,
        bdg.putusan_pn AS putusan_pa,
        bdg.permohonan_banding AS permohonan_banding,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(pemberitahuan_inzage, '%Y-%m-%d') SEPARATOR '\n')
           FROM perkara_banding_detil
           WHERE perkara_id = bdg.perkara_id AND (status_pihak_id = 1 OR status_pihak_text LIKE '%Pembanding%') AND pemberitahuan_inzage IS NOT NULL),
          bdg.pemberitahuan_inzage_pembanding,
          bdg.pemberitahuan_inzage
        ) AS pemberitahuan_inzage_p,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(pemberitahuan_inzage, '%Y-%m-%d') SEPARATOR '\n')
           FROM perkara_banding_detil
           WHERE perkara_id = bdg.perkara_id AND (status_pihak_id IN (2, 4, 3, 5) OR status_pihak_text LIKE '%Terbanding%') AND pemberitahuan_inzage IS NOT NULL),
          bdg.pemberitahuan_inzage_terbanding
        ) AS pemberitahuan_inzage_t,
        bdg.pengiriman_berkas_banding AS pengiriman_berkas_pta,
        IF(LEFT(bdg.putusan_banding, 7) > '${periode}', NULL, bdg.putusan_banding) AS putusan_banding,
        IF(LEFT(bdg.penerimaan_kembali_berkas_banding, 7) > '${periode}', NULL, bdg.penerimaan_kembali_berkas_banding) AS penerimaan_kembali_pa,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(pemberitahuan_putusan_banding, '%Y-%m-%d') SEPARATOR '\n')
           FROM perkara_banding_detil
           WHERE perkara_id = bdg.perkara_id AND (status_pihak_id = 1 OR status_pihak_text LIKE '%Pembanding%') AND pemberitahuan_putusan_banding IS NOT NULL),
          bdg.pemberitahuan_putusan_banding_pembanding,
          bdg.pemberitahuan_putusan_banding
        ) AS pemberitahuan_putusan_p,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(pemberitahuan_putusan_banding, '%Y-%m-%d') SEPARATOR '\n')
           FROM perkara_banding_detil
           WHERE perkara_id = bdg.perkara_id AND (status_pihak_id IN (2, 4, 3, 5) OR status_pihak_text LIKE '%Terbanding%') AND pemberitahuan_putusan_banding IS NOT NULL),
          bdg.pemberitahuan_putusan_banding_terbanding
        ) AS pemberitahuan_putusan_t,
        bdg.tgl_pengiriman_berkas_putusan AS penyampaian_relas_pta,
        bdg.catatan_banding AS ket
      FROM perkara_banding AS bdg
      LEFT JOIN perkara_penetapan ON perkara_penetapan.perkara_id = bdg.perkara_id
      ${baseWhere}
      ORDER BY bdg.permohonan_banding ASC, bdg.perkara_id ASC
      ${paginationClause}
    `

    const rows = await prisma.$queryRawUnsafe<any[]>(dataSql).catch((err) => {
      console.error('Error fetch LIPA 2 rows:', err)
      return []
    })

    const startNo = pageSize > 0 ? (page - 1) * pageSize + 1 : 1

    const data = rows.map((r, idx) => ({
      no: startNo + idx,
      perkara_id: r.perkara_id,
      nomor_perkara_pa: r.nomor_perkara_pa || '-',
      nomor_perkara_banding: r.nomor_perkara_banding || '',
      majelis_hakim: r.majelis_hakim || '',
      putusan_pa: r.putusan_pa,
      permohonan_banding: r.permohonan_banding,
      pemberitahuan_inzage_p: r.pemberitahuan_inzage_p || '',
      pemberitahuan_inzage_t: r.pemberitahuan_inzage_t || '',
      pengiriman_berkas_pta: r.pengiriman_berkas_pta,
      putusan_banding: r.putusan_banding,
      penerimaan_kembali_pa: r.penerimaan_kembali_pa,
      pemberitahuan_putusan_p: r.pemberitahuan_putusan_p || '',
      pemberitahuan_putusan_t: r.pemberitahuan_putusan_t || '',
      penyampaian_relas_pta: r.penyampaian_relas_pta,
      ket: r.ket || ''
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
    console.error('Error in lipa2/list:', error)
    return {
      success: false,
      message: error?.message || 'Gagal memuat data perkara LIPA 2',
      total: 0,
      page: 1,
      pageSize: 25,
      totalPages: 1,
      data: []
    }
  }
})
