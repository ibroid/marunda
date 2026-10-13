import { defineEventHandler } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async () => {
  try {
    const listHakim = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, nama_gelar, nip, aktif
      FROM hakim_pn
      WHERE aktif = 'Y'
      ORDER BY nama_gelar ASC
    `)

    return serializeBigInt({
      success: true,
      data: listHakim.map(h => ({
        id: Number(h.id),
        nama: h.nama_gelar || '-',
        nip: h.nip || '-',
        aktif: h.aktif === 'Y'
      }))
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat opsi hakim'
    }
  }
})
