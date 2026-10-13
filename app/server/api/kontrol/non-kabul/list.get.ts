import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawYear = query.year
  const statusFilter = typeof query.status === 'string' ? query.status.trim() : 'all'
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const sort = typeof query.sort === 'string' ? query.sort.trim() : 'putusan_desc'
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  try {
    let yearCondition = ''
    if (rawYear && rawYear !== 'all' && !isNaN(Number(rawYear)) && Number(rawYear) > 0) {
      yearCondition = `AND YEAR(pp.tanggal_putusan) = ${Number(rawYear)}`
    }

    let statusCondition = ''
    if (statusFilter === 'dicabut') {
      statusCondition = 'AND pp.status_putusan_id IN (67, 7, 37)'
    } else if (statusFilter === 'tidak_diterima') {
      statusCondition = 'AND pp.status_putusan_id IN (61, 64, 4, 33, 36, 84)'
    } else if (statusFilter === 'ditolak') {
      statusCondition = 'AND pp.status_putusan_id IN (63, 3, 32, 35)'
    } else if (statusFilter === 'gugur') {
      statusCondition = 'AND pp.status_putusan_id IN (65, 93, 6, 29, 31, 38)'
    } else if (statusFilter === 'dicoret') {
      statusCondition = 'AND pp.status_putusan_id IN (66)'
    } else if (statusFilter === 'perdamaian') {
      statusCondition = 'AND pp.status_putusan_id IN (5, 85)'
    } else if (statusFilter === 'anomali_ac') {
      statusCondition = "AND pac.nomor_akta_cerai IS NOT NULL AND pac.nomor_akta_cerai != ''"
    } else if (statusFilter === 'belum_bht') {
      statusCondition = "AND (pp.tanggal_bht IS NULL OR pp.tanggal_bht = '0000-00-00')"
    } else if (statusFilter === 'belum_minutasi') {
      statusCondition = "AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00')"
    }

    let searchCondition = ''
    if (search) {
      const safeQ = search.replace(/['"\\]/g, '')
      searchCondition = `AND (
        p.nomor_perkara LIKE '%${safeQ}%'
        OR p.para_pihak LIKE '%${safeQ}%'
        OR p.jenis_perkara_nama LIKE '%${safeQ}%'
        OR pt.majelis_hakim_nama LIKE '%${safeQ}%'
        OR pn.nama_gelar LIKE '%${safeQ}%'
        OR js.nama_gelar LIKE '%${safeQ}%'
        OR pac.nomor_akta_cerai LIKE '%${safeQ}%'
      )`
    }

    let orderByClause = 'ORDER BY pp.tanggal_putusan DESC, pp.perkara_id DESC'
    if (sort === 'putusan_asc') {
      orderByClause = 'ORDER BY pp.tanggal_putusan ASC, pp.perkara_id ASC'
    } else if (sort === 'daftar_desc') {
      orderByClause = 'ORDER BY p.tanggal_pendaftaran DESC, pp.perkara_id DESC'
    } else if (sort === 'nomor_asc') {
      orderByClause = 'ORDER BY p.nomor_perkara ASC'
    }

    const whereClause = `
      WHERE pp.tanggal_putusan IS NOT NULL
        AND (pp.status_putusan_id NOT IN (62, 1, 30, 34) OR pp.status_putusan_id IS NULL)
        ${yearCondition}
        ${statusCondition}
        ${searchCondition}
    `

    const [countResult, items] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(pp.perkara_id) AS total
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_akta_cerai pac ON pac.perkara_id = pp.perkara_id
        LEFT JOIN perkara_penetapan pt ON pt.perkara_id = p.perkara_id
        LEFT JOIN panitera_pn pn ON pn.id = pt.panitera_pengganti_id
        LEFT JOIN jurusita js ON js.id = pt.jurusita_id
        ${whereClause}
      `),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          p.para_pihak,
          p.tanggal_pendaftaran,
          pp.tanggal_putusan,
          pp.status_putusan_id,
          COALESCE(sp.nama, pp.status_putusan_nama, 'Non Kabul') AS status_putusan_nama,
          pp.putusan_verstek,
          pp.tanggal_minutasi,
          pp.tanggal_bht,
          pp.amar_putusan_dok,
          pac.nomor_akta_cerai,
          pac.tgl_akta_cerai,
          pt.majelis_hakim_nama,
          pn.nama_gelar AS panitera_pengganti_nama,
          js.nama_gelar AS jurusita_nama,
          CASE
            WHEN pac.nomor_akta_cerai IS NOT NULL AND pac.nomor_akta_cerai != '' THEN 1
            ELSE 0
          END AS is_anomali_ac
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        LEFT JOIN status_putusan sp ON sp.id = pp.status_putusan_id
        LEFT JOIN perkara_penetapan pt ON pt.perkara_id = p.perkara_id
        LEFT JOIN panitera_pn pn ON pn.id = pt.panitera_pengganti_id
        LEFT JOIN jurusita js ON js.id = pt.jurusita_id
        LEFT JOIN perkara_akta_cerai pac ON pac.perkara_id = pp.perkara_id
        ${whereClause}
        ${orderByClause}
        LIMIT ${limit} OFFSET ${offset}
      `)
    ])

    const total = Number(countResult[0]?.total || 0)
    const totalPages = Math.ceil(total / limit)

    return serializeBigInt({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      items: items.map((item: any) => ({
        perkara_id: Number(item.perkara_id),
        nomor_perkara: item.nomor_perkara,
        jenis_perkara_nama: item.jenis_perkara_nama,
        para_pihak: item.para_pihak,
        tanggal_pendaftaran: item.tanggal_pendaftaran,
        tanggal_putusan: item.tanggal_putusan,
        status_putusan_id: item.status_putusan_id !== null ? Number(item.status_putusan_id) : null,
        status_putusan_nama: item.status_putusan_nama,
        putusan_verstek: item.putusan_verstek,
        tanggal_minutasi: item.tanggal_minutasi,
        tanggal_bht: item.tanggal_bht,
        amar_putusan_dok: item.amar_putusan_dok,
        nomor_akta_cerai: item.nomor_akta_cerai,
        tgl_akta_cerai: item.tgl_akta_cerai,
        majelis_hakim_nama: item.majelis_hakim_nama,
        panitera_pengganti_nama: item.panitera_pengganti_nama,
        jurusita_nama: item.jurusita_nama,
        is_anomali_ac: Boolean(item.is_anomali_ac)
      }))
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat memuat daftar perkara non-kabul'
    }
  }
})
