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

  let alurCondition = ''
  if (alur === '15') {
    alurCondition = 'AND p.alur_perkara_id = 15'
  } else if (alur === '16') {
    alurCondition = 'AND p.alur_perkara_id = 16'
  }

  const tablePihak = pihakType === 'pihak2' ? 'perkara_pihak2' : 'perkara_pihak1'

  try {
    const [kecamatanRes, kelurahanRes, jenisPerkaraRes] = await Promise.all([
      // 1. Data per Kecamatan (pp.urutan = 1 agar perkara tidak duplikat)
      prisma.$queryRawUnsafe<any[]>(`
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
            ${alurCondition}
        ) p ON (p.kecamatan = rk.kecamatan_kode OR p.kecamatan = rk.kecamatan_nama)
        WHERE (rk.kabupaten_kode = '31.72' OR rk.kecamatan_kode LIKE '31.72%')
        GROUP BY rk.kecamatan_kode, rk.kecamatan_nama
        ORDER BY total_perkara DESC
      `),

      // 2. Data Rincian per Kelurahan (pp.urutan = 1)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          rk.kecamatan_kode,
          ph.kelurahan AS kelurahan_kode,
          COALESCE(rkel.kelurahan_nama, ph.kelurahan, 'Lainnya') AS kelurahan_nama,
          COUNT(DISTINCT p.perkara_id) AS total
        FROM ref_kecamatan_new rk
        JOIN pihak ph ON (ph.kecamatan = rk.kecamatan_kode OR ph.kecamatan = rk.kecamatan_nama)
        JOIN ${tablePihak} pp ON pp.pihak_id = ph.id AND pp.urutan = 1
        JOIN perkara p ON p.perkara_id = pp.perkara_id
          AND p.tanggal_pendaftaran >= '${startDate}'
          AND p.tanggal_pendaftaran <= '${endDate}'
          ${alurCondition}
        LEFT JOIN ref_kelurahan_new rkel ON rkel.kelurahan_kode = ph.kelurahan
        WHERE (rk.kabupaten_kode = '31.72' OR rk.kecamatan_kode LIKE '31.72%')
        GROUP BY rk.kecamatan_kode, ph.kelurahan, rkel.kelurahan_nama
        ORDER BY rk.kecamatan_kode ASC, total DESC
      `),

      // 3. Top Jenis Perkara per Kecamatan (pp.urutan = 1)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          rk.kecamatan_kode,
          p.jenis_perkara_nama,
          COUNT(DISTINCT p.perkara_id) AS total
        FROM ref_kecamatan_new rk
        JOIN pihak ph ON (ph.kecamatan = rk.kecamatan_kode OR ph.kecamatan = rk.kecamatan_nama)
        JOIN ${tablePihak} pp ON pp.pihak_id = ph.id AND pp.urutan = 1
        JOIN perkara p ON p.perkara_id = pp.perkara_id
          AND p.tanggal_pendaftaran >= '${startDate}'
          AND p.tanggal_pendaftaran <= '${endDate}'
          ${alurCondition}
        WHERE (rk.kabupaten_kode = '31.72' OR rk.kecamatan_kode LIKE '31.72%')
        GROUP BY rk.kecamatan_kode, p.jenis_perkara_nama
        ORDER BY rk.kecamatan_kode ASC, total DESC
      `)
    ])

    // Hitung total seluruh Jakarta Utara
    const totalSemuaJakut = kecamatanRes.reduce((acc, curr) => acc + Number(curr.total_perkara || 0), 0)

    // Petakan kelurahan per kecamatan
    const kelurahanMap: Record<string, any[]> = {}
    kelurahanRes.forEach(row => {
      if (!kelurahanMap[row.kecamatan_kode]) {
        kelurahanMap[row.kecamatan_kode] = []
      }
      kelurahanMap[row.kecamatan_kode].push({
        kode: row.kelurahan_kode,
        nama: row.kelurahan_nama,
        total: Number(row.total || 0)
      })
    })

    // Petakan top jenis perkara per kecamatan
    const jenisPerkaraMap: Record<string, any[]> = {}
    jenisPerkaraRes.forEach(row => {
      if (!jenisPerkaraMap[row.kecamatan_kode]) {
        jenisPerkaraMap[row.kecamatan_kode] = []
      }
      if (jenisPerkaraMap[row.kecamatan_kode].length < 3) {
        jenisPerkaraMap[row.kecamatan_kode].push({
          nama: row.jenis_perkara_nama || 'Lain-lain',
          total: Number(row.total || 0)
        })
      }
    })

    const items = kecamatanRes.map(row => {
      const total = Number(row.total_perkara || 0)
      const gugatan = Number(row.total_gugatan || 0)
      const permohonan = Number(row.total_permohonan || 0)
      const persentase = totalSemuaJakut > 0 ? Number(((total / totalSemuaJakut) * 100).toFixed(1)) : 0

      return {
        kode: row.kecamatan_kode,
        nama: row.kecamatan_nama,
        total,
        gugatan,
        permohonan,
        persentase,
        kelurahanList: kelurahanMap[row.kecamatan_kode] || [],
        topJenisPerkara: jenisPerkaraMap[row.kecamatan_kode] || []
      }
    })

    return serializeBigInt({
      success: true,
      year,
      totalSemuaJakut,
      items
    })
  } catch (error: any) {
    console.error('Error /api/geografi/wilayah:', error)
    return {
      success: false,
      year,
      message: error.message || 'Gagal mengambil data wilayah kecamatan'
    }
  }
})
