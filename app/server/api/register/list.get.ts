import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const jenis = (query.jenis as string) || 'gugatan'
  const search = (query.search as string) || ''

  try {
    let whereClause = `YEAR(p.tanggal_pendaftaran) = ${year}`

    if (jenis === 'gugatan') {
      whereClause += ` AND p.alur_perkara_id = 15`
    } else if (jenis === 'permohonan') {
      whereClause += ` AND p.alur_perkara_id = 16`
    } else if (jenis === 'prodeo') {
      whereClause += ` AND p.prodeo = 1`
    }

    if (search) {
      whereClause += ` AND (p.nomor_perkara LIKE '%${search}%' OR p.para_pihak LIKE '%${search}%')`
    }

    const cases = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        p.perkara_id,
        p.nomor_perkara,
        p.tanggal_pendaftaran,
        p.jenis_perkara_nama,
        p.para_pihak,
        p.proses_terakhir_text,
        pp.tanggal_putusan,
        pp.tanggal_minutasi,
        pp.tanggal_bht,
        pp.status_putusan_id
      FROM perkara p
      LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
      WHERE ${whereClause}
      ORDER BY p.tanggal_pendaftaran DESC, p.perkara_id DESC
      LIMIT 100
    `)

    // Hitung total untuk register ini
    const totalCountRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(p.perkara_id) AS total
      FROM perkara p
      WHERE ${whereClause}
    `)
    const total = Number(totalCountRes[0]?.total || 0)

    return serializeBigInt({
      success: true,
      year,
      jenis,
      total,
      data: cases
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat memuat register perkara'
    }
  }
})
