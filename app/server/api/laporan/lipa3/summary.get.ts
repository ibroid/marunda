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

    // 2. Kueri KPI Agregat Kasasi secara Paralel
    const [
      sisaLaluRes,
      terimaRes,
      putusRes,
      belumKirimRes,
      belumKembaliRes,
      tmsRes
    ] = await Promise.all([
      // Sisa bulan lalu
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara_kasasi
        WHERE permohonan_kasasi < '${awalPeriode}'
          AND (putusan_kasasi IS NULL OR putusan_kasasi >= '${awalPeriode}')
          AND (tidak_memenuhi_syarat IS NULL OR tidak_memenuhi_syarat >= '${awalPeriode}')
          AND (tanggal_cabut IS NULL OR tanggal_cabut >= '${awalPeriode}')
      `).catch(() => [{ total: 0 }]),

      // Permohonan bulan ini
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara_kasasi
        WHERE LEFT(permohonan_kasasi, 7) = '${periode}'
      `).catch(() => [{ total: 0 }]),

      // Putus bulan ini
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara_kasasi
        WHERE LEFT(putusan_kasasi, 7) = '${periode}'
      `).catch(() => [{ total: 0 }]),

      // Belum kirim berkas ke MA
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara_kasasi
        WHERE pengiriman_berkas_kasasi IS NULL
          AND LEFT(permohonan_kasasi, 7) <= '${periode}'
          AND (putusan_kasasi IS NULL OR LEFT(putusan_kasasi, 7) >= '${periode}')
      `).catch(() => [{ total: 0 }]),

      // Putus kasasi tapi belum kembali berkas ke PA
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara_kasasi
        WHERE putusan_kasasi IS NOT NULL
          AND penerimaan_berkas_kasasi IS NULL
          AND LEFT(permohonan_kasasi, 7) <= '${periode}'
          AND LEFT(putusan_kasasi, 7) <= '${periode}'
      `).catch(() => [{ total: 0 }]),

      // Tidak Memenuhi Syarat Formal
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara_kasasi
        WHERE LEFT(tidak_memenuhi_syarat, 7) = '${periode}'
      `).catch(() => [{ total: 0 }])
    ])

    const sisaBulanLalu = Number(sisaLaluRes[0]?.total || 0)
    const terimaBulanIni = Number(terimaRes[0]?.total || 0)
    const putusBulanIni = Number(putusRes[0]?.total || 0)
    const totalBeban = sisaBulanLalu + terimaBulanIni
    const sisaAkhirBulan = totalBeban - putusBulanIni
    const belumKirimMA = Number(belumKirimRes[0]?.total || 0)
    const belumKembaliPA = Number(belumKembaliRes[0]?.total || 0)
    const tidakMemenuhiSyarat = Number(tmsRes[0]?.total || 0)

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
        tidakMemenuhiSyarat
      }
    })
  } catch (error: any) {
    console.error('Error in lipa3/summary:', error)
    return {
      success: false,
      message: error.message || 'Gagal memuat ringkasan kasasi'
    }
  }
})
