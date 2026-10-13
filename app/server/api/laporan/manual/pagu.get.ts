import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const tahun = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear

  try {
    // Pastikan tabel tbl_mst_pagu_satker ada
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS tbl_mst_pagu_satker (
        id_satker int(10) unsigned NOT NULL DEFAULT 400879 COMMENT 'ID Satker',
        tahun int(10) unsigned NOT NULL COMMENT 'Tahun Anggaran',
        pagu_sidkel decimal(20,2) unsigned NOT NULL DEFAULT '0.00' COMMENT 'Pagu Sidang Keliling',
        pagu_sidkel_revisi decimal(20,2) NOT NULL DEFAULT '0.00' COMMENT 'Pagu Sidang Keliling Revisi',
        target_sidkel int(11) DEFAULT 0,
        pagu_prodeo decimal(20,2) unsigned NOT NULL DEFAULT '0.00' COMMENT 'Pagu Perkara Prodeo',
        pagu_prodeo_revisi decimal(20,2) NOT NULL DEFAULT '0.00' COMMENT 'Pagu Perkara Prodeo Revisi',
        target_prodeo int(11) DEFAULT 0,
        pagu_posbakum decimal(20,2) unsigned NOT NULL DEFAULT '0.00' COMMENT 'Pagu Posbakum',
        pagu_posbakum_revisi decimal(20,2) NOT NULL DEFAULT '0.00' COMMENT 'Pagu Posbakum Revisi',
        target_posbakum int(11) DEFAULT 0,
        pagu_pelayanan_terpadu decimal(20,2) NOT NULL DEFAULT '0.00' COMMENT 'Pagu Pelayanan Terpadu',
        pagu_pelayanan_terpadu_revisi decimal(20,2) DEFAULT '0.00',
        diedit_oleh varchar(30) DEFAULT NULL,
        diedit_tanggal datetime DEFAULT NULL,
        diinput_oleh varchar(30) DEFAULT NULL,
        diinput_tanggal datetime DEFAULT NULL,
        PRIMARY KEY (id_satker, tahun)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `).catch(() => {})

    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM tbl_mst_pagu_satker
      WHERE tahun = ${tahun}
      LIMIT 1
    `).catch(() => [])

    let data = rows[0] || null

    if (!data) {
      data = {
        id_satker: 400879,
        tahun,
        pagu_sidkel: 0,
        pagu_sidkel_revisi: 0,
        target_sidkel: 0,
        pagu_prodeo: 0,
        pagu_prodeo_revisi: 0,
        target_prodeo: 0,
        pagu_posbakum: 0,
        pagu_posbakum_revisi: 0,
        target_posbakum: 0,
        pagu_pelayanan_terpadu: 0,
        pagu_pelayanan_terpadu_revisi: 0,
        isNew: true
      }
    }

    return serializeBigInt({
      success: true,
      tahun,
      data
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat master pagu DIPA',
      data: null
    }
  }
})
