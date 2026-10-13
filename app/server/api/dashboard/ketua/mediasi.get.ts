import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31 23:59:59`

  try {
    const mediasiQuery = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(perkara_id) AS total_mediasi,
        SUM(CASE WHEN hasil_mediasi IN ('Y1', 'Y2') THEN 1 ELSE 0 END) AS berhasil,
        SUM(CASE WHEN hasil_mediasi = 'S' THEN 1 ELSE 0 END) AS berhasil_sebagian,
        SUM(CASE WHEN hasil_mediasi = 'T' THEN 1 ELSE 0 END) AS tidak_berhasil,
        SUM(CASE WHEN hasil_mediasi = 'D' THEN 1 ELSE 0 END) AS tidak_dapat_laksana
      FROM perkara_mediasi
      WHERE (penetapan_tanggal_mediasi >= '${startDate}' AND penetapan_tanggal_mediasi <= '${endDate}')
         OR (dimulai_mediasi >= '${startDate}' AND dimulai_mediasi <= '${endDate}')
    `)

    const totalMediasi = Number(mediasiQuery[0]?.total_mediasi || 0)
    const mediasiBerhasil = Number(mediasiQuery[0]?.berhasil || 0)
    const mediasiSebagian = Number(mediasiQuery[0]?.berhasil_sebagian || 0)
    const mediasiGagal = Number(mediasiQuery[0]?.tidak_berhasil || 0)
    const mediasiDibatalkan = Number(mediasiQuery[0]?.tidak_dapat_laksana || 0)
    const rasioMediasiBerhasil = totalMediasi > 0 ? Number((((mediasiBerhasil + mediasiSebagian) / totalMediasi) * 100).toFixed(1)) : 0

    return serializeBigInt({
      success: true,
      year,
      mediasi: {
        total: totalMediasi,
        berhasil: mediasiBerhasil,
        berhasilSebagian: mediasiSebagian,
        tidakBerhasil: mediasiGagal,
        tidakDapatLaksana: mediasiDibatalkan,
        rasioBerhasil: rasioMediasiBerhasil
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat data mediasi'
    }
  }
})
