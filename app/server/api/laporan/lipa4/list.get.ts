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
      statusCondition = `AND LEFT(pk.permohonan_pk, 7) = '${periode}'`
    } else if (status === 'belum_kirim') {
      statusCondition = `AND pk.pengiriman_berkas_pk IS NULL`
    } else if (status === 'proses_ma') {
      statusCondition = `AND pk.pengiriman_berkas_pk IS NOT NULL AND (pk.putusan_pk IS NULL OR LEFT(pk.putusan_pk, 7) > '${periode}')`
    } else if (status === 'putus_bulan_ini') {
      statusCondition = `AND LEFT(pk.putusan_pk, 7) = '${periode}'`
    } else if (status === 'belum_kembali') {
      statusCondition = `AND pk.putusan_pk IS NOT NULL AND pk.penerimaan_berkas_pk IS NULL`
    } else if (status === 'cabut') {
      statusCondition = `AND (pk.tanggal_cabut IS NOT NULL OR (SELECT MAX(tanggal_cabut) FROM perkara_pk_detil WHERE perkara_id = pk.perkara_id) IS NOT NULL)`
    }

    let searchCondition = ''
    if (search) {
      const escaped = search.replace(/['"\\]/g, '')
      searchCondition = `
        AND (
          pk.nomor_perkara_pn LIKE '%${escaped}%'
          OR pk.nomor_perkara_banding LIKE '%${escaped}%'
          OR bdg.nomor_perkara_banding LIKE '%${escaped}%'
          OR pk.nomor_perkara_kasasi LIKE '%${escaped}%'
          OR ks.nomor_perkara_kasasi LIKE '%${escaped}%'
          OR pk.nomor_perkara_pk LIKE '%${escaped}%'
          OR pk.pemohon_pk LIKE '%${escaped}%'
          OR pk.catatan_putusan_pk LIKE '%${escaped}%'
        )
      `
    }

    const baseWhere = `
      WHERE LEFT(pk.permohonan_pk, 7) <= '${periode}'
        AND (pk.putusan_pk IS NULL OR LEFT(pk.putusan_pk, 7) >= '${periode}')
        AND (pk.tanggal_cabut IS NULL OR LEFT(pk.tanggal_cabut, 7) >= '${periode}')
        ${statusCondition}
        ${searchCondition}
    `

    // 1. Kueri Hitung Total
    const countSql = `
      SELECT COUNT(DISTINCT pk.perkara_id) AS total
      FROM perkara_pk AS pk
      LEFT JOIN perkara_banding AS bdg ON bdg.perkara_id = pk.perkara_id
      LEFT JOIN perkara_kasasi AS ks ON ks.perkara_id = pk.perkara_id
      ${baseWhere}
    `

    const countRes = await prisma.$queryRawUnsafe<any[]>(countSql).catch((err) => {
      console.error('Error count LIPA 4:', err)
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
        pk.perkara_id,
        pk.nomor_perkara_pn AS nomor_perkara_pa,
        COALESCE(pk.nomor_perkara_banding, bdg.nomor_perkara_banding) AS nomor_perkara_banding,
        COALESCE(pk.nomor_perkara_kasasi, ks.nomor_perkara_kasasi) AS nomor_perkara_kasasi,
        pk.permohonan_pk,
        pk.pengiriman_berkas_pk AS pengiriman_berkas_ma,
        IF(LEFT(pk.putusan_pk, 7) > '${periode}', NULL, pk.putusan_pk) AS putusan_pk,
        IF(LEFT(pk.penerimaan_berkas_pk, 7) > '${periode}', NULL, pk.penerimaan_berkas_pk) AS penerimaan_kembali_pa,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(pemberitahuan_putusan_pk, '%Y-%m-%d') SEPARATOR '\n')
           FROM perkara_pk_detil
           WHERE perkara_id = pk.perkara_id AND (status_pihak_id = 1 OR status_pihak_text LIKE '%Pemohon%') AND pemberitahuan_putusan_pk IS NOT NULL),
          pk.pemberitahuan_putusan_pk_pihak1
        ) AS pemberitahuan_putusan_p,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(pemberitahuan_putusan_pk, '%Y-%m-%d') SEPARATOR '\n')
           FROM perkara_pk_detil
           WHERE perkara_id = pk.perkara_id AND (status_pihak_id IN (3, 4) OR status_pihak_text LIKE '%Termohon%') AND pemberitahuan_putusan_pk IS NOT NULL),
          pk.pemberitahuan_putusan_pk_pihak2
        ) AS pemberitahuan_putusan_t,
        pk.pemberitahuan_putusan_pk,
        pk.nomor_perkara_pk,
        pk.status_putusan_pk_text,
        pk.catatan_putusan_pk,
        pk.tanggal_cabut
      FROM perkara_pk AS pk
      LEFT JOIN perkara_banding AS bdg ON bdg.perkara_id = pk.perkara_id
      LEFT JOIN perkara_kasasi AS ks ON ks.perkara_id = pk.perkara_id
      ${baseWhere}
      ORDER BY pk.perkara_id ASC
      ${paginationClause}
    `

    const rows = await prisma.$queryRawUnsafe<any[]>(dataSql).catch((err) => {
      console.error('Error data LIPA 4:', err)
      return []
    })

    const startIndex = pageSize > 0 ? (page - 1) * pageSize : 0
    const formattedData = rows.map((r, idx) => {
      // Bentuk teks keterangan yang rapi
      const parts: string[] = []
      if (r.tanggal_cabut) {
        parts.push(`Dicabut (${r.tanggal_cabut instanceof Date ? r.tanggal_cabut.toISOString().split('T')[0] : String(r.tanggal_cabut).split(' ')[0]})`)
      }
      if (r.status_putusan_pk_text) {
        parts.push(r.status_putusan_pk_text)
      }
      if (r.nomor_perkara_pk) {
        parts.push(`No. MA: ${r.nomor_perkara_pk}`)
      }
      if (r.catatan_putusan_pk) {
        parts.push(r.catatan_putusan_pk)
      }

      return {
        no: startIndex + idx + 1,
        perkara_id: r.perkara_id,
        nomor_perkara_pa: r.nomor_perkara_pa || '-',
        nomor_perkara_banding: r.nomor_perkara_banding && r.nomor_perkara_banding !== '' ? r.nomor_perkara_banding : '',
        nomor_perkara_kasasi: r.nomor_perkara_kasasi && r.nomor_perkara_kasasi !== '' ? r.nomor_perkara_kasasi : '',
        permohonan_pk: r.permohonan_pk,
        pengiriman_berkas_ma: r.pengiriman_berkas_ma,
        putusan_pk: r.putusan_pk,
        penerimaan_kembali_pa: r.penerimaan_kembali_pa,
        pemberitahuan_putusan_p: r.pemberitahuan_putusan_p,
        pemberitahuan_putusan_t: r.pemberitahuan_putusan_t,
        pemberitahuan_putusan_pk: r.pemberitahuan_putusan_pk,
        keterangan: parts.join(' | ') || ''
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
    console.error('Error in lipa4/list:', error)
    return {
      success: false,
      message: error.message || 'Gagal memuat data perkara peninjauan kembali (PK)',
      total: 0,
      page,
      pageSize,
      totalPages: 1,
      data: []
    }
  }
})
