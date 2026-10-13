import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt, createDbErrorResponse } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear

  try {
    const rawData = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        MONTH(a.tanggal_pendaftaran) AS bulan,
        SUM(CASE WHEN d.perkara_id IS NOT NULL THEN 1 ELSE 0 END) AS ecourt,
        SUM(CASE WHEN d.perkara_id IS NULL THEN 1 ELSE 0 END) AS konvensional,
        COUNT(a.perkara_id) AS total
      FROM perkara AS a
      LEFT JOIN perkara_efiling_id AS d ON a.perkara_id = d.perkara_id
      WHERE a.alur_perkara_id <> 114
        AND YEAR(a.tanggal_pendaftaran) = ${year}
      GROUP BY MONTH(a.tanggal_pendaftaran)
      ORDER BY bulan ASC
    `)

    const namaBulanPendek = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const namaBulanPanjang = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]

    const dataPerBulan = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1
      const row = rawData.find((r) => Number(r.bulan) === monthNum)
      const ecourt = row ? Number(row.ecourt || 0) : 0
      const konvensional = row ? Number(row.konvensional || 0) : 0
      const total = ecourt + konvensional
      const persenEcourt = total > 0 ? Number(((ecourt / total) * 100).toFixed(1)) : 0
      const persenKonvensional = total > 0 ? Number(((konvensional / total) * 100).toFixed(1)) : 0

      return {
        bulanNum: monthNum,
        bulanLabel: namaBulanPendek[i],
        bulanNama: namaBulanPanjang[i],
        ecourt,
        konvensional,
        total,
        persenEcourt,
        persenKonvensional
      }
    })

    const totalEcourt = dataPerBulan.reduce((acc, curr) => acc + curr.ecourt, 0)
    const totalKonvensional = dataPerBulan.reduce((acc, curr) => acc + curr.konvensional, 0)
    const totalSemua = totalEcourt + totalKonvensional
    const persenEcourtTotal = totalSemua > 0 ? Number(((totalEcourt / totalSemua) * 100).toFixed(1)) : 0
    const persenKonvensionalTotal = totalSemua > 0 ? Number(((totalKonvensional / totalSemua) * 100).toFixed(1)) : 0

    return serializeBigInt({
      success: true,
      year,
      ringkasan: {
        totalEcourt,
        totalKonvensional,
        totalSemua,
        persenEcourtTotal,
        persenKonvensionalTotal
      },
      bulanan: dataPerBulan,
      grafik: {
        labels: namaBulanPendek,
        ecourt: dataPerBulan.map((b) => b.ecourt),
        konvensional: dataPerBulan.map((b) => b.konvensional),
        total: dataPerBulan.map((b) => b.total)
      }
    })
  } catch (error: any) {
    return createDbErrorResponse(error, 'Gagal memuat data komparasi bulanan e-Court vs Konvensional')
  }
})
