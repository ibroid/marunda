import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const tahun = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear

  try {
    // Daftar laporan yang dimonitor
    const monitoredReports = [
      { id: 'lipa_1', code: 'LIPA 1', name: 'Keadaan Perkara' },
      { id: 'lipa_2', code: 'LIPA 2', name: 'Perkara Banding' },
      { id: 'lipa_3', code: 'LIPA 3', name: 'Perkara Kasasi' },
      { id: 'lipa_6', code: 'LIPA 6', name: 'Kegiatan Hakim' },
      { id: 'lipa_7', code: 'LIPA 7', name: 'Keuangan Perkara' },
      { id: 'lipa_8', code: 'LIPA 8', name: 'Menurut Jenis Perkara' },
      { id: 'lipa_10', code: 'LIPA 10', name: 'Faktor Perceraian' },
      { id: 'lipa_11', code: 'LIPA 11', name: 'Uang Iwadl (DIPA)', isManual: true },
      { id: 'lipa_12', code: 'LIPA 12', name: 'Mediasi Perkara' },
      { id: 'lipa_14', code: 'LIPA 14', name: 'Sidang Keliling (DIPA)', isManual: true },
      { id: 'lipa_15', code: 'LIPA 15', name: 'Prodeo DIPA', isManual: true },
      { id: 'lipa_16', code: 'LIPA 16', name: 'Posbakum DIPA', isManual: true },
      { id: 'lipa_20', code: 'LIPA 20', name: 'Durasi Penyelesaian' },
      { id: 'lipa_23', code: 'LIPA 23', name: 'Tunggakan > 5 Bulan' }
    ]

    // Cek ketersediaan data perkara per bulan di tahun ini
    const monthlyPerkara = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        MONTH(tanggal_pendaftaran) AS bln,
        COUNT(perkara_id) AS total_masuk
      FROM perkara
      WHERE YEAR(tanggal_pendaftaran) = ${tahun}
      GROUP BY MONTH(tanggal_pendaftaran)
    `).catch(() => [])

    const monthMap = new Map<number, number>()
    monthlyPerkara.forEach(m => monthMap.set(Number(m.bln), Number(m.total_masuk || 0)))

    // Cek input manual DIPA per bulan
    const [sidkelDb, prodeoDb, posbakumDb, iwadlDb] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`SELECT bulan FROM tbl_data_laporan_rk8a WHERE tahun = ${tahun}`).catch(() => []),
      prisma.$queryRawUnsafe<any[]>(`SELECT bulan FROM tbl_data_laporan_rk8b WHERE tahun = ${tahun}`).catch(() => []),
      prisma.$queryRawUnsafe<any[]>(`SELECT bulan FROM tbl_data_laporan_rk8c WHERE tahun = ${tahun}`).catch(() => []),
      prisma.$queryRawUnsafe<any[]>(`SELECT MONTH(diterima_tgl) as bulan FROM tbl_data_laporan_iwadl WHERE YEAR(diterima_tgl) = ${tahun}`).catch(() => [])
    ])

    const sidkelSet = new Set(sidkelDb.map(r => Number(r.bulan)))
    const prodeoSet = new Set(prodeoDb.map(r => Number(r.bulan)))
    const posbakumSet = new Set(posbakumDb.map(r => Number(r.bulan)))
    const iwadlSet = new Set(iwadlDb.map(r => Number(r.bulan)))

    const currentMonth = new Date().getMonth() + 1
    const reportStatuses = monitoredReports.map(rep => {
      const months: Record<number, { status: 'lengkap' | 'siap' | 'belum' | 'mendatang'; label: string }> = {}

      for (let m = 1; m <= 12; m++) {
        if (tahun === currentYear && m > currentMonth) {
          months[m] = { status: 'mendatang', label: '-' }
        } else {
          if (rep.isManual) {
            let filled = false
            if (rep.id === 'lipa_14') filled = sidkelSet.has(m)
            else if (rep.id === 'lipa_15') filled = prodeoSet.has(m)
            else if (rep.id === 'lipa_16') filled = posbakumSet.has(m)
            else if (rep.id === 'lipa_11') filled = iwadlSet.has(m)

            months[m] = filled
              ? { status: 'lengkap', label: 'Tercatat' }
              : { status: 'belum', label: 'Belum Input' }
          } else {
            // Laporan otomatis SIPP
            const hasData = (monthMap.get(m) || 0) > 0
            months[m] = hasData
              ? { status: 'lengkap', label: 'Sinkron' }
              : { status: 'siap', label: 'Nihil/Siap' }
          }
        }
      }

      return {
        ...rep,
        months
      }
    })

    // Hitung ringkasan
    let totalSlot = 0
    let totalLengkap = 0
    let totalPerluInput = 0

    const targetBulan = tahun === currentYear ? currentMonth : 12
    reportStatuses.forEach(r => {
      for (let m = 1; m <= targetBulan; m++) {
        totalSlot++
        if (r.months[m]?.status === 'lengkap' || r.months[m]?.status === 'siap') {
          totalLengkap++
        } else {
          totalPerluInput++
        }
      }
    })

    const persentaseKesiapan = totalSlot > 0 ? Math.round((totalLengkap / totalSlot) * 100) : 0

    return serializeBigInt({
      success: true,
      tahun,
      summary: {
        totalLaporan: monitoredReports.length,
        persentaseKesiapan,
        totalLengkap,
        totalPerluInput,
        targetBulan
      },
      reports: reportStatuses
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat monitoring kepatuhan laporan',
      reports: []
    }
  }
})
