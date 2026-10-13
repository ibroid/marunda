import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear

  try {
    const [ceraiQuery, prodeoQuery, aktaQuery] = await Promise.all([
      // 1. Perceraian (346 = Cerai Talak, 347 = Cerai Gugat) & Dispensasi Kawin (362)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          SUM(CASE WHEN jenis_perkara_id = 346 THEN 1 ELSE 0 END) AS cerai_talak,
          SUM(CASE WHEN jenis_perkara_id = 347 THEN 1 ELSE 0 END) AS cerai_gugat,
          SUM(CASE WHEN jenis_perkara_id = 362 THEN 1 ELSE 0 END) AS dispensasi_kawin
        FROM perkara
        WHERE YEAR(tanggal_pendaftaran) = ${year}
      `),

      // 2. Perkara Prodeo
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(CASE WHEN pb.id_pembiayaan = 2 AND pb.jenis_biaya_id = 1 THEN p.perkara_id END) AS prodeo_dipa,
          COUNT(CASE WHEN pb.id_pembiayaan = 3 AND pb.jenis_biaya_id = 1 THEN p.perkara_id END) AS prodeo_murni
        FROM perkara p
        LEFT JOIN perkara_biaya pb ON p.perkara_id = pb.perkara_id
        WHERE YEAR(p.tanggal_pendaftaran) = ${year}
          AND p.prodeo = 1
      `),

      // 3. Akta Cerai Terbit
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(*) AS total_terbit
        FROM perkara_akta_cerai
        WHERE YEAR(tgl_akta_cerai) = ${year}
      `)
    ])

    const ceraiTalak = Number(ceraiQuery[0]?.cerai_talak || 0)
    const ceraiGugat = Number(ceraiQuery[0]?.cerai_gugat || 0)
    const dispensasiKawin = Number(ceraiQuery[0]?.dispensasi_kawin || 0)
    const prodeoDipa = Number(prodeoQuery[0]?.prodeo_dipa || 0)
    const prodeoMurni = Number(prodeoQuery[0]?.prodeo_murni || 0)
    const totalAktaTerbit = Number(aktaQuery[0]?.total_terbit || 0)

    return serializeBigInt({
      success: true,
      year,
      tematik: {
        ceraiTalak,
        ceraiGugat,
        totalPerceraian: ceraiTalak + ceraiGugat,
        dispensasiKawin,
        prodeoDipa,
        prodeoMurni,
        totalProdeo: prodeoDipa + prodeoMurni,
        totalAktaTerbit
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat statistik tematik perkara'
    }
  }
})
