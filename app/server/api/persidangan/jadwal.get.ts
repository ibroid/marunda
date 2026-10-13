import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20))
  const offset = (page - 1) * limit
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const dateStr = typeof query.date === 'string' && query.date ? query.date.trim() : ''
  const ruanganFilter = typeof query.ruangan === 'string' ? query.ruangan.trim() : 'all'
  const jenisSidang = (query.jenis_sidang as string) || 'all' // 'all' | 'kantor' | 'keliling'

  try {
    // Validasi format tanggal YYYY-MM-DD, default hari ini
    const targetDate = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
      ? dateStr
      : new Date().toISOString().split('T')[0]

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
          OR js.nama_gelar LIKE '%${sanitized}%'
          OR pjs.agenda LIKE '%${sanitized}%'
        )
      `
    }

    let ruanganCondition = ''
    if (ruanganFilter && ruanganFilter !== 'all') {
      const sanitizedRuangan = ruanganFilter.replace(/['"\\]/g, '')
      ruanganCondition = `AND pjs.ruangan = '${sanitizedRuangan}'`
    }

    let jenisCondition = ''
    if (jenisSidang === 'kantor') {
      jenisCondition = `AND pjs.sidang_keliling = 'T'`
    } else if (jenisSidang === 'keliling') {
      jenisCondition = `AND pjs.sidang_keliling = 'Y'`
    }

    const baseWhere = `
      WHERE pjs.tanggal_sidang = '${targetDate}'
        ${searchCondition}
        ${ruanganCondition}
        ${jenisCondition}
    `

    // 1. Ambil list ruangan unik yang ada pada tanggal ini untuk dropdown filter
    const ruanganListRaw = await prisma.$queryRawUnsafe<any[]>(`
      SELECT DISTINCT pjs.ruangan
      FROM perkara_jadwal_sidang pjs
      WHERE pjs.tanggal_sidang = '${targetDate}'
        AND pjs.ruangan IS NOT NULL AND pjs.ruangan != ''
      ORDER BY pjs.ruangan ASC
    `)
    const ruanganOptions = ruanganListRaw.map((r: any) => r.ruangan).filter(Boolean)

    // 2. Hitung total data
    const countSql = `
      SELECT COUNT(DISTINCT pjs.id) AS total
      FROM perkara_jadwal_sidang pjs
      JOIN perkara p ON p.perkara_id = pjs.perkara_id
      LEFT JOIN perkara_hakim_pn php ON php.perkara_id = p.perkara_id AND php.urutan = 1 AND php.aktif = 'Y'
      LEFT JOIN hakim_pn h ON php.hakim_id = h.id
      LEFT JOIN perkara_panitera_pn ppp ON ppp.perkara_id = p.perkara_id AND ppp.aktif = 'Y'
      LEFT JOIN panitera_pn pan ON ppp.panitera_id = pan.id
      LEFT JOIN perkara_jurusita pjsu ON pjsu.perkara_id = p.perkara_id AND pjsu.aktif = 'Y'
      LEFT JOIN jurusita js ON pjsu.jurusita_id = js.id
      ${baseWhere}
    `

    const countResult = await prisma.$queryRawUnsafe<any[]>(countSql)
    const total = Number(countResult?.[0]?.total || 0)

    // 3. Ambil data dengan pagination
    const dataSql = `
      SELECT
        pjs.id AS jadwal_id,
        p.perkara_id,
        p.nomor_perkara,
        p.pihak1_text,
        p.pihak2_text,
        p.tahapan_terakhir_text,
        p.proses_terakhir_text,
        h.nama_gelar AS nama_ketua_majelis,
        pan.nama_gelar AS nama_pp,
        js.nama_gelar AS nama_js,
        pjs.ruangan,
        pjs.sidang_keliling,
        DATEDIFF(CURRENT_DATE, p.tanggal_pendaftaran) AS lamaproses,
        pjs.agenda,
        DATE_FORMAT(pjs.tanggal_sidang, '%Y-%m-%d') AS tanggal_sidang,
        DATE_FORMAT(pjs.jam_sidang, '%H:%i') AS jam_sidang,
        DATE_FORMAT(pjs.sampai_jam, '%H:%i') AS sampai_jam,
        pjs.ditunda,
        pjs.alasan_ditunda,
        pjs.keterangan
      FROM perkara_jadwal_sidang pjs
      JOIN perkara p ON p.perkara_id = pjs.perkara_id
      LEFT JOIN perkara_hakim_pn php ON php.perkara_id = p.perkara_id AND php.urutan = 1 AND php.aktif = 'Y'
      LEFT JOIN hakim_pn h ON php.hakim_id = h.id
      LEFT JOIN perkara_panitera_pn ppp ON ppp.perkara_id = p.perkara_id AND ppp.aktif = 'Y'
      LEFT JOIN panitera_pn pan ON ppp.panitera_id = pan.id
      LEFT JOIN perkara_jurusita pjsu ON pjsu.perkara_id = p.perkara_id AND pjsu.aktif = 'Y'
      LEFT JOIN jurusita js ON pjsu.jurusita_id = js.id
      ${baseWhere}
      GROUP BY
        pjs.id,
        p.perkara_id,
        p.nomor_perkara,
        p.pihak1_text,
        p.pihak2_text,
        p.tahapan_terakhir_text,
        p.proses_terakhir_text,
        h.nama_gelar,
        pan.nama_gelar,
        js.nama_gelar,
        pjs.ruangan,
        pjs.sidang_keliling,
        p.tanggal_pendaftaran,
        pjs.agenda,
        pjs.tanggal_sidang,
        pjs.jam_sidang,
        pjs.sampai_jam,
        pjs.ditunda,
        pjs.alasan_ditunda,
        pjs.keterangan
      ORDER BY
        pjs.ruangan ASC,
        pjs.jam_sidang ASC,
        p.perkara_id ASC
      LIMIT ${limit} OFFSET ${offset}
    `

    const rawItems = await prisma.$queryRawUnsafe<any[]>(dataSql)
    const items = serializeBigInt(rawItems)

    return {
      success: true,
      date: targetDate,
      ruanganOptions,
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
      message: error?.message || 'Gagal memuat jadwal sidang',
      ruanganOptions: [],
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
