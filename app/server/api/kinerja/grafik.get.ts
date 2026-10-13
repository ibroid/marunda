import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

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
          AND alur_perkara_id <> 114
        GROUP BY MONTH(tanggal_pendaftaran)
      `),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT MONTH(B.tanggal_putusan) as bulan, COUNT(A.perkara_id) as jumlah
        FROM perkara AS A
        JOIN perkara_putusan AS B ON A.perkara_id = B.perkara_id
        WHERE B.tanggal_putusan >= '${startDate}' AND B.tanggal_putusan <= '${endDate}'
          AND A.alur_perkara_id <> 114
        GROUP BY MONTH(B.tanggal_putusan)
      `),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT MONTH(B.tanggal_minutasi) as bulan, COUNT(A.perkara_id) as jumlah
        FROM perkara AS A
        JOIN perkara_putusan AS B ON A.perkara_id = B.perkara_id
        WHERE B.tanggal_minutasi >= '${startDate}' AND B.tanggal_minutasi <= '${endDate}'
          AND A.alur_perkara_id <> 114
        GROUP BY MONTH(B.tanggal_minutasi)
      `)
    ])

    const bulananMasuk = Array(12).fill(0)
    const bulananPutus = Array(12).fill(0)
    const bulananMinutasi = Array(12).fill(0)

    grafikMasuk.forEach((r) => {
      const idx = Number(r.bulan) - 1
      if (idx >= 0 && idx < 12) bulananMasuk[idx] = Number(r.jumlah)
    })
    grafikPutus.forEach((r) => {
      const idx = Number(r.bulan) - 1
      if (idx >= 0 && idx < 12) bulananPutus[idx] = Number(r.jumlah)
    })
    grafikMinutasi.forEach((r) => {
      const idx = Number(r.bulan) - 1
      if (idx >= 0 && idx < 12) bulananMinutasi[idx] = Number(r.jumlah)
    })

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
      message: error.message || 'Gagal memuat grafik bulanan kinerja'
    }
  }
})
