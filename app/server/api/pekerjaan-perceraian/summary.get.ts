import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

function formatPekerjaanTitle(str?: string | null): string {
  if (!str) return 'Tidak Diketahui'
  const trimmed = str.replace(/[.,\s]+$/, '').trim()
  if (!trimmed || trimmed === '-') return 'Tidak Diketahui'
  const acronyms = new Set(['PNS', 'TNI', 'POLRI', 'BUMN', 'BUMD', 'PJLP', 'PPPK', 'ART', 'IRT', 'ASN', 'WNI', 'WNA'])
  return trimmed
    .split(/\s+/)
    .map(word => {
      const clean = word.toUpperCase().replace(/[^A-Z]/g, '')
      if (acronyms.has(clean)) return word.toUpperCase()
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const month = query.month && query.month !== 'all' && !isNaN(Number(query.month)) ? Number(query.month) : null
  const jenisCerai = (query.jenis_cerai as string) || 'all'

  // Filter tanggal pendaftaran perkara
  let dateCondition = `p.tanggal_pendaftaran >= '${year}-01-01' AND p.tanggal_pendaftaran <= '${year}-12-31 23:59:59'`
  if (month) {
    const monthStr = month < 10 ? `0${month}` : `${month}`
    dateCondition = `p.tanggal_pendaftaran >= '${year}-${monthStr}-01' AND p.tanggal_pendaftaran <= LAST_DAY('${year}-${monthStr}-01')`
  }

  // Filter jenis cerai
  let jenisCondition = 'AND p.jenis_perkara_id IN (346, 347)'
  if (jenisCerai === 'Cerai Gugat') {
    jenisCondition = 'AND p.jenis_perkara_id = 347'
  } else if (jenisCerai === 'Cerai Talak') {
    jenisCondition = 'AND p.jenis_perkara_id = 346'
  }

  try {
    const [satkerRes, summaryRes, topPekerjaanRows, countAktifRes] = await Promise.all([
      // 1. Ambil Nama Satker
      prisma.$queryRawUnsafe<any[]>(
        `SELECT value FROM sys_config WHERE id = 62 OR name = 'NamaPN' LIMIT 1`
      ).catch(() => [{ value: 'PENGADILAN AGAMA JAKARTA UTARA' }]),

      // 2. Summary Statistik Perceraian Pengaju
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(DISTINCT p.perkara_id) AS total_perceraian,
          COUNT(DISTINCT CASE WHEN p.jenis_perkara_id = 347 THEN p.perkara_id END) AS cerai_gugat,
          COUNT(DISTINCT CASE WHEN p.jenis_perkara_id = 346 THEN p.perkara_id END) AS cerai_talak
        FROM perkara p
        JOIN perkara_pihak1 pp ON pp.perkara_id = p.perkara_id AND pp.urutan = 1
        WHERE ${dateCondition} ${jenisCondition}
      `).catch(() => [{ total_perceraian: 0, cerai_gugat: 0, cerai_talak: 0 }]),

      // 3. Pekerjaan Pengaju Terbanyak (Top list for aggregation)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          CASE
            WHEN ph.pekerjaan IS NULL OR TRIM(ph.pekerjaan) = '' OR ph.pekerjaan = '-' THEN 'Tidak Diketahui'
            ELSE TRIM(ph.pekerjaan)
          END AS pekerjaan,
          COUNT(DISTINCT p.perkara_id) AS total
        FROM perkara p
        JOIN perkara_pihak1 pp ON pp.perkara_id = p.perkara_id AND pp.urutan = 1
        JOIN pihak ph ON ph.id = pp.pihak_id
        WHERE ${dateCondition} ${jenisCondition}
        GROUP BY pekerjaan
        ORDER BY total DESC
        LIMIT 10
      `).catch(() => []),

      // 4. Jumlah klasifikasi pekerjaan aktif yang terdaftar
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(DISTINCT CASE
          WHEN ph.pekerjaan IS NULL OR TRIM(ph.pekerjaan) = '' OR ph.pekerjaan = '-' THEN 'Tidak Diketahui'
          ELSE TRIM(TRAILING ',' FROM TRIM(TRAILING '.' FROM TRIM(ph.pekerjaan)))
        END) AS pekerjaan_aktif
        FROM perkara p
        JOIN perkara_pihak1 pp ON pp.perkara_id = p.perkara_id AND pp.urutan = 1
        JOIN pihak ph ON ph.id = pp.pihak_id
        WHERE ${dateCondition} ${jenisCondition}
      `).catch(() => [{ pekerjaan_aktif: 0 }])
    ])

    const namaSatker = satkerRes[0]?.value || 'PENGADILAN AGAMA JAKARTA UTARA'
    const s = summaryRes[0] || {}
    const totalPerceraian = Number(s.total_perceraian || 0)
    const ceraiGugat = Number(s.cerai_gugat || 0)
    const ceraiTalak = Number(s.cerai_talak || 0)
    const pekerjaanAktif = Number(countAktifRes[0]?.pekerjaan_aktif || 0)

    const persentaseGugat = totalPerceraian > 0 ? Math.round((ceraiGugat / totalPerceraian) * 1000) / 10 : 0
    const persentaseTalak = totalPerceraian > 0 ? Math.round((ceraiTalak / totalPerceraian) * 1000) / 10 : 0

    // Gabungkan top pekerjaan dengan grouping nama title case
    const topMap = new Map<string, { nama: string; total: number }>()
    for (const r of topPekerjaanRows) {
      const formatted = formatPekerjaanTitle(r.pekerjaan)
      const key = formatted.toLowerCase()
      if (!topMap.has(key)) {
        topMap.set(key, { nama: formatted, total: 0 })
      }
      topMap.get(key)!.total += Number(r.total)
    }

    const sortedTop = Array.from(topMap.values()).sort((a, b) => b.total - a.total)
    const top = sortedTop[0]
    const topNama = top?.nama || '-'
    const topTotal = Number(top?.total || 0)
    const topPersentase = totalPerceraian > 0 ? Math.round((topTotal / totalPerceraian) * 1000) / 10 : 0

    // Rata-rata per bulan
    const currentMonthNum = new Date().getMonth() + 1
    const monthsPassed = (year === currentYear) ? Math.max(1, currentMonthNum) : 12
    const rataRataPerBulan = Math.round(totalPerceraian / monthsPassed)

    return serializeBigInt({
      success: true,
      year,
      month,
      jenisCerai,
      namaSatker,
      summary: {
        totalPerceraian,
        ceraiGugat,
        ceraiTalak,
        persentaseGugat,
        persentaseTalak,
        pekerjaanAktif,
        rataRataPerBulan,
        pekerjaanDominan: {
          nama: topNama,
          total: topTotal,
          persentase: topPersentase
        }
      }
    })
  } catch (error: any) {
    console.error('Error fetching pekerjaan perceraian summary:', error)
    return {
      success: false,
      message: error?.message || 'Gagal memuat ringkasan pekerjaan perceraian',
      summary: {
        totalPerceraian: 0,
        ceraiGugat: 0,
        ceraiTalak: 0,
        persentaseGugat: 0,
        persentaseTalak: 0,
        pekerjaanAktif: 0,
        rataRataPerBulan: 0,
        pekerjaanDominan: {
          nama: '-',
          total: 0,
          persentase: 0
        }
      }
    }
  }
})
