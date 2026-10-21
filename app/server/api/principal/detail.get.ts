import { defineEventHandler, getQuery, createError } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = Number(query.id)

  if (!id || isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID pihak tidak valid'
    })
  }

  try {
    const [pihakRows, cases] = await Promise.all([
      // 1. Data detail pihak
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          ph.id,
          ph.nama,
          ph.jenis_pihak_id,
          CASE ph.jenis_pihak_id
            WHEN 1 THEN 'Perorangan'
            WHEN 2 THEN 'Pemerintah'
            WHEN 3 THEN 'Badan Hukum'
            WHEN 4 THEN 'Pemerintah Daerah'
            ELSE 'Lainnya'
          END AS jenis_pihak_nama,
          ph.jenis_indentitas,
          COALESCE(ji.nama, CASE ph.jenis_indentitas WHEN '4' THEN 'KTP' WHEN '6' THEN 'SIM' WHEN '5' THEN 'Paspor' ELSE 'Identitas' END) AS jenis_indentitas_nama,
          ph.nomor_indentitas,
          ph.tempat_lahir,
          DATE_FORMAT(ph.tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir,
          ph.jenis_kelamin,
          ph.golongan_darah,
          ph.alamat,
          ph.rtrw,
          COALESCE(rkel.kelurahan_nama, ph.kelurahan, '-') AS kelurahan_nama,
          COALESCE(rk.kecamatan_nama, ph.kecamatan, '-') AS kecamatan_nama,
          ph.kabupaten,
          ph.propinsi,
          ph.telepon,
          ph.fax,
          ph.email,
          ph.agama_nama,
          CASE ph.status_kawin
            WHEN '1' THEN 'Kawin'
            WHEN '2' THEN 'Belum Kawin'
            WHEN '3' THEN 'Cerai Hidup'
            WHEN '4' THEN 'Cerai Mati'
            ELSE '-'
          END AS status_kawin_text,
          ph.pekerjaan,
          ph.pendidikan,
          ph.warga_negara,
          ph.nama_ayah,
          ph.nama_ibu,
          ph.keterangan,
          ph.difabel,
          ph.diinput_oleh,
          DATE_FORMAT(ph.diinput_tanggal, '%Y-%m-%d %H:%i:%s') AS diinput_tanggal,
          ph.diperbaharui_oleh,
          DATE_FORMAT(ph.diperbaharui_tanggal, '%Y-%m-%d %H:%i:%s') AS diperbaharui_tanggal
        FROM pihak ph
        LEFT JOIN jenis_identitas ji ON ji.id = ph.jenis_indentitas
        LEFT JOIN ref_kecamatan_new rk ON (rk.kecamatan_kode = ph.kecamatan OR rk.kecamatan_nama = ph.kecamatan)
        LEFT JOIN ref_kelurahan_new rkel ON (rkel.kelurahan_kode = ph.kelurahan OR rkel.kelurahan_nama = ph.kelurahan)
        WHERE ph.id = ${id}
        LIMIT 1
      `),

      // 2. Daftar perkara yang melibatkan pihak ini
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          vpp.perkara_id,
          vpp.nomor_perkara,
          DATE_FORMAT(vpp.tanggal_pendaftaran, '%Y-%m-%d') AS tanggal_pendaftaran,
          vpp.jenis_perkara_nama,
          vpp.status_perkara,
          vpp.pihak_ke,
          vpp.urutan,
          vpp.proses_terakhir_text,
          vpp.tahapan_terakhir_text,
          DATE_FORMAT(pput.tanggal_putusan, '%Y-%m-%d') AS tanggal_putusan,
          sp.nama AS status_putusan_nama
        FROM v_pihak_perkara vpp
        LEFT JOIN perkara_putusan pput ON pput.perkara_id = vpp.perkara_id
        LEFT JOIN status_putusan sp ON sp.id = pput.status_putusan_id
        WHERE vpp.pihak_id = ${id}
        ORDER BY vpp.tanggal_pendaftaran DESC, vpp.perkara_id DESC
      `)
    ])

    if (!pihakRows.length) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Data pihak tidak ditemukan'
      })
    }

    return serializeBigInt({
      success: true,
      pihak: pihakRows[0],
      perkara: cases
    })
  } catch (error: any) {
    console.error('Error fetching principal detail:', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal memuat detail data pihak'
    })
  }
})
