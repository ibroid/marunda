import { defineEventHandler, getQuery, setHeader, setResponseStatus } from 'h3'
import ExcelJS from 'exceljs'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const month = query.month && !isNaN(Number(query.month)) ? Number(query.month) : currentMonth

  const monthStr = month < 10 ? `0${month}` : `${month}`
  const periode = `${year}-${monthStr}`

  const monthNames = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
  ]
  const namaBulan = monthNames[month - 1] || ''

  try {
    // 1. Ambil data konfigurasi pengadilan & pejabat
    const sysConfigs = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, value FROM sys_config WHERE id IN (61, 62, 63, 64, 65, 68, 69) OR name IN ('NamaPN', 'KetuaPNNama', 'KetuaPNNIP', 'PanSekNama', 'PanSekNIP')`
    ).catch(() => [])

    let namaSatker = 'PENGADILAN AGAMA JAKARTA UTARA'
    let ketuaNama = 'Dr. Khoiriyah Roihan, S.Ag., M.H.'
    let ketuaNip = '197409261999032001'
    let paniteraNama = 'H. Dede Supriadi, S.H., M.H.'
    let paniteraNip = '197305041998031002'

    for (const cfg of sysConfigs) {
      if (cfg.id === 62 || cfg.name === 'NamaPN') namaSatker = cfg.value || namaSatker
      if (cfg.id === 64 || cfg.name === 'KetuaPNNama') ketuaNama = cfg.value || ketuaNama
      if (cfg.id === 65 || cfg.name === 'KetuaPNNIP') ketuaNip = cfg.value || ketuaNip
      if (cfg.id === 68 || cfg.name === 'PanSekNama') paniteraNama = cfg.value || paniteraNama
      if (cfg.id === 69 || cfg.name === 'PanSekNIP') paniteraNip = cfg.value || paniteraNip
    }

    const kotaSatker = namaSatker
      .replace(/PENGADILAN AGAMA /gi, '')
      .replace(/MAHKAMAH SYAR'IYAH /gi, '')
      .trim()

    // 2. Kueri Detail Perkara Kasasi LIPA 3
    const dataSql = `
      SELECT
        ks.perkara_id,
        ks.nomor_perkara_pn AS nomor_perkara_pa,
        COALESCE(ks.nomor_perkara_banding, bdg.nomor_perkara_banding) AS nomor_perkara_banding,
        ks.permohonan_kasasi,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(penerimaan_memori_kasasi, '%Y-%m-%d') SEPARATOR '\n')
           FROM perkara_kasasi_detil
           WHERE perkara_id = ks.perkara_id AND penerimaan_memori_kasasi IS NOT NULL),
          ks.penerimaan_memori_kasasi
        ) AS penerimaan_memori_kasasi,
        COALESCE(
          ks.tidak_memenuhi_syarat,
          (SELECT MAX(tidak_memenuhi_syarat) FROM perkara_kasasi_detil WHERE perkara_id = ks.perkara_id)
        ) AS penetapan_tms,
        ks.pengiriman_berkas_kasasi AS pengiriman_berkas_ma,
        IF(LEFT(ks.putusan_kasasi, 7) > '${periode}', NULL, ks.putusan_kasasi) AS putusan_kasasi,
        IF(LEFT(ks.penerimaan_berkas_kasasi, 7) > '${periode}', NULL, ks.penerimaan_berkas_kasasi) AS penerimaan_kembali_pa,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(pemberitahuan_putusan_kasasi, '%Y-%m-%d') SEPARATOR '\n')
           FROM perkara_kasasi_detil
           WHERE perkara_id = ks.perkara_id AND (status_pihak_id = 1 OR status_pihak_text LIKE '%Pemohon%') AND pemberitahuan_putusan_kasasi IS NOT NULL),
          ks.pemberitahuan_putusan_kasasi_pihak1,
          ks.pemberitahuan_putusan_kasasi
        ) AS pemberitahuan_putusan_p,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(pemberitahuan_putusan_kasasi, '%Y-%m-%d') SEPARATOR '\n')
           FROM perkara_kasasi_detil
           WHERE perkara_id = ks.perkara_id AND (status_pihak_id IN (3, 4) OR status_pihak_text LIKE '%Termohon%') AND pemberitahuan_putusan_kasasi IS NOT NULL),
          ks.pemberitahuan_putusan_kasasi_pihak2
        ) AS pemberitahuan_putusan_t,
        ks.nomor_perkara_kasasi,
        ks.status_putusan_kasasi_text,
        ks.catatan_putusan_kasasi,
        ks.tanggal_cabut
      FROM perkara_kasasi AS ks
      LEFT JOIN perkara_banding AS bdg ON bdg.perkara_id = ks.perkara_id
      WHERE LEFT(ks.permohonan_kasasi, 7) <= '${periode}'
        AND (ks.putusan_kasasi IS NULL OR LEFT(ks.putusan_kasasi, 7) >= '${periode}')
      ORDER BY ks.permohonan_kasasi ASC, ks.perkara_id ASC
    `

    const rows = await prisma.$queryRawUnsafe<any[]>(dataSql).catch((err) => {
      console.error('Error fetch LIPA 3 for export:', err)
      return []
    })

    // 3. Bangun Workbook ExcelJS Persis Format Resmi LIPA 3
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'SIPP - LIPA 3 Exporter'
    workbook.lastModifiedBy = 'Monev SIPP'
    workbook.created = new Date()
    workbook.modified = new Date()

    const worksheet = workbook.addWorksheet('LIPA 3', {
      pageSetup: {
        orientation: 'landscape',
        paperSize: 9, // A4
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
      },
      views: [{ showGridLines: true }]
    })

    // Setup Lebar Kolom (A s/d K = 11 Kolom)
    worksheet.columns = [
      { key: 'col1', width: 6 },   // NO
      { key: 'col2', width: 24 },  // TINGKAT PERTAMA
      { key: 'col3', width: 24 },  // TINGKAT BANDING
      { key: 'col4', width: 15 },  // PERMOHONAN KASASI
      { key: 'col5', width: 16 },  // PENERIMAAN MEMORI KASASI
      { key: 'col6', width: 17 },  // PENETAPAN TIDAK MEMENUHI SYARAT FORMAL
      { key: 'col7', width: 15 },  // PENGIRIMAN BERKAS KE MA
      { key: 'col8', width: 14 },  // PUTUS KASASI
      { key: 'col9', width: 16 },  // PENERIMAAN KEMBALI BERKAS KASASI DI PA
      { key: 'col10', width: 18 }, // PEMBERITAHUAN KE PARA PIHAK
      { key: 'col11', width: 22 }  // KETERANGAN
    ]

    // Style Borders
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }

    // Helper format tanggal DD-MM-YYYY
    const fmtTgl = (val: any): string => {
      if (!val) return ''
      if (val instanceof Date) {
        if (isNaN(val.getTime())) return ''
        const d = String(val.getDate()).padStart(2, '0')
        const m = String(val.getMonth() + 1).padStart(2, '0')
        const y = val.getFullYear()
        return `${d}-${m}-${y}`
      }
      const s = String(val).trim()
      if (!s || s.startsWith('0000-00-00')) return ''
      const clean = s.includes('T') ? s.split('T')[0] : s.split(' ')[0]
      const parts = clean.split('-')
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`
      }
      return s
    }

    const fmtMultiTgl = (val: any): string => {
      if (!val) return ''
      return String(val)
        .split(/[\n,]+/)
        .map(v => v.trim())
        .filter(v => v.length > 0)
        .map(v => fmtTgl(v))
        .join('\n')
    }

    // A. Header Dokumen
    worksheet.mergeCells('A1:K1')
    worksheet.getCell('A1').value = 'LAPORAN PERKARA YANG DIMOHONKAN KASASI'
    worksheet.getCell('A1').font = { name: 'Times New Roman', size: 12, bold: true }
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }

    worksheet.mergeCells('A2:K2')
    worksheet.getCell('A2').value = `PADA ${namaSatker.toUpperCase()}`
    worksheet.getCell('A2').font = { name: 'Times New Roman', size: 11, bold: true }
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' }

    worksheet.mergeCells('A3:K3')
    worksheet.getCell('A3').value = `BULAN ${namaBulan} ${year}`
    worksheet.getCell('A3').font = { name: 'Times New Roman', size: 11, bold: true }
    worksheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' }

    // Label pojok kanan LIPA 3
    worksheet.getCell('K4').value = 'LIPA 3'
    worksheet.getCell('K4').font = { name: 'Times New Roman', size: 9, bold: true }
    worksheet.getCell('K4').alignment = { horizontal: 'right', vertical: 'middle' }

    // B. Header Tabel (Row 6, 7, 8)
    // 1. NO
    worksheet.mergeCells('A6:A7')
    worksheet.getCell('A6').value = 'NO'

    // 2. NOMOR PERKARA (Colspan B & C)
    worksheet.mergeCells('B6:C6')
    worksheet.getCell('B6').value = 'NOMOR PERKARA'
    worksheet.getCell('B7').value = 'TINGKAT PERTAMA'
    worksheet.getCell('C7').value = 'TINGKAT BANDING'

    // 3. TANGGAL (Colspan D s/d J)
    worksheet.mergeCells('D6:J6')
    worksheet.getCell('D6').value = 'TANGGAL'
    worksheet.getCell('D7').value = 'PERMOHONAN\nKASASI'
    worksheet.getCell('E7').value = 'PENERIMAAN\nMEMORI\nKASASI'
    worksheet.getCell('F7').value = 'PENETAPAN\nTIDAK\nMEMENUHI\nSYARAT\nFORMAL'
    worksheet.getCell('G7').value = 'PENGIRIMAN\nBERKAS\nKE MA'
    worksheet.getCell('H7').value = 'PUTUS\nKASASI'
    worksheet.getCell('I7').value = 'PENERIMAAN\nKEMBALI\nBERKAS\nKASASI DI\nPA'
    worksheet.getCell('J7').value = 'PEMBERITAHUAN\nKE PARA\nPIHAK'

    // 4. KETERANGAN
    worksheet.mergeCells('K6:K7')
    worksheet.getCell('K6').value = 'KETERANGAN'

    // Format Sel Header Tabel (Row 6 & 7)
    for (let r = 6; r <= 7; r++) {
      worksheet.getRow(r).height = r === 6 ? 24 : 60
      for (let c = 1; c <= 11; c++) {
        const cell = worksheet.getRow(r).getCell(c)
        cell.font = { name: 'Times New Roman', size: 9, bold: true }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        cell.border = thinBorder
      }
    }

    // Row 8: Angka Nomor Kolom (1 s/d 11)
    worksheet.getRow(8).height = 18
    for (let c = 1; c <= 11; c++) {
      const cell = worksheet.getRow(8).getCell(c)
      cell.value = c
      cell.font = { name: 'Times New Roman', size: 9, bold: true }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = thinBorder
    }

    // C. Data Rows (Mulai Row 9)
    let currentRow = 9
    if (rows.length === 0) {
      // Baris Kosong jika tidak ada data
      worksheet.getRow(currentRow).height = 24
      worksheet.mergeCells(`A${currentRow}:K${currentRow}`)
      const emptyCell = worksheet.getCell(`A${currentRow}`)
      emptyCell.value = 'N I H I L'
      emptyCell.font = { name: 'Times New Roman', size: 10, italic: true }
      emptyCell.alignment = { horizontal: 'center', vertical: 'middle' }
      for (let c = 1; c <= 11; c++) {
        worksheet.getRow(currentRow).getCell(c).border = thinBorder
      }
      currentRow++
    } else {
      rows.forEach((item, idx) => {
        const row = worksheet.getRow(currentRow)
        row.height = 36

        // Format Pemberitahuan ke Para Pihak
        let pbtText = ''
        const pbtP = fmtMultiTgl(item.pemberitahuan_putusan_p)
        const pbtT = fmtMultiTgl(item.pemberitahuan_putusan_t)
        if (pbtP && pbtT) {
          pbtText = `P: ${pbtP}\nT: ${pbtT}`
        } else if (pbtP) {
          pbtText = pbtP
        } else if (pbtT) {
          pbtText = pbtT
        }

        // Format Keterangan
        const ketParts: string[] = []
        if (item.tanggal_cabut) {
          ketParts.push(`Dicabut (${fmtTgl(item.tanggal_cabut)})`)
        }
        if (item.status_putusan_kasasi_text) {
          ketParts.push(item.status_putusan_kasasi_text)
        }
        if (item.nomor_perkara_kasasi) {
          ketParts.push(`No. MA: ${item.nomor_perkara_kasasi}`)
        }
        if (item.catatan_putusan_kasasi) {
          ketParts.push(item.catatan_putusan_kasasi)
        }
        const keteranganStr = ketParts.join('\n')

        // 1. NO
        row.getCell(1).value = idx + 1
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }

        // 2. NOMOR PERKARA TINGKAT PERTAMA
        row.getCell(2).value = item.nomor_perkara_pa || ''
        row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }

        // 3. NOMOR PERKARA TINGKAT BANDING
        row.getCell(3).value = item.nomor_perkara_banding || ''
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }

        // 4. PERMOHONAN KASASI
        row.getCell(4).value = fmtTgl(item.permohonan_kasasi)
        row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' }

        // 5. PENERIMAAN MEMORI KASASI
        row.getCell(5).value = fmtMultiTgl(item.penerimaan_memori_kasasi)
        row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }

        // 6. PENETAPAN TIDAK MEMENUHI SYARAT FORMAL
        row.getCell(6).value = fmtTgl(item.penetapan_tms)
        row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' }

        // 7. PENGIRIMAN BERKAS KE MA
        row.getCell(7).value = fmtTgl(item.pengiriman_berkas_ma)
        row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' }

        // 8. PUTUS KASASI
        row.getCell(8).value = fmtTgl(item.putusan_kasasi)
        row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' }

        // 9. PENERIMAAN KEMBALI BERKAS KASASI DI PA
        row.getCell(9).value = fmtTgl(item.penerimaan_kembali_pa)
        row.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' }

        // 10. PEMBERITAHUAN KE PARA PIHAK
        row.getCell(10).value = pbtText
        row.getCell(10).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }

        // 11. KETERANGAN
        row.getCell(11).value = keteranganStr
        row.getCell(11).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }

        for (let c = 1; c <= 11; c++) {
          const cell = row.getCell(c)
          cell.font = { name: 'Times New Roman', size: 9 }
          cell.border = thinBorder
        }

        currentRow++
      })
    }

    // D. Bagian Tanda Tangan (Signature Section)
    currentRow += 2

    // Teks Tanggal & Kota
    const now = new Date()
    const bulanIndo = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const tglFormatted = `${now.getDate()} ${bulanIndo[now.getMonth()]} ${now.getFullYear()}`

    // Mengetahui (Kiri: Kolom B/C)
    worksheet.getCell(`B${currentRow}`).value = 'Mengetahui'
    worksheet.getCell(`B${currentRow}`).font = { name: 'Times New Roman', size: 10 }

    // Tanggal Dokumen (Kanan: Kolom I/J)
    worksheet.getCell(`I${currentRow}`).value = `${kotaSatker}, ${tglFormatted}`
    worksheet.getCell(`I${currentRow}`).font = { name: 'Times New Roman', size: 10 }

    currentRow++
    worksheet.getCell(`B${currentRow}`).value = `Ketua ${namaSatker}`
    worksheet.getCell(`B${currentRow}`).font = { name: 'Times New Roman', size: 10 }

    worksheet.getCell(`I${currentRow}`).value = 'Panitera'
    worksheet.getCell(`I${currentRow}`).font = { name: 'Times New Roman', size: 10 }

    // Ruang Tanda Tangan (4 baris kosong)
    currentRow += 4

    // Nama & NIP Ketua
    worksheet.getCell(`B${currentRow}`).value = ketuaNama
    worksheet.getCell(`B${currentRow}`).font = { name: 'Times New Roman', size: 10, bold: true, underline: true }

    // Nama & NIP Panitera
    worksheet.getCell(`I${currentRow}`).value = paniteraNama
    worksheet.getCell(`I${currentRow}`).font = { name: 'Times New Roman', size: 10, bold: true, underline: true }

    currentRow++
    worksheet.getCell(`B${currentRow}`).value = `NIP. ${ketuaNip}`
    worksheet.getCell(`B${currentRow}`).font = { name: 'Times New Roman', size: 10 }

    worksheet.getCell(`I${currentRow}`).value = `NIP. ${paniteraNip}`
    worksheet.getCell(`I${currentRow}`).font = { name: 'Times New Roman', size: 10 }

    // 4. Return Excel Buffer
    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `LIPA_3_${namaBulan}_${year}.xlsx`

    setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
    setHeader(event, 'Content-Length', buffer.byteLength)

    return buffer
  } catch (error: any) {
    console.error('Error in lipa3/export:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error.message || 'Gagal mengekspor file Excel LIPA 3'
    }
  }
})
