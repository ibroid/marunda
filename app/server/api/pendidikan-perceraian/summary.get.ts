import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

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
    const [satkerRes, summaryRes, topPendidikanRes, countAktifRes] = await Promise.all([
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

      // 3. Tingkat Pendidikan Pengaju Terbanyak (Top 1)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COALESCE(tp.id, 99) AS id,
          COALESCE(tp.kode, 'LAINNYA') AS kode,
          COALESCE(tp.nama, 'Lainnya / Tidak Diketahui') AS nama,
          COUNT(DISTINCT p.perkara_id) AS total
        FROM perkara p
        JOIN perkara_pihak1 pp ON pp.perkara_id = p.perkara_id AND pp.urutan = 1
        JOIN pihak ph ON ph.id = pp.pihak_id
        LEFT JOIN tingkat_pendidikan tp ON tp.id = ph.pendidikan_id
        WHERE ${dateCondition} ${jenisCondition}
        GROUP BY COALESCE(tp.id, 99), COALESCE(tp.kode, 'LAINNYA'), COALESCE(tp.nama, 'Lainnya / Tidak Diketahui')
        ORDER BY total DESC
        LIMIT 1
      `).catch(() => []),

      // 4. Jumlah klasifikasi pendidikan aktif yang memiliki perkara
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(DISTINCT COALESCE(ph.pendidikan_id, 99)) AS pendidikan_aktif
        FROM perkara p
        JOIN perkara_pihak1 pp ON pp.perkara_id = p.perkara_id AND pp.urutan = 1
        JOIN pihak ph ON ph.id = pp.pihak_id
        WHERE ${dateCondition} ${jenisCondition}
      `).catch(() => [{ pendidikan_aktif: 0 }])
    ])

    const namaSatker = satkerRes[0]?.value || 'PENGADILAN AGAMA JAKARTA UTARA'
    const s = summaryRes[0] || {}
    const totalPerceraian = Number(s.total_perceraian || 0)
    const ceraiGugat = Number(s.cerai_gugat || 0)
    const ceraiTalak = Number(s.cerai_talak || 0)
    const pendidikanAktif = Number(countAktifRes[0]?.pendidikan_aktif || 0)

    const persentaseGugat = totalPerceraian > 0 ? Math.round((ceraiGugat / totalPerceraian) * 1000) / 10 : 0
    const persentaseTalak = totalPerceraian > 0 ? Math.round((ceraiTalak / totalPerceraian) * 1000) / 10 : 0

    const top = topPendidikanRes[0]
    const topNama = top?.nama || '-'
    const topKode = top?.kode || '-'
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
        pendidikanAktif,
        rataRataPerBulan,
        pendidikanDominan: {
          id: top ? Number(top.id) : null,
          kode: topKode,
          nama: topNama,
          total: topTotal,
          persentase: topPersentase
        }
      }
    })
  } catch (error: any) {
    console.error('Error fetching pendidikan perceraian summary:', error)
    return {
      success: false,
      message: error?.message || 'Gagal memuat ringkasan pendidikan perceraian',
      summary: {
        totalPerceraian: 0,
        ceraiGugat: 0,
        ceraiTalak: 0,
        persentaseGugat: 0,
        persentaseTalak: 0,
        pendidikanAktif: 0,
        rataRataPerBulan: 0,
        pendidikanDominan: {
          id: null,
          kode: '-',
          nama: '-',
          total: 0,
          persentase: 0
        }
      }
    }
  }
})
