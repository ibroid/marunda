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

    // 2. Kueri Total Hakim Aktif
    const hakimCountRes = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) AS total_hakim FROM hakim_pn WHERE aktif = 'Y'`
    ).catch(() => [{ total_hakim: 0 }])
    const totalHakim = Number(hakimCountRes[0]?.total_hakim || 0)

    // 3. Kueri Agregat KPI LIPA 6
    const joinCondition = role === 'semua'
      ? `FIND_IN_SET(CAST(h.id AS CHAR), pt.majelis_hakim_id) > 0`
      : `CAST(SUBSTRING_INDEX(pt.majelis_hakim_id, ',', 1) AS UNSIGNED) = h.id`

    const kpiSql = `
      SELECT
        -- Sisa Bulan Lalu
        SUM(CASE WHEN pt.penetapan_majelis_hakim < '${awalPeriode}'
                  AND (pp.tanggal_putusan IS NULL OR pp.tanggal_putusan >= '${awalPeriode}')
                 THEN 1 ELSE 0 END) AS sisa_lalu,

        -- Tambah Bulan Ini
        SUM(CASE WHEN pt.penetapan_majelis_hakim >= '${awalPeriode}' AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                 THEN 1 ELSE 0 END) AS tambah,

        -- Diputus
        SUM(CASE WHEN pp.tanggal_putusan >= '${awalPeriode}' AND pp.tanggal_putusan <= '${akhirPeriode}'
                  AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                 THEN 1 ELSE 0 END) AS putus,

        -- Minutir
        SUM(CASE WHEN pp.tanggal_minutasi >= '${awalPeriode}' AND pp.tanggal_minutasi <= '${akhirPeriode}'
                  AND pp.tanggal_minutasi != '0000-00-00'
                  AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                 THEN 1 ELSE 0 END) AS minutir,

        -- Belum Minutir
        SUM(CASE WHEN pp.tanggal_putusan IS NOT NULL AND pp.tanggal_putusan <= '${akhirPeriode}'
                  AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi > '${akhirPeriode}')
                  AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                 THEN 1 ELSE 0 END) AS belum_minutir

      FROM hakim_pn h
      JOIN perkara_penetapan pt ON ${joinCondition}
      JOIN perkara p ON p.perkara_id = pt.perkara_id
      LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
      WHERE h.aktif = 'Y'
    `

    const kpiRes = await prisma.$queryRawUnsafe<any[]>(kpiSql).catch((err) => {
      console.error('Error KPI summary LIPA 6:', err)
      return []
    })

    const kpiRow = kpiRes[0] || {}
    const sisaLalu = Number(kpiRow.sisa_lalu || 0)
    const tambah = Number(kpiRow.tambah || 0)
    const totalBeban = sisaLalu + tambah
    const putus = Number(kpiRow.putus || 0)
    const sisaYbs = Math.max(0, totalBeban - putus)
    const minutir = Number(kpiRow.minutir || 0)
    const belumMinutir = Number(kpiRow.belum_minutir || 0)

    const rasioPutus = totalBeban > 0 ? Number(((putus / totalBeban) * 100).toFixed(1)) : 0
    const rasioMinutir = putus > 0 ? Number(((minutir / putus) * 100).toFixed(1)) : 0

    return serializeBigInt({
      success: true,
      year,
      month,
      periode,
      namaSatker,
      pejabat: {
        ketuaNama,
        ketuaNip,
        paniteraNama,
        paniteraNip,
        kotaSatker
      },
      summary: {
        totalHakim,
        sisaLalu,
        tambah,
        totalBeban,
        putus,
        sisaYbs,
        minutir,
        belumMinutir,
        rasioPutus,
        rasioMinutir
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat ringkasan LIPA 6'
    }
  }
})
