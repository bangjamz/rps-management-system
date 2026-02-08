import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from '../lib/axios';

export const exportRPSToPDF = async (course, rpsData) => {
    try {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;

        // Helper to parse JSON strings if needed
        const safeParse = (val) => {
            if (typeof val === 'string') {
                if (val.trim().startsWith('[') || val.trim().startsWith('{')) {
                    try { return JSON.parse(val); } catch (e) { return val; }
                }
            }
            return val;
        };

        // Advanced helper to extract clean tags and remove array artifacts (Recursive)
        const extractTags = (v) => {
            if (!v) return [];

            let list = [];
            if (Array.isArray(v)) {
                list = v.flat(Infinity);
            } else if (typeof v === 'string') {
                try {
                    const parsed = JSON.parse(v);
                    list = Array.isArray(parsed) ? parsed : [v];
                } catch (e) {
                    const trimmed = v.trim().replace(/^"+|"+$/g, '');
                    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                        list = trimmed.slice(1, -1).split(',').map(s => s.trim());
                    } else {
                        list = [v];
                    }
                }
            } else {
                return [];
            }

            const cleanItems = [];
            for (let item of list) {
                if (!item) continue;
                let s = String(item).trim();

                // Recursive cleanup: if item looks like a stringified array
                if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"[') && s.endsWith(']"'))) {
                    const nested = extractTags(s);
                    cleanItems.push(...nested);
                    continue;
                }

                // Strip quotes
                s = s.replace(/^['"]+|['"]+$/g, '');

                // Filter garbage
                if (s && s !== '' && s !== '[]' && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'undefined') {
                    cleanItems.push(s);
                }
            }
            return [...new Set(cleanItems)];
        };

        // Helper to parse Indikator into a clean numbered string
        const parseIndikator = (val) => {
            const list = extractTags(val);
            if (list.length === 0) return '-';
            if (list.length === 1) return list[0];
            return list.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
        };

        // Fetch Global Settings for Logo & PT Name
        let globalSettings = null;
        try {
            const settingsRes = await axios.get('/settings');
            globalSettings = settingsRes.data;
        } catch (e) {
            console.warn('Failed to fetch settings for PDF:', e);
        }

        // Add logo
        try {
            if (globalSettings?.logo_path) {
                const logoPath = `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${globalSettings.logo_path}?t=${new Date().getTime()}`;
                const logoImg = await loadImage(logoPath);
                // Use PNG to support transparency, or leave it to Auto if possible
                // jspdf supports 'PNG', 'JPEG', 'WEBP'
                const format = globalSettings.logo_path.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG';
                doc.addImage(logoImg, format, margin, 10, 20, 20);
            }
        } catch (error) {
            console.warn('Logo not loaded for PDF:', error);
            // No fallback image, it will just show text header
        }

        // Header text
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('RENCANA PEMBELAJARAN SEMESTER', pageWidth / 2, 15, { align: 'center' });

        // Dynamic Prodi/Fakultas from MK
        const prodiName = course?.prodi?.nama || rpsData?.mata_kuliah?.prodi?.nama || '-';
        const fakultasName = course?.prodi?.fakultas?.nama || rpsData?.mata_kuliah?.prodi?.fakultas?.nama || '-';
        const ptName = globalSettings?.nama_pt || 'INSTITUT TEKNOLOGI DAN KESEHATAN MAHARDIKA';

        doc.setFontSize(11);
        doc.text(`PROGRAM STUDI ${prodiName.toUpperCase()}`, pageWidth / 2, 21, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`FAKULTAS ${fakultasName.toUpperCase()}`, pageWidth / 2, 27, { align: 'center' });
        doc.text(ptName.toUpperCase(), pageWidth / 2, 32, { align: 'center' });

        let yPos = 40;

        // SKS Breakdown
        const bobotSks = safeParse(rpsData?.bobot_sks || {});
        const sksText = `T: ${bobotSks?.t || course?.sks || 0} P: ${bobotSks?.p || 0}`;

        // Identitas MK
        autoTable(doc, {
            startY: yPos,
            head: [[{ content: 'IDENTITAS MATA KULIAH', colSpan: 6, styles: { halign: 'center', fillColor: [200, 200, 200] } }]],
            body: [
                ['Nama MK', course?.nama_mk || rpsData?.mata_kuliah?.nama_mk || '-', 'Kode MK', course?.kode_mk || rpsData?.mata_kuliah?.kode_mk || '-', 'Rumpun MK', rpsData?.rumpun_mk || '-'],
                ['Bobot SKS', sksText, 'Semester', `${rpsData?.semester || course?.semester || '-'}`, 'Tgl Penyusunan', rpsData?.updated_at ? new Date(rpsData.updated_at).toLocaleDateString('id-ID') : '-'],
            ],
            theme: 'grid',
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 20, fontStyle: 'bold' },
                2: { cellWidth: 18, fontStyle: 'bold' },
                4: { cellWidth: 25, fontStyle: 'bold' },
            }
        });

        yPos = doc.lastAutoTable.finalY + 3;

        // Otorisasi
        autoTable(doc, {
            startY: yPos,
            head: [[{ content: 'OTORISASI / PENGESAHAN', colSpan: 3, styles: { halign: 'center', fillColor: [200, 200, 200] } }]],
            body: [
                [
                    { content: `Pengembang RPS\n\n\n\n${rpsData?.pengembang_rps || rpsData?.dosen?.nama_lengkap || '(..................)'}`, styles: { halign: 'center', minCellHeight: 25 } },
                    { content: `Koordinator Rumpun MK\n\n\n\n${rpsData?.koordinator_rumpun_mk || '(..................)'}`, styles: { halign: 'center', minCellHeight: 25 } },
                    { content: `Ketua Program Studi\n\n\n\n${rpsData?.ketua_prodi || '(..................)'}`, styles: { halign: 'center', minCellHeight: 25 } }
                ],
                [
                    { content: `Dekan\n\n\n\n${rpsData?.dekan || '(..................)'}`, colSpan: 1, styles: { halign: 'center', minCellHeight: 25 } },
                    { content: `Penjaminan Mutu\n\n\n\n${rpsData?.penjaminan_mutu || '(..................)'}`, colSpan: 2, styles: { halign: 'center', minCellHeight: 25 } }
                ]
            ],
            theme: 'grid',
            styles: { fontSize: 8 },
        });

        yPos = doc.lastAutoTable.finalY + 3;

        // CPL
        if (rpsData?.cpl?.length > 0) {
            autoTable(doc, {
                startY: yPos,
                head: [[{ content: 'CAPAIAN PEMBELAJARAN LULUSAN (CPL)', colSpan: 2, styles: { halign: 'center', fillColor: [180, 180, 180] } }]],
                body: rpsData.cpl.map(cpl => [cpl.kode_cpl, cpl.deskripsi]),
                theme: 'grid',
                styles: { fontSize: 8 },
                columnStyles: { 0: { cellWidth: 25 } },
            });
            yPos = doc.lastAutoTable.finalY + 3;
        }

        // CPMK
        if (rpsData?.cpmk?.length > 0) {
            autoTable(doc, {
                startY: yPos,
                head: [[{ content: 'CAPAIAN PEMBELAJARAN MATA KULIAH (CPMK)', colSpan: 2, styles: { halign: 'center', fillColor: [180, 180, 180] } }]],
                body: rpsData.cpmk.map(cpmk => [cpmk.kode_cpmk, cpmk.deskripsi]),
                theme: 'grid',
                styles: { fontSize: 8 },
                columnStyles: { 0: { cellWidth: 25 } },
            });
            yPos = doc.lastAutoTable.finalY + 3;
        }

        // Deskripsi MK
        autoTable(doc, {
            startY: yPos,
            body: [
                [{ content: 'Deskripsi Singkat MK', styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }, rpsData?.deskripsi_mk || '-'],
                [{ content: 'MK Prasyarat', styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }, rpsData?.mk_syarat || '-'],
            ],
            theme: 'grid',
            styles: { fontSize: 8 },
            columnStyles: { 0: { cellWidth: 35 } },
        });

        yPos = doc.lastAutoTable.finalY + 3;

        // Pustaka & Media
        autoTable(doc, {
            startY: yPos,
            head: [[{ content: 'PUSTAKA & MEDIA PEMBELAJARAN', colSpan: 2, styles: { halign: 'center', fillColor: [200, 200, 200] } }]],
            body: [
                [{ content: 'Pustaka Utama', styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }, rpsData?.pustaka_utama || '-'],
                [{ content: 'Pustaka Pendukung', styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }, rpsData?.pustaka_pendukung || '-'],
                [{ content: 'Media Software', styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }, rpsData?.media_software || '-'],
                [{ content: 'Media Hardware', styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }, rpsData?.media_hardware || '-'],
            ],
            theme: 'grid',
            styles: { fontSize: 8 },
            columnStyles: { 0: { cellWidth: 35 } },
        });

        yPos = doc.lastAutoTable.finalY + 3;

        // Dosen & Ketentuan
        const rawDosenList = rpsData?.dosen_pengampu_list || [];
        const dosenList = Array.isArray(rawDosenList)
            ? rawDosenList.map(d => typeof d === 'string' ? d : (d.nama || d.nama_lengkap)).join(', ')
            : rawDosenList;

        autoTable(doc, {
            startY: yPos,
            head: [[{ content: 'DOSEN PENGAMPU & KETENTUAN', colSpan: 2, styles: { halign: 'center', fillColor: [200, 200, 200] } }]],
            body: [
                [{ content: 'Dosen Pengampu', styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }, dosenList || rpsData?.dosen?.nama_lengkap || '-'],
                [{ content: 'Ambang Batas Kelulusan MK', styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }, rpsData?.ambang_batas_mk || '55%'],
                [{ content: 'Ambang Batas Kehadiran', styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }, rpsData?.ambang_batas_mhs || '75%'],
            ],
            theme: 'grid',
            styles: { fontSize: 8 },
            columnStyles: { 0: { cellWidth: 35 } },
        });



        // Weekly schedule - New Page
        doc.addPage();
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('RENCANA PEMBELAJARAN MINGGUAN', pageWidth / 2, 15, { align: 'center' });

        const pertemuanData = rpsData?.pertemuan || [];
        // Flatten logic for Week 1-16, respecting ranges
        const tableBody = [];

        const sortedPertemuan = [...pertemuanData].sort((a, b) => (a.minggu_ke || 0) - (b.minggu_ke || 0));
        let skipUntil = 0;

        sortedPertemuan.forEach((pertemuan) => {
            const i = pertemuan.minggu_ke;
            if (i <= skipUntil) return;

            // If it covers multiple weeks
            const endWeek = pertemuan.sampai_minggu_ke || i;
            if (endWeek > i) skipUntil = endWeek;

            const weekLabel = (endWeek > i) ? `${i}-${endWeek}` : i.toString();

            if (pertemuan.is_uts || i === 8 && pertemuan.materi?.includes('UTS')) {
                tableBody.push([
                    { content: weekLabel, styles: { halign: 'center', fontStyle: 'bold' } },
                    { content: 'EVALUASI TENGAH SEMESTER (UTS)', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold' } },
                    { content: pertemuan.bobot_penilaian || '22', styles: { halign: 'center' } }
                ]);
                return;
            }
            if (pertemuan.is_uas || i === 16 && pertemuan.materi?.includes('UAS')) {
                tableBody.push([
                    { content: weekLabel, styles: { halign: 'center', fontStyle: 'bold' } },
                    { content: 'EVALUASI AKHIR SEMESTER (UAS)', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold' } },
                    { content: pertemuan.bobot_penilaian || '26', styles: { halign: 'center' } }
                ]);
                return;
            }

            const metodeLuring = extractTags(pertemuan.metode_pembelajaran);
            const namaLms = pertemuan.nama_lms ? String(pertemuan.nama_lms).trim() : '';
            const platform = pertemuan.link_meet_platform ? String(pertemuan.link_meet_platform).trim() : '';
            const link = pertemuan.link_daring ? String(pertemuan.link_daring).trim() : '';
            const penugasan = pertemuan.penugasan ? String(pertemuan.penugasan).trim() : '';

            const bentukMetodeParts = [];

            if (metodeLuring.length > 0) {
                bentukMetodeParts.push(`Metode Luring:\n${metodeLuring.join(', ')}`);
            }

            if (namaLms || platform || link) {
                const daringLines = ['Metode Daring:'];
                if (namaLms) daringLines.push(`LMS: ${namaLms}`);
                if (platform) daringLines.push(`Platform: ${platform}`);
                if (link) daringLines.push(`Link: ${link}`);
                bentukMetodeParts.push(daringLines.join('\n'));
            }

            if (penugasan) {
                bentukMetodeParts.push(`Penugasan:\n${penugasan}`);
            }

            const bentukMetode = bentukMetodeParts.join('\n\n');

            // Indikator & Kriteria Combined
            const indikatorList = extractTags(pertemuan.indikator);
            const indikatorSection = indikatorList.length > 0
                ? `Indikator:\n${indikatorList.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}`
                : '';

            const kriteriaParts = [];
            if (pertemuan.kriteria_penilaian) {
                kriteriaParts.push(`Kriteria:\n${pertemuan.kriteria_penilaian}`);
            }
            if (pertemuan.teknik_penilaian && Array.isArray(pertemuan.teknik_penilaian) && pertemuan.teknik_penilaian.length > 0) {
                kriteriaParts.push(`Teknik: ${pertemuan.teknik_penilaian.join(', ')}`);
            }

            const kriteriaSection = kriteriaParts.join('\n');
            const indikatorKriteriaText = [indikatorSection, kriteriaSection].filter(Boolean).join('\n\n');

            tableBody.push([
                { content: weekLabel, styles: { halign: 'center' } },
                pertemuan.sub_cpmk || '-',
                indikatorKriteriaText || '-',
                bentukMetode || '-',
                pertemuan.materi || '-',
                { content: pertemuan.bobot_penilaian?.toString() || '0', styles: { halign: 'center' } }
            ]);
        });

        autoTable(doc, {
            startY: 20,
            head: [['Mg Ke-', 'Kemampuan Akhir Tiap Tahapan Belajar (Sub-CPMK)', 'Indikator & Kriteria', 'Bentuk, Metode, & Penugasan', 'Materi Pembelajaran', 'Bobot (%)']],
            body: tableBody,
            theme: 'grid',
            styles: {
                fontSize: 7,
                valign: 'middle',
                overflow: 'linebreak',
                cellPadding: 2
            },
            headStyles: {
                fillColor: [80, 80, 80],
                halign: 'center',
                valign: 'middle',
                fontSize: 7,
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 40 },
                2: { cellWidth: 35 },
                3: { cellWidth: 35 },
                4: { cellWidth: 45 },
                5: { cellWidth: 12, halign: 'center' }
            }
        });

        // Metode Penilaian - MOVED HERE (Requested: After Page Break, After Weekly)
        const metodePenilaianList = safeParse(rpsData?.metode_penilaian || []);
        if (metodePenilaianList.length > 0) {
            doc.addPage(); // Force new page
            yPos = 20; // Reset Y

            // Header for the whole section
            autoTable(doc, {
                startY: yPos,
                head: [[{ content: 'METODE PENILAIAN & KRITERIA', styles: { halign: 'center', fillColor: [200, 200, 200], fontSize: 10, fontStyle: 'bold' } }]],
                body: [],
                theme: 'plain',
            });
            yPos = doc.lastAutoTable.finalY + 5;

            metodePenilaianList.forEach((metode, idx) => {
                const title = metode.name || metode.type || `Metode ${idx + 1}`;

                // 1. Method Header
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text(`${idx + 1}. ${title}`, margin, yPos + 4);
                yPos += 6;

                // Check page break for method start
                if (yPos > doc.internal.pageSize.getHeight() - 20) {
                    doc.addPage();
                    yPos = 20;
                }

                // 2. Content
                if (metode.type === 'Rubrik' && Array.isArray(metode.scales)) {
                    const scales = metode.scales || [];
                    const criteria = metode.criteria || [];
                    const rubricHead = ['Kriteria / Dimensi', ...scales.map(s => `${s.label} (${s.value})`)];
                    const rubricBody = criteria.map(c => {
                        const row = [c.label];
                        scales.forEach((_, sIdx) => {
                            row.push(c.descriptions?.[sIdx] || '-');
                        });
                        return row;
                    });

                    autoTable(doc, {
                        startY: yPos,
                        head: [rubricHead],
                        body: rubricBody,
                        theme: 'grid',
                        styles: { fontSize: 7, cellPadding: 2 },
                        headStyles: { fillColor: [240, 240, 240], textColor: 50 },
                        margin: { left: margin + 5 }
                    });
                    yPos = doc.lastAutoTable.finalY + 6;

                } else {
                    const desc = metode.description || metode.kriteria || '-';
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');

                    const splitDesc = doc.splitTextToSize(desc, pageWidth - margin * 2 - 5);
                    doc.text(splitDesc, margin + 5, yPos + 3);
                    yPos += (splitDesc.length * 4) + 6;
                }

                // Trailing check
                if (yPos > doc.internal.pageSize.getHeight() - 20) {
                    doc.addPage();
                    yPos = 20;
                }
            });
        }

        // Save
        const filename = `RPS_${course?.kode_mk || rpsData?.mata_kuliah?.kode_mk || 'document'}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
    } catch (err) {
        console.error('Critical failure in exportRPSToPDF:', err);
        throw err;
    }
};

// Helper to load image
const loadImage = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = (e) => {
            console.error('Failed to load image:', url, e);
            reject(e);
        };
        img.src = url;
    });
};
