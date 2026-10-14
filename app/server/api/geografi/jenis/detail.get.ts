import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const jenisId = query.jenis_perkara_id ? Number(query.jenis_perkara_id) : null
  const pihakType = (query.pihak_type as string) || 'pihak1'
  const alur = (query.alur as string) || 'all'
  const kecamatan = ((query.kecamatan as string) || '').trim()
  const search = ((query.search as string) || '').trim()
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10))
  const offset = (page - 1) * limit

  // Validasi: hanya fetch jika jenis_perkara_id diberikan
  if (!jenisId || isNaN(jenisId)) {
    return serializeBigInt({
      success: true,
      year,
      page: 1,
      limit,
      total: 0,
      totalPages: 0,
      items: [],
      message: 'Pilih jenis perkara untuk melihat detail'
    })
  }

  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31 23:59:59`
  const tablePihak = pihakType === 'pihak2' ? 'perkara_pihak2' : 'perkara_pihak1'

  let alurCondition = ''
  if (alur === '15') {
    alurCondition = 'AND p.alur_perkara_id = 15'
  } else if (alur === '16') {
    alurCondition = 'AND p.alur_perkara_id = 16'
  }

  let searchCondition = ''
  if (search) {
    const safeSearch = search.replace(/['"\\]/g, '')
    searchCondition = `AND (p.nomor_perkara LIKE '%${safeSearch}%' OR p.para_pihak LIKE '%${safeSearch}%')`
  }

  try {
    let countRes: any[] = []
    let rows: any[] = []

    if (kecamatan) {
      const safeKec = kecamatan.replace(/['"\\]/g, '')
      const kecConditions = `
        p.jenis_perkara_id = ${jenisId}
        AND p.tanggal_pendaftaran >= '${startDate}'
        AND p.tanggal_pendaftaran <= '${endDate}'
        ${alurCondition}
        ${searchCondition}
        AND pp.urutan = 1
        AND (rk.kabupaten_kode IN ('31.72', '31.01') OR rk.kecamatan_kode LIKE '31.72%' OR rk.kecamatan_kode LIKE '31.01%')
        AND (
          rk.kecamatan_kode = '${safeKec}'
          OR rk.kecamatan_nama = '${safeKec}'
          OR TRIM(TRAILING '.' FROM rk.kecamatan_nama) = '${safeKec}'
          OR ph.kecamatan = '${safeKec}'
          OR ph.kecamatan LIKE CONCAT('%', '${safeKec}', '%')
        )
      `

      const [cRes, rRows] = await Promise.all([
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(DISTINCT p.perkara_id) AS total
          FROM perkara p
          JOIN ${tablePihak} pp ON pp.perkara_id = p.perkara_id
          JOIN pihak ph ON ph.id = pp.pihak_id
          JOIN ref_kecamatan_new rk ON (
            rk.kecamatan_kode = ph.kecamatan
            OR rk.kecamatan_nama = ph.kecamatan
            OR TRIM(TRAILING '.' FROM rk.kecamatan_nama) = ph.kecamatan
            OR ph.kecamatan LIKE CONCAT('%', TRIM(TRAILING '.' FROM rk.kecamatan_nama), '%')
          )
          WHERE ${kecConditions}
        `),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT
            p.perkara_id,
            p.nomor_perkara,
            p.jenis_perkara_id,
            COALESCE(jp.nama, p.jenis_perkara_nama) AS jenis_perkara_nama,
            p.alur_perkara_id,
            DATE_FORMAT(p.tanggal_pendaftaran, '%Y-%m-%d') AS tanggal_pendaftaran,
            p.proses_terakhir_text,
            p.tahapan_terakhir_text,
            p.para_pihak,
            ph.nama AS pihak_nama,
            ph.alamat AS pihak_alamat,
            ph.kecamatan AS pihak_kecamatan_raw,
            ph.kelurahan AS pihak_kelurahan_raw,
            TRIM(TRAILING '.' FROM rk.kecamatan_nama) AS kecamatan_nama
          FROM perkara p
          LEFT JOIN jenis_perkara jp ON jp.id = p.jenis_perkara_id
          JOIN ${tablePihak} pp ON pp.perkara_id = p.perkara_id
          JOIN pihak ph ON ph.id = pp.pihak_id
          JOIN ref_kecamatan_new rk ON (
            rk.kecamatan_kode = ph.kecamatan
            OR rk.kecamatan_nama = ph.kecamatan
            OR TRIM(TRAILING '.' FROM rk.kecamatan_nama) = ph.kecamatan
            OR ph.kecamatan LIKE CONCAT('%', TRIM(TRAILING '.' FROM rk.kecamatan_nama), '%')
          )
          WHERE ${kecConditions}
          ORDER BY p.tanggal_pendaftaran DESC, p.perkara_id DESC
          LIMIT ${limit} OFFSET ${offset}
        `)
      ])
      countRes = cRes
      rows = rRows
    } else {
      const baseConditions = `
        p.jenis_perkara_id = ${jenisId}
        AND p.tanggal_pendaftaran >= '${startDate}'
        AND p.tanggal_pendaftaran <= '${endDate}'
        ${alurCondition}
        ${searchCondition}
      `

      const [cRes, rRows] = await Promise.all([
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(*) AS total
          FROM perkara p
          WHERE ${baseConditions}
        `),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT
            p.perkara_id,
            p.nomor_perkara,
            p.jenis_perkara_id,
            COALESCE(jp.nama, p.jenis_perkara_nama) AS jenis_perkara_nama,
            p.alur_perkara_id,
            DATE_FORMAT(p.tanggal_pendaftaran, '%Y-%m-%d') AS tanggal_pendaftaran,
            p.proses_terakhir_text,
            p.tahapan_terakhir_text,
            p.para_pihak
          FROM perkara p
          LEFT JOIN jenis_perkara jp ON jp.id = p.jenis_perkara_id
          WHERE ${baseConditions}
          ORDER BY p.tanggal_pendaftaran DESC, p.perkara_id DESC
          LIMIT ${limit} OFFSET ${offset}
        `)
      ])
      countRes = cRes
      rows = rRows

      // Ambil detail pihak hanya untuk 10 baris terpilih
      const pIds = rows.map(r => r.perkara_id)
      if (pIds.length > 0) {
        const pihakRows = await prisma.$queryRawUnsafe<any[]>(`
          SELECT pp.perkara_id, ph.nama, ph.alamat, ph.kecamatan, ph.kelurahan
          FROM ${tablePihak} pp
          JOIN pihak ph ON ph.id = pp.pihak_id
          WHERE pp.perkara_id IN (${pIds.join(',')}) AND pp.urutan = 1
        `)
        const pihakMap = new Map<string, any>()
        pihakRows.forEach(ph => pihakMap.set(String(ph.perkara_id), ph))

        rows = rows.map(r => {
          const ph = pihakMap.get(String(r.perkara_id)) || {}
          return {
            ...r,
            pihak_nama: ph.nama || '-',
            pihak_alamat: ph.alamat || '-',
            pihak_kecamatan_raw: ph.kecamatan || '-',
            pihak_kelurahan_raw: ph.kelurahan || '-'
          }
        })
      }
    }

    const total = Number(countRes[0]?.total || 0)
    const totalPages = Math.ceil(total / limit)

    // Lookup nama kelurahan & kecamatan jika ada kodenya
    const kelKodeSet = new Set<string>()
    const kecKodeSet = new Set<string>()

    rows.forEach(r => {
      if (r.pihak_kelurahan_raw && r.pihak_kelurahan_raw !== '-') {
        kelKodeSet.add(r.pihak_kelurahan_raw)
      }
      if (r.pihak_kecamatan_raw && r.pihak_kecamatan_raw !== '-') {
        kecKodeSet.add(r.pihak_kecamatan_raw)
      }
    })

    const kelMap = new Map<string, string>()
    const kecMap = new Map<string, string>()

    if (kelKodeSet.size > 0) {
      const safeKodes = Array.from(kelKodeSet).map(k => `'${k.replace(/['"\\]/g, '')}'`).join(',')
      const kelDb = await prisma.$queryRawUnsafe<any[]>(
        `SELECT kelurahan_kode, TRIM(TRAILING '.' FROM kelurahan_nama) AS nama FROM ref_kelurahan_new WHERE kelurahan_kode IN (${safeKodes})`
      ).catch(() => [])
      kelDb.forEach(k => kelMap.set(k.kelurahan_kode, k.nama))
    }

    if (kecKodeSet.size > 0) {
      const safeKodes = Array.from(kecKodeSet).map(k => `'${k.replace(/['"\\]/g, '')}'`).join(',')
      const kecDb = await prisma.$queryRawUnsafe<any[]>(
        `SELECT kecamatan_kode, TRIM(TRAILING '.' FROM kecamatan_nama) AS nama FROM ref_kecamatan_new WHERE kecamatan_kode IN (${safeKodes})`
      ).catch(() => [])
      kecDb.forEach(k => kecMap.set(k.kecamatan_kode, k.nama))
    }

    const items = rows.map(r => {
      const rawKec = r.pihak_kecamatan_raw || ''
      const rawKel = r.pihak_kelurahan_raw || ''
      const resolvedKec = r.kecamatan_nama || kecMap.get(rawKec) || rawKec || '-'
      const resolvedKel = kelMap.get(rawKel) || rawKel || '-'

      return {
        perkara_id: r.perkara_id,
        nomor_perkara: r.nomor_perkara,
        jenis_perkara_id: r.jenis_perkara_id,
        jenis_perkara_nama: r.jenis_perkara_nama,
        alur_perkara_id: r.alur_perkara_id,
        alur_nama: Number(r.alur_perkara_id) === 15 ? 'Gugatan' : 'Permohonan',
        tanggal_pendaftaran: r.tanggal_pendaftaran,
        proses_terakhir_text: r.proses_terakhir_text || '-',
        tahapan_terakhir_text: r.tahapan_terakhir_text || '-',
        para_pihak: r.para_pihak,
        pihak_nama: r.pihak_nama || '-',
        pihak_alamat: r.pihak_alamat || '-',
        kecamatan_nama: resolvedKec,
        kelurahan_nama: resolvedKel
      }
    })

    return serializeBigInt({
      success: true,
      year,
      page,
      limit,
      total,
      totalPages,
      items
    })
  } catch (error: any) {
    console.error('Error in /api/geografi/jenis/detail:', error)
    return serializeBigInt({
      success: false,
      year,
      page: 1,
      limit,
      total: 0,
      totalPages: 0,
      items: [],
      error: error.message
    })
  }
})
