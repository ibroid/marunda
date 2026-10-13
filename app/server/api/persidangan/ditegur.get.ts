import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20))
  const offset = (page - 1) * limit
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const statusWaktu = (query.status_waktu as string) || 'all' // 'all' | 'dalam_30_hari' | 'lebih_30_hari'

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
          OR pjs.keterangan LIKE '%${sanitized}%'
        )
      `
    }

    let havingCondition = ''
    if (statusWaktu === 'dalam_30_hari') {
      havingCondition = 'HAVING lama_proses <= 30'
    } else if (statusWaktu === 'lebih_30_hari') {
      havingCondition = 'HAVING lama_proses > 30'
    }

    const baseWhere = `
      WHERE pjs.ditunda = 'T'
        AND (pjs.alasan_ditunda IS NULL OR pjs.alasan_ditunda = '' OR pjs.alasan_ditunda = '0')
        AND (
          pjs.keterangan LIKE '%tegur%'
          OR pjs.keterangan LIKE '%mediasi%'
          OR pjs.keterangan LIKE '%ditentukan kemudian%'
        )
        AND pjs.tanggal_sidang <= NOW()
        AND (p.proses_terakhir_text = 'persidangan' OR p.proses_terakhir_text LIKE '%pertama%')
        ${searchCondition}
    `

    // 1. Hitung total data
    const countSql = `
      SELECT COUNT(*) AS total FROM (
        SELECT
          p.perkara_id,
          DATEDIFF(CURDATE(), MAX(pjs.tanggal_sidang)) AS lama_proses
        FROM perkara p
        JOIN perkara_jadwal_sidang pjs ON p.perkara_id = pjs.perkara_id
        LEFT JOIN perkara_hakim_pn php ON php.perkara_id = p.perkara_id AND php.urutan = 1 AND php.aktif = 'Y'
        LEFT JOIN hakim_pn h ON php.hakim_id = h.id
        LEFT JOIN perkara_panitera_pn ppp ON ppp.perkara_id = p.perkara_id AND ppp.aktif = 'Y'
        LEFT JOIN panitera_pn pan ON ppp.panitera_id = pan.id
        ${baseWhere}
        GROUP BY p.perkara_id
        ${havingCondition}
      ) AS count_sub
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
        pjs.sidang_keliling,
        pjs.keterangan,
        DATEDIFF(CURDATE(), MAX(pjs.tanggal_sidang)) AS lama_proses,
        (CASE
          WHEN DATEDIFF(CURDATE(), MAX(pjs.tanggal_sidang)) <= 30 THEN 'DALAM 30 HARI'
          ELSE 'LEBIH DARI 30 HARI'
        END) AS status_waktu,
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
        ) AS riwayat_sidang
      FROM perkara p
      JOIN perkara_jadwal_sidang pjs ON p.perkara_id = pjs.perkara_id
      LEFT JOIN perkara_hakim_pn php ON php.perkara_id = p.perkara_id AND php.urutan = 1 AND php.aktif = 'Y'
      LEFT JOIN hakim_pn h ON php.hakim_id = h.id
      LEFT JOIN perkara_panitera_pn ppp ON ppp.perkara_id = p.perkara_id AND ppp.aktif = 'Y'
      LEFT JOIN panitera_pn pan ON ppp.panitera_id = pan.id
      ${baseWhere}
      GROUP BY
        p.perkara_id,
        p.alur_perkara_id,
        p.nomor_perkara,
        p.pihak1_text,
        p.pihak2_text,
        p.para_pihak,
        p.proses_terakhir_text,
        pjs.sidang_keliling,
        pjs.keterangan,
        h.nama_gelar,
        pan.nama_gelar
      ${havingCondition}
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
      message: error?.message || 'Gagal memuat data perkara ditegur / ditentukan kemudian',
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
