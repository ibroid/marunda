import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const page = query.page && !isNaN(Number(query.page)) && Number(query.page) > 0 ? Number(query.page) : 1
  const limit = query.limit && !isNaN(Number(query.limit)) && Number(query.limit) > 0 ? Math.min(100, Number(query.limit)) : 10
  const offset = (page - 1) * limit
  const q = typeof query.q === 'string' ? query.q.trim() : ''

  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  try {
    let searchCondition = ''
    if (q) {
      const safeQ = q.replace(/['"\\]/g, '')
      searchCondition = `AND (p.nomor_perkara LIKE '%${safeQ}%' OR p.para_pihak LIKE '%${safeQ}%' OR j.nama_gelar LIKE '%${safeQ}%' OR pt.jurusita_text LIKE '%${safeQ}%')`
    }

    const [countResult, daftar] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(p.perkara_id) AS total
        FROM perkara p
        JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        LEFT JOIN jurusita j ON j.id = COALESCE(
          (
            SELECT pj.jurusita_id
            FROM perkara_jurusita pj
            WHERE pj.perkara_id = p.perkara_id AND pj.aktif = 'Y'
            ORDER BY pj.urutan DESC
            LIMIT 1
          ),
          pt.jurusita_id
        )
        LEFT JOIN perkara_putusan_pemberitahuan_putusan pbt
          ON pbt.perkara_id = p.perkara_id
          AND pbt.pihak = 2
          AND (
            pbt.tanggal_pemberitahuan_putusan IS NOT NULL
            OR (pbt.edoc_pbt IS NOT NULL AND pbt.edoc_pbt != '')
            OR (pbt.edoc_resi IS NOT NULL AND pbt.edoc_resi != '')
          )
        WHERE pp.status_putusan_id = 62
          AND pp.putusan_verstek = 'Y'
          AND (pp.tanggal_bht IS NULL OR pp.tanggal_bht = '' OR pp.tanggal_bht = '0000-00-00')
          AND pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND pbt.id IS NULL
          ${searchCondition}
      `),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.jenis_perkara_nama,
          p.para_pihak,
          pp.tanggal_putusan,
          DATEDIFF(CURDATE(), pp.tanggal_putusan) AS selisih_hari,
          pp.status_putusan_nama,
          COALESCE(j.nama_gelar, pt.jurusita_text, '-') AS jurusita_nama,
          j.id AS jurusita_id
        FROM perkara p
        JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        LEFT JOIN jurusita j ON j.id = COALESCE(
          (
            SELECT pj.jurusita_id
            FROM perkara_jurusita pj
            WHERE pj.perkara_id = p.perkara_id AND pj.aktif = 'Y'
            ORDER BY pj.urutan DESC
            LIMIT 1
          ),
          pt.jurusita_id
        )
        LEFT JOIN perkara_putusan_pemberitahuan_putusan pbt
          ON pbt.perkara_id = p.perkara_id
          AND pbt.pihak = 2
          AND (
            pbt.tanggal_pemberitahuan_putusan IS NOT NULL
            OR (pbt.edoc_pbt IS NOT NULL AND pbt.edoc_pbt != '')
            OR (pbt.edoc_resi IS NOT NULL AND pbt.edoc_resi != '')
          )
        WHERE pp.status_putusan_id = 62
          AND pp.putusan_verstek = 'Y'
          AND (pp.tanggal_bht IS NULL OR pp.tanggal_bht = '' OR pp.tanggal_bht = '0000-00-00')
          AND pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND pbt.id IS NULL
          ${searchCondition}
        ORDER BY pp.tanggal_putusan DESC
        LIMIT ${limit} OFFSET ${offset}
      `)
    ])

    const total = Number(countResult[0]?.total || 0)

    return serializeBigInt({
      success: true,
      year,
      page,
      limit,
      total,
      daftar
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil daftar perkara tunggakan PBT'
    }
  }
})
