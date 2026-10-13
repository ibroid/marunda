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
      // Ambil Nama Satker
      prisma.$queryRawUnsafe<any[]>(
        `SELECT value FROM sys_config WHERE id = 62 OR name = 'NamaPN' LIMIT 1`
      ),
      // Summary Statistik Perkara
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          (SELECT COUNT(perkara_id) FROM perkara WHERE tanggal_pendaftaran >= '${startDate}' AND tanggal_pendaftaran <= '${endDate}') AS total_masuk,
          (SELECT COUNT(perkara_id) FROM perkara_putusan WHERE tanggal_putusan >= '${startDate}' AND tanggal_putusan <= '${endDate}') AS total_putus,
          (SELECT COUNT(perkara_id) FROM perkara_putusan WHERE tanggal_minutasi >= '${startDate}' AND tanggal_minutasi <= '${endDate}') AS total_minutasi,
          (
            (SELECT COUNT(perkara_id) FROM perkara WHERE tanggal_pendaftaran < '${startDate}')
            -
            (SELECT COUNT(perkara_id) FROM perkara_putusan WHERE tanggal_putusan < '${startDate}')
          ) AS sisa_lalu,
          (SELECT COUNT(p.perkara_id)
           FROM perkara p
           WHERE p.tanggal_pendaftaran >= '${startDate}' AND p.tanggal_pendaftaran <= '${endDate}'
             AND NOT EXISTS (
               SELECT 1 FROM perkara_penetapan pt
               WHERE pt.perkara_id = p.perkara_id
                 AND pt.penetapan_majelis_hakim IS NOT NULL
                 AND pt.penetapan_majelis_hakim != ''
             )
          ) AS belum_pmh
      `)
    ])

    const namaSatker = satkerQuery.length > 0 ? satkerQuery[0].value : 'Pengadilan Agama'

    const totalMasuk = Number(summaryQuery[0]?.total_masuk || 0)
    const totalPutus = Number(summaryQuery[0]?.total_putus || 0)
    const totalMinutasi = Number(summaryQuery[0]?.total_minutasi || 0)
    const sisaLalu = Number(summaryQuery[0]?.sisa_lalu || 0)
    const belumPmh = Number(summaryQuery[0]?.belum_pmh || 0)
    const bebanPerkara = sisaLalu + totalMasuk
    const sisaPerkara = bebanPerkara - totalPutus
    const rasioPenyelesaian = bebanPerkara > 0 ? Number(((totalPutus / bebanPerkara) * 100).toFixed(2)) : 0
    const rasioMinutasi = totalPutus > 0 ? Number(((totalMinutasi / totalPutus) * 100).toFixed(2)) : 0

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
        rasioPenyelesaian,
        rasioMinutasi,
        belumPmh
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat ringkasan dashboard ketua'
    }
  }
})
