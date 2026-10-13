import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const month = query.month && !isNaN(Number(query.month)) ? Number(query.month) : currentMonth
  const jenis = (query.jenis as string) || 'lipa_1'

  const monthStr = month < 10 ? `0${month}` : `${month}`
  const periode = `${year}-${monthStr}`
  const awalPeriode = `${periode}-01`

  try {
    let cards: Array<{
      title: string
      value: string | number
      subtext: string
      color: string
      icon: string
    }> = []

    if (jenis === 'lipa_2') {
      // Banding
      const [permohonanRes, kirimRes, putusRes, sisaRes] = await Promise.all([
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(perkara_id) AS total FROM perkara_banding
          WHERE DATE_FORMAT(permohonan_banding, '%Y-%m') = '${periode}'
        `).catch(() => [{ total: 0 }]),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(perkara_id) AS total FROM perkara_banding
          WHERE DATE_FORMAT(pengiriman_berkas_banding, '%Y-%m') = '${periode}'
        `).catch(() => [{ total: 0 }]),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(perkara_id) AS total FROM perkara_banding
          WHERE DATE_FORMAT(putusan_banding, '%Y-%m') = '${periode}'
        `).catch(() => [{ total: 0 }]),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(perkara_id) AS total FROM perkara_banding
          WHERE (putusan_banding IS NULL OR DATE_FORMAT(putusan_banding, '%Y-%m') > '${periode}')
            AND DATE_FORMAT(permohonan_banding, '%Y-%m') <= '${periode}'
        `).catch(() => [{ total: 0 }])
      ])

      cards = [
        { title: 'Permohonan Banding', value: Number(permohonanRes[0]?.total || 0), subtext: 'Didaftarkan bulan ini', color: 'blue', icon: 'i-heroicons-document-arrow-up' },
        { title: 'Berkas Dikirim ke PTA', value: Number(kirimRes[0]?.total || 0), subtext: 'Inzage & bundel dikirim', color: 'indigo', icon: 'i-heroicons-paper-airplane' },
        { title: 'Putusan Banding', value: Number(putusRes[0]?.total || 0), subtext: 'Putus oleh PTA', color: 'emerald', icon: 'i-heroicons-check-circle' },
        { title: 'Sisa Belum Putus', value: Number(sisaRes[0]?.total || 0), subtext: 'Tunggakan banding aktif', color: 'amber', icon: 'i-heroicons-clock' }
      ]
    } else if (jenis === 'lipa_3') {
      // Kasasi
      const [permohonanRes, kirimRes, putusRes, sisaRes] = await Promise.all([
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(perkara_id) AS total FROM perkara_kasasi
          WHERE DATE_FORMAT(permohonan_kasasi, '%Y-%m') = '${periode}'
        `).catch(() => [{ total: 0 }]),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(perkara_id) AS total FROM perkara_kasasi
          WHERE DATE_FORMAT(pengiriman_berkas_kasasi, '%Y-%m') = '${periode}'
        `).catch(() => [{ total: 0 }]),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(perkara_id) AS total FROM perkara_kasasi
          WHERE DATE_FORMAT(putusan_kasasi, '%Y-%m') = '${periode}'
        `).catch(() => [{ total: 0 }]),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(perkara_id) AS total FROM perkara_kasasi
          WHERE (putusan_kasasi IS NULL OR DATE_FORMAT(putusan_kasasi, '%Y-%m') > '${periode}')
            AND DATE_FORMAT(permohonan_kasasi, '%Y-%m') <= '${periode}'
        `).catch(() => [{ total: 0 }])
      ])

      cards = [
        { title: 'Permohonan Kasasi', value: Number(permohonanRes[0]?.total || 0), subtext: 'Didaftarkan bulan ini', color: 'blue', icon: 'i-heroicons-document-arrow-up' },
        { title: 'Berkas Dikirim ke MA', value: Number(kirimRes[0]?.total || 0), subtext: 'Bundel dikirim ke MA RI', color: 'indigo', icon: 'i-heroicons-paper-airplane' },
        { title: 'Putusan Kasasi MA', value: Number(putusRes[0]?.total || 0), subtext: 'Diputus Mahkamah Agung', color: 'emerald', icon: 'i-heroicons-check-circle' },
        { title: 'Sisa Belum Putus', value: Number(sisaRes[0]?.total || 0), subtext: 'Tunggakan kasasi aktif', color: 'amber', icon: 'i-heroicons-clock' }
      ]
    } else if (jenis === 'lipa_8') {
      // LIPA 8: Menurut Jenis Perkara
      const [masukRes, putusRes, cabutRes, sisaRes] = await Promise.all([
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(perkara_id) AS total FROM perkara
          WHERE DATE_FORMAT(tanggal_pendaftaran, '%Y-%m') = '${periode}'
        `).catch(() => [{ total: 0 }]),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(perkara_id) AS total FROM perkara_putusan
          WHERE DATE_FORMAT(tanggal_putusan, '%Y-%m') = '${periode}'
        `).catch(() => [{ total: 0 }]),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(b.perkara_id) AS total FROM perkara a
          JOIN perkara_putusan b ON b.perkara_id = a.perkara_id
          WHERE DATE_FORMAT(b.tanggal_putusan, '%Y-%m') = '${periode}' AND b.status_putusan_id = 67
        `).catch(() => [{ total: 0 }]),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(a.perkara_id) AS total FROM perkara a
          LEFT JOIN perkara_putusan b ON b.perkara_id = a.perkara_id
          WHERE a.tanggal_pendaftaran <= '${periode}-31'
            AND (b.tanggal_putusan IS NULL OR DATE_FORMAT(b.tanggal_putusan, '%Y-%m') > '${periode}')
        `).catch(() => [{ total: 0 }])
      ])

      cards = [
        { title: 'Perkara Diterima', value: Number(masukRes[0]?.total || 0), subtext: 'Total pendaftaran bulan ini', color: 'blue', icon: 'i-heroicons-folder-plus' },
        { title: 'Perkara Dicabut', value: Number(cabutRes[0]?.total || 0), subtext: 'Dicabut oleh para pihak', color: 'orange', icon: 'i-heroicons-backspace' },
        { title: 'Perkara Diputus', value: Number(putusRes[0]?.total || 0), subtext: 'Diputus majelis hakim', color: 'emerald', icon: 'i-heroicons-check-badge' },
        { title: 'Sisa Akhir Bulan', value: Number(sisaRes[0]?.total || 0), subtext: 'Belum diputus akhir bulan', color: 'red', icon: 'i-heroicons-chart-bar' }
      ]
    } else if (jenis === 'lipa_10') {
      // LIPA 10: Faktor Perceraian
      const [totalPutusRes, cgRes, ctRes] = await Promise.all([
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(perkara_id) AS total FROM perkara_putusan
          WHERE DATE_FORMAT(tanggal_putusan, '%Y-%m') = '${periode}'
        `).catch(() => [{ total: 0 }]),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(a.perkara_id) AS total FROM perkara a
          JOIN perkara_putusan b ON b.perkara_id = a.perkara_id
          WHERE DATE_FORMAT(b.tanggal_putusan, '%Y-%m') = '${periode}' AND a.jenis_perkara_id = 347
        `).catch(() => [{ total: 0 }]),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(a.perkara_id) AS total FROM perkara a
          JOIN perkara_putusan b ON b.perkara_id = a.perkara_id
          WHERE DATE_FORMAT(b.tanggal_putusan, '%Y-%m') = '${periode}' AND a.jenis_perkara_id = 346
        `).catch(() => [{ total: 0 }])
      ])

      const totalPerceraian = Number(cgRes[0]?.total || 0) + Number(ctRes[0]?.total || 0)

      cards = [
        { title: 'Total Perceraian Putus', value: totalPerceraian, subtext: 'Cerai Gugat + Cerai Talak', color: 'rose', icon: 'i-heroicons-heart' },
        { title: 'Cerai Gugat (Istri)', value: Number(cgRes[0]?.total || 0), subtext: 'Diajukan oleh Penggugat', color: 'purple', icon: 'i-heroicons-user' },
        { title: 'Cerai Talak (Suami)', value: Number(ctRes[0]?.total || 0), subtext: 'Diajukan oleh Pemohon', color: 'blue', icon: 'i-heroicons-user-group' },
        { title: 'Perkara Lainnya', value: Math.max(0, Number(totalPutusRes[0]?.total || 0) - totalPerceraian), subtext: 'Isbat, Dispensasi, Waris, dll.', color: 'emerald', icon: 'i-heroicons-scale' }
      ]
    } else if (jenis === 'lipa_12') {
      // Mediasi
      const [totalMediasiRes, berhasilRes, gagalRes, prosesRes] = await Promise.all([
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(perkara_id) AS total FROM perkara_mediasi
          WHERE DATE_FORMAT(tgl_penetapan, '%Y-%m') = '${periode}' OR DATE_FORMAT(tgl_laporan_mediasi, '%Y-%m') = '${periode}'
        `).catch(() => [{ total: 0 }]),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(perkara_id) AS total FROM perkara_mediasi
          WHERE DATE_FORMAT(tgl_laporan_mediasi, '%Y-%m') = '${periode}' AND hasil_mediasi IN ('1', '2', 'B')
        `).catch(() => [{ total: 0 }]),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(perkara_id) AS total FROM perkara_mediasi
          WHERE DATE_FORMAT(tgl_laporan_mediasi, '%Y-%m') = '${periode}' AND hasil_mediasi NOT IN ('1', '2', 'B', '0')
        `).catch(() => [{ total: 0 }]),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(perkara_id) AS total FROM perkara_mediasi
          WHERE (tgl_laporan_mediasi IS NULL OR DATE_FORMAT(tgl_laporan_mediasi, '%Y-%m') > '${periode}')
            AND DATE_FORMAT(tgl_penetapan, '%Y-%m') <= '${periode}'
        `).catch(() => [{ total: 0 }])
      ])

      const berhasil = Number(berhasilRes[0]?.total || 0)
      const totalSelesai = berhasil + Number(gagalRes[0]?.total || 0)
      const rasioBerhasil = totalSelesai > 0 ? Math.round((berhasil / totalSelesai) * 100) : 0

      cards = [
        { title: 'Total Dimediasi', value: Number(totalMediasiRes[0]?.total || 0), subtext: 'Perkara masuk mediasi', color: 'blue', icon: 'i-heroicons-user-group' },
        { title: 'Berhasil Damai', value: berhasil, subtext: `${rasioBerhasil}% tingkat keberhasilan`, color: 'emerald', icon: 'i-heroicons-check-badge' },
        { title: 'Tidak Berhasil', value: Number(gagalRes[0]?.total || 0), subtext: 'Lanjut ke persidangan', color: 'red', icon: 'i-heroicons-x-circle' },
        { title: 'Masih Proses Mediasi', value: Number(prosesRes[0]?.total || 0), subtext: 'Sedang berjalan', color: 'amber', icon: 'i-heroicons-clock' }
      ]
    } else if (jenis === 'lipa_23') {
      // Perkara Belum Putus > 5 Bulan
      const [tunggakanRes, cgRes, ctRes] = await Promise.all([
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(a.perkara_id) AS total FROM perkara a
          LEFT JOIN perkara_putusan b ON b.perkara_id = a.perkara_id
          WHERE (b.tanggal_putusan IS NULL OR DATE_FORMAT(b.tanggal_putusan, '%Y-%m') > '${periode}')
            AND a.tanggal_pendaftaran <= DATE_SUB('${periode}-01', INTERVAL 5 MONTH)
        `).catch(() => [{ total: 0 }]),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(a.perkara_id) AS total FROM perkara a
          LEFT JOIN perkara_putusan b ON b.perkara_id = a.perkara_id
          WHERE (b.tanggal_putusan IS NULL OR DATE_FORMAT(b.tanggal_putusan, '%Y-%m') > '${periode}')
            AND a.tanggal_pendaftaran <= DATE_SUB('${periode}-01', INTERVAL 5 MONTH)
            AND a.jenis_perkara_id = 347
        `).catch(() => [{ total: 0 }]),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(a.perkara_id) AS total FROM perkara a
          LEFT JOIN perkara_putusan b ON b.perkara_id = a.perkara_id
          WHERE (b.tanggal_putusan IS NULL OR DATE_FORMAT(b.tanggal_putusan, '%Y-%m') > '${periode}')
            AND a.tanggal_pendaftaran <= DATE_SUB('${periode}-01', INTERVAL 5 MONTH)
            AND a.jenis_perkara_id = 346
        `).catch(() => [{ total: 0 }])
      ])

      const totalTunggakan = Number(tunggakanRes[0]?.total || 0)
      const cg = Number(cgRes[0]?.total || 0)
      const ct = Number(ctRes[0]?.total || 0)

      cards = [
        { title: 'Total Perkara > 5 Bulan', value: totalTunggakan, subtext: 'Perlu atensi khusus majelis', color: 'red', icon: 'i-heroicons-exclamation-triangle' },
        { title: 'Cerai Gugat Menunggak', value: cg, subtext: `${totalTunggakan > 0 ? Math.round((cg / totalTunggakan) * 100) : 0}% dari tunggakan`, color: 'purple', icon: 'i-heroicons-clock' },
        { title: 'Cerai Talak Menunggak', value: ct, subtext: `${totalTunggakan > 0 ? Math.round((ct / totalTunggakan) * 100) : 0}% dari tunggakan`, color: 'blue', icon: 'i-heroicons-clock' },
        { title: 'Gugatan Lain / Harta', value: Math.max(0, totalTunggakan - (cg + ct)), subtext: 'Waris, Hibah, Harta Bersama', color: 'amber', icon: 'i-heroicons-scale' }
      ]
    } else {
      // Default: LIPA 1 (Sisa Lalu, Masuk, Putus, Sisa Akhir)
      const sisaLaluRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(a.perkara_id) AS total
        FROM perkara a
        LEFT JOIN perkara_putusan b ON b.perkara_id = a.perkara_id
        WHERE a.tanggal_pendaftaran < '${awalPeriode}'
          AND (DATE_FORMAT(b.tanggal_putusan, '%Y-%m') >= '${periode}' OR b.tanggal_putusan IS NULL)
          AND a.alur_perkara_id IN (15, 16, 17)
      `).catch(() => [{ total: 0 }])
      const sisaLalu = Number(sisaLaluRes[0]?.total || 0)

      const masukRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara
        WHERE DATE_FORMAT(tanggal_pendaftaran, '%Y-%m') = '${periode}'
          AND alur_perkara_id IN (15, 16, 17)
      `).catch(() => [{ total: 0 }])
      const masuk = Number(masukRes[0]?.total || 0)

      const putusRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(a.perkara_id) AS total
        FROM perkara a
        JOIN perkara_putusan b ON b.perkara_id = a.perkara_id
        WHERE DATE_FORMAT(b.tanggal_putusan, '%Y-%m') = '${periode}'
          AND a.alur_perkara_id IN (15, 16, 17)
      `).catch(() => [{ total: 0 }])
      const putus = Number(putusRes[0]?.total || 0)

      const minutasiRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(a.perkara_id) AS total
        FROM perkara a
        JOIN perkara_putusan b ON b.perkara_id = a.perkara_id
        WHERE DATE_FORMAT(b.tanggal_minutasi, '%Y-%m') = '${periode}'
          AND a.alur_perkara_id IN (15, 16, 17)
      `).catch(() => [{ total: 0 }])
      const minutasi = Number(minutasiRes[0]?.total || 0)

      const totalBeban = sisaLalu + masuk
      const sisaAkhir = Math.max(0, totalBeban - putus)
      const rasio = totalBeban > 0 ? Math.round((putus / totalBeban) * 100) : 0

      cards = [
        { title: 'Sisa Bulan Lalu', value: sisaLalu, subtext: `Sebelum ${periode}`, color: 'amber', icon: 'i-heroicons-clock' },
        { title: 'Diterima Bulan Ini', value: masuk, subtext: 'Pendaftaran baru', color: 'blue', icon: 'i-heroicons-arrow-down-tray' },
        { title: 'Diputus Bulan Ini', value: putus, subtext: `Rasio penyelesaian: ${rasio}%`, color: 'emerald', icon: 'i-heroicons-check-badge' },
        { title: 'Sisa Akhir Bulan', value: sisaAkhir, subtext: `Beban total: ${totalBeban} perkara`, color: 'red', icon: 'i-heroicons-scale' }
      ]
    }

    return serializeBigInt({
      success: true,
      year,
      month,
      periode,
      jenis,
      cards
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat memuat ringkasan KPI Laporan'
    }
  }
})
