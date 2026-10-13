import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31 23:59:59`

  try {
    const [grafikMasuk, grafikPutus, grafikMinutasi] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT MONTH(tanggal_pendaftaran) as bulan, COUNT(perkara_id) as jumlah
        FROM perkara
        WHERE tanggal_pendaftaran >= '${startDate}' AND tanggal_pendaftaran <= '${endDate}'
        GROUP BY MONTH(tanggal_pendaftaran)
      `),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT MONTH(tanggal_putusan) as bulan, COUNT(perkara_id) as jumlah
        FROM perkara_putusan
        WHERE tanggal_putusan >= '${startDate}' AND tanggal_putusan <= '${endDate}'
        GROUP BY MONTH(tanggal_putusan)
      `),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT MONTH(tanggal_minutasi) as bulan, COUNT(perkara_id) as jumlah
        FROM perkara_putusan
        WHERE tanggal_minutasi >= '${startDate}' AND tanggal_minutasi <= '${endDate}'
        GROUP BY MONTH(tanggal_minutasi)
      `)
    ])

    const bulananMasuk = Array(12).fill(0)
    const bulananPutus = Array(12).fill(0)
    const bulananMinutasi = Array(12).fill(0)

    grafikMasuk.forEach(r => { bulananMasuk[Number(r.bulan) - 1] = Number(r.jumlah) })
    grafikPutus.forEach(r => { bulananPutus[Number(r.bulan) - 1] = Number(r.jumlah) })
    grafikMinutasi.forEach(r => { bulananMinutasi[Number(r.bulan) - 1] = Number(r.jumlah) })

    return serializeBigInt({
      success: true,
      year,
      grafik: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
        masuk: bulananMasuk,
        putus: bulananPutus,
        minutasi: bulananMinutasi
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat grafik bulanan dashboard eksekutif'
    }
  }
})
