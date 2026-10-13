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
      putusHariIni,
      putusBelumMinut,
      belumEdocPutusan,
      belumBiayaRedaksiMaterai
    ] = await Promise.all([
      // 1. Putus Hari Ini
      prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, pp.tanggal_putusan
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan = CURDATE()
        LIMIT 10
      `),

      // 2. Putus Belum Minutasi
      prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, pp.tanggal_putusan
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi = '')
        ORDER BY pp.tanggal_putusan DESC
        LIMIT 10
      `),

      // 3. Belum e-Doc Amar Putusan
      prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, pp.tanggal_putusan
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND (pp.amar_putusan_dok IS NULL OR pp.amar_putusan_dok = '')
        ORDER BY pp.tanggal_putusan DESC
        LIMIT 10
      `),

      // 4. Belum Biaya Redaksi/Meterai
      prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, pp.tanggal_putusan
        FROM (
          SELECT perkara_id, tanggal_putusan
          FROM perkara_putusan
          WHERE tanggal_putusan >= '${startDate}' AND tanggal_putusan <= '${endDate}'
          ORDER BY tanggal_putusan DESC
          LIMIT 100
        ) pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE p.prodeo = 0
          AND (
            NOT EXISTS (SELECT 1 FROM perkara_biaya pb WHERE pb.perkara_id = p.perkara_id AND pb.jenis_biaya_id IN (157, 172, 187, 202, 217))
            OR
            NOT EXISTS (SELECT 1 FROM perkara_biaya pb WHERE pb.perkara_id = p.perkara_id AND pb.jenis_biaya_id IN (152, 167, 182, 197, 212))
          )
        LIMIT 10
      `)
    ])

    return serializeBigInt({
      success: true,
      year,
      atensi: {
        putusHariIni: {
          total: putusHariIni.length,
          data: putusHariIni
        },
        putusBelumMinutasi: {
          total: putusBelumMinut.length,
          data: putusBelumMinut
        },
        belumEdocPutusan: {
          total: belumEdocPutusan.length,
          data: belumEdocPutusan
        },
        belumBiayaRedaksiMaterai: {
          total: belumBiayaRedaksiMaterai.length,
          data: belumBiayaRedaksiMaterai
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
