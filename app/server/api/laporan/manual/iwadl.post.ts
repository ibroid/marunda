import { defineEventHandler, readBody } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { action, nomor_perkara, diterima_tgl, diterima, disetor_tgl, rekening_bkm } = body

    if (!nomor_perkara) {
      return { success: false, message: 'Nomor perkara wajib diisi' }
    }

    if (action === 'delete') {
      await prisma.$executeRawUnsafe(`
        DELETE FROM tbl_data_laporan_iwadl WHERE nomor_perkara = '${nomor_perkara.replace(/'/g, "\\'")}'
      `)
      return { success: true, message: `Data Iwadl perkara ${nomor_perkara} berhasil dihapus` }
    }

    const tglDiterima = diterima_tgl ? `'${diterima_tgl}'` : 'NULL'
    const tglDisetor = disetor_tgl ? `'${disetor_tgl}'` : 'NULL'
    const nominal = Number(diterima) || 10000
    const rek = rekening_bkm ? `'${rekening_bkm.replace(/'/g, "\\'")}'` : 'NULL'
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

    await prisma.$executeRawUnsafe(`
      INSERT INTO tbl_data_laporan_iwadl (
        id_satker, nomor_perkara, diterima_tgl, diterima, disetor_tgl, rekening_bkm,
        diinput_oleh, diinput_tanggal, diedit_oleh, diedit_tanggal
      ) VALUES (
        400879, '${nomor_perkara.replace(/'/g, "\\'")}', ${tglDiterima}, ${nominal}, ${tglDisetor}, ${rek},
        'USER_MONEV', '${now}', 'USER_MONEV', '${now}'
      )
      ON DUPLICATE KEY UPDATE
        diterima_tgl = ${tglDiterima},
        diterima = ${nominal},
        disetor_tgl = ${tglDisetor},
        rekening_bkm = ${rek},
        diedit_oleh = 'USER_MONEV',
        diedit_tanggal = '${now}'
    `)

    return serializeBigInt({
      success: true,
      message: `Data Iwadl perkara ${nomor_perkara} berhasil disimpan`
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal menyimpan transaksi Iwadl'
    }
  }
})
