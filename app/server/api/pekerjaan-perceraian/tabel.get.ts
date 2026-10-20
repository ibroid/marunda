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
    const aggRows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        CASE
          WHEN ph.pekerjaan IS NULL OR TRIM(ph.pekerjaan) = '' OR ph.pekerjaan = '-' THEN 'Tidak Diketahui'
          ELSE TRIM(ph.pekerjaan)
        END AS pekerjaan,
        COUNT(DISTINCT p.perkara_id) AS total,
        COUNT(DISTINCT CASE WHEN p.jenis_perkara_id = 347 THEN p.perkara_id END) AS cerai_gugat,
        COUNT(DISTINCT CASE WHEN p.jenis_perkara_id = 346 THEN p.perkara_id END) AS cerai_talak
      FROM perkara p
      JOIN perkara_pihak1 pp ON pp.perkara_id = p.perkara_id AND pp.urutan = 1
      JOIN pihak ph ON ph.id = pp.pihak_id
      WHERE ${dateCondition} ${jenisCondition}
      GROUP BY pekerjaan
      ORDER BY total DESC
    `).catch(() => [])

    let grandTotal = 0
    let grandCeraiGugat = 0
    let grandCeraiTalak = 0

    // Gabungkan variasi penulisan ke format title-case standar
    const map = new Map<string, {
      nama: string
      rawList: string[]
      total: number
      cerai_gugat: number
      cerai_talak: number
    }>()

    for (const r of aggRows) {
      const tot = Number(r.total || 0)
      const cg = Number(r.cerai_gugat || 0)
      const ct = Number(r.cerai_talak || 0)

      grandTotal += tot
      grandCeraiGugat += cg
      grandCeraiTalak += ct

      const formatted = formatPekerjaanTitle(r.pekerjaan)
      const key = formatted.toLowerCase()

      if (!map.has(key)) {
        map.set(key, {
          nama: formatted,
          rawList: [r.pekerjaan],
          total: tot,
          cerai_gugat: cg,
          cerai_talak: ct
        })
      } else {
        const item = map.get(key)!
        item.rawList.push(r.pekerjaan)
        item.total += tot
        item.cerai_gugat += cg
        item.cerai_talak += ct
      }
    }

    const sortedList = Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .map((item, index) => {
        const persentase = grandTotal > 0 ? Math.round((item.total / grandTotal) * 1000) / 10 : 0
        return {
          id: index + 1,
          nama: item.nama,
          rawList: item.rawList,
          ceraiGugat: item.cerai_gugat,
          ceraiTalak: item.cerai_talak,
          total: item.total,
          persentase
        }
      })

    return serializeBigInt({
      success: true,
      year,
      month,
      jenisCerai,
      grandTotal,
      grandCeraiGugat,
      grandCeraiTalak,
      totalKlasifikasi: sortedList.length,
      items: sortedList
    })
  } catch (error: any) {
    console.error('Error fetching pekerjaan perceraian tabel:', error)
    return {
      success: false,
      message: error?.message || 'Gagal memuat tabel pekerjaan perceraian',
      grandTotal: 0,
      grandCeraiGugat: 0,
      grandCeraiTalak: 0,
      totalKlasifikasi: 0,
      items: []
    }
  }
})
