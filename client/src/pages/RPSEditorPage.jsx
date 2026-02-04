import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight, BookOpen, Users, Monitor, X } from 'lucide-react';
import { debounce } from 'lodash';
import axios from '../lib/axios';
import useAuthStore from '../store/useAuthStore';
import useAcademicStore from '../store/useAcademicStore';

export default function RPSEditorPage() {
    const { rpsId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const { activeSemester, activeYear } = useAcademicStore();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState('identitas');

    // --- State: Identitas MK ---
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState({
        mata_kuliah_id: '',
        semester: activeSemester || 'Ganjil',
        tahun_ajaran: activeYear || '2025/2026',
        revisi: 0,
        deskripsi_mk: '',
        kode_mk: '',
        nama_mk: '',
        rumpun_mk: '',
        sks: '',
        pengembang_rps: user?.nama_lengkap || '',
        ketua_prodi: ''
    });

    // Rumpun MK options with add-new capability
    const [rumpunOptions, setRumpunOptions] = useState([
        'Pemrograman', 'Basis Data', 'Jaringan Komputer', 'Kecerdasan Buatan',
        'Sistem Informasi', 'Multimedia', 'Keamanan Siber', 'Matematika', 'Umum'
    ]);
    const [showNewRumpun, setShowNewRumpun] = useState(false);
    const [newRumpunValue, setNewRumpunValue] = useState('');

    // --- State: Capaian Pembelajaran ---
    const [availableCPLs, setAvailableCPLs] = useState([]);
    const [selectedCPLs, setSelectedCPLs] = useState([]);
    const [selectedCPMKs, setSelectedCPMKs] = useState([]); // Array of IDs linked to this RPS
    const [activeCpl, setActiveCpl] = useState(null); // ID for expanding UI to add new CPMK
    const [newCpmk, setNewCpmk] = useState({ kode: '', deskripsi: '' });
    const [newSubCpmk, setNewSubCpmk] = useState({ kode: '', deskripsi: '' });

    // --- State: Weekly Schedule ---
    const [rows, setRows] = useState([]);
    const [currentRPSId, setCurrentRPSId] = useState(rpsId || null);

    // --- State: Additional Info ---
    const [pustakaUtama, setPustakaUtama] = useState('');
    const [pustakaPendukung, setPustakaPendukung] = useState('');
    const [mediaSoftware, setMediaSoftware] = useState('');
    const [mediaHardware, setMediaHardware] = useState('');
    const [ambangKelulusanMhs, setAmbangKelulusanMhs] = useState(60);
    const [ambangKelulusanMK, setAmbangKelulusanMK] = useState(60);

    // Options for multi-select (max 3)
    const metodePembelajaran = ['Kuliah', 'Responsi', 'Seminar', 'Praktikum', 'Diskusi', 'Studi Kasus', 'Problem Based Learning', 'Project Based Learning', 'Presentasi', 'Penugasan'];
    const teknikPenilaian = ['Tes Tertulis', 'Tes Lisan', 'Observasi', 'Praktik', 'Proyek', 'Portofolio', 'Kuis', 'Tugas Individu', 'Tugas Kelompok', 'Presentasi'];

    // --- Effects ---
    useEffect(() => {
        fetchCourses();
    }, []);

    // Update semester when header changes
    useEffect(() => {
        if (!rpsId && activeSemester) {
            setFormData(prev => ({ ...prev, semester: activeSemester }));
        }
        if (!rpsId && activeYear) {
            setFormData(prev => ({ ...prev, tahun_ajaran: activeYear }));
        }
    }, [activeSemester, activeYear, rpsId]);

    useEffect(() => {
        if (rpsId) {
            fetchExistingRPS();
        } else if (location.state?.courseId) {
            handleCoursePreselect(location.state);
        } else if (rows.length === 0) {
            initializeRows(14);
        }
    }, [rpsId, location.state]);

    // Fetch CPLs when course is selected
    useEffect(() => {
        if (formData.mata_kuliah_id) {
            const course = courses.find(c => c.id === parseInt(formData.mata_kuliah_id));
            if (course?.prodi_id) {
                fetchCPLs(course.prodi_id);
            }
        }
    }, [formData.mata_kuliah_id, courses]);

    // --- Data Fetching ---
    const fetchCourses = async () => {
        try {
            const res = await axios.get('/rps/dosen/my-courses');
            setCourses(res.data || []);
        } catch (error) {
            try {
                const fallback = await axios.get('/courses');
                setCourses(fallback.data || []);
            } catch (e) {
                console.error('Failed to fetch courses:', e);
            }
        }
    };

    const fetchCPLs = async (prodiId, courseId = null) => {
        try {
            const query = courseId ? `?courseId=${courseId}` : '';
            const res = await axios.get(`/rps/curriculum/tree/${prodiId}${query}`);
            setAvailableCPLs(res.data.cpls || []);
        } catch (error) {
            console.error('Error fetching CPLs:', error);
        }
    };

    const handleCoursePreselect = (state) => {
        setFormData(prev => ({
            ...prev,
            mata_kuliah_id: state.courseId,
            kode_mk: state.kode_mk || '',
            nama_mk: state.nama_mk || '',
            sks: state.sks || ''
        }));
        if (state.prodi_id) {
            fetchCPLs(state.prodi_id, state.courseId);
        }
        if (rows.length === 0) initializeRows(14);
    };

    const handleCourseChange = (e) => {
        const courseId = parseInt(e.target.value);
        const course = courses.find(c => c.id === courseId);
        if (course) {
            setFormData(prev => ({
                ...prev,
                mata_kuliah_id: courseId,
                kode_mk: course.kode_mk,
                nama_mk: course.nama_mk,
                sks: course.sks
            }));
            if (course.prodi_id) {
                fetchCPLs(course.prodi_id, courseId);
            }
            if (rows.length === 0) initializeRows(14);
        }
    };

    const fetchExistingRPS = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/rps/${rpsId}`);
            const rps = res.data;
            setFormData({
                mata_kuliah_id: rps.mata_kuliah_id,
                semester: rps.semester,
                tahun_ajaran: rps.tahun_ajaran,
                revisi: rps.revisi || 0,
                deskripsi_mk: rps.deskripsi_mk || '',
                kode_mk: rps.MataKuliah?.kode_mk || '',
                nama_mk: rps.MataKuliah?.nama_mk || '',
                rumpun_mk: rps.rumpun_mk || '',
                sks: rps.MataKuliah?.sks || '',
                pengembang_rps: rps.pengembang_rps || user?.nama_lengkap || '',
                ketua_prodi: rps.ketua_prodi || ''
            });
            setCurrentRPSId(rps.id);
            if (rps.pertemuan && rps.pertemuan.length > 0) {
                setRows(rps.pertemuan.map(p => ({
                    id: p.id || Date.now() + Math.random(),
                    minggu_ke: p.minggu_ke,
                    cpmk_id: p.cpmk_id || '',
                    sub_cpmk_id: p.sub_cpmk_id || '',
                    indikator: p.indikator || '',
                    teknik_penilaian: Array.isArray(p.teknik_penilaian) ? p.teknik_penilaian : (p.teknik_penilaian ? [p.teknik_penilaian] : []),
                    kriteria_penilaian: p.kriteria_penilaian || '',
                    materi: p.materi || '',
                    metode_pembelajaran: Array.isArray(p.metode_pembelajaran) ? p.metode_pembelajaran : (p.metode_pembelajaran ? [p.metode_pembelajaran] : []),
                    bentuk_pembelajaran: Array.isArray(p.bentuk_pembelajaran) ? p.bentuk_pembelajaran : [],
                    link_daring: p.link_daring || '',
                    bobot_penilaian: p.bobot_penilaian || '',
                    is_uts: p.minggu_ke === 8,
                    is_uas: p.minggu_ke === 15
                })));
            } else {
                initializeRows(14);
            }
        } catch (error) {
            console.error('Error fetching RPS:', error);
            alert('Gagal memuat data RPS');
        } finally {
            setLoading(false);
        }
    };

    const initializeRows = (count = 14) => {
        const utsWeek = Math.ceil(count / 2);
        const uasWeek = count;
        const newRows = Array.from({ length: count }, (_, i) => ({
            id: Date.now() + i,
            minggu_ke: i + 1,
            cpmk_id: '',
            sub_cpmk_id: '',
            indikator: '',
            teknik_penilaian: [],
            kriteria_penilaian: '',
            materi: i + 1 === utsWeek ? 'Ujian Tengah Semester' : i + 1 === uasWeek ? 'Ujian Akhir Semester' : '',
            metode_pembelajaran: [],
            bentuk_pembelajaran: [],
            link_daring: '',
            bobot_penilaian: i + 1 === utsWeek ? 22 : i + 1 === uasWeek ? 26 : '',
            is_uts: i + 1 === utsWeek,
            is_uas: i + 1 === uasWeek
        }));
        setRows(newRows);
    };

    // --- Rumpun Management ---
    const addNewRumpun = () => {
        if (newRumpunValue.trim() && !rumpunOptions.includes(newRumpunValue.trim())) {
            setRumpunOptions([...rumpunOptions, newRumpunValue.trim()]);
            setFormData({ ...formData, rumpun_mk: newRumpunValue.trim() });
        }
        setNewRumpunValue('');
        setShowNewRumpun(false);
    };

    // --- CPL/CPMK Management ---
    const toggleCPL = (cplId) => {
        setSelectedCPLs(prev =>
            prev.includes(cplId) ? prev.filter(id => id !== cplId) : [...prev, cplId]
        );
    };

    const toggleCPMK = (id) => {
        if (selectedCPMKs.includes(id)) {
            setSelectedCPMKs(prev => prev.filter(c => c !== id));
        } else {
            setSelectedCPMKs(prev => [...prev, id]);
        }
    };

    const handleAddCPMK = async (cplId, cplKode) => {
        try {
            if (!formData.mata_kuliah_id) return alert('Pilih mata kuliah terlebih dahulu');

            await axios.post('/rps/curriculum/cpmk', {
                mata_kuliah_id: formData.mata_kuliah_id,
                cpl_id: cplId,
                kode_cpmk: newCpmk.kode || `${cplKode}-01`,
                deskripsi: newCpmk.deskripsi
            });

            // Refresh tree
            const course = courses.find(c => c.id === parseInt(formData.mata_kuliah_id));
            if (course) fetchCPLs(course.prodi_id, course.id);

            // Reset form
            setNewCpmk({ kode: '', deskripsi: '' });
            setActiveCpl(null);
        } catch (error) {
            console.error('Failed to add CPMK:', error);
            alert('Gagal menambah CPMK');
        }
    };

    const handleAddSubCPMK = async (cpmkId, cpmkKode) => {
        try {
            await axios.post('/rps/curriculum/sub-cpmk', {
                cpmk_id: cpmkId,
                kode: newSubCpmk.kode || `${cpmkKode}.1`,
                deskripsi: newSubCpmk.deskripsi
            });

            // Refresh tree
            const course = courses.find(c => c.id === parseInt(formData.mata_kuliah_id));
            if (course) fetchCPLs(course.prodi_id, course.id);

            setNewSubCpmk({ kode: '', deskripsi: '' });
        } catch (error) {
            console.error('Failed to add Sub-CPMK:', error);
            alert('Gagal menambah Sub-CPMK');
        }
    };

    // --- Row Management ---
    const updateRow = (index, field, value) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
    };

    const toggleMultiSelect = (index, field, value, maxItems = 3) => {
        const newRows = [...rows];
        const current = newRows[index][field] || [];
        if (current.includes(value)) {
            newRows[index][field] = current.filter(v => v !== value);
        } else if (current.length < maxItems) {
            newRows[index][field] = [...current, value];
        }
        setRows(newRows);
    };

    const toggleBentukPembelajaran = (index, value) => {
        const newRows = [...rows];
        const current = newRows[index].bentuk_pembelajaran || [];
        newRows[index].bentuk_pembelajaran = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        if (value === 'daring' && !newRows[index].bentuk_pembelajaran.includes('daring')) {
            newRows[index].link_daring = '';
        }
        setRows(newRows);
    };

    const addWeek = () => {
        const newMinggu = rows.length + 1;
        setRows([...rows, {
            id: Date.now(),
            minggu_ke: newMinggu,
            cpmk_id: '',
            sub_cpmk_id: '',
            indikator: '',
            teknik_penilaian: [],
            kriteria_penilaian: '',
            materi: '',
            metode_pembelajaran: [],
            bentuk_pembelajaran: [],
            link_daring: '',
            bobot_penilaian: '',
            is_uts: false,
            is_uas: false
        }]);
    };

    const removeWeek = (index) => {
        if (rows.length <= 10) {
            alert('Minimal 10 pertemuan');
            return;
        }
        const row = rows[index];
        if (row.is_uts || row.is_uas) {
            alert('Tidak bisa menghapus minggu UTS/UAS');
            return;
        }
        const newRows = rows.filter((_, i) => i !== index).map((r, i) => ({ ...r, minggu_ke: i + 1 }));
        setRows(newRows);
    };

    const setAsUTS = (index) => {
        const newRows = rows.map((r, i) => ({ ...r, is_uts: i === index, materi: i === index ? 'Ujian Tengah Semester' : (r.is_uts ? '' : r.materi) }));
        setRows(newRows);
    };

    const setAsUAS = (index) => {
        const newRows = rows.map((r, i) => ({ ...r, is_uas: i === index, materi: i === index ? 'Ujian Akhir Semester' : (r.is_uas ? '' : r.materi) }));
        setRows(newRows);
    };

    // --- Save ---
    const handleSaveDraft = async () => {
        if (!formData.mata_kuliah_id) {
            alert('Pilih Mata Kuliah terlebih dahulu');
            return;
        }
        try {
            setLoading(true);

            // If editing existing RPS, update instead of create
            // If editing existing RPS, update instead of create
            if (currentRPSId) {
                await axios.put(`/rps/dosen/${currentRPSId}/update`, {
                    deskripsi_mk: formData.deskripsi_mk,
                    rumpun_mk: formData.rumpun_mk,
                    pengembang_rps: formData.pengembang_rps,
                    ketua_prodi: formData.ketua_prodi,
                    cpl_ids: selectedCPLs
                });
                if (rows.length > 0) {
                    await axios.post(`/rps/dosen/${currentRPSId}/pertemuan/bulk`, { pertemuan: rows });
                }
                alert('RPS berhasil disimpan');
            } else {
                // Create new RPS
                const res = await axios.post('/rps/dosen/create', {
                    mata_kuliah_id: formData.mata_kuliah_id,
                    semester: formData.semester,
                    tahun_ajaran: formData.tahun_ajaran,
                    deskripsi_mk: formData.deskripsi_mk,
                    rumpun_mk: formData.rumpun_mk,
                    pengembang_rps: formData.pengembang_rps,
                    ketua_prodi: formData.ketua_prodi,
                    cpl_ids: selectedCPLs
                });
                const newRpsId = res.data.rps?.id || res.data.id;
                setCurrentRPSId(newRpsId);
                if (rows.length > 0) {
                    await axios.post(`/rps/dosen/${newRpsId}/pertemuan/bulk`, { pertemuan: rows });
                }
                alert('RPS berhasil dibuat (Draft)');
                const basePath = window.location.pathname.includes('/kaprodi/') ? '/kaprodi' : '/dosen';
                navigate(`${basePath}/rps/${newRpsId}/edit`, { replace: true });
            }
        } catch (error) {
            console.error('Save failed:', error);
            const msg = error.response?.data?.message || error.message;
            alert('Gagal menyimpan RPS: ' + msg);
        } finally {
            setLoading(false);
        }
    };

    // Filter courses by semester
    const filteredCourses = courses.filter(c => {
        if (!activeSemester) return true;
        const isGanjil = c.semester % 2 !== 0;
        if (activeSemester === 'Ganjil') return isGanjil || !c.semester;
        if (activeSemester === 'Genap') return !isGanjil || !c.semester;
        return true;
    });

    // Calculate total bobot
    const totalBobot = rows.reduce((sum, row) => sum + (parseFloat(row.bobot_penilaian) || 0), 0);

    // Section tabs
    const sections = [
        { id: 'identitas', label: 'Identitas MK', icon: BookOpen },
        { id: 'cpl', label: 'CPL & CPMK', icon: ChevronRight },
        { id: 'mingguan', label: 'Rencana Mingguan', icon: Monitor },
        { id: 'tambahan', label: 'Info Tambahan', icon: Users }
    ];

    if (loading && !formData.mata_kuliah_id) {
        return <div className="p-6 text-center">Memuat...</div>;
    }

    return (
        <div className="space-y-4 pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        {currentRPSId ? 'Edit RPS' : 'Buat RPS Baru'}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {formData.nama_mk ? `${formData.kode_mk} - ${formData.nama_mk}` : 'Pilih Mata Kuliah'}
                    </p>
                </div>
                <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                </button>
            </div>

            {/* Section Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex-1 min-w-[120px] px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeSection === section.id
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                                }`}
                        >
                            <section.icon size={16} />
                            {section.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* Section: Identitas MK */}
                    {activeSection === 'identitas' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label">Mata Kuliah</label>
                                    <select
                                        value={formData.mata_kuliah_id}
                                        onChange={handleCourseChange}
                                        className="input w-full"
                                        disabled={!!rpsId}
                                    >
                                        <option value="">Pilih MK...</option>
                                        {filteredCourses.map(c => (
                                            <option key={c.id} value={c.id}>{c.kode_mk} - {c.nama_mk}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Menampilkan MK semester {activeSemester || 'semua'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="label">Kode MK</label>
                                        <input type="text" value={formData.kode_mk} disabled className="input bg-gray-100 dark:bg-gray-700 w-full" />
                                    </div>
                                    <div>
                                        <label className="label">SKS</label>
                                        <input type="text" value={formData.sks} disabled className="input bg-gray-100 dark:bg-gray-700 w-full" />
                                    </div>
                                    <div>
                                        <label className="label">Revisi</label>
                                        <input type="number" value={formData.revisi} onChange={e => setFormData({ ...formData, revisi: e.target.value })} className="input w-full" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label">Rumpun MK</label>
                                    {!showNewRumpun ? (
                                        <div className="flex gap-2">
                                            <select value={formData.rumpun_mk} onChange={e => setFormData({ ...formData, rumpun_mk: e.target.value })} className="input flex-1">
                                                <option value="">Pilih Rumpun...</option>
                                                {rumpunOptions.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                            <button onClick={() => setShowNewRumpun(true)} className="btn btn-outline btn-sm" title="Tambah Rumpun Baru">
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input type="text" value={newRumpunValue} onChange={e => setNewRumpunValue(e.target.value)} className="input flex-1" placeholder="Nama rumpun baru..." autoFocus />
                                            <button onClick={addNewRumpun} className="btn btn-primary btn-sm">Tambah</button>
                                            <button onClick={() => { setShowNewRumpun(false); setNewRumpunValue(''); }} className="btn btn-ghost btn-sm"><X size={16} /></button>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Semester</label>
                                        <select value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })} className="input w-full">
                                            <option value="Ganjil">Ganjil</option>
                                            <option value="Genap">Genap</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Tahun Ajaran</label>
                                        <input type="text" value={formData.tahun_ajaran} onChange={e => setFormData({ ...formData, tahun_ajaran: e.target.value })} className="input w-full" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label">Pengembang RPS</label>
                                    <input type="text" value={formData.pengembang_rps} onChange={e => setFormData({ ...formData, pengembang_rps: e.target.value })} className="input w-full" />
                                </div>
                                <div>
                                    <label className="label">Ketua Program Studi</label>
                                    <input type="text" value={formData.ketua_prodi} onChange={e => setFormData({ ...formData, ketua_prodi: e.target.value })} className="input w-full" />
                                </div>
                            </div>
                            <div>
                                <label className="label">Deskripsi Mata Kuliah</label>
                                <textarea value={formData.deskripsi_mk} onChange={e => setFormData({ ...formData, deskripsi_mk: e.target.value })} className="input w-full" rows="3" placeholder="Deskripsi singkat mengenai mata kuliah..." />
                            </div>
                        </div>
                    )}

                    {/* Section: CPL & CPMK */}
                    {activeSection === 'cpl' && (
                        <div className="space-y-6">
                            {/* CPL Selection - Checkbox list */}
                            <div>
                                <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Capaian Pembelajaran Lulusan (CPL) Program Studi</h3>
                                <p className="text-sm text-gray-500 mb-3">Centang CPL yang relevan dengan mata kuliah ini (biasanya 2-4 CPL)</p>
                                <div className="border rounded-lg p-4 max-h-72 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 space-y-2">
                                    {availableCPLs.length === 0 ? (
                                        <p className="text-gray-500 text-sm italic">Memuat CPL... {!formData.mata_kuliah_id && '(Pilih MK di tab Identitas)'}</p>
                                    ) : (
                                        availableCPLs.map(cpl => (
                                            <label key={cpl.id} className={`flex items-start gap-3 p-3 rounded cursor-pointer border transition-colors ${selectedCPLs.includes(cpl.id)
                                                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                                                }`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCPLs.includes(cpl.id)}
                                                    onChange={() => toggleCPL(cpl.id)}
                                                    className="mt-1 h-4 w-4"
                                                />
                                                <div className="flex-1">
                                                    <span className="font-semibold text-blue-600 dark:text-blue-400">{cpl.kode}</span>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{cpl.deskripsi}</p>
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>
                                {selectedCPLs.length > 0 && (
                                    <p className="text-sm text-green-600 mt-2">✓ {selectedCPLs.length} CPL dipilih</p>
                                )}
                            </div>

                            {/* CPMK Editor - Only show CPMKs related to selected CPLs */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Capaian Pembelajaran Mata Kuliah (CPMK)</h3>
                                        <p className="text-sm text-gray-500">Pilih CPMK yang akan dibebankan pada mata kuliah ini.</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {selectedCPLs.length === 0 ? (
                                        <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded text-center text-yellow-700 dark:text-yellow-400">
                                            Silakan pilih CPL terlebih dahulu di atas.
                                        </div>
                                    ) : (
                                        selectedCPLs.map(cplId => {
                                            const cpl = availableCPLs.find(c => c.id === cplId);
                                            if (!cpl) return null;

                                            // Ensure cpmks is array
                                            const cpmks = cpl.cpmks || [];

                                            return (
                                                <div key={cpl.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h4 className="font-bold text-gray-800 dark:text-gray-200 border-b pb-2 flex-1">
                                                            Turunan dari {cpl.kode}
                                                            <span className="text-xs font-normal text-gray-500 ml-2 block sm:inline">{cpl.deskripsi.substring(0, 60)}...</span>
                                                        </h4>
                                                        <button
                                                            onClick={() => setActiveCpl(activeCpl === cpl.id ? null : cpl.id)}
                                                            className="btn btn-xs btn-outline ml-2"
                                                        >
                                                            {activeCpl === cpl.id ? 'Tutup' : 'Tambah Baru'}
                                                        </button>
                                                    </div>

                                                    {/* Existing CPMKs Checkbox List */}
                                                    <div className="space-y-2 mb-4">
                                                        {cpmks.length > 0 ? (
                                                            cpmks.map(cpmk => (
                                                                <div key={cpmk.id} className="ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-r transition-colors">
                                                                    <label className="flex items-start gap-3 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedCPMKs.includes(cpmk.id)}
                                                                            onChange={() => toggleCPMK(cpmk.id)}
                                                                            className="mt-1 h-4 w-4 text-blue-600 rounded"
                                                                        />
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-bold text-blue-600 dark:text-blue-400">{cpmk.kode}</span>
                                                                                {cpmk.mata_kuliah_id === formData.mata_kuliah_id && (
                                                                                    <span className="badge badge-xs badge-info">Custom</span>
                                                                                )}
                                                                                {cpmk.is_template && (
                                                                                    <span className="badge badge-xs">Template</span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-sm text-gray-700 dark:text-gray-300">{cpmk.deskripsi}</p>

                                                                            {/* Sub-CPMK Visual */}
                                                                            {cpmk.subCpmks && cpmk.subCpmks.length > 0 && (
                                                                                <div className="mt-2 text-xs text-gray-500">
                                                                                    <span className="font-semibold">Sub-CPMK:</span>
                                                                                    <ul className="list-disc list-inside ml-2">
                                                                                        {cpmk.subCpmks.map(s => (
                                                                                            <li key={s.id}>{s.kode}: {s.deskripsi.substring(0, 50)}...</li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            )}

                                                                            {/* Option to Add Sub-CPMK (If CPMK is selected) */}
                                                                            {selectedCPMKs.includes(cpmk.id) && (
                                                                                <button
                                                                                    onClick={(e) => { e.preventDefault(); /* TODO: Open Modal */ }}
                                                                                    className="text-xs text-blue-500 mt-1 hover:underline"
                                                                                >+ Tambah Sub-CPMK</button>
                                                                            )}
                                                                        </div>
                                                                    </label>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-sm text-gray-400 italic ml-4">Belum ada CPMK untuk kurikulum ini.</p>
                                                        )}
                                                    </div>

                                                    {/* Form Add New CPMK (Direct to DB) */}
                                                    {activeCpl === cpl.id && (
                                                        <div className="mt-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-blue-100">
                                                            <h5 className="font-semibold text-sm mb-2 text-blue-700">Tambah CPMK Baru ke Database</h5>
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                                <div>
                                                                    <label className="text-xs font-semibold">Kode</label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Misal: CPMK-01"
                                                                        className="input input-sm w-full"
                                                                        value={newCpmk.kode || `${cpl.kode}-`}
                                                                        onChange={e => setNewCpmk({ ...newCpmk, kode: e.target.value })}
                                                                    />
                                                                </div>
                                                                <div className="md:col-span-3">
                                                                    <label className="text-xs font-semibold">Deskripsi</label>
                                                                    <div className="flex gap-2">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Deskripsi kemampuan..."
                                                                            className="input input-sm w-full"
                                                                            value={newCpmk.deskripsi}
                                                                            onChange={e => setNewCpmk({ ...newCpmk, deskripsi: e.target.value })}
                                                                        />
                                                                        <button
                                                                            onClick={() => handleAddCPMK(cpl.id, cpl.kode)}
                                                                            disabled={!newCpmk.kode || !newCpmk.deskripsi}
                                                                            className="btn btn-sm btn-primary"
                                                                        >
                                                                            Simpan
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section: Rencana Mingguan */}
                    {activeSection === 'mingguan' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center flex-wrap gap-3">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Rencana Pembelajaran Mingguan</h3>
                                    <p className="text-sm text-gray-500">
                                        {rows.length} pertemuan |
                                        Total Bobot: <span className={totalBobot === 100 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{totalBobot}%</span>
                                        {totalBobot !== 100 && <span className="text-red-500"> (Harus 100%)</span>}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={addWeek} className="btn btn-outline btn-sm">
                                        <Plus size={16} className="mr-1" /> Tambah Minggu
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-2 py-3 text-center font-semibold w-14">Mg</th>
                                            <th className="px-2 py-3 text-left font-semibold min-w-[100px]">CPMK</th>
                                            <th className="px-2 py-3 text-left font-semibold min-w-[140px]">SubCPMK</th>
                                            <th className="px-2 py-3 text-left font-semibold min-w-[140px]">Indikator</th>
                                            <th className="px-2 py-3 text-left font-semibold min-w-[140px]">Penilaian (maks 3)</th>
                                            <th className="px-2 py-3 text-left font-semibold min-w-[140px]">Materi</th>
                                            <th className="px-2 py-3 text-left font-semibold min-w-[140px]">Metode (maks 3)</th>
                                            <th className="px-2 py-3 text-center font-semibold w-20">Bentuk</th>
                                            <th className="px-2 py-3 text-center font-semibold w-14">%</th>
                                            <th className="px-2 py-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {rows.map((row, index) => (
                                            <tr key={row.id} className={row.is_uts || row.is_uas ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}>
                                                <td className="px-2 py-2 text-center">
                                                    <span className="font-bold text-gray-500">{row.minggu_ke}</span>
                                                    {row.is_uts && <span className="block text-xs text-yellow-600">UTS</span>}
                                                    {row.is_uas && <span className="block text-xs text-yellow-600">UAS</span>}
                                                </td>
                                                <td className="px-1 py-1">
                                                    <select value={row.cpmk_id} onChange={e => updateRow(index, 'cpmk_id', e.target.value)} className="w-full px-1 py-1 border rounded text-xs dark:bg-gray-800">
                                                        <option value="">-</option>
                                                        {availableCPLs.flatMap(c => c.cpmks || []).filter(c => selectedCPMKs.includes(c.id)).map(c => <option key={c.id} value={c.id}>{c.kode}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-1 py-1">
                                                    <select value={row.sub_cpmk_id} onChange={e => updateRow(index, 'sub_cpmk_id', e.target.value)} className="w-full px-1 py-1 border rounded text-xs dark:bg-gray-800">
                                                        <option value="">-</option>
                                                        {(() => {
                                                            const allCpmks = availableCPLs.flatMap(c => c.cpmks || []);
                                                            const selectedCpmk = allCpmks.find(c => c.id == row.cpmk_id);
                                                            const subs = selectedCpmk ? (selectedCpmk.subCpmks || []) : [];
                                                            return subs.map(s => (
                                                                <option key={s.id} value={s.id}>{s.kode}</option>
                                                            ));
                                                        })()}
                                                    </select>
                                                </td>
                                                <td className="px-1 py-1">
                                                    <textarea value={row.indikator} onChange={e => updateRow(index, 'indikator', e.target.value)} className="w-full px-1 py-1 border rounded text-xs dark:bg-gray-800 resize-none" rows="2" />
                                                </td>
                                                <td className="px-1 py-1">
                                                    <div className="flex flex-wrap gap-1">
                                                        {teknikPenilaian.slice(0, 6).map(t => (
                                                            <label key={t} className={`text-xs px-1 py-0.5 rounded cursor-pointer ${(row.teknik_penilaian || []).includes(t) ? 'bg-blue-100 text-blue-700 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'
                                                                }`}>
                                                                <input type="checkbox" checked={(row.teknik_penilaian || []).includes(t)} onChange={() => toggleMultiSelect(index, 'teknik_penilaian', t, 3)} className="hidden" />
                                                                {t.split(' ')[0]}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-1 py-1">
                                                    <textarea value={row.materi} onChange={e => updateRow(index, 'materi', e.target.value)} className="w-full px-1 py-1 border rounded text-xs dark:bg-gray-800 resize-none" rows="2" />
                                                </td>
                                                <td className="px-1 py-1">
                                                    <div className="flex flex-wrap gap-1">
                                                        {metodePembelajaran.slice(0, 6).map(m => (
                                                            <label key={m} className={`text-xs px-1 py-0.5 rounded cursor-pointer ${(row.metode_pembelajaran || []).includes(m) ? 'bg-green-100 text-green-700 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'
                                                                }`}>
                                                                <input type="checkbox" checked={(row.metode_pembelajaran || []).includes(m)} onChange={() => toggleMultiSelect(index, 'metode_pembelajaran', m, 3)} className="hidden" />
                                                                {m.split(' ')[0]}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-1 py-1">
                                                    <div className="flex flex-col gap-0.5 text-xs">
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input type="checkbox" checked={row.bentuk_pembelajaran?.includes('luring')} onChange={() => toggleBentukPembelajaran(index, 'luring')} className="h-3 w-3" />
                                                            L
                                                        </label>
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input type="checkbox" checked={row.bentuk_pembelajaran?.includes('daring')} onChange={() => toggleBentukPembelajaran(index, 'daring')} className="h-3 w-3" />
                                                            D
                                                        </label>
                                                    </div>
                                                </td>
                                                <td className="px-1 py-1">
                                                    <input type="number" min="0" max="100" value={row.bobot_penilaian} onChange={e => updateRow(index, 'bobot_penilaian', e.target.value)} className="w-full px-1 py-1 border rounded text-xs text-center dark:bg-gray-800" />
                                                </td>
                                                <td className="px-1 py-1">
                                                    <button onClick={() => removeWeek(index)} disabled={row.is_uts || row.is_uas} className="text-red-400 hover:text-red-600 disabled:opacity-30" title="Hapus Minggu">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-gray-500">L = Luring (Tatap Muka), D = Daring (Online)</p>
                        </div>
                    )}

                    {/* Section: Info Tambahan */}
                    {activeSection === 'tambahan' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label">Pustaka Utama</label>
                                    <textarea value={pustakaUtama} onChange={e => setPustakaUtama(e.target.value)} className="input w-full" rows="4" placeholder="Daftar pustaka utama..." />
                                </div>
                                <div>
                                    <label className="label">Pustaka Pendukung</label>
                                    <textarea value={pustakaPendukung} onChange={e => setPustakaPendukung(e.target.value)} className="input w-full" rows="4" placeholder="Daftar pustaka pendukung..." />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label">Media Pembelajaran - Software</label>
                                    <input type="text" value={mediaSoftware} onChange={e => setMediaSoftware(e.target.value)} className="input w-full" placeholder="Contoh: VS Code, Python, dll" />
                                </div>
                                <div>
                                    <label className="label">Media Pembelajaran - Hardware</label>
                                    <input type="text" value={mediaHardware} onChange={e => setMediaHardware(e.target.value)} className="input w-full" placeholder="Contoh: Laptop, Proyektor, dll" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label">Ambang Batas Kelulusan Mahasiswa (%)</label>
                                    <input type="number" min="0" max="100" value={ambangKelulusanMhs} onChange={e => setAmbangKelulusanMhs(e.target.value)} className="input w-full" />
                                </div>
                                <div>
                                    <label className="label">Ambang Batas Kelulusan MK (%)</label>
                                    <input type="number" min="0" max="100" value={ambangKelulusanMK} onChange={e => setAmbangKelulusanMK(e.target.value)} className="input w-full" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t p-4 z-40 flex justify-end gap-3 shadow-lg lg:pl-64">
                <button onClick={() => navigate(-1)} className="btn btn-ghost">Batal</button>
                <button onClick={handleSaveDraft} disabled={loading || !formData.mata_kuliah_id} className="btn btn-primary flex items-center gap-2">
                    <Save size={18} />
                    {loading ? 'Menyimpan...' : (currentRPSId ? 'Simpan Perubahan' : 'Simpan Draft RPS')}
                </button>
            </div>
        </div>
    );
}
