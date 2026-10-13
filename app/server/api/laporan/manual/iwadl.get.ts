import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const month = query.month && !isNaN(Number(query.month)) ? Number(query.month) : currentMonth

  try {
    // Pastikan tabel tbl_data_laporan_iwadl ada
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS tbl_data_laporan_iwadl (
        id_satker int(10) unsigned NOT NULL DEFAULT 400879 COMMENT 'ID Satker',
        nomor_perkara varchar(50) NOT NULL DEFAULT '',
        diterima_tgl date DEFAULT NULL,
        diterima decimal(12,2) unsigned NOT NULL DEFAULT '10000.00',
        disetor_tgl date DEFAULT NULL,
        rekening_bkm varchar(50) DEFAULT NULL,
        diinput_oleh varchar(30) DEFAULT 'USER_MONEV',
        diinput_tanggal datetime DEFAULT NULL,
        diedit_oleh varchar(30) DEFAULT NULL,
        diedit_tanggal datetime DEFAULT NULL,
        PRIMARY KEY (nomor_perkara)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Data Laporan Pertanggungjawaban Iwadl';
    `).catch(() => {})

    let filterSql = `YEAR(diterima_tgl) = ${year}`
    if (query.month) {
      filterSql += ` AND MONTH(diterima_tgl) = ${month}`
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        nomor_perkara,
        diterima_tgl,
        diterima,
        disetor_tgl,
        rekening_bkm,
        IF(disetor_tgl IS NOT NULL AND disetor_tgl != '0000-00-00', 'Sudah Disetor', 'Belum Disetor') AS status_setor
      FROM tbl_data_laporan_iwadl
      WHERE ${filterSql}
      ORDER BY diterima_tgl DESC
    `).catch(() => [])

    // Hitung total penerimaan dan penyetoran
    const totalDiterima = rows.reduce((acc, r) => acc + Number(r.diterima || 0), 0)
    const totalDisetor = rows.filter(r => r.status_setor === 'Sudah Disetor').reduce((acc, r) => acc + Number(r.diterima || 0), 0)
    const sisaKasIwadl = Math.max(0, totalDiterima - totalDisetor)

    return serializeBigInt({
      success: true,
      year,
      month,
      summary: {
        totalTransaksi: rows.length,
        totalDiterima,
        totalDisetor,
        sisaKasIwadl
      },
      rows
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat data uang Iwadl',
      rows: []
    }
  }
})
