import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  try {
    const ppQuery = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        p.id AS pp_id,
        p.nama_gelar AS nama,
        COUNT(js.id) AS total_sidang,
        SUM(CASE WHEN js.edoc_bas IS NOT NULL AND js.edoc_bas != '' THEN 1 ELSE 0 END) AS bas_ada,
        SUM(CASE WHEN js.edoc_bas IS NULL OR js.edoc_bas = '' THEN 1 ELSE 0 END) AS bas_kosong
      FROM perkara_jadwal_sidang js
      JOIN perkara_penetapan pt ON pt.perkara_id = js.perkara_id
      JOIN panitera_pn p ON p.id = pt.panitera_pengganti_id
      WHERE js.tanggal_sidang >= '${startDate}' AND js.tanggal_sidang <= '${endDate}'
        AND js.tanggal_sidang <= CURDATE()
      GROUP BY p.id, p.nama_gelar
      ORDER BY bas_kosong DESC, total_sidang DESC
    `)

    const kinerjaPP = ppQuery.map((item) => {
      const tot = Number(item.total_sidang || 0)
      const ada = Number(item.bas_ada || 0)
      const ksg = Number(item.bas_kosong || 0)
      const kepatuhan = tot > 0 ? Number(((ada / tot) * 100).toFixed(1)) : 100
      let statusColor = 'green'
      if (kepatuhan < 75) statusColor = 'red'
      else if (kepatuhan < 90) statusColor = 'amber'

      return {
        id: item.pp_id,
        nama: item.nama || '-',
        totalSidang: tot,
        basAda: ada,
        basKosong: ksg,
        kepatuhan,
        statusColor
      }
    })

    return serializeBigInt({
      success: true,
      year,
      kinerjaPP
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil kinerja Panitera Pengganti'
    }
  }
})
