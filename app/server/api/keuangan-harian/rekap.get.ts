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
      saldo: null
    }
  }

  // Sanitasi sederhana tanggal (YYYY-MM-DD)
  const safeDate = tanggal.replace(/[^0-9-]/g, '')
  if (!safeDate) {
    return {
      success: false,
      message: 'Format tanggal tidak valid'
    }
  }

  try {
    // 1. Query Rincian Transaksi Harian
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
        A.jenis_transaksi,
        CASE WHEN B.prodeo = 1 THEN 'Prodeo' ELSE '-' END AS prodeo
      FROM perkara_biaya A
      LEFT JOIN perkara B ON A.perkara_id = B.perkara_id
      LEFT JOIN jenis_biaya C ON A.jenis_biaya_id = C.id
      WHERE A.tanggal_transaksi = '${safeDate}'
      ORDER BY A.perkara_id ASC, A.id ASC
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
        pengeluaran,
        prodeo: item.prodeo || '-'
      }
    })

    // 2. Query Saldo Awal (sebelum tanggal transaksi)
    let saldoAwal = 0
    let saldoAwalBase = 0
    let mutasiSebelumPenerimaan = 0
    let mutasiSebelumPengeluaran = 0

    try {
      // Ambil saldo awal dasar jika ada tabel saldo_awal
      const sawalResult = await prisma.$queryRawUnsafe<any[]>(`
        SELECT jumlah_saldo_awal FROM saldo_awal LIMIT 1
      `).catch(() => [])

      if (sawalResult && sawalResult.length > 0) {
        saldoAwalBase = Number(sawalResult[0].jumlah_saldo_awal || 0)
      }

      // Ambil akumulasi transaksi dari 2018-01-01 s/d H-1
      const priorMutationResult = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          SUM(CASE WHEN jenis_transaksi = 1 THEN jumlah ELSE 0 END) AS sum_d,
          SUM(CASE WHEN jenis_transaksi = -1 THEN jumlah ELSE 0 END) AS sum_k
        FROM perkara_biaya
        WHERE tanggal_transaksi >= '2018-01-01'
          AND tanggal_transaksi < '${safeDate}'
      `)

      if (priorMutationResult && priorMutationResult.length > 0) {
        mutasiSebelumPenerimaan = Number(priorMutationResult[0].sum_d || 0)
        mutasiSebelumPengeluaran = Number(priorMutationResult[0].sum_k || 0)
      }

      saldoAwal = saldoAwalBase + mutasiSebelumPenerimaan - mutasiSebelumPengeluaran
    } catch (err) {
      console.warn('Gagal menghitung saldo awal:', err)
    }

    const saldoAkhir = saldoAwal + totalPenerimaan - totalPengeluaran

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
      },
      saldo: {
        saldoAwal,
        penerimaan: totalPenerimaan,
        pengeluaran: totalPengeluaran,
        saldoAkhir
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat rekap transaksi harian'
    }
  }
})
