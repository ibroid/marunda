import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt, createDbErrorResponse } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const month = query.month && !isNaN(Number(query.month)) ? Math.max(1, Math.min(12, Number(query.month))) : 1

  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10))
  const offset = (page - 1) * limit

  const channel = typeof query.channel === 'string' ? query.channel.toLowerCase() : 'all'
  const rawQ = typeof query.q === 'string' ? query.q.trim() : ''
  const cleanQ = rawQ.replace(/['"\\]/g, '')

  let channelCondition = ''
  if (channel === 'ecourt') {
    channelCondition = 'AND d.perkara_id IS NOT NULL'
  } else if (channel === 'konvensional') {
    channelCondition = 'AND d.perkara_id IS NULL'
  }

  let searchCondition = ''
  if (cleanQ) {
    searchCondition = `AND (a.nomor_perkara LIKE '%${cleanQ}%' OR a.para_pihak LIKE '%${cleanQ}%' OR a.jenis_perkara_nama LIKE '%${cleanQ}%' OR pe.nomor_register LIKE '%${cleanQ}%')`
  }

  try {
    // 1. Hitung total agregat bulan ini (untuk badge/tabs di modal)
    const summaryQuery = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(*) AS total_semua,
        SUM(CASE WHEN d.perkara_id IS NOT NULL THEN 1 ELSE 0 END) AS total_ecourt,
        SUM(CASE WHEN d.perkara_id IS NULL THEN 1 ELSE 0 END) AS total_konvensional
      FROM perkara a
      LEFT JOIN perkara_efiling_id d ON a.perkara_id = d.perkara_id
      WHERE a.alur_perkara_id <> 114
        AND YEAR(a.tanggal_pendaftaran) = ${year}
        AND MONTH(a.tanggal_pendaftaran) = ${month}
    `)

    const summaryRow = summaryQuery[0] || {}
    const totalSemuaBulan = Number(summaryRow.total_semua || 0)
    const totalEcourtBulan = Number(summaryRow.total_ecourt || 0)
    const totalKonvensionalBulan = Number(summaryRow.total_konvensional || 0)

    // 2. Hitung total yang cocok dengan filter saat ini (untuk pagination)
    const countFilteredQuery = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) AS total_filtered
      FROM perkara a
      LEFT JOIN perkara_efiling_id d ON a.perkara_id = d.perkara_id
      LEFT JOIN perkara_efiling pe ON d.efiling_id = pe.efiling_id
      WHERE a.alur_perkara_id <> 114
        AND YEAR(a.tanggal_pendaftaran) = ${year}
        AND MONTH(a.tanggal_pendaftaran) = ${month}
        ${channelCondition}
        ${searchCondition}
    `)

    const totalFiltered = Number(countFilteredQuery[0]?.total_filtered || 0)

    // 3. Ambil daftar perkara sesuai pagination
    const daftarPerkara = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        a.perkara_id,
        a.nomor_perkara,
        a.tanggal_pendaftaran,
        a.jenis_perkara_nama,
        a.para_pihak,
        a.proses_terakhir_text,
        CASE WHEN d.perkara_id IS NOT NULL THEN 'ecourt' ELSE 'konvensional' END AS jenis_pendaftaran,
        pe.nomor_register
      FROM perkara a
      LEFT JOIN perkara_efiling_id d ON a.perkara_id = d.perkara_id
      LEFT JOIN perkara_efiling pe ON d.efiling_id = pe.efiling_id
      WHERE a.alur_perkara_id <> 114
        AND YEAR(a.tanggal_pendaftaran) = ${year}
        AND MONTH(a.tanggal_pendaftaran) = ${month}
        ${channelCondition}
        ${searchCondition}
      ORDER BY a.tanggal_pendaftaran DESC, a.perkara_id DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    return serializeBigInt({
      success: true,
      year,
      month,
      page,
      limit,
      total: totalFiltered,
      counts: {
        total: totalSemuaBulan,
        ecourt: totalEcourtBulan,
        konvensional: totalKonvensionalBulan
      },
      daftar: daftarPerkara
    })
  } catch (error: any) {
    return createDbErrorResponse(error, 'Gagal memuat rincian perkara bulanan')
  }
})
