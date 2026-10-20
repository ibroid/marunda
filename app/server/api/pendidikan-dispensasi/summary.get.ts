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
    const [satkerRes, summaryRes, topPendidikanRes, countAktifRes] = await Promise.all([
      // 1. Ambil Nama Satker
      prisma.$queryRawUnsafe<any[]>(
        `SELECT value FROM sys_config WHERE id = 62 OR name = 'NamaPN' LIMIT 1`
      ).catch(() => [{ value: 'PENGADILAN AGAMA JAKARTA UTARA' }]),

      // 2. Summary Statistik Dispensasi Nikah
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(DISTINCT p.perkara_id) AS total_perkara,
          COUNT(m.id) AS total_anak,
          COUNT(DISTINCT CASE WHEN m.jenis_mempelai = '1' THEN m.id END) AS calon_suami,
          COUNT(DISTINCT CASE WHEN m.jenis_mempelai = '2' THEN m.id END) AS calon_istri
        FROM perkara p
        JOIN perkara_mempelai_dk m ON m.perkara_id = p.perkara_id
        WHERE ${dateCondition} ${jenisCondition} ${anakCondition}
      `).catch(() => [{ total_perkara: 0, total_anak: 0, calon_suami: 0, calon_istri: 0 }]),

      // 3. Tingkat Pendidikan Anak Terbanyak (Top 1)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COALESCE(tp.id, 99) AS id,
          COALESCE(tp.kode, 'LAINNYA') AS kode,
          COALESCE(tp.nama, 'Lainnya / Tidak Diketahui') AS nama,
          COUNT(m.id) AS total_anak,
          COUNT(DISTINCT p.perkara_id) AS total_perkara
        FROM perkara p
        JOIN perkara_mempelai_dk m ON m.perkara_id = p.perkara_id
        LEFT JOIN tingkat_pendidikan tp ON tp.id = m.pendidikan
        WHERE ${dateCondition} ${jenisCondition} ${anakCondition}
        GROUP BY COALESCE(tp.id, 99), COALESCE(tp.kode, 'LAINNYA'), COALESCE(tp.nama, 'Lainnya / Tidak Diketahui')
        ORDER BY total_anak DESC
        LIMIT 1
      `).catch(() => []),

      // 4. Jumlah klasifikasi pendidikan aktif yang memiliki perkara
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(DISTINCT COALESCE(m.pendidikan, 99)) AS pendidikan_aktif
        FROM perkara p
        JOIN perkara_mempelai_dk m ON m.perkara_id = p.perkara_id
        WHERE ${dateCondition} ${jenisCondition} ${anakCondition}
      `).catch(() => [{ pendidikan_aktif: 0 }])
    ])

    const namaSatker = satkerRes[0]?.value || 'PENGADILAN AGAMA JAKARTA UTARA'
    const s = summaryRes[0] || {}
    const totalPerkara = Number(s.total_perkara || 0)
    const totalAnak = Number(s.total_anak || 0)
    const calonSuami = Number(s.calon_suami || 0)
    const calonIstri = Number(s.calon_istri || 0)
    const pendidikanAktif = Number(countAktifRes[0]?.pendidikan_aktif || 0)

    const persentaseSuami = totalAnak > 0 ? Math.round((calonSuami / totalAnak) * 1000) / 10 : 0
    const persentaseIstri = totalAnak > 0 ? Math.round((calonIstri / totalAnak) * 1000) / 10 : 0

    let topPendidikan: any = null
    if (topPendidikanRes.length > 0) {
      const top = topPendidikanRes[0]
      const topAnak = Number(top.total_anak || 0)
      const topPerkara = Number(top.total_perkara || 0)
      const persentase = totalAnak > 0 ? Math.round((topAnak / totalAnak) * 1000) / 10 : 0

      topPendidikan = {
        id: Number(top.id),
        kode: top.kode,
        nama: top.nama,
        totalAnak: topAnak,
        totalPerkara: topPerkara,
        persentase
      }
    }

    return serializeBigInt({
      success: true,
      year,
      month,
      kategori,
      namaSatker,
      summary: {
        totalPerkara,
        totalAnak,
        calonSuami,
        calonIstri,
        persentaseSuami,
        persentaseIstri,
        pendidikanAktif,
        topPendidikan
      }
    })
  } catch (error: any) {
    console.error('Error fetching pendidikan dispensasi summary:', error)
    return serializeBigInt({
      success: false,
      year,
      month,
      kategori,
      namaSatker: 'PENGADILAN AGAMA JAKARTA UTARA',
      summary: {
        totalPerkara: 0,
        totalAnak: 0,
        calonSuami: 0,
        calonIstri: 0,
        persentaseSuami: 0,
        persentaseIstri: 0,
        pendidikanAktif: 0,
        topPendidikan: null
      },
      error: error?.message || 'Terjadi kesalahan sistem'
    })
  }
})
