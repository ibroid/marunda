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
    // Ambil semua master faktor_perceraian LEFT JOIN ke perkara_akta_cerai pada periode terpilih
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        f.id AS faktor_id,
        f.nama AS faktor_nama,
        f.aktif,
        COUNT(ac.perkara_id) AS total,
        SUM(CASE WHEN p.jenis_perkara_id = 347 OR ac.jenis_cerai LIKE '%Gugat%' THEN 1 ELSE 0 END) AS cerai_gugat,
        SUM(CASE WHEN p.jenis_perkara_id = 346 OR ac.jenis_cerai LIKE '%Talak%' THEN 1 ELSE 0 END) AS cerai_talak
      FROM faktor_perceraian f
      LEFT JOIN perkara_akta_cerai ac ON ac.faktor_perceraian_id = f.id AND (${dateCondition})
      LEFT JOIN perkara p ON p.perkara_id = ac.perkara_id ${jenisCondition}
      GROUP BY f.id, f.nama, f.aktif
      ORDER BY total DESC, f.id ASC
    `).catch(() => [])

    let grandTotal = 0
    let grandCeraiGugat = 0
    let grandCeraiTalak = 0

    for (const r of rows) {
      grandTotal += Number(r.total || 0)
      grandCeraiGugat += Number(r.cerai_gugat || 0)
      grandCeraiTalak += Number(r.cerai_talak || 0)
    }

    const items = rows.map((r, idx) => {
      const total = Number(r.total || 0)
      const ceraiGugat = Number(r.cerai_gugat || 0)
      const ceraiTalak = Number(r.cerai_talak || 0)
      const persentase = grandTotal > 0 ? Math.round((total / grandTotal) * 1000) / 10 : 0

      return {
        no: idx + 1,
        id: Number(r.faktor_id),
        nama: r.faktor_nama,
        aktif: r.aktif === 'Y',
        ceraiGugat,
        ceraiTalak,
        total,
        persentase
      }
    })

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
    return serializeBigInt({
      success: false,
      message: error?.message || 'Gagal memuat tabel faktor perceraian',
      items: [],
      grandTotal: 0,
      grandCeraiGugat: 0,
      grandCeraiTalak: 0
    })
  }
})
