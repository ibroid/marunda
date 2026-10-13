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
      agingQuery,
      daftarTunggakan,
      bebanHakimQuery,
      mediasiQuery,
      upayaHukumQuery,
      belumPmhList,
      putusHariIni,
      putusBelumEdoc
    ] = await Promise.all([
      // 1. Ambil Nama Satker
      prisma.$queryRawUnsafe<any[]>(
        `SELECT value FROM sys_config WHERE id = 62 OR name = 'NamaPN' LIMIT 1`
      ),

      // 2. Summary Statistik Perkara & Kinerja Yudisial
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          (SELECT COUNT(perkara_id) FROM perkara WHERE tanggal_pendaftaran >= '${startDate}' AND tanggal_pendaftaran <= '${endDate}') AS total_masuk,
          (SELECT COUNT(perkara_id) FROM perkara_putusan WHERE tanggal_putusan >= '${startDate}' AND tanggal_putusan <= '${endDate}') AS total_putus,
          (SELECT COUNT(perkara_id) FROM perkara_putusan WHERE tanggal_minutasi >= '${startDate}' AND tanggal_minutasi <= '${endDate}') AS total_minutasi,
          (
            (SELECT COUNT(perkara_id) FROM perkara WHERE tanggal_pendaftaran < '${startDate}')
            -
            (SELECT COUNT(perkara_id) FROM perkara_putusan WHERE tanggal_putusan < '${startDate}')
          ) AS sisa_lalu,
          (SELECT COUNT(p.perkara_id)
           FROM perkara p
           WHERE p.tanggal_pendaftaran >= '${startDate}' AND p.tanggal_pendaftaran <= '${endDate}'
             AND NOT EXISTS (
               SELECT 1 FROM perkara_penetapan pt
               WHERE pt.perkara_id = p.perkara_id
                 AND pt.penetapan_majelis_hakim IS NOT NULL
                 AND pt.penetapan_majelis_hakim != ''
             )
          ) AS belum_pmh
      `),

      // 3. Pengawasan Tunggakan & Usia Perkara (Aging Cases)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          SUM(CASE WHEN DATEDIFF(CURDATE(), p.tanggal_pendaftaran) BETWEEN 91 AND 150 THEN 1 ELSE 0 END) AS usia_3_5_bulan,
          SUM(CASE WHEN DATEDIFF(CURDATE(), p.tanggal_pendaftaran) BETWEEN 151 AND 180 THEN 1 ELSE 0 END) AS usia_5_6_bulan,
          SUM(CASE WHEN DATEDIFF(CURDATE(), p.tanggal_pendaftaran) BETWEEN 181 AND 365 THEN 1 ELSE 0 END) AS usia_6_12_bulan,
          SUM(CASE WHEN DATEDIFF(CURDATE(), p.tanggal_pendaftaran) > 365 THEN 1 ELSE 0 END) AS usia_diatas_1_tahun
        FROM perkara p
        LEFT JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan IS NULL
          AND p.tanggal_pendaftaran >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
      `),

      // Daftar Perkara Tunggakan (> 90 hari)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.tanggal_pendaftaran,
          p.jenis_perkara_nama,
          DATEDIFF(CURDATE(), p.tanggal_pendaftaran) AS usia_hari,
          pt.majelis_hakim_nama,
          p.proses_terakhir_text
        FROM perkara p
        LEFT JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        WHERE pp.tanggal_putusan IS NULL
          AND p.tanggal_pendaftaran <= DATE_SUB(CURDATE(), INTERVAL 91 DAY)
          AND p.tanggal_pendaftaran >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
        ORDER BY p.tanggal_pendaftaran ASC
        LIMIT 15
      `),

      // 4. Beban Kerja & Produktivitas Majelis Hakim (Ketua Majelis)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          h.id AS hakim_id,
          h.nama_gelar AS nama,
          COUNT(pr.perkara_id) AS total_perkara,
          SUM(CASE WHEN pp.tanggal_putusan IS NOT NULL THEN 1 ELSE 0 END) AS perkara_putus,
          SUM(CASE WHEN pp.tanggal_putusan IS NULL THEN 1 ELSE 0 END) AS sisa_perkara,
          SUM(CASE WHEN pr.jenis_perkara_nama = 'Cerai Gugat' THEN 1 ELSE 0 END) AS cg,
          SUM(CASE WHEN pr.jenis_perkara_nama = 'Cerai Talak' THEN 1 ELSE 0 END) AS ct,
          SUM(CASE WHEN pr.jenis_perkara_nama NOT IN ('Cerai Gugat', 'Cerai Talak') THEN 1 ELSE 0 END) AS lainnya
        FROM perkara_penetapan pt
        JOIN perkara pr ON pr.perkara_id = pt.perkara_id
        LEFT JOIN perkara_putusan pp ON pp.perkara_id = pr.perkara_id
        JOIN hakim_pn h ON h.id = CAST(SUBSTRING_INDEX(pt.majelis_hakim_id, ',', 1) AS UNSIGNED)
        WHERE pt.penetapan_majelis_hakim >= '${startDate}' AND pt.penetapan_majelis_hakim <= '${endDate}'
        GROUP BY h.id, h.nama_gelar
        ORDER BY total_perkara DESC
      `),

      // 5. Monitoring Mediasi
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(perkara_id) AS total_mediasi,
          SUM(CASE WHEN hasil_mediasi IN ('Y1', 'Y2') THEN 1 ELSE 0 END) AS berhasil,
          SUM(CASE WHEN hasil_mediasi = 'S' THEN 1 ELSE 0 END) AS berhasil_sebagian,
          SUM(CASE WHEN hasil_mediasi = 'T' THEN 1 ELSE 0 END) AS tidak_berhasil,
          SUM(CASE WHEN hasil_mediasi = 'D' THEN 1 ELSE 0 END) AS tidak_dapat_laksana
        FROM perkara_mediasi
        WHERE (penetapan_tanggal_mediasi >= '${startDate}' AND penetapan_tanggal_mediasi <= '${endDate}')
           OR (dimulai_mediasi >= '${startDate}' AND dimulai_mediasi <= '${endDate}')
      `),

      // 6. Upaya Hukum (Banding, Kasasi, PK)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          (SELECT COUNT(perkara_id) FROM perkara_banding WHERE permohonan_banding >= '${startDate}' AND permohonan_banding <= '${endDate}') AS total_banding,
          (SELECT COUNT(perkara_id) FROM perkara_kasasi WHERE permohonan_kasasi >= '${startDate}' AND permohonan_kasasi <= '${endDate}') AS total_kasasi,
          (SELECT COUNT(perkara_id) FROM perkara_pk WHERE permohonan_pk >= '${startDate}' AND permohonan_pk <= '${endDate}') AS total_pk
      `),

      // 7. Atensi Khusus Pimpinan (Actionable Items)
      // - Perkara Belum PMH
      prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, p.tanggal_pendaftaran, p.jenis_perkara_nama, p.para_pihak
        FROM perkara p
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        WHERE p.tanggal_pendaftaran >= '${startDate}' AND p.tanggal_pendaftaran <= '${endDate}'
          AND (pt.penetapan_majelis_hakim IS NULL OR pt.penetapan_majelis_hakim = '')
        ORDER BY p.tanggal_pendaftaran DESC
        LIMIT 10
      `),

      // - Putus Hari Ini Belum Minutasi
      prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, pp.tanggal_putusan, pt.majelis_hakim_nama
        FROM perkara p
        JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        WHERE pp.tanggal_putusan = CURDATE()
        LIMIT 10
      `),

      // - Putus Belum e-Doc Putusan
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

    const namaSatker = satkerQuery.length > 0 ? satkerQuery[0].value : 'Pengadilan Agama'

    const totalMasuk = Number(summaryQuery[0]?.total_masuk || 0)
    const totalPutus = Number(summaryQuery[0]?.total_putus || 0)
    const totalMinutasi = Number(summaryQuery[0]?.total_minutasi || 0)
    const sisaLalu = Number(summaryQuery[0]?.sisa_lalu || 0)
    const belumPmh = Number(summaryQuery[0]?.belum_pmh || 0)
    const bebanPerkara = sisaLalu + totalMasuk
    const sisaPerkara = bebanPerkara - totalPutus
    const rasioPenyelesaian = bebanPerkara > 0 ? Number(((totalPutus / bebanPerkara) * 100).toFixed(2)) : 0
    const rasioMinutasi = totalPutus > 0 ? Number(((totalMinutasi / totalPutus) * 100).toFixed(2)) : 0

    const usia3_5Bulan = Number(agingQuery[0]?.usia_3_5_bulan || 0)
    const usia5_6Bulan = Number(agingQuery[0]?.usia_5_6_bulan || 0)
    const usia6_12Bulan = Number(agingQuery[0]?.usia_6_12_bulan || 0)
    const usiaDiatas1Tahun = Number(agingQuery[0]?.usia_diatas_1_tahun || 0)
    const totalTunggakan = usia3_5Bulan + usia5_6Bulan + usia6_12Bulan + usiaDiatas1Tahun

    const daftarBebanHakim = bebanHakimQuery.map((item) => {
      const tot = Number(item.total_perkara || 0)
      const pts = Number(item.perkara_putus || 0)
      const rasio = tot > 0 ? Number(((pts / tot) * 100).toFixed(1)) : 0
      return {
        id: item.hakim_id,
        nama: item.nama || '-',
        total: tot,
        putus: pts,
        sisa: Number(item.sisa_perkara || 0),
        rasio,
        cg: Number(item.cg || 0),
        ct: Number(item.ct || 0),
        lainnya: Number(item.lainnya || 0)
      }
    })

    const totalMediasi = Number(mediasiQuery[0]?.total_mediasi || 0)
    const mediasiBerhasil = Number(mediasiQuery[0]?.berhasil || 0)
    const mediasiSebagian = Number(mediasiQuery[0]?.berhasil_sebagian || 0)
    const mediasiGagal = Number(mediasiQuery[0]?.tidak_berhasil || 0)
    const mediasiDibatalkan = Number(mediasiQuery[0]?.tidak_dapat_laksana || 0)
    const rasioMediasiBerhasil = totalMediasi > 0 ? Number((((mediasiBerhasil + mediasiSebagian) / totalMediasi) * 100).toFixed(1)) : 0

    const banding = Number(upayaHukumQuery[0]?.total_banding || 0)
    const kasasi = Number(upayaHukumQuery[0]?.total_kasasi || 0)
    const pk = Number(upayaHukumQuery[0]?.total_pk || 0)

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
        rasioPenyelesaian,
        rasioMinutasi,
        belumPmh
      },
      aging: {
        usia3_5Bulan,
        usia5_6Bulan,
        usia6_12Bulan,
        usiaDiatas1Tahun,
        totalTunggakan,
        daftar: daftarTunggakan
      },
      bebanHakim: daftarBebanHakim,
      mediasi: {
        total: totalMediasi,
        berhasil: mediasiBerhasil,
        berhasilSebagian: mediasiSebagian,
        tidakBerhasil: mediasiGagal,
        tidakDapatLaksana: mediasiDibatalkan,
        rasioBerhasil: rasioMediasiBerhasil
      },
      upayaHukum: {
        total: banding + kasasi + pk,
        banding,
        kasasi,
        pk
      },
      atensi: {
        belumPmh: {
          total: belumPmh,
          daftar: belumPmhList
        },
        putusHariIni: {
          total: putusHariIni.length,
          daftar: putusHariIni
        },
        putusBelumEdoc: {
          total: putusBelumEdoc.length,
          daftar: putusBelumEdoc
        }
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil data dashboard ketua'
    }
  }
})
