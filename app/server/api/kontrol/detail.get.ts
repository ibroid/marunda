import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const kategori = (query.kategori as string) || 'belum_pmh'

  try {
    let detailPerkara: any[] = []

    if (kategori === 'belum_pmh') {
      detailPerkara = await prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, p.tanggal_pendaftaran, p.jenis_perkara_nama, p.para_pihak
        FROM perkara p
        LEFT JOIN perkara_penetapan pp ON p.perkara_id = pp.perkara_id
        WHERE YEAR(p.tanggal_pendaftaran) = ${year}
          AND (pp.penetapan_majelis_hakim IS NULL OR pp.penetapan_majelis_hakim = '')
        ORDER BY p.tanggal_pendaftaran DESC LIMIT 50
      `)
    } else if (kategori === 'belum_pp') {
      detailPerkara = await prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, p.tanggal_pendaftaran, p.jenis_perkara_nama, p.para_pihak
        FROM perkara p
        LEFT JOIN perkara_penetapan pp ON p.perkara_id = pp.perkara_id
        WHERE YEAR(p.tanggal_pendaftaran) = ${year}
          AND (pp.panitera_pengganti_id IS NULL OR pp.panitera_pengganti_id = 0)
        ORDER BY p.tanggal_pendaftaran DESC LIMIT 50
      `)
    } else if (kategori === 'belum_jsp') {
      detailPerkara = await prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, p.tanggal_pendaftaran, p.jenis_perkara_nama, p.para_pihak
        FROM perkara p
        LEFT JOIN perkara_penetapan pp ON p.perkara_id = pp.perkara_id
        WHERE YEAR(p.tanggal_pendaftaran) = ${year}
          AND (pp.jurusita_id IS NULL OR pp.jurusita_id = 0)
        ORDER BY p.tanggal_pendaftaran DESC LIMIT 50
      `)
    } else if (kategori === 'belum_phs') {
      detailPerkara = await prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, p.tanggal_pendaftaran, p.jenis_perkara_nama, p.para_pihak
        FROM perkara p
        LEFT JOIN perkara_penetapan pp ON p.perkara_id = pp.perkara_id
        WHERE YEAR(p.tanggal_pendaftaran) = ${year}
          AND (pp.penetapan_hari_sidang IS NULL OR pp.penetapan_hari_sidang = '')
        ORDER BY p.tanggal_pendaftaran DESC LIMIT 50
      `)
    } else if (kategori === 'tunggakan_5bulan') {
      detailPerkara = await prisma.$queryRawUnsafe<any[]>(`
        SELECT p.perkara_id, p.nomor_perkara, p.tanggal_pendaftaran, p.jenis_perkara_nama,
               DATEDIFF(CURDATE(), p.tanggal_pendaftaran) AS usia_hari,
               p.proses_terakhir_text
        FROM perkara p
        LEFT JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan IS NULL
          AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) > 150
        ORDER BY p.tanggal_pendaftaran ASC LIMIT 50
      `)
    }

    return serializeBigInt({
      success: true,
      year,
      kategori,
      detail: detailPerkara
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat detail perkara audit alur perkara'
    }
  }
})
