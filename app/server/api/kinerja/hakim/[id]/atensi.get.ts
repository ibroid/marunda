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
    const [tunggakanRes, belumMinutasiRes, belumEdocRes] = await Promise.all([
      // 1. Perkara Tunggakan (> 90 Hari Belum Putus)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          p.tanggal_pendaftaran,
          p.para_pihak,
          p.proses_terakhir_text,
          DATEDIFF(CURDATE(), p.tanggal_pendaftaran) AS usia_hari,
          pt.panitera_pengganti_text
        FROM perkara_penetapan pt
        JOIN perkara p ON p.perkara_id = pt.perkara_id
        LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        WHERE pt.penetapan_majelis_hakim >= '${startDate}' AND pt.penetapan_majelis_hakim <= '${endDate}'
          AND ${hakimCondition}
          AND pp.tanggal_putusan IS NULL
          AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) > 90
        ORDER BY usia_hari DESC
        LIMIT 10
      `),

      // 2. Putus Belum Minutasi
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          pp.tanggal_putusan,
          p.para_pihak,
          DATEDIFF(CURDATE(), pp.tanggal_putusan) AS hari_setelah_putus,
          pt.panitera_pengganti_text
        FROM perkara_penetapan pt
        JOIN perkara p ON p.perkara_id = pt.perkara_id
        JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        WHERE pt.penetapan_majelis_hakim >= '${startDate}' AND pt.penetapan_majelis_hakim <= '${endDate}'
          AND ${hakimCondition}
          AND pp.tanggal_putusan IS NOT NULL
          AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi = '')
        ORDER BY pp.tanggal_putusan DESC
        LIMIT 10
      `),

      // 3. Putus Belum Upload e-Doc
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          pp.tanggal_putusan,
          p.para_pihak,
          DATEDIFF(CURDATE(), pp.tanggal_putusan) AS hari_setelah_putus,
          pt.panitera_pengganti_text
        FROM perkara_penetapan pt
        JOIN perkara p ON p.perkara_id = pt.perkara_id
        JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        WHERE pt.penetapan_majelis_hakim >= '${startDate}' AND pt.penetapan_majelis_hakim <= '${endDate}'
          AND ${hakimCondition}
          AND pp.tanggal_putusan IS NOT NULL
          AND (pp.amar_putusan_dok IS NULL OR pp.amar_putusan_dok = '')
        ORDER BY pp.tanggal_putusan DESC
        LIMIT 10
      `)
    ])

    return serializeBigInt({
      success: true,
      year,
      tunggakan: {
        total: tunggakanRes.length,
        items: tunggakanRes
      },
      belumMinutasi: {
        total: belumMinutasiRes.length,
        items: belumMinutasiRes
      },
      belumEdoc: {
        total: belumEdocRes.length,
        items: belumEdocRes
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat atensi kinerja hakim'
    }
  }
})
