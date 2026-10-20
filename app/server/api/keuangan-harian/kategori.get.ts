import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const tanggal = query.tanggal as string
  const kategoriId = query.kategoriId ? Number(query.kategoriId) : null
  const kodePnbp = query.kodePnbp ? (query.kodePnbp as string).trim() : null

  // Jika user belum memilih tanggal atau kategoriId tidak ada, jangan query apa-apa
  if (!tanggal || kategoriId === null || isNaN(kategoriId)) {
    return {
      success: true,
      hasDate: false,
      transaksi: [],
      availableKodeList: [],
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
    let whereClause = `WHERE A.tanggal_transaksi = '${safeDate}' AND A.kategori_id = ${kategoriId}`
    if (kodePnbp) {
      const safeKode = kodePnbp.replace(/['"\\]/g, '')
      whereClause += ` AND C.kode = '${safeKode}'`
    }

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
        A.keterangan,
        A.id_pembiayaan
      FROM perkara_biaya A
      LEFT JOIN perkara B ON A.perkara_id = B.perkara_id
      LEFT JOIN jenis_biaya C ON A.jenis_biaya_id = C.id
      ${whereClause}
      ORDER BY B.nomor_perkara ASC, A.id ASC
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

      const idPembiayaan = Number(item.id_pembiayaan)
      const statusPembiayaan = idPembiayaan === 1 ? 'Bayar' : (idPembiayaan ? 'Prodeo' : '-')

      return {
        no: idx + 1,
        id: item.id,
        perkaraId: item.perkara_id,
        nomorPerkara: item.nomor_perkara || '-',
        tanggal: item.tanggal_transaksi,
        kode: item.kode || '-',
        uraian: item.uraian || '-',
        keterangan: item.keterangan || '-',
        statusPembiayaan,
        penerimaan,
        pengeluaran
      }
    })

    // Khusus untuk PNBP (kategori 11), ambil daftar opsi kode yang ada pada tanggal tersebut
    let availableKodeList: string[] = []
    if (kategoriId === 11) {
      const kodeRows = await prisma.$queryRawUnsafe<any[]>(`
        SELECT DISTINCT C.kode
        FROM perkara_biaya A
        JOIN jenis_biaya C ON A.jenis_biaya_id = C.id
        WHERE A.tanggal_transaksi = '${safeDate}' AND A.kategori_id = 11 AND C.kode IS NOT NULL AND C.kode != ''
        ORDER BY C.kode ASC
      `).catch(() => [])

      availableKodeList = kodeRows.map(r => String(r.kode)).filter(Boolean)
    }

    return serializeBigInt({
      success: true,
      hasDate: true,
      tanggal: safeDate,
      kategoriId,
      transaksi: formattedList,
      availableKodeList,
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
      message: error.message || 'Gagal memuat rincian transaksi kategori'
    }
  }
})
