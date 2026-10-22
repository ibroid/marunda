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

  // Hitung tanggal akhir bulan
  const lastDay = new Date(year, month, 0).getDate()

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

    // 2. Kueri Detail Perkara Banding LIPA 2
    const dataSql = `
      SELECT
        bdg.perkara_id,
        perkara_penetapan.majelis_hakim_nama AS majelis_hakim,
        bdg.nomor_perkara_pn AS nomor_perkara_pa,
        bdg.nomor_perkara_banding AS nomor_perkara_banding,
        bdg.putusan_pn AS putusan_pa,
        bdg.permohonan_banding AS permohonan_banding,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(pemberitahuan_inzage, '%Y-%m-%d') SEPARATOR '\n')
           FROM perkara_banding_detil
           WHERE perkara_id = bdg.perkara_id AND (status_pihak_id = 1 OR status_pihak_text LIKE '%Pembanding%') AND pemberitahuan_inzage IS NOT NULL),
          bdg.pemberitahuan_inzage_pembanding,
          bdg.pemberitahuan_inzage
        ) AS pemberitahuan_inzage_p,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(pemberitahuan_inzage, '%Y-%m-%d') SEPARATOR '\n')
           FROM perkara_banding_detil
           WHERE perkara_id = bdg.perkara_id AND (status_pihak_id IN (2, 4, 3, 5) OR status_pihak_text LIKE '%Terbanding%') AND pemberitahuan_inzage IS NOT NULL),
          bdg.pemberitahuan_inzage_terbanding
        ) AS pemberitahuan_inzage_t,
        bdg.pengiriman_berkas_banding AS pengiriman_berkas_pta,
        IF(LEFT(bdg.putusan_banding, 7) > '${periode}', NULL, bdg.putusan_banding) AS putusan_banding,
        IF(LEFT(bdg.penerimaan_kembali_berkas_banding, 7) > '${periode}', NULL, bdg.penerimaan_kembali_berkas_banding) AS penerimaan_kembali_pa,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(pemberitahuan_putusan_banding, '%Y-%m-%d') SEPARATOR '\n')
           FROM perkara_banding_detil
           WHERE perkara_id = bdg.perkara_id AND (status_pihak_id = 1 OR status_pihak_text LIKE '%Pembanding%') AND pemberitahuan_putusan_banding IS NOT NULL),
          bdg.pemberitahuan_putusan_banding_pembanding,
          bdg.pemberitahuan_putusan_banding
        ) AS pemberitahuan_putusan_p,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(pemberitahuan_putusan_banding, '%Y-%m-%d') SEPARATOR '\n')
           FROM perkara_banding_detil
           WHERE perkara_id = bdg.perkara_id AND (status_pihak_id IN (2, 4, 3, 5) OR status_pihak_text LIKE '%Terbanding%') AND pemberitahuan_putusan_banding IS NOT NULL),
          bdg.pemberitahuan_putusan_banding_terbanding
        ) AS pemberitahuan_putusan_t,
        bdg.tgl_pengiriman_berkas_putusan AS penyampaian_relas_pta,
        bdg.catatan_banding AS ket
      FROM perkara_banding AS bdg
      LEFT JOIN perkara_penetapan ON perkara_penetapan.perkara_id = bdg.perkara_id
      WHERE LEFT(bdg.permohonan_banding, 7) <= '${periode}'
        AND (bdg.putusan_banding IS NULL OR LEFT(bdg.putusan_banding, 7) >= '${periode}')
      ORDER BY bdg.permohonan_banding ASC, bdg.perkara_id ASC
    `

    const rows = await prisma.$queryRawUnsafe<any[]>(dataSql).catch((err) => {
      console.error('Error fetch LIPA 2 for export:', err)
      return []
    })

    // 3. Bangun Workbook ExcelJS Persis Format Resmi LIPA 2
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'SIPP - LIPA 2 Exporter'
    workbook.lastModifiedBy = 'Monev SIPP'
    workbook.created = new Date()
    workbook.modified = new Date()

    const worksheet = workbook.addWorksheet('LIPA 2', {
      pageSetup: {
        orientation: 'landscape',
        paperSize: 9, // A4
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
      },
      views: [{ showGridLines: true }]
    })

    // Setup Lebar Kolom (A s/d L = 12 Kolom)
    worksheet.columns = [
      { key: 'col1', width: 6 },   // NO
      { key: 'col2', width: 26 },  // NOMOR PERKARA PA
      { key: 'col3', width: 30 },  // NAMA HAKIM/ MAJELIS
      { key: 'col4', width: 14 },  // PUTUSAN PA
      { key: 'col5', width: 15 },  // PERMOHONAN BANDING
      { key: 'col6', width: 16 },  // PEMBERITAHUAN INZAGE
      { key: 'col7', width: 15 },  // PENGIRIMAN BERKAS PTA
      { key: 'col8', width: 14 },  // PUTUS BANDING
      { key: 'col9', width: 15 },  // PENERIMAAN KEMBALI DI PA
      { key: 'col10', width: 16 }, // PEMBERITAHUAN KE PARA PIHAK
      { key: 'col11', width: 16 }, // PENYAMPAIAN FOTOCOPY RELAS PBT KE PTA
      { key: 'col12', width: 18 }  // Ket
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
    worksheet.mergeCells('A1:L1')
    worksheet.getCell('A1').value = 'LAPORAN PERKARA YANG DIMOHONKAN BANDING'
    worksheet.getCell('A1').font = { name: 'Times New Roman', size: 12, bold: true }
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }

    worksheet.mergeCells('A2:L2')
    worksheet.getCell('A2').value = `PADA ${namaSatker.toUpperCase()}`
    worksheet.getCell('A2').font = { name: 'Times New Roman', size: 11, bold: true }
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' }

    worksheet.mergeCells('A3:L3')
    worksheet.getCell('A3').value = `BULAN  ${namaBulan} ${year}`
    worksheet.getCell('A3').font = { name: 'Times New Roman', size: 11, bold: true }
    worksheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' }

    // Label pojok kanan LIPA 2
    worksheet.getCell('L4').value = 'LIPA 2'
    worksheet.getCell('L4').font = { name: 'Times New Roman', size: 9, bold: true }
    worksheet.getCell('L4').alignment = { horizontal: 'right', vertical: 'middle' }

    // B. Header Tabel (Row 6, 7, 8)
    worksheet.mergeCells('A6:A7')
    worksheet.getCell('A6').value = 'NO'

    worksheet.mergeCells('B6:B7')
    worksheet.getCell('B6').value = 'NOMOR PERKARA PA'

    worksheet.mergeCells('C6:C7')
    worksheet.getCell('C6').value = 'NAMA HAKIM/ MAJELIS'

    worksheet.mergeCells('D6:K6')
    worksheet.getCell('D6').value = 'TANGGAL'

    worksheet.getCell('D7').value = 'PUTUSAN PA'
    worksheet.getCell('E7').value = 'PERMOHONAN BANDING'
    worksheet.getCell('F7').value = 'PEMBERITAHUAN INZAGE'
    worksheet.getCell('G7').value = 'PENGIRIMAN BERKAS PTA'
    worksheet.getCell('H7').value = 'PUTUS BANDING'
    worksheet.getCell('I7').value = 'PENERIMAAN KEMBALI DI PA'
    worksheet.getCell('J7').value = 'PEMBERITAHUAN KE PARA PIHAK'
    worksheet.getCell('K7').value = 'PENYAMPAIAN FOTOCOPY RELAS PBT KE PTA'

    worksheet.mergeCells('L6:L7')
    worksheet.getCell('L6').value = 'Ket'

    // Style Header Row 6 & 7
    for (let r = 6; r <= 7; r++) {
      worksheet.getRow(r).height = 24
      for (let c = 1; c <= 12; c++) {
        const cell = worksheet.getRow(r).getCell(c)
        cell.font = { name: 'Times New Roman', size: 9, bold: true }
        cell.border = thinBorder
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      }
    }

    // Row 8: Nomor Kolom (1..12)
    worksheet.getRow(8).height = 18
    for (let c = 1; c <= 12; c++) {
      const cell = worksheet.getRow(8).getCell(c)
      cell.value = c
      cell.font = { name: 'Times New Roman', size: 9, bold: true }
      cell.border = thinBorder
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    }

    // C. Data Rows (Mulai Row 9)
    let currentRow = 9
    let no = 1

    for (const r of rows) {
      const rowObj = worksheet.getRow(currentRow)
      rowObj.height = 36 // Ruang cukup untuk nama majelis & tanggal 2 baris

      // Format nama majelis
      const majelisFormatted = (r.majelis_hakim || '')
        .replace(/<\/br>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/Hakim Ketua\s*:\s*/gi, '')
        .replace(/Hakim Anggota\s*:\s*/gi, '')
        .trim()

      // Format inzage P & T
      const inzP = fmtMultiTgl(r.pemberitahuan_inzage_p)
      const inzT = fmtMultiTgl(r.pemberitahuan_inzage_t)
      let inzageCell = ''
      if (inzP && inzT) inzageCell = `${inzP}\n${inzT}`
      else inzageCell = inzP || inzT || ''

      // Format pbt putusan P & T
      const pbtP = fmtMultiTgl(r.pemberitahuan_putusan_p)
      const pbtT = fmtMultiTgl(r.pemberitahuan_putusan_t)
      let pbtCell = ''
      if (pbtP && pbtT) pbtCell = `${pbtP}\n${pbtT}`
      else pbtCell = pbtP || pbtT || ''

      rowObj.getCell(1).value = no++
      rowObj.getCell(2).value = r.nomor_perkara_pa || ''
      rowObj.getCell(3).value = majelisFormatted
      rowObj.getCell(4).value = fmtTgl(r.putusan_pa)
      rowObj.getCell(5).value = fmtTgl(r.permohonan_banding)
      rowObj.getCell(6).value = inzageCell
      rowObj.getCell(7).value = fmtTgl(r.pengiriman_berkas_pta)
      rowObj.getCell(8).value = fmtTgl(r.putusan_banding)
      rowObj.getCell(9).value = fmtTgl(r.penerimaan_kembali_pa)
      rowObj.getCell(10).value = pbtCell
      rowObj.getCell(11).value = fmtTgl(r.penyampaian_relas_pta)
      rowObj.getCell(12).value = r.ket || ''

      for (let c = 1; c <= 12; c++) {
        const cell = rowObj.getCell(c)
        cell.font = { name: 'Times New Roman', size: 9 }
        cell.border = thinBorder
        cell.alignment = {
          vertical: 'middle',
          wrapText: true,
          horizontal: [1, 2, 4, 5, 6, 7, 8, 9, 10, 11].includes(c) ? 'center' : 'left'
        }
      }

      currentRow++
    }

    // Jika baris kosong (0 data), buat 1 baris kosong bergaris
    if (rows.length === 0) {
      const rowObj = worksheet.getRow(currentRow)
      rowObj.height = 24
      for (let c = 1; c <= 12; c++) {
        const cell = rowObj.getCell(c)
        cell.border = thinBorder
      }
      currentRow++
    }

    // D. Bagian Tanda Tangan Resmi (Kolom C untuk Ketua, Kolom I untuk Panitera)
    currentRow += 3

    worksheet.getCell(`C${currentRow}`).value = 'Mengetahui'
    worksheet.getCell(`C${currentRow}`).font = { name: 'Times New Roman', size: 10 }
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }

    worksheet.getCell(`I${currentRow}`).value = `${kotaSatker}, ${lastDay} ${namaBulan.toLowerCase()} ${year}`
    worksheet.getCell(`I${currentRow}`).font = { name: 'Times New Roman', size: 10 }
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }

    currentRow++
    worksheet.getCell(`C${currentRow}`).value = `Ketua ${namaSatker.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase())}`
    worksheet.getCell(`C${currentRow}`).font = { name: 'Times New Roman', size: 10 }
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }

    worksheet.getCell(`I${currentRow}`).value = 'Panitera'
    worksheet.getCell(`I${currentRow}`).font = { name: 'Times New Roman', size: 10 }
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }

    currentRow += 4
    worksheet.getCell(`C${currentRow}`).value = ketuaNama
    worksheet.getCell(`C${currentRow}`).font = { name: 'Times New Roman', size: 10, bold: true, underline: true }
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }

    worksheet.getCell(`I${currentRow}`).value = paniteraNama
    worksheet.getCell(`I${currentRow}`).font = { name: 'Times New Roman', size: 10, bold: true, underline: true }
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }

    currentRow++
    worksheet.getCell(`C${currentRow}`).value = ketuaNip ? `NIP. ${ketuaNip}` : ''
    worksheet.getCell(`C${currentRow}`).font = { name: 'Times New Roman', size: 10 }
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }

    worksheet.getCell(`I${currentRow}`).value = paniteraNip ? `NIP. ${paniteraNip}` : ''
    worksheet.getCell(`I${currentRow}`).font = { name: 'Times New Roman', size: 10 }
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }

    // 4. Generate Buffer dan Kirimkan ke Browser
    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `LIPA_2_${namaBulan}_${year}.xlsx`

    setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
    setHeader(event, 'Content-Length', buffer.byteLength.toString())

    return buffer
  } catch (error: any) {
    console.error('Error export excel lipa2:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error?.message || 'Gagal mengekspor data ke Excel'
    }
  }
})
