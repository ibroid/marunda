import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const kategori = (query.kategori as string) || 'belum_edoc'

  try {
    // 1. Total Putus Tahun Terkait
    const totalPutusRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(perkara_id) AS total
      FROM perkara_putusan
      WHERE YEAR(tanggal_putusan) = ${year}
    `)
    const totalPutus = Number(totalPutusRes[0]?.total || 0)

    // 2. Putus Belum Upload e-Doc Putusan
    const belumEdocRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(perkara_id) AS total
      FROM perkara_putusan
      WHERE YEAR(tanggal_putusan) = ${year}
        AND (amar_putusan_dok IS NULL OR amar_putusan_dok = '')
    `)
    const belumEdoc = Number(belumEdocRes[0]?.total || 0)

    // 3. Putus Sudah Upload e-Doc tapi Belum Anonimisasi
    const belumAnonimRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(perkara_id) AS total
      FROM perkara_putusan
      WHERE YEAR(tanggal_putusan) = ${year}
        AND amar_putusan_dok IS NOT NULL AND amar_putusan_dok != ''
        AND (amar_putusan_anonim IS NULL OR amar_putusan_anonim = '')
    `)
    const belumAnonim = Number(belumAnonimRes[0]?.total || 0)

    // 4. Sudah Upload Lengkap (Putusan + Anonim)
    const lengkapRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(perkara_id) AS total
      FROM perkara_putusan
      WHERE YEAR(tanggal_putusan) = ${year}
        AND amar_putusan_dok IS NOT NULL AND amar_putusan_dok != ''
        AND amar_putusan_anonim IS NOT NULL AND amar_putusan_anonim != ''
    `)
    const lengkap = Number(lengkapRes[0]?.total || 0)

    // 5. Query Detail Perkara Berdasarkan Kategori yang Dipilih
    let detailQuery = ''
    if (kategori === 'belum_anonim') {
      detailQuery = `
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          p.para_pihak,
          pp.tanggal_putusan,
          pp.amar_putusan_dok,
          pp.amar_putusan_anonim
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE YEAR(pp.tanggal_putusan) = ${year}
          AND pp.amar_putusan_dok IS NOT NULL AND pp.amar_putusan_dok != ''
          AND (pp.amar_putusan_anonim IS NULL OR pp.amar_putusan_anonim = '')
        ORDER BY pp.tanggal_putusan DESC
        LIMIT 100
      `
    } else {
      // Default: belum_edoc
      detailQuery = `
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          p.para_pihak,
          pp.tanggal_putusan,
          pp.amar_putusan_dok,
          pp.amar_putusan_anonim
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE YEAR(pp.tanggal_putusan) = ${year}
          AND (pp.amar_putusan_dok IS NULL OR pp.amar_putusan_dok = '')
        ORDER BY pp.tanggal_putusan DESC
        LIMIT 100
      `
    }

    const detailList = await prisma.$queryRawUnsafe<any[]>(detailQuery)

    const persenLengkap = totalPutus > 0 ? Math.round((lengkap / totalPutus) * 100) : 0

    return serializeBigInt({
      success: true,
      year,
      kategori,
      summary: {
        totalPutus,
        belumEdoc,
        belumAnonim,
        lengkap,
        persenLengkap
      },
      detail: detailList
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat audit e-doc putusan'
    }
  }
})
