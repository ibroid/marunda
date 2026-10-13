import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const tahun = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const jenis = (query.jenis as string) || 'sidkel' // 'sidkel' | 'prodeo' | 'posbakum' | 'yandu'

  try {
    // 1. Ensure table exists
    const tableMap: Record<string, string> = {
      sidkel: 'tbl_data_laporan_rk8a',
      prodeo: 'tbl_data_laporan_rk8b',
      posbakum: 'tbl_data_laporan_rk8c',
      yandu: 'tbl_data_laporan_yandu'
    }

    const tableName = tableMap[jenis] || 'tbl_data_laporan_rk8a'

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id_satker int(10) unsigned NOT NULL DEFAULT 400879 COMMENT 'ID Satker',
        bulan int(10) unsigned NOT NULL COMMENT 'Bulan Laporan',
        tahun int(10) unsigned NOT NULL COMMENT 'Tahun Laporan',
        bulan_lalu decimal(20,2) unsigned NOT NULL DEFAULT '0.00' COMMENT 'Realisasi Bulan Lalu',
        bulan_ini decimal(20,2) unsigned NOT NULL DEFAULT '0.00' COMMENT 'Realisasi Bulan Ini',
        jml decimal(20,2) unsigned NOT NULL DEFAULT '0.00' COMMENT 'Jumlah Realisasi',
        kegiatan int(10) unsigned NOT NULL DEFAULT '0' COMMENT 'Jumlah Kegiatan',
        perkara int(10) unsigned NOT NULL DEFAULT '0' COMMENT 'Jumlah Perkara',
        keterangan varchar(250) DEFAULT NULL COMMENT 'Keterangan',
        diinput_oleh varchar(30) DEFAULT 'USER_MONEV',
        diinput_tanggal datetime DEFAULT NULL,
        diedit_oleh varchar(30) DEFAULT NULL,
        diedit_tanggal datetime DEFAULT NULL,
        PRIMARY KEY (id_satker, bulan, tahun)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `).catch(() => {})

    // 2. Fetch Pagu Anggaran
    const paguRows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM tbl_mst_pagu_satker WHERE tahun = ${tahun} LIMIT 1
    `).catch(() => [])

    const paguObj = paguRows[0] || {}
    let paguAwal = 0
    let paguRevisi = 0
    let target = 0

    if (jenis === 'sidkel') {
      paguAwal = Number(paguObj.pagu_sidkel || 0)
      paguRevisi = Number(paguObj.pagu_sidkel_revisi || 0)
      target = Number(paguObj.target_sidkel || 0)
    } else if (jenis === 'prodeo') {
      paguAwal = Number(paguObj.pagu_prodeo || 0)
      paguRevisi = Number(paguObj.pagu_prodeo_revisi || 0)
      target = Number(paguObj.target_prodeo || 0)
    } else if (jenis === 'posbakum') {
      paguAwal = Number(paguObj.pagu_posbakum || 0)
      paguRevisi = Number(paguObj.pagu_posbakum_revisi || 0)
      target = Number(paguObj.target_posbakum || 0)
    } else if (jenis === 'yandu') {
      paguAwal = Number(paguObj.pagu_pelayanan_terpadu || 0)
      paguRevisi = Number(paguObj.pagu_pelayanan_terpadu_revisi || 0)
      target = 0
    }

    const paguEfektif = paguRevisi > 0 ? paguRevisi : paguAwal

    // 3. Fetch monthly entries
    const dbRows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM ${tableName}
      WHERE tahun = ${tahun}
      ORDER BY bulan ASC
    `).catch(() => [])

    const monthlyMap = new Map<number, any>()
    dbRows.forEach(r => monthlyMap.set(Number(r.bulan), r))

    const namaBulan = [
      '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]

    let runningTotal = 0
    let totalKegiatan = 0
    let totalPerkara = 0

    const monthsData = []
    for (let b = 1; b <= 12; b++) {
      const entry = monthlyMap.get(b)
      const bulanIni = entry ? Number(entry.bulan_ini || 0) : 0
      const kegiatan = entry ? Number(entry.kegiatan || 0) : 0
      const perkara = entry ? Number(entry.perkara || 0) : 0
      const keterangan = entry ? (entry.keterangan || '') : ''

      const bulanLalu = runningTotal
      runningTotal += bulanIni
      totalKegiatan += kegiatan
      totalPerkara += perkara

      const sisaPagu = Math.max(0, paguEfektif - runningTotal)
      const persentase = paguEfektif > 0 ? Math.round((runningTotal / paguEfektif) * 100) : 0

      monthsData.push({
        bulan: b,
        nama_bulan: namaBulan[b],
        bulan_lalu: bulanLalu,
        bulan_ini: bulanIni,
        total_serapan: runningTotal,
        sisa_pagu: sisaPagu,
        persentase,
        kegiatan,
        perkara,
        keterangan,
        isFilled: !!entry
      })
    }

    return serializeBigInt({
      success: true,
      tahun,
      jenis,
      pagu: {
        awal: paguAwal,
        revisi: paguRevisi,
        efektif: paguEfektif,
        target,
        totalRealisasi: runningTotal,
        sisaPagu: Math.max(0, paguEfektif - runningTotal),
        persentaseRealisasi: paguEfektif > 0 ? Math.round((runningTotal / paguEfektif) * 100) : 0,
        totalKegiatan,
        totalPerkara
      },
      months: monthsData
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat realisasi DIPA',
      months: []
    }
  }
})
