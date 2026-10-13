import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const month = query.month !== undefined ? Number(query.month) : NaN
  const year = Number(query.year)

  if (isNaN(month) || month < 0 || month > 12 || !year || isNaN(year)) {
    return {
      success: false,
      message: 'Parameter bulan (0 untuk semua bulan, 1-12) dan tahun wajib diisi'
    }
  }

  try {
    let dateFilter = ''
    let startDate = ''
    let endDate = ''

    if (month === 0) {
      // 1 Tahun Penuh
      startDate = `${year}-01-01`
      endDate = `${year}-12-31`
      dateFilter = `p.tanggal_pendaftaran >= '${startDate}' AND p.tanggal_pendaftaran <= '${endDate}'`
    } else {
      // 1 Bulan Tertentu
      const padMonth = String(month).padStart(2, '0')
      const lastDay = new Date(year, month, 0).getDate()
      startDate = `${year}-${padMonth}-01`
      endDate = `${year}-${padMonth}-${String(lastDay).padStart(2, '0')}`
      dateFilter = `p.tanggal_pendaftaran >= '${startDate}' AND p.tanggal_pendaftaran <= '${endDate}'`
    }

    const summaryRaw = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(p.perkara_id) AS total_perkara,
        SUM(CASE WHEN (
          (pp.sk_penetapan_majelis_hakim_dok IS NOT NULL AND pp.sk_penetapan_majelis_hakim_dok != '')
          OR (SELECT COUNT(id) FROM perkara_dokumen_penetapan pdp WHERE pdp.perkara_id = p.perkara_id AND pdp.jenis_dokumen_id = 1 AND pdp.dokumen IS NOT NULL AND pdp.dokumen != '') > 0
        ) THEN 0 ELSE 1 END) AS belum_pmh,
        SUM(CASE WHEN (
          (pp.sk_penetapan_panitera_pengganti_dok IS NOT NULL AND pp.sk_penetapan_panitera_pengganti_dok != '')
          OR (SELECT COUNT(id) FROM perkara_dokumen_penetapan pdp WHERE pdp.perkara_id = p.perkara_id AND pdp.jenis_dokumen_id = 2 AND pdp.dokumen IS NOT NULL AND pdp.dokumen != '') > 0
        ) THEN 0 ELSE 1 END) AS belum_ppp,
        SUM(CASE WHEN (
          (pp.sk_penetapan_jurusita_dok IS NOT NULL AND pp.sk_penetapan_jurusita_dok != '')
          OR (SELECT COUNT(id) FROM perkara_dokumen_penetapan pdp WHERE pdp.perkara_id = p.perkara_id AND pdp.jenis_dokumen_id = 3 AND pdp.dokumen IS NOT NULL AND pdp.dokumen != '') > 0
        ) THEN 0 ELSE 1 END) AS belum_pjs,
        SUM(CASE WHEN (
          ((pp.sk_penetapan_majelis_hakim_dok IS NOT NULL AND pp.sk_penetapan_majelis_hakim_dok != '') OR (SELECT COUNT(id) FROM perkara_dokumen_penetapan pdp WHERE pdp.perkara_id = p.perkara_id AND pdp.jenis_dokumen_id = 1 AND pdp.dokumen IS NOT NULL AND pdp.dokumen != '') > 0)
          AND
          ((pp.sk_penetapan_panitera_pengganti_dok IS NOT NULL AND pp.sk_penetapan_panitera_pengganti_dok != '') OR (SELECT COUNT(id) FROM perkara_dokumen_penetapan pdp WHERE pdp.perkara_id = p.perkara_id AND pdp.jenis_dokumen_id = 2 AND pdp.dokumen IS NOT NULL AND pdp.dokumen != '') > 0)
          AND
          ((pp.sk_penetapan_jurusita_dok IS NOT NULL AND pp.sk_penetapan_jurusita_dok != '') OR (SELECT COUNT(id) FROM perkara_dokumen_penetapan pdp WHERE pdp.perkara_id = p.perkara_id AND pdp.jenis_dokumen_id = 3 AND pdp.dokumen IS NOT NULL AND pdp.dokumen != '') > 0)
        ) THEN 1 ELSE 0 END) AS sudah_lengkap
      FROM perkara p
      LEFT JOIN perkara_penetapan pp ON p.perkara_id = pp.perkara_id
      WHERE ${dateFilter}
    `)

    const row = summaryRaw[0] || {}
    const totalPerkara = Number(row.total_perkara || 0)
    const belumPmh = Number(row.belum_pmh || 0)
    const belumPpp = Number(row.belum_ppp || 0)
    const belumPjs = Number(row.belum_pjs || 0)
    const sudahLengkap = Number(row.sudah_lengkap || 0)
    const semuaBelum = Math.max(0, totalPerkara - sudahLengkap)
    const persenLengkap = totalPerkara > 0 ? Math.round((sudahLengkap / totalPerkara) * 100) : 100

    return serializeBigInt({
      success: true,
      month,
      year,
      startDate,
      endDate,
      isFullYear: month === 0,
      summary: {
        totalPerkara,
        belumPmh,
        belumPpp,
        belumPjs,
        semuaBelum,
        sudahLengkap,
        persenLengkap
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat ringkasan audit berkas penetapan'
    }
  }
})
