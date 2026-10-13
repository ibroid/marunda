import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  try {
    const [jspQuery, pbtJspQuery] = await Promise.all([
      // Kinerja & Beban Tugas Jurusita (JSP)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          j.id AS jsp_id,
          j.nama_gelar AS nama,
          COUNT(pt.perkara_id) AS total_tugas
        FROM perkara p
        JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        JOIN jurusita j ON j.id = pt.jurusita_id
        WHERE p.tanggal_pendaftaran >= '${startDate}' AND p.tanggal_pendaftaran <= '${endDate}'
        GROUP BY j.id, j.nama_gelar
        ORDER BY total_tugas DESC
      `),

      // Tunggakan PBT Belum Dilaksanakan per Jurusita
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COALESCE(
            (
              SELECT pj.jurusita_id
              FROM perkara_jurusita pj
              WHERE pj.perkara_id = p.perkara_id AND pj.aktif = 'Y'
              ORDER BY pj.urutan DESC
              LIMIT 1
            ),
            pt.jurusita_id
          ) AS jsp_id,
          COUNT(p.perkara_id) AS total_belum_pbt
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
        GROUP BY jsp_id
      `)
    ])

    const pbtMap = new Map<string, number>()
    for (const item of pbtJspQuery) {
      if (item.jsp_id) {
        pbtMap.set(String(item.jsp_id), Number(item.total_belum_pbt || 0))
      }
    }

    const kinerjaJSP = jspQuery.map((item) => {
      const belumPbt = pbtMap.get(String(item.jsp_id)) || 0
      return {
        id: item.jsp_id,
        nama: item.nama || '-',
        totalTugas: Number(item.total_tugas || 0),
        belumPbt
      }
    })

    return serializeBigInt({
      success: true,
      year,
      kinerjaJSP
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil kinerja Jurusita'
    }
  }
})
