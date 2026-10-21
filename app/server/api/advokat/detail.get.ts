import { defineEventHandler, getQuery, createError } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = Number(query.id)

  if (!id || isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID advokat tidak valid'
    })
  }

  try {
    const [advokatRows, cases] = await Promise.all([
      // 1. Profil lengkap advokat
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          ppg.pihak_id AS id,
          ph.nama,
          ppg.nomor_induk,
          COALESCE(ppg.alamat_kantor, ph.alamat) AS alamat_kantor,
          ph.alamat AS alamat_rumah,
          ph.telepon,
          ph.email,
          ph.fax,
          ppg.no_sk_menkeh,
          DATE_FORMAT(ppg.tanggal_sk_menkeh, '%Y-%m-%d') AS tanggal_sk_menkeh,
          DATE_FORMAT(ppg.tanggal_penyumpahan_pn, '%Y-%m-%d') AS tanggal_penyumpahan_pn,
          DATE_FORMAT(ppg.tanggal_penyumpahan_pt, '%Y-%m-%d') AS tanggal_penyumpahan_pt,
          ppg.pangkat,
          ppg.jabatan,
          ppg.kesatuan,
          ph.diinput_oleh,
          DATE_FORMAT(ph.diinput_tanggal, '%Y-%m-%d %H:%i:%s') AS diinput_tanggal,
          ph.diperbaharui_oleh,
          DATE_FORMAT(ph.diperbaharui_tanggal, '%Y-%m-%d %H:%i:%s') AS diperbaharui_tanggal
        FROM pihak_pengacara ppg
        JOIN pihak ph ON ph.id = ppg.pihak_id
        WHERE ppg.pihak_id = ${id}
        LIMIT 1
      `),

      // 2. Daftar perkara yang ditangani advokat ini
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          pp.id AS perkara_pengacara_id,
          pp.perkara_id,
          p.nomor_perkara,
          DATE_FORMAT(p.tanggal_pendaftaran, '%Y-%m-%d') AS tanggal_pendaftaran,
          p.jenis_perkara_nama,
          pp.pihak_ke,
          CASE pp.pihak_ke
            WHEN 1 THEN 'Penggugat / Pemohon'
            WHEN 2 THEN 'Tergugat / Termohon'
            ELSE CONCAT('Pihak ke-', pp.pihak_ke)
          END AS pihak_ke_text,
          pp.nomor_kuasa,
          DATE_FORMAT(pp.tanggal_kuasa, '%Y-%m-%d') AS tanggal_kuasa,
          pp.aktif,
          DATE_FORMAT(pput.tanggal_putusan, '%Y-%m-%d') AS tanggal_putusan,
          sp.nama AS status_putusan_nama,
          p.proses_terakhir_text,
          p.tahapan_terakhir_text
        FROM perkara_pengacara pp
        JOIN perkara p ON p.perkara_id = pp.perkara_id
        LEFT JOIN perkara_putusan pput ON pput.perkara_id = p.perkara_id
        LEFT JOIN status_putusan sp ON sp.id = pput.status_putusan_id
        WHERE pp.pengacara_id = ${id}
        ORDER BY p.tanggal_pendaftaran DESC, pp.id DESC
      `)
    ])

    if (!advokatRows.length) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Data advokat tidak ditemukan'
      })
    }

    return serializeBigInt({
      success: true,
      advokat: advokatRows[0],
      perkara: cases
    })
  } catch (error: any) {
    console.error('Error fetching advokat detail:', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal memuat detail data advokat'
    })
  }
})
