import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const today = new Date().toISOString().split('T')[0]
  const tglAwal = (query.tglAwal as string) || today
  const tglAkhir = (query.tglAkhir as string) || today

  try {
    const transaksiList = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        A.id,
        A.perkara_id,
        B.nomor_perkara,
        A.tanggal_transaksi,
        C.kode,
        A.uraian,
        A.jumlah,
        A.jenis_transaksi
      FROM perkara_biaya A
      LEFT JOIN perkara B ON A.perkara_id = B.perkara_id
      LEFT JOIN jenis_biaya C ON A.jenis_biaya_id = C.id
      WHERE A.tanggal_transaksi >= '${tglAwal}'
        AND A.tanggal_transaksi <= '${tglAkhir}'
        AND A.tahapan_id < 99
      ORDER BY A.tanggal_transaksi DESC, A.id DESC
      LIMIT 100
    `)

    const formattedList = transaksiList.map(item => {
      const jml = Number(item.jumlah || 0)
      const isMasuk = Number(item.jenis_transaksi) === 1

      return {
        id: item.id,
        perkaraId: item.perkara_id,
        nomorPerkara: item.nomor_perkara || '-',
        tanggal: item.tanggal_transaksi,
        kode: item.kode || '-',
        uraian: item.uraian || '-',
        penerimaan: isMasuk ? jml : 0,
        pengeluaran: !isMasuk ? jml : 0
      }
    })

    return serializeBigInt({
      success: true,
      tglAwal,
      tglAkhir,
      transaksi: formattedList
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat rincian transaksi buku kas'
    }
  }
})
