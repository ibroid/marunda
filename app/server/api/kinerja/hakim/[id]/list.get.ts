import { defineEventHandler, getQuery, getRouterParam } from 'h3'
import { prisma, serializeBigInt } from '../../../../utils/db'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const hakimId = idParam && !isNaN(Number(idParam)) ? Number(idParam) : null
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const role = query.role === 'semua' ? 'semua' : 'ketua'
  const tab = typeof query.tab === 'string' ? query.tab : 'semua'
  const page = query.page && !isNaN(Number(query.page)) && Number(query.page) > 0 ? Number(query.page) : 1
  const limit = query.limit && !isNaN(Number(query.limit)) && Number(query.limit) > 0 ? Math.min(100, Number(query.limit)) : 15
  const offset = (page - 1) * limit
  const q = typeof query.q === 'string' ? query.q.trim() : ''

  if (!hakimId) {
    return {
      success: false,
      message: 'ID Hakim tidak valid'
    }
  }

  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31 23:59:59`

  const hakimCondition = role === 'semua'
    ? `FIND_IN_SET('${hakimId}', pt.majelis_hakim_id)`
    : `CAST(SUBSTRING_INDEX(pt.majelis_hakim_id, ',', 1) AS UNSIGNED) = ${hakimId}`

  // Tab Condition
  let tabCondition = ''
  if (tab === 'aktif') {
    tabCondition = 'AND pp.tanggal_putusan IS NULL'
  } else if (tab === 'putus') {
    tabCondition = 'AND pp.tanggal_putusan IS NOT NULL'
  } else if (tab === 'belum_minutasi') {
    tabCondition = "AND pp.tanggal_putusan IS NOT NULL AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi = '')"
  } else if (tab === 'tunggakan') {
    tabCondition = 'AND pp.tanggal_putusan IS NULL AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) > 90'
  } else if (tab === 'belum_edoc') {
    tabCondition = "AND pp.tanggal_putusan IS NOT NULL AND (pp.amar_putusan_dok IS NULL OR pp.amar_putusan_dok = '')"
  }

  // Search Condition
  let searchCondition = ''
  if (q) {
    const safeQ = q.replace(/['"\\]/g, '')
    searchCondition = `AND (p.nomor_perkara LIKE '%${safeQ}%' OR p.para_pihak LIKE '%${safeQ}%' OR p.jenis_perkara_nama LIKE '%${safeQ}%')`
  }

  try {
    const [countRes, listRes] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(p.perkara_id) AS total
        FROM perkara_penetapan pt
        JOIN perkara p ON p.perkara_id = pt.perkara_id
        LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        WHERE pt.penetapan_majelis_hakim >= '${startDate}' AND pt.penetapan_majelis_hakim <= '${endDate}'
          AND ${hakimCondition}
          ${tabCondition}
          ${searchCondition}
      `),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          p.tanggal_pendaftaran,
          p.para_pihak,
          p.proses_terakhir_text,
          pp.tanggal_putusan,
          pp.tanggal_minutasi,
          pp.amar_putusan_dok,
          pt.majelis_hakim_nama,
          pt.panitera_pengganti_text,
          DATEDIFF(COALESCE(pp.tanggal_putusan, CURDATE()), p.tanggal_pendaftaran) AS usia_hari
        FROM perkara_penetapan pt
        JOIN perkara p ON p.perkara_id = pt.perkara_id
        LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        WHERE pt.penetapan_majelis_hakim >= '${startDate}' AND pt.penetapan_majelis_hakim <= '${endDate}'
          AND ${hakimCondition}
          ${tabCondition}
          ${searchCondition}
        ORDER BY p.tanggal_pendaftaran DESC
        LIMIT ${limit} OFFSET ${offset}
      `)
    ])

    const total = Number(countRes[0]?.total || 0)
    const totalPages = Math.ceil(total / limit)

    const items = listRes.map((item) => {
      const isPutus = Boolean(item.tanggal_putusan)
      const isMinutasi = Boolean(item.tanggal_minutasi && item.tanggal_minutasi !== '0000-00-00' && item.tanggal_minutasi !== '')
      const isEdoc = Boolean(item.amar_putusan_dok && item.amar_putusan_dok !== '')
      const usiaHari = Number(item.usia_hari || 0)

      return {
        perkara_id: Number(item.perkara_id),
        nomor_perkara: item.nomor_perkara || '-',
        jenis_perkara_nama: item.jenis_perkara_nama || '-',
        tanggal_pendaftaran: item.tanggal_pendaftaran,
        para_pihak: item.para_pihak || '-',
        proses_terakhir_text: item.proses_terakhir_text || '-',
        tanggal_putusan: item.tanggal_putusan,
        tanggal_minutasi: item.tanggal_minutasi,
        amar_putusan_dok: item.amar_putusan_dok,
        majelis_hakim_nama: item.majelis_hakim_nama || '-',
        panitera_pengganti_text: item.panitera_pengganti_text || '-',
        usia_hari: usiaHari,
        is_putus: isPutus,
        is_minutasi: isMinutasi,
        is_edoc: isEdoc,
        is_tunggakan: !isPutus && usiaHari > 90
      }
    })

    return serializeBigInt({
      success: true,
      year,
      tab,
      role,
      page,
      limit,
      total,
      totalPages,
      items
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat rincian perkara hakim'
    }
  }
})
