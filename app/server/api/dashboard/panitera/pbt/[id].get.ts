import { defineEventHandler, getQuery, getRouterParam } from 'h3'
import { prisma, serializeBigInt } from '../../../../utils/db'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const jspId = idParam && !isNaN(Number(idParam)) ? Number(idParam) : null
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const page = query.page && !isNaN(Number(query.page)) && Number(query.page) > 0 ? Number(query.page) : 1
  const limit = query.limit && !isNaN(Number(query.limit)) && Number(query.limit) > 0 ? Math.min(100, Number(query.limit)) : 10
  const offset = (page - 1) * limit
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  if (!jspId) {
    return {
      success: false,
      message: 'ID Jurusita tidak valid'
    }
  }

  try {
    // 1. Ambil nama jurusita
    const jspRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, nama_gelar, nip
      FROM jurusita
      WHERE id = ${jspId}
      LIMIT 1
    `)

    const jspNama = jspRes.length > 0 ? jspRes[0].nama_gelar : '-'

    // 2. Query total count dan daftar perkara secara paralel
    const [countRes, daftarPerkara] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(p.perkara_id) AS total
        FROM perkara p
        JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
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
          AND COALESCE(
            (
              SELECT pj.jurusita_id
              FROM perkara_jurusita pj
              WHERE pj.perkara_id = p.perkara_id AND pj.aktif = 'Y'
              ORDER BY pj.urutan DESC
              LIMIT 1
            ),
            pt.jurusita_id
          ) = ${jspId}
      `),

      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.para_pihak,
          pp.tanggal_putusan,
          pp.status_putusan_nama
        FROM perkara p
        JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
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
          AND COALESCE(
            (
              SELECT pj.jurusita_id
              FROM perkara_jurusita pj
              WHERE pj.perkara_id = p.perkara_id AND pj.aktif = 'Y'
              ORDER BY pj.urutan DESC
              LIMIT 1
            ),
            pt.jurusita_id
          ) = ${jspId}
        ORDER BY pp.tanggal_putusan DESC
        LIMIT ${limit} OFFSET ${offset}
      `)
    ])

    const total = Number(countRes[0]?.total || 0)

    return serializeBigInt({
      success: true,
      jspId,
      jspNama,
      year,
      page,
      limit,
      total,
      daftar: daftarPerkara
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil rincian perkara belum PBT'
    }
  }
})
