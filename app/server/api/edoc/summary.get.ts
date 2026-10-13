import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear

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

    const persenLengkap = totalPutus > 0 ? Math.round((lengkap / totalPutus) * 100) : 0

    return serializeBigInt({
      success: true,
      year,
      summary: {
        totalPutus,
        belumEdoc,
        belumAnonim,
        lengkap,
        persenLengkap
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat memuat ringkasan e-doc'
    }
  }
})
