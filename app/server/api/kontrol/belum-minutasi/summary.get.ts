import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawYear = query.year

  let yearFilter = ''
  let selectedYear: number | 'all' = 'all'

  if (rawYear && rawYear !== 'all' && !isNaN(Number(rawYear)) && Number(rawYear) > 0) {
    selectedYear = Number(rawYear)
    yearFilter = `AND YEAR(pp.tanggal_putusan) = ${selectedYear}`
  }

  try {
    // 1. Ambil metrik summary agregat
    const summaryResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(pp.perkara_id) AS total,
        SUM(CASE WHEN DATEDIFF(CURDATE(), pp.tanggal_putusan) <= 1 THEN 1 ELSE 0 END) AS satu_hari,
        SUM(CASE WHEN DATEDIFF(CURDATE(), pp.tanggal_putusan) <= 7 THEN 1 ELSE 0 END) AS aman_7hari,
        SUM(CASE WHEN DATEDIFF(CURDATE(), pp.tanggal_putusan) > 7 AND DATEDIFF(CURDATE(), pp.tanggal_putusan) <= 14 THEN 1 ELSE 0 END) AS atensi_14hari,
        SUM(CASE WHEN DATEDIFF(CURDATE(), pp.tanggal_putusan) > 14 THEN 1 ELSE 0 END) AS telat_lewat_14hari,
        ROUND(AVG(DATEDIFF(CURDATE(), pp.tanggal_putusan)), 1) AS rata_rata_hari,
        MAX(DATEDIFF(CURDATE(), pp.tanggal_putusan)) AS maksimal_hari
      FROM perkara_putusan pp
      JOIN perkara p ON p.perkara_id = pp.perkara_id
      WHERE pp.tanggal_putusan IS NOT NULL
        AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi = '')
        ${yearFilter}
    `)

    // 2. Ambil daftar tahun yang memiliki perkara belum minutasi untuk opsi filter
    const yearsResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        YEAR(pp.tanggal_putusan) AS tahun,
        COUNT(pp.perkara_id) AS jumlah
      FROM perkara_putusan pp
      JOIN perkara p ON p.perkara_id = pp.perkara_id
      WHERE pp.tanggal_putusan IS NOT NULL
        AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi = '')
      GROUP BY YEAR(pp.tanggal_putusan)
      ORDER BY tahun DESC
    `)

    const row = summaryResult[0] || {}

    return serializeBigInt({
      success: true,
      selectedYear,
      summary: {
        total: Number(row.total || 0),
        satu_hari: Number(row.satu_hari || 0),
        aman_7hari: Number(row.aman_7hari || 0),
        atensi_14hari: Number(row.atensi_14hari || 0),
        telat_lewat_14hari: Number(row.telat_lewat_14hari || 0),
        rata_rata_hari: Number(row.rata_rata_hari || 0),
        maksimal_hari: Number(row.maksimal_hari || 0)
      },
      availableYears: (yearsResult || []).map((y: any) => ({
        tahun: Number(y.tahun),
        jumlah: Number(y.jumlah)
      }))
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat memuat ringkasan perkara belum minutasi'
    }
  }
})
