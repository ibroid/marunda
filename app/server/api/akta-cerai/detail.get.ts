import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const kategori = (query.kategori as string) || 'cg_belum_ac'

  try {
    let detailQuery = ''
    if (kategori === 'ct_belum_ikrar') {
      detailQuery = `
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.para_pihak,
          pp.tanggal_putusan,
          pp.tanggal_bht,
          it.penetapan_majelis_hakim AS tgl_pmh_ikrar,
          it.tanggal_penetapan_sidang_ikrar AS tgl_sidang_ikrar,
          it.tgl_ikrar_talak
        FROM perkara p
        JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        LEFT JOIN perkara_ikrar_talak it ON it.perkara_id = p.perkara_id
        WHERE p.jenis_perkara_id = 346
          AND pp.tanggal_bht IS NOT NULL
          AND (it.tgl_ikrar_talak IS NULL)
          AND YEAR(pp.tanggal_bht) = ${year}
        ORDER BY pp.tanggal_bht DESC
        LIMIT 100
      `
    } else if (kategori === 'belum_diambil') {
      detailQuery = `
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.para_pihak,
          ac.nomor_akta_cerai,
          ac.no_seri_akta_cerai,
          ac.tgl_akta_cerai,
          ac.tgl_penyerahan_akta_cerai AS tgl_ambil_p1,
          ac.tgl_penyerahan_akta_cerai_pihak2 AS tgl_ambil_p2
        FROM perkara_akta_cerai ac
        JOIN perkara p ON p.perkara_id = ac.perkara_id
        WHERE ac.tgl_akta_cerai IS NOT NULL
          AND (ac.tgl_penyerahan_akta_cerai IS NULL OR ac.tgl_penyerahan_akta_cerai_pihak2 IS NULL)
          AND YEAR(ac.tgl_akta_cerai) = ${year}
        ORDER BY ac.tgl_akta_cerai DESC
        LIMIT 100
      `
    } else {
      // Default: cg_belum_ac
      detailQuery = `
        SELECT
          p.perkara_id,
          p.nomor_perkara,
          p.para_pihak,
          pp.tanggal_putusan,
          pp.tanggal_bht,
          ac.nomor_akta_cerai,
          ac.tgl_akta_cerai
        FROM perkara p
        JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        LEFT JOIN perkara_akta_cerai ac ON ac.perkara_id = p.perkara_id
        WHERE p.jenis_perkara_id = 347
          AND pp.tanggal_bht IS NOT NULL
          AND (ac.tgl_akta_cerai IS NULL OR ac.nomor_akta_cerai IS NULL)
          AND YEAR(pp.tanggal_bht) = ${year}
        ORDER BY pp.tanggal_bht DESC
        LIMIT 100
      `
    }

    const detailList = await prisma.$queryRawUnsafe<any[]>(detailQuery)

    return serializeBigInt({
      success: true,
      year,
      kategori,
      detail: detailList
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat memuat detail perkara akta cerai'
    }
  }
})
