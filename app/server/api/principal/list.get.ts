import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = ((query.search as string) || '').trim()
  const searchBy = (query.searchBy as string) || 'semua'
  const jenisPihak = (query.jenisPihak as string) || 'all'
  const jenisKelamin = (query.jenisKelamin as string) || 'all'
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(10, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  // Sesuai aturan kebutuhan:
  // Data pihak sangat banyak (>120.000). Halaman awal tidak menampilkan data apa-apa sampai user mencari.
  if (!search) {
    return {
      success: true,
      requiresSearch: true,
      message: 'Silakan masukkan kata kunci untuk mencari data pihak.',
      page: 1,
      limit,
      total: 0,
      totalPages: 0,
      data: []
    }
  }

  // Sanitasi search query untuk SQL injection prevention
  const safeSearch = search.replace(/['"\\]/g, '')

  const conditions: string[] = []

  // Kriteria pencarian teks
  if (searchBy === 'nama') {
    conditions.push(`ph.nama LIKE '%${safeSearch}%'`)
  } else if (searchBy === 'nomor_indentitas') {
    conditions.push(`ph.nomor_indentitas LIKE '%${safeSearch}%'`)
  } else if (searchBy === 'telepon') {
    conditions.push(`ph.telepon LIKE '%${safeSearch}%'`)
  } else if (searchBy === 'alamat') {
    conditions.push(`(
      ph.alamat LIKE '%${safeSearch}%'
      OR ph.kecamatan LIKE '%${safeSearch}%'
      OR ph.kelurahan LIKE '%${safeSearch}%'
      OR ph.kabupaten LIKE '%${safeSearch}%'
    )`)
  } else if (searchBy === 'pekerjaan') {
    conditions.push(`ph.pekerjaan LIKE '%${safeSearch}%'`)
  } else {
    // Default 'semua' kriteria
    conditions.push(`(
      ph.nama LIKE '%${safeSearch}%'
      OR ph.nomor_indentitas LIKE '%${safeSearch}%'
      OR ph.telepon LIKE '%${safeSearch}%'
      OR ph.alamat LIKE '%${safeSearch}%'
      OR ph.pekerjaan LIKE '%${safeSearch}%'
    )`)
  }

  // Filter Jenis Pihak
  if (jenisPihak !== 'all' && !isNaN(Number(jenisPihak))) {
    conditions.push(`ph.jenis_pihak_id = ${Number(jenisPihak)}`)
  }

  // Filter Jenis Kelamin
  if (jenisKelamin === 'L' || jenisKelamin === 'P') {
    conditions.push(`ph.jenis_kelamin = '${jenisKelamin}'`)
  }

  // Filter Khusus: Pihak BUKAN Saksi
  // Menyaring dan mengecualikan pihak yang hanya tercatat sebagai saksi persidangan
  // (perkara_pihak5, perkara_saksi_verzet, atau berketerangan saksi) dan tidak memiliki
  // perkara sebagai pihak prinsipal (Penggugat/Pemohon, Tergugat/Termohon, Intervensi, atau Turut Tergugat).
  conditions.push(`(
    NOT EXISTS (
      SELECT 1 FROM perkara_pihak5 pp5
      WHERE pp5.pihak_id = ph.id
        AND NOT EXISTS (SELECT 1 FROM perkara_pihak1 pp1 WHERE pp1.pihak_id = ph.id)
        AND NOT EXISTS (SELECT 1 FROM perkara_pihak2 pp2 WHERE pp2.pihak_id = ph.id)
        AND NOT EXISTS (SELECT 1 FROM perkara_pihak3 pp3 WHERE pp3.pihak_id = ph.id)
        AND NOT EXISTS (SELECT 1 FROM perkara_pihak4 pp4 WHERE pp4.pihak_id = ph.id)
    )
    AND NOT EXISTS (
      SELECT 1 FROM perkara_saksi_verzet psv
      WHERE psv.pihak_id = ph.id
        AND NOT EXISTS (SELECT 1 FROM perkara_pihak1 pp1 WHERE pp1.pihak_id = ph.id)
        AND NOT EXISTS (SELECT 1 FROM perkara_pihak2 pp2 WHERE pp2.pihak_id = ph.id)
    )
    AND (
      ph.keterangan IS NULL
      OR ph.keterangan NOT LIKE '%saksi%'
      OR EXISTS (SELECT 1 FROM perkara_pihak1 pp1 WHERE pp1.pihak_id = ph.id)
      OR EXISTS (SELECT 1 FROM perkara_pihak2 pp2 WHERE pp2.pihak_id = ph.id)
    )
  )`)

  const whereClause = conditions.join(' AND ')

  try {
    const [countRes, rows] = await Promise.all([
      // 1. Total count yang super cepat tanpa cross-join lambat
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(ph.id) AS total
        FROM pihak ph
        WHERE ${whereClause}
      `),

      // 2. Paginated rows pihak prinsipal beserta kalkulasi total perkara
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          ph.id,
          ph.nama,
          ph.jenis_pihak_id,
          CASE ph.jenis_pihak_id
            WHEN 1 THEN 'Perorangan'
            WHEN 2 THEN 'Pemerintah'
            WHEN 3 THEN 'Badan Hukum'
            WHEN 4 THEN 'Pemerintah Daerah'
            ELSE 'Lainnya'
          END AS jenis_pihak_nama,
          ph.jenis_indentitas,
          COALESCE(ji.nama, CASE ph.jenis_indentitas WHEN '4' THEN 'KTP' WHEN '6' THEN 'SIM' WHEN '5' THEN 'Paspor' ELSE 'Identitas' END) AS jenis_indentitas_nama,
          ph.nomor_indentitas,
          ph.tempat_lahir,
          DATE_FORMAT(ph.tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir,
          ph.jenis_kelamin,
          ph.alamat,
          COALESCE(ph.kelurahan, '-') AS kelurahan_nama,
          COALESCE(ph.kecamatan, '-') AS kecamatan_nama,
          ph.kabupaten,
          ph.propinsi,
          ph.telepon,
          ph.email,
          ph.pekerjaan,
          ph.pendidikan,
          ph.agama_nama,
          ph.difabel,
          (
            SELECT COUNT(pp.perkara_id)
            FROM perkara_pihak1 pp
            WHERE pp.pihak_id = ph.id
          ) + (
            SELECT COUNT(pp2.perkara_id)
            FROM perkara_pihak2 pp2
            WHERE pp2.pihak_id = ph.id
          ) + (
            SELECT COUNT(pp3.perkara_id)
            FROM perkara_pihak3 pp3
            WHERE pp3.pihak_id = ph.id
          ) + (
            SELECT COUNT(pp4.perkara_id)
            FROM perkara_pihak4 pp4
            WHERE pp4.pihak_id = ph.id
          ) AS total_perkara
        FROM pihak ph
        LEFT JOIN jenis_identitas ji ON ji.id = ph.jenis_indentitas
        WHERE ${whereClause}
        ORDER BY ph.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `)
    ])

    const total = Number(countRes[0]?.total || 0)
    const totalPages = Math.ceil(total / limit)

    return serializeBigInt({
      success: true,
      requiresSearch: false,
      search,
      searchBy,
      page,
      limit,
      total,
      totalPages,
      data: rows
    })
  } catch (error: any) {
    console.error('Error fetching principal list:', error)
    return {
      success: false,
      requiresSearch: false,
      message: error?.message || 'Gagal memuat data pihak',
      page,
      limit,
      total: 0,
      totalPages: 0,
      data: []
    }
  }
})
