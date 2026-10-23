import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

function cleanHtmlTags(str: any): string {
  if (!str) return ''
  return String(str)
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

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
      statusCondition = `AND LEFT(veks.permohonan_eksekusi, 7) = '${periode}'`
    } else if (status === 'aanmaning') {
      statusCondition = `AND (veks.penetapan_teguran_eksekusi IS NOT NULL AND veks.penetapan_teguran_eksekusi != '0000-00-00')`
    } else if (status === 'sita') {
      statusCondition = `AND (veks.penetapan_sita_eksekusi IS NOT NULL AND veks.penetapan_sita_eksekusi != '0000-00-00')`
    } else if (status === 'eksekusi_rill') {
      statusCondition = `AND (veks.penetapan_perintah_eksekusi_rill IS NOT NULL AND veks.penetapan_perintah_eksekusi_rill != '0000-00-00')`
    } else if (status === 'selesai') {
      statusCondition = `AND (veks.pelaksanaan_eksekusi_rill IS NOT NULL AND veks.pelaksanaan_eksekusi_rill != '0000-00-00' AND LEFT(veks.pelaksanaan_eksekusi_rill, 7) <= '${periode}')`
    } else if (status === 'non_eksekutabel') {
      statusCondition = `AND (veks.penetapan_noneksekusi IS NOT NULL AND veks.penetapan_noneksekusi != '0000-00-00')`
    }

    let searchCondition = ''
    if (search) {
      const escaped = search.replace(/['"\\]/g, '')
      searchCondition = `
        AND (
          veks.nomor_perkara_pn LIKE '%${escaped}%'
          OR veks.eksekusi_nomor_perkara LIKE '%${escaped}%'
          OR veks.pemohon_eksekusi LIKE '%${escaped}%'
          OR veks.alasan_eksekusi LIKE '%${escaped}%'
          OR veks.catatan_eksekusi LIKE '%${escaped}%'
        )
      `
    }

    const baseFrom = `
      FROM (
        SELECT *
        FROM v_perkara_eksekusi
        WHERE LEFT(permohonan_eksekusi, 7) < '${periode}' AND (pelaksanaan_sita_eksekusi IS NULL OR LEFT(pelaksanaan_sita_eksekusi, 7) >= '${periode}')
        UNION
        SELECT *
        FROM v_perkara_eksekusi
        WHERE LEFT(permohonan_eksekusi, 7) = '${periode}' AND (pelaksanaan_sita_eksekusi IS NULL OR LEFT(pelaksanaan_sita_eksekusi, 7) >= '${periode}')
      ) AS veks
      WHERE 1=1
        ${statusCondition}
        ${searchCondition}
    `

    // 1. Kueri Hitung Total
    const countSql = `
      SELECT COUNT(DISTINCT veks.eksekusi_id) AS total
      ${baseFrom}
    `

    const countRes = await prisma.$queryRawUnsafe<any[]>(countSql).catch((err) => {
      console.error('Error count LIPA 5:', err)
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
        veks.eksekusi_id,
        veks.perkara_id,
        veks.nomor_perkara_pn AS nomor_perkara_pa,
        veks.eksekusi_nomor_perkara AS nomor_eksekusi,
        DATE_FORMAT(veks.permohonan_eksekusi, '%Y-%m-%d') AS permohonan_eksekusi,
        DATE_FORMAT(veks.penetapan_teguran_eksekusi, '%Y-%m-%d') AS penetapan_teguran_eksekusi,
        DATE_FORMAT(veks.pelaksanaan_teguran_eksekusi, '%Y-%m-%d') AS pelaksanaan_teguran_eksekusi,
        DATE_FORMAT(veks.penetapan_sita_eksekusi, '%Y-%m-%d') AS penetapan_sita_eksekusi,
        DATE_FORMAT(veks.pelaksanaan_sita_eksekusi, '%Y-%m-%d') AS pelaksanaan_sita_eksekusi,
        DATE_FORMAT(veks.penetapan_perintah_eksekusi_rill, '%Y-%m-%d') AS penetapan_eksekusi_rill,
        DATE_FORMAT(veks.pelaksanaan_eksekusi_rill, '%Y-%m-%d') AS pelaksanaan_eksekusi_rill,
        DATE_FORMAT(veks.penetapan_noneksekusi, '%Y-%m-%d') AS penetapan_noneksekusi,
        veks.alasan_eksekusi AS alasan,
        veks.catatan_eksekusi AS keterangan,
        veks.pemohon_eksekusi,
        veks.status_eksekusi_text
      ${baseFrom}
      ORDER BY veks.eksekusi_id ASC
      ${paginationClause}
    `

    const rows = await prisma.$queryRawUnsafe<any[]>(dataSql).catch((err) => {
      console.error('Error data LIPA 5:', err)
      return []
    })

    const startIndex = pageSize > 0 ? (page - 1) * pageSize : 0
    const formattedData = rows.map((r, idx) => {
      const cleanedAlasan = cleanHtmlTags(r.alasan)
      return {
        no: startIndex + idx + 1,
        eksekusi_id: r.eksekusi_id ? String(r.eksekusi_id) : '',
        perkara_id: r.perkara_id ? String(r.perkara_id) : '',
        nomor_eksekusi: r.nomor_eksekusi || '-',
        nomor_perkara_pa: r.nomor_perkara_pa || '-',
        permohonan_eksekusi: r.permohonan_eksekusi || null,
        penetapan_teguran_eksekusi: r.penetapan_teguran_eksekusi || null,
        pelaksanaan_teguran_eksekusi: r.pelaksanaan_teguran_eksekusi || null,
        penetapan_sita_eksekusi: r.penetapan_sita_eksekusi || null,
        pelaksanaan_sita_eksekusi: r.pelaksanaan_sita_eksekusi || null,
        penetapan_eksekusi_rill: r.penetapan_eksekusi_rill || null,
        pelaksanaan_eksekusi_rill: r.pelaksanaan_eksekusi_rill || null,
        penetapan_noneksekusi: r.penetapan_noneksekusi || null,
        bergantung: '',
        alasan: cleanedAlasan,
        keterangan: (r.keterangan && r.keterangan !== '0') ? r.keterangan : '',
        pemohon_eksekusi: r.pemohon_eksekusi || ''
      }
    })

    const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1

    return {
      success: true,
      year,
      month,
      periode,
      total,
      page,
      pageSize,
      totalPages,
      data: serializeBigInt(formattedData)
    }
  } catch (error: any) {
    console.error('Error in LIPA 5 list API:', error)
    return {
      success: false,
      message: error?.message || 'Gagal memuat daftar perkara eksekusi LIPA 5',
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      data: []
    }
  }
})
