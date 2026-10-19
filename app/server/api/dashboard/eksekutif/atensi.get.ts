import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear

  try {
    const [
      putusHariIniCount,
      putusBelumMinutCount,
      belumEdocPutusanCount,
      belumBiayaRedaksiMateraiCount,
      redaksiMateraiTanpaPutusanCount,
      putusHariIni,
      putusBelumMinut,
      belumEdocPutusan,
      belumBiayaRedaksiMaterai,
      redaksiMateraiTanpaPutusan
    ] = await Promise.all([
      // Count 1. Total Putus Hari Ini
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(pp.perkara_id) AS total
        FROM perkara_putusan pp
        WHERE pp.tanggal_putusan = CURDATE()
      `),

      // Count 2. Putus Hari Ini Belum Minutasi
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(pp.perkara_id) AS total
        FROM perkara_putusan pp
        WHERE pp.tanggal_putusan = CURDATE()
          AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi = '')
      `),

      // Count 3. Putus Hari Ini Belum Upload e-Doc Putusan
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(pp.perkara_id) AS total
        FROM perkara_putusan pp
        WHERE pp.tanggal_putusan = CURDATE()
          AND (pp.amar_putusan_dok IS NULL OR pp.amar_putusan_dok = '')
      `),

      // Count 4. Putus Hari Ini Belum Biaya Redaksi/Meterai
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(p.perkara_id) AS total
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan = CURDATE()
          AND p.prodeo = 0
          AND (
            NOT EXISTS (SELECT 1 FROM perkara_biaya pb WHERE pb.perkara_id = p.perkara_id AND pb.jenis_biaya_id IN (157, 172, 187, 202, 217))
            OR
            NOT EXISTS (SELECT 1 FROM perkara_biaya pb WHERE pb.perkara_id = p.perkara_id AND pb.jenis_biaya_id IN (152, 167, 182, 197, 212))
          )
      `),

      // Count 5. Redaksi dan Meterai Hari Ini Tanpa Putusan
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(DISTINCT pb.perkara_id) AS total
        FROM perkara_biaya pb
        JOIN perkara p ON p.perkara_id = pb.perkara_id
        LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        WHERE pb.tanggal_transaksi = CURDATE()
          AND (
            pb.jenis_biaya_id IN (152, 157, 167, 172, 182, 187, 197, 202, 212, 217)
            OR pb.uraian LIKE '%redaksi%'
            OR pb.uraian LIKE '%meterai%'
            OR pb.uraian LIKE '%materai%'
          )
          AND (pp.tanggal_putusan IS NULL OR pp.tanggal_putusan = '0000-00-00' OR pp.tanggal_putusan = '')
      `),

      // Top 10 data untuk display singkat
      // 1. Putus Hari Ini
      prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, pp.tanggal_putusan
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan = CURDATE()
        ORDER BY pp.perkara_id DESC
        LIMIT 10
      `),

      // 2. Putus Hari Ini Belum Minutasi
      prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, pp.tanggal_putusan
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan = CURDATE()
          AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi = '')
        ORDER BY pp.perkara_id DESC
        LIMIT 10
      `),

      // 3. Putus Hari Ini Belum e-Doc Amar Putusan
      prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, pp.tanggal_putusan
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan = CURDATE()
          AND (pp.amar_putusan_dok IS NULL OR pp.amar_putusan_dok = '')
        ORDER BY pp.perkara_id DESC
        LIMIT 10
      `),

      // 4. Putus Hari Ini Belum Biaya Redaksi/Meterai
      prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, pp.tanggal_putusan
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan = CURDATE()
          AND p.prodeo = 0
          AND (
            NOT EXISTS (SELECT 1 FROM perkara_biaya pb WHERE pb.perkara_id = p.perkara_id AND pb.jenis_biaya_id IN (157, 172, 187, 202, 217))
            OR
            NOT EXISTS (SELECT 1 FROM perkara_biaya pb WHERE pb.perkara_id = p.perkara_id AND pb.jenis_biaya_id IN (152, 167, 182, 197, 212))
          )
        ORDER BY pp.perkara_id DESC
        LIMIT 10
      `),

      // 5. Redaksi dan Meterai Hari Ini Tanpa Putusan
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          pb.tanggal_transaksi,
          GROUP_CONCAT(DISTINCT pb.uraian SEPARATOR ', ') AS uraian_biaya
        FROM perkara_biaya pb
        JOIN perkara p ON p.perkara_id = pb.perkara_id
        LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        WHERE pb.tanggal_transaksi = CURDATE()
          AND (
            pb.jenis_biaya_id IN (152, 157, 167, 172, 182, 187, 197, 202, 212, 217)
            OR pb.uraian LIKE '%redaksi%'
            OR pb.uraian LIKE '%meterai%'
            OR pb.uraian LIKE '%materai%'
          )
          AND (pp.tanggal_putusan IS NULL OR pp.tanggal_putusan = '0000-00-00' OR pp.tanggal_putusan = '')
        GROUP BY p.perkara_id, p.nomor_perkara, pb.tanggal_transaksi
        ORDER BY p.perkara_id DESC
        LIMIT 10
      `)
    ])

    return serializeBigInt({
      success: true,
      year,
      atensi: {
        putusHariIni: {
          total: Number(putusHariIniCount[0]?.total || 0),
          data: putusHariIni
        },
        putusBelumMinutasi: {
          total: Number(putusBelumMinutCount[0]?.total || 0),
          data: putusBelumMinut
        },
        belumEdocPutusan: {
          total: Number(belumEdocPutusanCount[0]?.total || 0),
          data: belumEdocPutusan
        },
        belumBiayaRedaksiMaterai: {
          total: Number(belumBiayaRedaksiMateraiCount[0]?.total || 0),
          data: belumBiayaRedaksiMaterai
        },
        redaksiMateraiTanpaPutusan: {
          total: Number(redaksiMateraiTanpaPutusanCount[0]?.total || 0),
          data: redaksiMateraiTanpaPutusan
        }
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat atensi dashboard eksekutif'
    }
  }
})
