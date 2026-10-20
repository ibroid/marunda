import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const month = query.month && query.month !== 'all' && !isNaN(Number(query.month)) ? Number(query.month) : null
  const kategori = (query.kategori as string) || 'all'
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

  // 2. Jenis perkara Dispensasi Nikah
  const jenisCondition = 'AND (p.jenis_perkara_id IN (85, 362) OR p.jenis_perkara_nama LIKE "%dispensasi%")'

  // 3. Kategori filter
  let anakCondition = ''
  if (kategori === 'pria') {
    anakCondition = 'AND m.jenis_mempelai = "1"'
  } else if (kategori === 'wanita') {
    anakCondition = 'AND m.jenis_mempelai = "2"'
  } else if (kategori === 'anak') {
    anakCondition = 'AND (m.dimohonkan = 1 OR (m.dimohonkan IS NULL AND TIMESTAMPDIFF(YEAR, m.tanggal_lahir, p.tanggal_pendaftaran) < 19))'
  }

  // 4. Pendidikan filter
  let pendidikanCondition = ''
  if (pendidikanId !== null) {
    if (pendidikanId === 99) {
      pendidikanCondition = `AND (m.pendidikan IS NULL OR m.pendidikan NOT IN (SELECT id FROM tingkat_pendidikan))`
    } else {
      pendidikanCondition = `AND m.pendidikan = ${pendidikanId}`
    }
  }

  // 5. Search filter
  let searchCondition = ''
  if (search) {
    const safeSearch = search.replace(/['"\\]/g, '')
    searchCondition = `AND (
      p.nomor_perkara LIKE '%${safeSearch}%'
      OR m.nama LIKE '%${safeSearch}%'
      OR pp.nama LIKE '%${safeSearch}%'
      OR pp.alamat LIKE '%${safeSearch}%'
    )`
  }

  try {
    const [countRes, itemsRes] = await Promise.all([
      // Total count query
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(m.id) AS total
        FROM perkara p
        JOIN perkara_mempelai_dk m ON m.perkara_id = p.perkara_id
        LEFT JOIN perkara_pihak1 pp ON pp.perkara_id = p.perkara_id AND pp.urutan = 1
        LEFT JOIN tingkat_pendidikan tp ON tp.id = m.pendidikan
        WHERE ${dateCondition} ${jenisCondition} ${anakCondition} ${pendidikanCondition} ${searchCondition}
      `).catch(() => [{ total: 0 }]),

      // Paginated items query
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.tanggal_pendaftaran,
          p.jenis_perkara_nama,
          pp.nama AS pemohon_nama,
          pp.alamat AS pemohon_alamat,
          m.id AS mempelai_id,
          m.nama AS nama_anak,
          m.jenis_mempelai,
          m.tempat_lahir,
          m.tanggal_lahir,
          TIMESTAMPDIFF(YEAR, m.tanggal_lahir, p.tanggal_pendaftaran) AS usia_saat_daftar,
          m.dimohonkan,
          m.pekerjaan AS pekerjaan_kode,
          rpek.nama AS pekerjaan_nama,
          COALESCE(tp.id, 99) AS pendidikan_id,
          COALESCE(tp.kode, 'LAINNYA') AS pendidikan_kode,
          COALESCE(tp.nama, 'Lainnya / Tidak Diketahui') AS pendidikan_nama,
          pr.tanggal_putusan,
          pr.status_putusan_nama
        FROM perkara p
        JOIN perkara_mempelai_dk m ON m.perkara_id = p.perkara_id
        LEFT JOIN perkara_pihak1 pp ON pp.perkara_id = p.perkara_id AND pp.urutan = 1
        LEFT JOIN tingkat_pendidikan tp ON tp.id = m.pendidikan
        LEFT JOIN ref_pekerjaan rpek ON rpek.id = m.pekerjaan
        LEFT JOIN perkara_putusan pr ON pr.perkara_id = p.perkara_id
        WHERE ${dateCondition} ${jenisCondition} ${anakCondition} ${pendidikanCondition} ${searchCondition}
        ORDER BY p.tanggal_pendaftaran DESC, m.jenis_mempelai ASC
        LIMIT ${limit} OFFSET ${offset}
      `).catch(() => [])
    ])

    const total = Number(countRes[0]?.total || 0)
    const totalPages = Math.ceil(total / limit) || 1

    const items = itemsRes.map((item) => {
      const isLaki = item.jenis_mempelai === '1'
      return {
        perkaraId: Number(item.perkara_id),
        nomorPerkara: item.nomor_perkara || '-',
        tanggalPendaftaran: item.tanggal_pendaftaran,
        jenisPerkaraNama: item.jenis_perkara_nama || 'Dispensasi Kawin',
        pemohonNama: item.pemohon_nama || '-',
        pemohonAlamat: item.pemohon_alamat || '-',
        mempelaiId: Number(item.mempelai_id),
        namaAnak: item.nama_anak || '-',
        jenisMempelai: item.jenis_mempelai,
        jenisMempelaiLabel: isLaki ? 'Calon Suami (L)' : 'Calon Istri (P)',
        isLaki,
        tempatLahir: item.tempat_lahir || '-',
        tanggalLahir: item.tanggal_lahir,
        usiaSaatDaftar: item.usia_saat_daftar !== null ? Number(item.usia_saat_daftar) : null,
        dimohonkan: item.dimohonkan === 1,
        pekerjaanNama: item.pekerjaan_nama || (item.pekerjaan_kode ? `Kode ${item.pekerjaan_kode}` : '-'),
        pendidikanId: Number(item.pendidikan_id),
        pendidikanKode: item.pendidikan_kode,
        pendidikanNama: item.pendidikan_nama,
        tanggalPutusan: item.tanggal_putusan,
        statusPutusanNama: item.status_putusan_nama || null
      }
    })

    return serializeBigInt({
      success: true,
      year,
      month,
      kategori,
      pendidikanId,
      page,
      limit,
      total,
      totalPages,
      items
    })
  } catch (error: any) {
    console.error('Error fetching detail perkara pendidikan dispensasi:', error)
    return serializeBigInt({
      success: false,
      year,
      month,
      kategori,
      pendidikanId,
      page,
      limit,
      total: 0,
      totalPages: 1,
      items: [],
      error: error?.message || 'Terjadi kesalahan sistem'
    })
  }
})
