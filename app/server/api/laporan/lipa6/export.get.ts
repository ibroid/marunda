import { defineEventHandler, getQuery, setHeader, setResponseStatus } from 'h3'
import ExcelJS from 'exceljs'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const month = query.month && !isNaN(Number(query.month)) ? Number(query.month) : currentMonth
  const role = query.role === 'semua' ? 'semua' : 'ketua'

  const monthStr = month < 10 ? `0${month}` : `${month}`
  const periode = `${year}-${monthStr}`
  const awalPeriode = `${periode}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const akhirPeriode = `${periode}-${String(lastDay).padStart(2, '0')}`

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

    // 2. Kueri LIPA 6
    const joinCondition = role === 'semua'
      ? `FIND_IN_SET(CAST(h.id AS CHAR), pt.majelis_hakim_id) > 0`
      : `CAST(SUBSTRING_INDEX(pt.majelis_hakim_id, ',', 1) AS UNSIGNED) = h.id`

    const rekapSql = `
      SELECT
        h.id AS hakim_id,
        h.nama_gelar AS nama_hakim,
        h.nip,

        -- 1. Sisa bulan lalu (G)
        SUM(CASE WHEN pt.penetapan_majelis_hakim < '${awalPeriode}'
                  AND (pp.tanggal_putusan IS NULL OR pp.tanggal_putusan >= '${awalPeriode}')
                  AND (p.alur_perkara_id IN (15, 17) OR p.nomor_perkara LIKE '%/Pdt.G/%')
                 THEN 1 ELSE 0 END) AS sisa_lalu_g,

        -- 1. Sisa bulan lalu (P)
        SUM(CASE WHEN pt.penetapan_majelis_hakim < '${awalPeriode}'
                  AND (pp.tanggal_putusan IS NULL OR pp.tanggal_putusan >= '${awalPeriode}')
                  AND (p.alur_perkara_id = 16 OR p.nomor_perkara LIKE '%/Pdt.P/%')
                 THEN 1 ELSE 0 END) AS sisa_lalu_p,

        -- 2. Tambah bulan ybs (G)
        SUM(CASE WHEN pt.penetapan_majelis_hakim >= '${awalPeriode}' AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                  AND (p.alur_perkara_id IN (15, 17) OR p.nomor_perkara LIKE '%/Pdt.G/%')
                 THEN 1 ELSE 0 END) AS tambah_g,

        -- 2. Tambah bulan ybs (P)
        SUM(CASE WHEN pt.penetapan_majelis_hakim >= '${awalPeriode}' AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                  AND (p.alur_perkara_id = 16 OR p.nomor_perkara LIKE '%/Pdt.P/%')
                 THEN 1 ELSE 0 END) AS tambah_p,

        -- 4. Diputus (G)
        SUM(CASE WHEN pp.tanggal_putusan >= '${awalPeriode}' AND pp.tanggal_putusan <= '${akhirPeriode}'
                  AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                  AND (p.alur_perkara_id IN (15, 17) OR p.nomor_perkara LIKE '%/Pdt.G/%')
                 THEN 1 ELSE 0 END) AS putus_g,

        -- 4. Diputus (P)
        SUM(CASE WHEN pp.tanggal_putusan >= '${awalPeriode}' AND pp.tanggal_putusan <= '${akhirPeriode}'
                  AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                  AND (p.alur_perkara_id = 16 OR p.nomor_perkara LIKE '%/Pdt.P/%')
                 THEN 1 ELSE 0 END) AS putus_p,

        -- 6. Jumlah yang diminutir (G)
        SUM(CASE WHEN pp.tanggal_minutasi >= '${awalPeriode}' AND pp.tanggal_minutasi <= '${akhirPeriode}'
                  AND pp.tanggal_minutasi != '0000-00-00'
                  AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                  AND (p.alur_perkara_id IN (15, 17) OR p.nomor_perkara LIKE '%/Pdt.G/%')
                 THEN 1 ELSE 0 END) AS minutir_g,

        -- 6. Jumlah yang diminutir (P)
        SUM(CASE WHEN pp.tanggal_minutasi >= '${awalPeriode}' AND pp.tanggal_minutasi <= '${akhirPeriode}'
                  AND pp.tanggal_minutasi != '0000-00-00'
                  AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                  AND (p.alur_perkara_id = 16 OR p.nomor_perkara LIKE '%/Pdt.P/%')
                 THEN 1 ELSE 0 END) AS minutir_p,

        -- 7. Sisa yang belum diminutir (G)
        SUM(CASE WHEN pp.tanggal_putusan IS NOT NULL AND pp.tanggal_putusan <= '${akhirPeriode}'
                  AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi > '${akhirPeriode}')
                  AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                  AND (p.alur_perkara_id IN (15, 17) OR p.nomor_perkara LIKE '%/Pdt.G/%')
                 THEN 1 ELSE 0 END) AS belum_minutir_g,

        -- 7. Sisa yang belum diminutir (P)
        SUM(CASE WHEN pp.tanggal_putusan IS NOT NULL AND pp.tanggal_putusan <= '${akhirPeriode}'
                  AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi > '${akhirPeriode}')
                  AND pt.penetapan_majelis_hakim <= '${akhirPeriode} 23:59:59'
                  AND (p.alur_perkara_id = 16 OR p.nomor_perkara LIKE '%/Pdt.P/%')
                 THEN 1 ELSE 0 END) AS belum_minutir_p

      FROM hakim_pn h
      LEFT JOIN perkara_penetapan pt ON ${joinCondition}
      LEFT JOIN perkara p ON p.perkara_id = pt.perkara_id
      LEFT JOIN perkara_putusan pp ON pp.perkara_id = p.perkara_id
      WHERE h.aktif = 'Y'
      GROUP BY h.id, h.nama_gelar, h.nip
      ORDER BY h.id ASC, h.nama_gelar ASC
    `

    const rawRows = await prisma.$queryRawUnsafe<any[]>(rekapSql).catch((err) => {
      console.error('Error fetch rekap LIPA 6 for excel:', err)
      return []
    })

    // 3. Buat Workbook ExcelJS
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'SIPP Monev'
    workbook.lastModifiedBy = 'SIPP Monev'
    workbook.created = new Date()
    workbook.modified = new Date()

    const worksheet = workbook.addWorksheet('LIPA 6', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3
        }
      }
    })

    // Atur Lebar Kolom A s/d P (16 Kolom)
    worksheet.columns = [
      { key: 'A', width: 6 },   // No.
      { key: 'B', width: 34 },  // Nama Hakim/Majelis
      { key: 'C', width: 8 },   // Sisa bulan lalu G
      { key: 'D', width: 8 },   // Sisa bulan lalu P
      { key: 'E', width: 8 },   // Tambah bulan ybs G
      { key: 'F', width: 8 },   // Tambah bulan ybs P
      { key: 'G', width: 8 },   // Jumlah G
      { key: 'H', width: 8 },   // Jumlah P
      { key: 'I', width: 8 },   // Diputus G
      { key: 'J', width: 8 },   // Diputus P
      { key: 'K', width: 8 },   // Sisa bulan ybs G
      { key: 'L', width: 8 },   // Sisa bulan ybs P
      { key: 'M', width: 9 },   // Diminutir G
      { key: 'N', width: 9 },   // Diminutir P
      { key: 'O', width: 9 },   // Sisa Belum Diminutir G
      { key: 'P', width: 9 }    // Sisa Belum Diminutir P
    ]

    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }

    // A. Header Judul Laporan (Row 1 - 3)
    worksheet.mergeCells('A1:P1')
    const cellA1 = worksheet.getCell('A1')
    cellA1.value = 'LAPORAN KEGIATAN HAKIM'
    cellA1.font = { name: 'Arial', size: 13, bold: true }
    cellA1.alignment = { horizontal: 'center', vertical: 'middle' }

    worksheet.mergeCells('A2:P2')
    const cellA2 = worksheet.getCell('A2')
    cellA2.value = `PADA ${namaSatker.toUpperCase()}`
    cellA2.font = { name: 'Arial', size: 11, bold: true }
    cellA2.alignment = { horizontal: 'center', vertical: 'middle' }

    worksheet.mergeCells('A3:P3')
    const cellA3 = worksheet.getCell('A3')
    cellA3.value = `BULAN ${namaBulan} ${year}`
    cellA3.font = { name: 'Arial', size: 11, bold: true }
    cellA3.alignment = { horizontal: 'center', vertical: 'middle' }

    // Kode LIPA di kanan atas
    const cellLipa = worksheet.getCell('P4')
    cellLipa.value = 'LIPA6'
    cellLipa.font = { name: 'Arial', size: 10, bold: true }
    cellLipa.alignment = { horizontal: 'right', vertical: 'middle' }

    // B. Header Tabel (Row 6 - 7)
    // Row 6
    worksheet.mergeCells('A6:A7')
    worksheet.getCell('A6').value = 'No.'

    worksheet.mergeCells('B6:B7')
    worksheet.getCell('B6').value = 'Nama Hakim/Majelis'

    worksheet.mergeCells('C6:D6')
    worksheet.getCell('C6').value = 'Sisa bulan lalu'

    worksheet.mergeCells('E6:F6')
    worksheet.getCell('E6').value = 'Tambah bulan ybs'

    worksheet.mergeCells('G6:H6')
    worksheet.getCell('G6').value = 'Jumlah'

    worksheet.mergeCells('I6:J6')
    worksheet.getCell('I6').value = 'Diputus'

    worksheet.mergeCells('K6:L6')
    worksheet.getCell('K6').value = 'Sisa bulan ybs'

    worksheet.mergeCells('M6:N6')
    worksheet.getCell('M6').value = 'Jumlah yang diminutir'

    worksheet.mergeCells('O6:P6')
    worksheet.getCell('O6').value = 'Sisa yang belum diminutir'

    // Row 7 (Sub-header G & P)
    worksheet.getCell('C7').value = 'G'
    worksheet.getCell('D7').value = 'P'
    worksheet.getCell('E7').value = 'G'
    worksheet.getCell('F7').value = 'P'
    worksheet.getCell('G7').value = 'G'
    worksheet.getCell('H7').value = 'P'
    worksheet.getCell('I7').value = 'G'
    worksheet.getCell('J7').value = 'P'
    worksheet.getCell('K7').value = 'G'
    worksheet.getCell('L7').value = 'P'
    worksheet.getCell('M7').value = 'G'
    worksheet.getCell('N7').value = 'P'
    worksheet.getCell('O7').value = 'G'
    worksheet.getCell('P7').value = 'P'

    // Style Header Cells
    for (let r = 6; r <= 7; r++) {
      const row = worksheet.getRow(r)
      row.height = 24
      for (let c = 1; c <= 16; c++) {
        const cell = row.getCell(c)
        cell.font = { name: 'Arial', size: 9, bold: true }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        cell.border = thinBorder
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        }
      }
    }

    // C. Data Rows
    let currentRowNum = 8
    const totals = {
      sisa_lalu_g: 0,
      sisa_lalu_p: 0,
      tambah_g: 0,
      tambah_p: 0,
      jumlah_g: 0,
      jumlah_p: 0,
      putus_g: 0,
      putus_p: 0,
      sisa_ybs_g: 0,
      sisa_ybs_p: 0,
      minutir_g: 0,
      minutir_p: 0,
      belum_minutir_g: 0,
      belum_minutir_p: 0
    }

    rawRows.forEach((r, idx) => {
      const sisa_lalu_g = Number(r.sisa_lalu_g || 0)
      const sisa_lalu_p = Number(r.sisa_lalu_p || 0)
      const tambah_g = Number(r.tambah_g || 0)
      const tambah_p = Number(r.tambah_p || 0)
      const jumlah_g = sisa_lalu_g + tambah_g
      const jumlah_p = sisa_lalu_p + tambah_p
      const putus_g = Number(r.putus_g || 0)
      const putus_p = Number(r.putus_p || 0)
      const sisa_ybs_g = Math.max(0, jumlah_g - putus_g)
      const sisa_ybs_p = Math.max(0, jumlah_p - putus_p)
      const minutir_g = Number(r.minutir_g || 0)
      const minutir_p = Number(r.minutir_p || 0)
      const belum_minutir_g = Number(r.belum_minutir_g || 0)
      const belum_minutir_p = Number(r.belum_minutir_p || 0)

      totals.sisa_lalu_g += sisa_lalu_g
      totals.sisa_lalu_p += sisa_lalu_p
      totals.tambah_g += tambah_g
      totals.tambah_p += tambah_p
      totals.jumlah_g += jumlah_g
      totals.jumlah_p += jumlah_p
      totals.putus_g += putus_g
      totals.putus_p += putus_p
      totals.sisa_ybs_g += sisa_ybs_g
      totals.sisa_ybs_p += sisa_ybs_p
      totals.minutir_g += minutir_g
      totals.minutir_p += minutir_p
      totals.belum_minutir_g += belum_minutir_g
      totals.belum_minutir_p += belum_minutir_p

      const row = worksheet.getRow(currentRowNum)
      row.height = 20

      row.getCell(1).value = idx + 1
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }

      row.getCell(2).value = r.nama_hakim || '-'
      row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' }

      const numCols = [
        sisa_lalu_g, sisa_lalu_p,
        tambah_g, tambah_p,
        jumlah_g, jumlah_p,
        putus_g, putus_p,
        sisa_ybs_g, sisa_ybs_p,
        minutir_g, minutir_p,
        belum_minutir_g, belum_minutir_p
      ]

      numCols.forEach((val, i) => {
        const c = row.getCell(3 + i)
        c.value = val
        c.alignment = { horizontal: 'center', vertical: 'middle' }
        c.numFmt = '#,##0'
      })

      for (let c = 1; c <= 16; c++) {
        const cell = row.getCell(c)
        cell.font = { name: 'Arial', size: 9 }
        cell.border = thinBorder
      }

      currentRowNum++
    })

    // D. Row Jumlah / Total
    const totalRow = worksheet.getRow(currentRowNum)
    totalRow.height = 22
    worksheet.mergeCells(`A${currentRowNum}:B${currentRowNum}`)
    totalRow.getCell(1).value = 'JUMLAH'
    totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }

    const totalVals = [
      totals.sisa_lalu_g, totals.sisa_lalu_p,
      totals.tambah_g, totals.tambah_p,
      totals.jumlah_g, totals.jumlah_p,
      totals.putus_g, totals.putus_p,
      totals.sisa_ybs_g, totals.sisa_ybs_p,
      totals.minutir_g, totals.minutir_p,
      totals.belum_minutir_g, totals.belum_minutir_p
    ]

    totalVals.forEach((val, i) => {
      const c = totalRow.getCell(3 + i)
      c.value = val
      c.alignment = { horizontal: 'center', vertical: 'middle' }
      c.numFmt = '#,##0'
    })

    for (let c = 1; c <= 16; c++) {
      const cell = totalRow.getCell(c)
      cell.font = { name: 'Arial', size: 9, bold: true }
      cell.border = thinBorder
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' }
      }
    }

    // E. Bagian Tanda Tangan
    currentRowNum += 2
    const now = new Date()
    const tglNowStr = `${now.getDate()} ${namaBulan} ${year}`

    worksheet.getCell(`B${currentRowNum}`).value = 'Mengetahui'
    worksheet.getCell(`B${currentRowNum}`).font = { name: 'Arial', size: 10 }

    worksheet.getCell(`M${currentRowNum}`).value = `${kotaSatker}, ${tglNowStr}`
    worksheet.getCell(`M${currentRowNum}`).font = { name: 'Arial', size: 10 }

    currentRowNum++
    worksheet.getCell(`B${currentRowNum}`).value = `Ketua ${namaSatker}`
    worksheet.getCell(`B${currentRowNum}`).font = { name: 'Arial', size: 10, bold: true }

    worksheet.getCell(`M${currentRowNum}`).value = 'Panitera'
    worksheet.getCell(`M${currentRowNum}`).font = { name: 'Arial', size: 10, bold: true }

    currentRowNum += 4
    worksheet.getCell(`B${currentRowNum}`).value = ketuaNama
    worksheet.getCell(`B${currentRowNum}`).font = { name: 'Arial', size: 10, bold: true, underline: true }

    worksheet.getCell(`M${currentRowNum}`).value = paniteraNama
    worksheet.getCell(`M${currentRowNum}`).font = { name: 'Arial', size: 10, bold: true, underline: true }

    currentRowNum++
    worksheet.getCell(`B${currentRowNum}`).value = `NIP. ${ketuaNip}`
    worksheet.getCell(`B${currentRowNum}`).font = { name: 'Arial', size: 9 }

    worksheet.getCell(`M${currentRowNum}`).value = `NIP. ${paniteraNip}`
    worksheet.getCell(`M${currentRowNum}`).font = { name: 'Arial', size: 9 }

    const buffer = await workbook.xlsx.writeBuffer()
    const fileName = `LIPA_6_${namaBulan}_${year}.xlsx`

    setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    setHeader(event, 'Content-Disposition', `attachment; filename="${fileName}"`)
    setHeader(event, 'Content-Length', buffer.byteLength.toString())

    return buffer
  } catch (error: any) {
    console.error('Error generating LIPA 6 Excel:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error.message || 'Gagal membuat file Excel LIPA 6'
    }
  }
})
