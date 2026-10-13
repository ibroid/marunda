import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31 23:59:59`

  try {
    const perkaraTerbaru = await prisma.$queryRawUnsafe<any[]>(`
      SELECT perkara_id, nomor_perkara, tanggal_pendaftaran, jenis_perkara_nama, proses_terakhir_text
      FROM perkara
      WHERE tanggal_pendaftaran >= '${startDate}' AND tanggal_pendaftaran <= '${endDate}'
      ORDER BY tanggal_pendaftaran DESC
      LIMIT 10
    `)

    return serializeBigInt({
      success: true,
      year,
      perkaraTerbaru
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat perkara terbaru'
    }
  }
})
