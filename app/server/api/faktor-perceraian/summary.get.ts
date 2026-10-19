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
    const [satkerRes, summaryRes, topFaktorRes] = await Promise.all([
      // 1. Ambil Nama Satker
      prisma.$queryRawUnsafe<any[]>(
        `SELECT value FROM sys_config WHERE id = 62 OR name = 'NamaPN' LIMIT 1`
      ).catch(() => [{ value: 'PENGADILAN AGAMA JAKARTA UTARA' }]),

      // 2. Summary Statistik Perceraian
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(ac.perkara_id) AS total_perceraian,
          SUM(CASE WHEN p.jenis_perkara_id = 347 OR ac.jenis_cerai LIKE '%Gugat%' THEN 1 ELSE 0 END) AS cerai_gugat,
          SUM(CASE WHEN p.jenis_perkara_id = 346 OR ac.jenis_cerai LIKE '%Talak%' THEN 1 ELSE 0 END) AS cerai_talak,
          COUNT(DISTINCT ac.faktor_perceraian_id) AS faktor_aktif
        FROM perkara_akta_cerai ac
        JOIN perkara p ON p.perkara_id = ac.perkara_id
        WHERE ${dateCondition} ${jenisCondition}
      `).catch(() => [{ total_perceraian: 0, cerai_gugat: 0, cerai_talak: 0, faktor_aktif: 0 }]),

      // 3. Faktor Terbanyak (Top Dominan)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          f.id,
          f.nama,
          COUNT(ac.perkara_id) AS total
        FROM perkara_akta_cerai ac
        JOIN perkara p ON p.perkara_id = ac.perkara_id
        JOIN faktor_perceraian f ON f.id = ac.faktor_perceraian_id
        WHERE ${dateCondition} ${jenisCondition}
        GROUP BY f.id, f.nama
        ORDER BY total DESC
        LIMIT 1
      `).catch(() => [])
    ])

    const namaSatker = satkerRes[0]?.value || 'PENGADILAN AGAMA JAKARTA UTARA'
    const s = summaryRes[0] || {}
    const totalPerceraian = Number(s.total_perceraian || 0)
    const ceraiGugat = Number(s.cerai_gugat || 0)
    const ceraiTalak = Number(s.cerai_talak || 0)
    const faktorAktif = Number(s.faktor_aktif || 0)

    const persentaseGugat = totalPerceraian > 0 ? Math.round((ceraiGugat / totalPerceraian) * 1000) / 10 : 0
    const persentaseTalak = totalPerceraian > 0 ? Math.round((ceraiTalak / totalPerceraian) * 1000) / 10 : 0

    const top = topFaktorRes[0]
    const topNama = top?.nama || '-'
    const topTotal = Number(top?.total || 0)
    const topPersentase = totalPerceraian > 0 ? Math.round((topTotal / totalPerceraian) * 1000) / 10 : 0

    // Rata-rata per bulan
    const currentMonthNum = new Date().getMonth() + 1
    const monthsPassed = (year === currentYear) ? Math.max(1, currentMonthNum) : 12
    const rataRataPerBulan = Math.round(totalPerceraian / monthsPassed)

    return serializeBigInt({
      success: true,
      namaSatker,
      year,
      month,
      jenisCerai,
      summary: {
        totalPerceraian,
        ceraiGugat,
        ceraiTalak,
        persentaseGugat,
        persentaseTalak,
        faktorDominan: {
          id: top?.id ? Number(top.id) : null,
          nama: topNama,
          total: topTotal,
          persentase: topPersentase
        },
        faktorAktif,
        rataRataPerBulan
      }
    })
  } catch (error: any) {
    return serializeBigInt({
      success: false,
      message: error?.message || 'Gagal memuat ringkasan faktor perceraian',
      summary: {
        totalPerceraian: 0,
        ceraiGugat: 0,
        ceraiTalak: 0,
        persentaseGugat: 0,
        persentaseTalak: 0,
        faktorDominan: { id: null, nama: '-', total: 0, persentase: 0 },
        faktorAktif: 0,
        rataRataPerBulan: 0
      }
    })
  }
})
