import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31 23:59:59`

  try {
    const [
      putusBelumMinutasi,
      belumUploadDirput,
      tunggakan5Bulan,
      minutasiLambat
    ] = await Promise.all([
      // 1. Putus Belum Minutasi Tahun Ini
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          pp.tanggal_putusan,
          DATEDIFF(CURDATE(), pp.tanggal_putusan) AS selisih_hari
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi = '')
          AND p.alur_perkara_id <> 114
        ORDER BY pp.tanggal_putusan ASC
        LIMIT 10
      `),

      // 2. Putus Belum Upload Dirput MA
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          pp.tanggal_putusan
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND p.alur_perkara_id <> 114
          AND NOT EXISTS (
            SELECT 1 FROM dirput_antrian da
            WHERE da.perkara_id = pp.perkara_id AND da.status = '1'
          )
        ORDER BY pp.tanggal_putusan DESC
        LIMIT 10
      `).catch(() => []),

      // 3. Perkara Usia > 150 Hari (5 Bulan) Belum Putus (Pinalti Skor Waktu Putus)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          p.tanggal_pendaftaran,
          DATEDIFF(CURDATE(), p.tanggal_pendaftaran) AS usia_hari
        FROM perkara p
        LEFT JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
        WHERE p.tanggal_pendaftaran <= '${endDate}'
          AND (pp.tanggal_putusan IS NULL OR pp.tanggal_putusan = '0000-00-00' OR pp.tanggal_putusan = '')
          AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) > 150
          AND p.alur_perkara_id <> 114
        ORDER BY p.tanggal_pendaftaran ASC
        LIMIT 10
      `),

      // 4. Minutasi Lambat (> 14 Hari Pasca Putusan)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          pp.tanggal_putusan,
          pp.tanggal_minutasi,
          DATEDIFF(pp.tanggal_minutasi, pp.tanggal_putusan) AS selisih_minutasi
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND pp.tanggal_minutasi IS NOT NULL AND pp.tanggal_minutasi <> ''
          AND DATEDIFF(pp.tanggal_minutasi, pp.tanggal_putusan) > 14
          AND p.alur_perkara_id <> 114
        ORDER BY pp.tanggal_putusan DESC
        LIMIT 10
      `)
    ])

    // Hitung total count untuk masing-masing atensi
    const [
      countBelumMinut,
      countBelumDirput,
      countTunggakan5Bln,
      countMinutLambat
    ] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(p.perkara_id) AS total
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi = '')
          AND p.alur_perkara_id <> 114
      `),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(p.perkara_id) AS total
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND p.alur_perkara_id <> 114
          AND NOT EXISTS (
            SELECT 1 FROM dirput_antrian da
            WHERE da.perkara_id = pp.perkara_id AND da.status = '1'
          )
      `).catch(() => [{ total: 0 }]),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(p.perkara_id) AS total
        FROM perkara p
        LEFT JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
        WHERE p.tanggal_pendaftaran <= '${endDate}'
          AND (pp.tanggal_putusan IS NULL OR pp.tanggal_putusan = '0000-00-00' OR pp.tanggal_putusan = '')
          AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) > 150
          AND p.alur_perkara_id <> 114
      `),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(p.perkara_id) AS total
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND pp.tanggal_minutasi IS NOT NULL AND pp.tanggal_minutasi <> ''
          AND DATEDIFF(pp.tanggal_minutasi, pp.tanggal_putusan) > 14
          AND p.alur_perkara_id <> 114
      `)
    ])

    return serializeBigInt({
      success: true,
      year,
      atensi: {
        putusBelumMinutasi: {
          total: Number(countBelumMinut[0]?.total || 0),
          data: putusBelumMinutasi
        },
        belumUploadDirput: {
          total: Number(countBelumDirput[0]?.total || 0),
          data: belumUploadDirput
        },
        tunggakan5Bulan: {
          total: Number(countTunggakan5Bln[0]?.total || 0),
          data: tunggakan5Bulan
        },
        minutasiLambat: {
          total: Number(countMinutLambat[0]?.total || 0),
          data: minutasiLambat
        }
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat atensi kinerja SIPP'
    }
  }
})
