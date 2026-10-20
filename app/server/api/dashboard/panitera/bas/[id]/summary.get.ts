import { defineEventHandler, getQuery, getRouterParam } from 'h3'
import { prisma, serializeBigInt } from '../../../../../utils/db'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const ppId = idParam && !isNaN(Number(idParam)) ? Number(idParam) : null
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  if (!ppId) {
    return {
      success: false,
      message: 'ID Panitera Pengganti tidak valid'
    }
  }

  try {
    // 1. Info Panitera Pengganti
    const ppRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, nama_gelar, nip, aktif
      FROM panitera_pn
      WHERE id = ${ppId}
      LIMIT 1
    `)

    if (!ppRes.length) {
      return {
        success: false,
        message: 'Data Panitera Pengganti tidak ditemukan'
      }
    }

    const panitera = ppRes[0]

    // 2. Summary Statistik BAS untuk Panitera ini
    const sumRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(js.id) AS total_sidang,
        SUM(CASE WHEN js.edoc_bas IS NOT NULL AND js.edoc_bas != '' THEN 1 ELSE 0 END) AS bas_ada,
        SUM(CASE WHEN js.edoc_bas IS NULL OR js.edoc_bas = '' THEN 1 ELSE 0 END) AS bas_kosong
      FROM perkara_jadwal_sidang js
      JOIN perkara_penetapan pt ON pt.perkara_id = js.perkara_id
      WHERE js.tanggal_sidang >= '${startDate}' AND js.tanggal_sidang <= '${endDate}'
        AND js.tanggal_sidang <= CURDATE()
        AND pt.panitera_pengganti_id = ${ppId}
    `)

    const totalSidang = Number(sumRes[0]?.total_sidang || 0)
    const basAda = Number(sumRes[0]?.bas_ada || 0)
    const basKosong = Number(sumRes[0]?.bas_kosong || 0)
    const kepatuhan = totalSidang > 0 ? Number(((basAda / totalSidang) * 100).toFixed(1)) : 100

    return serializeBigInt({
      success: true,
      year,
      panitera: {
        id: panitera.id,
        nama: panitera.nama_gelar || '-',
        nip: panitera.nip || '-',
        aktif: panitera.aktif
      },
      summary: {
        totalSidang,
        basAda,
        basKosong,
        kepatuhan
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil ringkasan BAS'
    }
  }
})
