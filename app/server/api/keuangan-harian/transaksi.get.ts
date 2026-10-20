import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const tanggal = query.tanggal as string

  // Jika user belum memilih tanggal, jangan query apa-apa
  if (!tanggal) {
    return {
      success: true,
      hasDate: false,
      transaksi: [],
      total: {
        penerimaan: 0,
        pengeluaran: 0,
        selisih: 0,
        jumlahItem: 0
      }
    }
  }

  const safeDate = tanggal.replace(/[^0-9-]/g, '')
  if (!safeDate) {
    return {
      success: false,
      message: 'Format tanggal tidak valid'
    }
  }

  try {
    const rawList = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        A.id,
        A.tahapan_id,
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
      WHERE A.tanggal_transaksi = '${safeDate}'
      ORDER BY A.tanggal_transaksi ASC, A.id ASC
    `)

    let totalPenerimaan = 0
    let totalPengeluaran = 0

    const formattedList = rawList.map((item, idx) => {
      const jml = Number(item.jumlah || 0)
      const jenis = Number(item.jenis_transaksi)
      const isMasuk = jenis === 1
      const isKeluar = jenis === -1

      const penerimaan = isMasuk ? jml : 0
      const pengeluaran = isKeluar ? jml : 0

      totalPenerimaan += penerimaan
      totalPengeluaran += pengeluaran

      return {
        no: idx + 1,
        id: item.id,
        perkaraId: item.perkara_id,
        nomorPerkara: item.nomor_perkara || '-',
        tanggal: item.tanggal_transaksi,
        kode: item.kode || '-',
        uraian: item.uraian || '-',
        penerimaan,
        pengeluaran
      }
    })

    return serializeBigInt({
      success: true,
      hasDate: true,
      tanggal: safeDate,
      transaksi: formattedList,
      total: {
        penerimaan: totalPenerimaan,
        pengeluaran: totalPengeluaran,
        selisih: totalPenerimaan - totalPengeluaran,
        jumlahItem: formattedList.length
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat transaksi keuangan harian'
    }
  }
})
