import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear

  try {
    // 1. Total Gugatan (alur 15)
    const gugatanRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(perkara_id) AS total
      FROM perkara
      WHERE YEAR(tanggal_pendaftaran) = ${year}
        AND alur_perkara_id = 15
    `)
    const totalGugatan = Number(gugatanRes[0]?.total || 0)

    // 2. Total Permohonan (alur 16)
    const permohonanRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(perkara_id) AS total
      FROM perkara
      WHERE YEAR(tanggal_pendaftaran) = ${year}
        AND alur_perkara_id = 16
    `)
    const totalPermohonan = Number(permohonanRes[0]?.total || 0)

    // 3. Total Prodeo (prodeo = 1)
    const prodeoRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(perkara_id) AS total
      FROM perkara
      WHERE YEAR(tanggal_pendaftaran) = ${year}
        AND prodeo = 1
    `)
    const totalProdeo = Number(prodeoRes[0]?.total || 0)

    return serializeBigInt({
      success: true,
      year,
      summary: {
        totalGugatan,
        totalPermohonan,
        totalProdeo,
        totalSemua: totalGugatan + totalPermohonan
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat memuat ringkasan register'
    }
  }
})
