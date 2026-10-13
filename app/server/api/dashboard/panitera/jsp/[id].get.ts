import { defineEventHandler, getQuery, getRouterParam } from 'h3'
import { prisma, serializeBigInt } from '../../../../utils/db'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const jspId = idParam && !isNaN(Number(idParam)) ? Number(idParam) : null
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const tab = (query.tab as string) || 'pbt' // 'pbt' | 'tugas'
  const page = query.page && !isNaN(Number(query.page)) && Number(query.page) > 0 ? Number(query.page) : 1
  const limit = query.limit && !isNaN(Number(query.limit)) && Number(query.limit) > 0 ? Math.min(100, Number(query.limit)) : 10
  const offset = (page - 1) * limit
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  if (!jspId) {
    return {
      success: false,
      message: 'ID Jurusita tidak valid'
    }
  }

  try {
    // 1. Info Jurusita
    const jspRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, nama_gelar, nip, aktif
      FROM jurusita
      WHERE id = ${jspId}
      LIMIT 1
    `)

    if (!jspRes.length) {
      return {
        success: false,
        message: 'Data Jurusita tidak ditemukan'
      }
    }

    const jsp = jspRes[0]

    // 2. Query summary statistik (Tugas & PBT)
    const [statTugas, statPbt] = await Promise.all([
      // Total beban tugas penetapan tahun ini
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(p.perkara_id) AS total_tugas,
          SUM(CASE WHEN pp.perkara_id IS NOT NULL THEN 1 ELSE 0 END) AS sudah_putus,
          SUM(CASE WHEN pp.perkara_id IS NULL THEN 1 ELSE 0 END) AS sisa_perkara
        FROM perkara p
        JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
        LEFT JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
        WHERE pt.jurusita_id = ${jspId}
          AND p.tanggal_pendaftaran >= '${startDate}' AND p.tanggal_pendaftaran <= '${endDate}'
      `),

      // Total tunggakan PBT Tergugat
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(p.perkara_id) AS total_pbt
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
          AND COALESCE(
            (
              SELECT pj.jurusita_id
              FROM perkara_jurusita pj
              WHERE pj.perkara_id = p.perkara_id AND pj.aktif = 'Y'
              ORDER BY pj.urutan DESC
              LIMIT 1
            ),
            pt.jurusita_id
          ) = ${jspId}
      `)
    ])

    const totalTugas = Number(statTugas[0]?.total_tugas || 0)
    const sudahPutus = Number(statTugas[0]?.sudah_putus || 0)
    const sisaPerkara = Number(statTugas[0]?.sisa_perkara || 0)
    const totalPbt = Number(statPbt[0]?.total_pbt || 0)

    // 3. Ambil daftar perkara sesuai tab yang dipilih
    let daftar: any[] = []
    let totalItems = 0

    if (tab === 'pbt') {
      totalItems = totalPbt
      if (totalPbt > 0) {
        daftar = await prisma.$queryRawUnsafe<any[]>(`
          SELECT
            p.perkara_id,
            p.nomor_perkara,
            p.jenis_perkara_nama,
            p.para_pihak,
            p.proses_terakhir_text,
            pp.tanggal_putusan,
            pp.status_putusan_nama
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
            AND COALESCE(
              (
                SELECT pj.jurusita_id
                FROM perkara_jurusita pj
                WHERE pj.perkara_id = p.perkara_id AND pj.aktif = 'Y'
                ORDER BY pj.urutan DESC
                LIMIT 1
              ),
              pt.jurusita_id
            ) = ${jspId}
          ORDER BY pp.tanggal_putusan DESC
          LIMIT ${limit} OFFSET ${offset}
        `)
      }
    } else {
      // Tab 'tugas': Semua perkara yang ditugaskan ke JS ini tahun ini
      totalItems = totalTugas
      if (totalTugas > 0) {
        daftar = await prisma.$queryRawUnsafe<any[]>(`
          SELECT
            p.perkara_id,
            p.nomor_perkara,
            p.jenis_perkara_nama,
            p.para_pihak,
            p.tanggal_pendaftaran,
            p.proses_terakhir_text,
            pp.tanggal_putusan,
            pp.tanggal_bht,
            pp.status_putusan_nama
          FROM perkara p
          JOIN perkara_penetapan pt ON p.perkara_id = pt.perkara_id
          LEFT JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
          WHERE pt.jurusita_id = ${jspId}
            AND p.tanggal_pendaftaran >= '${startDate}' AND p.tanggal_pendaftaran <= '${endDate}'
          ORDER BY p.tanggal_pendaftaran DESC
          LIMIT ${limit} OFFSET ${offset}
        `)
      }
    }

    return serializeBigInt({
      success: true,
      year,
      tab,
      page,
      limit,
      total: totalItems,
      jurusita: {
        id: jsp.id,
        nama: jsp.nama_gelar || '-',
        nip: jsp.nip || '-',
        aktif: jsp.aktif
      },
      summary: {
        totalTugas,
        sudahPutus,
        sisaPerkara,
        totalPbt
      },
      daftar
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat memuat data kinerja Jurusita'
    }
  }
})
