import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const today = new Date().toISOString().split('T')[0]
  const tglAwal = (query.tglAwal as string) || today
  const tglAkhir = (query.tglAkhir as string) || today

  try {
    const summaryQuery = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        SUM(CASE WHEN jenis_transaksi = 1 THEN jumlah ELSE 0 END) AS total_penerimaan,
        SUM(CASE WHEN jenis_transaksi <> 1 THEN jumlah ELSE 0 END) AS total_pengeluaran,
        COUNT(id) AS total_transaksi
      FROM perkara_biaya
      WHERE tanggal_transaksi >= '${tglAwal}'
        AND tanggal_transaksi <= '${tglAkhir}'
        AND tahapan_id < 99
    `)

    const row = summaryQuery[0] || {}
    const totalPenerimaan = Number(row.total_penerimaan || 0)
    const totalPengeluaran = Number(row.total_pengeluaran || 0)
    const totalTransaksi = Number(row.total_transaksi || 0)

    return serializeBigInt({
      success: true,
      tglAwal,
      tglAkhir,
      summary: {
        totalPenerimaan,
        totalPengeluaran,
        saldoMutasi: totalPenerimaan - totalPengeluaran,
        totalTransaksi
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat ringkasan kas keuangan'
    }
  }
})
