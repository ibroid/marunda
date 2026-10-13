import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear

  try {
    // 1. e-Court Stats Pendaftaran
    const statsQuery = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        -- Persentase
        ROUND(SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} AND d.perkara_id IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / NULLIF(SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} THEN 1 ELSE 0 END), 0), 2) AS persen_tahun_ini,
        ROUND(SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} AND MONTH(a.tanggal_pendaftaran) = MONTH(CURDATE()) AND d.perkara_id IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / NULLIF(SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} AND MONTH(a.tanggal_pendaftaran) = MONTH(CURDATE()) THEN 1 ELSE 0 END), 0), 2) AS persen_bulan_ini,
        ROUND(SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} AND WEEK(a.tanggal_pendaftaran, 1) = WEEK(CURDATE(), 1) AND d.perkara_id IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / NULLIF(SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} AND WEEK(a.tanggal_pendaftaran, 1) = WEEK(CURDATE(), 1) THEN 1 ELSE 0 END), 0), 2) AS persen_minggu_ini,
        ROUND(SUM(CASE WHEN a.tanggal_pendaftaran = CURDATE() AND d.perkara_id IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / NULLIF(SUM(CASE WHEN a.tanggal_pendaftaran = CURDATE() THEN 1 ELSE 0 END), 0), 2) AS persen_hari_ini,

        -- Jumlah
        SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} AND d.perkara_id IS NOT NULL THEN 1 ELSE 0 END) AS jumlah_ecourt_tahun_ini,
        SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} AND d.perkara_id IS NULL THEN 1 ELSE 0 END) AS jumlah_konvensional_tahun_ini,
        SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} AND MONTH(a.tanggal_pendaftaran) = MONTH(CURDATE()) AND d.perkara_id IS NOT NULL THEN 1 ELSE 0 END) AS jumlah_ecourt_bulan_ini,
        SUM(CASE WHEN YEAR(a.tanggal_pendaftaran) = ${year} AND WEEK(a.tanggal_pendaftaran, 1) = WEEK(CURDATE(), 1) AND d.perkara_id IS NOT NULL THEN 1 ELSE 0 END) AS jumlah_ecourt_minggu_ini,
        SUM(CASE WHEN a.tanggal_pendaftaran = CURDATE() AND d.perkara_id IS NOT NULL THEN 1 ELSE 0 END) AS jumlah_ecourt_hari_ini,
        COUNT(a.perkara_id) AS total_perkara
      FROM perkara AS a
      LEFT JOIN perkara_efiling_id AS d ON a.perkara_id = d.perkara_id
      WHERE a.alur_perkara_id <> 114
        AND YEAR(a.tanggal_pendaftaran) = ${year}
    `)

    const row = statsQuery[0] || {}
    const totalTahunIni = Number(row.total_perkara || 0)
    const ecourtTahunIni = Number(row.jumlah_ecourt_tahun_ini || 0)
    const konvensionalTahunIni = Number(row.jumlah_konvensional_tahun_ini || 0)

    // 2. Data Tematik
    // Perceraian (346 = Cerai Talak, 347 = Cerai Gugat)
    const ceraiQuery = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        SUM(CASE WHEN jenis_perkara_id = 346 THEN 1 ELSE 0 END) AS cerai_talak,
        SUM(CASE WHEN jenis_perkara_id = 347 THEN 1 ELSE 0 END) AS cerai_gugat,
        SUM(CASE WHEN jenis_perkara_id = 362 THEN 1 ELSE 0 END) AS dispensasi_kawin
      FROM perkara
      WHERE YEAR(tanggal_pendaftaran) = ${year}
    `)
    const ceraiTalak = Number(ceraiQuery[0]?.cerai_talak || 0)
    const ceraiGugat = Number(ceraiQuery[0]?.cerai_gugat || 0)
    const dispensasiKawin = Number(ceraiQuery[0]?.dispensasi_kawin || 0)

    // Prodeo
    const prodeoQuery = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(CASE WHEN pb.id_pembiayaan = 2 AND pb.jenis_biaya_id = 1 THEN p.perkara_id END) AS prodeo_dipa,
        COUNT(CASE WHEN pb.id_pembiayaan = 3 AND pb.jenis_biaya_id = 1 THEN p.perkara_id END) AS prodeo_murni
      FROM perkara p
      LEFT JOIN perkara_biaya pb ON p.perkara_id = pb.perkara_id
      WHERE YEAR(p.tanggal_pendaftaran) = ${year}
        AND p.prodeo = 1
    `)
    const prodeoDipa = Number(prodeoQuery[0]?.prodeo_dipa || 0)
    const prodeoMurni = Number(prodeoQuery[0]?.prodeo_murni || 0)

    // Akta Cerai Terbit
    const aktaQuery = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) AS total_terbit
      FROM perkara_akta_cerai
      WHERE YEAR(tgl_akta_cerai) = ${year}
    `)
    const totalAktaTerbit = Number(aktaQuery[0]?.total_terbit || 0)

    return serializeBigInt({
      success: true,
      year,
      ecourt: {
        persenTahunIni: Number(row.persen_tahun_ini || 0),
        persenBulanIni: Number(row.persen_bulan_ini || 0),
        persenMingguIni: Number(row.persen_minggu_ini || 0),
        persenHariIni: Number(row.persen_hari_ini || 0),
        jumlahEcourtTahunIni: ecourtTahunIni,
        jumlahKonvensionalTahunIni: konvensionalTahunIni,
        jumlahEcourtBulanIni: Number(row.jumlah_ecourt_bulan_ini || 0),
        jumlahEcourtMingguIni: Number(row.jumlah_ecourt_minggu_ini || 0),
        jumlahEcourtHariIni: Number(row.jumlah_ecourt_hari_ini || 0),
        totalPerkara: totalTahunIni
      },
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
      message: error.message || 'Terjadi kesalahan saat mengambil statistik e-Court'
    }
  }
})
