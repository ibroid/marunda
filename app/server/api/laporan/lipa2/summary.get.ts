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
    // 1. Ambil nama satker
    const satkerRes = await prisma.$queryRawUnsafe<any[]>(
      `SELECT value FROM sys_config WHERE id = 62 OR name = 'NamaPN' LIMIT 1`
    ).catch(() => [])
    const namaSatker = satkerRes.length > 0 && satkerRes[0]?.value ? satkerRes[0].value : 'PENGADILAN AGAMA JAKARTA UTARA'

    // 2. Kueri KPI Agregat Paralel
    const [
      sisaLaluRes,
      terimaRes,
      putusRes,
      belumKirimRes,
      belumKembaliRes
    ] = await Promise.all([
      // Sisa bulan lalu
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara_banding
        WHERE permohonan_banding < '${awalPeriode}'
          AND (putusan_banding IS NULL OR putusan_banding >= '${awalPeriode}')
      `).catch(() => [{ total: 0 }]),

      // Terima bulan ini
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara_banding
        WHERE LEFT(permohonan_banding, 7) = '${periode}'
      `).catch(() => [{ total: 0 }]),

      // Putus bulan ini
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara_banding
        WHERE LEFT(putusan_banding, 7) = '${periode}'
      `).catch(() => [{ total: 0 }]),

      // Belum kirim berkas ke PTA
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara_banding
        WHERE pengiriman_berkas_banding IS NULL
          AND LEFT(permohonan_banding, 7) <= '${periode}'
          AND (putusan_banding IS NULL OR LEFT(putusan_banding, 7) >= '${periode}')
      `).catch(() => [{ total: 0 }]),

      // Putus banding tapi belum kembali berkas ke PA
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara_banding
        WHERE putusan_banding IS NOT NULL
          AND penerimaan_kembali_berkas_banding IS NULL
          AND LEFT(permohonan_banding, 7) <= '${periode}'
          AND LEFT(putusan_banding, 7) <= '${periode}'
      `).catch(() => [{ total: 0 }])
    ])

    const sisaBulanLalu = Number(sisaLaluRes[0]?.total || 0)
    const terimaBulanIni = Number(terimaRes[0]?.total || 0)
    const putusBulanIni = Number(putusRes[0]?.total || 0)
    const totalBeban = sisaBulanLalu + terimaBulanIni
    const sisaAkhirBulan = totalBeban - putusBulanIni
    const belumKirimPTA = Number(belumKirimRes[0]?.total || 0)
    const belumKembaliPA = Number(belumKembaliRes[0]?.total || 0)

    return serializeBigInt({
      success: true,
      year,
      month,
      periode,
      namaSatker,
      summary: {
        sisaBulanLalu,
        terimaBulanIni,
        totalBeban,
        putusBulanIni,
        sisaAkhirBulan,
        belumKirimPTA,
        belumKembaliPA
      }
    })
  } catch (error: any) {
    console.error('Error in lipa2/summary:', error)
    return {
      success: false,
      message: error?.message || 'Gagal memuat ringkasan KPI LIPA 2',
      summary: {
        sisaBulanLalu: 0,
        terimaBulanIni: 0,
        totalBeban: 0,
        putusBulanIni: 0,
        sisaAkhirBulan: 0,
        belumKirimPTA: 0,
        belumKembaliPA: 0
      }
    }
  }
})
