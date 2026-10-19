import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const month = query.month && query.month !== 'all' && !isNaN(Number(query.month)) ? Number(query.month) : null
  const jenisCerai = (query.jenis_cerai as string) || 'all'

  // Filter tanggal akta cerai
  let dateCondition = `YEAR(ac.tgl_akta_cerai) = ${year}`
  if (month) {
    const monthStr = month < 10 ? `0${month}` : `${month}`
    dateCondition = `ac.tgl_akta_cerai >= '${year}-${monthStr}-01' AND ac.tgl_akta_cerai <= LAST_DAY('${year}-${monthStr}-01')`
  }

  // Filter jenis cerai
  let jenisCondition = ''
  if (jenisCerai === 'Cerai Gugat') {
    jenisCondition = `AND (p.jenis_perkara_id = 347 OR ac.jenis_cerai LIKE '%Gugat%')`
  } else if (jenisCerai === 'Cerai Talak') {
    jenisCondition = `AND (p.jenis_perkara_id = 346 OR ac.jenis_cerai LIKE '%Talak%')`
  }

  try {
    const [topFaktorRaw, bulananRaw] = await Promise.all([
      // 1. Rekap Per Faktor Perceraian (diurutkan terbanyak)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          f.id,
          f.nama,
          COUNT(ac.perkara_id) AS total,
          SUM(CASE WHEN p.jenis_perkara_id = 347 OR ac.jenis_cerai LIKE '%Gugat%' THEN 1 ELSE 0 END) AS cerai_gugat,
          SUM(CASE WHEN p.jenis_perkara_id = 346 OR ac.jenis_cerai LIKE '%Talak%' THEN 1 ELSE 0 END) AS cerai_talak
        FROM perkara_akta_cerai ac
        JOIN perkara p ON p.perkara_id = ac.perkara_id
        JOIN faktor_perceraian f ON f.id = ac.faktor_perceraian_id
        WHERE ${dateCondition} ${jenisCondition}
        GROUP BY f.id, f.nama
        ORDER BY total DESC, f.id ASC
      `).catch(() => []),

      // 2. Tren Bulanan Jan - Des pada tahun tersebut
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          MONTH(ac.tgl_akta_cerai) AS bulan,
          COUNT(ac.perkara_id) AS total,
          SUM(CASE WHEN p.jenis_perkara_id = 347 OR ac.jenis_cerai LIKE '%Gugat%' THEN 1 ELSE 0 END) AS cerai_gugat,
          SUM(CASE WHEN p.jenis_perkara_id = 346 OR ac.jenis_cerai LIKE '%Talak%' THEN 1 ELSE 0 END) AS cerai_talak
        FROM perkara_akta_cerai ac
        JOIN perkara p ON p.perkara_id = ac.perkara_id
        WHERE YEAR(ac.tgl_akta_cerai) = ${year} ${jenisCondition}
        GROUP BY MONTH(ac.tgl_akta_cerai)
        ORDER BY bulan ASC
      `).catch(() => [])
    ])

    // Format Top 7 Faktor + Lainnya
    const grandTotal = topFaktorRaw.reduce((acc, curr) => acc + Number(curr.total || 0), 0)
    const top7 = topFaktorRaw.slice(0, 7).map((item) => {
      const total = Number(item.total || 0)
      const ceraiGugat = Number(item.cerai_gugat || 0)
      const ceraiTalak = Number(item.cerai_talak || 0)
      const persentase = grandTotal > 0 ? Math.round((total / grandTotal) * 1000) / 10 : 0
      return {
        id: Number(item.id),
        nama: item.nama || `Faktor #${item.id}`,
        total,
        ceraiGugat,
        ceraiTalak,
        persentase
      }
    })

    const remainder = topFaktorRaw.slice(7)
    if (remainder.length > 0) {
      const remTotal = remainder.reduce((acc, curr) => acc + Number(curr.total || 0), 0)
      const remGugat = remainder.reduce((acc, curr) => acc + Number(curr.cerai_gugat || 0), 0)
      const remTalak = remainder.reduce((acc, curr) => acc + Number(curr.cerai_talak || 0), 0)
      const remPersen = grandTotal > 0 ? Math.round((remTotal / grandTotal) * 1000) / 10 : 0
      top7.push({
        id: 0,
        nama: 'Faktor Lainnya (' + remainder.length + ' Kategori)',
        total: remTotal,
        ceraiGugat: remGugat,
        ceraiTalak: remTalak,
        persentase: remPersen
      })
    }

    // Format Tren Bulanan 1-12
    const bulanLabels = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ]
    const monthlyMap = new Map<number, { total: number; ceraiGugat: number; ceraiTalak: number }>()
    for (const b of bulananRaw) {
      const bNum = Number(b.bulan)
      monthlyMap.set(bNum, {
        total: Number(b.total || 0),
        ceraiGugat: Number(b.cerai_gugat || 0),
        ceraiTalak: Number(b.cerai_talak || 0)
      })
    }

    const trenBulanan = bulanLabels.map((lbl, idx) => {
      const mIdx = idx + 1
      const found = monthlyMap.get(mIdx) || { total: 0, ceraiGugat: 0, ceraiTalak: 0 }
      return {
        bulanNumber: mIdx,
        label: lbl,
        total: found.total,
        ceraiGugat: found.ceraiGugat,
        ceraiTalak: found.ceraiTalak
      }
    })

    return serializeBigInt({
      success: true,
      year,
      month,
      jenisCerai,
      topFaktor: top7,
      trenBulanan,
      grandTotal
    })
  } catch (error: any) {
    return serializeBigInt({
      success: false,
      message: error?.message || 'Gagal memuat data grafik',
      topFaktor: [],
      trenBulanan: [],
      grandTotal: 0
    })
  }
})
