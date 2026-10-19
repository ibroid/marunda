import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const month = query.month && query.month !== 'all' && !isNaN(Number(query.month)) ? Number(query.month) : null
  const jenisCerai = (query.jenis_cerai as string) || 'all'
  const faktorId = query.faktor_id && !isNaN(Number(query.faktor_id)) && Number(query.faktor_id) > 0 ? Number(query.faktor_id) : null
  const search = ((query.search as string) || '').trim()

  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10))
  const offset = (page - 1) * limit

  // 1. Date filter
  let dateCondition = `YEAR(ac.tgl_akta_cerai) = ${year}`
  if (month) {
    const monthStr = month < 10 ? `0${month}` : `${month}`
    dateCondition = `ac.tgl_akta_cerai >= '${year}-${monthStr}-01' AND ac.tgl_akta_cerai <= LAST_DAY('${year}-${monthStr}-01')`
  }

  // 2. Jenis cerai filter
  let jenisCondition = ''
  if (jenisCerai === 'Cerai Gugat') {
    jenisCondition = `AND (p.jenis_perkara_id = 347 OR ac.jenis_cerai LIKE '%Gugat%')`
  } else if (jenisCerai === 'Cerai Talak') {
    jenisCondition = `AND (p.jenis_perkara_id = 346 OR ac.jenis_cerai LIKE '%Talak%')`
  }

  // 3. Faktor filter
  let faktorCondition = ''
  if (faktorId) {
    faktorCondition = `AND ac.faktor_perceraian_id = ${faktorId}`
  }

  // 4. Search filter
  let searchCondition = ''
  if (search) {
    const safeSearch = search.replace(/['"\\]/g, '')
    searchCondition = `AND (
      p.nomor_perkara LIKE '%${safeSearch}%'
      OR ac.nomor_akta_cerai LIKE '%${safeSearch}%'
      OR p.para_pihak LIKE '%${safeSearch}%'
      OR f.nama LIKE '%${safeSearch}%'
    )`
  }

  try {
    const [countRes, itemsRes] = await Promise.all([
      // Total count query
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(ac.perkara_id) AS total
        FROM perkara_akta_cerai ac
        JOIN perkara p ON p.perkara_id = ac.perkara_id
        LEFT JOIN faktor_perceraian f ON f.id = ac.faktor_perceraian_id
        WHERE ${dateCondition} ${jenisCondition} ${faktorCondition} ${searchCondition}
      `).catch(() => [{ total: 0 }]),

      // Paginated items query
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          ac.perkara_id,
          p.nomor_perkara,
          p.tanggal_pendaftaran,
          p.para_pihak,
          p.jenis_perkara_nama,
          ac.nomor_akta_cerai,
          ac.no_seri_akta_cerai,
          ac.tgl_akta_cerai,
          ac.jenis_cerai,
          ac.tgl_penyerahan_akta_cerai,
          ac.tgl_penyerahan_akta_cerai_pihak2,
          f.id AS faktor_id,
          f.nama AS faktor_nama,
          pp.tanggal_putusan,
          pp.status_putusan_nama
        FROM perkara_akta_cerai ac
        JOIN perkara p ON p.perkara_id = ac.perkara_id
        LEFT JOIN faktor_perceraian f ON f.id = ac.faktor_perceraian_id
        LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
        WHERE ${dateCondition} ${jenisCondition} ${faktorCondition} ${searchCondition}
        ORDER BY ac.tgl_akta_cerai DESC, ac.perkara_id DESC
        LIMIT ${limit} OFFSET ${offset}
      `).catch(() => [])
    ])

    const total = Number(countRes[0]?.total || 0)
    const totalPages = Math.ceil(total / limit) || 1

    const items = itemsRes.map((r) => {
      // Cek status penyerahan akta cerai
      let statusAmbil = 'Belum Diambil'
      if (r.tgl_penyerahan_akta_cerai && r.tgl_penyerahan_akta_cerai_pihak2) {
        statusAmbil = 'Lengkap (P & T)'
      } else if (r.tgl_penyerahan_akta_cerai || r.tgl_penyerahan_akta_cerai_pihak2) {
        statusAmbil = 'Sebagian Pihak'
      }

      return {
        perkaraId: Number(r.perkara_id),
        nomorPerkara: r.nomor_perkara,
        tanggalPendaftaran: r.tanggal_pendaftaran,
        paraPihak: r.para_pihak,
        jenisPerkaraNama: r.jenis_perkara_nama,
        nomorAktaCerai: r.nomor_akta_cerai,
        noSeriAktaCerai: r.no_seri_akta_cerai || '-',
        tglAktaCerai: r.tgl_akta_cerai,
        jenisCerai: r.jenis_cerai || (r.nomor_perkara?.includes('Pdt.G') ? 'Cerai Gugat' : 'Cerai Talak'),
        tglPenyerahanPihak1: r.tgl_penyerahan_akta_cerai,
        tglPenyerahanPihak2: r.tgl_penyerahan_akta_cerai_pihak2,
        statusAmbil,
        faktorId: r.faktor_id ? Number(r.faktor_id) : null,
        faktorNama: r.faktor_nama || 'Tidak Teridentifikasi',
        tanggalPutusan: r.tanggal_putusan,
        statusPutusan: r.status_putusan_nama || 'Putus'
      }
    })

    return serializeBigInt({
      success: true,
      year,
      month,
      faktorId,
      jenisCerai,
      search,
      page,
      limit,
      total,
      totalPages,
      items
    })
  } catch (error: any) {
    return serializeBigInt({
      success: false,
      message: error?.message || 'Gagal memuat rincian perkara faktor perceraian',
      page,
      limit,
      total: 0,
      totalPages: 1,
      items: []
    })
  }
})
