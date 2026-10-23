import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const month = query.month && !isNaN(Number(query.month)) ? Number(query.month) : currentMonth

  const monthStr = month < 10 ? `0${month}` : `${month}`
  const periode = `${year}-${monthStr}`

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

    // 2. Kueri KPI Ringkasan LIPA 5 sesuai standar laporan Badilag
    const summarySql = `
      SELECT
        COUNT(*) AS total_laporan,
        SUM(IF(LEFT(permohonan_eksekusi, 7) = '${periode}', 1, 0)) AS mohon_bulan_ini,
        SUM(IF(LEFT(permohonan_eksekusi, 7) < '${periode}', 1, 0)) AS sisa_lalu,
        SUM(IF(penetapan_teguran_eksekusi IS NOT NULL AND penetapan_teguran_eksekusi != '0000-00-00', 1, 0)) AS aanmaning,
        SUM(IF(penetapan_sita_eksekusi IS NOT NULL AND penetapan_sita_eksekusi != '0000-00-00', 1, 0)) AS sita,
        SUM(IF(penetapan_perintah_eksekusi_rill IS NOT NULL AND penetapan_perintah_eksekusi_rill != '0000-00-00', 1, 0)) AS eksekusi_rill,
        SUM(IF(pelaksanaan_eksekusi_rill IS NOT NULL AND pelaksanaan_eksekusi_rill != '0000-00-00' AND LEFT(pelaksanaan_eksekusi_rill, 7) <= '${periode}', 1, 0)) AS selesai,
        SUM(IF(penetapan_noneksekusi IS NOT NULL AND penetapan_noneksekusi != '0000-00-00', 1, 0)) AS non_eksekutabel
      FROM (
        SELECT veks.*
        FROM v_perkara_eksekusi AS veks
        WHERE LEFT(permohonan_eksekusi, 7) < '${periode}' AND (pelaksanaan_sita_eksekusi IS NULL OR LEFT(pelaksanaan_sita_eksekusi, 7) >= '${periode}')
        UNION
        SELECT veks.*
        FROM v_perkara_eksekusi AS veks
        WHERE LEFT(permohonan_eksekusi, 7) = '${periode}' AND (pelaksanaan_sita_eksekusi IS NULL OR LEFT(pelaksanaan_sita_eksekusi, 7) >= '${periode}')
      ) AS base
    `

    const summaryRes = await prisma.$queryRawUnsafe<any[]>(summarySql).catch((err) => {
      console.error('Error KPI summary LIPA 5:', err)
      return []
    })

    const row = summaryRes[0] || {}

    return {
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
      summary: serializeBigInt({
        totalLaporan: Number(row.total_laporan || 0),
        mohonBulanIni: Number(row.mohon_bulan_ini || 0),
        sisaBulanLalu: Number(row.sisa_lalu || 0),
        aanmaning: Number(row.aanmaning || 0),
        sita: Number(row.sita || 0),
        eksekusiRill: Number(row.eksekusi_rill || 0),
        selesai: Number(row.selesai || 0),
        nonEksekutabel: Number(row.non_eksekutabel || 0)
      })
    }
  } catch (error: any) {
    console.error('Error fetching LIPA 5 summary:', error)
    return {
      success: false,
      message: error?.message || 'Gagal memuat ringkasan KPI LIPA 5',
      summary: {
        totalLaporan: 0,
        mohonBulanIni: 0,
        sisaBulanLalu: 0,
        aanmaning: 0,
        sita: 0,
        eksekusiRill: 0,
        selesai: 0,
        nonEksekutabel: 0
      }
    }
  }
})
