import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`
  const endDateTime = `${year}-12-31 23:59:59`

  try {
    // 1-8. Jalankan query-query utama secara paralel menggunakan Promise.all & SARGABLE Date Ranges
    const [
      satkerQuery,
      basQuery,
      penetapanAdminQuery,
      ppQuery,
      jspQuery,
      pbtJspQuery,
      keuanganQuery,
      aktaCeraiQuery,
      minutasiQuery
    ] = await Promise.all([
      // 1. Ambil Nama Satker
      prisma.$queryRawUnsafe<any[]>(
        `SELECT value FROM sys_config WHERE id = 62 OR name = 'NamaPN' LIMIT 1`
      ),

      // 2. Kepatuhan Berita Acara Sidang (BAS) Total (Menggunakan range tanggal untuk index)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(js.id) AS total_sidang,
          SUM(CASE WHEN js.edoc_bas IS NOT NULL AND js.edoc_bas != '' THEN 1 ELSE 0 END) AS bas_ada,
          SUM(CASE WHEN js.edoc_bas IS NULL OR js.edoc_bas = '' THEN 1 ELSE 0 END) AS bas_kosong
        FROM perkara_jadwal_sidang js
        WHERE js.tanggal_sidang >= '${startDate}' AND js.tanggal_sidang <= '${endDate}'
      `),

      // 3. Status Penetapan Administrasi (Single pass scan dengan filter range)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          SUM(CASE WHEN pt.panitera_pengganti_id IS NULL OR pt.panitera_pengganti_id = 0 THEN 1 ELSE 0 END) AS belum_pp,
          SUM(CASE WHEN pt.jurusita_id IS NULL OR pt.jurusita_id = 0 THEN 1 ELSE 0 END) AS belum_jsp
        FROM perkara p
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        WHERE p.tanggal_pendaftaran >= '${startDate}' AND p.tanggal_pendaftaran <= '${endDate}'
      `),

      // 4. Kinerja & Kepatuhan Upload BAS per Panitera Pengganti (PP)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          p.id AS pp_id,
          p.nama_gelar AS nama,
          COUNT(js.id) AS total_sidang,
          SUM(CASE WHEN js.edoc_bas IS NOT NULL AND js.edoc_bas != '' THEN 1 ELSE 0 END) AS bas_ada,
          SUM(CASE WHEN js.edoc_bas IS NULL OR js.edoc_bas = '' THEN 1 ELSE 0 END) AS bas_kosong
        FROM perkara_jadwal_sidang js
        JOIN perkara_penetapan pt ON pt.perkara_id = js.perkara_id
        JOIN panitera_pn p ON p.id = pt.panitera_pengganti_id
        WHERE js.tanggal_sidang >= '${startDate}' AND js.tanggal_sidang <= '${endDate}'
        GROUP BY p.id, p.nama_gelar
        ORDER BY bas_kosong DESC, total_sidang DESC
      `),

      // 5. Kinerja & Beban Tugas Jurusita (JSP)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          j.id AS jsp_id,
          j.nama_gelar AS nama,
          COUNT(pt.perkara_id) AS total_tugas
        FROM perkara p
        JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        JOIN jurusita j ON j.id = pt.jurusita_id
        WHERE p.tanggal_pendaftaran >= '${startDate}' AND p.tanggal_pendaftaran <= '${endDate}'
        GROUP BY j.id, j.nama_gelar
        ORDER BY total_tugas DESC
      `),

      // 6. Tunggakan Pemberitahuan Isi Putusan (PBT) Belum Dilaksanakan per Jurusita
      // Verstek (status_putusan_id = 62, putusan_verstek = 'Y'), belum BHT, dan belum ada PBT pihak 2
      // Aturan JS: Jika 1 JS bertugas, JS 1 bertanggung jawab; jika 2 JS bertugas, JS 2 (urutan tertinggi) bertanggung jawab
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COALESCE(
            (
              SELECT pj.jurusita_id
              FROM perkara_jurusita pj
              WHERE pj.perkara_id = p.perkara_id AND pj.aktif = 'Y'
              ORDER BY pj.urutan DESC
              LIMIT 1
            ),
            pt.jurusita_id
          ) AS jsp_id,
          COUNT(p.perkara_id) AS total_belum_pbt
        FROM perkara p
        JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        LEFT JOIN perkara_putusan_pemberitahuan_putusan pbt
          ON pbt.perkara_id = p.perkara_id
          AND pbt.pihak = 2
          AND (
            pbt.tanggal_pemberitahuan_putusan IS NOT NULL
            OR (pbt.edoc_pbt IS NOT NULL AND pbt.edoc_pbt != '')
            OR (pbt.edoc_resi IS NOT NULL AND pbt.edoc_resi != '')
          )
        WHERE pp.status_putusan_id = 62
          AND pp.putusan_verstek = 'Y'
          AND (pp.tanggal_bht IS NULL OR pp.tanggal_bht = '' OR pp.tanggal_bht = '0000-00-00')
          AND pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND pbt.id IS NULL
        GROUP BY jsp_id
      `),

      // 7. Monitoring Keuangan Kas Perkara (FORCE INDEX tanggal_transaksi)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          SUM(CASE WHEN jenis_transaksi = 1 THEN jumlah ELSE 0 END) AS total_masuk,
          SUM(CASE WHEN jenis_transaksi = -1 OR jenis_transaksi = 2 THEN jumlah ELSE 0 END) AS total_keluar
        FROM perkara_biaya FORCE INDEX (tanggal_transaksi)
        WHERE tanggal_transaksi >= '${startDate}' AND tanggal_transaksi <= '${endDateTime}'
          AND tahapan_id < 99
      `),

      // 8. Pengawasan Produk Pasca Putus: Akta Cerai & Ikrar Talak
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          (SELECT COUNT(p.perkara_id)
           FROM perkara_putusan pp
           JOIN perkara p ON p.perkara_id = pp.perkara_id
           LEFT JOIN perkara_akta_cerai ac ON p.perkara_id = ac.perkara_id
           WHERE p.jenis_perkara_id = 347
             AND pp.tanggal_bht >= '${startDate}' AND pp.tanggal_bht <= '${endDate}'
             AND (ac.nomor_akta_cerai IS NULL OR ac.nomor_akta_cerai = '')
          ) AS cg_belum_ac,
          (SELECT COUNT(p.perkara_id)
           FROM perkara_putusan pp
           JOIN perkara p ON p.perkara_id = pp.perkara_id
           LEFT JOIN perkara_ikrar_talak it ON p.perkara_id = it.perkara_id
           WHERE p.jenis_perkara_id = 346
             AND pp.tanggal_bht >= '${startDate}' AND pp.tanggal_bht <= '${endDate}'
             AND (it.tgl_ikrar_talak IS NULL)
          ) AS ct_belum_ikrar
      `),

      // 9. Perkara Putus Belum Minutasi
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(pp.perkara_id) AS belum_minutasi
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi = '')
      `)
    ])

    const namaSatker = satkerQuery.length > 0 ? satkerQuery[0].value : 'Pengadilan Agama'

    const belumMinutasi = Number(minutasiQuery[0]?.belum_minutasi || 0)

    const totalSidang = Number(basQuery[0]?.total_sidang || 0)
    const basAda = Number(basQuery[0]?.bas_ada || 0)
    const basKosong = Number(basQuery[0]?.bas_kosong || 0)
    const rasioKepatuhanBas = totalSidang > 0 ? Number(((basAda / totalSidang) * 100).toFixed(1)) : 0

    const belumPp = Number(penetapanAdminQuery[0]?.belum_pp || 0)
    const belumJsp = Number(penetapanAdminQuery[0]?.belum_jsp || 0)

    const daftarKinerjaPP = ppQuery.map((item) => {
      const tot = Number(item.total_sidang || 0)
      const ada = Number(item.bas_ada || 0)
      const ksg = Number(item.bas_kosong || 0)
      const kepatuhan = tot > 0 ? Number(((ada / tot) * 100).toFixed(1)) : 100
      let statusColor = 'green'
      if (kepatuhan < 75) statusColor = 'red'
      else if (kepatuhan < 90) statusColor = 'amber'

      return {
        id: item.pp_id,
        nama: item.nama || '-',
        totalSidang: tot,
        basAda: ada,
        basKosong: ksg,
        kepatuhan,
        statusColor
      }
    })

    const pbtMap = new Map<string, number>()
    for (const item of pbtJspQuery) {
      if (item.jsp_id) {
        pbtMap.set(String(item.jsp_id), Number(item.total_belum_pbt || 0))
      }
    }

    let totalBelumPbt = 0
    for (const val of pbtMap.values()) {
      totalBelumPbt += val
    }

    const daftarKinerjaJSP = jspQuery.map((item) => {
      const belumPbt = pbtMap.get(String(item.jsp_id)) || 0
      return {
        id: item.jsp_id,
        nama: item.nama || '-',
        totalTugas: Number(item.total_tugas || 0),
        belumPbt
      }
    })

    const totalMasuk = Number(keuanganQuery[0]?.total_masuk || 0)
    const totalKeluar = Number(keuanganQuery[0]?.total_keluar || 0)
    const saldoKas = totalMasuk - totalKeluar

    const cgBelumAc = Number(aktaCeraiQuery[0]?.cg_belum_ac || 0)
    const ctBelumIkrar = Number(aktaCeraiQuery[0]?.ct_belum_ikrar || 0)

    // Jalankan query detail (Top 10) secara paralel hanya jika terdapat data (> 0)
    const [daftarCgBelumAc, daftarCtBelumIkrar, daftarBelumPp] = await Promise.all([
      // Daftar Cerai Gugat BHT Belum Akta Cerai (Top 10)
      cgBelumAc > 0
        ? prisma.$queryRawUnsafe<any[]>(`
            SELECT
              p.perkara_id,
              p.nomor_perkara,
              p.para_pihak,
              pp.tanggal_putusan,
              pp.tanggal_bht
            FROM perkara_putusan pp
            JOIN perkara p ON p.perkara_id = pp.perkara_id
            LEFT JOIN perkara_akta_cerai ac ON p.perkara_id = ac.perkara_id
            WHERE p.jenis_perkara_id = 347
              AND pp.tanggal_bht >= '${startDate}' AND pp.tanggal_bht <= '${endDate}'
              AND (ac.nomor_akta_cerai IS NULL OR ac.nomor_akta_cerai = '')
            ORDER BY pp.tanggal_bht DESC
            LIMIT 10
          `)
        : Promise.resolve([]),

      // Daftar Cerai Talak BHT Belum Ikrar (Top 10)
      ctBelumIkrar > 0
        ? prisma.$queryRawUnsafe<any[]>(`
            SELECT
              p.perkara_id,
              p.nomor_perkara,
              p.para_pihak,
              pp.tanggal_putusan,
              pp.tanggal_bht
            FROM perkara_putusan pp
            JOIN perkara p ON p.perkara_id = pp.perkara_id
            LEFT JOIN perkara_ikrar_talak it ON p.perkara_id = it.perkara_id
            WHERE p.jenis_perkara_id = 346
              AND pp.tanggal_bht >= '${startDate}' AND pp.tanggal_bht <= '${endDate}'
              AND (it.tgl_ikrar_talak IS NULL)
            ORDER BY pp.tanggal_bht DESC
            LIMIT 10
          `)
        : Promise.resolve([]),

      // Perkara Belum Ditunjuk PP (Top 10)
      belumPp > 0
        ? prisma.$queryRawUnsafe<any[]>(`
            SELECT p.perkara_id, p.nomor_perkara, p.tanggal_pendaftaran, p.jenis_perkara_nama, p.para_pihak
            FROM perkara p
            LEFT JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
            WHERE p.tanggal_pendaftaran >= '${startDate}' AND p.tanggal_pendaftaran <= '${endDate}'
              AND (pt.panitera_pengganti_id IS NULL OR pt.panitera_pengganti_id = 0)
            ORDER BY p.tanggal_pendaftaran DESC
            LIMIT 10
          `)
        : Promise.resolve([])
    ])

    return serializeBigInt({
      success: true,
      year,
      namaSatker,
      summary: {
        totalSidang,
        basAda,
        basKosong,
        rasioKepatuhanBas,
        belumPp,
        belumJsp,
        totalPP: daftarKinerjaPP.length,
        totalJSP: daftarKinerjaJSP.length,
        totalMasukKeuangan: totalMasuk,
        totalKeluarKeuangan: totalKeluar,
        saldoKas,
        cgBelumAc,
        ctBelumIkrar,
        totalBelumPbt,
        belumMinutasi
      },
      kinerjaPP: daftarKinerjaPP,
      kinerjaJSP: daftarKinerjaJSP,
      keuangan: {
        totalMasuk,
        totalKeluar,
        saldoKas
      },
      aktaCeraiDanIkrar: {
        cgBelumAc,
        ctBelumIkrar,
        daftarCg: daftarCgBelumAc,
        daftarCt: daftarCtBelumIkrar
      },
      atensi: {
        belumPp: {
          total: belumPp,
          daftar: daftarBelumPp
        },
        belumMinutasi: {
          total: belumMinutasi
        }
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil data Dashboard Panitera'
    }
  }
})
