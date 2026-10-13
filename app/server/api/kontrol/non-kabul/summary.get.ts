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
    // 1. Ambil summary metrik agregat perkara Non-Kabul (status_putusan_id BUKAN 62, 1, 30, 34)
    const summaryResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(pp.perkara_id) AS total,
        SUM(CASE WHEN pp.status_putusan_id IN (67, 7, 37) THEN 1 ELSE 0 END) AS dicabut,
        SUM(CASE WHEN pp.status_putusan_id IN (61, 64, 4, 33, 36, 84) THEN 1 ELSE 0 END) AS tidak_diterima,
        SUM(CASE WHEN pp.status_putusan_id IN (63, 3, 32, 35) THEN 1 ELSE 0 END) AS ditolak,
        SUM(CASE WHEN pp.status_putusan_id IN (65, 93, 6, 29, 31, 38) THEN 1 ELSE 0 END) AS gugur,
        SUM(CASE WHEN pp.status_putusan_id IN (66) THEN 1 ELSE 0 END) AS dicoret,
        SUM(CASE WHEN pp.status_putusan_id IN (5, 85) THEN 1 ELSE 0 END) AS perdamaian,
        SUM(CASE WHEN pp.status_putusan_id IN (28, 92) THEN 1 ELSE 0 END) AS dismissal,
        SUM(CASE WHEN pac.nomor_akta_cerai IS NOT NULL AND pac.nomor_akta_cerai != '' THEN 1 ELSE 0 END) AS anomali_terbit_ac,
        SUM(CASE WHEN pp.tanggal_bht IS NULL OR pp.tanggal_bht = '0000-00-00' THEN 1 ELSE 0 END) AS belum_bht,
        SUM(CASE WHEN pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' THEN 1 ELSE 0 END) AS belum_minutasi
      FROM perkara_putusan pp
      JOIN perkara p ON p.perkara_id = pp.perkara_id
      LEFT JOIN perkara_akta_cerai pac ON pac.perkara_id = pp.perkara_id
      WHERE pp.tanggal_putusan IS NOT NULL
        AND (pp.status_putusan_id NOT IN (62, 1, 30, 34) OR pp.status_putusan_id IS NULL)
        ${yearFilter}
    `)

    // 2. Ambil daftar tahun putusan non-kabul untuk opsi filter
    const yearsResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        YEAR(pp.tanggal_putusan) AS tahun,
        COUNT(pp.perkara_id) AS jumlah
      FROM perkara_putusan pp
      JOIN perkara p ON p.perkara_id = pp.perkara_id
      WHERE pp.tanggal_putusan IS NOT NULL
        AND (pp.status_putusan_id NOT IN (62, 1, 30, 34) OR pp.status_putusan_id IS NULL)
      GROUP BY YEAR(pp.tanggal_putusan)
      ORDER BY tahun DESC
    `)

    // 3. Status breakdown untuk rincian per jenis status putusan
    const breakdownResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        pp.status_putusan_id,
        COALESCE(sp.nama, pp.status_putusan_nama, 'Status Lainnya') AS status_nama,
        COUNT(pp.perkara_id) AS jumlah
      FROM perkara_putusan pp
      JOIN perkara p ON p.perkara_id = pp.perkara_id
      LEFT JOIN status_putusan sp ON sp.id = pp.status_putusan_id
      WHERE pp.tanggal_putusan IS NOT NULL
        AND (pp.status_putusan_id NOT IN (62, 1, 30, 34) OR pp.status_putusan_id IS NULL)
        ${yearFilter}
      GROUP BY pp.status_putusan_id, status_nama
      ORDER BY jumlah DESC
    `)

    const row = summaryResult[0] || {}

    return serializeBigInt({
      success: true,
      selectedYear,
      summary: {
        total: Number(row.total || 0),
        dicabut: Number(row.dicabut || 0),
        tidak_diterima: Number(row.tidak_diterima || 0),
        ditolak: Number(row.ditolak || 0),
        gugur: Number(row.gugur || 0),
        dicoret: Number(row.dicoret || 0),
        perdamaian: Number(row.perdamaian || 0),
        dismissal: Number(row.dismissal || 0),
        anomali_terbit_ac: Number(row.anomali_terbit_ac || 0),
        belum_bht: Number(row.belum_bht || 0),
        belum_minutasi: Number(row.belum_minutasi || 0)
      },
      availableYears: (yearsResult || []).map((y: any) => ({
        tahun: Number(y.tahun),
        jumlah: Number(y.jumlah)
      })),
      statusBreakdown: (breakdownResult || []).map((b: any) => ({
        status_id: b.status_putusan_id !== null ? Number(b.status_putusan_id) : null,
        status_nama: b.status_nama,
        jumlah: Number(b.jumlah)
      }))
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat memuat ringkasan perkara non-kabul'
    }
  }
})
