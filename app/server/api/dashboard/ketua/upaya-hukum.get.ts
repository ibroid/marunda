import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31 23:59:59`

  try {
    const upayaHukumQuery = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        (SELECT COUNT(perkara_id) FROM perkara_banding WHERE permohonan_banding >= '${startDate}' AND permohonan_banding <= '${endDate}') AS total_banding,
        (SELECT COUNT(perkara_id) FROM perkara_kasasi WHERE permohonan_kasasi >= '${startDate}' AND permohonan_kasasi <= '${endDate}') AS total_kasasi,
        (SELECT COUNT(perkara_id) FROM perkara_pk WHERE permohonan_pk >= '${startDate}' AND permohonan_pk <= '${endDate}') AS total_pk
    `)

    const banding = Number(upayaHukumQuery[0]?.total_banding || 0)
    const kasasi = Number(upayaHukumQuery[0]?.total_kasasi || 0)
    const pk = Number(upayaHukumQuery[0]?.total_pk || 0)

    return serializeBigInt({
      success: true,
      year,
      upayaHukum: {
        total: banding + kasasi + pk,
        banding,
        kasasi,
        pk
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat data upaya hukum'
    }
  }
})
