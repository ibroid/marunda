import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear

  try {
    const statsQuery = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        -- Persentase
        ROUND(SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} AND d.perkara_id IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / NULLIF(SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} THEN 1 ELSE 0 END), 0), 2) AS persen_tahun_ini,
        ROUND(SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} AND MONTH(a.tanggal_pendaftaran) = MONTH(CURDATE()) AND d.perkara_id IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / NULLIF(SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} AND MONTH(a.tanggal_pendaftaran) = MONTH(CURDATE()) THEN 1 ELSE 0 END), 0), 2) AS persen_bulan_ini,
        ROUND(SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} AND WEEK(a.tanggal_pendaftaran, 1) = WEEK(CURDATE(), 1) AND d.perkara_id IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / NULLIF(SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} AND WEEK(a.tanggal_pendaftaran, 1) = WEEK(CURDATE(), 1) THEN 1 ELSE 0 END), 0), 2) AS persen_minggu_ini,
        ROUND(SUM(CASE WHEN a.tanggal_pendaftaran = CURDATE() AND d.perkara_id IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / NULLIF(SUM(CASE WHEN a.tanggal_pendaftaran = CURDATE() THEN 1 ELSE 0 END), 0), 2) AS persen_hari_ini,

        -- Jumlah
        SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} AND d.perkara_id IS NOT NULL THEN 1 ELSE 0 END) AS jumlah_ecourt_tahun_ini,
        SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} AND d.perkara_id IS NULL THEN 1 ELSE 0 END) AS jumlah_konvensional_tahun_ini,
        SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} AND MONTH(a.tanggal_pendaftaran) = MONTH(CURDATE()) AND d.perkara_id IS NOT NULL THEN 1 ELSE 0 END) AS jumlah_ecourt_bulan_ini,
        SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} AND WEEK(a.tanggal_pendaftaran, 1) = WEEK(CURDATE(), 1) AND d.perkara_id IS NOT NULL THEN 1 ELSE 0 END) AS jumlah_ecourt_minggu_ini,
        SUM(CASE WHEN a.tanggal_pendaftaran = CURDATE() AND d.perkara_id IS NOT NULL THEN 1 ELSE 0 END) AS jumlah_ecourt_hari_ini,
        COUNT(a.perkara_id) AS total_perkara
      FROM perkara AS a
      LEFT JOIN perkara_efiling_id AS d ON a.perkara_id = d.perkara_id
      WHERE a.alur_perkara_id <> 114
        AND YEAR(a.tanggal_pendaftaran) = ${year}
    `)

    const row = statsQuery[0] || {}
    const totalTahunIni = Number(row.total_perkara || 0)
    const ecourtTahunIni = Number(row.jumlah_ecourt_tahun_ini || 0)
    const konvensionalTahunIni = Number(row.jumlah_konvensional_tahun_ini || 0)

    return serializeBigInt({
      success: true,
      year,
      adopsi: {
        persenTahunIni: Number(row.persen_tahun_ini || 0),
        persenBulanIni: Number(row.persen_bulan_ini || 0),
        persenMingguIni: Number(row.persen_minggu_ini || 0),
        persenHariIni: Number(row.persen_hari_ini || 0),
        jumlahEcourtTahunIni: ecourtTahunIni,
        jumlahKonvensionalTahunIni: konvensionalTahunIni,
        jumlahEcourtBulanIni: Number(row.jumlah_ecourt_bulan_ini || 0),
        jumlahEcourtMingguIni: Number(row.jumlah_ecourt_minggu_ini || 0),
        jumlahEcourtHariIni: Number(row.jumlah_ecourt_hari_ini || 0),
        totalPerkara: totalTahunIni
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat analitik adopsi e-Court'
    }
  }
})
