import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const pihakType = (query.pihak_type as string) || 'pihak1'
  const alur = (query.alur as string) || 'all'
  const kecamatan = ((query.kecamatan as string) || '').trim()

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
    let perkaraAgg: any[] = []

    const [satkerRes, masterJenis] = await Promise.all([
      // 1. Ambil Nama Satker
      prisma.$queryRawUnsafe<any[]>(
        `SELECT value FROM sys_config WHERE id = 62 OR name = 'NamaPN' LIMIT 1`
      ),
      // 2. Ambil master jenis perkara Pengadilan Agama (ID 341 s/d 371)
      prisma.$queryRawUnsafe<any[]>(
        `SELECT id, nama FROM jenis_perkara WHERE id BETWEEN 341 AND 371 ORDER BY id ASC`
      )
    ])

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

    const namaSatker = satkerRes.length > 0 ? satkerRes[0].value : 'PENGADILAN AGAMA JAKARTA UTARA'
    const masterMap = new Map<number, string>()
    masterJenis.forEach(j => masterMap.set(Number(j.id), j.nama))

    let totalPerkara = 0
    let totalGugatan = 0
    let totalPermohonan = 0
    let jenisAktifCount = 0

    let topJenis: { id: number; nama: string; total: number; persentase: number } | null = null
    let maxTotal = 0

    let topGugatan: { id: number; nama: string; total: number } | null = null
    let maxGugatan = 0

    let topPermohonan: { id: number; nama: string; total: number } | null = null
    let maxPermohonan = 0

    perkaraAgg.forEach(r => {
      const jId = Number(r.jenis_perkara_id)
      const tot = Number(r.total || 0)
      const gug = Number(r.gugatan || 0)
      const perm = Number(r.permohonan || 0)
      const nama = masterMap.get(jId) || 'Lain-Lain'

      totalPerkara += tot
      totalGugatan += gug
      totalPermohonan += perm

      if (tot > 0) {
        jenisAktifCount++
      }

      if (tot > maxTotal) {
        maxTotal = tot
        topJenis = { id: jId, nama, total: tot, persentase: 0 }
      }

      if (gug > maxGugatan) {
        maxGugatan = gug
        topGugatan = { id: jId, nama, total: gug }
      }

      if (perm > maxPermohonan) {
        maxPermohonan = perm
        topPermohonan = { id: jId, nama, total: perm }
      }
    })

    if (topJenis && totalPerkara > 0) {
      topJenis.persentase = Number(((topJenis.total / totalPerkara) * 100).toFixed(1))
    }

    const persenGugatan = totalPerkara > 0 ? Number(((totalGugatan / totalPerkara) * 100).toFixed(1)) : 0
    const persenPermohonan = totalPerkara > 0 ? Number(((totalPermohonan / totalPerkara) * 100).toFixed(1)) : 0

    return serializeBigInt({
      success: true,
      year,
      namaSatker,
      totalPerkara,
      totalGugatan,
      totalPermohonan,
      persenGugatan,
      persenPermohonan,
      totalJenisTerdaftar: masterJenis.length,
      totalJenisAktif: jenisAktifCount,
      topJenis,
      topGugatan,
      topPermohonan
    })
  } catch (error: any) {
    console.error('Error in /api/geografi/jenis/summary:', error)
    return serializeBigInt({
      success: false,
      year,
      namaSatker: 'PENGADILAN AGAMA JAKARTA UTARA',
      totalPerkara: 0,
      totalGugatan: 0,
      totalPermohonan: 0,
      persenGugatan: 0,
      persenPermohonan: 0,
      totalJenisTerdaftar: 30,
      totalJenisAktif: 0,
      topJenis: null,
      topGugatan: null,
      topPermohonan: null,
      error: error.message
    })
  }
})
