import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear

  try {
    // 1. Cerai Gugat (CG): Sudah BHT, Belum Terbit Akta Cerai
    const cgRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(p.perkara_id) AS total
      FROM perkara p
      JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
      LEFT JOIN perkara_akta_cerai ac ON ac.perkara_id = p.perkara_id
      WHERE p.jenis_perkara_id = 347
        AND pp.tanggal_bht IS NOT NULL
        AND (ac.tgl_akta_cerai IS NULL OR ac.nomor_akta_cerai IS NULL)
        AND YEAR(pp.tanggal_bht) = ${year}
    `)
    const cgBelumAc = Number(cgRes[0]?.total || 0)

    // 2. Cerai Talak (CT): Sudah BHT, Belum Pelaksanaan Ikrar Talak
    const ctRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(p.perkara_id) AS total
      FROM perkara p
      JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
      LEFT JOIN perkara_ikrar_talak it ON it.perkara_id = p.perkara_id
      WHERE p.jenis_perkara_id = 346
        AND pp.tanggal_bht IS NOT NULL
        AND (it.tgl_ikrar_talak IS NULL)
        AND YEAR(pp.tanggal_bht) = ${year}
    `)
    const ctBelumIkrar = Number(ctRes[0]?.total || 0)

    // 3. Akta Cerai Terbit tapi Belum Diambil Pihak
    const belumDiambilRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(p.perkara_id) AS total
      FROM perkara_akta_cerai ac
      JOIN perkara p ON p.perkara_id = ac.perkara_id
      WHERE ac.tgl_akta_cerai IS NOT NULL
        AND (ac.tgl_penyerahan_akta_cerai IS NULL OR ac.tgl_penyerahan_akta_cerai_pihak2 IS NULL)
        AND YEAR(ac.tgl_akta_cerai) = ${year}
    `)
    const belumDiambil = Number(belumDiambilRes[0]?.total || 0)

    return serializeBigInt({
      success: true,
      year,
      summary: {
        cgBelumAc,
        ctBelumIkrar,
        belumDiambil
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat memuat ringkasan akta cerai'
    }
  }
})
