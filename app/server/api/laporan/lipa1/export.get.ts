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
  const awalPeriode = `${periode}-01`

  const alur = (query.alur as string) || 'all'

  // Hitung tanggal akhir bulan
  const lastDay = new Date(year, month, 0).getDate()
  const tglLaporan = `${periode}-${String(lastDay).padStart(2, '0')}`

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
    let ketuaNama = 'Drs. H. Muhammad, M.H.'
    let ketuaNip = ''
    let paniteraNama = 'H. Panitera, S.H., M.H.'
    let paniteraNip = ''

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

    // 2. Kueri Rekapitulasi (G: 15, P: 16, GS: 17)
    async function getRekapAlur(alurId: number) {
      const sisaLaluRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(a.perkara_id) AS total
        FROM perkara AS a
        LEFT JOIN perkara_putusan AS b ON b.perkara_id = a.perkara_id
        WHERE a.tanggal_pendaftaran < '${awalPeriode}'
          AND (LEFT(b.tanggal_putusan, 7) >= '${periode}' OR b.tanggal_putusan IS NULL)
          AND a.alur_perkara_id = ${alurId}
      `).catch(() => [{ total: 0 }])
      const sisaBulanLalu = Number(sisaLaluRes[0]?.total || 0)

      const terimaRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(perkara_id) AS total
        FROM perkara
        WHERE LEFT(tanggal_pendaftaran, 7) = '${periode}'
          AND alur_perkara_id = ${alurId}
      `).catch(() => [{ total: 0 }])
      const terimaBulanIni = Number(terimaRes[0]?.total || 0)

      const putusRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(b.perkara_id) AS total
        FROM perkara AS a
        LEFT JOIN perkara_putusan AS b ON b.perkara_id = a.perkara_id
        WHERE LEFT(b.tanggal_putusan, 7) = '${periode}'
          AND a.alur_perkara_id = ${alurId}
      `).catch(() => [{ total: 0 }])
      const putus = Number(putusRes[0]?.total || 0)

      const sisaAkhirBulan = sisaBulanLalu + terimaBulanIni - putus

      const belumDibagiRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(a.perkara_id) AS total
        FROM perkara AS a
        LEFT JOIN perkara_penetapan AS b ON b.perkara_id = a.perkara_id
        LEFT JOIN perkara_putusan AS c ON c.perkara_id = a.perkara_id
        WHERE LEFT(a.tanggal_pendaftaran, 7) <= '${periode}'
          AND a.alur_perkara_id = ${alurId}
          AND (b.penetapan_majelis_hakim IS NULL OR LEFT(b.penetapan_majelis_hakim, 7) > '${periode}')
          AND (c.tanggal_putusan IS NULL OR LEFT(c.tanggal_putusan, 7) >= '${periode}')
      `).catch(() => [{ total: 0 }])
      const belumDibagi = Number(belumDibagiRes[0]?.total || 0)

      const sudahDibagi = sisaAkhirBulan - belumDibagi

      const belumMinutasiRes = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(a.perkara_id) AS total
        FROM perkara AS a
        LEFT JOIN perkara_putusan AS b ON b.perkara_id = a.perkara_id
        WHERE LEFT(a.tanggal_pendaftaran, 7) <= '${periode}'
          AND a.alur_perkara_id = ${alurId}
          AND (b.tanggal_minutasi IS NULL OR LEFT(b.tanggal_minutasi, 7) > '${periode}' OR b.tanggal_minutasi = '0000-00-00' OR b.tanggal_minutasi = '')
          AND b.tanggal_putusan <= '${tglLaporan}'
          AND b.tanggal_putusan IS NOT NULL
      `).catch(() => [{ total: 0 }])
      const sisaBelumMinutasi = Number(belumMinutasiRes[0]?.total || 0)

      return {
        sisaBulanLalu,
        terimaBulanIni,
        putus,
        sisaAkhirBulan,
        sudahDibagi,
        belumDibagi,
        sisaBelumMinutasi
      }
    }

    const [rekapG, rekapP, rekapGS] = await Promise.all([
      getRekapAlur(15),
      getRekapAlur(16),
      getRekapAlur(17)
    ])

    // 3. Kueri Detail Perkara (Semua baris tanpa limit pagination)
    let alurCondition = 'AND perkara.alur_perkara_id IN (15, 16, 17)'
    if (alur === '15' || alur === '16' || alur === '17') {
      alurCondition = `AND perkara.alur_perkara_id = ${alur}`
    }

    const dataSql = `
      SELECT
        perkara.perkara_id,
        perkara.alur_perkara_id AS alur_perkara_id,
        perkara.nomor_perkara AS nomor_perkara,
        perkara.jenis_perkara_nama AS kode_perkara,
        IF(LEFT(perkara_penetapan.penetapan_majelis_hakim, 7) > '${periode}', '', perkara_penetapan.majelis_hakim_text) AS majelis_hakim,
        SUBSTRING_INDEX(perkara_penetapan.panitera_pengganti_text, ': ', -1) AS panitera_pengganti,
        perkara.tanggal_pendaftaran AS tanggal_pendaftaran,
        IF(LEFT(perkara_penetapan.penetapan_majelis_hakim, 7) > '${periode}', '', perkara_penetapan.penetapan_majelis_hakim) AS pmh,
        IF(LEFT(perkara_penetapan.penetapan_hari_sidang, 7) > '${periode}', '', perkara_penetapan.penetapan_hari_sidang) AS phs,
        IF(LEFT(perkara_penetapan.penetapan_hari_sidang, 7) > '${periode}', '', perkara_penetapan.sidang_pertama) AS sidang_pertama,
        IF(LEFT(perkara_putusan.tanggal_putusan, 7) > '${periode}', '', perkara_putusan.tanggal_putusan) AS tanggal_putusan,
        IF(LEFT(perkara_putusan.tanggal_putusan, 7) > '${periode}' OR perkara_putusan.tanggal_putusan IS NULL, '', status_putusan.nama) AS jenis_putusan,
        IF(LEFT(perkara_penetapan.penetapan_majelis_hakim, 7) > '${periode}' OR perkara_penetapan.penetapan_majelis_hakim IS NULL, perkara.nomor_perkara, '') AS belum_dibagi,
        IF(LEFT(perkara_putusan.tanggal_putusan, 7) > '${periode}' OR perkara_putusan.tanggal_putusan IS NULL, perkara.nomor_perkara, '') AS belum_diputus
      FROM perkara
      LEFT JOIN perkara_penetapan ON perkara_penetapan.perkara_id = perkara.perkara_id
      LEFT JOIN perkara_putusan ON perkara_putusan.perkara_id = perkara.perkara_id
      LEFT JOIN status_putusan ON status_putusan.id = perkara_putusan.status_putusan_id
      WHERE (
        LEFT(perkara.tanggal_pendaftaran, 7) <= '${periode}'
        AND (perkara_putusan.tanggal_putusan IS NULL OR LEFT(perkara_putusan.tanggal_putusan, 7) >= '${periode}')
      )
      ${alurCondition}
      GROUP BY perkara.perkara_id
      ORDER BY perkara.alur_perkara_id ASC, perkara.tanggal_pendaftaran ASC, perkara.nomor_perkara ASC
    `

    const rows = await prisma.$queryRawUnsafe<any[]>(dataSql).catch((err) => {
      console.error('Error fetch detail for excel:', err)
      return []
    })

    // 4. Bangun Workbook Excel menggunakan ExcelJS
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'SIPP Monitoring'
    workbook.lastModifiedBy = 'SIPP Monitoring'
    workbook.created = new Date()
    workbook.modified = new Date()

    const worksheet = workbook.addWorksheet('LIPA 1', {
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

    // Atur Lebar Kolom A s/d N (14 Kolom) Sesuai Standar Resmi
    worksheet.columns = [
      { key: 'A', width: 6 },   // 1. No
      { key: 'B', width: 26 },  // 2. Nomor Perkara
      { key: 'C', width: 22 },  // 3. Kode Perkara
      { key: 'D', width: 44 },  // 4. Nama Majelis Hakim
      { key: 'E', width: 26 },  // 5. Nama PP
      { key: 'F', width: 14 },  // 6. Tanggal Penerimaan
      { key: 'G', width: 14 },  // 7. Tanggal PMH
      { key: 'H', width: 14 },  // 8. Tanggal PHS
      { key: 'I', width: 14 },  // 9. Tanggal Sidang I
      { key: 'J', width: 14 },  // 10. Tanggal Diputus
      { key: 'K', width: 18 },  // 11. Jenis Putusan
      { key: 'L', width: 24 },  // 12. Belum Dibagi
      { key: 'M', width: 24 },  // 13. Belum Diputus
      { key: 'N', width: 10 }   // 14. Ket
    ]

    // Style umum border tipis
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }

    // Helper format tanggal DD/MM/YYYY aman untuk Date, string, null, dsb.
    function fmtTgl(d: any): string {
      if (!d) return ''
      if (d instanceof Date) {
        if (isNaN(d.getTime())) return ''
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${day}/${m}/${y}`
      }
      const str = String(d).trim()
      if (str === '' || str === '0000-00-00' || str.startsWith('0000-00-00')) return ''
      try {
        const clean = str.includes('T') ? str.split('T')[0] : str.split(' ')[0]
        const parts = clean.split('-')
        if (parts.length === 3 && parts[0].length === 4) {
          return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`
        }
        return str
      } catch {
        return str
      }
    }

    // A. Header Judul Laporan (Row 1 - 3)
    worksheet.mergeCells('A1:N1')
    const cellA1 = worksheet.getCell('A1')
    cellA1.value = 'LAPORAN KEADAAN PERKARA'
    cellA1.font = { name: 'Times New Roman', size: 14, bold: true }
    cellA1.alignment = { horizontal: 'center', vertical: 'middle' }

    worksheet.mergeCells('A2:N2')
    const cellA2 = worksheet.getCell('A2')
    cellA2.value = `PADA ${namaSatker.toUpperCase()}`
    cellA2.font = { name: 'Times New Roman', size: 12, bold: true }
    cellA2.alignment = { horizontal: 'center', vertical: 'middle' }

    worksheet.mergeCells('A3:N3')
    const cellA3 = worksheet.getCell('A3')
    cellA3.value = `BULAN ${namaBulan} ${year}`
    cellA3.font = { name: 'Times New Roman', size: 12, bold: true }
    cellA3.alignment = { horizontal: 'center', vertical: 'middle' }

    // Label LIPA 1 di pojok kanan atas tabel (Row 5)
    worksheet.getCell('N5').value = 'LIPA 1'
    worksheet.getCell('N5').font = { name: 'Times New Roman', size: 10, bold: true }
    worksheet.getCell('N5').alignment = { horizontal: 'right', vertical: 'middle' }

    // B. Header Tabel Bertingkat (Row 6 - 8)
    worksheet.getRow(6).height = 24
    worksheet.getRow(7).height = 24
    worksheet.getRow(8).height = 18

    // Merge header kolom utama
    worksheet.mergeCells('A6:A7')
    worksheet.getCell('A6').value = 'No'

    worksheet.mergeCells('B6:B7')
    worksheet.getCell('B6').value = 'Nomor Perkara'

    worksheet.mergeCells('C6:C7')
    worksheet.getCell('C6').value = 'Kode Perkara'

    worksheet.mergeCells('D6:D7')
    worksheet.getCell('D6').value = 'Nama Majelis Hakim'

    worksheet.mergeCells('E6:E7')
    worksheet.getCell('E6').value = 'Nama PP'

    worksheet.mergeCells('F6:J6')
    worksheet.getCell('F6').value = 'Tanggal'

    worksheet.mergeCells('K6:K7')
    worksheet.getCell('K6').value = 'Jenis Putusan'

    worksheet.mergeCells('L6:M6')
    worksheet.getCell('L6').value = 'Sisa Akhir Bulan'

    worksheet.mergeCells('N6:N7')
    worksheet.getCell('N6').value = 'Ket'

    // Sub-header Row 7
    worksheet.getCell('F7').value = 'Penerimaan'
    worksheet.getCell('G7').value = 'PMH'
    worksheet.getCell('H7').value = 'PHS'
    worksheet.getCell('I7').value = 'Sidang I'
    worksheet.getCell('J7').value = 'Diputus'
    worksheet.getCell('L7').value = 'Belum Dibagi'
    worksheet.getCell('M7').value = 'Belum Diputus'

    // Nomor Kolom Row 8 (1 s/d 14)
    for (let c = 1; c <= 14; c++) {
      worksheet.getRow(8).getCell(c).value = c
    }

    // Styling Header Tabel (Row 6, 7, 8)
    for (let r = 6; r <= 8; r++) {
      const rowObj = worksheet.getRow(r)
      for (let c = 1; c <= 14; c++) {
        const cell = rowObj.getCell(c)
        cell.font = { name: 'Times New Roman', size: 10, bold: true }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        cell.border = thinBorder
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: r === 8 ? 'FFF2F2F2' : 'FFEAEAEA' }
        }
      }
    }

    // C. Data Rows (Mulai Row 9)
    let currentRow = 9
    let noUrut = 0
    let lastAlur = ''

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]

      // Nomor urut berlanjut sesuai alur seperti di php
      if (lastAlur === String(r.alur_perkara_id)) {
        noUrut++
      } else {
        noUrut = (lastAlur === '') ? 1 : (noUrut + 1)
        lastAlur = String(r.alur_perkara_id)
      }

      // Bersihkan teks majelis hakim dengan newline murni
      const majelisRaw = r.majelis_hakim !== null && r.majelis_hakim !== undefined ? String(r.majelis_hakim) : ''
      const majelisClean = majelisRaw
        .replace(/<\/br>/gi, '\r\n')
        .replace(/<br\s*\/?>/gi, '\r\n')
        .trim()

      const rowObj = worksheet.getRow(currentRow)
      // Perkirakan tinggi baris jika majelis hakim memiliki 3 baris
      const lineCount = majelisClean ? majelisClean.split('\n').length : 1
      rowObj.height = Math.max(30, lineCount * 18)

      rowObj.getCell(1).value = i + 1 // Nomor urut global baris
      rowObj.getCell(2).value = r.nomor_perkara || ''
      rowObj.getCell(3).value = r.kode_perkara || ''
      rowObj.getCell(4).value = majelisClean
      rowObj.getCell(5).value = r.panitera_pengganti || ''
      rowObj.getCell(6).value = fmtTgl(r.tanggal_pendaftaran)
      rowObj.getCell(7).value = fmtTgl(r.pmh)
      rowObj.getCell(8).value = fmtTgl(r.phs)
      rowObj.getCell(9).value = fmtTgl(r.sidang_pertama)
      rowObj.getCell(10).value = fmtTgl(r.tanggal_putusan)
      rowObj.getCell(11).value = r.jenis_putusan || ''
      rowObj.getCell(12).value = r.belum_dibagi || ''
      rowObj.getCell(13).value = r.belum_diputus || ''
      rowObj.getCell(14).value = r.belum_diputus || '' // Di template kolom 14 sering diisi nomor perkara belum putus/ket

      // Style tiap cell data
      for (let c = 1; c <= 14; c++) {
        const cell = rowObj.getCell(c)
        cell.font = { name: 'Times New Roman', size: 10 }
        cell.border = thinBorder
        cell.alignment = {
          vertical: 'middle',
          wrapText: true,
          horizontal: [1, 2, 6, 7, 8, 9, 10, 12, 13, 14].includes(c) ? 'center' : 'left'
        }
      }

      currentRow++
    }

    // D. Tabel Rekapitulasi di Bawah Data (Persis Gambar 2)
    currentRow += 2 // Beri jarak 2 baris

    // Header Rekapitulasi: I..K Merged "Rekapitulasi", L: "G", M: "P", N: "G.S"
    worksheet.mergeCells(`I${currentRow}:K${currentRow}`)
    worksheet.getCell(`I${currentRow}`).value = 'Rekapitulasi'
    worksheet.getCell(`L${currentRow}`).value = 'G'
    worksheet.getCell(`M${currentRow}`).value = 'P'
    worksheet.getCell(`N${currentRow}`).value = 'G.S'

    worksheet.getRow(currentRow).height = 20
    for (let c = 9; c <= 14; c++) {
      const cell = worksheet.getRow(currentRow).getCell(c)
      cell.font = { name: 'Times New Roman', size: 10, bold: true }
      cell.border = thinBorder
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      }
    }
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' }

    // Baris Rekapitulasi
    const rekapRows = [
      { label: '1. Sisa Bulan Lalu', g: rekapG.sisaBulanLalu, p: rekapP.sisaBulanLalu, gs: rekapGS.sisaBulanLalu, bold: false },
      { label: '2. Terima Bulan ini', g: rekapG.terimaBulanIni, p: rekapP.terimaBulanIni, gs: rekapGS.terimaBulanIni, bold: false },
      { label: '3. Putus', g: rekapG.putus, p: rekapP.putus, gs: rekapGS.putus, bold: false },
      { label: '4. Sisa Akhir Bulan', g: rekapG.sisaAkhirBulan, p: rekapP.sisaAkhirBulan, gs: rekapGS.sisaAkhirBulan, bold: true },
      { label: '    a. Sudah dibagi', g: rekapG.sudahDibagi, p: rekapP.sudahDibagi, gs: rekapGS.sudahDibagi, bold: false },
      { label: '    b. Belum dibagi', g: rekapG.belumDibagi, p: rekapP.belumDibagi, gs: rekapGS.belumDibagi, bold: false },
      { label: '5. Sisa belum diminutasi', g: rekapG.sisaBelumMinutasi, p: rekapP.sisaBelumMinutasi, gs: rekapGS.sisaBelumMinutasi, bold: false }
    ]

    for (const item of rekapRows) {
      currentRow++
      worksheet.getRow(currentRow).height = 20
      worksheet.mergeCells(`I${currentRow}:K${currentRow}`)

      const labelCell = worksheet.getCell(`I${currentRow}`)
      labelCell.value = item.label
      labelCell.font = { name: 'Times New Roman', size: 10, bold: item.bold }
      labelCell.alignment = { horizontal: 'left', vertical: 'middle' }

      const cellG = worksheet.getCell(`L${currentRow}`)
      cellG.value = item.g
      cellG.font = { name: 'Times New Roman', size: 10, bold: item.bold }
      cellG.alignment = { horizontal: 'center', vertical: 'middle' }

      const cellP = worksheet.getCell(`M${currentRow}`)
      cellP.value = item.p
      cellP.font = { name: 'Times New Roman', size: 10, bold: item.bold }
      cellP.alignment = { horizontal: 'center', vertical: 'middle' }

      const cellGS = worksheet.getCell(`N${currentRow}`)
      cellGS.value = item.gs
      cellGS.font = { name: 'Times New Roman', size: 10, bold: item.bold }
      cellGS.alignment = { horizontal: 'center', vertical: 'middle' }

      for (let c = 9; c <= 14; c++) {
        worksheet.getRow(currentRow).getCell(c).border = thinBorder
      }
    }

    // E. Bagian Tanda Tangan Resmi (Kolom D untuk Ketua, Kolom I untuk Panitera)
    currentRow += 3

    // Baris Mengetahui & Tempat/Tanggal
    worksheet.getCell(`D${currentRow}`).value = 'Mengetahui'
    worksheet.getCell(`D${currentRow}`).font = { name: 'Times New Roman', size: 10 }
    worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }

    worksheet.getCell(`I${currentRow}`).value = `${kotaSatker}, ${lastDay} ${namaBulan.toLowerCase()} ${year}`
    worksheet.getCell(`I${currentRow}`).font = { name: 'Times New Roman', size: 10 }
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }

    // Baris Jabatan
    currentRow++
    worksheet.getCell(`D${currentRow}`).value = `Ketua ${namaSatker.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase())}`
    worksheet.getCell(`D${currentRow}`).font = { name: 'Times New Roman', size: 10 }
    worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }

    worksheet.getCell(`I${currentRow}`).value = 'Panitera'
    worksheet.getCell(`I${currentRow}`).font = { name: 'Times New Roman', size: 10 }
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }

    // Baris Nama Pejabat (Beri jarak 4 baris untuk Tanda Tangan)
    currentRow += 4
    worksheet.getCell(`D${currentRow}`).value = ketuaNama
    worksheet.getCell(`D${currentRow}`).font = { name: 'Times New Roman', size: 10, bold: true, underline: true }
    worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }

    worksheet.getCell(`I${currentRow}`).value = paniteraNama
    worksheet.getCell(`I${currentRow}`).font = { name: 'Times New Roman', size: 10, bold: true, underline: true }
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }

    // Baris NIP Pejabat
    currentRow++
    worksheet.getCell(`D${currentRow}`).value = ketuaNip ? `NIP. ${ketuaNip}` : ''
    worksheet.getCell(`D${currentRow}`).font = { name: 'Times New Roman', size: 10 }
    worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }

    worksheet.getCell(`I${currentRow}`).value = paniteraNip ? `NIP. ${paniteraNip}` : ''
    worksheet.getCell(`I${currentRow}`).font = { name: 'Times New Roman', size: 10 }
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' }

    // 5. Generate Buffer dan Kirimkan ke Browser
    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `LIPA_1_${namaBulan}_${year}.xlsx`

    setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
    setHeader(event, 'Content-Length', buffer.byteLength.toString())

    return buffer
  } catch (error: any) {
    console.error('Error export excel lipa1:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error?.message || 'Gagal mengekspor data ke Excel'
    }
  }
})
