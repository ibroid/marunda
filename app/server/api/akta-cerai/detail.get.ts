import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const rawYear = query.year
  const isAllYear = rawYear === 'all'
  const year = !isAllYear && rawYear && !isNaN(Number(rawYear)) ? Number(rawYear) : (!isAllYear ? currentYear : null)
  const kategori = (query.kategori as string) || 'cg_belum_ac'

  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20))
  const offset = (page - 1) * limit
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const safeSearch = search.replace(/['"\\]/g, '')

  try {
    let countQuery = ''
    let detailQuery = ''

    if (kategori === 'ct_belum_ikrar') {
      const yearCondition = year ? `AND YEAR(pp.tanggal_bht) = ${year}` : ''
      const searchCondition = safeSearch ? `AND (
        p.nomor_perkara LIKE '%${safeSearch}%'
        OR pt.majelis_hakim_nama LIKE '%${safeSearch}%'
        OR pn.nama_gelar LIKE '%${safeSearch}%'
        OR js.nama_gelar LIKE '%${safeSearch}%'
        OR p.para_pihak LIKE '%${safeSearch}%'
      )` : ''

      countQuery = `
        SELECT COUNT(p.perkara_id) AS total
        FROM perkara p
        JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        LEFT JOIN perkara_ikrar_talak it ON it.perkara_id = p.perkara_id
        LEFT JOIN perkara_penetapan pt ON pt.perkara_id = p.perkara_id
        LEFT JOIN panitera_pn pn ON pn.id = pt.panitera_pengganti_id
        LEFT JOIN jurusita js ON js.id = pt.jurusita_id
        WHERE p.jenis_perkara_id = 346
          AND pp.tanggal_bht IS NOT NULL
          AND (it.tgl_ikrar_talak IS NULL)
          ${yearCondition}
          ${searchCondition}
      `

      detailQuery = `
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          pp.tanggal_putusan,
          pp.tanggal_bht,
          pt.majelis_hakim_nama,
          pn.nama_gelar AS panitera_pengganti_nama,
          js.nama_gelar AS jurusita_nama,
          it.penetapan_majelis_hakim AS tgl_pmh_ikrar,
          it.tanggal_penetapan_sidang_ikrar AS tgl_sidang_ikrar,
          it.tgl_ikrar_talak
        FROM perkara p
        JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        LEFT JOIN perkara_ikrar_talak it ON it.perkara_id = p.perkara_id
        LEFT JOIN perkara_penetapan pt ON pt.perkara_id = p.perkara_id
        LEFT JOIN panitera_pn pn ON pn.id = pt.panitera_pengganti_id
        LEFT JOIN jurusita js ON js.id = pt.jurusita_id
        WHERE p.jenis_perkara_id = 346
          AND pp.tanggal_bht IS NOT NULL
          AND (it.tgl_ikrar_talak IS NULL)
          ${yearCondition}
          ${searchCondition}
        ORDER BY pp.tanggal_bht DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (kategori === 'belum_diambil') {
      const yearCondition = year ? `AND YEAR(ac.tgl_akta_cerai) = ${year}` : ''
      const searchCondition = safeSearch ? `AND (
        p.nomor_perkara LIKE '%${safeSearch}%'
        OR pt.majelis_hakim_nama LIKE '%${safeSearch}%'
        OR pn.nama_gelar LIKE '%${safeSearch}%'
        OR js.nama_gelar LIKE '%${safeSearch}%'
        OR ac.nomor_akta_cerai LIKE '%${safeSearch}%'
        OR ac.no_seri_akta_cerai LIKE '%${safeSearch}%'
        OR p.para_pihak LIKE '%${safeSearch}%'
      )` : ''

      countQuery = `
        SELECT COUNT(ac.perkara_id) AS total
        FROM perkara_akta_cerai ac
        JOIN perkara p ON p.perkara_id = ac.perkara_id
        LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        LEFT JOIN perkara_penetapan pt ON pt.perkara_id = p.perkara_id
        LEFT JOIN panitera_pn pn ON pn.id = pt.panitera_pengganti_id
        LEFT JOIN jurusita js ON js.id = pt.jurusita_id
        WHERE ac.tgl_akta_cerai IS NOT NULL
          AND (ac.tgl_penyerahan_akta_cerai IS NULL OR ac.tgl_penyerahan_akta_cerai_pihak2 IS NULL)
          ${yearCondition}
          ${searchCondition}
      `

      detailQuery = `
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          pp.tanggal_bht,
          pp.tanggal_putusan,
          pt.majelis_hakim_nama,
          pn.nama_gelar AS panitera_pengganti_nama,
          js.nama_gelar AS jurusita_nama,
          ac.nomor_akta_cerai,
          ac.no_seri_akta_cerai,
          ac.tgl_akta_cerai,
          ac.tgl_penyerahan_akta_cerai AS tgl_ambil_p1,
          ac.tgl_penyerahan_akta_cerai_pihak2 AS tgl_ambil_p2
        FROM perkara_akta_cerai ac
        JOIN perkara p ON p.perkara_id = ac.perkara_id
        LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        LEFT JOIN perkara_penetapan pt ON pt.perkara_id = p.perkara_id
        LEFT JOIN panitera_pn pn ON pn.id = pt.panitera_pengganti_id
        LEFT JOIN jurusita js ON js.id = pt.jurusita_id
        WHERE ac.tgl_akta_cerai IS NOT NULL
          AND (ac.tgl_penyerahan_akta_cerai IS NULL OR ac.tgl_penyerahan_akta_cerai_pihak2 IS NULL)
          ${yearCondition}
          ${searchCondition}
        ORDER BY ac.tgl_akta_cerai DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      // Default: cg_belum_ac
      const yearCondition = year ? `AND YEAR(pp.tanggal_bht) = ${year}` : ''
      const searchCondition = safeSearch ? `AND (
        p.nomor_perkara LIKE '%${safeSearch}%'
        OR pt.majelis_hakim_nama LIKE '%${safeSearch}%'
        OR pn.nama_gelar LIKE '%${safeSearch}%'
        OR js.nama_gelar LIKE '%${safeSearch}%'
        OR ac.nomor_akta_cerai LIKE '%${safeSearch}%'
        OR p.para_pihak LIKE '%${safeSearch}%'
      )` : ''

      countQuery = `
        SELECT COUNT(p.perkara_id) AS total
        FROM perkara p
        JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        LEFT JOIN perkara_akta_cerai ac ON ac.perkara_id = p.perkara_id
        LEFT JOIN perkara_penetapan pt ON pt.perkara_id = p.perkara_id
        LEFT JOIN panitera_pn pn ON pn.id = pt.panitera_pengganti_id
        LEFT JOIN jurusita js ON js.id = pt.jurusita_id
        WHERE p.jenis_perkara_id = 347
          AND pp.tanggal_bht IS NOT NULL
          AND (ac.tgl_akta_cerai IS NULL OR ac.nomor_akta_cerai IS NULL)
          ${yearCondition}
          ${searchCondition}
      `

      detailQuery = `
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          pp.tanggal_putusan,
          pp.tanggal_bht,
          pt.majelis_hakim_nama,
          pn.nama_gelar AS panitera_pengganti_nama,
          js.nama_gelar AS jurusita_nama,
          ac.nomor_akta_cerai,
          ac.tgl_akta_cerai
        FROM perkara p
        JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        LEFT JOIN perkara_akta_cerai ac ON ac.perkara_id = p.perkara_id
        LEFT JOIN perkara_penetapan pt ON pt.perkara_id = p.perkara_id
        LEFT JOIN panitera_pn pn ON pn.id = pt.panitera_pengganti_id
        LEFT JOIN jurusita js ON js.id = pt.jurusita_id
        WHERE p.jenis_perkara_id = 347
          AND pp.tanggal_bht IS NOT NULL
          AND (ac.tgl_akta_cerai IS NULL OR ac.nomor_akta_cerai IS NULL)
          ${yearCondition}
          ${searchCondition}
        ORDER BY pp.tanggal_bht DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    const [countResult, detailList] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(countQuery),
      prisma.$queryRawUnsafe<any[]>(detailQuery)
    ])

    const total = Number(countResult[0]?.total || 0)
    const totalPages = Math.ceil(total / limit)

    return serializeBigInt({
      success: true,
      year: year ?? 'all',
      kategori,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      detail: detailList
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat memuat detail perkara akta cerai',
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0
      },
      detail: []
    }
  }
})
