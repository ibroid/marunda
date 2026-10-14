import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const pihakType = (query.pihak_type as string) || 'pihak1'

  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31 23:59:59`

  const tablePihak = pihakType === 'pihak2' ? 'perkara_pihak2' : 'perkara_pihak1'

  try {
    // Komparasi per Kecamatan (urutan = 1 agar perkara permohonan dengan banyak pihak tidak duplikat)
    // Selalu hitung gugatan dan permohonan lengkap agar bar chart dapat diklik secara interaktif
    const komparasiRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        rk.kecamatan_kode,
        rk.kecamatan_nama,
        COUNT(DISTINCT p.perkara_id) AS total_perkara,
        COUNT(DISTINCT CASE WHEN p.alur_perkara_id = 15 THEN p.perkara_id END) AS total_gugatan,
        COUNT(DISTINCT CASE WHEN p.alur_perkara_id = 16 THEN p.perkara_id END) AS total_permohonan
      FROM ref_kecamatan_new rk
      LEFT JOIN (
        SELECT pp.perkara_id, ph.kecamatan, p.alur_perkara_id
        FROM ${tablePihak} pp
        JOIN pihak ph ON ph.id = pp.pihak_id
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.urutan = 1
          AND p.tanggal_pendaftaran >= '${startDate}'
          AND p.tanggal_pendaftaran <= '${endDate}'
      ) p ON (p.kecamatan = rk.kecamatan_kode OR p.kecamatan = rk.kecamatan_nama)
      WHERE (rk.kabupaten_kode = '31.72' OR rk.kecamatan_kode LIKE '31.72%')
      GROUP BY rk.kecamatan_kode, rk.kecamatan_nama
      ORDER BY total_perkara DESC
    `)

    const labelsKecamatan: string[] = []
    const dataTotal: number[] = []
    const dataGugatan: number[] = []
    const dataPermohonan: number[] = []

    komparasiRes.forEach(row => {
      labelsKecamatan.push(row.kecamatan_nama)
      dataTotal.push(Number(row.total_perkara || 0))
      dataGugatan.push(Number(row.total_gugatan || 0))
      dataPermohonan.push(Number(row.total_permohonan || 0))
    })

    return serializeBigInt({
      success: true,
      year,
      komparasi: {
        labels: labelsKecamatan,
        total: dataTotal,
        gugatan: dataGugatan,
        permohonan: dataPermohonan
      }
    })
  } catch (error: any) {
    console.error('Error /api/geografi/grafik:', error)
    return {
      success: false,
      year,
      message: error.message || 'Gagal mengambil data grafik geografi'
    }
  }
})
