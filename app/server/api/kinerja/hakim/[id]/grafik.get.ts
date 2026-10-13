import { defineEventHandler, getQuery, getRouterParam } from 'h3'
import { prisma, serializeBigInt } from '../../../../utils/db'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const hakimId = idParam && !isNaN(Number(idParam)) ? Number(idParam) : null
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const role = query.role === 'semua' ? 'semua' : 'ketua'

  if (!hakimId) {
    return {
      success: false,
      message: 'ID Hakim tidak valid'
    }
  }

  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31 23:59:59`

  const hakimCondition = role === 'semua'
    ? `FIND_IN_SET('${hakimId}', pt.majelis_hakim_id)`
    : `CAST(SUBSTRING_INDEX(pt.majelis_hakim_id, ',', 1) AS UNSIGNED) = ${hakimId}`

  try {
    const [trenQuery, jenisQuery] = await Promise.all([
      // 1. Tren Bulanan (Masuk & Putus)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          MONTH(pt.penetapan_majelis_hakim) AS bulan,
          COUNT(p.perkara_id) AS total_masuk,
          SUM(CASE WHEN pp.tanggal_putusan IS NOT NULL AND YEAR(pp.tanggal_putusan) = ${year} THEN 1 ELSE 0 END) AS total_putus
        FROM perkara_penetapan pt
        JOIN perkara p ON p.perkara_id = pt.perkara_id
        LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        WHERE pt.penetapan_majelis_hakim >= '${startDate}' AND pt.penetapan_majelis_hakim <= '${endDate}'
          AND ${hakimCondition}
        GROUP BY MONTH(pt.penetapan_majelis_hakim)
        ORDER BY bulan ASC
      `),

      // 2. Komposisi Jenis Perkara
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.jenis_perkara_nama AS jenis,
          COUNT(p.perkara_id) AS total,
          SUM(CASE WHEN pp.tanggal_putusan IS NOT NULL THEN 1 ELSE 0 END) AS putus
        FROM perkara_penetapan pt
        JOIN perkara p ON p.perkara_id = pt.perkara_id
        LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        WHERE pt.penetapan_majelis_hakim >= '${startDate}' AND pt.penetapan_majelis_hakim <= '${endDate}'
          AND ${hakimCondition}
        GROUP BY p.jenis_perkara_nama
        ORDER BY total DESC
        LIMIT 6
      `)
    ])

    const namaBulan = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ]

    const monthlyMap = new Map<number, { masuk: number; putus: number }>()
    for (let m = 1; m <= 12; m++) {
      monthlyMap.set(m, { masuk: 0, putus: 0 })
    }

    trenQuery.forEach((row) => {
      const b = Number(row.bulan)
      if (b >= 1 && b <= 12) {
        monthlyMap.set(b, {
          masuk: Number(row.total_masuk || 0),
          putus: Number(row.total_putus || 0)
        })
      }
    })

    const trenBulanan = Array.from(monthlyMap.entries()).map(([m, vals]) => ({
      bulanNum: m,
      bulanNama: namaBulan[m - 1],
      masuk: vals.masuk,
      putus: vals.putus
    }))

    const komposisiJenis = jenisQuery.map((j) => ({
      jenis: j.jenis || 'Lainnya',
      total: Number(j.total || 0),
      putus: Number(j.putus || 0)
    }))

    return serializeBigInt({
      success: true,
      year,
      trenBulanan,
      komposisiJenis
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat grafik kinerja hakim'
    }
  }
})
