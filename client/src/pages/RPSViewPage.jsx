import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import { Building2 } from 'lucide-react';
import { exportRPSToPDF } from '../utils/rpsExport';

export default function RPSViewPage() {
    const { courseId, rpsId } = useParams(); // Get rpsId if available
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [rpsData, setRpsData] = useState(null);
    const [existingRPS, setExistingRPS] = useState(null);
    const [course, setCourse] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get('/settings');
                setSettings(res.data);
            } catch (err) {
                console.error('Failed to load global settings:', err);
            }
        };
        fetchSettings();
    }, []);

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
                    <div className="bg-white text-black shadow-lg print:shadow-none p-4 sm:p-6 md:p-10 print:p-0 text-[11px] sm:text-[12px] leading-[1.15] font-serif min-w-[800px] sm:min-w-0">


                        {/* Header Table */}
                        <table className="w-full border border-black mb-4">
                            <tbody>
                                <tr>
                                    <td className="border border-black p-2 w-24 text-center align-middle">
                                        {settings?.logo_path ? (
                                            <img
                                                src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/${settings.logo_path}?t=${new Date().getTime()}`}
                                                alt="Logo"
                                                className="w-20 h-20 object-contain mx-auto"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className={`${settings?.logo_path ? 'hidden' : 'flex'} w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg items-center justify-center mx-auto text-primary-600`}>
                                            <Building2 size={32} />
                                        </div>
                                    </td>
                                    <td className="border border-black p-2 text-center align-middle">
                                        <h1 className="font-bold text-lg">RENCANA PEMBELAJARAN SEMESTER</h1>
                                        <h2 className="font-bold text-base">
                                            PROGRAM STUDI {course?.prodi?.nama?.toUpperCase() || '-'}
                                        </h2>
                                        <h3 className="font-bold uppercase">
                                            {course?.prodi?.fakultas?.nama || '-'}
                                        </h3>
                                        <h3 className="font-bold uppercase">
                                            {settings?.nama_pt || 'INSTITUT TEKNOLOGI DAN KESEHATAN MAHARDIKA'}
                                        </h3>
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
                                                    <td className="border border-black p-1 align-top whitespace-pre-line font-semibold">{pertemuan?.sub_cpmk || '-'}</td>
                                                    <td className="border border-black p-1 align-top">
                                                        <div className="font-semibold mb-1 border-b border-gray-300 pb-1">Indikator:</div>
                                                        <div className="pl-4">
                                                            {(() => {
                                                                const parseIndikator = (val) => {
                                                                    if (!val) return [];
                                                                    if (Array.isArray(val)) return val;
                                                                    if (typeof val === 'string') {
                                                                        try {
                                                                            // Try parsing if it looks like an array
                                                                            if (val.trim().startsWith('[')) {
                                                                                const parsed = JSON.parse(val);
                                                                                if (Array.isArray(parsed)) return parsed.flat();
                                                                            }
                                                                        } catch (e) { /* ignore */ }
                                                                        // Handle single string or failed parse
                                                                        return [val];
                                                                    }
                                                                    return [String(val)];
                                                                };

                                                                const indikators = parseIndikator(pertemuan?.indikator).filter(i => i && String(i).trim() !== '' && i !== '[]');

                                                                if (indikators.length > 0) {
                                                                    return (
                                                                        <ol className="list-decimal space-y-1">
                                                                            {indikators.map((ind, i) => (
                                                                                <li key={i}><MarkdownText text={String(ind)} className="leading-none" /></li>
                                                                            ))}
                                                                        </ol>
                                                                    );
                                                                } else {
                                                                    return <div className="text-gray-400">-</div>;
                                                                }
                                                            })()}
                                                        </div>

                                                        {/* Kriteria & Teknik Combined */}
                                                        {(pertemuan?.kriteria_penilaian || (pertemuan?.teknik_penilaian && pertemuan.teknik_penilaian.length > 0)) && (
                                                            <div className="mt-3 pt-2 border-t border-gray-300 border-dashed">
                                                                {pertemuan?.kriteria_penilaian && (
                                                                    <div className="mb-2">
                                                                        <div className="font-semibold mb-1 text-gray-600 text-[10px] uppercase">Kriteria:</div>
                                                                        <MarkdownText text={pertemuan.kriteria_penilaian} className="leading-none" />
                                                                    </div>
                                                                )}

                                                                {pertemuan?.teknik_penilaian && pertemuan.teknik_penilaian.length > 0 && (
                                                                    <div>
                                                                        <div className="font-semibold mb-1 text-gray-600 text-[10px] uppercase">Teknik:</div>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {pertemuan.teknik_penilaian.map(t => (
                                                                                <span key={t} className="px-1.5 py-0.5 bg-gray-100 border rounded text-[10px] whitespace-nowrap">{t}</span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="border border-black p-0 align-top">
                                                        {(() => {
                                                            // Helper: Extract clean tags from potential messy string/array
                                                            const extractTags = (v) => {
                                                                if (!v) return [];

                                                                // 1. Force into array structure first
                                                                let list = [];
                                                                if (Array.isArray(v)) {
                                                                    list = v.flat(Infinity);
                                                                } else if (typeof v === 'string') {
                                                                    // Try JSON parse first
                                                                    try {
                                                                        const parsed = JSON.parse(v);
                                                                        if (Array.isArray(parsed)) list = parsed;
                                                                        else list = [v];
                                                                    } catch (e) {
                                                                        // Fallback: split by comma if it looks like a list, or just use string
                                                                        const trimmed = v.trim().replace(/^"+|"+$/g, ''); // Remove wrapping quotes
                                                                        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                                                                            // It's a stringified array that failed JSON.parse (e.g. single quotes)
                                                                            list = trimmed.slice(1, -1).split(',').map(s => s.trim());
                                                                        } else {
                                                                            list = [v];
                                                                        }
                                                                    }
                                                                } else {
                                                                    return [];
                                                                }

                                                                // 2. Clean each item recursively
                                                                const dirtyItems = list.flat(Infinity);
                                                                const cleanItems = [];

                                                                for (let item of dirtyItems) {
                                                                    if (!item) continue;
                                                                    let s = String(item).trim();

                                                                    // Recursive cleanup: if item looks like ["..."]
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

                                                                return [...new Set(cleanItems)]; // Unique items only
                                                            };

                                                            const metode = extractTags(pertemuan?.metode_pembelajaran);
                                                            const namaLms = pertemuan?.nama_lms || '';
                                                            const platform = pertemuan?.link_meet_platform || '';
                                                            const link = pertemuan?.link_daring || '';
                                                            const penugasan = pertemuan?.penugasan || '';

                                                            const hasLuring = metode.length > 0;
                                                            const hasDaring = namaLms || platform || link;
                                                            const hasPenugasan = !!penugasan;

                                                            if (!hasLuring && !hasDaring && !hasPenugasan) {
                                                                return <div className="text-center text-gray-400 p-2">-</div>;
                                                            }

                                                            return (
                                                                <div className="flex flex-col h-full">
                                                                    {/* ROW 1: Metode Luring (Show only if exists) */}
                                                                    {hasLuring && (
                                                                        <div className={`p-1 ${hasDaring || hasPenugasan ? 'border-b border-black' : ''} h-full min-h-[40px]`}>
                                                                            <div className="font-bold text-[10px] underline mb-0.5">Metode Luring:</div>
                                                                            <div className="text-[10px] leading-tight">
                                                                                {metode.join(', ')}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* ROW 2: Metode Daring (Show only if exists) */}
                                                                    {hasDaring && (
                                                                        <div className={`p-1 ${hasPenugasan ? 'border-b border-black' : ''} h-full min-h-[40px] bg-blue-50/30`}>
                                                                            <div className="font-bold text-[10px] underline mb-0.5 text-blue-800">Metode Daring:</div>
                                                                            <div className="text-[10px] leading-tight space-y-0.5">
                                                                                {namaLms && (
                                                                                    <div>
                                                                                        <span className="font-semibold">LMS:</span>{' '}
                                                                                        <a
                                                                                            href={namaLms.startsWith('http') ? namaLms : `https://${namaLms}`}
                                                                                            target="_blank"
                                                                                            rel="noreferrer"
                                                                                            className="text-blue-600 hover:underline"
                                                                                        >
                                                                                            {namaLms}
                                                                                        </a>
                                                                                    </div>
                                                                                )}
                                                                                {platform && <div><span className="font-semibold">Platform:</span> {platform}</div>}
                                                                                {link && (
                                                                                    <div className="font-semibold"><a href={link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">{link}</a></div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* ROW 3: Penugasan (Show only if exists) */}
                                                                    {hasPenugasan && (
                                                                        <div className="p-1 h-full min-h-[40px] bg-green-50/30">
                                                                            <div className="font-bold text-[10px] underline mb-0.5 text-green-800">Penugasan:</div>
                                                                            <div className="text-[10px] leading-tight">
                                                                                <MarkdownText text={penugasan} />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="border border-black p-1 align-top"><MarkdownText text={pertemuan?.materi} /></td>
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
        </div >
    );
}

const MarkdownText = ({ text, className = '' }) => {
    if (!text) return '-';

    // Split by newlines to handle block elements (lists)
    const lines = text.split('\n');
    const elements = [];

    let currentList = null; // { type: 'ul'|'ol', items: [] }

    lines.forEach((line, i) => {
        const trimmed = line.trim();
        // Check for Bullet List (- item)
        const ulMatch = line.match(/^-\s+(.+)/);
        // Check for Numbered List (1. item)
        const olMatch = line.match(/^\d+\.\s+(.+)/);

        if (ulMatch) {
            if (currentList && currentList.type !== 'ul') {
                elements.push(renderList(currentList, `list-${i}`));
                currentList = null;
            }
            if (!currentList) currentList = { type: 'ul', items: [] };
            currentList.items.push(ulMatch[1]);
        } else if (olMatch) {
            if (currentList && currentList.type !== 'ol') {
                elements.push(renderList(currentList, `list-${i}`));
                currentList = null;
            }
            if (!currentList) currentList = { type: 'ol', items: [] };
            currentList.items.push(olMatch[1]);
        } else {
            // Close list if open
            if (currentList) {
                elements.push(renderList(currentList, `list-${i}`));
                currentList = null;
            }
            // Regular line (preserve empty lines as breaks if needed, or just min-height)
            if (trimmed === '') {
                elements.push(<br key={`br-${i}`} />);
            } else {
                elements.push(<div key={`text-${i}`}>{parseInline(line)}</div>);
            }
        }
    });

    // Flush remaining list
    if (currentList) elements.push(renderList(currentList, 'list-end'));

    return <div className={`whitespace-pre-wrap ${className}`}>{elements}</div>;
};

const renderList = (list, key) => {
    const Tag = list.type;
    return (
        <Tag key={key} className={`list-inside mb-1 pl-2 ${list.type === 'ul' ? 'list-disc' : 'list-decimal'}`}>
            {list.items.map((item, i) => <li key={i}>{parseInline(item)}</li>)}
        </Tag>
    );
};

const parseInline = (text) => {
    // Simple bold/italic parser for **bold** and *italic*
    // We split by specific regex to capture the tokens
    if (!text) return '';

    // Regex to match **bold** OR *italic*
    // Note: This simple regex doesn't handle nested **bold *italic*** well, but sufficient for simple usage
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return part;
    });
};
