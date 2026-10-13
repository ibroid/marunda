import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const kategori = (query.kategori as string) || 'belum_edoc'

  try {
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

    return serializeBigInt({
      success: true,
      year,
      kategori,
      detail: detailList
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat memuat detail perkara e-doc'
    }
  }
})
