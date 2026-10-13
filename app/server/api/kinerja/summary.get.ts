import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear

  try {
    const [baseQuery, dirputQuery] = await Promise.all([
      // 1. Data Dasar Perkara (Sisa Lalu, Masuk, Putus, Minutasi)
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

      // 2. Publikasi Dirput MA
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(A.perkara_id) AS dirput_tahun_ini
        FROM perkara_putusan AS A
        JOIN dirput_antrian AS B ON A.perkara_id = B.perkara_id
        WHERE YEAR(A.tanggal_putusan) = ${year}
          AND B.status = '1'
      `).catch(() => [{ dirput_tahun_ini: 0 }])
    ])

    const sisaLalu = Number(baseQuery[0]?.sisa_tahun_lalu || 0)
    const masukTahunIni = Number(baseQuery[0]?.masuk_tahun_ini || 0)
    const putusTahunIni = Number(baseQuery[0]?.putus_tahun_ini || 0)
    const minutasiTahunIni = Number(baseQuery[0]?.minutasi_tahun_ini || 0)
    const dirputTahunIni = Number(dirputQuery[0]?.dirput_tahun_ini || 0)

    const bebanTahunIni = sisaLalu + masukTahunIni
    const sisaTahunIni = bebanTahunIni - minutasiTahunIni

    const persentasePutus = bebanTahunIni > 0 ? (minutasiTahunIni * 100) / bebanTahunIni : 0
    const persentaseMinutasi = putusTahunIni > 0 ? (minutasiTahunIni * 100) / putusTahunIni : 0
    const persentaseDirput = putusTahunIni > 0 ? (dirputTahunIni * 100) / putusTahunIni : 0

    return serializeBigInt({
      success: true,
      year,
      summary: {
        sisaLalu,
        masukTahunIni,
        bebanTahunIni,
        putusTahunIni,
        minutasiTahunIni,
        sisaTahunIni,
        dirputTahunIni,
        persentasePutus: Number(persentasePutus.toFixed(2)),
        persentaseMinutasi: Number(persentaseMinutasi.toFixed(2)),
        persentaseDirput: Number(persentaseDirput.toFixed(2))
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat summary kinerja SIPP'
    }
  }
})
