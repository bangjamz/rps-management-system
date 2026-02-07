import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import { exportRPSToPDF } from '../utils/rpsExport';

export default function RPSViewPage() {
    const { courseId, rpsId } = useParams(); // Get rpsId if available
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [rpsData, setRpsData] = useState(null);
    const [existingRPS, setExistingRPS] = useState(null);
    const [course, setCourse] = useState(null);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        loadRPSData();
    }, [courseId, rpsId]);

    const loadRPSData = async () => {
        setLoading(true);
        try {
            let rps = null;

            // Strategy 1: Load by RPS ID (Specific Version)
            if (rpsId) {
                const rpsResponse = await axios.get(`/rps/${rpsId}`);
                rps = rpsResponse.data;
                setExistingRPS(rps);
                setRpsData(rps);

                // If we loaded by RPS ID, we might need to fetch course info from the RPS data or separate call
                if (rps.mata_kuliah) {
                    setCourse(rps.mata_kuliah);
                } else if (courseId) {
                    const courseResponse = await axios.get(`/courses/${courseId}`);
                    setCourse(courseResponse.data);
                }
            }
            // Strategy 2: Load by Course ID (Latest Version - Legacy/Fallback)
            else if (courseId) {
                // Fetch course info
                const courseResponse = await axios.get(`/courses/${courseId}`);
                setCourse(courseResponse.data);

                // Try to fetch existing RPS for this course
                try {
                    const rpsResponse = await axios.get(`/rps/by-course/${courseId}`);
                    if (rpsResponse.data && rpsResponse.data.id) {
                        setExistingRPS(rpsResponse.data);
                        setRpsData(rpsResponse.data);
                    }
                } catch (rpsError) {
                    console.log('No existing RPS for this course');
                }
            }

            // Also fetch CPL/CPMK for display (only if we need them for empty state or enhancement?)
            // If we have RPS Data, we might not need this if the RPS object (from /rps/:id) has inclusions.
            // But existing code uses `rpsData.cpl` which might come from standard curriculum if new?
            // Existing `RPSViewPage` logic for "Create New" view seemed to rely on this.
            // But here we are mostly Viewing Existing.

            // If we didn't find RPS, load "Template/Empty" data (Only relevant for CourseId path)
            if (!rps && !rpsId && !existingRPS) { // Added !existingRPS to ensure it only runs if no RPS was found by courseId either
                const cplResponse = await axios.get('/curriculum/cpl');
                const cpmkResponse = await axios.get('/curriculum/cpmk');
                setRpsData({
                    cpl: cplResponse.data.slice(0, 3),
                    cpmk: cpmkResponse.data.slice(0, 5),
                });
            }
        } catch (error) {
            console.error('Failed to load RPS:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        try {
            await exportRPSToPDF(course, rpsData);
        } catch (error) {
            console.error('PDF export failed:', error);
            alert('Gagal export PDF. Silakan coba lagi.');
        }
    };

    const handleEditRPS = () => {
        const basePath = window.location.pathname.includes('/kaprodi/') ? '/kaprodi' : '/dosen';

        // If RPS exists, navigate to edit; otherwise navigate to create
        if (existingRPS && existingRPS.id) {
            navigate(`${basePath}/rps/${existingRPS.id}/edit`);
        } else {
            navigate(`${basePath}/rps/create`, {
                state: {
                    courseId: course?.id,
                    kode_mk: course?.kode_mk,
                    nama_mk: course?.nama_mk,
                    sks: course?.sks,
                    prodi_id: course?.prodi_id,
                    semester: course?.semester
                }
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Memuat RPS...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-2 sm:p-4 md:p-6 print:p-0 print:bg-white">
            <div className="max-w-6xl mx-auto print:max-w-none"> {/* Wider for web, full for print */}
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 print:hidden">
                    <button onClick={() => navigate(-1)} className="btn btn-ghost">
                        ← Kembali
                    </button>
                    <div className="flex gap-3">
                        <button onClick={handleExportPDF} className="btn btn-secondary">
                            📄 Export PDF
                        </button>
                        <button onClick={handleEditRPS} className="btn btn-primary">
                            ✏️ Edit RPS
                        </button>
                    </div>
                </div>

                {/* RPS Document - Scrollable on mobile */}
                <div className="overflow-x-auto">
                    <div className="bg-white text-black shadow-lg print:shadow-none p-4 sm:p-6 md:p-10 print:p-0 text-[11px] sm:text-[12px] leading-tight font-serif min-w-[800px] sm:min-w-0">


                        {/* Header Table */}
                        <table className="w-full border border-black mb-4">
                            <tbody>
                                <tr>
                                    <td className="border border-black p-2 w-24 text-center align-middle">
                                        <img
                                            src="/logo-mahardika.jpg"
                                            alt="Logo"
                                            className="w-20 h-20 object-contain mx-auto"
                                        />
                                    </td>
                                    <td className="border border-black p-2 text-center align-middle">
                                        <h1 className="font-bold text-lg">RENCANA PEMBELAJARAN SEMESTER</h1>
                                        <h2 className="font-bold text-base">PROGRAM STUDI S1 INFORMATIKA</h2>
                                        <h3 className="font-bold">FAKULTAS TEKNIK</h3>
                                        <h3 className="font-bold">INSTITUT TEKNOLOGI DAN KESEHATAN MAHARDIKA</h3>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Identitas Table */}
                        <table className="w-full border border-black mb-px">
                            <tbody>
                                <tr className="bg-gray-200 print:bg-gray-200">
                                    <td className="border border-black p-1 font-bold w-[15%]">MATA KULIAH</td>
                                    <td className="border border-black p-1 font-bold w-[10%]">KODE MK</td>
                                    <td className="border border-black p-1 font-bold w-[15%]">RUMPUN MK</td>
                                    <td className="border border-black p-1 font-bold w-[10%]">BOBOT (SKS)</td>
                                    <td className="border border-black p-1 font-bold w-[10%]">SEMESTER</td>
                                    <td className="border border-black p-1 font-bold w-[15%]">TGL PENYUSUNAN</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1">{course?.nama_mk}</td>
                                    <td className="border border-black p-1">{course?.kode_mk}</td>
                                    <td className="border border-black p-1">{rpsData?.rumpun_mk || '-'}</td>
                                    <td className="border border-black p-1">
                                        T: {JSON.parse(JSON.stringify(rpsData?.bobot_sks || {}))?.t || course?.sks || 0} P: {JSON.parse(JSON.stringify(rpsData?.bobot_sks || {}))?.p || 0}
                                    </td>
                                    <td className="border border-black p-1">{rpsData?.semester || course?.semester}</td>
                                    <td className="border border-black p-1">{rpsData?.updated_at ? new Date(rpsData.updated_at).toLocaleDateString('id-ID') : '-'}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Otoritas Table */}
                        <table className="w-full border border-black mb-4">
                            <tbody>
                                <tr className="bg-gray-200 print:bg-gray-200">
                                    <td className="border border-black p-1 font-bold w-[20%] align-middle" rowSpan="2">
                                        OTORISASI / PENGESAHAN
                                    </td>
                                    <td className="border border-black p-1 font-bold w-[26%] text-center">Pengembang RPS</td>
                                    <td className="border border-black p-1 font-bold w-[26%] text-center">Koordinator Rumpun MK</td>
                                    <td className="border border-black p-1 font-bold w-[28%] text-center">Ketua Program Studi</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-4 text-center align-bottom h-24">
                                        <div className="font-bold underline mb-1">{rpsData?.pengembang_rps || rpsData?.dosen?.nama_lengkap || '(...................)'}</div>
                                    </td>
                                    <td className="border border-black p-4 text-center align-bottom h-24">
                                        <div className="font-bold underline mb-1">{rpsData?.koordinator_rumpun_mk || '(...................)'}</div>
                                    </td>
                                    <td className="border border-black p-4 text-center align-bottom h-24">
                                        <div className="font-bold underline mb-1">{rpsData?.ketua_prodi || '(...................)'}</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* CPMK / CPL Section */}
                        <table className="w-full border border-black mb-4">
                            <tbody>
                                {/* CPL */}
                                <tr>
                                    <td className="border border-black p-1 font-bold align-top bg-gray-100" colSpan="2">
                                        Capaian Pembelajaran Lulusan (CPL)
                                    </td>
                                </tr>
                                {rpsData?.cpl?.map((cpl) => (
                                    <tr key={cpl.id}>
                                        <td className="border border-black p-1 w-[15%] align-top">{cpl.kode_cpl}</td>
                                        <td className="border border-black p-1 align-top">{cpl.deskripsi}</td>
                                    </tr>
                                )) || <tr><td colSpan="2" className="border border-black p-1 text-center">-</td></tr>}

                                {/* CPMK */}
                                <tr>
                                    <td className="border border-black p-1 font-bold align-top bg-gray-100" colSpan="2">
                                        Capaian Pembelajaran Mata Kuliah (CPMK)
                                    </td>
                                </tr>
                                {rpsData?.cpmk?.map((cpmk) => (
                                    <tr key={cpmk.id}>
                                        <td className="border border-black p-1 w-[15%] align-top">{cpmk.kode_cpmk}</td>
                                        <td className="border border-black p-1 align-top">{cpmk.deskripsi}</td>
                                    </tr>
                                )) || <tr><td colSpan="2" className="border border-black p-1 text-center">-</td></tr>}
                            </tbody>
                        </table>

                        {/* Deskripsi MK */}
                        <table className="w-full border border-black mb-4">
                            <tbody>
                                <tr>
                                    <td className="border border-black p-1 font-bold w-[15%] bg-gray-100 align-top">Deskripsi Singkat MK</td>
                                    <td className="border border-black p-1 align-top whitespace-pre-line">{rpsData?.deskripsi_mk || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 font-bold w-[15%] bg-gray-100 align-top">Bahan Kajian / Materi</td>
                                    <td className="border border-black p-1 align-top">
                                        {rpsData?.pertemuan?.map(p => p.materi).filter(Boolean).join(', ') || '-'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 font-bold w-[15%] bg-gray-100 align-top">MK Prasyarat</td>
                                    <td className="border border-black p-1 align-top whitespace-pre-line">{rpsData?.mk_syarat || '-'}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Pustaka & Media */}
                        <table className="w-full border border-black mb-4">
                            <tbody>
                                <tr className="bg-gray-200">
                                    <td className="border border-black p-1 font-bold text-center" colSpan="2">PUSTAKA & MEDIA PEMBELAJARAN</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 font-bold w-[15%] bg-gray-100 align-top">Pustaka Utama</td>
                                    <td className="border border-black p-1 align-top whitespace-pre-line">{rpsData?.pustaka_utama || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 font-bold w-[15%] bg-gray-100 align-top">Pustaka Pendukung</td>
                                    <td className="border border-black p-1 align-top whitespace-pre-line">{rpsData?.pustaka_pendukung || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 font-bold w-[15%] bg-gray-100 align-top">Media Software</td>
                                    <td className="border border-black p-1 align-top whitespace-pre-line">{rpsData?.media_software || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 font-bold w-[15%] bg-gray-100 align-top">Media Hardware</td>
                                    <td className="border border-black p-1 align-top whitespace-pre-line">{rpsData?.media_hardware || '-'}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Dosen Pengampu & Ambang Batas */}
                        <table className="w-full border border-black mb-4">
                            <tbody>
                                <tr className="bg-gray-200">
                                    <td className="border border-black p-1 font-bold text-center" colSpan="2">DOSEN PENGAMPU & KETENTUAN</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 font-bold w-[15%] bg-gray-100 align-top">Dosen Pengampu</td>
                                    <td className="border border-black p-1 align-top">
                                        {rpsData?.dosen_pengampu_list?.length > 0
                                            ? (Array.isArray(rpsData.dosen_pengampu_list)
                                                ? rpsData.dosen_pengampu_list.map((d, i) => (
                                                    <div key={i}>{typeof d === 'string' ? d : d.nama}</div>
                                                ))
                                                : rpsData.dosen_pengampu_list)
                                            : rpsData?.pengembang_rps || '-'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 font-bold w-[15%] bg-gray-100 align-top">Ambang Batas Kelulusan MK</td>
                                    <td className="border border-black p-1 align-top">{rpsData?.ambang_batas_mk || '55%'}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-1 font-bold w-[15%] bg-gray-100 align-top">Ambang Batas Kehadiran</td>
                                    <td className="border border-black p-1 align-top">{rpsData?.ambang_batas_mhs || '75%'}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Sub-CPMK Section */}
                        {rpsData?.sub_cpmk_list?.length > 0 && (
                            <table className="w-full border border-black mb-4">
                                <tbody>
                                    <tr className="bg-gray-200">
                                        <td className="border border-black p-1 font-bold text-center" colSpan="3">SUB-CPMK (Kemampuan Akhir yang Diharapkan)</td>
                                    </tr>
                                    <tr className="bg-gray-100">
                                        <td className="border border-black p-1 font-bold w-[10%]">Kode</td>
                                        <td className="border border-black p-1 font-bold">Deskripsi</td>
                                        <td className="border border-black p-1 font-bold w-[20%]">CPMK Terkait</td>
                                        <td className="border border-black p-1 font-bold w-[10%]">CPL</td>
                                    </tr>
                                    {rpsData.sub_cpmk_list.map((sub, idx) => {
                                        const parentCPMK = rpsData.cpmk?.find(m => String(m.id) === String(sub.cpmk_id));
                                        const grandparentCPL = parentCPMK ? rpsData.cpl?.find(c => String(c.id) === String(parentCPMK.cpl_id)) : null;

                                        return (
                                            <tr key={idx}>
                                                <td className="border border-black p-1 font-semibold">{sub.kode || `Sub-${idx + 1}`}</td>
                                                <td className="border border-black p-1 whitespace-pre-line">{sub.deskripsi || '-'}</td>
                                                <td className="border border-black p-1 text-[10px]">
                                                    {parentCPMK ? (
                                                        <>
                                                            <div className="font-bold">{parentCPMK.kode_cpmk}</div>
                                                            <div className="text-gray-500 line-clamp-1">{parentCPMK.deskripsi}</div>
                                                        </>
                                                    ) : sub.cpmk_kode || '-'}
                                                </td>
                                                <td className="border border-black p-1 text-center font-mono">
                                                    {grandparentCPL?.kode_cpl || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}

                        {/* Matrix Penilaian Section */}
                        {rpsData?.sub_cpmk_list?.length > 0 && rpsData?.pertemuan?.length > 0 && (
                            <table className="w-full border border-black mb-4">
                                <tbody>
                                    <tr className="bg-gray-200">
                                        <td className="border border-black p-1 font-bold text-center" colSpan="4">MATRIKS PENILAIAN (Sub-CPMK vs Bobot)</td>
                                    </tr>
                                    <tr className="bg-gray-100">
                                        <td className="border border-black p-1 font-bold w-[10%]">Kode</td>
                                        <td className="border border-black p-1 font-bold">Deskripsi Sub-CPMK</td>
                                        <td className="border border-black p-1 font-bold w-[15%] text-center">Minggu</td>
                                        <td className="border border-black p-1 font-bold w-[10%] text-center">Total %</td>
                                    </tr>
                                    {rpsData.sub_cpmk_list.map((sub, idx) => {
                                        const usedPertemuan = rpsData.pertemuan.filter(p => String(p.sub_cpmk_id) === String(sub.id));
                                        const mingguList = usedPertemuan.map(p => p.minggu_ke).join(', ') || '-';
                                        const totalBobot = usedPertemuan.reduce((sum, p) => sum + (parseInt(p.bobot_penilaian) || 0), 0);
                                        return (
                                            <tr key={idx}>
                                                <td className="border border-black p-1">{sub.kode || `Sub-${idx + 1}`}</td>
                                                <td className="border border-black p-1">{sub.deskripsi || '-'}</td>
                                                <td className="border border-black p-1 text-center">{mingguList}</td>
                                                <td className="border border-black p-1 text-center font-bold">{totalBobot}%</td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="bg-gray-100 font-bold">
                                        <td className="border border-black p-1" colSpan="3" style={{ textAlign: 'right' }}>TOTAL:</td>
                                        <td className="border border-black p-1 text-center">
                                            {rpsData.pertemuan.reduce((sum, p) => sum + (parseInt(p.bobot_penilaian) || 0), 0)}%
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        )}



                        {/* Weekly Plan */}
                        <div className="mb-4">
                            <h3 className="font-bold mb-2">Rencana Pembelajaran Mingguan</h3>
                            <table className="w-full border border-black text-[11px]">
                                <thead className="bg-gray-200 text-center">
                                    <tr>
                                        <th className="border border-black p-1 w-8 align-top whitespace-normal">Mg Ke-</th>
                                        <th className="border border-black p-1 w-[20%] align-top whitespace-normal">Kemampuan Akhir Tiap Tahapan Belajar (Sub-CPMK)</th>
                                        <th className="border border-black p-1 w-[15%] align-top whitespace-normal">Indikator & Kriteria</th>
                                        <th className="border border-black p-1 w-[25%] align-top whitespace-normal">Bentuk, Metode, & Penugasan</th>
                                        <th className="border border-black p-1 align-top whitespace-normal">Materi Pembelajaran</th>
                                        <th className="border border-black p-1 w-10 align-top whitespace-normal">Bobot (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Handle Merged Rows Logic */}
                                    {(() => {
                                        const sorted = (rpsData?.pertemuan || []).sort((a, b) => a.minggu_ke - b.minggu_ke);
                                        const rowsToRender = [];
                                        let skipUntil = 0;

                                        sorted.forEach(pertemuan => {
                                            const week = pertemuan.minggu_ke;

                                            // 1. If this week is covered by a previous merge (skipUntil), ignore it
                                            if (week <= skipUntil) return;

                                            // 2. Determine validation range
                                            const endWeek = pertemuan.sampai_minggu_ke || week;
                                            if (endWeek > week) {
                                                skipUntil = endWeek;
                                            }

                                            rowsToRender.push(pertemuan);
                                        });

                                        return rowsToRender.map((pertemuan) => {
                                            const week = pertemuan.minggu_ke;

                                            if (pertemuan.is_uts || pertemuan.jenis_pertemuan === 'uts') {
                                                return (
                                                    <tr key={week} className="bg-yellow-100 print:bg-yellow-50 font-bold text-center">
                                                        <td className="border border-black p-1">8</td>
                                                        <td className="border border-black p-1" colSpan="5">EVALUASI TENGAH SEMESTER (ETS) / UTS</td>
                                                        <td className="border border-black p-1">{pertemuan.bobot_penilaian || 0}</td>
                                                    </tr>
                                                )
                                            }
                                            if (pertemuan.is_uas || pertemuan.jenis_pertemuan === 'uas') {
                                                return (
                                                    <tr key={week} className="bg-yellow-100 print:bg-yellow-50 font-bold text-center">
                                                        <td className="border border-black p-1">{week}</td>
                                                        <td className="border border-black p-1" colSpan="5">{pertemuan.materi || 'EVALUASI AKHIR SEMESTER (EAS) / UAS'}</td>
                                                        <td className="border border-black p-1">{pertemuan.bobot_penilaian || 0}</td>
                                                    </tr>
                                                )
                                            }

                                            return (
                                                <tr key={week} className={pertemuan?.sampai_minggu_ke ? "border-b-2 border-black" : ""}>
                                                    <td className="border border-black p-1 text-center font-bold align-top">
                                                        {pertemuan?.sampai_minggu_ke ?
                                                            `${week}-${pertemuan.sampai_minggu_ke}` :
                                                            week
                                                        }
                                                    </td>
                                                    <td className="border border-black p-1 align-top whitespace-pre-line text-sm font-semibold">{pertemuan?.sub_cpmk || '-'}</td>
                                                    <td className="border border-black p-1 align-top whitespace-pre-line">
                                                        <div className="font-semibold mb-1 border-b border-gray-300 pb-1">Indikator:</div>
                                                        {pertemuan?.indikator || '-'}
                                                        {pertemuan?.kriteria_penilaian && (
                                                            <>
                                                                <div className="font-semibold mt-2 mb-1 border-b border-gray-300 pb-1">Kriteria:</div>
                                                                <div className="whitespace-pre-line">{pertemuan.kriteria_penilaian}</div>
                                                            </>
                                                        )}
                                                    </td>
                                                    <td className="border border-black p-0 align-top">
                                                        {/* Helper for cleaning */}
                                                        {(() => {
                                                            const clean = (v) => {
                                                                if (!v) return '-';

                                                                let parsedV = v;
                                                                // Recursively parse JSON strings until we get a real value
                                                                let attempts = 0;
                                                                while (typeof parsedV === 'string' && (parsedV.startsWith('[') || parsedV.startsWith('"')) && attempts < 5) {
                                                                    try {
                                                                        const temp = JSON.parse(parsedV);
                                                                        // If we got a string from JSON.parse, continue loop. 
                                                                        // If we got an object/array, that's our new parsedV.
                                                                        parsedV = temp;
                                                                    } catch (e) {
                                                                        break; // Stop if parse fails
                                                                    }
                                                                    attempts++;
                                                                }

                                                                if (Array.isArray(parsedV)) {
                                                                    // Recursively clean elements
                                                                    const filtered = parsedV
                                                                        .flat(Infinity)
                                                                        .map(item => clean(item))
                                                                        .filter(x => x && x !== '-' && x !== '""' && x !== "''" && x !== '[]' && x !== '[""]' && String(x).trim() !== '');

                                                                    return filtered.length > 0 ? filtered.join(', ') : '-';
                                                                }

                                                                // Handle single string case that might be "[]"
                                                                if (typeof parsedV === 'string') {
                                                                    if (parsedV === '[]' || parsedV === '[""]' || parsedV === '[" "]' || parsedV.trim() === '') return '-';
                                                                    return parsedV;
                                                                }

                                                                return parsedV || '-';
                                                            };

                                                            return (
                                                                <div className="flex flex-col h-full">
                                                                    <div className="border-b border-black p-1 flex-1">
                                                                        <span className="font-semibold block text-[10px] text-gray-600 uppercase">Bentuk:</span>
                                                                        {clean(pertemuan?.bentuk_pembelajaran)}
                                                                    </div>
                                                                    <div className="border-b border-black p-1 flex-1">
                                                                        <span className="font-semibold block text-[10px] text-gray-600 uppercase">Metode:</span>
                                                                        {clean(pertemuan?.metode_pembelajaran)}
                                                                    </div>
                                                                    <div className="border-b border-black p-1 flex-1">
                                                                        <span className="font-semibold block text-[10px] text-gray-600 uppercase">Penugasan:</span>
                                                                        {clean(pertemuan?.penugasan) || '-'}
                                                                    </div>
                                                                    <div className="p-1">
                                                                        <span className="font-semibold block text-[10px] text-gray-600 uppercase">Luring/Daring:</span>
                                                                        {pertemuan?.link_daring ? 'Daring' : 'Luring'}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="border border-black p-1 align-top whitespace-pre-line">{pertemuan?.materi || '-'}</td>
                                                    <td className="border border-black p-1 text-center align-top">{pertemuan?.bobot_penilaian || 0}</td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>

                        {/* Metode Penilaian Section */}
                        {rpsData?.metode_penilaian?.length > 0 && (
                            <div className="mb-4">
                                <h3 className="font-bold mb-2">Metode Penilaian</h3>
                                <table className="w-full border border-black text-[11px]">
                                    <thead className="bg-gray-200 text-center">
                                        <tr>
                                            <th className="border border-black p-1 w-[20%]">Metode</th>
                                            <th className="border border-black p-1">Detail / Kriteria</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rpsData.metode_penilaian.map((metode, idx) => (
                                            <tr key={idx}>
                                                <td className="border border-black p-1 align-top font-bold">{metode.name || metode.type}</td>
                                                <td className="border border-black p-1 align-top">
                                                    {metode.type === 'Rubrik' && Array.isArray(metode.scales) ? (
                                                        <div className="overflow-x-auto">
                                                            <div className="font-semibold mb-1 italic">{metode.description || 'Rubrik Penilaian:'}</div>
                                                            <table className="w-full border-collapse border border-gray-400 text-[10px]">
                                                                <thead className="bg-gray-100">
                                                                    <tr>
                                                                        <th className="border border-gray-400 p-1">Kriteria / Dimensi</th>
                                                                        {metode.scales.map((s, i) => (
                                                                            <th key={i} className="border border-gray-400 p-1">{s.label}<br /><span className="font-normal">({s.value})</span></th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {Array.isArray(metode.criteria) && metode.criteria.map((c, i) => (
                                                                        <tr key={i}>
                                                                            <td className="border border-gray-400 p-1 font-medium">{c.label}</td>
                                                                            {metode.scales.map((s, scaleIdx) => (
                                                                                <td key={scaleIdx} className="border border-gray-400 p-1 text-gray-500 italic">
                                                                                    {c.descriptions?.[scaleIdx] || '-'}
                                                                                </td>
                                                                            ))}
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="whitespace-pre-line">{metode.description || '-'}</div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

