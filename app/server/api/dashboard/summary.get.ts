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
      satkerQuery,
      summaryQuery,
      grafikMasuk,
      grafikPutus,
      grafikMinutasi,
      putusHariIni,
      putusBelumMinut,
      belumEdocPutusan,
      belumBiayaRedaksiMaterai,
      perkaraTerbaru
    ] = await Promise.all([
      // 1. Ambil Nama Satker
      prisma.$queryRawUnsafe<any[]>(
        `SELECT value FROM sys_config WHERE id = 62 OR name = 'NamaPN' LIMIT 1`
      ),

      // 2. Summary Statistik Perkara (Index-friendly date ranges & set math)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          (SELECT COUNT(perkara_id) FROM perkara WHERE tanggal_pendaftaran >= '${startDate}' AND tanggal_pendaftaran <= '${endDate}') AS total_masuk,
          (SELECT COUNT(perkara_id) FROM perkara_putusan WHERE tanggal_putusan >= '${startDate}' AND tanggal_putusan <= '${endDate}') AS total_putus,
          (SELECT COUNT(perkara_id) FROM perkara_putusan WHERE tanggal_minutasi >= '${startDate}' AND tanggal_minutasi <= '${endDate}') AS total_minutasi,
          (
            (SELECT COUNT(perkara_id) FROM perkara WHERE tanggal_pendaftaran < '${startDate}')
            -
            (SELECT COUNT(perkara_id) FROM perkara_putusan WHERE tanggal_putusan < '${startDate}')
          ) AS sisa_lalu
      `),

      // 3. Data Grafik 12 Bulan (Masuk, Putus, Minutasi)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT MONTH(tanggal_pendaftaran) as bulan, COUNT(perkara_id) as jumlah
        FROM perkara
        WHERE tanggal_pendaftaran >= '${startDate}' AND tanggal_pendaftaran <= '${endDate}'
        GROUP BY MONTH(tanggal_pendaftaran)
      `),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT MONTH(tanggal_putusan) as bulan, COUNT(perkara_id) as jumlah
        FROM perkara_putusan
        WHERE tanggal_putusan >= '${startDate}' AND tanggal_putusan <= '${endDate}'
        GROUP BY MONTH(tanggal_putusan)
      `),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT MONTH(tanggal_minutasi) as bulan, COUNT(perkara_id) as jumlah
        FROM perkara_putusan
        WHERE tanggal_minutasi >= '${startDate}' AND tanggal_minutasi <= '${endDate}'
        GROUP BY MONTH(tanggal_minutasi)
      `),

      // 4. Data Atensi / Warning Indicators
      prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, pp.tanggal_putusan
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan = CURDATE()
        LIMIT 10
      `),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, pp.tanggal_putusan
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi = '')
        ORDER BY pp.tanggal_putusan DESC
        LIMIT 10
      `),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, pp.tanggal_putusan
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND (pp.amar_putusan_dok IS NULL OR pp.amar_putusan_dok = '')
        ORDER BY pp.tanggal_putusan DESC
        LIMIT 10
      `),

      // Cek perkara putus terakhir yang belum biaya redaksi/meterai via index jenis_biaya_id
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
      `),

      // 5. Perkara Terbaru
      prisma.$queryRawUnsafe<any[]>(`
        SELECT perkara_id, nomor_perkara, tanggal_pendaftaran, jenis_perkara_nama, proses_terakhir_text
        FROM perkara
        WHERE tanggal_pendaftaran >= '${startDate}' AND tanggal_pendaftaran <= '${endDate}'
        ORDER BY tanggal_pendaftaran DESC
        LIMIT 10
      `)
    ])

    const namaSatker = satkerQuery.length > 0 ? satkerQuery[0].value : 'Pengadilan Agama'

    const totalMasuk = Number(summaryQuery[0]?.total_masuk || 0)
    const totalPutus = Number(summaryQuery[0]?.total_putus || 0)
    const totalMinutasi = Number(summaryQuery[0]?.total_minutasi || 0)
    const sisaLalu = Number(summaryQuery[0]?.sisa_lalu || 0)
    const bebanPerkara = sisaLalu + totalMasuk
    const sisaPerkara = bebanPerkara - totalPutus
    const rasioPenyelesaian = bebanPerkara > 0 ? ((totalPutus / bebanPerkara) * 100).toFixed(2) : '0.00'
    const rasioMinutasi = totalPutus > 0 ? ((totalMinutasi / totalPutus) * 100).toFixed(2) : '0.00'

    const bulananMasuk = Array(12).fill(0)
    const bulananPutus = Array(12).fill(0)
    const bulananMinutasi = Array(12).fill(0)

    grafikMasuk.forEach(r => { bulananMasuk[Number(r.bulan) - 1] = Number(r.jumlah) })
    grafikPutus.forEach(r => { bulananPutus[Number(r.bulan) - 1] = Number(r.jumlah) })
    grafikMinutasi.forEach(r => { bulananMinutasi[Number(r.bulan) - 1] = Number(r.jumlah) })

    return serializeBigInt({
      success: true,
      year,
      namaSatker,
      summary: {
        totalMasuk,
        totalPutus,
        totalMinutasi,
        sisaLalu,
        bebanPerkara,
        sisaPerkara,
        rasioPenyelesaian: Number(rasioPenyelesaian),
        rasioMinutasi: Number(rasioMinutasi)
      },
      grafik: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
        masuk: bulananMasuk,
        putus: bulananPutus,
        minutasi: bulananMinutasi
      },
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
      },
      perkaraTerbaru
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil data dashboard'
    }
  }
})
