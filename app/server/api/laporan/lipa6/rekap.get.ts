import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const month = query.month && !isNaN(Number(query.month)) ? Number(query.month) : currentMonth
  const role = query.role === 'semua' ? 'semua' : 'ketua'

  const monthStr = month < 10 ? `0${month}` : `${month}`
  const periode = `${year}-${monthStr}`
  const awalPeriode = `${periode}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const akhirPeriode = `${periode}-${String(lastDay).padStart(2, '0')}`

  try {
    // 1. Ambil data konfigurasi pengadilan & pejabat
    const sysConfigs = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, value FROM sys_config WHERE id IN (61, 62, 63, 64, 65, 68, 69) OR name IN ('NamaPN', 'KetuaPNNama', 'KetuaPNNIP', 'PanSekNama', 'PanSekNIP')`
    ).catch(() => [])

    let namaSatker = 'PENGADILAN AGAMA JAKARTA UTARA'
    let ketuaNama = 'Dr. Khoiriyah Roihan, S.Ag., M.H.'
    let ketuaNip = '197409261999032001'
    let paniteraNama = 'H. Dede Supriadi, S.H., M.H.'
    let paniteraNip = '197305041998031002'

    for (const cfg of sysConfigs) {
      if (cfg.id === 62 || cfg.name === 'NamaPN') namaSatker = cfg.value || namaSatker
      if (cfg.id === 64 || cfg.name === 'KetuaPNNama') ketuaNama = cfg.value || ketuaNama
      if (cfg.id === 65 || cfg.name === 'KetuaPNNIP') ketuaNip = cfg.value || ketuaNip
      if (cfg.id === 68 || cfg.name === 'PanSekNama') paniteraNama = cfg.value || paniteraNama
      if (cfg.id === 69 || cfg.name === 'PanSekNIP') paniteraNip = cfg.value || paniteraNip
    }

    const kotaSatker = namaSatker
      .replace(/PENGADILAN AGAMA /gi, '')
      .replace(/MAHKAMAH SYAR'IYAH /gi, '')
      .trim()

    // 2. Kueri Tabel LIPA 6 per Hakim
    const joinCondition = role === 'semua'
      ? `FIND_IN_SET(CAST(h.id AS CHAR), pt.majelis_hakim_id) > 0`
      : `CAST(SUBSTRING_INDEX(pt.majelis_hakim_id, ',', 1) AS UNSIGNED) = h.id`

    const rekapSql = `
      SELECT
        h.id AS hakim_id,
        h.nama_gelar AS nama_hakim,
        h.nip,

        -- 1. Sisa bulan lalu (G)
        SUM(CASE WHEN pt.penetapan_majelis_hakim < '${awalPeriode}'
                  AND (pp.tanggal_putusan IS NULL OR pp.tanggal_putusan >= '${awalPeriode}')
                  AND (p.alur_perkara_id IN (15, 17) OR p.nomor_perkara LIKE '%/Pdt.G/%')
                 THEN 1 ELSE 0 END) AS sisa_lalu_g,

        -- 1. Sisa bulan lalu (P)
        SUM(CASE WHEN pt.penetapan_majelis_hakim < '${awalPeriode}'
                  AND (pp.tanggal_putusan IS NULL OR pp.tanggal_putusan >= '${awalPeriode}')
                  AND (p.alur_perkara_id = 16 OR p.nomor_perkara LIKE '%/Pdt.P/%')
                 THEN 1 ELSE 0 END) AS sisa_lalu_p,

        -- 2. Tambah bulan ybs (G)
        SUM(CASE WHEN pt.penetapan_majelis_hakim >= '${awalPeriode}' AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                  AND (p.alur_perkara_id IN (15, 17) OR p.nomor_perkara LIKE '%/Pdt.G/%')
                 THEN 1 ELSE 0 END) AS tambah_g,

        -- 2. Tambah bulan ybs (P)
        SUM(CASE WHEN pt.penetapan_majelis_hakim >= '${awalPeriode}' AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                  AND (p.alur_perkara_id = 16 OR p.nomor_perkara LIKE '%/Pdt.P/%')
                 THEN 1 ELSE 0 END) AS tambah_p,

        -- 4. Diputus (G)
        SUM(CASE WHEN pp.tanggal_putusan >= '${awalPeriode}' AND pp.tanggal_putusan <= '${akhirPeriode}'
                  AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                  AND (p.alur_perkara_id IN (15, 17) OR p.nomor_perkara LIKE '%/Pdt.G/%')
                 THEN 1 ELSE 0 END) AS putus_g,

        -- 4. Diputus (P)
        SUM(CASE WHEN pp.tanggal_putusan >= '${awalPeriode}' AND pp.tanggal_putusan <= '${akhirPeriode}'
                  AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                  AND (p.alur_perkara_id = 16 OR p.nomor_perkara LIKE '%/Pdt.P/%')
                 THEN 1 ELSE 0 END) AS putus_p,

        -- 6. Jumlah yang diminutir (G)
        SUM(CASE WHEN pp.tanggal_minutasi >= '${awalPeriode}' AND pp.tanggal_minutasi <= '${akhirPeriode}'
                  AND pp.tanggal_minutasi != '0000-00-00'
                  AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                  AND (p.alur_perkara_id IN (15, 17) OR p.nomor_perkara LIKE '%/Pdt.G/%')
                 THEN 1 ELSE 0 END) AS minutir_g,

        -- 6. Jumlah yang diminutir (P)
        SUM(CASE WHEN pp.tanggal_minutasi >= '${awalPeriode}' AND pp.tanggal_minutasi <= '${akhirPeriode}'
                  AND pp.tanggal_minutasi != '0000-00-00'
                  AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                  AND (p.alur_perkara_id = 16 OR p.nomor_perkara LIKE '%/Pdt.P/%')
                 THEN 1 ELSE 0 END) AS minutir_p,

        -- 7. Sisa yang belum diminutir (G)
        SUM(CASE WHEN pp.tanggal_putusan IS NOT NULL AND pp.tanggal_putusan <= '${akhirPeriode}'
                  AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi > '${akhirPeriode}')
                  AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                  AND (p.alur_perkara_id IN (15, 17) OR p.nomor_perkara LIKE '%/Pdt.G/%')
                 THEN 1 ELSE 0 END) AS belum_minutir_g,

        -- 7. Sisa yang belum diminutir (P)
        SUM(CASE WHEN pp.tanggal_putusan IS NOT NULL AND pp.tanggal_putusan <= '${akhirPeriode}'
                  AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi > '${akhirPeriode}')
                  AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                  AND (p.alur_perkara_id = 16 OR p.nomor_perkara LIKE '%/Pdt.P/%')
                 THEN 1 ELSE 0 END) AS belum_minutir_p

      FROM hakim_pn h
      LEFT JOIN perkara_penetapan pt ON ${joinCondition}
      LEFT JOIN perkara p ON p.perkara_id = pt.perkara_id
      LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
      WHERE h.aktif = 'Y'
      GROUP BY h.id, h.nama_gelar, h.nip
      ORDER BY h.id ASC, h.nama_gelar ASC
    `

    const rawRows = await prisma.$queryRawUnsafe<any[]>(rekapSql).catch((err) => {
      console.error('Error rekap LIPA 6:', err)
      return []
    })

    // Totals accumulator
    const totals = {
      sisa_lalu_g: 0,
      sisa_lalu_p: 0,
      tambah_g: 0,
      tambah_p: 0,
      jumlah_g: 0,
      jumlah_p: 0,
      putus_g: 0,
      putus_p: 0,
      sisa_ybs_g: 0,
      sisa_ybs_p: 0,
      minutir_g: 0,
      minutir_p: 0,
      belum_minutir_g: 0,
      belum_minutir_p: 0
    }

    const data = rawRows.map((r, index) => {
      const sisa_lalu_g = Number(r.sisa_lalu_g || 0)
      const sisa_lalu_p = Number(r.sisa_lalu_p || 0)
      const tambah_g = Number(r.tambah_g || 0)
      const tambah_p = Number(r.tambah_p || 0)

      // 3. Jumlah = Sisa bulan lalu + Tambah bulan ybs
      const jumlah_g = sisa_lalu_g + tambah_g
      const jumlah_p = sisa_lalu_p + tambah_p

      const putus_g = Number(r.putus_g || 0)
      const putus_p = Number(r.putus_p || 0)

      // 5. Sisa bulan ybs = Jumlah - Diputus
      const sisa_ybs_g = Math.max(0, jumlah_g - putus_g)
      const sisa_ybs_p = Math.max(0, jumlah_p - putus_p)

      const minutir_g = Number(r.minutir_g || 0)
      const minutir_p = Number(r.minutir_p || 0)
      const belum_minutir_g = Number(r.belum_minutir_g || 0)
      const belum_minutir_p = Number(r.belum_minutir_p || 0)

      // Accumulate totals
      totals.sisa_lalu_g += sisa_lalu_g
      totals.sisa_lalu_p += sisa_lalu_p
      totals.tambah_g += tambah_g
      totals.tambah_p += tambah_p
      totals.jumlah_g += jumlah_g
      totals.jumlah_p += jumlah_p
      totals.putus_g += putus_g
      totals.putus_p += putus_p
      totals.sisa_ybs_g += sisa_ybs_g
      totals.sisa_ybs_p += sisa_ybs_p
      totals.minutir_g += minutir_g
      totals.minutir_p += minutir_p
      totals.belum_minutir_g += belum_minutir_g
      totals.belum_minutir_p += belum_minutir_p

      return {
        no: index + 1,
        hakim_id: Number(r.hakim_id),
        nama_hakim: r.nama_hakim || '-',
        nip: r.nip || '-',
        sisa_lalu_g,
        sisa_lalu_p,
        tambah_g,
        tambah_p,
        jumlah_g,
        jumlah_p,
        putus_g,
        putus_p,
        sisa_ybs_g,
        sisa_ybs_p,
        minutir_g,
        minutir_p,
        belum_minutir_g,
        belum_minutir_p
      }
    })

    return serializeBigInt({
      success: true,
      year,
      month,
      periode,
      role,
      namaSatker,
      pejabat: {
        ketuaNama,
        ketuaNip,
        paniteraNama,
        paniteraNip,
        kotaSatker
      },
      data,
      totals
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat rekapitulasi LIPA 6',
      data: [],
      totals: null
    }
  }
})
