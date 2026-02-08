import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate RPS PDF with signature spaces
 * @param {Object} rpsData - RPS data including course info, CPMK, meetings
 */
export const generateRPSPDF = (rpsData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Helper function to add header
    const addHeader = () => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('RENCANA PEMBELAJARAN SEMESTER (RPS)', pageWidth / 2, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('INSTITUSI PENDIDIKAN', pageWidth / 2, 22, { align: 'center' });
        doc.line(15, 26, pageWidth - 15, 26);
    };

    // Page 1: Course Information
    addHeader();
    let yPos = 35;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMASI MATA KULIAH', 15, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const courseInfo = [
        ['Kode Mata Kuliah', ': ' + rpsData.kode_mk],
        ['Nama Mata Kuliah', ': ' + rpsData.nama_mk],
        ['SKS', ': ' + rpsData.sks],
        ['Semester', ': ' + rpsData.semester],
        ['Prodi', ': ' + rpsData.prodi],
        ['Dosen Pengampu', ': ' + rpsData.dosen_name],
    ];

    courseInfo.forEach(([label, value]) => {
        doc.text(label, 15, yPos);
        doc.text(value, 70, yPos);
        yPos += 6;
    });

    // CPMK Section
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CAPAIAN PEMBELAJARAN MATA KULIAH (CPMK)', 15, yPos);
    yPos += 8;

    doc.autoTable({
        startY: yPos,
        head: [['No', 'Kode CPMK', 'Deskripsi']],
        body: rpsData.cpmk.map((item, index) => [
            index + 1,
            item.kode_cpmk,
            item.deskripsi
        ]),
        theme: 'grid',
        headStyles: { fillColor: [63, 81, 181], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 15, right: 15 },
    });

    // Meeting Plan (new page)
    doc.addPage();
    addHeader();
    yPos = 35;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('RENCANA PEMBELAJARAN', 15, yPos);
    yPos += 8;

    doc.autoTable({
        startY: yPos,
        head: [['Minggu', 'Sub-CPMK', 'Materi', 'Metode', 'Waktu', 'Penilaian']],
        body: rpsData.meetings.map(meeting => [
            meeting.sampai_minggu_ke ? `${meeting.minggu_ke}-${meeting.sampai_minggu_ke}` : meeting.minggu_ke,
            meeting.sub_cpmk || '-',
            meeting.materi_pembelajaran || '-',
            meeting.metode_pembelajaran || '-',
            meeting.waktu || '-',
            meeting.penilaian || '-'
        ]),
        theme: 'grid',
        headStyles: {
            fillColor: [63, 81, 181],
            fontSize: 8,
            valign: 'middle',
            halign: 'center',
            lineWidth: 0.1,
            lineColor: [200, 200, 200]
        },
        bodyStyles: {
            fontSize: 8,
            valign: 'top'
        },
        margin: { left: 15, right: 15 },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 40 }, // Sub-CPMK
            2: { cellWidth: 35 }, // Materi
            3: { cellWidth: 30 }, // Metode
            4: { cellWidth: 20, halign: 'center' }, // Waktu
            5: { cellWidth: 30 }  // Penilaian
        },
        didParseCell: function (data) {
            // Apply word wrap explicitly if needed, but autoTable does it by default with cellWidth
        }
    });

    // Signature Section
    const finalY = doc.lastAutoTable.finalY + 20;
    const signatureY = finalY > pageHeight - 60 ? 35 : finalY;

    if (finalY > pageHeight - 60) {
        doc.addPage();
        addHeader();
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Left: Kaprodi
    doc.text('Menyetujui,', 15, signatureY);
    doc.text('Ketua Program Studi', 15, signatureY + 6);
    doc.line(15, signatureY + 30, 70, signatureY + 30); // Space for signature
    doc.text(rpsData.kaprodi_name || '(...........................)', 15, signatureY + 36);

    // Right: Dosen
    doc.text('Dosen Pengampu,', pageWidth - 85, signatureY);
    doc.line(pageWidth - 85, signatureY + 30, pageWidth - 15, signatureY + 30); // Space for signature
    doc.text(rpsData.dosen_name, pageWidth - 85, signatureY + 36);

    // Save PDF
    doc.save(`RPS_${rpsData.kode_mk}_${rpsData.nama_mk}.pdf`);
};

/**
 * Generate Daftar Nilai PDF
 * @param {Object} gradeData - Student grades data
 */
