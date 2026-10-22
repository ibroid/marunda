import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const month = query.month && !isNaN(Number(query.month)) ? Number(query.month) : currentMonth

  const monthStr = month < 10 ? `0${month}` : `${month}`
  const periode = `${year}-${monthStr}`
  const awalPeriode = `${periode}-01`

  // Hitung tanggal akhir bulan
  const lastDay = new Date(year, month, 0).getDate()
  const tglLaporan = `${periode}-${String(lastDay).padStart(2, '0')}`

  try {
    // Ambil nama satker
    const satkerRes = await prisma.$queryRawUnsafe<any[]>(
      `SELECT value FROM sys_config WHERE id = 62 OR name = 'NamaPN' LIMIT 1`
    ).catch(() => [])
    const namaSatker = satkerRes.length > 0 && satkerRes[0]?.value ? satkerRes[0].value : 'PENGADILAN AGAMA JAKARTA UTARA'

    // Helper kueri per alur perkara (15: G, 16: P, 17: G.S)
    async function getRekapAlur(alurId: number) {
      // 1. Sisa bulan lalu
      const sisaLaluRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(a.perkara_id) AS total
        FROM perkara AS a
        LEFT JOIN perkara_putusan AS b ON b.perkara_id = a.perkara_id
        WHERE a.tanggal_pendaftaran < '${awalPeriode}'
          AND (LEFT(b.tanggal_putusan, 7) >= '${periode}' OR b.tanggal_putusan IS NULL)
          AND a.alur_perkara_id = ${alurId}
      `).catch(() => [{ total: 0 }])
      const sisaBulanLalu = Number(sisaLaluRes[0]?.total || 0)

      // 2. Terima bulan ini
      const terimaRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara
        WHERE LEFT(tanggal_pendaftaran, 7) = '${periode}'
          AND alur_perkara_id = ${alurId}
      `).catch(() => [{ total: 0 }])
      const terimaBulanIni = Number(terimaRes[0]?.total || 0)

      // 3. Putus bulan ini
      const putusRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(b.perkara_id) AS total
        FROM perkara AS a
        LEFT JOIN perkara_putusan AS b ON b.perkara_id = a.perkara_id
        WHERE LEFT(b.tanggal_putusan, 7) = '${periode}'
          AND a.alur_perkara_id = ${alurId}
      `).catch(() => [{ total: 0 }])
      const putus = Number(putusRes[0]?.total || 0)

      // 4. Sisa akhir bulan
      const sisaAkhirBulan = sisaBulanLalu + terimaBulanIni - putus

      // 4.b. Belum dibagi
      const belumDibagiRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(a.perkara_id) AS total
        FROM perkara AS a
        LEFT JOIN perkara_penetapan AS b ON b.perkara_id = a.perkara_id
        LEFT JOIN perkara_putusan AS c ON c.perkara_id = a.perkara_id
        WHERE LEFT(a.tanggal_pendaftaran, 7) <= '${periode}'
          AND a.alur_perkara_id = ${alurId}
          AND (b.penetapan_majelis_hakim IS NULL OR LEFT(b.penetapan_majelis_hakim, 7) > '${periode}')
          AND (c.tanggal_putusan IS NULL OR LEFT(c.tanggal_putusan, 7) >= '${periode}')
      `).catch(() => [{ total: 0 }])
      const belumDibagi = Number(belumDibagiRes[0]?.total || 0)

      // 4.a. Sudah dibagi
      const sudahDibagi = sisaAkhirBulan - belumDibagi

      // 5. Sisa belum diminutasi
      const belumMinutasiRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(a.perkara_id) AS total
        FROM perkara AS a
        LEFT JOIN perkara_putusan AS b ON b.perkara_id = a.perkara_id
        WHERE LEFT(a.tanggal_pendaftaran, 7) <= '${periode}'
          AND a.alur_perkara_id = ${alurId}
          AND (b.tanggal_minutasi IS NULL OR LEFT(b.tanggal_minutasi, 7) > '${periode}' OR b.tanggal_minutasi = '0000-00-00' OR b.tanggal_minutasi = '')
          AND b.tanggal_putusan <= '${tglLaporan}'
          AND b.tanggal_putusan IS NOT NULL
      `).catch(() => [{ total: 0 }])
      const sisaBelumMinutasi = Number(belumMinutasiRes[0]?.total || 0)

      return {
        sisaBulanLalu,
        terimaBulanIni,
        putus,
        sisaAkhirBulan,
        sudahDibagi,
        belumDibagi,
        sisaBelumMinutasi
      }
    }

    // Eksekusi paralel untuk G (15), P (16), G.S (17)
    const [rekapG, rekapP, rekapGS] = await Promise.all([
      getRekapAlur(15),
      getRekapAlur(16),
      getRekapAlur(17)
    ])

    const total = {
      sisaBulanLalu: rekapG.sisaBulanLalu + rekapP.sisaBulanLalu + rekapGS.sisaBulanLalu,
      terimaBulanIni: rekapG.terimaBulanIni + rekapP.terimaBulanIni + rekapGS.terimaBulanIni,
      putus: rekapG.putus + rekapP.putus + rekapGS.putus,
      sisaAkhirBulan: rekapG.sisaAkhirBulan + rekapP.sisaAkhirBulan + rekapGS.sisaAkhirBulan,
      sudahDibagi: rekapG.sudahDibagi + rekapP.sudahDibagi + rekapGS.sudahDibagi,
      belumDibagi: rekapG.belumDibagi + rekapP.belumDibagi + rekapGS.belumDibagi,
      sisaBelumMinutasi: rekapG.sisaBelumMinutasi + rekapP.sisaBelumMinutasi + rekapGS.sisaBelumMinutasi
    }

    return serializeBigInt({
      success: true,
      year,
      month,
      periode,
      tglLaporan,
      namaSatker,
      rekap: {
        g: rekapG,
        p: rekapP,
        gs: rekapGS,
        total
      }
    })
  } catch (error: any) {
    console.error('Error in lipa1/rekap:', error)
    return {
      success: false,
      message: error?.message || 'Terjadi kesalahan saat memuat rekapitulasi LIPA 1',
      rekap: {
        g: { sisaBulanLalu: 0, terimaBulanIni: 0, putus: 0, sisaAkhirBulan: 0, sudahDibagi: 0, belumDibagi: 0, sisaBelumMinutasi: 0 },
        p: { sisaBulanLalu: 0, terimaBulanIni: 0, putus: 0, sisaAkhirBulan: 0, sudahDibagi: 0, belumDibagi: 0, sisaBelumMinutasi: 0 },
        gs: { sisaBulanLalu: 0, terimaBulanIni: 0, putus: 0, sisaAkhirBulan: 0, sudahDibagi: 0, belumDibagi: 0, sisaBelumMinutasi: 0 },
        total: { sisaBulanLalu: 0, terimaBulanIni: 0, putus: 0, sisaAkhirBulan: 0, sudahDibagi: 0, belumDibagi: 0, sisaBelumMinutasi: 0 }
      }
    }
  }
})
