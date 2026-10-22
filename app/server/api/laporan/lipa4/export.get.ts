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

    // 2. Kueri Detail Perkara PK LIPA 4
    const dataSql = `
      SELECT
        pk.perkara_id,
        pk.nomor_perkara_pn AS nomor_perkara_pa,
        COALESCE(pk.nomor_perkara_banding, bdg.nomor_perkara_banding) AS nomor_perkara_banding,
        COALESCE(pk.nomor_perkara_kasasi, ks.nomor_perkara_kasasi) AS nomor_perkara_kasasi,
        pk.permohonan_pk,
        pk.pengiriman_berkas_pk AS pengiriman_berkas_ma,
        IF(LEFT(pk.putusan_pk, 7) > '${periode}', NULL, pk.putusan_pk) AS putusan_pk,
        IF(LEFT(pk.penerimaan_berkas_pk, 7) > '${periode}', NULL, pk.penerimaan_berkas_pk) AS penerimaan_kembali_pa,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(pemberitahuan_putusan_pk, '%Y-%m-%d') SEPARATOR '\n')
           FROM perkara_pk_detil
           WHERE perkara_id = pk.perkara_id AND (status_pihak_id = 1 OR status_pihak_text LIKE '%Pemohon%') AND pemberitahuan_putusan_pk IS NOT NULL),
          pk.pemberitahuan_putusan_pk_pihak1
        ) AS pemberitahuan_putusan_p,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(pemberitahuan_putusan_pk, '%Y-%m-%d') SEPARATOR '\n')
           FROM perkara_pk_detil
           WHERE perkara_id = pk.perkara_id AND (status_pihak_id IN (3, 4) OR status_pihak_text LIKE '%Termohon%') AND pemberitahuan_putusan_pk IS NOT NULL),
          pk.pemberitahuan_putusan_pk_pihak2
        ) AS pemberitahuan_putusan_t,
        pk.pemberitahuan_putusan_pk,
        pk.nomor_perkara_pk,
        pk.status_putusan_pk_text,
        pk.catatan_putusan_pk,
        pk.tanggal_cabut
      FROM perkara_pk AS pk
      LEFT JOIN perkara_banding AS bdg ON bdg.perkara_id = pk.perkara_id
      LEFT JOIN perkara_kasasi AS ks ON ks.perkara_id = pk.perkara_id
      WHERE LEFT(pk.permohonan_pk, 7) <= '${periode}'
        AND (pk.putusan_pk IS NULL OR LEFT(pk.putusan_pk, 7) >= '${periode}')
        AND (pk.tanggal_cabut IS NULL OR LEFT(pk.tanggal_cabut, 7) >= '${periode}')
      ORDER BY pk.perkara_id ASC
    `

    const rows = await prisma.$queryRawUnsafe<any[]>(dataSql).catch((err) => {
      console.error('Error fetch LIPA 4 for export:', err)
      return []
    })

    // 3. Bangun Workbook ExcelJS Persis Format Resmi LIPA 4
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'SIPP - LIPA 4 Exporter'
    workbook.lastModifiedBy = 'Monev SIPP'
    workbook.created = new Date()
    workbook.modified = new Date()

    const worksheet = workbook.addWorksheet('LIPA 4', {
      pageSetup: {
        orientation: 'landscape',
        paperSize: 9, // A4
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
      },
      views: [{ showGridLines: true }]
    })

    // Setup Lebar Kolom (A s/d J = 10 Kolom)
    worksheet.columns = [
      { key: 'col1', width: 6 },   // NO
      { key: 'col2', width: 24 },  // TINGKAT PERTAMA
      { key: 'col3', width: 24 },  // TINGKAT BANDING
      { key: 'col4', width: 20 },  // TINGKAT KASASI
      { key: 'col5', width: 18 },  // PERMOHONAN & RISALAH PK
      { key: 'col6', width: 16 },  // PENGIRIMAN BERKAS KE MA
      { key: 'col7', width: 16 },  // PUTUS PK
      { key: 'col8', width: 18 },  // PENERIMAAN KEMBALI DI PA
      { key: 'col9', width: 18 },  // PEMBERITAHUAN KE PARA PIHAK
      { key: 'col10', width: 24 }  // KETERANGAN
    ]

    // Style Helper
    const fontHeaderTitle = { name: 'Arial', size: 12, bold: true }
    const fontHeaderSub = { name: 'Arial', size: 10, bold: true }
    const fontTableHeader = { name: 'Arial', size: 9, bold: true }
    const fontTableColNum = { name: 'Arial', size: 8, bold: true, color: { argb: 'FF555555' } }
    const fontData = { name: 'Arial', size: 9 }
    const fontDataBold = { name: 'Arial', size: 9, bold: true }
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

    // 1. Judul Laporan LIPA 4 (Baris 1-3)
    worksheet.mergeCells('A1:J1')
    const r1 = worksheet.getCell('A1')
    r1.value = 'LAPORAN PERKARA YANG DIMOHONKAN PENINJAUAN KEMBALI'
    r1.font = fontHeaderTitle
    r1.alignment = { horizontal: 'center', vertical: 'middle' }

    worksheet.mergeCells('A2:J2')
    const r2 = worksheet.getCell('A2')
    r2.value = `PADA ${namaSatker.toUpperCase()}`
    r2.font = fontHeaderSub
    r2.alignment = { horizontal: 'center', vertical: 'middle' }

    worksheet.mergeCells('A3:J3')
    const r3 = worksheet.getCell('A3')
    r3.value = `BULAN ${namaBulan} ${year}`
    r3.font = fontHeaderSub
    r3.alignment = { horizontal: 'center', vertical: 'middle' }

    // Kode LIPA 4 di kanan atas (J4)
    const rLipaCode = worksheet.getCell('J4')
    rLipaCode.value = 'LIPA 4'
    rLipaCode.font = { name: 'Arial', size: 9, bold: true }
    rLipaCode.alignment = { horizontal: 'right', vertical: 'middle' }

    // Baris 5: Spasi Kosong
    worksheet.addRow([])

    // 2. Baris Header Tabel Baris 1 (Row 6)
    worksheet.mergeCells('A6:A7')
    const hCol1 = worksheet.getCell('A6')
    hCol1.value = 'NO'
    hCol1.font = fontTableHeader
    hCol1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    hCol1.fill = fillHeaderTable
    hCol1.border = borderThin

    worksheet.mergeCells('B6:D6')
    const hCol23 = worksheet.getCell('B6')
    hCol23.value = 'NOMOR PERKARA'
    hCol23.font = fontTableHeader
    hCol23.alignment = { horizontal: 'center', vertical: 'middle' }
    hCol23.fill = fillHeaderTable
    hCol23.border = borderThin

    worksheet.mergeCells('E6:I6')
    const hColTanggal = worksheet.getCell('E6')
    hColTanggal.value = 'TANGGAL'
    hColTanggal.font = fontTableHeader
    hColTanggal.alignment = { horizontal: 'center', vertical: 'middle' }
    hColTanggal.fill = fillHeaderTable
    hColTanggal.border = borderThin

    worksheet.mergeCells('J6:J7')
    const hColKet = worksheet.getCell('J6')
    hColKet.value = 'KETERANGAN'
    hColKet.font = fontTableHeader
    hColKet.alignment = { horizontal: 'center', vertical: 'middle' }
    hColKet.fill = fillHeaderTable
    hColKet.border = borderThin

    // Baris Header Tabel Baris 2 (Row 7)
    const subHeaders = [
      { col: 'B', text: 'TINGKAT PERTAMA' },
      { col: 'C', text: 'TINGKAT BANDING' },
      { col: 'D', text: 'TINGKAT KASASI' },
      { col: 'E', text: 'PERMOHONAN DAN RISALAH PENINJAUAN KEMBALI' },
      { col: 'F', text: 'PENGIRIMAN BERKAS KE MA' },
      { col: 'G', text: 'PUTUS PENINJAUAN KEMBALI' },
      { col: 'H', text: 'PENERIMAAN KEMBALI BERKAS PENINJAUAN KEMBALI DI PA' },
      { col: 'I', text: 'PEMBERITAHUAN KE PARA PIHAK' }
    ]

    for (const sh of subHeaders) {
      const cell = worksheet.getCell(`${sh.col}7`)
      cell.value = sh.text
      cell.font = fontTableHeader
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.fill = fillHeaderTable
      cell.border = borderThin
    }

    // Border untuk sel merge baris 7
    worksheet.getCell('A7').border = borderThin
    worksheet.getCell('J7').border = borderThin

    // Baris Nomor Kolom (Row 8): 1 s/d 9
    const colNumbers = [
      { col: 'A', num: '1' },
      { col: 'B', num: '2' },
      { col: 'C', num: '' },
      { col: 'D', num: '3' },
      { col: 'E', num: '4' },
      { col: 'F', num: '5' },
      { col: 'G', num: '6' },
      { col: 'H', num: '7' },
      { col: 'I', num: '8' },
      { col: 'J', num: '9' }
    ]

    for (const cn of colNumbers) {
      const cell = worksheet.getCell(`${cn.col}8`)
      cell.value = cn.num
      cell.font = fontTableColNum
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.fill = fillColNum
      cell.border = borderThin
    }

    // Helper formatting tanggal ke DD/MM/YYYY
    const fmtTgl = (val: any): string => {
      if (!val) return ''
      try {
        if (val instanceof Date) {
          if (isNaN(val.getTime())) return ''
          const d = String(val.getDate()).padStart(2, '0')
          const m = String(val.getMonth() + 1).padStart(2, '0')
          const y = val.getFullYear()
          return `${d}/${m}/${y}`
        }
        const s = String(val).trim()
        if (s === '' || s === '0000-00-00' || s.startsWith('0000-00-00')) return ''
        const clean = s.includes('T') ? s.split('T')[0] : s.split(' ')[0]
        const p = clean.split('-')
        if (p.length === 3 && p[0].length === 4) {
          return `${p[2].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[0]}`
        }
        return s
      } catch {
        return ''
      }
    }

    const fmtMultiTgl = (strVal: any): string => {
      if (!strVal) return ''
      const raw = String(strVal).trim()
      if (!raw) return ''
      return raw
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => fmtTgl(s))
        .join('\n')
    }

    // 3. Masukkan Data Baris Perkara PK
    let currentRowIdx = 9
    if (rows.length === 0) {
      worksheet.mergeCells(`A${currentRowIdx}:J${currentRowIdx}`)
      const emptyCell = worksheet.getCell(`A${currentRowIdx}`)
      emptyCell.value = 'Tidak ada perkara yang dimohonkan Peninjauan Kembali (PK) untuk periode ini'
      emptyCell.font = { name: 'Arial', size: 9, italic: true }
      emptyCell.alignment = { horizontal: 'center', vertical: 'middle' }
      emptyCell.border = borderThin
      currentRowIdx++
    } else {
      rows.forEach((r, idx) => {
        // Teks Keterangan
        const ketParts: string[] = []
        if (r.tanggal_cabut) {
          ketParts.push(`Dicabut (${fmtTgl(r.tanggal_cabut)})`)
        }
        if (r.status_putusan_pk_text) {
          ketParts.push(r.status_putusan_pk_text)
        }
        if (r.nomor_perkara_pk) {
          ketParts.push(`No. MA: ${r.nomor_perkara_pk}`)
        }
        if (r.catatan_putusan_pk) {
          ketParts.push(r.catatan_putusan_pk)
        }

        // Susun teks pemberitahuan pihak
        let pemberitahuanText = ''
        if (r.pemberitahuan_putusan_p && r.pemberitahuan_putusan_t) {
          pemberitahuanText = `P: ${fmtMultiTgl(r.pemberitahuan_putusan_p)}\nT: ${fmtMultiTgl(r.pemberitahuan_putusan_t)}`
        } else if (r.pemberitahuan_putusan_p) {
          pemberitahuanText = `P: ${fmtMultiTgl(r.pemberitahuan_putusan_p)}`
        } else if (r.pemberitahuan_putusan_t) {
          pemberitahuanText = `T: ${fmtMultiTgl(r.pemberitahuan_putusan_t)}`
        } else if (r.pemberitahuan_putusan_pk) {
          pemberitahuanText = fmtTgl(r.pemberitahuan_putusan_pk)
        }

        const rowValues = [
          idx + 1,                                                          // 1. NO
          r.nomor_perkara_pa || '',                                         // 2. TINGKAT PERTAMA
          r.nomor_perkara_banding && r.nomor_perkara_banding !== '' ? r.nomor_perkara_banding : '', // 3. TINGKAT BANDING
          r.nomor_perkara_kasasi && r.nomor_perkara_kasasi !== '' ? r.nomor_perkara_kasasi : '',    // 4. TINGKAT KASASI
          fmtTgl(r.permohonan_pk),                                          // 5. PERMOHONAN & RISALAH PK
          fmtTgl(r.pengiriman_berkas_ma),                                   // 6. PENGIRIMAN BERKAS KE MA
          fmtTgl(r.putusan_pk),                                             // 7. PUTUS PK
          fmtTgl(r.penerimaan_kembali_pa),                                  // 8. PENERIMAAN KEMBALI DI PA
          pemberitahuanText,                                                // 9. PEMBERITAHUAN KE PARA PIHAK
          ketParts.join(' | ')                                              // 10. KETERANGAN
        ]

        const dataRow = worksheet.addRow(rowValues)
        dataRow.font = fontData

        // Set align & border untuk tiap sel di baris
        dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = borderThin
          // Kolom 1 (No), 3 (Bdg), 4 (Kasasi), 5-9 (Tanggal) centered
          if (colNumber === 1 || colNumber === 3 || colNumber === 4 || (colNumber >= 5 && colNumber <= 9)) {
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
          }

          if (colNumber === 2) {
            cell.font = fontDataBold
          }
        })

        currentRowIdx++
      })
    }

    // 4. Bagian Tanda Tangan di Bawah Tabel
    currentRowIdx += 2

    // Tanggal cetak di kanan
    const bulanIndo = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const today = new Date()
    const tglCetak = `${kotaSatker}, ${today.getDate()} ${bulanIndo[today.getMonth()]} ${today.getFullYear()}`

    // Mengetahui Ketua di kiri (B), Panitera di kanan (H)
    const signRowStart = currentRowIdx
    worksheet.getCell(`B${signRowStart}`).value = 'Mengetahui'
    worksheet.getCell(`B${signRowStart}`).font = fontSignature

    worksheet.getCell(`H${signRowStart}`).value = tglCetak
    worksheet.getCell(`H${signRowStart}`).font = fontSignature

    worksheet.getCell(`B${signRowStart + 1}`).value = `Ketua ${namaSatker}`
    worksheet.getCell(`B${signRowStart + 1}`).font = fontSignature

    worksheet.getCell(`H${signRowStart + 1}`).value = 'Panitera'
    worksheet.getCell(`H${signRowStart + 1}`).font = fontSignature

    // Spasi tanda tangan (4 baris)
    const signRowName = signRowStart + 5
    worksheet.getCell(`B${signRowName}`).value = ketuaNama
    worksheet.getCell(`B${signRowName}`).font = fontSignatureBold

    worksheet.getCell(`H${signRowName}`).value = paniteraNama
    worksheet.getCell(`H${signRowName}`).font = fontSignatureBold

    worksheet.getCell(`B${signRowName + 1}`).value = `NIP. ${ketuaNip}`
    worksheet.getCell(`B${signRowName + 1}`).font = fontSignature

    worksheet.getCell(`H${signRowName + 1}`).value = `NIP. ${paniteraNip}`
    worksheet.getCell(`H${signRowName + 1}`).font = fontSignature

    // 5. Generate Buffer & Kirim Stream Response Excel
    const buffer = await workbook.xlsx.writeBuffer()

    setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    setHeader(event, 'Content-Disposition', `attachment; filename="LIPA_4_${namaBulan}_${year}.xlsx"`)
    setHeader(event, 'Content-Length', buffer.byteLength)

    return buffer
  } catch (error: any) {
    console.error('Error in lipa4/export:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error.message || 'Gagal membuat file export Excel LIPA 4'
    }
  }
})
