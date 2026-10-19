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
    const [masterPendidikan, aggRows] = await Promise.all([
      // 1. Ambil seluruh master tingkat_pendidikan
      prisma.$queryRawUnsafe<any[]>(`
        SELECT id, kode, nama, aktif
        FROM tingkat_pendidikan
        ORDER BY id ASC
      `).catch(() => []),

      // 2. Agregasi perkara berdasarkan pendidikan pengaju (urutan = 1)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COALESCE(ph.pendidikan_id, 99) AS pendidikan_id,
          COUNT(DISTINCT p.perkara_id) AS total,
          COUNT(DISTINCT CASE WHEN p.jenis_perkara_id = 347 THEN p.perkara_id END) AS cerai_gugat,
          COUNT(DISTINCT CASE WHEN p.jenis_perkara_id = 346 THEN p.perkara_id END) AS cerai_talak
        FROM perkara p
        JOIN perkara_pihak1 pp ON pp.perkara_id = p.perkara_id AND pp.urutan = 1
        JOIN pihak ph ON ph.id = pp.pihak_id
        WHERE ${dateCondition} ${jenisCondition}
        GROUP BY COALESCE(ph.pendidikan_id, 99)
      `).catch(() => [])
    ])

    // Buat map dari hasil agregasi
    const aggMap = new Map<number, { total: number; cerai_gugat: number; cerai_talak: number }>()
    let grandTotal = 0
    let grandCeraiGugat = 0
    let grandCeraiTalak = 0

    for (const r of aggRows) {
      const pId = Number(r.pendidikan_id)
      const tot = Number(r.total || 0)
      const cg = Number(r.cerai_gugat || 0)
      const ct = Number(r.cerai_talak || 0)

      aggMap.set(pId, { total: tot, cerai_gugat: cg, cerai_talak: ct })
      grandTotal += tot
      grandCeraiGugat += cg
      grandCeraiTalak += ct
    }

    // Susun baris dari master tingkat_pendidikan
    const list: any[] = []

    for (const m of masterPendidikan) {
      const mId = Number(m.id)
      const stat = aggMap.get(mId) || { total: 0, cerai_gugat: 0, cerai_talak: 0 }
      const total = stat.total
      const ceraiGugat = stat.cerai_gugat
      const ceraiTalak = stat.cerai_talak
      const persentase = grandTotal > 0 ? Math.round((total / grandTotal) * 1000) / 10 : 0

      list.push({
        id: mId,
        kode: m.kode || '-',
        nama: m.nama || '-',
        aktif: m.aktif === 'Y',
        ceraiGugat,
        ceraiTalak,
        total,
        persentase
      })

      // Hapus yang sudah di-mapping
      aggMap.delete(mId)
    }

    // Jika ada data pengaju yang pendidikan_id tidak terdaftar di master atau null (ID 99 / unmapped)
    if (aggMap.size > 0) {
      for (const [pId, stat] of aggMap.entries()) {
        const total = stat.total
        const ceraiGugat = stat.cerai_gugat
        const ceraiTalak = stat.cerai_talak
        const persentase = grandTotal > 0 ? Math.round((total / grandTotal) * 1000) / 10 : 0

        list.push({
          id: pId,
          kode: 'LAINNYA',
          nama: pId === 99 ? 'Lainnya / Tidak Terdata' : `Pendidikan ID ${pId}`,
          aktif: true,
          ceraiGugat,
          ceraiTalak,
          total,
          persentase
        })
      }
    }

    // Default sorting: Total terbanyak, jika sama urut berdasarkan ID master
    list.sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total
      }
      return a.id - b.id
    })

    const items = list.map((item, idx) => ({
      no: idx + 1,
      ...item
    }))

    return serializeBigInt({
      success: true,
      year,
      month,
      jenisCerai,
      items,
      grandTotal,
      grandCeraiGugat,
      grandCeraiTalak
    })
  } catch (error: any) {
    console.error('Error fetching pendidikan perceraian tabel:', error)
    return {
      success: false,
      message: error?.message || 'Gagal memuat tabel pendidikan perceraian',
      items: [],
      grandTotal: 0,
      grandCeraiGugat: 0,
      grandCeraiTalak: 0
    }
  }
})
