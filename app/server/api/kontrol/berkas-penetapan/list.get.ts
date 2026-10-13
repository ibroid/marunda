import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const month = query.month !== undefined ? Number(query.month) : NaN
  const year = Number(query.year)
  const kategori = (query.kategori as string) || 'semua_belum'
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 25))
  const offset = (page - 1) * limit

  if (isNaN(month) || month < 0 || month > 12 || !year || isNaN(year)) {
    return {
      success: false,
      message: 'Parameter bulan (0 untuk semua bulan, 1-12) dan tahun wajib diisi'
    }
  }

  try {
    let dateFilter = ''
    let startDate = ''
    let endDate = ''

    if (month === 0) {
      // 1 Tahun Penuh
      startDate = `${year}-01-01`
      endDate = `${year}-12-31`
      dateFilter = `p.tanggal_pendaftaran >= '${startDate}' AND p.tanggal_pendaftaran <= '${endDate}'`
    } else {
      // 1 Bulan Tertentu
      const padMonth = String(month).padStart(2, '0')
      const lastDay = new Date(year, month, 0).getDate()
      startDate = `${year}-${padMonth}-01`
      endDate = `${year}-${padMonth}-${String(lastDay).padStart(2, '0')}`
      dateFilter = `p.tanggal_pendaftaran >= '${startDate}' AND p.tanggal_pendaftaran <= '${endDate}'`
    }

    // Sanitasi input search
    let searchCondition = ''
    if (search) {
      const sanitized = search.replace(/['"\\]/g, '')
      searchCondition = ` AND (p.nomor_perkara LIKE '%${sanitized}%' OR p.para_pihak LIKE '%${sanitized}%' OR p.jenis_perkara_nama LIKE '%${sanitized}%')`
    }

    // Filter kategori berdasarkan status upload
    let havingClause = ''
    if (kategori === 'belum_pmh') {
      havingClause = 'HAVING has_pmh_dok = 0'
    } else if (kategori === 'belum_ppp') {
      havingClause = 'HAVING has_ppp_dok = 0'
    } else if (kategori === 'belum_pjs') {
      havingClause = 'HAVING has_pjs_dok = 0'
    } else if (kategori === 'semua_belum') {
      havingClause = 'HAVING (has_pmh_dok = 0 OR has_ppp_dok = 0 OR has_pjs_dok = 0)'
    } else if (kategori === 'sudah_lengkap') {
      havingClause = 'HAVING (has_pmh_dok = 1 AND has_ppp_dok = 1 AND has_pjs_dok = 1)'
    }

    // 1. Hitung total data yang cocok
    const countQuery = `
      SELECT COUNT(*) AS total FROM (
        SELECT
          p.perkara_id,
          (CASE WHEN (
            (pp.sk_penetapan_majelis_hakim_dok IS NOT NULL AND pp.sk_penetapan_majelis_hakim_dok != '')
            OR (SELECT COUNT(id) FROM perkara_dokumen_penetapan pdp WHERE pdp.perkara_id = p.perkara_id AND pdp.jenis_dokumen_id = 1 AND pdp.dokumen IS NOT NULL AND pdp.dokumen != '') > 0
          ) THEN 1 ELSE 0 END) AS has_pmh_dok,
          (CASE WHEN (
            (pp.sk_penetapan_panitera_pengganti_dok IS NOT NULL AND pp.sk_penetapan_panitera_pengganti_dok != '')
            OR (SELECT COUNT(id) FROM perkara_dokumen_penetapan pdp WHERE pdp.perkara_id = p.perkara_id AND pdp.jenis_dokumen_id = 2 AND pdp.dokumen IS NOT NULL AND pdp.dokumen != '') > 0
          ) THEN 1 ELSE 0 END) AS has_ppp_dok,
          (CASE WHEN (
            (pp.sk_penetapan_jurusita_dok IS NOT NULL AND pp.sk_penetapan_jurusita_dok != '')
            OR (SELECT COUNT(id) FROM perkara_dokumen_penetapan pdp WHERE pdp.perkara_id = p.perkara_id AND pdp.jenis_dokumen_id = 3 AND pdp.dokumen IS NOT NULL AND pdp.dokumen != '') > 0
          ) THEN 1 ELSE 0 END) AS has_pjs_dok
        FROM perkara p
        LEFT JOIN perkara_penetapan pp ON p.perkara_id = pp.perkara_id
        WHERE ${dateFilter}
        ${searchCondition}
        ${havingClause}
      ) AS sub
    `

    const countRes = await prisma.$queryRawUnsafe<any[]>(countQuery)
    const total = Number(countRes[0]?.total || 0)

    // 2. Ambil data baris per halaman
    const listQuery = `
      SELECT
        p.perkara_id,
        p.nomor_perkara,
        p.tanggal_pendaftaran,
        p.jenis_perkara_nama,
        p.para_pihak,
        pp.penetapan_majelis_hakim,
        pp.majelis_hakim_nama,
        pp.sk_penetapan_majelis_hakim_dok,
        pp.penetapan_panitera_pengganti,
        pp.panitera_pengganti_text,
        pp.sk_penetapan_panitera_pengganti_dok,
        pp.penetapan_jurusita,
        pp.jurusita_text,
        pp.sk_penetapan_jurusita_dok,
        (CASE WHEN (
          (pp.sk_penetapan_majelis_hakim_dok IS NOT NULL AND pp.sk_penetapan_majelis_hakim_dok != '')
          OR (SELECT COUNT(id) FROM perkara_dokumen_penetapan pdp WHERE pdp.perkara_id = p.perkara_id AND pdp.jenis_dokumen_id = 1 AND pdp.dokumen IS NOT NULL AND pdp.dokumen != '') > 0
        ) THEN 1 ELSE 0 END) AS has_pmh_dok,
        (CASE WHEN (
          (pp.sk_penetapan_panitera_pengganti_dok IS NOT NULL AND pp.sk_penetapan_panitera_pengganti_dok != '')
          OR (SELECT COUNT(id) FROM perkara_dokumen_penetapan pdp WHERE pdp.perkara_id = p.perkara_id AND pdp.jenis_dokumen_id = 2 AND pdp.dokumen IS NOT NULL AND pdp.dokumen != '') > 0
        ) THEN 1 ELSE 0 END) AS has_ppp_dok,
        (CASE WHEN (
          (pp.sk_penetapan_jurusita_dok IS NOT NULL AND pp.sk_penetapan_jurusita_dok != '')
          OR (SELECT COUNT(id) FROM perkara_dokumen_penetapan pdp WHERE pdp.perkara_id = p.perkara_id AND pdp.jenis_dokumen_id = 3 AND pdp.dokumen IS NOT NULL AND pdp.dokumen != '') > 0
        ) THEN 1 ELSE 0 END) AS has_pjs_dok
      FROM perkara p
      LEFT JOIN perkara_penetapan pp ON p.perkara_id = pp.perkara_id
      WHERE ${dateFilter}
      ${searchCondition}
      ${havingClause}
      ORDER BY p.tanggal_pendaftaran DESC, p.perkara_id DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const listRes = await prisma.$queryRawUnsafe<any[]>(listQuery)

    // Formatter data untuk kemudahan konsumsi di komponen Vue
    const items = listRes.map((item) => {
      const hasPmh = Number(item.has_pmh_dok) === 1
      const hasPpp = Number(item.has_ppp_dok) === 1
      const hasPjs = Number(item.has_pjs_dok) === 1
      const isLengkap = hasPmh && hasPpp && hasPjs

      return {
        ...item,
        has_pmh_dok: hasPmh,
        has_ppp_dok: hasPpp,
        has_pjs_dok: hasPjs,
        is_lengkap: isLengkap
      }
    })

    const totalPages = Math.ceil(total / limit) || 1

    return serializeBigInt({
      success: true,
      month,
      year,
      kategori,
      isFullYear: month === 0,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      items
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat daftar perkara audit berkas penetapan'
    }
  }
})
