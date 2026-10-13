import { defineEventHandler, readBody } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const tahun = Number(body.tahun) || new Date().getFullYear()
    const bulan = Number(body.bulan)
    const jenis = (body.jenis as string) || 'sidkel'
    const bulanIni = Number(body.bulan_ini) || 0
    const kegiatan = Number(body.kegiatan) || 0
    const perkara = Number(body.perkara) || 0
    const keterangan = body.keterangan ? body.keterangan.replace(/'/g, "\\'") : ''

    if (!bulan || bulan < 1 || bulan > 12) {
      return { success: false, message: 'Bulan tidak valid (1-12)' }
    }

    const tableMap: Record<string, string> = {
      sidkel: 'tbl_data_laporan_rk8a',
      prodeo: 'tbl_data_laporan_rk8b',
      posbakum: 'tbl_data_laporan_rk8c',
      yandu: 'tbl_data_laporan_yandu'
    }

    const tableName = tableMap[jenis] || 'tbl_data_laporan_rk8a'
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

    // Hitung realisasi bulan lalu secara akurat
    const prevRows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT SUM(bulan_ini) AS total_lalu
      FROM ${tableName}
      WHERE tahun = ${tahun} AND bulan < ${bulan}
    `).catch(() => [{ total_lalu: 0 }])

    const bulanLalu = Number(prevRows[0]?.total_lalu || 0)
    const jmlTotal = bulanLalu + bulanIni

    await prisma.$executeRawUnsafe(`
      INSERT INTO ${tableName} (
        id_satker, bulan, tahun,
        bulan_lalu, bulan_ini, jml, kegiatan, perkara, keterangan,
        diinput_oleh, diinput_tanggal, diedit_oleh, diedit_tanggal
      ) VALUES (
        400879, ${bulan}, ${tahun},
        ${bulanLalu}, ${bulanIni}, ${jmlTotal}, ${kegiatan}, ${perkara}, '${keterangan}',
        'USER_MONEV', '${now}', 'USER_MONEV', '${now}'
      )
      ON DUPLICATE KEY UPDATE
        bulan_lalu = ${bulanLalu},
        bulan_ini = ${bulanIni},
        jml = ${jmlTotal},
        kegiatan = ${kegiatan},
        perkara = ${perkara},
        keterangan = '${keterangan}',
        diedit_oleh = 'USER_MONEV',
        diedit_tanggal = '${now}'
    `)

    return serializeBigInt({
      success: true,
      message: `Realisasi ${jenis.toUpperCase()} bulan ke-${bulan} tahun ${tahun} berhasil disimpan`
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal menyimpan realisasi bulanan DIPA'
    }
  }
})
