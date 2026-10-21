import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const type = typeof query.type === 'string' ? query.type.trim() : 'putus_hari_ini'
  const page = query.page && !isNaN(Number(query.page)) && Number(query.page) > 0 ? Number(query.page) : 1
  const limit = query.limit && !isNaN(Number(query.limit)) && Number(query.limit) > 0 ? Math.min(100, Number(query.limit)) : 10
  const offset = (page - 1) * limit
  const q = typeof query.q === 'string' ? query.q.trim() : ''

  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31 23:59:59`

  try {
    let searchCondition = ''
    if (q) {
      const safeQ = q.replace(/['"\\]/g, '')
      searchCondition = `AND (
        p.nomor_perkara LIKE '%${safeQ}%'
        OR p.para_pihak LIKE '%${safeQ}%'
        OR p.jenis_perkara_nama LIKE '%${safeQ}%'
        OR pt.majelis_hakim_nama LIKE '%${safeQ}%'
        OR pt.panitera_pengganti_text LIKE '%${safeQ}%'
        OR pn.nama_gelar LIKE '%${safeQ}%'
      )`
    }

    let countQuery = ''
    let listQuery = ''
    let whereClause = ''
    let extraSelect = ''

    if (type === 'redaksi_materai_tanpa_putusan') {
      const redaksiWhere = `
        WHERE pb.tanggal_transaksi = CURDATE()
          AND (
            pb.jenis_biaya_id IN (152, 157, 167, 172, 182, 187, 197, 202, 212, 217)
            OR pb.uraian LIKE '%redaksi%'
            OR pb.uraian LIKE '%meterai%'
            OR pb.uraian LIKE '%materai%'
          )
          AND (pp.tanggal_putusan IS NULL OR pp.tanggal_putusan = '0000-00-00' OR pp.tanggal_putusan = '')
          ${searchCondition}
      `

      countQuery = `
        SELECT COUNT(DISTINCT pb.perkara_id) AS total
        FROM perkara_biaya pb
        JOIN perkara p ON p.perkara_id = pb.perkara_id
        LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        LEFT JOIN panitera_pn pn ON pn.id = pt.panitera_pengganti_id
        ${redaksiWhere}
      `

      listQuery = `
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          p.para_pihak,
          p.proses_terakhir_text,
          pb.tanggal_transaksi AS tanggal_biaya,
          pp.tanggal_putusan,
          pp.tanggal_minutasi,
          pp.amar_putusan_dok,
          DATEDIFF(CURDATE(), p.tanggal_pendaftaran) AS selisih_hari,
          pt.majelis_hakim_nama,
          COALESCE(pn.nama_gelar, pt.panitera_pengganti_text) AS panitera_pengganti_nama,
          GROUP_CONCAT(DISTINCT pb.uraian SEPARATOR ', ') AS uraian_biaya,
          SUM(pb.jumlah) AS total_nominal,
          'Belum Putus' AS status_putusan
        FROM perkara_biaya pb
        JOIN perkara p ON p.perkara_id = pb.perkara_id
        LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        LEFT JOIN panitera_pn pn ON pn.id = pt.panitera_pengganti_id
        ${redaksiWhere}
        GROUP BY
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          p.para_pihak,
          p.proses_terakhir_text,
          pb.tanggal_transaksi,
          pp.tanggal_putusan,
          pp.tanggal_minutasi,
          pp.amar_putusan_dok,
          p.tanggal_pendaftaran,
          pt.majelis_hakim_nama,
          pn.nama_gelar,
          pt.panitera_pengganti_text
        ORDER BY p.perkara_id DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (type === 'putus_hari_ini') {
      whereClause = `WHERE pp.tanggal_putusan = CURDATE() ${searchCondition}`
      extraSelect = `
        CASE
          WHEN pp.tanggal_minutasi IS NOT NULL AND pp.tanggal_minutasi != '0000-00-00' AND pp.tanggal_minutasi != '' THEN 'Sudah Minutasi'
          ELSE 'Belum Minutasi'
        END AS status_minutasi,
        CASE
          WHEN pp.amar_putusan_dok IS NOT NULL AND pp.amar_putusan_dok != '' THEN 'e-Doc Ada'
          ELSE 'e-Doc Kosong'
        END AS status_edoc
      `
    } else if (type === 'putus_belum_minutasi') {
      whereClause = `
        WHERE pp.tanggal_putusan = CURDATE()
          AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi = '')
          ${searchCondition}
      `
      extraSelect = `'Belum Minutasi' AS status_minutasi`
    } else if (type === 'belum_edoc_putusan') {
      whereClause = `
        WHERE pp.tanggal_putusan = CURDATE()
          AND (pp.amar_putusan_dok IS NULL OR pp.amar_putusan_dok = '')
          ${searchCondition}
      `
      extraSelect = `'e-Doc Kosong' AS status_edoc`
    } else if (type === 'belum_biaya_redaksi_materai') {
      whereClause = `
        WHERE pp.tanggal_putusan = CURDATE()
          AND p.prodeo = 0
          AND (
            NOT EXISTS (SELECT 1 FROM perkara_biaya pb WHERE pb.perkara_id = p.perkara_id AND pb.jenis_biaya_id IN (157, 172, 187, 202, 217))
            OR
            NOT EXISTS (SELECT 1 FROM perkara_biaya pb WHERE pb.perkara_id = p.perkara_id AND pb.jenis_biaya_id IN (152, 167, 182, 197, 212))
          )
          ${searchCondition}
      `
      extraSelect = `
        CASE
          WHEN NOT EXISTS (SELECT 1 FROM perkara_biaya pb WHERE pb.perkara_id = p.perkara_id AND pb.jenis_biaya_id IN (157, 172, 187, 202, 217))
           AND NOT EXISTS (SELECT 1 FROM perkara_biaya pb WHERE pb.perkara_id = p.perkara_id AND pb.jenis_biaya_id IN (152, 167, 182, 197, 212))
          THEN 'Belum Redaksi & Meterai'
          WHEN NOT EXISTS (SELECT 1 FROM perkara_biaya pb WHERE pb.perkara_id = p.perkara_id AND pb.jenis_biaya_id IN (157, 172, 187, 202, 217))
          THEN 'Belum Biaya Redaksi'
          ELSE 'Belum Biaya Meterai'
        END AS status_biaya
      `
    } else {
      return {
        success: false,
        message: 'Tipe atensi tidak valid'
      }
    }

    if (type !== 'redaksi_materai_tanpa_putusan') {
      countQuery = `
        SELECT COUNT(DISTINCT pp.perkara_id) AS total
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        LEFT JOIN panitera_pn pn ON pn.id = pt.panitera_pengganti_id
        ${whereClause}
      `

      listQuery = `
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          p.para_pihak,
          pp.tanggal_putusan,
          pp.tanggal_minutasi,
          pp.amar_putusan_dok,
          DATEDIFF(CURDATE(), pp.tanggal_putusan) AS selisih_hari,
          MAX(pt.majelis_hakim_nama) AS majelis_hakim_nama,
          COALESCE(MAX(pn.nama_gelar), MAX(pt.panitera_pengganti_text)) AS panitera_pengganti_nama,
          ${extraSelect}
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        LEFT JOIN panitera_pn pn ON pn.id = pt.panitera_pengganti_id
        ${whereClause}
        GROUP BY
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          p.para_pihak,
          pp.tanggal_putusan,
          pp.tanggal_minutasi,
          pp.amar_putusan_dok
        ORDER BY pp.tanggal_putusan DESC, pp.perkara_id DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    const [countResult, daftar] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(countQuery),
      prisma.$queryRawUnsafe<any[]>(listQuery)
    ])

    const total = Number(countResult[0]?.total || 0)

    return serializeBigInt({
      success: true,
      year,
      type,
      page,
      limit,
      total,
      daftar
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat memuat rincian perkara atensi'
    }
  }
})
