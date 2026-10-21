import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = ((query.search as string) || '').trim()
  const searchBy = (query.searchBy as string) || 'semua'
  const saksiPihakKe = (query.saksiPihakKe as string) || 'all'
  const jenisSaksi = (query.jenisSaksi as string) || 'all'
  const jenisKelamin = (query.jenisKelamin as string) || 'all'
  const year = (query.year as string) || 'all'
  const hasKeterangan = (query.hasKeterangan as string) || 'all'
  const sortBy = (query.sortBy as string) || 'id_desc'
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(10, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  const conditions: string[] = []

  // Kriteria Pencarian Kata Kunci
  if (search) {
    const safeSearch = search.replace(/['"\\]/g, '')
    if (searchBy === 'nama') {
      conditions.push(`(ph.nama LIKE '%${safeSearch}%' OR pp5.nama LIKE '%${safeSearch}%')`)
    } else if (searchBy === 'nomor_indentitas') {
      conditions.push(`ph.nomor_indentitas LIKE '%${safeSearch}%'`)
    } else if (searchBy === 'nomor_perkara') {
      conditions.push(`p.nomor_perkara LIKE '%${safeSearch}%'`)
    } else if (searchBy === 'pekerjaan') {
      conditions.push(`ph.pekerjaan LIKE '%${safeSearch}%'`)
    } else if (searchBy === 'alamat') {
      conditions.push(`(
        ph.alamat LIKE '%${safeSearch}%'
        OR pp5.alamat LIKE '%${safeSearch}%'
        OR ph.kelurahan LIKE '%${safeSearch}%'
        OR ph.kecamatan LIKE '%${safeSearch}%'
        OR ph.kabupaten LIKE '%${safeSearch}%'
      )`)
    } else {
      // Default 'semua' kriteria
      conditions.push(`(
        ph.nama LIKE '%${safeSearch}%'
        OR pp5.nama LIKE '%${safeSearch}%'
        OR ph.nomor_indentitas LIKE '%${safeSearch}%'
        OR p.nomor_perkara LIKE '%${safeSearch}%'
        OR ph.pekerjaan LIKE '%${safeSearch}%'
        OR ph.alamat LIKE '%${safeSearch}%'
        OR pp5.alamat LIKE '%${safeSearch}%'
      )`)
    }
  }

  // Filter Saksi Pihak Ke (1 = Penggugat / Pemohon, 2 = Tergugat / Termohon)
  if (saksiPihakKe === '1' || saksiPihakKe === '2') {
    conditions.push(`pp5.saksi_pihak_ke = ${Number(saksiPihakKe)}`)
  }

  // Filter Jenis Saksi (1 = Saksi Fakta, 2 = Saksi Ahli)
  if (jenisSaksi === '1' || jenisSaksi === '2') {
    conditions.push(`pp5.jenis_saksi = '${jenisSaksi}'`)
  }

  // Filter Jenis Kelamin
  if (jenisKelamin === 'L' || jenisKelamin === 'P') {
    conditions.push(`ph.jenis_kelamin = '${jenisKelamin}'`)
  }

  // Filter Tahun Perkara
  if (year !== 'all' && !isNaN(Number(year))) {
    conditions.push(`YEAR(p.tanggal_pendaftaran) = ${Number(year)}`)
  }

  // Filter Berita Acara / Keterangan Persidangan
  if (hasKeterangan === 'yes') {
    conditions.push(`EXISTS (SELECT 1 FROM perkara_keterangan_saksi pks WHERE pks.saksi_id = pp5.id)`)
  } else if (hasKeterangan === 'no') {
    conditions.push(`NOT EXISTS (SELECT 1 FROM perkara_keterangan_saksi pks WHERE pks.saksi_id = pp5.id)`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Pengurutan (Sorting)
  let orderBy = 'pp5.id DESC'
  if (sortBy === 'nama_asc') {
    orderBy = 'COALESCE(ph.nama, pp5.nama) ASC'
  } else if (sortBy === 'perkara_desc') {
    orderBy = 'p.tanggal_pendaftaran DESC, pp5.id DESC'
  }

  try {
    const [countRes, rows] = await Promise.all([
      // 1. Total hitung data sesuai kriteria filter
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(pp5.id) AS total
        FROM perkara_pihak5 pp5
        LEFT JOIN pihak ph ON pp5.pihak_id = ph.id
        LEFT JOIN perkara p ON pp5.perkara_id = p.perkara_id
        ${whereClause}
      `),

      // 2. Data baris saksi
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          pp5.id AS saksi_id,
          pp5.perkara_id,
          pp5.urutan,
          pp5.saksi_pihak_ke,
          pp5.jenis_saksi,
          pp5.keterangan AS keterangan_saksi,
          COALESCE(ph.nama, pp5.nama, 'Nama Belum Tercatat') AS nama,
          COALESCE(ph.alamat, pp5.alamat, '-') AS alamat,
          ph.id AS pihak_id,
          ph.nomor_indentitas,
          ph.jenis_kelamin,
          ph.pekerjaan,
          ph.telepon,
          ph.pendidikan,
          ph.agama_nama,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          DATE_FORMAT(p.tanggal_pendaftaran, '%Y-%m-%d') AS tanggal_pendaftaran,
          p.proses_terakhir_text,
          (
            SELECT COUNT(*)
            FROM perkara_keterangan_saksi pks
            WHERE pks.saksi_id = pp5.id
          ) AS total_keterangan
        FROM perkara_pihak5 pp5
        LEFT JOIN pihak ph ON pp5.pihak_id = ph.id
        LEFT JOIN perkara p ON pp5.perkara_id = p.perkara_id
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ${limit} OFFSET ${offset}
      `)
    ])

    const total = Number(countRes[0]?.total || 0)
    const totalPages = Math.ceil(total / limit)

    return serializeBigInt({
      success: true,
      page,
      limit,
      total,
      totalPages,
      data: rows.map((row) => ({
        ...row,
        total_keterangan: Number(row.total_keterangan || 0),
        has_keterangan: Number(row.total_keterangan || 0) > 0
      }))
    })
  } catch (error: any) {
    console.error('Error fetching saksi list:', error)
    return {
      success: false,
      message: error?.message || 'Gagal memuat daftar saksi',
      page,
      limit,
      total: 0,
      totalPages: 0,
      data: []
    }
  }
})
