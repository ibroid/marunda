import { defineEventHandler, getQuery, setHeader, setResponseStatus } from 'h3'
import ExcelJS from 'exceljs'
import { prisma } from '../../../utils/db'

function cleanHtmlTags(str: any): string {
  if (!str) return ''
  return String(str)
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function formatTanggalExport(dateStr: any): string {
  if (!dateStr) return ''
  const str = String(dateStr).trim()
  if (str === '' || str === 'null') return ''
  if (str === '0000-00-00' || str.startsWith('0000-00-00')) {
    return '00/00/0000'
  }
  try {
    const cleanDate = str.includes('T') ? str.split('T')[0] : str.split(' ')[0]
    const parts = cleanDate.split('-')
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return str
  } catch {
    return str
  }
}

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

    // 2. Kueri Detail Data Eksekusi LIPA 5
    const dataSql = `
      SELECT
        veks.eksekusi_id,
        veks.perkara_id,
        veks.nomor_perkara_pn AS nomor_perkara_pa,
        veks.eksekusi_nomor_perkara AS nomor_eksekusi,
        DATE_FORMAT(veks.permohonan_eksekusi, '%Y-%m-%d') AS permohonan_eksekusi,
        DATE_FORMAT(veks.penetapan_teguran_eksekusi, '%Y-%m-%d') AS penetapan_teguran_eksekusi,
        DATE_FORMAT(veks.pelaksanaan_teguran_eksekusi, '%Y-%m-%d') AS pelaksanaan_teguran_eksekusi,
        DATE_FORMAT(veks.penetapan_sita_eksekusi, '%Y-%m-%d') AS penetapan_sita_eksekusi,
        DATE_FORMAT(veks.pelaksanaan_sita_eksekusi, '%Y-%m-%d') AS pelaksanaan_sita_eksekusi,
        DATE_FORMAT(veks.penetapan_perintah_eksekusi_rill, '%Y-%m-%d') AS penetapan_eksekusi_rill,
        DATE_FORMAT(veks.pelaksanaan_eksekusi_rill, '%Y-%m-%d') AS pelaksanaan_eksekusi_rill,
        DATE_FORMAT(veks.penetapan_noneksekusi, '%Y-%m-%d') AS penetapan_noneksekusi,
        veks.alasan_eksekusi AS alasan,
        veks.catatan_eksekusi AS keterangan,
        veks.status_eksekusi_text
      FROM (
        SELECT *
        FROM v_perkara_eksekusi
        WHERE LEFT(permohonan_eksekusi, 7) < '${periode}' AND (pelaksanaan_sita_eksekusi IS NULL OR LEFT(pelaksanaan_sita_eksekusi, 7) >= '${periode}')
        UNION
        SELECT *
        FROM v_perkara_eksekusi
        WHERE LEFT(permohonan_eksekusi, 7) = '${periode}' AND (pelaksanaan_sita_eksekusi IS NULL OR LEFT(pelaksanaan_sita_eksekusi, 7) >= '${periode}')
      ) AS veks
      ORDER BY veks.eksekusi_id ASC
    `

    const rows = await prisma.$queryRawUnsafe<any[]>(dataSql).catch((err) => {
      console.error('Error fetch LIPA 5 for export:', err)
      return []
    })

    // 3. Bangun Workbook ExcelJS Persis Format Resmi LIPA 5 & Screenshot
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'SIPP - LIPA 5 Exporter'
    workbook.lastModifiedBy = 'Monev SIPP'
    workbook.created = new Date()
    workbook.modified = new Date()

    const worksheet = workbook.addWorksheet('LIPA 5', {
      pageSetup: {
        orientation: 'landscape',
        paperSize: 9, // A4
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
      },
      views: [{ showGridLines: true }]
    })

    // Setup Lebar Kolom (A s/d N = 14 Kolom)
    worksheet.columns = [
      { key: 'col1', width: 6 },   // NO (A)
      { key: 'col2', width: 25 },  // EKSEKUSI (B)
      { key: 'col3', width: 25 },  // PUTUSAN ATAU GROS AKTA (C)
      { key: 'col4', width: 15 },  // PERMOHONAN EKSEKUSI (D)
      { key: 'col5', width: 15 },  // PENETAPAN AANMANING (E)
      { key: 'col6', width: 16 },  // PELAKSANAAN AANMANING (F)
      { key: 'col7', width: 15 },  // PENETAPAN SITA (G)
      { key: 'col8', width: 16 },  // PELAKSANAAN SITA (H)
      { key: 'col9', width: 15 },  // PENETAPAN EKSEKUSI (I)
      { key: 'col10', width: 16 }, // PELAKSANAAN EKSEKUSI (J)
      { key: 'col11', width: 18 }, // PENETAPAN NON EKSEKUTABEL (K)
      { key: 'col12', width: 15 }, // BERGANTUNG (L)
      { key: 'col13', width: 24 }, // ALASAN (M)
      { key: 'col14', width: 15 }  // KET (N)
    ]

    // Style Definitions
    const fontHeaderTitle = { name: 'Arial', size: 12, bold: true }
    const fontHeaderSub = { name: 'Arial', size: 10, bold: true }
    const fontTableHeader = { name: 'Arial', size: 9, bold: true }
    const fontTableColNum = { name: 'Arial', size: 8, bold: true, color: { argb: 'FF555555' } }
    const fontData = { name: 'Arial', size: 9 }
    const fontDataCenter = { name: 'Arial', size: 9 }
    const fontSignature = { name: 'Arial', size: 10 }
    const fontSignatureBold = { name: 'Arial', size: 10, bold: true, underline: true }

    const borderThin: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }

    const fillHeaderTable: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF2F2F2' }
    }

    const fillColNum: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEAEAEA' }
    }

    // 1. Judul Laporan LIPA 5 (Baris 1-3)
    worksheet.mergeCells('A1:N1')
    const r1 = worksheet.getCell('A1')
    r1.value = 'LAPORAN PERKARA YANG DIMOHONKAN EKSEKUSI'
    r1.font = fontHeaderTitle
    r1.alignment = { horizontal: 'center', vertical: 'middle' }

    worksheet.mergeCells('A2:N2')
    const r2 = worksheet.getCell('A2')
    r2.value = `PADA ${namaSatker.toUpperCase()}`
    r2.font = fontHeaderSub
    r2.alignment = { horizontal: 'center', vertical: 'middle' }

    worksheet.mergeCells('A3:N3')
    const r3 = worksheet.getCell('A3')
    r3.value = `BULAN ${namaBulan} ${year}`
    r3.font = fontHeaderSub
    r3.alignment = { horizontal: 'center', vertical: 'middle' }

    // Kode LIPA5 di kanan atas (N5)
    const rLipaCode = worksheet.getCell('N5')
    rLipaCode.value = 'LIPA5'
    rLipaCode.font = { name: 'Arial', size: 9, bold: true }
    rLipaCode.alignment = { horizontal: 'right', vertical: 'middle' }

    // 2. Baris Header Tabel (Row 6 & 7)
    // NO (A6:A7)
    worksheet.mergeCells('A6:A7')
    const hNo = worksheet.getCell('A6')
    hNo.value = 'NO'
    hNo.font = fontTableHeader
    hNo.alignment = { horizontal: 'center', vertical: 'middle' }
    hNo.fill = fillHeaderTable
    hNo.border = borderThin

    // NOMOR (B6:C6)
    worksheet.mergeCells('B6:C6')
    const hNomor = worksheet.getCell('B6')
    hNomor.value = 'NOMOR'
    hNomor.font = fontTableHeader
    hNomor.alignment = { horizontal: 'center', vertical: 'middle' }
    hNomor.fill = fillHeaderTable
    hNomor.border = borderThin

    // TANGGAL (D6:J6)
    worksheet.mergeCells('D6:J6')
    const hTanggal = worksheet.getCell('D6')
    hTanggal.value = 'TANGGAL'
    hTanggal.font = fontTableHeader
    hTanggal.alignment = { horizontal: 'center', vertical: 'middle' }
    hTanggal.fill = fillHeaderTable
    hTanggal.border = borderThin

    // PENETAPAN NON EKSEKUTABEL (K6:K7)
    worksheet.mergeCells('K6:K7')
    const hNonEks = worksheet.getCell('K6')
    hNonEks.value = 'PENETAPAN NON EKSEKUTABEL'
    hNonEks.font = fontTableHeader
    hNonEks.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    hNonEks.fill = fillHeaderTable
    hNonEks.border = borderThin

    // BERGANTUNG (L6:L7)
    worksheet.mergeCells('L6:L7')
    const hGantung = worksheet.getCell('L6')
    hGantung.value = 'BERGANTUNG'
    hGantung.font = fontTableHeader
    hGantung.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    hGantung.fill = fillHeaderTable
    hGantung.border = borderThin

    // ALASAN (M6:M7)
    worksheet.mergeCells('M6:M7')
    const hAlasan = worksheet.getCell('M6')
    hAlasan.value = 'ALASAN'
    hAlasan.font = fontTableHeader
    hAlasan.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    hAlasan.fill = fillHeaderTable
    hAlasan.border = borderThin

    // KET. (N6:N7)
    worksheet.mergeCells('N6:N7')
    const hKet = worksheet.getCell('N6')
    hKet.value = 'KET.'
    hKet.font = fontTableHeader
    hKet.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    hKet.fill = fillHeaderTable
    hKet.border = borderThin

    // Header Baris 2 (Row 7)
    const subHeaders: { [key: string]: string } = {
      B7: 'EKSEKUSI',
      C7: 'PUTUSAN ATAU GROS AKTA YANG DIMOHONKAN EKSEKUSI',
      D7: 'PERMOHONAN EKSEKUSI',
      E7: 'PENETAPAN AANMANING',
      F7: 'PELAKSANAAN AANMANING',
      G7: 'PENETAPAN SITA EKSEKUSI',
      H7: 'PELAKSANAAN SITA EKSEKUSI',
      I7: 'PENETAPAN EKSEKUSI',
      J7: 'PELAKSANAAN EKSEKUSI'
    }

    for (const [cellCoord, text] of Object.entries(subHeaders)) {
      const cell = worksheet.getCell(cellCoord)
      cell.value = text
      cell.font = fontTableHeader
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.fill = fillHeaderTable
      cell.border = borderThin
    }

    // Border untuk sel yang dimerge
    const headerCellsToCheck = ['A6', 'A7', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6', 'J6', 'K6', 'K7', 'L6', 'L7', 'M6', 'M7', 'N6', 'N7']
    for (const coord of headerCellsToCheck) {
      worksheet.getCell(coord).border = borderThin
    }

    // Header Baris 3: Nomor Kolom (1 s/d 14 di Row 8)
    for (let c = 1; c <= 14; c++) {
      const cell = worksheet.getRow(8).getCell(c)
      cell.value = c
      cell.font = fontTableColNum
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.fill = fillColNum
      cell.border = borderThin
    }

    worksheet.getRow(6).height = 24
    worksheet.getRow(7).height = 42
    worksheet.getRow(8).height = 18

    // 3. Tulis Baris Data (Row 9 dst)
    let currentRowIdx = 9

    if (rows.length === 0) {
      worksheet.mergeCells(`A${currentRowIdx}:N${currentRowIdx}`)
      const emptyCell = worksheet.getCell(`A${currentRowIdx}`)
      emptyCell.value = 'N I H I L'
      emptyCell.font = { name: 'Arial', size: 10, italic: true }
      emptyCell.alignment = { horizontal: 'center', vertical: 'middle' }
      emptyCell.border = borderThin
      worksheet.getRow(currentRowIdx).height = 30
      currentRowIdx++
    } else {
      rows.forEach((r, idx) => {
        const row = worksheet.getRow(currentRowIdx)
        const cleanedAlasan = cleanHtmlTags(r.alasan)

        row.getCell(1).value = idx + 1
        row.getCell(2).value = r.nomor_eksekusi || '-'
        row.getCell(3).value = r.nomor_perkara_pa || '-'
        row.getCell(4).value = formatTanggalExport(r.permohonan_eksekusi)
        row.getCell(5).value = formatTanggalExport(r.penetapan_teguran_eksekusi)
        row.getCell(6).value = formatTanggalExport(r.pelaksanaan_teguran_eksekusi)
        row.getCell(7).value = formatTanggalExport(r.penetapan_sita_eksekusi)
        row.getCell(8).value = formatTanggalExport(r.pelaksanaan_sita_eksekusi)
        row.getCell(9).value = formatTanggalExport(r.penetapan_eksekusi_rill)
        row.getCell(10).value = formatTanggalExport(r.pelaksanaan_eksekusi_rill)
        row.getCell(11).value = formatTanggalExport(r.penetapan_noneksekusi)
        row.getCell(12).value = ''
        row.getCell(13).value = cleanedAlasan
        row.getCell(14).value = (r.keterangan && r.keterangan !== '0') ? r.keterangan : ''

        // Formatting & Alignments
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
        row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }

        // Tanggal Kolom 4 s/d 11: center
        for (let col = 4; col <= 11; col++) {
          row.getCell(col).alignment = { horizontal: 'center', vertical: 'middle' }
        }

        row.getCell(12).alignment = { horizontal: 'center', vertical: 'middle' }
        row.getCell(13).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
        row.getCell(14).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }

        for (let c = 1; c <= 14; c++) {
          row.getCell(c).font = fontData
          row.getCell(c).border = borderThin
        }

        row.height = 36
        currentRowIdx++
      })
    }

    // 4. Bagian Tanda Tangan (Ketua & Panitera)
    currentRowIdx += 2

    const today = new Date()
    const todayStr = `${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`

    // Mengetahui
    worksheet.getCell(`C${currentRowIdx}`).value = 'Mengetahui'
    worksheet.getCell(`C${currentRowIdx}`).font = fontSignature
    worksheet.getCell(`J${currentRowIdx}`).value = `${kotaSatker}, ${todayStr}`
    worksheet.getCell(`J${currentRowIdx}`).font = fontSignature
    currentRowIdx++

    worksheet.getCell(`C${currentRowIdx}`).value = `Ketua ${namaSatker}`
    worksheet.getCell(`C${currentRowIdx}`).font = fontSignature
    worksheet.getCell(`J${currentRowIdx}`).value = 'Panitera'
    worksheet.getCell(`J${currentRowIdx}`).font = fontSignature

    currentRowIdx += 5

    worksheet.getCell(`C${currentRowIdx}`).value = ketuaNama
    worksheet.getCell(`C${currentRowIdx}`).font = fontSignatureBold
    worksheet.getCell(`J${currentRowIdx}`).value = paniteraNama
    worksheet.getCell(`J${currentRowIdx}`).font = fontSignatureBold
    currentRowIdx++

    worksheet.getCell(`C${currentRowIdx}`).value = `NIP. ${ketuaNip}`
    worksheet.getCell(`C${currentRowIdx}`).font = fontSignature
    worksheet.getCell(`J${currentRowIdx}`).value = `NIP. ${paniteraNip}`
    worksheet.getCell(`J${currentRowIdx}`).font = fontSignature

    // 5. Generate Buffer dan Kirim Response
    const buffer = await workbook.xlsx.writeBuffer()
    const fileName = `LIPA_5_${namaBulan}_${year}.xlsx`

    setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    setHeader(event, 'Content-Disposition', `attachment; filename="${fileName}"`)
    setHeader(event, 'Content-Length', buffer.byteLength)

    return buffer
  } catch (error: any) {
    console.error('Error in LIPA 5 export:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error?.message || 'Gagal mengekspor file Excel LIPA 5'
    }
  }
})
