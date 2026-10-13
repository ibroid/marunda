import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31 23:59:59`

  try {
    const [
      belumPmhCount,
      putusHariIniCount,
      putusBelumEdocCount,
      belumPmhList,
      putusHariIniList,
      putusBelumEdocList
    ] = await Promise.all([
      // Total Belum PMH
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(p.perkara_id) AS total
        FROM perkara p
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        WHERE p.tanggal_pendaftaran >= '${startDate}' AND p.tanggal_pendaftaran <= '${endDate}'
          AND (pt.penetapan_majelis_hakim IS NULL OR pt.penetapan_majelis_hakim = '')
      `),

      // Total Putus Hari Ini
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(pp.perkara_id) AS total
        FROM perkara_putusan pp
        WHERE pp.tanggal_putusan = CURDATE()
      `),

      // Total Putus Belum Upload e-Doc
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(pp.perkara_id) AS total
        FROM perkara_putusan pp
        WHERE pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND (pp.amar_putusan_dok IS NULL OR pp.amar_putusan_dok = '')
      `),

      // Top 10 Belum PMH
      prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, p.tanggal_pendaftaran, p.jenis_perkara_nama, p.para_pihak
        FROM perkara p
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        WHERE p.tanggal_pendaftaran >= '${startDate}' AND p.tanggal_pendaftaran <= '${endDate}'
          AND (pt.penetapan_majelis_hakim IS NULL OR pt.penetapan_majelis_hakim = '')
        ORDER BY p.tanggal_pendaftaran DESC
        LIMIT 10
      `),

      // Top 10 Putus Hari Ini
      prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, pp.tanggal_putusan, pt.majelis_hakim_nama
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        WHERE pp.tanggal_putusan = CURDATE()
        LIMIT 10
      `),

      // Top 10 Putus Belum e-Doc
      prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, pp.tanggal_putusan, pt.majelis_hakim_nama
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        WHERE pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND (pp.amar_putusan_dok IS NULL OR pp.amar_putusan_dok = '')
        ORDER BY pp.tanggal_putusan DESC
        LIMIT 10
      `)
    ])

    return serializeBigInt({
      success: true,
      year,
      atensi: {
        belumPmh: {
          total: Number(belumPmhCount[0]?.total || 0),
          daftar: belumPmhList
        },
        putusHariIni: {
          total: Number(putusHariIniCount[0]?.total || 0),
          daftar: putusHariIniList
        },
        putusBelumEdoc: {
          total: Number(putusBelumEdocCount[0]?.total || 0),
          daftar: putusBelumEdocList
        }
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat data atensi ketua'
    }
  }
})