export const generateDaftarNilaiPDF = (gradeData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DAFTAR NILAI MAHASISWA', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Institut Teknologi dan Kesehatan Mahardika', pageWidth / 2, 22, { align: 'center' });
    doc.line(15, 26, pageWidth - 15, 26);

    let yPos = 35;

    // Course info
    const courseInfo = [
        ['Mata Kuliah', ': ' + gradeData.nama_mk],
        ['Kode', ': ' + gradeData.kode_mk],
        ['Semester', ': ' + gradeData.semester],
        ['Dosen', ': ' + gradeData.dosen_name],
    ];

    courseInfo.forEach(([label, value]) => {
        doc.text(label, 15, yPos);
        doc.text(value, 60, yPos);
        yPos += 6;
    });

    yPos += 5;

    // Grades table
    doc.autoTable({
        startY: yPos,
        head: [['No', 'NPM', 'Nama', 'Tugas', 'Kuis', 'UTS', 'UAS', 'Nilai Akhir', 'Huruf']],
        body: gradeData.students.map((student, index) => [
            index + 1,
            student.npm,
            student.nama,
            student.nilai_tugas || 0,
            student.nilai_kuis || 0,
            student.nilai_uts || 0,
            student.nilai_uas || 0,
            student.nilai_akhir || 0,
            student.nilai_huruf || '-'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [63, 81, 181], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 15, right: 15 },
    });

    // Signatures
    const finalY = doc.lastAutoTable.finalY + 20;

    doc.setFontSize(10);
    doc.text('Ketua Program Studi,', 15, finalY);
    doc.line(15, finalY + 24, 70, finalY + 24);
    doc.text(gradeData.kaprodi_name || '(...........................)', 15, finalY + 30);

    doc.text('Dosen Pengampu,', pageWidth - 85, finalY);
    doc.line(pageWidth - 85, finalY + 24, pageWidth - 15, finalY + 24);
    doc.text(gradeData.dosen_name, pageWidth - 85, finalY + 30);

    doc.save(`Daftar_Nilai_${gradeData.kode_mk}.pdf`);
};

/**
 * Generate Laporan Portofolio PDF with charts
 * @param {Object} portfolioData - Complete portfolio data with achievements
 */
export const generateLaporanPortofolioPDF = (portfolioData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN PORTOFOLIO PEMBELAJARAN', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Institut Teknologi dan Kesehatan Mahardika', pageWidth / 2, 22, { align: 'center' });
    doc.line(15, 26, pageWidth - 15, 26);

    let yPos = 35;

    // Course Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('RINGKASAN MATA KULIAH', 15, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const info = [
        ['Mata Kuliah', ': ' + portfolioData.nama_mk],
        ['Semester', ': ' + portfolioData.semester],
        ['Total Mahasiswa', ': ' + portfolioData.total_students],
        ['Dosen', ': ' + portfolioData.dosen_name],
    ];

    info.forEach(([label, value]) => {
        doc.text(label, 15, yPos);
        doc.text(value, 60, yPos);
        yPos += 6;
    });

    // Achievement Summary
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('KETERCAPAIAN CPL', 15, yPos);
    yPos += 8;

    doc.autoTable({
        startY: yPos,
        head: [['Kode CPL', 'Deskripsi', 'Ketercapaian', 'Status']],
        body: portfolioData.cpl_achievement.map(cpl => [
            cpl.kode_cpl,
            cpl.deskripsi,
            `${cpl.percentage}%`,
            cpl.percentage >= 75 ? 'Tercapai' : 'Perlu Perbaikan'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [63, 81, 181], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 15, right: 15 },
    });

    // CPMK Achievement
    doc.addPage();
    yPos = 35;
    doc.setFont('helvetica', 'bold');
    doc.text('KETERCAPAIAN CPMK', 15, yPos);
    yPos += 8;

    doc.autoTable({
        startY: yPos,
        head: [['Kode CPMK', 'Deskripsi', 'Ketercapaian', 'Status']],
        body: portfolioData.cpmk_achievement.map(cpmk => [
            cpmk.kode_cpmk,
            cpmk.deskripsi,
            `${cpmk.percentage}%`,
            cpmk.percentage >= 75 ? 'Tercapai' : 'Perlu Perbaikan'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [63, 81, 181], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 15, right: 15 },
    });

    // Grade Distribution
    const gradeY = doc.lastAutoTable.finalY + 15;
    doc.setFont('helvetica', 'bold');
    doc.text('DISTRIBUSI NILAI', 15, gradeY);

    doc.autoTable({
        startY: gradeY + 8,
        head: [['Nilai', 'Jumlah Mahasiswa', 'Persentase']],
        body: portfolioData.grade_distribution.map(grade => [
            grade.huruf,
            grade.count,
            `${grade.percentage}%`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [63, 81, 181], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 15, right: 15 },
    });

    // Signatures on last page
    const finalY = doc.lastAutoTable.finalY + 20;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Ketua Program Studi,', 15, finalY);
    doc.line(15, finalY + 24, 70, finalY + 24);
    doc.text(portfolioData.kaprodi_name || '(...........................)', 15, finalY + 30);

    doc.text('Dosen Pengampu,', pageWidth - 85, finalY);
    doc.line(pageWidth - 85, finalY + 24, pageWidth - 15, finalY + 24);
    doc.text(portfolioData.dosen_name, pageWidth - 85, finalY + 30);

    doc.save(`Laporan_Portofolio_${portfolioData.kode_mk}.pdf`);
};
