import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight, BookOpen, Users, Monitor, X, Cloud, CloudOff, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
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
    const [lastSaved, setLastSaved] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown
    const dropdownRef = useRef(null); // Ref for click outside

    // Constants for selection
    const teknikPenilaian = [
        'Tes Tertulis', 'Tes Lisan', 'Penilaian Kinerja', 'Penilaian Proyek', 'Penilaian Portofolio', 'Observasi'
    ];

    const metodePembelajaran = [
        'Kuliah', 'Diskusi', 'Presentasi', 'Praktikum',
        'Problem Based Learning (PBL)', 'Project Based Learning (PjBL)',
        'Case Based Learning (CBL)', 'Inquiry', 'Responsi', 'Seminar'
    ];

    const getMethodColor = (method) => {
        const colors = {
            'Kuliah': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
            'Diskusi': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
            'Presentasi': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
            'Praktikum': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
            'Problem Based Learning': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
            'Problem Based Learning (PBL)': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
            'Project Based Learning (PjBL)': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
            'Case Based Learning (CBL)': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
            'Inquiry': 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
            'Responsi': 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
            'Seminar': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
        };
        return colors[method] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    };

    // Simple Markdown Toolbar Component
    const SimpleToolbar = ({ onInsert }) => (
        <div className="flex gap-1 bg-gray-50 dark:bg-gray-800 p-1 rounded-t-md border-b border-gray-200 dark:border-gray-700">
            <button type="button" onMouseDown={(e) => { e.preventDefault(); onInsert('**', '**'); }} className="px-2 py-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs font-bold" title="Bold">B</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); onInsert('*', '*'); }} className="px-2 py-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs italic" title="Italic">I</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); onInsert('\n- ', ''); }} className="px-2 py-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs" title="Bullet List">• List</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); onInsert('\n1. ', ''); }} className="px-2 py-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs" title="Numbered List">1. List</button>
        </div>
    );

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
        koordinator_rumpun_mk: '',
        ketua_prodi: '',
        pustaka_utama: '',
        pustaka_pendukung: '',
        media_software: '',
        media_hardware: '',
        mk_syarat: '',
        ambang_batas_mhs: '',
        ambang_batas_mk: ''
    });

    const [dosen_pengampu_list, setDosenPengampuList] = useState([]);

    // Rumpun MK options with add-new capability
    const [rumpunOptions, setRumpunOptions] = useState([
        'Pemrograman', 'Basis Data', 'Jaringan Komputer', 'Kecerdasan Buatan',
        'Sistem Informasi', 'Multimedia', 'Keamanan Siber', 'Matematika', 'Umum'
    ]);
    const [showNewRumpun, setShowNewRumpun] = useState(false);

    // --- State: Sub-CPMK Management (Phase 24) ---
    // Enriched definedSubCPMKs withestimasi_minggu
    // Handled in existing state: definedSubCPMKs
    const [newRumpunValue, setNewRumpunValue] = useState('');

    // --- State: Capaian Pembelajaran ---
    const [availableCPLs, setAvailableCPLs] = useState([]);
    const [selectedCPLs, setSelectedCPLs] = useState([]);
    const [selectedCPMKs, setSelectedCPMKs] = useState([]); // Array of IDs linked to this RPS
    const [activeCpl, setActiveCpl] = useState(null); // ID for expanding UI to add new CPMK
    const [newCpmk, setNewCpmk] = useState({ kode: '', deskripsi: '' });
    const [newSubCpmk, setNewSubCpmk] = useState({ kode: '', deskripsi: '', cpmk_id: '' });
    const [definedSubCPMKs, setDefinedSubCPMKs] = useState([]);
    const [resolvedCPMKs, setResolvedCPMKs] = useState([]); // Full CPMK objects from backend
    const [resolvedCPLs, setResolvedCPLs] = useState([]); // Full CPL objects from backend
    // --- State: Metode Penilaian ---
    const [metodePenilaian, setMetodePenilaian] = useState([]);
    const [assessmentTypes, setAssessmentTypes] = useState([
        'Rubrik', 'Portofolio', 'Tes Tertulis', 'Tes Lisan', 'Observasi', 'Partisipasi'
    ]);

    // --- State: Weekly Schedule ---
    const [rows, setRows] = useState([]);
    const [currentRPSId, setCurrentRPSId] = useState(rpsId || null);

    // --- Local Storage Draft Logic ---
    const DRAFT_KEY = `rps_draft_${user?.id}_${rpsId || 'new'}`;

    // Load draft on mount (only if creating new or if user explicitly wants to check drafts)
    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft && !rpsId) {
            try {
                const parsed = JSON.parse(savedDraft);
                const confirmLoad = window.confirm('Ditemukan draft RPS yang belum disimpan. Apakah Anda ingin melanjutkannya?');
                if (confirmLoad) {
                    setFormData(parsed.formData);
                    setRows(parsed.rows || []);
                    setSelectedCPLs(parsed.selectedCPLs || []);
                    setSelectedCPMKs(parsed.selectedCPMKs || []);
                    setDefinedSubCPMKs(parsed.definedSubCPMKs || []);
                    setMetodePenilaian(parsed.metodePenilaian || []);
                    if (parsed.dosen_pengampu_list) setDosenPengampuList(parsed.dosen_pengampu_list);
                    console.log('Draft loaded');
                }
            } catch (e) {
                console.error('Failed to parse draft', e);
            }
        }
    }, [rpsId, user?.id]);

    // Save draft periodically
    useEffect(() => {
        const saveToLocal = debounce(() => {
            if (formData.mata_kuliah_id) { // Only save if at least MK is selected
                const draftData = {
                    formData,
                    rows,
                    selectedCPLs,
                    selectedCPMKs,
                    selectedCPMKs,
                    selectedCPMKs,
                    definedSubCPMKs, // Now includes estimasi_minggu and acts as ordered list
                    metodePenilaian,
                    metodePenilaian,
                    dosen_pengampu_list,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
                setLastSaved(new Date());
            }
        }, 2000);

        saveToLocal();
        return () => saveToLocal.cancel();
    }, [formData, rows, selectedCPLs, selectedCPMKs, definedSubCPMKs, dosen_pengampu_list, DRAFT_KEY]);

    // --- Data Fetching & Effects ---
    useEffect(() => {
        fetchCourses();
    }, []);

    // Update semester when header changes
    useEffect(() => {
        // Only update if not loaded from params/draft override
        if (!rpsId && activeSemester && !formData.mata_kuliah_id) {
            setFormData(prev => ({ ...prev, semester: activeSemester }));
        }
        if (!rpsId && activeYear && !formData.mata_kuliah_id) {
            setFormData(prev => ({ ...prev, tahun_ajaran: activeYear }));
        }
    }, [activeCpl, definedSubCPMKs, rows]);

    const handleToolbarInsert = (index, field, prefix, suffix) => {
        const textarea = document.getElementById(`textarea-${index}-${field}`);
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = rows[index][field] || '';
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end);
        const newValue = `${before}${prefix}${selected}${suffix}${after}`;
        updateRow(index, field, newValue);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    useEffect(() => {
        // Parse courseId from URL query params OR location.state
        const searchParams = new URLSearchParams(location.search);
        const urlCourseId = searchParams.get('courseId');

        if (rpsId) {
            fetchExistingRPS();
        } else if (urlCourseId && courses.length > 0) {
            // Auto-select course from query param
            const course = courses.find(c => c.id === parseInt(urlCourseId));
            if (course) {
                setFormData(prev => ({
                    ...prev,
                    mata_kuliah_id: course.id,
                    kode_mk: course.kode_mk || '',
                    nama_mk: course.nama_mk || '',
                    sks: course.sks || '',
                    rumpun_mk: course.rumpun_mk || ''
                }));
                if (course.prodi_id) {
                    fetchCPLs(course.prodi_id, course.id);
                }
                if (rows.length === 0) initializeRows(14);
            }
        } else if (location.state?.courseId) {
            handleCoursePreselect(location.state);
        } else if (rows.length === 0) {
            initializeRows(14);
        }
    }, [rpsId, location.state, location.search, courses]);

    // Fetch CPLs when course is selected (moved logic into selection effect for efficiency)
    useEffect(() => {
        if (formData.mata_kuliah_id && courses.length > 0) {
            const course = courses.find(c => c.id === parseInt(formData.mata_kuliah_id));
            if (course?.prodi_id) {
                fetchCPLs(course.prodi_id, course.id);
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
        // Populate Dosen if available
        if (state.assignments && Array.isArray(state.assignments)) {
            const dosenNames = state.assignments.map(a => a.dosen?.nama_lengkap).filter(Boolean);
            if (dosenNames.length > 0) setDosenPengampuList(dosenNames);
        } else if (state.dosen_pengampu_list) {
            // Fallback if passed in state
            setDosenPengampuList(state.dosen_pengampu_list);
        }

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

            // Auto-populate Dosen from Course Assignments
            if (course.assignments && Array.isArray(course.assignments)) {
                const dosenNames = course.assignments.map(a => a.dosen?.nama_lengkap).filter(Boolean);
                if (dosenNames.length > 0) setDosenPengampuList(dosenNames);
            }

            if (course.prodi_id) {
                fetchCPLs(course.prodi_id, courseId);
            }
            if (rows.length === 0) initializeRows(14);
        }
    };

    // Helper to safely parse array fields from backend (handling strings, JSON strings, arrays)
    const parseArrayField = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        try {
            // Try parsing if it looks like a JSON array
            if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('"'))) {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) return parsed.flat(); // Flatten in case of ["[]"]
                return [parsed];
            }
        } catch (e) {
            // If parse fails, treat as simple string
        }
        return [value];
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
                koordinator_rumpun_mk: rps.koordinator_rumpun_mk || '',
                ketua_prodi: rps.ketua_prodi || '',
                pustaka_utama: rps.pustaka_utama || '',
                pustaka_pendukung: rps.pustaka_pendukung || '',
                media_software: rps.media_software || '',
                media_hardware: rps.media_hardware || '',
                mk_syarat: rps.mk_syarat || '',
                ambang_batas_mhs: rps.ambang_batas_mhs || '',
                ambang_batas_mk: rps.ambang_batas_mk || '',
                status: rps.status || 'draft'
            });

            if (rps.dosen_pengampu_list) {
                setDosenPengampuList(rps.dosen_pengampu_list);
            }
            if (rps.cpl_ids) setSelectedCPLs(rps.cpl_ids);
            if (rps.cpmk_ids) setSelectedCPMKs(rps.cpmk_ids);
            if (rps.cpl) setResolvedCPLs(rps.cpl);
            if (rps.cpmk) setResolvedCPMKs(rps.cpmk);

            if (rps.sub_cpmk_list) {
                // Ensure estimasi_minggu exists and handle potential string data
                let subList = rps.sub_cpmk_list;
                if (typeof subList === 'string') {
                    try { subList = JSON.parse(subList); } catch (e) { subList = []; }
                }
                if (Array.isArray(subList)) {
                    const mappedSubs = subList.map(s => ({
                        ...s,
                        estimasi_minggu: s.estimasi_minggu || 1
                    }));
                    setDefinedSubCPMKs(mappedSubs);
                }
            }
            if (rps.metode_penilaian) {
                let mp = rps.metode_penilaian;
                if (typeof mp === 'string') {
                    try { mp = JSON.parse(mp); } catch (e) { mp = []; }
                }
                setMetodePenilaian(Array.isArray(mp) ? mp : []);
            }
            setCurrentRPSId(rps.id);
            if (rps.pertemuan && rps.pertemuan.length > 0) {
                setRows(rps.pertemuan.map(p => ({
                    id: p.id || Date.now() + Math.random(),
                    minggu_ke: p.minggu_ke,
                    cpmk_id: p.cpmk_id || '',
                    sub_cpmk_id: p.sub_cpmk_id || '', // Ensure ID is loaded
                    indikator: parseArrayField(p.indikator), // Parse to array for dynamic list
                    teknik_penilaian: parseArrayField(p.teknik_penilaian),
                    kriteria_penilaian: p.kriteria_penilaian || '',
                    materi: p.materi || '',
                    metode_pembelajaran: parseArrayField(p.metode_pembelajaran),
                    bentuk_pembelajaran: Array.isArray(p.bentuk_pembelajaran) ? p.bentuk_pembelajaran : [],
                    link_daring: p.link_daring || '',
                    nama_lms: p.nama_lms || '',
                    link_meet_platform: p.link_meet_platform || '',
                    penugasan: p.penugasan || '', // Add Penugasan Field
                    bobot_penilaian: p.bobot_penilaian || 0,
                    is_uts: p.is_uts || p.jenis_pertemuan === 'uts',
                    is_uas: p.is_uas || p.jenis_pertemuan === 'uas'
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
            id: 'temp_' + Date.now() + i,
            minggu_ke: i + 1,
            cpmk_id: '',
            sub_cpmk_id: '',
            indikator: [''],
            teknik_penilaian: [],
            kriteria_penilaian: '',
            materi: i + 1 === utsWeek ? 'Ujian Tengah Semester' : i + 1 === uasWeek ? 'Ujian Akhir Semester' : '',
            metode_pembelajaran: [],
            bentuk_pembelajaran: [],
            link_daring: '',
            nama_lms: '',
            link_meet_platform: '',
            penugasan: '', // Add Penugasan Field
            bobot_penilaian: i + 1 === utsWeek ? 22 : i + 1 === uasWeek ? 26 : '',
            is_uts: i + 1 === utsWeek,
            is_uas: i + 1 === uasWeek,
            sampai_minggu_ke: null
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


    const handleAddSubCPMKLocal = () => {
        if (!newSubCpmk.kode || !newSubCpmk.deskripsi || !newSubCpmk.cpmk_id) return;

        const newSub = {
            id: 'new_' + Date.now(),
            kode: newSubCpmk.kode,
            deskripsi: newSubCpmk.deskripsi,
            cpmk_id: newSubCpmk.cpmk_id,
            estimasi_minggu: 1
        };

        setDefinedSubCPMKs([...definedSubCPMKs, newSub]);
        setNewSubCpmk({ kode: '', deskripsi: '', cpmk_id: '' });
    };



    // Sub-CPMK Reordering & Update
    const moveSubCPMK = (index, direction) => {
        const newSubs = [...definedSubCPMKs];
        if (direction === 'up' && index > 0) {
            [newSubs[index], newSubs[index - 1]] = [newSubs[index - 1], newSubs[index]];
        } else if (direction === 'down' && index < newSubs.length - 1) {
            [newSubs[index], newSubs[index + 1]] = [newSubs[index + 1], newSubs[index]];
        }
        setDefinedSubCPMKs(newSubs);
    };

    const updateSubCPMK = (id, field, value) => {
        setDefinedSubCPMKs(definedSubCPMKs.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    // --- Weekly Plan Generator (Phase 24) ---
    const generateWeeklyPlan = () => {
        if (!window.confirm("PERINGATAN: Tindakan ini akan MENGHAPUS seluruh isi Rencana Mingguan yang sudah ada (termasuk isian manual) dan menyusun ulang berdasarkan urutan Sub-CPMK. Lanjutkan?")) {
            return;
        }

        const newRows = [];
        let currentWeek = 1;

        definedSubCPMKs.forEach(sub => {
            const duration = parseInt(sub.estimasi_minggu) || 1;
            for (let i = 0; i < duration; i++) {
                // Check for UTS/UAS weeks and insert if needed
                if (currentWeek === 8) {
                    newRows.push({
                        id: 'uts_auto_' + Date.now(),
                        minggu_ke: 8,
                        materi: 'Ujian Tengah Semester',
                        is_uts: true,
                        bobot_penilaian: 20
                    });
                    currentWeek++;
                } else if (currentWeek === 16) {
                    // Wait for end to push UAS usually, but let's handle it linearly
                }

                newRows.push({
                    id: `gen_${sub.id}_${i}_${Date.now()}`,
                    minggu_ke: currentWeek,
                    sub_cpmk_id: sub.id, // Link to Sub-CPMK
                    cpmk_id: sub.cpmk_id,
                    indikator: '',
                    kriteria_penilaian: '',
                    teknik_penilaian: [],
                    materi: sub.deskripsi, // Default materi from description
                    metode_pembelajaran: [],
                    bentuk_pembelajaran: sub.estimasi_minggu && sub.estimasi_minggu > 0 ? 'Kuliah' : '',
                    bobot_penilaian: 5,
                    link_daring: '',
                    nama_lms: '',
                    link_meet_platform: '',
                    is_uts: false,
                    is_uas: false
                });
                currentWeek++;
            }
        });

        // Add UAS at the end if not reached 16, or at 16
        if (currentWeek <= 16) {
            // If we haven't reached week 16, fill distinct weeks or just jump to 16? 
            // Logic: Append UAS at week 16.
            newRows.push({
                id: 'uas_auto_' + Date.now(),
                minggu_ke: 16,
                materi: 'Ujian Akhir Semester',
                is_uas: true,
                bobot_penilaian: 20
            });
        }

        setRows(newRows);
        setActiveSection('mingguan'); // Auto switch tab to verify
    };

    const handleDeleteSubCPMK = (id) => {
        setDefinedSubCPMKs(definedSubCPMKs.filter(s => s.id !== id));
        // Also clear from rows if used
        setRows(rows.map(r => r.sub_cpmk_id === id ? { ...r, sub_cpmk_id: '' } : r));
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
        if (current.includes(value)) {
            newRows[index].bentuk_pembelajaran = current.filter(v => v !== value);
        } else {
            newRows[index].bentuk_pembelajaran = [...current, value];
        }
        // The original code had a condition for 'daring' here, but it was malformed in the instruction.
        // Assuming the intent was to clear link_daring if 'daring' is removed from bentuk_pembelajaran.
        // If 'daring' is added, it might set a default link, but the instruction doesn't specify.
        // For now, I'll keep the original logic for link_daring if 'daring' is removed.
        if (value === 'D' && !newRows[index].bentuk_pembelajaran.includes('D')) { // Assuming 'D' for Daring
            newRows[index].link_daring = '';
        }
        setRows(newRows);
    };

    // --- Generator Logic (Phase 26: Smart Sync) ---
    const syncWeeklyPlan = () => {
        // Pool of 'available content rows' from current state that are NOT UTS/UAS
        let contentRows = rows.filter(r => !r.is_uts && !r.is_uas);
        let newRows = [];
        let currentWeek = 1;

        definedSubCPMKs.forEach((sub) => {
            const duration = parseInt(sub.estimasi_minggu) || 1;
            let weeksToProcess = duration;

            while (weeksToProcess > 0) {
                // Insert UTS if we are at week 8
                if (currentWeek === 8) {
                    newRows.push({
                        id: 'uts-' + Date.now() + Math.random(),
                        minggu_ke: 8,
                        is_uts: true,
                        materi: 'EVALUASI TENGAH SEMESTER (ETS) / UTS',
                        bobot_penilaian: 0
                    });
                    currentWeek++;
                    continue;
                }

                // Insert UAS if we are at week 16
                if (currentWeek === 16) {
                    newRows.push({
                        id: 'uas-' + Date.now() + Math.random(),
                        minggu_ke: 16,
                        is_uas: true,
                        materi: 'EVALUASI AKHIR SEMESTER (EAS) / UAS',
                        bobot_penilaian: 0
                    });
                    currentWeek++;
                    continue;
                }

                // Determine how many weeks we can fit before the next break (UTS or UAS)
                let nextBreak = (currentWeek < 8) ? 8 : 16;
                let availableWeeks = nextBreak - currentWeek;

                // If currentWeek is already > 16, let it overflow
                if (currentWeek > 16) availableWeeks = 99;

                // Take minimum of remaining duration or available weeks before break
                let weeksTaking = Math.min(weeksToProcess, availableWeeks);

                // Safety check to prevent infinite loop
                if (weeksTaking <= 0) {
                    currentWeek++;
                    continue;
                }

                const startWeek = currentWeek;
                const endWeek = currentWeek + weeksTaking - 1;

                // Find existing row to preserve data
                // We search for a row with matching sub_cpmk_id in the pool
                const existingRowIndex = contentRows.findIndex(r => String(r.sub_cpmk_id) === String(sub.id));
                let rowToUse = null;

                if (existingRowIndex >= 0) {
                    rowToUse = { ...contentRows[existingRowIndex] };
                    contentRows.splice(existingRowIndex, 1); // Remove from pool
                } else {
                    rowToUse = {
                        id: 'temp_' + Date.now() + Math.random(),
                        indikator: '',
                        kriteria_penilaian: '',
                        teknik_penilaian: [],
                        materi: '',
                        metode_pembelajaran: [],
                        bentuk_pembelajaran: [],
                        link_daring: '',
                        nama_lms: '',
                        link_meet_platform: '',
                        bobot_penilaian: '',
                        is_uts: false,
                        is_uas: false
                    };
                }

                rowToUse.minggu_ke = startWeek;
                rowToUse.sampai_minggu_ke = (weeksTaking > 1) ? endWeek : null;
                rowToUse.sub_cpmk_id = sub.id;
                // Update description if it was default
                rowToUse.sub_cpmk = (!rowToUse.sub_cpmk || rowToUse.sub_cpmk === '-') ? sub.deskripsi : rowToUse.sub_cpmk;

                newRows.push(rowToUse);

                currentWeek += weeksTaking;
                weeksToProcess -= weeksTaking;
            }
        });

        // Add final breaks if we ended exactly before them
        if (currentWeek === 8) {
            newRows.push({ id: 'uts-end', minggu_ke: 8, is_uts: true, materi: 'EVALUASI TENGAH SEMESTER (ETS) / UTS', bobot_penilaian: 0 });
        } else if (currentWeek === 16) {
            newRows.push({ id: 'uas-end', minggu_ke: 16, is_uas: true, materi: 'EVALUASI AKHIR SEMESTER (EAS) / UAS', bobot_penilaian: 0 });
        }

        setRows(newRows);
    };



    const handleAddUTS = () => {
        if (rows.some(r => r.is_uts)) {
            alert('UTS sudah ada dalam rencana mingguan.');
            return;
        }

        const newRow = {
            id: 'uts_' + Date.now(),
            minggu_ke: 8,
            sub_cpmk_id: '',
            indikator: '',
            kriteria_penilaian: '',
            teknik_penilaian: [],
            materi: 'Ujian Tengah Semester',
            metode_pembelajaran: [],
            bentuk_pembelajaran: [],
            bobot_penilaian: 20, // default bobot
            link_daring: '',
            nama_lms: '',
            link_meet_platform: '',
            is_uts: true,
            is_uas: false
        };
        insertRowAt(8, newRow);
    };

    // Helper to insert row safely
    const insertRowAt = (weekIndex, rowData) => {
        const newRows = [...rows];
        // weekIndex is 1-based usually, but logic here varies. 
        // Let's assume we want it roughly at array index corresponding to week.
        // Simple append for now if logic complex, but let's try to splice.
        // Logic: Find index where minggu_ke > weekIndex
        let insertIdx = newRows.findIndex(r => r.minggu_ke > weekIndex);
        if (insertIdx === -1) insertIdx = newRows.length;

        newRows.splice(insertIdx, 0, rowData);
        // Re-index minggu_ke? No, let them overlap or handle manually?
        // Better: Just push and sort? For now simple splice.
        setRows(newRows);
    };

    const handleAddUAS = () => {
        if (rows.some(r => r.is_uas)) {
            alert('UAS sudah ada dalam rencana mingguan.');
            return;
        }

        const newRow = {
            id: 'uas_' + Date.now(),
            minggu_ke: 16,
            sub_cpmk_id: '',
            indikator: '',
            kriteria_penilaian: '',
            teknik_penilaian: [],
            materi: 'Ujian Akhir Semester',
            metode_pembelajaran: [],
            bentuk_pembelajaran: [],
            bobot_penilaian: 20, // default bobot
            link_daring: '',
            nama_lms: '',
            link_meet_platform: '',
            is_uts: false,
            is_uas: true
        };
        const newRows = [...rows];
        newRows.push(newRow);
        // Sort
        newRows.sort((a, b) => (parseInt(a.minggu_ke) || 999) - (parseInt(b.minggu_ke) || 999));
        setRows(newRows);
    };

    const addWeek = () => {
        // Find highest week number
        let maxWeek = 0;
        rows.forEach(r => {
            const w = parseInt(r.minggu_ke) || 0;
            if (w > maxWeek) maxWeek = w;
        });
        const newMinggu = maxWeek + 1;

        const newRows = [...rows, {
            id: 'temp_' + Date.now(),
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
            nama_lms: '',
            link_meet_platform: '',
            bobot_penilaian: '',
            is_uts: false,
            is_uas: false,
            sampai_minggu_ke: null
        }];

        // Optional: Sort by minggu_ke to keep UI tidy
        newRows.sort((a, b) => (parseInt(a.minggu_ke) || 999) - (parseInt(b.minggu_ke) || 999));

        setRows(newRows);
    };

    const removeWeek = (index) => {
        if (rows.length <= 1) {
            alert('Minimal 1 pertemuan');
            return;
        }
        // Fix: Just remove the row, DO NOT renumber (it messes up UTS/UAS positions)
        const newRows = rows.filter((_, i) => i !== index);
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
    // --- Save ---
    const handleSaveDraft = () => {
        if (!formData.mata_kuliah_id) {
            alert('Pilih Mata Kuliah terlebih dahulu');
            return;
        }
        const draftData = {
            formData,
            rows,
            selectedCPLs,
            selectedCPMKs,
            definedSubCPMKs,
            dosen_pengampu_list,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
        setLastSaved(new Date());
        alert('Draft berhasil disimpan di browser (Local Storage)');
    };

    const handleSubmitToApproval = async () => {
        if (!currentRPSId) {
            alert('Simpan draft ke server terlebih dahulu sebelum diajukan');
            return;
        }

        if (!confirm('Apakah Anda yakin ingin mengajukan RPS ini untuk approval? RPS akan terkunci untuk pengeditan.')) {
            return;
        }

        try {
            setLoading(true);
            // Save current changes first
            await handleSaveToServer();

            // Submit for approval
            await axios.put(`/rps/${currentRPSId}/submit`);
            setFormData(prev => ({ ...prev, status: 'submitted' }));
            alert('RPS berhasil diajukan untuk approval!');

            // Redirect to management or refresh
            const basePath = window.location.pathname.includes('/kaprodi/') ? '/kaprodi' : '/dosen';
            navigate(`${basePath}/rps/${formData.mata_kuliah_id}`);
        } catch (error) {
            console.error('Submit failed:', error);
            alert('Gagal mengajukan RPS: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSaveToServer = async () => {
        if (!formData.mata_kuliah_id) {
            alert('Pilih Mata Kuliah terlebih dahulu');
            return;
        }
        try {
            setLoading(true);

            // Payload builder
            const payload = {
                ...formData,
                cpl_ids: selectedCPLs,
                cpmk_ids: selectedCPMKs
            };

            let saveId = currentRPSId;

            // If editing existing RPS, update instead of create
            if (currentRPSId) {
                const res = await axios.put(`/rps/dosen/${currentRPSId}/update`, {
                    ...formData,
                    cpl_ids: selectedCPLs,
                    cpmk_ids: selectedCPMKs,
                    sub_cpmk_list: definedSubCPMKs,
                    metode_penilaian: metodePenilaian,
                    dosen_pengampu_list
                });

                // Update local status in case it was reverted to draft
                if (res.data && res.data.status) {
                    setFormData(prev => ({ ...prev, status: res.data.status }));
                }
            } else {
                // Create new RPS
                const res = await axios.post('/rps/dosen/create', {
                    ...formData,
                    cpl_ids: selectedCPLs,
                    cpmk_ids: selectedCPMKs,
                    sub_cpmk_list: definedSubCPMKs,
                    metode_penilaian: metodePenilaian,
                    dosen_pengampu_list
                });

                // Handle existing RPS response
                if (res.data.isExisting) {
                    const confirmEdit = window.confirm(
                        `RPS untuk MK ini dengan semester dan tahun ajaran yang sama sudah ada (${res.data.rps?.status || 'draft'}). ` +
                        `Apakah Anda ingin melanjutkan mengedit RPS yang sudah ada?`
                    );
                    if (confirmEdit) {
                        saveId = res.data.rps?.id || res.data.id;
                        const finalRps = res.data.rps || res.data;
                        setCurrentRPSId(saveId);
                        setFormData(prev => ({
                            ...prev,
                            status: finalRps.status || 'draft'
                        }));
                        alert('RPS yang sudah ada dimuat. Silakan lanjutkan mengedit.');
                    } else {
                        setLoading(false);
                        return; // User cancelled
                    }
                } else {
                    saveId = res.data.rps?.id || res.data.id;
                    const finalRps = res.data.rps || res.data;
                    setCurrentRPSId(saveId);
                    setFormData(prev => ({
                        ...prev,
                        status: finalRps.status || 'draft'
                    }));
                }
            }

            if (rows.length > 0 && saveId) {
                // Prepare rows for saving (stringify arrays that need to be text)
                const rowsToSend = rows.map(r => {
                    let indikatorVal = r.indikator;
                    // Strict check: if it's an array or object, stringify it. 
                    // If it's already a string, leave it (unless it needs cleaning, but backend expects string)
                    if (Array.isArray(indikatorVal) || (typeof indikatorVal === 'object' && indikatorVal !== null)) {
                        indikatorVal = JSON.stringify(indikatorVal);
                    } else if (indikatorVal === undefined || indikatorVal === null) {
                        indikatorVal = ''; // Handled as empty text
                    } else {
                        indikatorVal = String(indikatorVal); // Force string
                    }

                    return {
                        ...r,
                        indikator: indikatorVal,
                        // Clean and stringify metode_pembelajaran
                        metode_pembelajaran: Array.isArray(r.metode_pembelajaran)
                            ? JSON.stringify(r.metode_pembelajaran.filter(x => x && x.trim() !== ''))
                            : r.metode_pembelajaran,
                        // Clean and stringify bentuk_pembelajaran (if it's an array, though mostly string now)
                        bentuk_pembelajaran: Array.isArray(r.bentuk_pembelajaran)
                            ? JSON.stringify(r.bentuk_pembelajaran.filter(x => x && x.trim() !== ''))
                            : r.bentuk_pembelajaran,
                        // Clean sub_cpmk_id
                        sub_cpmk_id: r.sub_cpmk_id || null,
                        // Ensure link_daring and nama_lms are saved
                        link_daring: r.link_daring || '',
                        nama_lms: r.nama_lms || '',
                        link_meet_platform: r.link_meet_platform || '',
                        // Add penugasan
                        penugasan: r.penugasan || ''
                    };
                });
                await axios.post(`/rps/dosen/${saveId}/pertemuan/bulk`, { pertemuan: rowsToSend });
            }

            // Clear draft
            localStorage.removeItem(DRAFT_KEY);

            alert('RPS berhasil disimpan ke server');

            if (!currentRPSId) {
                const basePath = window.location.pathname.includes('/kaprodi/') ? '/kaprodi' : '/dosen';
                navigate(`${basePath}/rps/${saveId}/edit`, { replace: true });
            }
        } catch (error) {
            console.error('Save failed:', error);
            const msg = error.response?.data?.message || error.message;
            const detailedErr = error.response?.data?.error || '';
            alert(`Gagal menyimpan RPS: ${msg}\n${detailedErr}`);
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

    // Section tabs (Rearranged)
    // Section tabs (Rearranged)
    const sections = [
        { id: 'identitas', label: 'Identitas & Otoritas', icon: BookOpen },
        { id: 'capaian', label: 'CPL & CPMK', icon: ChevronRight },
        { id: 'subcpmk', label: 'Sub-CPMK', icon: Users },
        { id: 'mingguan', label: 'Rencana Mingguan', icon: Monitor }, // Moved below subcpmk
        { id: 'pustaka', label: 'Pustaka & Media', icon: Users },
        { id: 'metode_penilaian', label: 'Metode Penilaian', icon: CheckCircle }
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

            {/* Floating Footer for Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-50">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        {lastSaved ? (
                            <span className="flex items-center gap-1 text-green-600">
                                <Cloud size={14} /> Tersimpan otomatis di browser {lastSaved.toLocaleTimeString()}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-gray-400">
                                <CloudOff size={14} /> Belum tersimpan di browser
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => navigate(-1)} className="btn btn-ghost text-gray-500 hover:text-gray-700">
                            Batal
                        </button>

                        {/* Simpan Draft */}
                        <button
                            onClick={handleSaveToServer}
                            disabled={loading || !formData.mata_kuliah_id}
                            className="btn bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200 font-medium"
                            title="Simpan sebagai draft, bisa diedit lagi nanti"
                        >
                            <Save size={18} className="mr-2" />
                            {loading ? 'Menyimpan...' : 'Simpan Draft'}
                        </button>

                        {/* Simpan Final / Ajukan */}
                        <button
                            onClick={handleSubmitToApproval}
                            disabled={loading || !formData.mata_kuliah_id}
                            className="btn bg-green-700 hover:bg-green-800 text-white shadow-lg shadow-green-500/30 font-medium"
                            title="Simpan dan ajukan ke Kaprodi untuk direview (Final)"
                        >
                            <CheckCircle size={18} className="mr-2" />
                            {loading ? 'Memproses...' : 'Simpan dan Ajukan (Final)'}
                        </button>
                    </div>
                </div>
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
                        <>
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
                                        <label className="label text-xs font-bold uppercase text-gray-400">Pengembang RPS (Dosen)</label>
                                        <input type="text" value={formData.pengembang_rps} onChange={e => setFormData({ ...formData, pengembang_rps: e.target.value })} className="input w-full" />
                                    </div>
                                    <div>
                                        <label className="label text-xs font-bold uppercase text-gray-400">Koordinator Rumpun MK</label>
                                        <input type="text" value={formData.koordinator_rumpun_mk} onChange={e => setFormData({ ...formData, koordinator_rumpun_mk: e.target.value })} className="input w-full" placeholder="Nama Koordinator Rumpun..." />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="label text-xs font-bold uppercase text-gray-400">Ketua Program Studi</label>
                                        <input type="text" value={formData.ketua_prodi} onChange={e => setFormData({ ...formData, ketua_prodi: e.target.value })} className="input w-full" />
                                    </div>
                                    <div className="hidden md:block"></div>
                                </div>
                                <div>
                                    <label className="label text-xs font-bold uppercase text-gray-400">Deskripsi Mata Kuliah</label>
                                    <textarea value={formData.deskripsi_mk} onChange={e => setFormData({ ...formData, deskripsi_mk: e.target.value })} className="input w-full min-h-[120px]" rows="4" placeholder="Deskripsi singkat mengenai mata kuliah..." />
                                </div>
                            </div>

                            <div className="divider my-8"></div>

                            {/* Integrated Info Tambahan */}
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                            <Users className="text-green-500" size={20} />
                                            Tim Pengajar & Syarat
                                        </h3>
                                        <div>
                                            <label className="label text-xs font-bold uppercase text-gray-400">Dosen Pengampu</label>
                                            <p className="text-xs text-gray-500 mb-2">Simpan nama-nama dosen yang terlibat.</p>
                                            <div className="flex gap-2 mb-3">
                                                <input
                                                    type="text"
                                                    id="new-dosen-input"
                                                    className="input input-sm flex-1"
                                                    placeholder="Nama Dosen..."
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            const val = e.target.value.trim();
                                                            if (val) {
                                                                setDosenPengampuList([...dosen_pengampu_list, val]);
                                                                e.target.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const input = document.getElementById('new-dosen-input');
                                                        const val = input.value.trim();
                                                        if (val) {
                                                            setDosenPengampuList([...dosen_pengampu_list, val]);
                                                            input.value = '';
                                                        }
                                                    }}
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    Tambah
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {dosen_pengampu_list.map((d, i) => (
                                                    <div key={i} className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-gray-200 dark:border-gray-600">
                                                        {d}
                                                        <button onClick={() => setDosenPengampuList(dosen_pengampu_list.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {dosen_pengampu_list.length === 0 && <span className="text-gray-400 italic text-sm">Belum ada dosen yang ditambahkan</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label text-xs font-bold uppercase text-gray-400 italic">Mata Kuliah Syarat</label>
                                            <textarea
                                                value={formData.mk_syarat}
                                                onChange={e => setFormData({ ...formData, mk_syarat: e.target.value })}
                                                className="input w-full min-h-[100px] text-sm"
                                                placeholder="Contoh: Algoritma dan Pemrograman I..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                            <ChevronRight className="text-yellow-500" size={20} />
                                            Ambang Batas Kelulusan
                                        </h3>
                                        <div>
                                            <label className="label text-xs font-bold uppercase text-gray-400 italic">Nilai Kelulusan Mahasiswa</label>
                                            <textarea
                                                value={formData.ambang_batas_mhs}
                                                onChange={e => setFormData({ ...formData, ambang_batas_mhs: e.target.value })}
                                                className="input w-full min-h-[100px] text-sm"
                                                placeholder="Deskripsi ambang batas kelulusan mahasiswa..."
                                            />
                                        </div>
                                        <div>
                                            <label className="label text-xs font-bold uppercase text-gray-400 italic">Kriteria Kelulusan Mata Kuliah</label>
                                            <textarea
                                                value={formData.ambang_batas_mk}
                                                onChange={e => setFormData({ ...formData, ambang_batas_mk: e.target.value })}
                                                className="input w-full min-h-[100px] text-sm"
                                                placeholder="Deskripsi..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Section: CPL & CPMK */}
                    {activeSection === 'capaian' && (
                        <div className="space-y-8">

                            {/* 1. CPL Table */}
                            <div>
                                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">1. Capaian Pembelajaran Lulusan (CPL)</h3>
                                <p className="text-sm text-gray-500 mb-3">Pilih CPL yang dibebankan pada mata kuliah ini.</p>

                                <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Kode CPL</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {selectedCPLs.map(id => {
                                                const cpl = availableCPLs.find(c => c.id === id);
                                                if (!cpl) return null;
                                                return (
                                                    <tr key={id}>
                                                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white align-top">{cpl.kode}</td>
                                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 align-top">{cpl.deskripsi}</td>
                                                        <td className="px-4 py-3 text-center align-top">
                                                            <button
                                                                onClick={() => toggleCPL(id)}
                                                                className="text-red-500 hover:text-red-700"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {selectedCPLs.length === 0 && (
                                                <tr>
                                                    <td colSpan="3" className="px-4 py-8 text-center text-gray-400 italic">Belum ada CPL yang dipilih</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-gray-50 dark:bg-gray-800/50">
                                            <tr>
                                                <td colSpan="3" className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <select
                                                            className="input input-sm flex-1 max-w-md"
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    toggleCPL(parseInt(e.target.value));
                                                                    e.target.value = "";
                                                                }
                                                            }}
                                                        >
                                                            <option value="">+ Tambah CPL...</option>
                                                            {availableCPLs
                                                                .filter(c => !selectedCPLs.includes(c.id))
                                                                .map(c => (
                                                                    <option key={c.id} value={c.id}>{c.kode} - {c.deskripsi.substring(0, 50)}...</option>
                                                                ))}
                                                        </select>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* 2. CPMK Table */}
                            <div>
                                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">2. Capaian Pembelajaran Mata Kuliah (CPMK)</h3>
                                <p className="text-sm text-gray-500 mb-3">Pilih CPMK turunan dari CPL terpilih. Deskripsi dan CPL Induk otomatis terisi.</p>

                                <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Kode CPMK</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">CPL Yang Didukung</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {selectedCPMKs.map(id => {
                                                // Find CPMK across all CPLs
                                                const parentCPL = availableCPLs.find(c => c.cpmks?.some(mk => mk.id === id));
                                                const cpmk = parentCPL?.cpmks?.find(mk => mk.id === id);

                                                if (!cpmk) return null;

                                                return (
                                                    <tr key={id}>
                                                        <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 align-top">
                                                            {cpmk.kode}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 align-top">
                                                            {cpmk.deskripsi}
                                                        </td>
                                                        <td className="px-4 py-3 align-top text-xs">
                                                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                                                                {parentCPL?.kode}
                                                            </span>
                                                            <div className="text-[10px] text-gray-400 mt-1 leading-tight hidden xl:block">
                                                                {parentCPL?.deskripsi}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center align-top">
                                                            <button
                                                                onClick={() => toggleCPMK(id)}
                                                                className="text-red-500 hover:text-red-700"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {selectedCPMKs.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-4 py-8 text-center text-gray-400 italic">Belum ada CPMK yang dipilih</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-gray-50 dark:bg-gray-800/50">
                                            <tr>
                                                <td colSpan="4" className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <select
                                                            className="input input-sm flex-1 max-w-md"
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    toggleCPMK(parseInt(e.target.value));
                                                                    e.target.value = "";
                                                                }
                                                            }}
                                                            disabled={selectedCPLs.length === 0}
                                                        >
                                                            <option value="">{selectedCPLs.length === 0 ? 'Pilih CPL Terlebih Dahulu' : '+ Tambah CPMK...'}</option>
                                                            {availableCPLs
                                                                .filter(c => selectedCPLs.includes(c.id)) // Only CPMKs from selected CPLs
                                                                .flatMap(c => c.cpmks || [])
                                                                .filter(mk => !selectedCPMKs.includes(mk.id))
                                                                .map(mk => (
                                                                    <option key={mk.id} value={mk.id}>{mk.kode} - {mk.deskripsi.substring(0, 50)}...</option>
                                                                ))
                                                            }
                                                        </select>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section: Sub-CPMK Management (Phase 24) */}
                    {activeSection === 'subcpmk' && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Users className="text-blue-600" /> Manajemen Sub-CPMK
                                </h2>
                                <div className="text-sm text-gray-500">
                                    Urutkan Sub-CPMK di sini untuk menyusun alur pembelajaran mingguan.
                                </div>
                            </div>

                            {/* Sub-CPMK List with Reordering */}
                            <div className="space-y-3 mb-8">
                                {definedSubCPMKs.map((sub, idx) => (
                                    <div key={sub.id || idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600 group hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
                                        <div className="flex flex-col gap-1 mt-1">
                                            <button
                                                onClick={() => moveSubCPMK(idx, 'up')}
                                                disabled={idx === 0}
                                                className="btn btn-xs btn-ghost btn-square disabled:opacity-20 hover:bg-gray-200 text-gray-600"
                                                title="Geser Naik"
                                            >
                                                <ChevronDown className="rotate-180" size={16} />
                                            </button>
                                            <button
                                                onClick={() => moveSubCPMK(idx, 'down')}
                                                disabled={idx === definedSubCPMKs.length - 1}
                                                className="btn btn-xs btn-ghost btn-square disabled:opacity-20 hover:bg-gray-200 text-gray-600"
                                                title="Geser Turun"
                                            >
                                                <ChevronDown size={16} />
                                            </button>
                                        </div>
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="col-span-2">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Kode</label>
                                                <input
                                                    type="text"
                                                    value={sub.kode}
                                                    onChange={(e) => updateSubCPMK(sub.id, 'kode', e.target.value)}
                                                    className="input input-sm input-bordered w-full font-mono font-bold text-purple-700 dark:text-purple-300 dark:bg-gray-800"
                                                />
                                            </div>
                                            <div className="col-span-8">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Deskripsi & Indikator</label>
                                                <textarea
                                                    value={sub.deskripsi}
                                                    onChange={(e) => updateSubCPMK(sub.id, 'deskripsi', e.target.value)}
                                                    className="textarea textarea-sm textarea-bordered w-full leading-tight min-h-[3rem] dark:bg-gray-800 dark:text-gray-200"
                                                    rows={2}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Durasi (Minggu)</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="16"
                                                        value={sub.estimasi_minggu || 1}
                                                        onChange={(e) => updateSubCPMK(sub.id, 'estimasi_minggu', e.target.value)}
                                                        className="input input-sm input-bordered w-full text-center font-bold bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200"
                                                    />
                                                    <span className="text-xs text-gray-400">Ptm</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteSubCPMK(sub.id)} className="btn btn-ghost btn-sm text-red-500 opacity-50 hover:opacity-100 mt-4">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {definedSubCPMKs.length === 0 && (
                                    <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-lg bg-gray-50/50">
                                        <p className="mb-2">Belum ada Sub-CPMK.</p>
                                        <p className="text-xs">Tambahkan menggunakan form di bawah ini.</p>
                                    </div>
                                )}
                            </div>

                            {/* Add New Sub-CPMK Form */}
                            <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 shadow-sm">
                                <h3 className="font-bold text-sm text-blue-800 mb-4 flex items-center gap-2">
                                    <Plus size={16} /> Tambah Sub-CPMK Baru
                                </h3>
                                <div className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="w-full md:w-1/3">
                                        <label className="label-text text-xs font-bold text-gray-500 uppercase mb-1 block">Pilih CPMK Induk</label>
                                        <select
                                            className="select select-sm select-bordered w-full"
                                            value={newSubCpmk.cpmk_id}
                                            onChange={e => setNewSubCpmk({ ...newSubCpmk, cpmk_id: e.target.value })}
                                        >
                                            <option value="">- Pilih CPMK -</option>
                                            {selectedCPMKs.map(id => {
                                                const parentCPL = availableCPLs.find(c => c.cpmks?.some(mk => mk.id === id));
                                                const mk = parentCPL?.cpmks?.find(m => m.id === id);
                                                if (mk) return <option key={id} value={id}>{mk.kode} - {mk.deskripsi.substring(0, 40)}...</option>;

                                                // Fallback
                                                const rMK = resolvedCPMKs.find(m => String(m.id) === String(id));
                                                if (rMK) return <option key={id} value={id}>{rMK.kode_cpmk || rMK.kode}</option>;
                                                return <option key={id} value={id}>CPMK ID: {id}</option>;
                                            })}
                                        </select>
                                    </div>
                                    <div className="w-full md:w-1/6">
                                        <label className="label-text text-xs font-bold text-gray-500 uppercase mb-1 block">Kode Sub</label>
                                        <input
                                            type="text"
                                            className="input input-sm input-bordered w-full"
                                            placeholder="Ex: 1.1"
                                            value={newSubCpmk.kode}
                                            onChange={e => setNewSubCpmk({ ...newSubCpmk, kode: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="label-text text-xs font-bold text-gray-500 uppercase mb-1 block">Deskripsi</label>
                                        <input
                                            type="text"
                                            className="input input-sm input-bordered w-full"
                                            placeholder="Mahasiswa mampu menjelaskan..."
                                            value={newSubCpmk.deskripsi}
                                            onChange={e => setNewSubCpmk({ ...newSubCpmk, deskripsi: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddSubCPMKLocal}
                                        disabled={!newSubCpmk.cpmk_id || !newSubCpmk.kode}
                                        className="btn btn-sm btn-primary px-6"
                                    >
                                        Tambah
                                    </button>
                                </div>
                            </div>



                            {/* Generator Button */}
                            <div className="flex flex-col md:flex-row justify-between items-center bg-yellow-50 p-6 rounded-lg border border-yellow-200 mt-8 mb-8">
                                <div className="mb-4 md:mb-0 pr-4">
                                    <h4 className="font-bold text-yellow-800 text-lg flex items-center gap-2">
                                        <Monitor size={20} /> Generator Rencana Mingguan
                                    </h4>
                                    <p className="text-sm text-yellow-700 mt-1 max-w-xl">
                                        Fitur ini akan <strong>secara otomatis membuat (atau menimpa)</strong> seluruh baris di tab "Rencana Mingguan" berdasarkan urutan Sub-CPMK di atas dan durasi pertemuannya.
                                    </p>
                                </div>
                                <div>
                                    <button
                                        onClick={generateWeeklyPlan}
                                        className="btn btn-warning shadow-md border-yellow-400 text-yellow-900"
                                    >
                                        Generate Ulang (Reset) &rarr;
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Sinkronisasi akan menyesuaikan mingguan dengan Sub_CPMK tanpa menghapus konten yang sudah diisi (materi/metode/dll). Lanjutkan?')) {
                                                syncWeeklyPlan();
                                            }
                                        }}
                                        className="btn btn-primary shadow-md ml-2"
                                        title="Sesuaikan mingguan dengan Sub-CPMK tanpa hapus isi"
                                    >
                                        <RefreshCw size={18} className="mr-2" /> Sync Smart
                                    </button>
                                </div>
                            </div>

                            <div className="divider my-8"></div>

                            {/* Matrix & Bobot - Re-inserted */}
                            <div className="space-y-6">
                                <div className="alert alert-info shadow-sm bg-blue-50 border-blue-200 text-blue-800">
                                    <Monitor size={20} />
                                    <div>
                                        <h3 className="font-bold">Matriks Penilaian (Sub-CPMK vs Evaluasi)</h3>
                                        <p className="text-sm">Ringkasan bobot (%) per Sub-CPMK berdasarkan rencana mingguan. Pastikan total 100%.</p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                                    <table className="table table-sm w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th>Kode Sub-CPMK</th>
                                                <th>Deskripsi</th>
                                                <th className="text-center">Minggu</th>
                                                <th className="text-center">Bobot</th>
                                                <th className="text-center">Evaluasi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {definedSubCPMKs.map(sub => {
                                                const relatedRows = rows.filter(r => String(r.sub_cpmk_id) === String(sub.id));
                                                const totalWeight = relatedRows.reduce((sum, r) => sum + (parseFloat(r.bobot_penilaian) || 0), 0);
                                                const weeks = relatedRows.map(r => r.minggu_ke + (r.sampai_minggu_ke ? `-${r.sampai_minggu_ke}` : '')).join(', ');
                                                const forms = [...new Set(relatedRows.map(r => r.bentuk_evaluasi).filter(Boolean))].join(', ');

                                                return (
                                                    <tr key={sub.id}>
                                                        <td className="font-mono font-bold">{sub.kode}</td>
                                                        <td className="text-xs max-w-xs truncate" title={sub.deskripsi}>{sub.deskripsi}</td>
                                                        <td className="text-center">{weeks || '-'}</td>
                                                        <td className="text-center font-bold">{totalWeight}%</td>
                                                        <td className="text-center text-xs">{forms || '-'}</td>
                                                    </tr>
                                                );
                                            })}
                                            {/* UTS & UAS */}
                                            {rows.filter(r => r.is_uts).map(r => (
                                                <tr key={r.id} className="bg-yellow-50/50">
                                                    <td colSpan={2} className="font-bold text-center">UTS</td>
                                                    <td className="text-center">{r.minggu_ke}</td>
                                                    <td className="text-center font-bold">{r.bobot_penilaian || 0}%</td>
                                                    <td className="text-center">Ujian Tulis/Praktik</td>
                                                </tr>
                                            ))}
                                            {rows.filter(r => r.is_uas).map(r => (
                                                <tr key={r.id} className="bg-yellow-50/50">
                                                    <td colSpan={2} className="font-bold text-center">UAS</td>
                                                    <td className="text-center">{r.minggu_ke}</td>
                                                    <td className="text-center font-bold">{r.bobot_penilaian || 0}%</td>
                                                    <td className="text-center">Ujian Tulis/Praktik</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-100 font-bold">
                                            <tr>
                                                <td colSpan={3} className="text-right">Total Bobot:</td>
                                                <td className={`text-center ${totalBobot === 100 ? 'text-green-600' : 'text-red-500'}`}>{totalBobot}%</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Section: Metode Penilaian */}
                    {activeSection === 'metode_penilaian' && (
                        <div className="space-y-6">
                            <div className="alert alert-info shadow-sm bg-purple-50 border-purple-200 text-purple-800">
                                <CheckCircle size={20} />
                                <div>
                                    <h3 className="font-bold">Metode Penilaian & Kriteria</h3>
                                    <p className="text-sm">Tentukan metode penilaian yang digunakan (Rubrik, Portofolio, Tes, dsb) beserta kriteria dan detailnya.</p>
                                </div>
                            </div>

                            {/* List of Defined Methods */}
                            <div className="space-y-4">
                                {metodePenilaian.map((metode, idx) => (
                                    <div key={idx} className="border rounded-lg bg-white dark:bg-gray-800 p-4 relative">
                                        <button
                                            onClick={() => {
                                                const newMetodes = [...metodePenilaian];
                                                newMetodes.splice(idx, 1);
                                                setMetodePenilaian(newMetodes);
                                            }}
                                            className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                                            title="Hapus Metode"
                                        >
                                            <X size={16} />
                                        </button>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-8">
                                            <div>
                                                <label className="label text-xs font-bold uppercase text-gray-500">Jenis Penilaian</label>
                                                <select
                                                    value={metode.type}
                                                    onChange={(e) => {
                                                        const newMetodes = [...metodePenilaian];
                                                        newMetodes[idx].type = e.target.value;
                                                        setMetodePenilaian(newMetodes);
                                                    }}
                                                    className="select select-sm w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                                                >
                                                    {assessmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="label text-xs font-bold uppercase text-gray-500">Nama / Judul</label>
                                                <input
                                                    type="text"
                                                    value={metode.name || ''}
                                                    onChange={(e) => {
                                                        const newMetodes = [...metodePenilaian];
                                                        newMetodes[idx].name = e.target.value;
                                                        setMetodePenilaian(newMetodes);
                                                    }}
                                                    className="input input-sm w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                                                    placeholder={`Contoh: ${metode.type} 1`}
                                                />
                                            </div>
                                        </div>

                                        {metode.type === 'Rubrik' ? (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <label className="label text-xs font-bold uppercase text-gray-500">Tabel Rubrik</label>
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="btn btn-xs btn-outline"
                                                            onClick={() => {
                                                                const newMetodes = [...metodePenilaian];
                                                                // Add scale column
                                                                newMetodes[idx].scales = [...(newMetodes[idx].scales || []), { label: 'Baru', value: 0 }];
                                                                setMetodePenilaian(newMetodes);
                                                            }}
                                                        >
                                                            + Skala
                                                        </button>
                                                        <button
                                                            className="btn btn-xs btn-outline"
                                                            onClick={() => {
                                                                const newMetodes = [...metodePenilaian];
                                                                // Add criteria row
                                                                newMetodes[idx].criteria = [...(newMetodes[idx].criteria || []), { label: 'Kriteria Baru', descriptions: [] }];
                                                                setMetodePenilaian(newMetodes);
                                                            }}
                                                        >
                                                            + Kriteria
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="overflow-x-auto border rounded">
                                                    <table className="table table-xs w-full">
                                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                                            <tr>
                                                                <th className="w-1/4 text-gray-700 dark:text-gray-300">Kriteria \ Skala</th>
                                                                {(metode.scales || []).map((scale, sIdx) => (
                                                                    <th key={sIdx} className="text-center min-w-[100px]">
                                                                        <input
                                                                            type="text"
                                                                            value={scale.label}
                                                                            onChange={(e) => {
                                                                                const newMetodes = [...metodePenilaian];
                                                                                newMetodes[idx].scales[sIdx].label = e.target.value;
                                                                                setMetodePenilaian(newMetodes);
                                                                            }}
                                                                            className="w-full text-center bg-transparent border-b border-dashed border-gray-300 focus:outline-none mb-1 font-bold"
                                                                            placeholder="Label"
                                                                        />
                                                                        <input
                                                                            type="number"
                                                                            value={scale.value}
                                                                            onChange={(e) => {
                                                                                const newMetodes = [...metodePenilaian];
                                                                                newMetodes[idx].scales[sIdx].value = e.target.value;
                                                                                setMetodePenilaian(newMetodes);
                                                                            }}
                                                                            className="w-full text-center bg-transparent border-none text-xs text-gray-500"
                                                                            placeholder="Nilai"
                                                                        />
                                                                        <button
                                                                            onClick={() => {
                                                                                const newMetodes = [...metodePenilaian];
                                                                                newMetodes[idx].scales.splice(sIdx, 1);
                                                                                // Also remove descriptions at this index
                                                                                newMetodes[idx].criteria.forEach(c => {
                                                                                    if (c.descriptions && c.descriptions.length > sIdx) {
                                                                                        c.descriptions.splice(sIdx, 1);
                                                                                    }
                                                                                });
                                                                                setMetodePenilaian(newMetodes);
                                                                            }}
                                                                            className="text-[10px] text-red-300 hover:text-red-500 block mx-auto mt-1"
                                                                        >Hapus</button>
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(metode.criteria || []).map((crit, cIdx) => (
                                                                <tr key={cIdx}>
                                                                    <td className="align-top relative group">
                                                                        <textarea
                                                                            value={crit.label}
                                                                            onChange={(e) => {
                                                                                const newMetodes = [...metodePenilaian];
                                                                                newMetodes[idx].criteria[cIdx].label = e.target.value;
                                                                                setMetodePenilaian(newMetodes);
                                                                            }}
                                                                            className="w-full bg-transparent border border-transparent hover:border-gray-200 rounded p-1 text-sm h-full font-medium"
                                                                            placeholder="Nama Kriteria..."
                                                                            rows={3}
                                                                        />
                                                                        <button
                                                                            onClick={() => {
                                                                                const newMetodes = [...metodePenilaian];
                                                                                newMetodes[idx].criteria.splice(cIdx, 1);
                                                                                setMetodePenilaian(newMetodes);
                                                                            }}
                                                                            className="absolute top-1 right-1 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        ><Trash2 size={12} /></button>
                                                                    </td>
                                                                    {(metode.scales || []).map((_, sIdx) => (
                                                                        <td key={sIdx} className="align-top p-1">
                                                                            <textarea
                                                                                value={crit.descriptions?.[sIdx] || ''}
                                                                                onChange={(e) => {
                                                                                    const newMetodes = [...metodePenilaian];
                                                                                    if (!newMetodes[idx].criteria[cIdx].descriptions) {
                                                                                        newMetodes[idx].criteria[cIdx].descriptions = [];
                                                                                    }
                                                                                    newMetodes[idx].criteria[cIdx].descriptions[sIdx] = e.target.value;
                                                                                    setMetodePenilaian(newMetodes);
                                                                                }}
                                                                                className="w-full h-full min-h-[60px] text-xs p-1 border border-gray-100 rounded focus:border-blue-300 focus:ring-0 resize-none"
                                                                                placeholder="Deskripsi..."
                                                                            />
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="text-xs text-gray-400 italic mt-1">
                                                    * Klik tombol "+ Skala" untuk menambah kolom penilaian (Sangat Baik, Baik, dsb).
                                                    <br />* Klik tombol "+ Kriteria" untuk menambah baris aspek yang dinilai.
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="label text-xs font-bold uppercase text-gray-500">Deskripsi / Detail Penilaian</label>
                                                <textarea
                                                    value={metode.description || ''}
                                                    onChange={(e) => {
                                                        const newMetodes = [...metodePenilaian];
                                                        newMetodes[idx].description = e.target.value;
                                                        setMetodePenilaian(newMetodes);
                                                    }}
                                                    className="textarea textarea-bordered h-32 w-full"
                                                    placeholder="Jelaskan mekanisme penilaian secara detail..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {metodePenilaian.length === 0 && (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        <p className="text-gray-400 mb-4">Belum ada metode penilaian yang didefinisikan.</p>
                                        <button
                                            onClick={() => setMetodePenilaian([...metodePenilaian, { type: 'Rubrik', name: '', description: '', scales: [{ label: 'Sangat Baik', value: 85 }, { label: 'Baik', value: 70 }, { label: 'Cukup', value: 55 }, { label: 'Kurang', value: 40 }], criteria: [{ label: 'Kriteria 1', descriptions: [] }] }])}
                                            className="btn btn-primary btn-sm"
                                        >
                                            <Plus size={16} className="mr-2" /> Tambah Metode Penilaian
                                        </button>
                                    </div>
                                )}
                            </div>

                            {metodePenilaian.length > 0 && (
                                <button
                                    onClick={() => setMetodePenilaian([...metodePenilaian, { type: 'Rubrik', name: '', description: '', scales: [], criteria: [] }])}
                                    className="btn btn-outline btn-sm w-full border-dashed"
                                >
                                    <Plus size={16} className="mr-2" /> Tambah Metode Lain
                                </button>
                            )}
                        </div>
                    )}

                    {/* Section: Rencana Mingguan */}
                    {activeSection === 'mingguan' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center flex-wrap gap-3">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Rencana Pembelajaran Mingguan</h3>
                                    <p className="text-sm text-gray-500">
                                        Rencanakan pertemuan mingguan atau kelompokkan pertemuan (contoh Minggu: "1-2").
                                        <br />
                                        Total Bobot: <span className={totalBobot === 100 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{totalBobot}%</span>
                                        {totalBobot !== 100 && <span className="text-red-500"> (Harus 100%)</span>}
                                    </p>
                                </div>
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="btn btn-primary btn-sm flex items-center gap-1"
                                    >
                                        <Plus size={16} /> Tambah <ChevronDown size={14} />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute right-0 z-[10] mt-1 w-40 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200 dark:border-gray-700">
                                            <div className="py-1">
                                                <button
                                                    onClick={() => { addWeek(); setIsDropdownOpen(false); }}
                                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-200 dark:hover:bg-blue-900 hover:text-blue-900"
                                                >
                                                    Pertemuan
                                                </button>
                                                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                                                <button
                                                    onClick={() => { handleAddUTS(); setIsDropdownOpen(false); }}
                                                    className="block w-full text-left px-4 py-2 text-sm text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900 font-medium"
                                                >
                                                    UTS
                                                </button>
                                                <button
                                                    onClick={() => { handleAddUAS(); setIsDropdownOpen(false); }}
                                                    className="block w-full text-left px-4 py-2 text-sm text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900 font-medium"
                                                >
                                                    UAS
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {rows.map((row, index) => {
                                    // Handle case where id might be string vs number
                                    const selectedSub = definedSubCPMKs.find(s => String(s.id) === String(row.sub_cpmk_id));

                                    // Parent Resolution
                                    let parentCPMKCode = '-';
                                    if (selectedSub) {
                                        const pCPL = availableCPLs.find(c => c.cpmks?.some(mk => mk.id === parseInt(selectedSub.cpmk_id)));
                                        const pCPMK = pCPL?.cpmks?.find(mk => mk.id === parseInt(selectedSub.cpmk_id));
                                        if (pCPMK) {
                                            parentCPMKCode = pCPMK.kode;
                                        } else {
                                            // Fallback to resolved data
                                            const rCPMK = resolvedCPMKs.find(m => String(m.id) === String(selectedSub.cpmk_id));
                                            if (rCPMK) parentCPMKCode = rCPMK.kode_cpmk || rCPMK.kode || '-';
                                        }
                                    }

                                    // Special Rendering for UTS/UAS - Merged Style
                                    if (row.is_uts || row.is_uas) {
                                        return (
                                            <div key={row.id} className="border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg p-4 relative flex items-center shadow-md">
                                                <button onClick={() => removeWeek(index)} className="absolute top-2 right-2 btn btn-ghost btn-xs text-red-500"><Trash2 size={16} /></button>

                                                <div className="w-16 mr-4 text-center">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Minggu</label>
                                                    <input
                                                        type="text"
                                                        value={row.minggu_ke}
                                                        onChange={e => updateRow(index, 'minggu_ke', e.target.value)}
                                                        className="input input-sm input-bordered w-full text-center font-bold bg-white dark:bg-gray-800 dark:text-yellow-200 dark:border-yellow-700"
                                                    />
                                                </div>

                                                <div className="flex-1 text-center font-bold text-xl text-yellow-800 uppercase tracking-wider">
                                                    {row.is_uts ? 'Evaluasi Tengah Semester (UTS)' : 'Evaluasi Akhir Semester (UAS)'}
                                                </div>

                                                <div className="w-20 ml-4 text-center">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Bobot (%)</label>
                                                    <input
                                                        type="number"
                                                        value={row.bobot_penilaian}
                                                        onChange={e => updateRow(index, 'bobot_penilaian', e.target.value)}
                                                        className="input input-sm input-bordered w-full text-center font-bold bg-white dark:bg-gray-800 dark:text-yellow-200 dark:border-yellow-700"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Regular Meeting Card
                                    return (
                                        <div key={row.id || index} className={`border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm p-6 relative hover:border-blue-300 dark:hover:border-blue-500 transition-colors ${row.is_uts ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700' :
                                            row.is_uas ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700' : ''
                                            }`}>
                                            <button onClick={() => removeWeek(index)} className="absolute top-2 right-2 btn btn-ghost btn-xs text-red-500 opacity-50 hover:opacity-100">
                                                <Trash2 size={16} />
                                            </button>

                                            {/* Header Row: Week, CPMK, Sub-CPMK, Bobot */}
                                            <div className="flex flex-wrap gap-4 items-end mb-4 pr-8">
                                                <div className="w-16 text-center">
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Minggu</label>
                                                    <input
                                                        type="text"
                                                        value={row.sampai_minggu_ke ? `${row.minggu_ke}-${row.sampai_minggu_ke}` : row.minggu_ke}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            // Check for range like "1-2"
                                                            const parts = val.split('-').map(p => p.trim());
                                                            if (parts.length === 2) {
                                                                const start = parseInt(parts[0]) || row.minggu_ke;
                                                                const end = parseInt(parts[1]) || null;

                                                                const newRows = [...rows];
                                                                newRows[index] = {
                                                                    ...newRows[index],
                                                                    minggu_ke: start,
                                                                    sampai_minggu_ke: end
                                                                };
                                                                setRows(newRows);
                                                            } else {
                                                                // Single value
                                                                updateRow(index, 'minggu_ke', val);
                                                                // Clear range if just one number
                                                                const newRows = [...rows];
                                                                if (newRows[index].sampai_minggu_ke) {
                                                                    newRows[index].sampai_minggu_ke = null;
                                                                    setRows(newRows);
                                                                }
                                                            }
                                                        }}
                                                        className="input input-sm input-bordered w-full text-center font-bold dark:bg-gray-700 dark:text-white"
                                                    />
                                                </div>

                                                <div className="w-24 text-center hidden md:block">
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">CPMK</label>
                                                    <div className="px-2 py-1.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono border border-gray-200 dark:border-gray-600">
                                                        {parentCPMKCode}
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-[200px]">
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Sub-CPMK (Kemampuan Akhir)</label>
                                                    <select
                                                        value={row.sub_cpmk_id || ''}
                                                        onChange={e => {
                                                            const subId = e.target.value;
                                                            const sub = definedSubCPMKs.find(s => String(s.id) === String(subId));
                                                            const newRow = { ...row, sub_cpmk_id: subId };
                                                            if (sub) {
                                                                newRow.cpmk_id = sub.cpmk_id;
                                                            } else {
                                                                newRow.cpmk_id = '';
                                                            }
                                                            const newRows = [...rows];
                                                            newRows[index] = newRow;
                                                            setRows(newRows);
                                                        }}
                                                        className="select select-sm select-bordered w-full text-xs font-medium mb-1 dark:bg-gray-700 dark:text-white"
                                                    >
                                                        <option value="">- Pilih Sub-CPMK -</option>
                                                        {definedSubCPMKs.map(sub => (
                                                            <option key={sub.id} value={sub.id}>{sub.kode}</option>
                                                        ))}
                                                    </select>

                                                    {/* Description Display */}
                                                    {row.sub_cpmk_id && (() => {
                                                        const selectedSub = definedSubCPMKs.find(s => String(s.id) === String(row.sub_cpmk_id));
                                                        return selectedSub ? (
                                                            <div className="text-[10px] text-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-gray-400 p-1.5 rounded border border-gray-100 dark:border-gray-600 italic leading-tight">
                                                                {selectedSub.deskripsi}
                                                            </div>
                                                        ) : null;
                                                    })()}
                                                </div>

                                                <div className="w-20 text-center">
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Bobot (%)</label>
                                                    <input
                                                        type="number"
                                                        value={row.bobot_penilaian}
                                                        onChange={e => updateRow(index, 'bobot_penilaian', e.target.value)}
                                                        className={`input input-sm input-bordered w-full text-center font-bold dark:bg-gray-700 dark:text-white ${!row.bobot_penilaian ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : ''}`}
                                                    />
                                                </div>
                                            </div>

                                            {/* Content Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Indikator */}
                                                <div className="form-control">
                                                    <label className="label py-1">
                                                        <span className="label-text text-xs font-bold text-gray-500 uppercase">Indikator Penilaian</span>
                                                    </label>
                                                    <div className="space-y-2">
                                                        {(Array.isArray(row.indikator) ? row.indikator : (row.indikator ? [row.indikator] : [''])).map((ind, iInd) => (
                                                            <div key={iInd} className="flex gap-2">
                                                                <span className="py-2 text-sm text-gray-400 font-mono select-none">{iInd + 1}.</span>
                                                                <input
                                                                    type="text"
                                                                    value={ind}
                                                                    onChange={(e) => {
                                                                        const current = Array.isArray(row.indikator) ? [...row.indikator] : (row.indikator ? [row.indikator] : ['']);
                                                                        current[iInd] = e.target.value;
                                                                        updateRow(index, 'indikator', current);
                                                                    }}
                                                                    className="input input-sm input-bordered w-full dark:bg-gray-700 dark:text-white"
                                                                    placeholder={`Indikator ${iInd + 1}...`}
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        const current = Array.isArray(row.indikator) ? [...row.indikator] : (row.indikator ? [row.indikator] : ['']);
                                                                        current.splice(iInd, 1);
                                                                        updateRow(index, 'indikator', current);
                                                                    }}
                                                                    disabled={iInd === 0 && (Array.isArray(row.indikator) ? row.indikator.length === 1 : true)}
                                                                    className="btn btn-sm btn-ghost text-red-400 px-2"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => {
                                                                const current = Array.isArray(row.indikator) ? [...row.indikator] : (row.indikator ? [row.indikator] : ['']);
                                                                updateRow(index, 'indikator', [...current, '']);
                                                            }}
                                                            className="btn btn-xs btn-outline border-dashed w-full text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-400"
                                                        >
                                                            <Plus size={12} className="mr-1" /> Tambah Indikator
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Kriteria & Teknik */}
                                                {/* Kriteria & Teknik Separate Boxes */}
                                                <div className="form-control space-y-3">
                                                    {/* Kriteria Box */}
                                                    <div>
                                                        <label className="label py-1">
                                                            <span className="label-text text-xs font-bold text-gray-500 uppercase">Kriteria Penilaian</span>
                                                        </label>
                                                        <div className="border border-gray-300 dark:border-gray-600 rounded-md focus-within:ring-1 focus-within:ring-blue-500 bg-white dark:bg-gray-900">
                                                            <SimpleToolbar onInsert={(pre, suf) => handleToolbarInsert(index, 'kriteria_penilaian', pre, suf)} />
                                                            <textarea
                                                                id={`textarea-${index}-kriteria_penilaian`}
                                                                value={row.kriteria_penilaian}
                                                                onChange={e => updateRow(index, 'kriteria_penilaian', e.target.value)}
                                                                className="textarea w-full h-24 text-sm leading-relaxed focus:outline-none border-none bg-transparent font-mono p-3 dark:text-gray-200"
                                                                placeholder="Deskripsikan kriteria..."
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Teknik Box */}
                                                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                                        <label className="label py-1 pt-0">
                                                            <span className="label-text text-xs font-bold text-gray-500 uppercase">Teknik Penilaian</span>
                                                        </label>
                                                        <div className="flex flex-wrap gap-1">
                                                            {teknikPenilaian.slice(0, 4).map(t => (
                                                                <label key={t} className={`text-[10px] px-2 py-1 rounded-full cursor-pointer border transition-all select-none ${(row.teknik_penilaian || []).includes(t)
                                                                    ? 'bg-blue-100 border-blue-300 text-blue-700 font-semibold dark:bg-blue-900/50 dark:border-blue-700 dark:text-blue-300'
                                                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-600'
                                                                    }`}>
                                                                    <input type="checkbox" checked={(row.teknik_penilaian || []).includes(t)} onChange={() => toggleMultiSelect(index, 'teknik_penilaian', t, 3)} className="hidden" />
                                                                    {t}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Materi */}
                                                <div className="form-control">
                                                    <label className="label py-1">
                                                        <span className="label-text text-xs font-bold text-gray-500 uppercase">Materi Pembelajaran</span>
                                                    </label>
                                                    <div className="border border-gray-300 dark:border-gray-600 rounded-md focus-within:ring-1 focus-within:ring-blue-500 bg-white dark:bg-gray-900">
                                                        <SimpleToolbar onInsert={(pre, suf) => handleToolbarInsert(index, 'materi', pre, suf)} />
                                                        <textarea
                                                            id={`textarea-${index}-materi`}
                                                            value={row.materi}
                                                            onChange={e => updateRow(index, 'materi', e.target.value)}
                                                            className="textarea w-full h-28 text-sm leading-relaxed focus:outline-none border-none bg-transparent font-mono p-3 dark:text-gray-200"
                                                            placeholder="Isi materi..."
                                                        />
                                                    </div>
                                                </div>

                                                {/* Metode & Bentuk */}
                                                {/* Metode & Bentuk Restructured */}
                                                <div className="form-control border rounded-lg p-3 space-y-4 bg-gray-50/50 dark:bg-gray-800/30 dark:border-gray-700">
                                                    <label className="label py-0 pb-2 border-b border-gray-200 dark:border-gray-700 mb-2">
                                                        <span className="label-text text-sm font-bold text-gray-800 uppercase">Bentuk Pembelajaran</span>
                                                    </label>

                                                    {/* A. Luring */}
                                                    <div>
                                                        <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                                                            <Users size={12} /> A. Tatap Muka / Luring
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-100 dark:border-gray-700">
                                                            {metodePembelajaran.map(m => (
                                                                <label key={m} className={`text-[11px] px-3 py-1.5 rounded-full cursor-pointer border transition-all select-none ${(row.metode_pembelajaran || []).includes(m)
                                                                    ? `${getMethodColor(m)} font-bold shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10`
                                                                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                                                                    }`}>
                                                                    <input type="checkbox" checked={(row.metode_pembelajaran || []).includes(m)} onChange={() => toggleMultiSelect(index, 'metode_pembelajaran', m, 10)} className="hidden" />
                                                                    {m}
                                                                    {(row.metode_pembelajaran || []).includes(m) && <CheckCircle size={10} className="inline ml-1" />}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* B. Daring */}
                                                    <div>
                                                        <div className="text-xs font-bold text-blue-600 uppercase mb-2 flex items-center gap-1">
                                                            <Cloud size={12} /> B. Daring / Online
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded border border-blue-100 dark:border-blue-800">
                                                            <div className="form-control">
                                                                <label className="label-text text-[10px] uppercase font-bold text-gray-500 mb-1">Nama LMS <span className="text-red-500">*</span></label>
                                                                <input
                                                                    type="text"
                                                                    value={row.nama_lms || ''}
                                                                    onChange={e => updateRow(index, 'nama_lms', e.target.value)}
                                                                    className="input input-sm input-bordered w-full bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                                                    placeholder="Ex: sibeda.mahardika.ac.id"
                                                                />
                                                            </div>
                                                            <div className="form-control">
                                                                <label className="label-text text-[10px] uppercase font-bold text-gray-500 mb-1">Platform Meeting</label>
                                                                <select
                                                                    value={row.link_meet_platform || ''}
                                                                    onChange={e => updateRow(index, 'link_meet_platform', e.target.value)}
                                                                    className="select select-sm select-bordered w-full bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                                                >
                                                                    <option value="">Pilih Platform...</option>
                                                                    <option value="Google Meet">Google Meet</option>
                                                                    <option value="Zoom">Zoom</option>
                                                                    <option value="Manual Input">Manual Input</option>
                                                                </select>
                                                            </div>
                                                            <div className="form-control">
                                                                <label className="label-text text-[10px] uppercase font-bold text-gray-500 mb-1">Link Meeting URL</label>
                                                                <input
                                                                    type="text"
                                                                    value={row.link_daring || ''}
                                                                    onChange={e => updateRow(index, 'link_daring', e.target.value)}
                                                                    className="input input-sm input-bordered w-full bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                                                    placeholder="Ex: https://zoom.us/..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* C. Penugasan */}
                                                    <div>
                                                        <div className="text-xs font-bold text-green-600 uppercase mb-2 flex items-center gap-1">
                                                            <CheckCircle size={12} /> C. Penugasan
                                                        </div>
                                                        <div className="p-3 bg-green-50/50 dark:bg-green-900/10 rounded border border-green-100 dark:border-green-800">
                                                            <div className="form-control">
                                                                <label className="label-text text-[10px] uppercase font-bold text-gray-500 mb-1">Deskripsi Tugas</label>
                                                                <textarea
                                                                    value={row.penugasan || ''}
                                                                    onChange={e => updateRow(index, 'penugasan', e.target.value)}
                                                                    className="textarea textarea-sm textarea-bordered w-full bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white min-h-[60px] leading-tight"
                                                                    placeholder="Deskripsi tugas, latihan, atau kegiatan mandiri..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-800 rounded-sm"></span> L = Luring (Tatap Muka)</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-600 rounded-sm"></span> D = Daring (Online)</span>
                            </div>
                        </div>
                    )}



                    {/* Section: Pustaka & Media */}
                    {activeSection === 'pustaka' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                        <BookOpen className="text-blue-500" size={20} />
                                        Pustaka (Referensi)
                                    </h3>
                                    <div>
                                        <label className="label text-xs font-bold uppercase text-gray-400 italic">Pustaka Utama</label>
                                        <textarea
                                            value={formData.pustaka_utama}
                                            onChange={e => setFormData({ ...formData, pustaka_utama: e.target.value })}
                                            className="input w-full min-h-[150px] py-3 text-sm"
                                            placeholder="Daftar pustaka utama..."
                                        />
                                    </div>
                                    <div>
                                        <label className="label text-xs font-bold uppercase text-gray-400 italic">Pustaka Pendukung</label>
                                        <textarea
                                            value={formData.pustaka_pendukung}
                                            onChange={e => setFormData({ ...formData, pustaka_pendukung: e.target.value })}
                                            className="input w-full min-h-[150px] py-3 text-sm"
                                            placeholder="Daftar pustaka pendukung..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                        <Monitor className="text-purple-500" size={20} />
                                        Media Pembelajaran
                                    </h3>
                                    <div>
                                        <label className="label text-xs font-bold uppercase text-gray-400 italic">Software (Perangkat Lunak)</label>
                                        <textarea
                                            value={formData.media_software}
                                            onChange={e => setFormData({ ...formData, media_software: e.target.value })}
                                            className="input w-full min-h-[150px] py-3 text-sm"
                                            placeholder="Contoh: VS Code, MySQL Workbench, Figma..."
                                        />
                                    </div>
                                    <div>
                                        <label className="label text-xs font-bold uppercase text-gray-400 italic">Hardware (Perangkat Keras)</label>
                                        <textarea
                                            value={formData.media_hardware}
                                            onChange={e => setFormData({ ...formData, media_hardware: e.target.value })}
                                            className="input w-full min-h-[150px] py-3 text-sm"
                                            placeholder="Contoh: Laptop, Proyektor, Lab Komputer..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section: Info Tambahan */}

                </div>
            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t p-4 z-40 flex items-center justify-between shadow-lg lg:pl-64 font-sans">
                <div className="flex items-center gap-4">
                    {formData.mata_kuliah_id && (
                        <div className="text-sm text-gray-500">
                            Total Bobot: <span className={`font-bold ${totalBobot === 100 ? 'text-green-600' : 'text-red-600'}`}>
                                {totalBobot}%
                            </span>
                        </div>
                    )}
                    {currentRPSId && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                            <span className={`w-2 h-2 rounded-full ${formData.status === 'approved' ? 'bg-green-500' : formData.status === 'submitted' ? 'bg-orange-500' : 'bg-gray-400'}`}></span>
                            Status: {formData.status || 'draft'}
                        </div>
                    )}
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate(-1)} className="btn btn-ghost">Batal</button>

                    <button
                        onClick={handleSaveDraft}
                        disabled={loading || !formData.mata_kuliah_id || (formData.status && formData.status !== 'draft')}
                        className="btn btn-outline flex items-center gap-2"
                    >
                        <Cloud size={18} />
                        Simpan Draft
                    </button>

                    <button
                        onClick={handleSaveToServer}
                        disabled={loading || !formData.mata_kuliah_id || (formData.status && formData.status !== 'draft')}
                        className="btn btn-primary flex items-center gap-2 px-8"
                    >
                        <Save size={18} />
                        {loading ? 'Menyimpan...' : (formData.status && formData.status !== 'draft' ? `Terkunci (${formData.status})` : (currentRPSId ? 'Simpan Perubahan' : 'Terbitkan RPS'))}
                    </button>

                    {currentRPSId && formData.status === 'draft' && (
                        <button
                            onClick={handleSubmitToApproval}
                            disabled={loading || totalBobot !== 100}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                            title={totalBobot !== 100 ? "Total bobot harus 100% untuk diajukan" : ""}
                        >
                            <CheckCircle size={18} />
                            Ajukan Approval
                        </button>
                    )}
                </div>
            </div>
        </div >
    );
}
