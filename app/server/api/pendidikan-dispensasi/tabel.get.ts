import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const month = query.month && query.month !== 'all' && !isNaN(Number(query.month)) ? Number(query.month) : null
  const kategori = (query.kategori as string) || 'all'

  // Filter tanggal pendaftaran perkara
  let dateCondition = `p.tanggal_pendaftaran >= '${year}-01-01' AND p.tanggal_pendaftaran <= '${year}-12-31 23:59:59'`
  if (month) {
    const monthStr = month < 10 ? `0${month}` : `${month}`
    dateCondition = `p.tanggal_pendaftaran >= '${year}-${monthStr}-01' AND p.tanggal_pendaftaran <= LAST_DAY('${year}-${monthStr}-01')`
  }

  // Filter jenis perkara Dispensasi Nikah (362 = Dispensasi Kawin, 85 = Permohonan Dispensasi Nikah)
  const jenisCondition = 'AND (p.jenis_perkara_id IN (85, 362) OR p.jenis_perkara_nama LIKE "%dispensasi%")'

  // Filter kategori mempelai / anak
  let anakCondition = ''
  if (kategori === 'pria') {
    anakCondition = 'AND m.jenis_mempelai = "1"'
  } else if (kategori === 'wanita') {
    anakCondition = 'AND m.jenis_mempelai = "2"'
  } else if (kategori === 'anak') {
    anakCondition = 'AND (m.dimohonkan = 1 OR (m.dimohonkan IS NULL AND TIMESTAMPDIFF(YEAR, m.tanggal_lahir, p.tanggal_pendaftaran) < 19))'
  }

  try {
    const [masterPendidikan, aggRows] = await Promise.all([
      // 1. Ambil seluruh master tingkat_pendidikan
      prisma.$queryRawUnsafe<any[]>(`
        SELECT id, kode, nama, aktif
        FROM tingkat_pendidikan
        ORDER BY id ASC
      `).catch(() => []),

      // 2. Agregasi perkara & anak berdasarkan tingkat pendidikan di perkara_mempelai_dk
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COALESCE(m.pendidikan, 99) AS pendidikan_id,
          COUNT(DISTINCT p.perkara_id) AS total_perkara,
          COUNT(m.id) AS total_anak,
          COUNT(DISTINCT CASE WHEN m.jenis_mempelai = '1' THEN m.id END) AS calon_suami,
          COUNT(DISTINCT CASE WHEN m.jenis_mempelai = '2' THEN m.id END) AS calon_istri
        FROM perkara p
        JOIN perkara_mempelai_dk m ON m.perkara_id = p.perkara_id
        WHERE ${dateCondition} ${jenisCondition} ${anakCondition}
        GROUP BY COALESCE(m.pendidikan, 99)
      `).catch(() => [])
    ])

    // Buat map dari hasil agregasi
    const aggMap = new Map<number, {
      total_perkara: number
      total_anak: number
      calon_suami: number
      calon_istri: number
    }>()

    let grandTotalAnak = 0
    let grandCalonSuami = 0
    let grandCalonIstri = 0

    for (const r of aggRows) {
      const pId = Number(r.pendidikan_id)
      const totPerkara = Number(r.total_perkara || 0)
      const totAnak = Number(r.total_anak || 0)
      const cs = Number(r.calon_suami || 0)
      const ci = Number(r.calon_istri || 0)

      aggMap.set(pId, {
        total_perkara: totPerkara,
        total_anak: totAnak,
        calon_suami: cs,
        calon_istri: ci
      })

      grandTotalAnak += totAnak
      grandCalonSuami += cs
      grandCalonIstri += ci
    }

    // Ambil distinct total perkara untuk grand total
    const totalDistinctPerkaraRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(DISTINCT p.perkara_id) AS grand_perkara
      FROM perkara p
      JOIN perkara_mempelai_dk m ON m.perkara_id = p.perkara_id
      WHERE ${dateCondition} ${jenisCondition} ${anakCondition}
    `).catch(() => [{ grand_perkara: 0 }])

    const grandTotalPerkara = Number(totalDistinctPerkaraRes[0]?.grand_perkara || 0)

    // Susun baris dari master tingkat_pendidikan
    const list: any[] = []
    const processedIds = new Set<number>()

    for (const mp of masterPendidikan) {
      const id = Number(mp.id)
      processedIds.add(id)
      const agg = aggMap.get(id) || { total_perkara: 0, total_anak: 0, calon_suami: 0, calon_istri: 0 }
      const persentase = grandTotalAnak > 0
        ? Math.round((agg.total_anak / grandTotalAnak) * 1000) / 10
        : 0

      list.push({
        id,
        kode: mp.kode || '-',
        nama: mp.nama,
        aktif: mp.aktif === 'Y',
        totalPerkara: agg.total_perkara,
        totalAnak: agg.total_anak,
        calonSuami: agg.calon_suami,
        calonIstri: agg.calon_istri,
        persentase
      })
    }

    // Periksa jika ada pendidikan_id = 99 (Lainnya / Tidak Diketahui / NULL) yang memiliki perkara
    for (const [pId, agg] of aggMap.entries()) {
      if (!processedIds.has(pId) && (agg.total_anak > 0 || agg.total_perkara > 0)) {
        const persentase = grandTotalAnak > 0
          ? Math.round((agg.total_anak / grandTotalAnak) * 1000) / 10
          : 0

        list.push({
          id: pId,
          kode: 'LAINNYA',
          nama: 'Lainnya / Tidak Diketahui',
          aktif: true,
          totalPerkara: agg.total_perkara,
          totalAnak: agg.total_anak,
          calonSuami: agg.calon_suami,
          calonIstri: agg.calon_istri,
          persentase
        })
      }
    }

    return serializeBigInt({
      success: true,
      year,
      month,
      kategori,
      list,
      grandTotal: {
        totalPerkara: grandTotalPerkara,
        totalAnak: grandTotalAnak,
        calonSuami: grandCalonSuami,
        calonIstri: grandCalonIstri,
        persentase: grandTotalAnak > 0 ? 100 : 0
      }
    })
  } catch (error: any) {
    console.error('Error fetching tabel pendidikan dispensasi:', error)
    return serializeBigInt({
      success: false,
      year,
      month,
      kategori,
      list: [],
      grandTotal: {
        totalPerkara: 0,
        totalAnak: 0,
        calonSuami: 0,
        calonIstri: 0,
        persentase: 0
      },
      error: error?.message || 'Terjadi kesalahan sistem'
    })
  }
})
