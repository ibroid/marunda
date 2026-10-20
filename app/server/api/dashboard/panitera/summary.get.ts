import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  try {
    const [
      satkerQuery,
      basQuery,
      minutasiQuery,
      pbtJspQuery,
      aktaCeraiQuery
    ] = await Promise.all([
      // 1. Ambil Nama Satker
      prisma.$queryRawUnsafe<any[]>(
        `SELECT value FROM sys_config WHERE id = 62 OR name = 'NamaPN' LIMIT 1`
      ),

      // 2. Kepatuhan Berita Acara Sidang (BAS) Total
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(js.id) AS total_sidang,
          SUM(CASE WHEN js.edoc_bas IS NOT NULL AND js.edoc_bas != '' THEN 1 ELSE 0 END) AS bas_ada,
          SUM(CASE WHEN js.edoc_bas IS NULL OR js.edoc_bas = '' THEN 1 ELSE 0 END) AS bas_kosong
        FROM perkara_jadwal_sidang js
        WHERE js.tanggal_sidang >= '${startDate}' AND js.tanggal_sidang <= '${endDate}'
          AND js.tanggal_sidang <= CURDATE()
      `),

      // 3. Perkara Putus Belum Minutasi
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(pp.perkara_id) AS belum_minutasi
        FROM perkara_putusan pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        WHERE pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
          AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi = '')
      `),

      // 4. Tunggakan PBT Total
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(p.perkara_id) AS total_belum_pbt
        FROM perkara p
        JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
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
      `),

      // 5. Akta Cerai & Ikrar Talak
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
      `)
    ])

    const namaSatker = satkerQuery.length > 0 ? satkerQuery[0].value : 'Pengadilan Agama'
    const totalSidang = Number(basQuery[0]?.total_sidang || 0)
    const basAda = Number(basQuery[0]?.bas_ada || 0)
    const basKosong = Number(basQuery[0]?.bas_kosong || 0)
    const rasioKepatuhanBas = totalSidang > 0 ? Number(((basAda / totalSidang) * 100).toFixed(1)) : 0
    const belumMinutasi = Number(minutasiQuery[0]?.belum_minutasi || 0)
    const totalBelumPbt = Number(pbtJspQuery[0]?.total_belum_pbt || 0)
    const cgBelumAc = Number(aktaCeraiQuery[0]?.cg_belum_ac || 0)
    const ctBelumIkrar = Number(aktaCeraiQuery[0]?.ct_belum_ikrar || 0)

    return serializeBigInt({
      success: true,
      year,
      namaSatker,
      summary: {
        totalSidang,
        basAda,
        basKosong,
        rasioKepatuhanBas,
        belumMinutasi,
        totalBelumPbt,
        cgBelumAc,
        ctBelumIkrar
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengambil data summary Panitera'
    }
  }
})
