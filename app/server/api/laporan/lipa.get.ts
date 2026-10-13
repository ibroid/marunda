import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const month = query.month && !isNaN(Number(query.month)) ? Number(query.month) : currentMonth

  const monthStr = month < 10 ? `0${month}` : `${month}`
  const periode = `${year}-${monthStr}`
  const awalPeriode = `${periode}-01`

  try {
    // Helper function untuk menghitung metrik per alur perkara
    async function getLipaMetrics(alurId: number) {
      // 1. Sisa Bulan Lalu: Daftar sebelum awal periode, dan (Putus pada atau setelah periode INI atau belum putus sama sekali)
      const sisaLaluRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(a.perkara_id) AS total
        FROM perkara a
        LEFT JOIN perkara_putusan b ON b.perkara_id = a.perkara_id
        WHERE a.tanggal_pendaftaran < '${awalPeriode}'
          AND (DATE_FORMAT(b.tanggal_putusan, '%Y-%m') >= '${periode}' OR b.tanggal_putusan IS NULL)
          AND a.alur_perkara_id = ${alurId}
      `)
      const sisaLalu = Number(sisaLaluRes[0]?.total || 0)

      // 2. Diterima Bulan Ini
      const masukRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara
        WHERE DATE_FORMAT(tanggal_pendaftaran, '%Y-%m') = '${periode}'
          AND alur_perkara_id = ${alurId}
      `)
      const masuk = Number(masukRes[0]?.total || 0)

      // 3. Diputus Bulan Ini
      const putusRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(a.perkara_id) AS total
        FROM perkara a
        JOIN perkara_putusan b ON b.perkara_id = a.perkara_id
        WHERE DATE_FORMAT(b.tanggal_putusan, '%Y-%m') = '${periode}'
          AND a.alur_perkara_id = ${alurId}
      `)
      const putus = Number(putusRes[0]?.total || 0)

      // 4. Minutasi Bulan Ini
      const minutasiRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(a.perkara_id) AS total
        FROM perkara a
        JOIN perkara_putusan b ON b.perkara_id = a.perkara_id
        WHERE DATE_FORMAT(b.tanggal_minutasi, '%Y-%m') = '${periode}'
          AND a.alur_perkara_id = ${alurId}
      `)
      const minutasi = Number(minutasiRes[0]?.total || 0)

      // 5. Sisa Akhir
      const totalBeban = sisaLalu + masuk
      const sisaAkhir = Math.max(0, totalBeban - putus)
      const rasio = totalBeban > 0 ? Math.round((putus / totalBeban) * 100) : 0

      return {
        sisaLalu,
        masuk,
        totalBeban,
        putus,
        minutasi,
        sisaAkhir,
        rasio
      }
    }

    // Gugatan = 15, Permohonan = 16, Gugatan Sederhana = 17
    const gugatan = await getLipaMetrics(15)
    const permohonan = await getLipaMetrics(16)
    const gs = await getLipaMetrics(17)

    const total = {
      sisaLalu: gugatan.sisaLalu + permohonan.sisaLalu + gs.sisaLalu,
      masuk: gugatan.masuk + permohonan.masuk + gs.masuk,
      totalBeban: gugatan.totalBeban + permohonan.totalBeban + gs.totalBeban,
      putus: gugatan.putus + permohonan.putus + gs.putus,
      minutasi: gugatan.minutasi + permohonan.minutasi + gs.minutasi,
      sisaAkhir: gugatan.sisaAkhir + permohonan.sisaAkhir + gs.sisaAkhir,
      rasio: 0
    }
    total.rasio = total.totalBeban > 0 ? Math.round((total.putus / total.totalBeban) * 100) : 0

    return serializeBigInt({
      success: true,
      year,
      month,
      periode,
      lipa1: {
        gugatan,
        permohonan,
        gugatanSederhana: gs,
        total
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengalkulasi laporan LIPA 1'
    }
  }
})
