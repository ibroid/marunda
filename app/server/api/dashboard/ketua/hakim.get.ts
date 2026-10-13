import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31 23:59:59`

  try {
    const bebanHakimQuery = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        h.id AS hakim_id,
        h.nama_gelar AS nama,
        COUNT(pr.perkara_id) AS total_perkara,
        SUM(CASE WHEN pp.tanggal_putusan IS NOT NULL THEN 1 ELSE 0 END) AS perkara_putus,
        SUM(CASE WHEN pp.tanggal_putusan IS NULL THEN 1 ELSE 0 END) AS sisa_perkara,
        SUM(CASE WHEN pr.jenis_perkara_nama = 'Cerai Gugat' THEN 1 ELSE 0 END) AS cg,
        SUM(CASE WHEN pr.jenis_perkara_nama = 'Cerai Talak' THEN 1 ELSE 0 END) AS ct,
        SUM(CASE WHEN pr.jenis_perkara_nama NOT IN ('Cerai Gugat', 'Cerai Talak') THEN 1 ELSE 0 END) AS lainnya
      FROM perkara_penetapan pt
      JOIN perkara pr ON pr.perkara_id = pt.perkara_id
      LEFT JOIN perkara_putusan pp ON pp.perkara_id = pr.perkara_id
      JOIN hakim_pn h ON h.id = CAST(SUBSTRING_INDEX(pt.majelis_hakim_id, ',', 1) AS UNSIGNED)
      WHERE pt.penetapan_majelis_hakim >= '${startDate}' AND pt.penetapan_majelis_hakim <= '${endDate}'
      GROUP BY h.id, h.nama_gelar
      ORDER BY total_perkara DESC
    `)

    const daftarBebanHakim = bebanHakimQuery.map((item) => {
      const tot = Number(item.total_perkara || 0)
      const pts = Number(item.perkara_putus || 0)
      const rasio = tot > 0 ? Number(((pts / tot) * 100).toFixed(1)) : 0
      return {
        id: item.hakim_id,
        nama: item.nama || '-',
        total: tot,
        putus: pts,
        sisa: Number(item.sisa_perkara || 0),
        rasio,
        cg: Number(item.cg || 0),
        ct: Number(item.ct || 0),
        lainnya: Number(item.lainnya || 0)
      }
    })

    return serializeBigInt({
      success: true,
      year,
      bebanHakim: daftarBebanHakim
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat beban kerja majelis hakim'
    }
  }
})
