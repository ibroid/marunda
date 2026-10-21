import { defineEventHandler, getQuery, createError } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = Number(query.id)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(5, Number(query.limit) || 10))
  const search = typeof query.search === 'string' ? query.search.trim() : ''

  if (!id || isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID advokat tidak valid'
    })
  }

  const offset = (page - 1) * limit

  try {
    // Bangun filter pencarian nomor perkara atau jenis perkara jika ada
    let searchCondition = ''
    if (search) {
      const sanitized = search.replace(/'/g, "''")
      searchCondition = `AND (
        p.nomor_perkara LIKE '%${sanitized}%' OR
        p.jenis_perkara_nama LIKE '%${sanitized}%' OR
        pp.nomor_kuasa LIKE '%${sanitized}%'
      )`
    }

    const [countRows, cases] = await Promise.all([
      // 1. Total hitung perkara yang ditangani
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(pp.id) AS total
        FROM perkara_pengacara pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.pengacara_id = ${id}
        ${searchCondition}
      `),

      // 2. Data perkara terpaginasi (ringan & cepat)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          pp.id AS perkara_pengacara_id,
          pp.perkara_id,
          p.nomor_perkara,
          DATE_FORMAT(p.tanggal_pendaftaran, '%Y-%m-%d') AS tanggal_pendaftaran,
          p.jenis_perkara_nama,
          pp.pihak_ke,
          CASE pp.pihak_ke
            WHEN 1 THEN 'Penggugat / Pemohon'
            WHEN 2 THEN 'Tergugat / Termohon'
            ELSE CONCAT('Pihak ke-', pp.pihak_ke)
          END AS pihak_ke_text,
          pp.nomor_kuasa,
          DATE_FORMAT(pp.tanggal_kuasa, '%Y-%m-%d') AS tanggal_kuasa,
          pp.aktif,
          DATE_FORMAT(pput.tanggal_putusan, '%Y-%m-%d') AS tanggal_putusan,
          sp.nama AS status_putusan_nama,
          p.proses_terakhir_text,
          p.tahapan_terakhir_text
        FROM perkara_pengacara pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_putusan pput ON pput.perkara_id = p.perkara_id
        LEFT JOIN status_putusan sp ON sp.id = pput.status_putusan_id
        WHERE pp.pengacara_id = ${id}
        ${searchCondition}
        ORDER BY p.tanggal_pendaftaran DESC, pp.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `)
    ])

    const total = Number(countRows[0]?.total || 0)

    return serializeBigInt({
      success: true,
      data: cases,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error: any) {
    console.error('Error fetching advokat cases:', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal memuat daftar perkara advokat'
    })
  }
})
