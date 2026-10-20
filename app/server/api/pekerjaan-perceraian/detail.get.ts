import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const month = query.month && query.month !== 'all' && !isNaN(Number(query.month)) ? Number(query.month) : null
  const jenisCerai = (query.jenis_cerai as string) || 'all'
  const pekerjaan = (query.pekerjaan as string) || 'all'
  const search = (query.search as string) || ''
  const page = query.page && !isNaN(Number(query.page)) && Number(query.page) > 0 ? Number(query.page) : 1
  const limit = query.limit && !isNaN(Number(query.limit)) && Number(query.limit) > 0 ? Number(query.limit) : 10
  const offset = (page - 1) * limit

  // 1. Date condition
  let dateCondition = `p.tanggal_pendaftaran >= '${year}-01-01' AND p.tanggal_pendaftaran <= '${year}-12-31 23:59:59'`
  if (month) {
    const monthStr = month < 10 ? `0${month}` : `${month}`
    dateCondition = `p.tanggal_pendaftaran >= '${year}-${monthStr}-01' AND p.tanggal_pendaftaran <= LAST_DAY('${year}-${monthStr}-01')`
  }

  // 2. Jenis perkara condition
  let jenisCondition = 'AND p.jenis_perkara_id IN (346, 347)'
  if (jenisCerai === 'Cerai Gugat') {
    jenisCondition = 'AND p.jenis_perkara_id = 347'
  } else if (jenisCerai === 'Cerai Talak') {
    jenisCondition = 'AND p.jenis_perkara_id = 346'
  }

  // 3. Pekerjaan filter
  let pekerjaanCondition = ''
  if (pekerjaan && pekerjaan !== 'all') {
    if (pekerjaan === 'Tidak Diketahui') {
      pekerjaanCondition = `AND (ph.pekerjaan IS NULL OR TRIM(ph.pekerjaan) = '' OR ph.pekerjaan = '-')`
    } else {
      const safePekerjaan = pekerjaan.replace(/['"\\]/g, '')
      pekerjaanCondition = `AND (
        TRIM(TRAILING ',' FROM TRIM(TRAILING '.' FROM TRIM(ph.pekerjaan))) = '${safePekerjaan}'
        OR REPLACE(TRIM(TRAILING ',' FROM TRIM(TRAILING '.' FROM TRIM(ph.pekerjaan))), '  ', ' ') = '${safePekerjaan}'
      )`
    }
  }

  // 4. Search filter
  let searchCondition = ''
  if (search) {
    const safeSearch = search.replace(/['"\\]/g, '')
    searchCondition = `AND (
      p.nomor_perkara LIKE '%${safeSearch}%'
      OR ph.nama LIKE '%${safeSearch}%'
      OR ph.alamat LIKE '%${safeSearch}%'
    )`
  }

  try {
    const [countRes, itemsRes] = await Promise.all([
      // Total count query
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(DISTINCT p.perkara_id) AS total
        FROM perkara p
        JOIN perkara_pihak1 pp ON pp.perkara_id = p.perkara_id AND pp.urutan = 1
        JOIN pihak ph ON ph.id = pp.pihak_id
        WHERE ${dateCondition} ${jenisCondition} ${pekerjaanCondition} ${searchCondition}
      `).catch(() => [{ total: 0 }]),

      // Paginated items query
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          DATE_FORMAT(p.tanggal_pendaftaran, '%Y-%m-%d') AS tanggal_pendaftaran,
          p.jenis_perkara_nama,
          ph.nama AS nama_pengaju,
          COALESCE(ph.pekerjaan, 'Tidak Diketahui') AS pekerjaan_pengaju,
          p.proses_terakhir_text,
          p.tahapan_terakhir_text,
          DATE_FORMAT(pput.tanggal_putusan, '%Y-%m-%d') AS tanggal_putusan,
          st.nama AS status_putusan_nama
        FROM perkara p
        JOIN perkara_pihak1 pp ON pp.perkara_id = p.perkara_id AND pp.urutan = 1
        JOIN pihak ph ON ph.id = pp.pihak_id
        LEFT JOIN perkara_putusan pput ON pput.perkara_id = p.perkara_id
        LEFT JOIN status_putusan st ON st.id = pput.status_putusan_id
        WHERE ${dateCondition} ${jenisCondition} ${pekerjaanCondition} ${searchCondition}
        ORDER BY p.tanggal_pendaftaran DESC, p.perkara_id DESC
        LIMIT ${limit} OFFSET ${offset}
      `).catch(() => [])
    ])

    const total = Number(countRes[0]?.total || 0)
    const totalPages = Math.ceil(total / limit)

    return serializeBigInt({
      success: true,
      page,
      limit,
      total,
      totalPages,
      items: itemsRes
    })
  } catch (error: any) {
    console.error('Error fetching pekerjaan perceraian detail:', error)
    return {
      success: false,
      message: error?.message || 'Gagal memuat detail perkara pekerjaan perceraian',
      page,
      limit,
      total: 0,
      totalPages: 0,
      items: []
    }
  }
})
