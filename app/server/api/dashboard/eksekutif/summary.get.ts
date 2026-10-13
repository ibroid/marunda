import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31 23:59:59`

  try {
    const [satkerQuery, summaryQuery] = await Promise.all([
      // 1. Ambil Nama Satker
      prisma.$queryRawUnsafe<any[]>(
        `SELECT value FROM sys_config WHERE id = 62 OR name = 'NamaPN' LIMIT 1`
      ),

      // 2. Summary Statistik Perkara
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          (SELECT COUNT(perkara_id) FROM perkara WHERE tanggal_pendaftaran >= '${startDate}' AND tanggal_pendaftaran <= '${endDate}') AS total_masuk,
          (SELECT COUNT(perkara_id) FROM perkara_putusan WHERE tanggal_putusan >= '${startDate}' AND tanggal_putusan <= '${endDate}') AS total_putus,
          (SELECT COUNT(perkara_id) FROM perkara_putusan WHERE tanggal_minutasi >= '${startDate}' AND tanggal_minutasi <= '${endDate}') AS total_minutasi,
          (
            (SELECT COUNT(perkara_id) FROM perkara WHERE tanggal_pendaftaran < '${startDate}')
            -
            (SELECT COUNT(perkara_id) FROM perkara_putusan WHERE tanggal_putusan < '${startDate}')
          ) AS sisa_lalu
      `)
    ])

    const namaSatker = satkerQuery.length > 0 ? satkerQuery[0].value : 'Pengadilan Agama'

    const totalMasuk = Number(summaryQuery[0]?.total_masuk || 0)
    const totalPutus = Number(summaryQuery[0]?.total_putus || 0)
    const totalMinutasi = Number(summaryQuery[0]?.total_minutasi || 0)
    const sisaLalu = Number(summaryQuery[0]?.sisa_lalu || 0)
    const bebanPerkara = sisaLalu + totalMasuk
    const sisaPerkara = bebanPerkara - totalPutus
    const rasioPenyelesaian = bebanPerkara > 0 ? ((totalPutus / bebanPerkara) * 100).toFixed(2) : '0.00'
    const rasioMinutasi = totalPutus > 0 ? ((totalMinutasi / totalPutus) * 100).toFixed(2) : '0.00'

    return serializeBigInt({
      success: true,
      year,
      namaSatker,
      summary: {
        totalMasuk,
        totalPutus,
        totalMinutasi,
        sisaLalu,
        bebanPerkara,
        sisaPerkara,
        rasioPenyelesaian: Number(rasioPenyelesaian),
        rasioMinutasi: Number(rasioMinutasi)
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat summary dashboard eksekutif'
    }
  }
})
