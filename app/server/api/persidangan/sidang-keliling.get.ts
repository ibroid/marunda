import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20))
  const offset = (page - 1) * limit
  const search = typeof query.search === 'string' ? query.search.trim() : ''

  try {
    let searchCondition = ''
    if (search) {
      const sanitized = search.replace(/['"\\]/g, '')
      searchCondition = `
        AND (
          p.nomor_perkara LIKE '%${sanitized}%'
          OR p.pihak1_text LIKE '%${sanitized}%'
          OR p.pihak2_text LIKE '%${sanitized}%'
          OR p.para_pihak LIKE '%${sanitized}%'
          OR h.nama_gelar LIKE '%${sanitized}%'
          OR pan.nama_gelar LIKE '%${sanitized}%'
          OR pjs.agenda LIKE '%${sanitized}%'
        )
      `
    }

    const whereClause = `
      WHERE pjs.sidang_keliling = 'Y'
        AND (pjs.ruangan IS NULL OR pjs.ruangan = '')
        AND (p.proses_terakhir_text LIKE '%sidang%' OR p.proses_terakhir_text LIKE '%penetapan%')
        ${searchCondition}
    `

    // 1. Hitung total data
    const countSql = `
      SELECT COUNT(DISTINCT p.perkara_id) AS total
      FROM perkara p
      JOIN perkara_jadwal_sidang pjs ON p.perkara_id = pjs.perkara_id
      LEFT JOIN perkara_hakim_pn php ON php.perkara_id = p.perkara_id AND php.urutan = 1 AND php.aktif = 'Y'
      LEFT JOIN hakim_pn h ON php.hakim_id = h.id
      LEFT JOIN perkara_panitera_pn ppp ON ppp.perkara_id = p.perkara_id AND ppp.aktif = 'Y'
      LEFT JOIN panitera_pn pan ON ppp.panitera_id = pan.id
      ${whereClause}
    `

    const countResult = await prisma.$queryRawUnsafe<any[]>(countSql)
    const total = Number(countResult?.[0]?.total || 0)

    // 2. Ambil data dengan pagination
    const dataSql = `
      SELECT
        p.perkara_id,
        p.alur_perkara_id,
        p.nomor_perkara,
        p.pihak1_text,
        p.pihak2_text,
        p.para_pihak,
        p.proses_terakhir_text,
        MAX(pjs.tanggal_sidang) AS tanggal_sidang,
        h.nama_gelar AS ketua_majelis,
        pan.nama_gelar AS panitera_pengganti,
        (
          SELECT GROUP_CONCAT(
            DISTINCT DATE_FORMAT(s.tanggal_sidang, '%d/%m/%Y'), ' - ', COALESCE(s.agenda, 'Agenda Belum Diisi')
            ORDER BY s.tanggal_sidang ASC
            SEPARATOR '<br>'
          )
          FROM perkara_jadwal_sidang s
          WHERE s.perkara_id = p.perkara_id
        ) AS riwayat_agenda,
        'Lokasi/Ruang Sidang Keliling Belum Ditentukan' AS keterangan_status
      FROM perkara p
      JOIN perkara_jadwal_sidang pjs ON p.perkara_id = pjs.perkara_id
      LEFT JOIN perkara_hakim_pn php ON php.perkara_id = p.perkara_id AND php.urutan = 1 AND php.aktif = 'Y'
      LEFT JOIN hakim_pn h ON php.hakim_id = h.id
      LEFT JOIN perkara_panitera_pn ppp ON ppp.perkara_id = p.perkara_id AND ppp.aktif = 'Y'
      LEFT JOIN panitera_pn pan ON ppp.panitera_id = pan.id
      ${whereClause}
      GROUP BY
        p.perkara_id,
        p.alur_perkara_id,
        p.nomor_perkara,
        p.pihak1_text,
        p.pihak2_text,
        p.para_pihak,
        p.proses_terakhir_text,
        h.nama_gelar,
        pan.nama_gelar
      ORDER BY MAX(pjs.tanggal_sidang) DESC, p.perkara_id DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const rawItems = await prisma.$queryRawUnsafe<any[]>(dataSql)
    const items = serializeBigInt(rawItems)

    return {
      success: true,
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Gagal memuat data sidang keliling belum ditentukan',
      items: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0
      }
    }
  }
})
