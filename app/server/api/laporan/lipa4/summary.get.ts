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
  const awalPeriode = `${periode}-01`

  try {
    // 1. Ambil nama satker dan konfigurasi pejabat
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

    // 2. Kueri KPI Agregat Peninjauan Kembali (PK) secara Paralel
    const [
      sisaLaluRes,
      terimaRes,
      putusRes,
      belumKirimRes,
      belumKembaliRes,
      cabutRes
    ] = await Promise.all([
      // Sisa bulan lalu
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara_pk
        WHERE permohonan_pk < '${awalPeriode}'
          AND (putusan_pk IS NULL OR putusan_pk >= '${awalPeriode}')
          AND (tidak_memenuhi_syarat IS NULL OR tidak_memenuhi_syarat >= '${awalPeriode}')
          AND (tanggal_cabut IS NULL OR tanggal_cabut >= '${awalPeriode}')
      `).catch(() => [{ total: 0 }]),

      // Permohonan bulan ini
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara_pk
        WHERE LEFT(permohonan_pk, 7) = '${periode}'
      `).catch(() => [{ total: 0 }]),

      // Putus bulan ini
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara_pk
        WHERE LEFT(putusan_pk, 7) = '${periode}'
      `).catch(() => [{ total: 0 }]),

      // Belum kirim berkas ke MA
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara_pk
        WHERE pengiriman_berkas_pk IS NULL
          AND LEFT(permohonan_pk, 7) <= '${periode}'
          AND (putusan_pk IS NULL OR LEFT(putusan_pk, 7) >= '${periode}')
          AND (tanggal_cabut IS NULL OR LEFT(tanggal_cabut, 7) >= '${periode}')
      `).catch(() => [{ total: 0 }]),

      // Putus PK tapi berkas belum kembali ke PA
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara_pk
        WHERE putusan_pk IS NOT NULL
          AND penerimaan_berkas_pk IS NULL
          AND LEFT(permohonan_pk, 7) <= '${periode}'
          AND LEFT(putusan_pk, 7) <= '${periode}'
      `).catch(() => [{ total: 0 }]),

      // Permohonan dicabut
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara_pk
        WHERE LEFT(tanggal_cabut, 7) = '${periode}'
      `).catch(() => [{ total: 0 }])
    ])

    const sisaBulanLalu = Number(sisaLaluRes[0]?.total || 0)
    const terimaBulanIni = Number(terimaRes[0]?.total || 0)
    const putusBulanIni = Number(putusRes[0]?.total || 0)
    const totalBeban = sisaBulanLalu + terimaBulanIni
    const sisaAkhirBulan = totalBeban - putusBulanIni
    const belumKirimMA = Number(belumKirimRes[0]?.total || 0)
    const belumKembaliPA = Number(belumKembaliRes[0]?.total || 0)
    const dicabutBulanIni = Number(cabutRes[0]?.total || 0)

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
        sisaBulanLalu,
        terimaBulanIni,
        totalBeban,
        putusBulanIni,
        sisaAkhirBulan,
        belumKirimMA,
        belumKembaliPA,
        dicabutBulanIni
      }
    })
  } catch (error: any) {
    console.error('Error in lipa4/summary:', error)
    return {
      success: false,
      message: error.message || 'Gagal memuat ringkasan perkara PK'
    }
  }
})
