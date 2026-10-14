import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const pihakType = (query.pihak_type as string) || 'pihak1'
  const alur = (query.alur as string) || 'all'

  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31 23:59:59`

  // Gunakan urutan = 1 agar perkara permohonan (yang memiliki banyak pihak1) tidak duplikat
  const tablePihak = pihakType === 'pihak2' ? 'perkara_pihak2' : 'perkara_pihak1'

  let alurCondition = ''
  if (alur === '15') {
    alurCondition = 'AND p.alur_perkara_id = 15'
  } else if (alur === '16') {
    alurCondition = 'AND p.alur_perkara_id = 16'
  }

  try {
    const [satkerRes, summaryRes, kecamatanRanking] = await Promise.all([
      // 1. Ambil Nama Satker
      prisma.$queryRawUnsafe<any[]>(
        `SELECT value FROM sys_config WHERE id = 62 OR name = 'NamaPN' LIMIT 1`
      ),

      // 2. Summary Total Se-Jakarta Utara
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(DISTINCT p.perkara_id) AS total_perkara,
          COUNT(DISTINCT CASE WHEN p.alur_perkara_id = 15 THEN p.perkara_id END) AS total_gugatan,
          COUNT(DISTINCT CASE WHEN p.alur_perkara_id = 16 THEN p.perkara_id END) AS total_permohonan
        FROM perkara p
        JOIN ${tablePihak} pp ON pp.perkara_id = p.perkara_id AND pp.urutan = 1
        JOIN pihak ph ON ph.id = pp.pihak_id
        JOIN ref_kecamatan_new rk ON (rk.kecamatan_kode = ph.kecamatan OR rk.kecamatan_nama = ph.kecamatan)
        WHERE (rk.kabupaten_kode = '31.72' OR rk.kecamatan_kode LIKE '31.72%')
          AND p.tanggal_pendaftaran >= '${startDate}'
          AND p.tanggal_pendaftaran <= '${endDate}'
          ${alurCondition}
      `),

      // 3. Ranking Kecamatan di Jakarta Utara
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          rk.kecamatan_kode,
          rk.kecamatan_nama,
          COUNT(DISTINCT p.perkara_id) AS total
        FROM ref_kecamatan_new rk
        LEFT JOIN (
          SELECT pp.perkara_id, ph.kecamatan
          FROM ${tablePihak} pp
          JOIN pihak ph ON ph.id = pp.pihak_id
          JOIN perkara p ON p.perkara_id = pp.perkara_id
          WHERE pp.urutan = 1
            AND p.tanggal_pendaftaran >= '${startDate}'
            AND p.tanggal_pendaftaran <= '${endDate}'
            ${alurCondition}
        ) p ON (p.kecamatan = rk.kecamatan_kode OR p.kecamatan = rk.kecamatan_nama)
        WHERE (rk.kabupaten_kode = '31.72' OR rk.kecamatan_kode LIKE '31.72%')
        GROUP BY rk.kecamatan_kode, rk.kecamatan_nama
        ORDER BY total DESC
      `)
    ])

    const namaSatker = satkerRes.length > 0 ? satkerRes[0].value : 'Pengadilan Agama Jakarta Utara'
    const totalPerkara = Number(summaryRes[0]?.total_perkara || 0)
    const totalGugatan = Number(summaryRes[0]?.total_gugatan || 0)
    const totalPermohonan = Number(summaryRes[0]?.total_permohonan || 0)

    const listKec = kecamatanRanking.map(k => ({
      kode: k.kecamatan_kode,
      nama: k.kecamatan_nama,
      total: Number(k.total || 0),
      persentase: totalPerkara > 0 ? Number(((Number(k.total || 0) / totalPerkara) * 100).toFixed(1)) : 0
    }))

    const kecamatanTertinggi = listKec.length > 0 ? listKec[0] : null
    const kecamatanTerendah = listKec.length > 0 ? listKec[listKec.length - 1] : null
    const rataRataPerKecamatan = listKec.length > 0 ? Math.round(totalPerkara / listKec.length) : 0

    return serializeBigInt({
      success: true,
      year,
      namaSatker,
      pihakType,
      summary: {
        totalPerkara,
        totalGugatan,
        totalPermohonan,
        persenGugatan: totalPerkara > 0 ? Number(((totalGugatan / totalPerkara) * 100).toFixed(1)) : 0,
        persenPermohonan: totalPerkara > 0 ? Number(((totalPermohonan / totalPerkara) * 100).toFixed(1)) : 0,
        jumlahKecamatan: listKec.length,
        rataRataPerKecamatan,
        kecamatanTertinggi,
        kecamatanTerendah
      }
    })
  } catch (error: any) {
    console.error('Error /api/geografi/summary:', error)
    return {
      success: false,
      year,
      message: error.message || 'Gagal mengambil data ringkasan geografi'
    }
  }
})
