import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const pihakType = (query.pihak_type as string) || 'pihak1'
  const kecamatan = ((query.kecamatan as string) || '').trim()
  const kelurahan = ((query.kelurahan as string) || '').trim()
  const search = ((query.search as string) || '').trim()
  const alur = (query.alur as string) || 'all'
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 15))
  const offset = (page - 1) * limit

  // Jika kecamatan belum dipilih, jangan query database untuk performa maksimal
  if (!kecamatan) {
    return serializeBigInt({
      success: true,
      year,
      page: 1,
      limit,
      total: 0,
      totalPages: 0,
      availableKelurahan: [],
      items: [],
      message: 'Pilih kecamatan terlebih dahulu untuk menampilkan data perkara'
    })
  }

  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31 23:59:59`

  const tablePihak = pihakType === 'pihak2' ? 'perkara_pihak2' : 'perkara_pihak1'

  // Sanitasi filter kecamatan
  const safeKec = kecamatan.replace(/['"\\]/g, '')

  // Filter pp.urutan = 1 penting untuk mencegah duplikasi perkara permohonan yang memiliki banyak pihak1
  // Mendukung 6 kecamatan Jakarta Utara (31.72) dan 2 kecamatan Kepulauan Seribu (31.01)
  let conditions = `
    (rk.kabupaten_kode IN ('31.72', '31.01') OR rk.kecamatan_kode LIKE '31.72%' OR rk.kecamatan_kode LIKE '31.01%')
    AND (
      rk.kecamatan_kode = '${safeKec}'
      OR rk.kecamatan_nama = '${safeKec}'
      OR TRIM(TRAILING '.' FROM rk.kecamatan_nama) = '${safeKec}'
      OR ph.kecamatan = '${safeKec}'
      OR ph.kecamatan LIKE CONCAT('%', '${safeKec}', '%')
    )
    AND p.tanggal_pendaftaran >= '${startDate}'
    AND p.tanggal_pendaftaran <= '${endDate}'
    AND pp.urutan = 1
  `

  let alurCondition = ''
  if (alur === '15') {
    alurCondition = ' AND p.alur_perkara_id = 15'
    conditions += alurCondition
  } else if (alur === '16') {
    alurCondition = ' AND p.alur_perkara_id = 16'
    conditions += alurCondition
  }

  if (kelurahan) {
    const safeKel = kelurahan.replace(/['"\\]/g, '')
    conditions += ` AND (
      rkel.kelurahan_kode = '${safeKel}'
      OR rkel.kelurahan_nama = '${safeKel}'
      OR ph.kelurahan = '${safeKel}'
      OR ph.kelurahan LIKE CONCAT('%', '${safeKel}', '%')
    )`
  }

  if (search) {
    const safeSearch = search.replace(/['"\\]/g, '')
    conditions += ` AND (
      p.nomor_perkara LIKE '%${safeSearch}%'
      OR ph.nama LIKE '%${safeSearch}%'
      OR ph.alamat LIKE '%${safeSearch}%'
      OR rkel.kelurahan_nama LIKE '%${safeSearch}%'
    )`
  }

  try {
    const [countRes, rows, kelurahanList] = await Promise.all([
      // 1. Total perkara terfilter
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(DISTINCT p.perkara_id) AS total
        FROM perkara p
        JOIN ${tablePihak} pp ON pp.perkara_id = p.perkara_id AND pp.urutan = 1
        JOIN pihak ph ON ph.id = pp.pihak_id
        JOIN ref_kecamatan_new rk ON (
          rk.kecamatan_kode = ph.kecamatan
          OR rk.kecamatan_nama = ph.kecamatan
          OR TRIM(TRAILING '.' FROM rk.kecamatan_nama) = ph.kecamatan
          OR ph.kecamatan LIKE CONCAT('%', TRIM(TRAILING '.' FROM rk.kecamatan_nama), '%')
        )
        LEFT JOIN ref_kelurahan_new rkel ON (
          rkel.kelurahan_kode = ph.kelurahan
          OR rkel.kelurahan_nama = ph.kelurahan
        )
        WHERE ${conditions}
      `),

      // 2. Data perkara paginasi
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          p.alur_perkara_id,
          pp.urutan AS urutan_pihak,
          DATE_FORMAT(p.tanggal_pendaftaran, '%Y-%m-%d') AS tanggal_pendaftaran,
          p.proses_terakhir_text,
          p.tahapan_terakhir_text,
          ph.nama AS nama_pihak,
          ph.alamat,
          rk.kecamatan_kode,
          TRIM(TRAILING '.' FROM rk.kecamatan_nama) AS kecamatan_nama,
          COALESCE(rkel.kelurahan_nama, ph.kelurahan, '-') AS kelurahan_nama
        FROM perkara p
        JOIN ${tablePihak} pp ON pp.perkara_id = p.perkara_id AND pp.urutan = 1
        JOIN pihak ph ON ph.id = pp.pihak_id
        JOIN ref_kecamatan_new rk ON (
          rk.kecamatan_kode = ph.kecamatan
          OR rk.kecamatan_nama = ph.kecamatan
          OR TRIM(TRAILING '.' FROM rk.kecamatan_nama) = ph.kecamatan
          OR ph.kecamatan LIKE CONCAT('%', TRIM(TRAILING '.' FROM rk.kecamatan_nama), '%')
        )
        LEFT JOIN ref_kelurahan_new rkel ON (
          rkel.kelurahan_kode = ph.kelurahan
          OR rkel.kelurahan_nama = ph.kelurahan
        )
        WHERE ${conditions}
        ORDER BY p.tanggal_pendaftaran DESC, p.perkara_id DESC
        LIMIT ${limit} OFFSET ${offset}
      `),

      // 3. Daftar kelurahan yang berada di bawah kecamatan yang sedang dilihat
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          rkel.kelurahan_kode,
          rkel.kelurahan_nama,
          COUNT(DISTINCT p.perkara_id) AS total
        FROM ref_kelurahan_new rkel
        JOIN ref_kecamatan_new rk ON rk.kecamatan_kode = rkel.kecamatan_kode
        LEFT JOIN pihak ph ON (
          ph.kelurahan = rkel.kelurahan_kode
          OR ph.kelurahan = rkel.kelurahan_nama
        )
        LEFT JOIN ${tablePihak} pp ON pp.pihak_id = ph.id AND pp.urutan = 1
        LEFT JOIN perkara p ON p.perkara_id = pp.perkara_id
          AND p.tanggal_pendaftaran >= '${startDate}'
          AND p.tanggal_pendaftaran <= '${endDate}'
          ${alurCondition}
        WHERE (
          rk.kecamatan_kode = '${safeKec}'
          OR rk.kecamatan_nama = '${safeKec}'
          OR TRIM(TRAILING '.' FROM rk.kecamatan_nama) = '${safeKec}'
        )
        GROUP BY rkel.kelurahan_kode, rkel.kelurahan_nama
        ORDER BY rkel.kelurahan_nama ASC
      `)
    ])

    const total = Number(countRes[0]?.total || 0)
    const totalPages = Math.ceil(total / limit)

    const availableKelurahan = (kelurahanList || []).map(k => ({
      kode: k.kelurahan_kode,
      nama: k.kelurahan_nama,
      total: Number(k.total || 0)
    }))

    return serializeBigInt({
      success: true,
      year,
      page,
      limit,
      total,
      totalPages,
      availableKelurahan,
      items: rows
    })
  } catch (error: any) {
    console.error('Error /api/geografi/detail:', error)
    return {
      success: false,
      year,
      page,
      limit,
      total: 0,
      totalPages: 0,
      availableKelurahan: [],
      items: [],
      message: error.message || 'Gagal mengambil data detail perkara wilayah'
    }
  }
})
