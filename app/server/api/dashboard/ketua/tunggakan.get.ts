import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear

  try {
    const daftarTunggakan = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        p.perkara_id,
        p.nomor_perkara,
        p.tanggal_pendaftaran,
        p.jenis_perkara_nama,
        DATEDIFF(CURDATE(), p.tanggal_pendaftaran) AS usia_hari,
        pt.majelis_hakim_nama,
        p.proses_terakhir_text
      FROM perkara p
      LEFT JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
      LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
      WHERE pp.tanggal_putusan IS NULL
        AND p.tanggal_pendaftaran <= DATE_SUB(CURDATE(), INTERVAL 91 DAY)
        AND p.tanggal_pendaftaran >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
      ORDER BY p.tanggal_pendaftaran ASC
      LIMIT 15
    `)

    return serializeBigInt({
      success: true,
      year,
      daftar: daftarTunggakan
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat daftar perkara tunggakan'
    }
  }
})
