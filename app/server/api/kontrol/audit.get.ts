import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const kategori = (query.kategori as string) || 'ringkasan'

  try {
    // 1. Ringkasan Count Audit
    const auditCounts = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        -- Perkara Baru Belum Lengkap Penetapan
        (SELECT COUNT(p.perkara_id)
         FROM perkara p
         LEFT JOIN perkara_penetapan pp ON p.perkara_id = pp.perkara_id
         WHERE YEAR(p.tanggal_pendaftaran) = ${year}
           AND (pp.penetapan_majelis_hakim IS NULL OR pp.penetapan_majelis_hakim = '')
        ) AS belum_pmh,

        (SELECT COUNT(p.perkara_id)
         FROM perkara p
         LEFT JOIN perkara_penetapan pp ON p.perkara_id = pp.perkara_id
         WHERE YEAR(p.tanggal_pendaftaran) = ${year}
           AND (pp.panitera_pengganti_id IS NULL OR pp.panitera_pengganti_id = 0)
        ) AS belum_pp,

        (SELECT COUNT(p.perkara_id)
         FROM perkara p
         LEFT JOIN perkara_penetapan pp ON p.perkara_id = pp.perkara_id
         WHERE YEAR(p.tanggal_pendaftaran) = ${year}
           AND (pp.jurusita_id IS NULL OR pp.jurusita_id = 0)
        ) AS belum_jsp,

        (SELECT COUNT(p.perkara_id)
         FROM perkara p
         LEFT JOIN perkara_penetapan pp ON p.perkara_id = pp.perkara_id
         WHERE YEAR(p.tanggal_pendaftaran) = ${year}
           AND (pp.penetapan_hari_sidang IS NULL OR pp.penetapan_hari_sidang = '')
        ) AS belum_phs,

        -- Tunggakan Usia Perkara Belum Putus
        (SELECT COUNT(p.perkara_id)
         FROM perkara p
         LEFT JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
         WHERE pp.tanggal_putusan IS NULL
           AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) > 120
        ) AS tunggakan_4bulan,

        (SELECT COUNT(p.perkara_id)
         FROM perkara p
         LEFT JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
         WHERE pp.tanggal_putusan IS NULL
           AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) > 150
        ) AS tunggakan_5bulan,

        (SELECT COUNT(p.perkara_id)
         FROM perkara p
         LEFT JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
         WHERE pp.tanggal_putusan IS NULL
           AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) > 180
        ) AS tunggakan_6bulan,

        (SELECT COUNT(p.perkara_id)
         FROM perkara p
         LEFT JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
         WHERE pp.tanggal_putusan IS NULL
           AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) > 365
        ) AS tunggakan_12bulan,

        -- Pasca Putus
        (SELECT COUNT(p.perkara_id)
         FROM perkara p
         JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
         WHERE YEAR(pp.tanggal_putusan) = ${year}
           AND (pp.amar_putusan IS NULL OR pp.amar_putusan = '')
        ) AS amar_belum_isi,

        (SELECT COUNT(p.perkara_id)
         FROM perkara p
         JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
         WHERE YEAR(pp.tanggal_putusan) = ${year}
           AND (pp.tanggal_bht IS NULL OR pp.tanggal_bht = '0000-00-00' OR pp.tanggal_bht = '')
        ) AS putus_belum_bht
    `)

    const counts = auditCounts[0] || {}

    // 2. Jika request detail untuk kategori tertentu
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
      counts: {
        belumPmh: Number(counts.belum_pmh || 0),
        belumPp: Number(counts.belum_pp || 0),
        belumJsp: Number(counts.belum_jsp || 0),
        belumPhs: Number(counts.belum_phs || 0),
        tunggakan4Bulan: Number(counts.tunggakan_4bulan || 0),
        tunggakan5Bulan: Number(counts.tunggakan_5bulan || 0),
        tunggakan6Bulan: Number(counts.tunggakan_6bulan || 0),
        tunggakan12Bulan: Number(counts.tunggakan_12bulan || 0),
        amarBelumIsi: Number(counts.amar_belum_isi || 0),
        putusBelumBht: Number(counts.putus_belum_bht || 0)
      },
      kategori,
      detail: detailPerkara
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil data kontrol audit'
    }
  }
})
