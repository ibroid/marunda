import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const pihakType = (query.pihak_type as string) || 'pihak1'
  const alur = (query.alur as string) || 'all'
  const kecamatan = ((query.kecamatan as string) || '').trim()
  const sort = (query.sort as string) || 'total' // 'total' | 'id' | 'nama'
  const order = (query.order as string) || 'desc' // 'asc' | 'desc'

  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31 23:59:59`

  const tablePihak = pihakType === 'pihak2' ? 'perkara_pihak2' : 'perkara_pihak1'

  let alurCondition = ''
  if (alur === '15') {
    alurCondition = 'AND p.alur_perkara_id = 15'
  } else if (alur === '16') {
    alurCondition = 'AND p.alur_perkara_id = 16'
  }

  try {
    const masterJenis = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, nama FROM jenis_perkara WHERE id BETWEEN 341 AND 371 ORDER BY id ASC`
    )

    let perkaraAgg: any[] = []

    if (kecamatan) {
      const safeKec = kecamatan.replace(/['"\\]/g, '')
      perkaraAgg = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.jenis_perkara_id,
          COUNT(DISTINCT p.perkara_id) AS total,
          COUNT(DISTINCT CASE WHEN p.alur_perkara_id = 15 THEN p.perkara_id END) AS gugatan,
          COUNT(DISTINCT CASE WHEN p.alur_perkara_id = 16 THEN p.perkara_id END) AS permohonan
        FROM perkara p
        JOIN ${tablePihak} pp ON pp.perkara_id = p.perkara_id AND pp.urutan = 1
        JOIN pihak ph ON ph.id = pp.pihak_id
        JOIN ref_kecamatan_new rk ON (
          rk.kecamatan_kode = ph.kecamatan
          OR rk.kecamatan_nama = ph.kecamatan
          OR TRIM(TRAILING '.' FROM rk.kecamatan_nama) = ph.kecamatan
          OR ph.kecamatan LIKE CONCAT('%', TRIM(TRAILING '.' FROM rk.kecamatan_nama), '%')
        )
        WHERE (rk.kabupaten_kode IN ('31.72', '31.01') OR rk.kecamatan_kode LIKE '31.72%' OR rk.kecamatan_kode LIKE '31.01%')
          AND (
            rk.kecamatan_kode = '${safeKec}'
            OR rk.kecamatan_nama = '${safeKec}'
            OR TRIM(TRAILING '.' FROM rk.kecamatan_nama) = '${safeKec}'
            OR ph.kecamatan = '${safeKec}'
            OR ph.kecamatan LIKE CONCAT('%', '${safeKec}', '%')
          )
          AND p.jenis_perkara_id BETWEEN 341 AND 371
          AND p.tanggal_pendaftaran >= '${startDate}'
          AND p.tanggal_pendaftaran <= '${endDate}'
          ${alurCondition}
        GROUP BY p.jenis_perkara_id
      `)
    } else {
      perkaraAgg = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.jenis_perkara_id,
          COUNT(*) AS total,
          SUM(CASE WHEN p.alur_perkara_id = 15 THEN 1 ELSE 0 END) AS gugatan,
          SUM(CASE WHEN p.alur_perkara_id = 16 THEN 1 ELSE 0 END) AS permohonan
        FROM perkara p
        WHERE p.jenis_perkara_id BETWEEN 341 AND 371
          AND p.tanggal_pendaftaran >= '${startDate}'
          AND p.tanggal_pendaftaran <= '${endDate}'
          ${alurCondition}
        GROUP BY p.jenis_perkara_id
      `)
    }

    const mapAgg = new Map<number, { total: number; gugatan: number; permohonan: number }>()
    let grandTotal = 0
    let grandGugatan = 0
    let grandPermohonan = 0

    perkaraAgg.forEach(r => {
      const jId = Number(r.jenis_perkara_id)
      const tot = Number(r.total || 0)
      const gug = Number(r.gugatan || 0)
      const perm = Number(r.permohonan || 0)
      mapAgg.set(jId, { total: tot, gugatan: gug, permohonan: perm })
      grandTotal += tot
      grandGugatan += gug
      grandPermohonan += perm
    })

    let items = masterJenis.map(j => {
      const id = Number(j.id)
      const agg = mapAgg.get(id) || { total: 0, gugatan: 0, permohonan: 0 }
      const persentase = grandTotal > 0 ? Number(((agg.total / grandTotal) * 100).toFixed(1)) : 0

      return {
        id,
        nama: j.nama,
        gugatan: agg.gugatan,
        permohonan: agg.permohonan,
        total: agg.total,
        persentase
      }
    })

    // Urutkan default berdasarkan total terbanyak
    items.sort((a, b) => {
      if (sort === 'id') {
        return order === 'asc' ? a.id - b.id : b.id - a.id
      }
      if (sort === 'nama') {
        return order === 'asc' ? a.nama.localeCompare(b.nama) : b.nama.localeCompare(a.nama)
      }
      // default: total desc, id asc
      if (b.total !== a.total) {
        return order === 'asc' ? a.total - b.total : b.total - a.total
      }
      return a.id - b.id
    })

    // Beri nomor peringkat setelah sorting
    const rankedItems = items.map((item, idx) => ({
      ...item,
      peringkat: idx + 1
    }))

    return serializeBigInt({
      success: true,
      year,
      totalJenis: masterJenis.length,
      grandTotal,
      grandGugatan,
      grandPermohonan,
      items: rankedItems
    })
  } catch (error: any) {
    console.error('Error in /api/geografi/jenis/tabel:', error)
    return serializeBigInt({
      success: false,
      year,
      totalJenis: 30,
      grandTotal: 0,
      grandGugatan: 0,
      grandPermohonan: 0,
      items: [],
      error: error.message
    })
  }
})
