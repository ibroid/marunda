import { defineEventHandler, getQuery, createError } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = Number(query.id)

  if (!id || isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID saksi tidak valid'
    })
  }

  try {
    // 1. Data utama saksi dan perkaranya
    const saksiRows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        pp5.id AS saksi_id,
        pp5.perkara_id,
        pp5.urutan,
        pp5.saksi_pihak_ke,
        pp5.jenis_saksi,
        pp5.keterangan AS keterangan_saksi,
        COALESCE(ph.nama, pp5.nama, 'Nama Belum Tercatat') AS nama,
        COALESCE(ph.alamat, pp5.alamat, '-') AS alamat,
        ph.id AS pihak_id,
        ph.nomor_indentitas,
        ph.tempat_lahir,
        DATE_FORMAT(ph.tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir,
        ph.jenis_kelamin,
        ph.agama_nama,
        ph.pekerjaan,
        ph.pendidikan,
        ph.telepon,
        ph.email,
        ph.status_kawin,
        CASE ph.status_kawin
          WHEN '1' THEN 'Kawin'
          WHEN '2' THEN 'Belum Kawin'
          WHEN '3' THEN 'Cerai Hidup'
          WHEN '4' THEN 'Cerai Mati'
          ELSE '-'
        END AS status_kawin_text,
        ph.warga_negara,
        ph.nama_ayah,
        ph.nama_ibu,
        p.nomor_perkara,
        p.jenis_perkara_nama,
        DATE_FORMAT(p.tanggal_pendaftaran, '%Y-%m-%d') AS tanggal_pendaftaran,
        p.pihak1_text,
        p.pihak2_text,
        p.proses_terakhir_text,
        DATE_FORMAT(pput.tanggal_putusan, '%Y-%m-%d') AS tanggal_putusan,
        sp.nama AS status_putusan_nama
      FROM perkara_pihak5 pp5
      LEFT JOIN pihak ph ON pp5.pihak_id = ph.id
      LEFT JOIN perkara p ON pp5.perkara_id = p.perkara_id
      LEFT JOIN perkara_putusan pput ON pput.perkara_id = p.perkara_id
      LEFT JOIN status_putusan sp ON sp.id = pput.status_putusan_id
      WHERE pp5.id = ${id}
      LIMIT 1
    `)

    if (!saksiRows || saksiRows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Data saksi tidak ditemukan'
      })
    }

    const saksi = saksiRows[0]
    const pihakId = saksi.pihak_id ? Number(saksi.pihak_id) : null

    // 2. Fetch Keterangan Saksi / Transkrip BAP dan Riwayat Perkara Lain secara paralel
    const [keteranganRows, otherCasesRows] = await Promise.all([
      // Keterangan / tanya jawab di persidangan
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          pks.id,
          pks.sidang_id,
          pks.penanya_id,
          pks.urutan_pertanyaan,
          pks.pertanyaan,
          pks.jawaban,
          DATE_FORMAT(pjs.tanggal_sidang, '%Y-%m-%d') AS tanggal_sidang,
          pjs.agenda
        FROM perkara_keterangan_saksi pks
        LEFT JOIN perkara_jadwal_sidang pjs ON pks.sidang_id = pjs.id
        WHERE pks.saksi_id = ${id}
        ORDER BY pks.sidang_id ASC, pks.urutan_pertanyaan ASC, pks.id ASC
      `),

      // Perkara lain yang pernah disaksikan oleh orang yang sama
      pihakId
        ? prisma.$queryRawUnsafe<any[]>(`
            SELECT
              pp5_other.id AS saksi_id,
              pp5_other.perkara_id,
              pp5_other.saksi_pihak_ke,
              pp5_other.urutan,
              pp5_other.jenis_saksi,
              pp5_other.keterangan AS keterangan_saksi,
              p.nomor_perkara,
              p.jenis_perkara_nama,
              DATE_FORMAT(p.tanggal_pendaftaran, '%Y-%m-%d') AS tanggal_pendaftaran,
              p.pihak1_text,
              p.pihak2_text,
              p.proses_terakhir_text,
              DATE_FORMAT(pput.tanggal_putusan, '%Y-%m-%d') AS tanggal_putusan,
              sp.nama AS status_putusan_nama
            FROM perkara_pihak5 pp5_other
            JOIN perkara p ON pp5_other.perkara_id = p.perkara_id
            LEFT JOIN perkara_putusan pput ON pput.perkara_id = p.perkara_id
            LEFT JOIN status_putusan sp ON sp.id = pput.status_putusan_id
            WHERE pp5_other.pihak_id = ${pihakId} AND pp5_other.id != ${id}
            ORDER BY p.tanggal_pendaftaran DESC, pp5_other.id DESC
          `)
        : Promise.resolve([])
    ])

    return serializeBigInt({
      success: true,
      data: {
        saksi,
        keterangan: keteranganRows || [],
        otherCases: otherCasesRows || []
      }
    })
  } catch (error: any) {
    console.error('Error fetching saksi detail:', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal memuat detail saksi'
    })
  }
})
