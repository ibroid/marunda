import { defineEventHandler, getQuery, getRouterParam } from 'h3'
import { prisma, serializeBigInt } from '../../../../utils/db'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const hakimId = idParam && !isNaN(Number(idParam)) ? Number(idParam) : null
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const role = query.role === 'semua' ? 'semua' : 'ketua'

  if (!hakimId) {
    return {
      success: false,
      message: 'ID Hakim tidak valid'
    }
  }

  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31 23:59:59`

  const hakimCondition = role === 'semua'
    ? `FIND_IN_SET('${hakimId}', pt.majelis_hakim_id)`
    : `CAST(SUBSTRING_INDEX(pt.majelis_hakim_id, ',', 1) AS UNSIGNED) = ${hakimId}`

  try {
    // 1. Info Hakim
    const hakimRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, nama_gelar, nip, pangkat, jabatan, aktif
      FROM hakim_pn
      WHERE id = ${hakimId}
      LIMIT 1
    `)

    if (!hakimRes.length) {
      return {
        success: false,
        message: 'Data Hakim tidak ditemukan'
      }
    }

    const hakim = hakimRes[0]

    // 2. Summary Statistik Kinerja Hakim
    const sumRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(p.perkara_id) AS total_beban,
        SUM(CASE WHEN pp.tanggal_putusan IS NOT NULL THEN 1 ELSE 0 END) AS total_putus,
        SUM(CASE WHEN pp.tanggal_putusan IS NULL THEN 1 ELSE 0 END) AS total_sisa,
        SUM(CASE WHEN pp.tanggal_putusan IS NOT NULL AND pp.tanggal_minutasi IS NOT NULL AND pp.tanggal_minutasi != '0000-00-00' AND pp.tanggal_minutasi != '' THEN 1 ELSE 0 END) AS sudah_minutasi,
        SUM(CASE WHEN pp.tanggal_putusan IS NOT NULL AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi = '') THEN 1 ELSE 0 END) AS belum_minutasi,
        SUM(CASE WHEN pp.tanggal_putusan IS NOT NULL AND pp.amar_putusan_dok IS NOT NULL AND pp.amar_putusan_dok != '' THEN 1 ELSE 0 END) AS sudah_edoc,
        SUM(CASE WHEN pp.tanggal_putusan IS NOT NULL AND (pp.amar_putusan_dok IS NULL OR pp.amar_putusan_dok = '') THEN 1 ELSE 0 END) AS belum_edoc,
        ROUND(AVG(CASE WHEN pp.tanggal_putusan IS NOT NULL THEN DATEDIFF(pp.tanggal_putusan, p.tanggal_pendaftaran) ELSE NULL END), 1) AS rata_rata_hari_penyelesaian,
        SUM(CASE WHEN pp.tanggal_putusan IS NULL AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) > 90 THEN 1 ELSE 0 END) AS total_tunggakan
      FROM perkara_penetapan pt
      JOIN perkara p ON p.perkara_id = pt.perkara_id
      LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
      WHERE pt.penetapan_majelis_hakim >= '${startDate}' AND pt.penetapan_majelis_hakim <= '${endDate}'
        AND ${hakimCondition}
    `)

    const row = sumRes[0] || {}
    const totalBeban = Number(row.total_beban || 0)
    const totalPutus = Number(row.total_putus || 0)
    const totalSisa = Number(row.total_sisa || 0)
    const sudahMinutasi = Number(row.sudah_minutasi || 0)
    const belumMinutasi = Number(row.belum_minutasi || 0)
    const sudahEdoc = Number(row.sudah_edoc || 0)
    const belumEdoc = Number(row.belum_edoc || 0)
    const totalTunggakan = Number(row.total_tunggakan || 0)
    const avgHari = row.rata_rata_hari_penyelesaian !== null && row.rata_rata_hari_penyelesaian !== undefined
      ? Number(row.rata_rata_hari_penyelesaian)
      : 0

    const rasioPutus = totalBeban > 0 ? Number(((totalPutus / totalBeban) * 100).toFixed(1)) : 0
    const rasioMinutasi = totalPutus > 0 ? Number(((sudahMinutasi / totalPutus) * 100).toFixed(1)) : 100
    const rasioEdoc = totalPutus > 0 ? Number(((sudahEdoc / totalPutus) * 100).toFixed(1)) : 100

    return serializeBigInt({
      success: true,
      year,
      role,
      hakim: {
        id: Number(hakim.id),
        nama: hakim.nama_gelar || '-',
        nip: hakim.nip || '-',
        pangkat: hakim.pangkat || '-',
        jabatan: hakim.jabatan || '-',
        aktif: hakim.aktif === 'Y'
      },
      summary: {
        totalBeban,
        totalPutus,
        totalSisa,
        rasioPutus,
        sudahMinutasi,
        belumMinutasi,
        rasioMinutasi,
        sudahEdoc,
        belumEdoc,
        rasioEdoc,
        rataRataHariPenyelesaian: avgHari,
        totalTunggakan
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat ringkasan kinerja hakim'
    }
  }
})
