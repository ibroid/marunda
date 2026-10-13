import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear

  try {
    const [baseQuery, dirputQuery, bobotQuery, waktuQuery, minutQuery] = await Promise.all([
      // 1. Data Dasar Perkara (Masuk, Putus, Minutasi, Sisa Lalu)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          SUM(CASE WHEN YEAR(A.tanggal_pendaftaran) < ${year} AND (YEAR(B.tanggal_minutasi) >= ${year} OR B.tanggal_minutasi IS NULL OR B.tanggal_minutasi = '') THEN 1 ELSE 0 END) AS sisa_tahun_lalu,
          SUM(CASE WHEN YEAR(A.tanggal_pendaftaran) = ${year} THEN 1 ELSE 0 END) AS masuk_tahun_ini,
          SUM(CASE WHEN YEAR(A.tanggal_pendaftaran) <= ${year} AND YEAR(B.tanggal_putusan) = ${year} THEN 1 ELSE 0 END) AS putus_tahun_ini,
          SUM(CASE WHEN YEAR(B.tanggal_putusan) = ${year} AND YEAR(B.tanggal_minutasi) >= ${year} THEN 1 ELSE 0 END) AS minutasi_tahun_ini
        FROM perkara AS A
        LEFT JOIN perkara_putusan AS B ON A.perkara_id = B.perkara_id
        WHERE A.alur_perkara_id <> 114
      `),

      // 2. Publikasi Dirput
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(A.perkara_id) AS dirput_tahun_ini
        FROM perkara_putusan AS A
        JOIN dirput_antrian AS B ON A.perkara_id = B.perkara_id
        WHERE YEAR(A.tanggal_putusan) = ${year}
          AND B.status = '1'
      `).catch(() => [{ dirput_tahun_ini: 0 }]),

      // 3. Bobot Proses
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          SUM(CASE WHEN (putusan_verstek = 'T') THEN 2 ELSE 1 END) AS jumlah_bobot_total
        FROM perkara_putusan
        WHERE YEAR(tanggal_putusan) = ${year}
      `).catch(() => [{ jumlah_bobot_total: 0 }]),

      // 4. Waktu Putus
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          SUM(CASE WHEN DATEDIFF(B.tanggal_putusan, A.tanggal_pendaftaran) <= 30 THEN 5 ELSE 0 END) AS b_5,
          SUM(CASE WHEN DATEDIFF(B.tanggal_putusan, A.tanggal_pendaftaran) BETWEEN 31 AND 60 THEN 3 ELSE 0 END) AS b_3,
          SUM(CASE WHEN DATEDIFF(B.tanggal_putusan, A.tanggal_pendaftaran) BETWEEN 61 AND 90 THEN 2 ELSE 0 END) AS b_2,
          SUM(CASE WHEN DATEDIFF(B.tanggal_putusan, A.tanggal_pendaftaran) BETWEEN 91 AND 150 THEN 1 ELSE 0 END) AS b_1
        FROM perkara AS A
        JOIN perkara_putusan AS B ON A.perkara_id = B.perkara_id
        WHERE YEAR(B.tanggal_putusan) = ${year}
      `).catch(() => [{ b_5: 0, b_3: 0, b_2: 0, b_1: 0 }]),

      // 5. Waktu Minutasi
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          SUM(CASE WHEN DATEDIFF(tanggal_minutasi, tanggal_putusan) = 0 THEN 5 ELSE 0 END) AS m_5,
          SUM(CASE WHEN DATEDIFF(tanggal_minutasi, tanggal_putusan) BETWEEN 1 AND 3 THEN 3 ELSE 0 END) AS m_3,
          SUM(CASE WHEN DATEDIFF(tanggal_minutasi, tanggal_putusan) BETWEEN 4 AND 6 THEN 2 ELSE 0 END) AS m_2,
          SUM(CASE WHEN DATEDIFF(tanggal_minutasi, tanggal_putusan) BETWEEN 7 AND 14 THEN 1 ELSE 0 END) AS m_1
        FROM perkara_putusan
        WHERE YEAR(tanggal_putusan) = ${year}
          AND tanggal_minutasi IS NOT NULL
      `).catch(() => [{ m_5: 0, m_3: 0, m_2: 0, m_1: 0 }])
    ])

    const sisaLalu = Number(baseQuery[0]?.sisa_tahun_lalu || 0)
    const masukTahunIni = Number(baseQuery[0]?.masuk_tahun_ini || 0)
    const putusTahunIni = Number(baseQuery[0]?.putus_tahun_ini || 0)
    const minutasiTahunIni = Number(baseQuery[0]?.minutasi_tahun_ini || 0)
    const bebanTahunIni = sisaLalu + masukTahunIni

    const persentasePutus = bebanTahunIni > 0 ? (minutasiTahunIni * 100) / bebanTahunIni : 0
    const persentaseMinutasi = putusTahunIni > 0 ? (minutasiTahunIni * 100) / putusTahunIni : 0

    const dirputTahunIni = Number(dirputQuery[0]?.dirput_tahun_ini || 0)
    const persentaseDirput = putusTahunIni > 0 ? (dirputTahunIni * 100) / putusTahunIni : 0

    const jumlahBobotTotal = Number(bobotQuery[0]?.jumlah_bobot_total || 0)
    const rasioBobotProses = putusTahunIni > 0 ? (jumlahBobotTotal / (putusTahunIni * 2)) * 100 : 0

    const totalSkorWaktu = Number(waktuQuery[0]?.b_5 || 0) + Number(waktuQuery[0]?.b_3 || 0) + Number(waktuQuery[0]?.b_2 || 0) + Number(waktuQuery[0]?.b_1 || 0)
    const rasioWaktuPutus = putusTahunIni > 0 ? (totalSkorWaktu / (putusTahunIni * 5)) * 100 : 0

    const totalSkorMinut = Number(minutQuery[0]?.m_5 || 0) + Number(minutQuery[0]?.m_3 || 0) + Number(minutQuery[0]?.m_2 || 0) + Number(minutQuery[0]?.m_1 || 0)
    const rasioWaktuMinutasi = putusTahunIni > 0 ? (totalSkorMinut / (putusTahunIni * 5)) * 100 : 0

    const totalPersentase = (persentasePutus * 0.3) + (persentaseMinutasi * 0.3) + (persentaseDirput * 0.4)
    const nilaiAkhir = (rasioBobotProses + rasioWaktuPutus + rasioWaktuMinutasi + persentaseDirput) / 4

    return serializeBigInt({
      success: true,
      year,
      skor: {
        nilaiAkhir: Number(nilaiAkhir.toFixed(2)),
        totalPersentase: Number(totalPersentase.toFixed(2))
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal menghitung skor raport kinerja SIPP'
    }
  }
})
