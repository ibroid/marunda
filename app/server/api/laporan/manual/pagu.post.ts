import { defineEventHandler, readBody } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const tahun = Number(body.tahun) || new Date().getFullYear()
    const idSatker = Number(body.id_satker) || 400879

    const paguSidkel = Number(body.pagu_sidkel) || 0
    const paguSidkelRevisi = Number(body.pagu_sidkel_revisi) || 0
    const targetSidkel = Number(body.target_sidkel) || 0

    const paguProdeo = Number(body.pagu_prodeo) || 0
    const paguProdeoRevisi = Number(body.pagu_prodeo_revisi) || 0
    const targetProdeo = Number(body.target_prodeo) || 0

    const paguPosbakum = Number(body.pagu_posbakum) || 0
    const paguPosbakumRevisi = Number(body.pagu_posbakum_revisi) || 0
    const targetPosbakum = Number(body.target_posbakum) || 0

    const paguYandu = Number(body.pagu_pelayanan_terpadu) || 0
    const paguYanduRevisi = Number(body.pagu_pelayanan_terpadu_revisi) || 0

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

    await prisma.$executeRawUnsafe(`
      INSERT INTO tbl_mst_pagu_satker (
        id_satker, tahun,
        pagu_sidkel, pagu_sidkel_revisi, target_sidkel,
        pagu_prodeo, pagu_prodeo_revisi, target_prodeo,
        pagu_posbakum, pagu_posbakum_revisi, target_posbakum,
        pagu_pelayanan_terpadu, pagu_pelayanan_terpadu_revisi,
        diinput_oleh, diinput_tanggal, diedit_oleh, diedit_tanggal
      ) VALUES (
        ${idSatker}, ${tahun},
        ${paguSidkel}, ${paguSidkelRevisi}, ${targetSidkel},
        ${paguProdeo}, ${paguProdeoRevisi}, ${targetProdeo},
        ${paguPosbakum}, ${paguPosbakumRevisi}, ${targetPosbakum},
        ${paguYandu}, ${paguYanduRevisi},
        'USER_MONEV', '${now}', 'USER_MONEV', '${now}'
      )
      ON DUPLICATE KEY UPDATE
        pagu_sidkel = ${paguSidkel},
        pagu_sidkel_revisi = ${paguSidkelRevisi},
        target_sidkel = ${targetSidkel},
        pagu_prodeo = ${paguProdeo},
        pagu_prodeo_revisi = ${paguProdeoRevisi},
        target_prodeo = ${targetProdeo},
        pagu_posbakum = ${paguPosbakum},
        pagu_posbakum_revisi = ${paguPosbakumRevisi},
        target_posbakum = ${targetPosbakum},
        pagu_pelayanan_terpadu = ${paguYandu},
        pagu_pelayanan_terpadu_revisi = ${paguYanduRevisi},
        diedit_oleh = 'USER_MONEV',
        diedit_tanggal = '${now}'
    `)

    return serializeBigInt({
      success: true,
      message: `Pagu Anggaran DIPA tahun ${tahun} berhasil disimpan`,
      data: { tahun, idSatker }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal menyimpan master pagu DIPA'
    }
  }
})
