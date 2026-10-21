import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = ((query.search as string) || '').trim()
  const filterStatus = (query.filterStatus as string) || 'all'
  const sortBy = (query.sortBy as string) || 'cases_desc'
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(10, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  const conditions: string[] = []

  // Pencarian kata kunci
  if (search) {
    const safeSearch = search.replace(/['"\\]/g, '')
    conditions.push(`(
      ph.nama LIKE '%${safeSearch}%'
      OR ppg.nomor_induk LIKE '%${safeSearch}%'
      OR ppg.alamat_kantor LIKE '%${safeSearch}%'
      OR ph.alamat LIKE '%${safeSearch}%'
      OR ph.telepon LIKE '%${safeSearch}%'
      OR ph.email LIKE '%${safeSearch}%'
      OR ppg.no_sk_menkeh LIKE '%${safeSearch}%'
    )`)
  }

  // Filter Status
  if (filterStatus === 'with_cases') {
    conditions.push(`COALESCE(kc.total_perkara, 0) > 0`)
  } else if (filterStatus === 'has_nia') {
    conditions.push(`ppg.nomor_induk IS NOT NULL AND ppg.nomor_induk != ''`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Sort By
  let orderBy = 'COALESCE(kc.total_perkara, 0) DESC, ppg.pihak_id DESC'
  if (sortBy === 'name_asc') {
    orderBy = 'ph.nama ASC'
  } else if (sortBy === 'id_desc') {
    orderBy = 'ppg.pihak_id DESC'
  }

  try {
    const [countRes, rows] = await Promise.all([
      // 1. Total hitung advokat
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(ppg.pihak_id) AS total
        FROM pihak_pengacara ppg
        JOIN pihak ph ON ph.id = ppg.pihak_id
        LEFT JOIN (
          SELECT pengacara_id, COUNT(id) AS total_perkara
          FROM perkara_pengacara
          GROUP BY pengacara_id
        ) kc ON kc.pengacara_id = ppg.pihak_id
        ${whereClause}
      `),

      // 2. Daftar data advokat terpaginasi
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          ppg.pihak_id AS id,
          ph.nama,
          ppg.nomor_induk,
          COALESCE(ppg.alamat_kantor, ph.alamat) AS alamat_kantor,
          ph.telepon,
          ph.email,
          ppg.no_sk_menkeh,
          DATE_FORMAT(ppg.tanggal_sk_menkeh, '%Y-%m-%d') AS tanggal_sk_menkeh,
          DATE_FORMAT(ppg.tanggal_penyumpahan_pn, '%Y-%m-%d') AS tanggal_penyumpahan_pn,
          DATE_FORMAT(ppg.tanggal_penyumpahan_pt, '%Y-%m-%d') AS tanggal_penyumpahan_pt,
          COALESCE(kc.total_perkara, 0) AS total_perkara
        FROM pihak_pengacara ppg
        JOIN pihak ph ON ph.id = ppg.pihak_id
        LEFT JOIN (
          SELECT pengacara_id, COUNT(id) AS total_perkara
          FROM perkara_pengacara
          GROUP BY pengacara_id
        ) kc ON kc.pengacara_id = ppg.pihak_id
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ${limit} OFFSET ${offset}
      `)
    ])

    const total = Number(countRes[0]?.total || 0)
    const totalPages = Math.ceil(total / limit)

    return serializeBigInt({
      success: true,
      search,
      filterStatus,
      sortBy,
      page,
      limit,
      total,
      totalPages,
      data: rows
    })
  } catch (error: any) {
    console.error('Error fetching advokat list:', error)
    return {
      success: false,
      message: error?.message || 'Gagal memuat data advokat',
      page,
      limit,
      total: 0,
      totalPages: 0,
      data: []
    }
  }
})
