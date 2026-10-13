import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/db'

export default defineEventHandler(async () => {
  try {
    const [
      penundaanTotalRes,
      penundaanBreakdownRes,
      ruangSidangTotalRes,
      ditegurTotalRes,
      ditegurBreakdownRes,
      sidangKelilingTotalRes,
      jadwalHariIniRes,
      jadwalBesokRes
    ] = await Promise.all([
      // 1. Total Penundaan Sidang Belum di-Isi
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(DISTINCT p.perkara_id) AS total
        FROM perkara p
        JOIN perkara_jadwal_sidang pjs ON p.perkara_id = pjs.perkara_id
        WHERE pjs.ditunda = 'T'
          AND (pjs.keterangan IS NULL OR pjs.keterangan = '' OR pjs.keterangan = '0')
          AND pjs.tanggal_sidang <= NOW()
          AND (p.proses_terakhir_text = 'persidangan' OR p.proses_terakhir_text LIKE '%pertama%')
      `),

      // 1b. Breakdown Penundaan: dalam 24 jam vs lebih dari 24 jam
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          SUM(CASE WHEN selisih_jam <= 24 THEN 1 ELSE 0 END) AS dalam_24_jam,
          SUM(CASE WHEN selisih_jam > 24 THEN 1 ELSE 0 END) AS lebih_24_jam
        FROM (
          SELECT
            p.perkara_id,
            TIMESTAMPDIFF(HOUR, MAX(pjs.tanggal_sidang), NOW()) AS selisih_jam
          FROM perkara p
          JOIN perkara_jadwal_sidang pjs ON p.perkara_id = pjs.perkara_id
          WHERE pjs.ditunda = 'T'
            AND (pjs.keterangan IS NULL OR pjs.keterangan = '' OR pjs.keterangan = '0')
            AND pjs.tanggal_sidang <= NOW()
            AND (p.proses_terakhir_text = 'persidangan' OR p.proses_terakhir_text LIKE '%pertama%')
          GROUP BY p.perkara_id
        ) sub
      `),

      // 2. Ruang Sidang Belum di-Isi (Khusus Sidang di Kantor)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(DISTINCT p.perkara_id) AS total
        FROM perkara p
        JOIN perkara_jadwal_sidang pjs ON p.perkara_id = pjs.perkara_id
        WHERE (pjs.ruangan IS NULL OR pjs.ruangan = '')
          AND pjs.sidang_keliling = 'T'
          AND (
            p.proses_terakhir_text = 'sidang pertama'
            OR p.proses_terakhir_text = 'persidangan'
            OR p.proses_terakhir_text = 'penetapan hari sidang pertama'
            OR p.proses_terakhir_text = 'Penetapan Hari Sidang Ikrar Talak'
          )
      `),

      // 3. Perkara Ditegur / Ditentukan Kemudian (Proses Mediasi)
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(DISTINCT p.perkara_id) AS total
        FROM perkara p
        JOIN perkara_jadwal_sidang pjs ON p.perkara_id = pjs.perkara_id
        WHERE pjs.ditunda = 'T'
          AND (pjs.alasan_ditunda IS NULL OR pjs.alasan_ditunda = '' OR pjs.alasan_ditunda = '0')
          AND (
            pjs.keterangan LIKE '%tegur%'
            OR pjs.keterangan LIKE '%mediasi%'
            OR pjs.keterangan LIKE '%ditentukan kemudian%'
          )
          AND pjs.tanggal_sidang <= NOW()
          AND (p.proses_terakhir_text = 'persidangan' OR p.proses_terakhir_text LIKE '%pertama%')
      `),

      // 3b. Breakdown Ditegur: dalam 30 hari vs lebih dari 30 hari
      prisma.$queryRawUnsafe<any[]>(`
        SELECT
          SUM(CASE WHEN lama_hari <= 30 THEN 1 ELSE 0 END) AS dalam_30_hari,
          SUM(CASE WHEN lama_hari > 30 THEN 1 ELSE 0 END) AS lebih_30_hari
        FROM (
          SELECT
            p.perkara_id,
            DATEDIFF(CURDATE(), MAX(pjs.tanggal_sidang)) AS lama_hari
          FROM perkara p
          JOIN perkara_jadwal_sidang pjs ON p.perkara_id = pjs.perkara_id
          WHERE pjs.ditunda = 'T'
            AND (pjs.alasan_ditunda IS NULL OR pjs.alasan_ditunda = '' OR pjs.alasan_ditunda = '0')
            AND (
              pjs.keterangan LIKE '%tegur%'
              OR pjs.keterangan LIKE '%mediasi%'
              OR pjs.keterangan LIKE '%ditentukan kemudian%'
            )
            AND pjs.tanggal_sidang <= NOW()
            AND (p.proses_terakhir_text = 'persidangan' OR p.proses_terakhir_text LIKE '%pertama%')
          GROUP BY p.perkara_id
        ) sub
      `),

      // 4. Jadwal Sidang Keliling Tidak Ditentukan
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(DISTINCT p.perkara_id) AS total
        FROM perkara p
        JOIN perkara_jadwal_sidang pjs ON p.perkara_id = pjs.perkara_id
        WHERE pjs.sidang_keliling = 'Y'
          AND (pjs.ruangan IS NULL OR pjs.ruangan = '')
          AND (p.proses_terakhir_text LIKE '%sidang%' OR p.proses_terakhir_text LIKE '%penetapan%')
      `),

      // 5. Jadwal Sidang Hari Ini
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(DISTINCT pjs.perkara_id) AS total
        FROM perkara_jadwal_sidang pjs
        WHERE pjs.tanggal_sidang = CURDATE()
      `),

      // 6. Jadwal Sidang Besok
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(DISTINCT pjs.perkara_id) AS total
        FROM perkara_jadwal_sidang pjs
        WHERE pjs.tanggal_sidang = CURDATE() + INTERVAL 1 DAY
      `)
    ])

    const penundaanTotal = Number(penundaanTotalRes?.[0]?.total || 0)
    const penundaanDalam24 = Number(penundaanBreakdownRes?.[0]?.dalam_24_jam || 0)
    const penundaanLebih24 = Number(penundaanBreakdownRes?.[0]?.lebih_24_jam || 0)

    const ruangSidangTotal = Number(ruangSidangTotalRes?.[0]?.total || 0)

    const ditegurTotal = Number(ditegurTotalRes?.[0]?.total || 0)
    const ditegurDalam30 = Number(ditegurBreakdownRes?.[0]?.dalam_30_hari || 0)
    const ditegurLebih30 = Number(ditegurBreakdownRes?.[0]?.lebih_30_hari || 0)

    const sidangKelilingTotal = Number(sidangKelilingTotalRes?.[0]?.total || 0)
    const jadwalHariIni = Number(jadwalHariIniRes?.[0]?.total || 0)
    const jadwalBesok = Number(jadwalBesokRes?.[0]?.total || 0)

    const totalAtensiNotifikasi = penundaanTotal + ruangSidangTotal + ditegurTotal + sidangKelilingTotal

    return {
      success: true,
      data: {
        total_atensi: totalAtensiNotifikasi,
        penundaan: {
          total: penundaanTotal,
          dalam_24_jam: penundaanDalam24,
          lebih_24_jam: penundaanLebih24
        },
        ruang_sidang: {
          total: ruangSidangTotal
        },
        ditegur: {
          total: ditegurTotal,
          dalam_30_hari: ditegurDalam30,
          lebih_30_hari: ditegurLebih30
        },
        sidang_keliling: {
          total: sidangKelilingTotal
        },
        jadwal: {
          hari_ini: jadwalHariIni,
          besok: jadwalBesok
        }
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Gagal memuat ringkasan notifikasi persidangan',
      data: {
        total_atensi: 0,
        penundaan: { total: 0, dalam_24_jam: 0, lebih_24_jam: 0 },
        ruang_sidang: { total: 0 },
        ditegur: { total: 0, dalam_30_hari: 0, lebih_30_hari: 0 },
        sidang_keliling: { total: 0 },
        jadwal: { hari_ini: 0, besok: 0 }
      }
    }
  }
})
