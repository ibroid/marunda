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
    const [advokatRows, totalPerkaraRows] = await Promise.all([
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

      // 2. Total agregat perkara yang ditangani (cepat)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(id) AS total
        FROM perkara_pengacara
        WHERE pengacara_id = ${id}
      `)
    ])

    if (!advokatRows.length) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Data advokat tidak ditemukan'
      })
    }

    const advokat = advokatRows[0]
    advokat.total_perkara = Number(totalPerkaraRows[0]?.total || 0)

    return serializeBigInt({
      success: true,
      advokat
    })
  } catch (error: any) {
    console.error('Error fetching advokat detail:', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal memuat detail data advokat'
    })
  }
})
