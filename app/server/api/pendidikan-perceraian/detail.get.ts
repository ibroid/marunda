import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const month = query.month && query.month !== 'all' && !isNaN(Number(query.month)) ? Number(query.month) : null
  const jenisCerai = (query.jenis_cerai as string) || 'all'
  const hasPendidikanFilter = query.pendidikan_id !== undefined && query.pendidikan_id !== null && query.pendidikan_id !== '' && query.pendidikan_id !== 'all'
  const pendidikanId = hasPendidikanFilter ? Number(query.pendidikan_id) : null
  const search = ((query.search as string) || '').trim()

  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10))
  const offset = (page - 1) * limit

  // 1. Date filter
  let dateCondition = `p.tanggal_pendaftaran >= '${year}-01-01' AND p.tanggal_pendaftaran <= '${year}-12-31 23:59:59'`
  if (month) {
    const monthStr = month < 10 ? `0${month}` : `${month}`
    dateCondition = `p.tanggal_pendaftaran >= '${year}-${monthStr}-01' AND p.tanggal_pendaftaran <= LAST_DAY('${year}-${monthStr}-01')`
  }

  // 2. Jenis cerai filter
  let jenisCondition = 'AND p.jenis_perkara_id IN (346, 347)'
  if (jenisCerai === 'Cerai Gugat') {
    jenisCondition = 'AND p.jenis_perkara_id = 347'
  } else if (jenisCerai === 'Cerai Talak') {
    jenisCondition = 'AND p.jenis_perkara_id = 346'
  }

  // 3. Pendidikan filter
  let pendidikanCondition = ''
  if (pendidikanId !== null) {
    if (pendidikanId === 99) {
      pendidikanCondition = `AND (ph.pendidikan_id IS NULL OR ph.pendidikan_id NOT IN (SELECT id FROM tingkat_pendidikan))`
    } else {
      pendidikanCondition = `AND ph.pendidikan_id = ${pendidikanId}`
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
        LEFT JOIN tingkat_pendidikan tp ON tp.id = ph.pendidikan_id
        WHERE ${dateCondition} ${jenisCondition} ${pendidikanCondition} ${searchCondition}
      `).catch(() => [{ total: 0 }]),

      // Paginated items query
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          DATE_FORMAT(p.tanggal_pendaftaran, '%Y-%m-%d') AS tanggal_pendaftaran,
          p.jenis_perkara_nama,
          ph.nama AS nama_pengaju,
          COALESCE(tp.kode, 'LAINNYA') AS pendidikan_kode,
          COALESCE(tp.nama, 'Lainnya / Tidak Diketahui') AS pendidikan_nama,
          p.proses_terakhir_text,
          p.tahapan_terakhir_text,
          DATE_FORMAT(pput.tanggal_putusan, '%Y-%m-%d') AS tanggal_putusan,
          st.nama AS status_putusan_nama
        FROM perkara p
        JOIN perkara_pihak1 pp ON pp.perkara_id = p.perkara_id AND pp.urutan = 1
        JOIN pihak ph ON ph.id = pp.pihak_id
        LEFT JOIN tingkat_pendidikan tp ON tp.id = ph.pendidikan_id
        LEFT JOIN perkara_putusan pput ON pput.perkara_id = p.perkara_id
        LEFT JOIN status_putusan st ON st.id = pput.status_putusan_id
        WHERE ${dateCondition} ${jenisCondition} ${pendidikanCondition} ${searchCondition}
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
    console.error('Error fetching pendidikan perceraian detail:', error)
    return {
      success: false,
      message: error?.message || 'Gagal memuat detail perkara pendidikan perceraian',
      page,
      limit,
      total: 0,
      totalPages: 0,
      items: []
    }
  }
})
