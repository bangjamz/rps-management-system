import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import useAcademicStore from '../store/useAcademicStore';
import useAuthStore from '../store/useAuthStore';
import { LayoutGrid, List, Table as TableIcon, Edit, Trash2, Plus, Search, BookOpen, Clock, Calendar, UserPlus, X, Check, AlertCircle, FileUp, Download } from 'lucide-react';
import { getTagColor } from '../utils/ui';
import { downloadCSVTemplate, exportToCSV } from '../utils/csvHelper';
import Swal from 'sweetalert2';

// --- Sub-components ---

const AssignLecturerModal = ({ course, isOpen, onClose, onSave }) => {
    const [lecturers, setLecturers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        dosen_id: [], // Array for Team Teaching
        semester: 'Ganjil',
        tahun_ajaran: '2025/2026',
        catatan: ''
    });

    useEffect(() => {
        if (course && isOpen) {
            fetchLecturers();
            setFormData(prev => ({
                ...prev,
                dosen_id: [], // Reset on open
                semester: course.semester % 2 !== 0 ? 'Ganjil' : 'Genap'
            }));
            setSearchTerm('');
        }
    }, [course, isOpen]);

    const fetchLecturers = async () => {
        if (!course) return;
        setLoading(true);
        try {
            // Fetch available lecturers (including cross-faculty)
            const res = await axios.get('/lecturer-assignments/available-lecturers', {
                params: { prodiId: course.prodi_id }
            });
            setLecturers(res.data.lecturers || []);
        } catch (error) {
            console.error('Failed to fetch lecturers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        const dosenIds = Array.isArray(formData.dosen_id)
            ? formData.dosen_id
            : (formData.dosen_id ? [formData.dosen_id] : []);

        if (dosenIds.length === 0) {
            alert('Pilih minimal satu dosen');
            return;
        }

        // Send as array if Team Teaching, or single value if backend expects that (backend seems to handle both or we adapt)
        // Based on LecturerAssignmentPage logic, it likely handles array or we might need to send main lecturer.
        // Let's stick to the existing payload structure but ensure backend handles it. 
        // NOTE: If backend only accepts single `dosen_id`, we might need to change backend or this structure. 
        // Assuming backend was enhanced or we send `dosen_ids` array.
        // Actually, looking at `handleAssignLecturer` in CoursesPage, it posts `...assignmentData`.

        onSave(course.id, {
            ...formData,
            dosen_id: dosenIds // Send array
        });
    };

    const handleDosenCheck = (lecturerId, checked) => {
        const id = parseInt(lecturerId);
        let currentIds = Array.isArray(formData.dosen_id) ? [...formData.dosen_id] : [];

        if (checked) {
            if (!currentIds.includes(id)) currentIds.push(id);
        } else {
            currentIds = currentIds.filter(val => val !== id);
        }

        setFormData({
            ...formData,
            dosen_id: currentIds,
            catatan: currentIds.length > 1 ? 'Team Teaching' : ''
        });
    };

    // Helper for badges
    const getCategoryBadge = (category) => {
        const style = getTagColor(category);
        const label = category === 'recommended' ? 'Relevan (Bidang)' :
            category === 'same-prodi' ? 'Prodi Sama' :
                category === 'cross-faculty' ? 'Lintas Fakultas' : category;
        return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${style}`}>{label}</span>;
    };

    const filteredLecturers = lecturers.filter(l =>
        l.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="flex justify-between items-center p-6 border-b dark:border-gray-700 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Penugasan Dosen</h2>
                        <p className="text-sm text-gray-500">{course?.kode_mk} - {course?.nama_mk}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Dosen Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Pilih Dosen Pengampu
                            <span className="text-xs font-normal text-gray-500 ml-2">(Bisa pilih lebih dari satu untuk Team Teaching)</span>
                        </label>

                        {/* Search Box */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama dosen..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* List */}
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <div className="p-4 text-center text-sm text-gray-500">Memuat data dosen...</div>
                            ) : filteredLecturers.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">Tidak ada dosen ditemukan</div>
                            ) : (
                                filteredLecturers.map(lecturer => (
                                    <label key={lecturer.id} className={`flex items-start p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${formData.dosen_id.includes(lecturer.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                        }`}>
                                        <input
                                            type="checkbox"
                                            value={lecturer.id}
                                            checked={formData.dosen_id.includes(lecturer.id)}
                                            onChange={(e) => handleDosenCheck(lecturer.id, e.target.checked)}
                                            className="mt-1 mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`font-medium text-sm ${formData.dosen_id.includes(lecturer.id) ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                                    {lecturer.nama_lengkap}
                                                </span>
                                                {getCategoryBadge(lecturer.assignmentCategory)}
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-3">
                                                <span>NIDN: {lecturer.nidn || '-'}</span>
                                                {lecturer.prodi && <span>• {lecturer.prodi.nama}</span>}
                                            </div>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semester</label>
                            <select
                                value={formData.semester}
                                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                className="input"
                            >
                                <option value="Ganjil">Ganjil</option>
                                <option value="Genap">Genap</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tahun Ajaran</label>
                            <input
                                type="text"
                                required
                                value={formData.tahun_ajaran}
                                onChange={(e) => setFormData({ ...formData, tahun_ajaran: e.target.value })}
                                className="input"
                                placeholder="2025/2026"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catatan</label>
                        <textarea
                            value={formData.catatan}
                            onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                            className="input"
                            rows="2"
                            placeholder="Opsional"
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose} className="btn btn-ghost">Batal</button>
                        <button type="submit" className="btn btn-primary">Simpan Penugasan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditCourseModal = ({ course, isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        kode_mk: '',
        nama_mk: '',
        sks: 0,
        sks_teori: 0,
        sks_praktek: 0,
        semester: 1,
        scope: 'prodi',
        fakultas_id: null,
        prodi_id: null
    });

    useEffect(() => {
        if (course) {
            setFormData({
                kode_mk: course.kode_mk || '',
                nama_mk: course.nama_mk || '',
                sks: course.sks || 0,
                sks_teori: course.sks_teori || 0,
                sks_praktek: course.sks_praktek || 0,
                semester: course.semester || 1,
                scope: course.scope || 'prodi',
                fakultas_id: course.fakultas_id || null,
                prodi_id: course.prodi_id || null
            });
        }
    }, [course]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        onSave(course.id, formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Mata Kuliah</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Kode MK</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.kode_mk}
                                onChange={(e) => setFormData({ ...formData, kode_mk: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="label">SKS Total</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    className="input bg-gray-100"
                                    value={formData.sks}
                                    readOnly
                                    title="Total otomatis dari Teori + Praktik"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label">SKS Teori</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.sks_teori}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setFormData(prev => ({
                                        ...prev,
                                        sks_teori: val,
                                        sks: val + (prev.sks_praktek || 0)
                                    }));
                                }}
                                required
                            />
                        </div>
                        <div>
                            <label className="label">SKS Praktik</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.sks_praktek}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setFormData(prev => ({
                                        ...prev,
                                        sks_praktek: val,
                                        sks: (prev.sks_teori || 0) + val
                                    }));
                                }}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="label">Nama Mata Kuliah</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.nama_mk}
                            onChange={(e) => setFormData({ ...formData, nama_mk: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Semester</label>
                        <select
                            className="input"
                            value={formData.semester}
                            onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                        >
                            {[...Array(8)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="btn btn-ghost">Batal</button>
                        <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ViewToggle = ({ viewMode, setViewMode }) => (
    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
        <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            title="Tampilan Grid"
        >
            <LayoutGrid size={18} />
        </button>
        <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            title="Tampilan List"
        >
            <List size={18} />
        </button>
        <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            title="Tampilan Tabel"
        >
            <TableIcon size={18} />
        </button>
    </div>
);

// --- Main Component ---

export default function CoursesPage() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const { activeSemester, activeYear } = useAcademicStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list'); // grid, list, table
    const [editingCourse, setEditingCourse] = useState(null);
    const [assigningCourse, setAssigningCourse] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importMessage, setImportMessage] = useState(null);

    // Advanced Filters State
    // State Filter Lanjutan
    const user = useAuthStore((state) => state.user); // Optimasi selector untuk mencegah render ulang yang tidak perlu
    const [selectedFakultas, setSelectedFakultas] = useState('');
    const [selectedProdi, setSelectedProdi] = useState('');
    const [fakultasList, setFakultasList] = useState([]);
    const [prodiList, setProdiList] = useState([]);

    // Helper untuk Swal yang mendukung tema
    const getSwalConfig = (overrides = {}) => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        return {
            background: isDarkMode ? '#1f2937' : '#ffffff',
            color: isDarkMode ? '#f3f4f6' : '#1f2937',
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: isDarkMode ? '#374151' : '#d1d5db',
            padding: '2em',
            customClass: {
                popup: 'rounded-xl shadow-xl border border-gray-200 dark:border-gray-700',
                confirmButton: 'px-6 py-2.5 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors mx-2',
                cancelButton: 'px-6 py-2.5 rounded-lg font-semibold dark:text-gray-200 text-gray-700 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mx-2'
            },
            buttonsStyling: false,
            ...overrides
        };
    };

    useEffect(() => {
        if (user) {
            fetchFilters();
        }
    }, [user]);

    // Menggunakan useCallback untuk loadCourses agar referensi fungsi stabil
    const loadCourses = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                // semester: activeSemester, // Hapus filter semester di backend jika frontend sudah filter lokal
                search: searchQuery
            };

            if (selectedFakultas) params.fakultasId = selectedFakultas;
            if (selectedProdi) params.prodiId = selectedProdi;

            const response = await axios.get('/courses', { params });
            // console.log('DEBUG: Courses fetched:', response.data); // Hapus log debug untuk mengurangi spam
            setCourses(response.data);
        } catch (error) {
            console.error('Gagal memuat mata kuliah:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedFakultas, selectedProdi, searchQuery]); // Hapus activeSemester dari dependency array loadCourses jika tidak dikirim ke params

    // Effect untuk memanggil loadCourses saat dependency berubah
    useEffect(() => {
        loadCourses();
    }, [loadCourses]); // Dependency array effect sekarang hanya loadCourses

    const fetchFilters = async () => {
        try {
            if (user?.role === 'admin_institusi') {
                const fakRes = await axios.get('/organization/fakultas');
                setFakultasList(fakRes.data);
                const prodiRes = await axios.get('/organization/prodi');
                setProdiList(prodiRes.data);
            } else if (user?.role === 'dekan') {
                const prodiRes = await axios.get('/organization/prodi', {
                    params: { fakultasId: user.fakultas_id }
                });
                setProdiList(prodiRes.data);
            }
        } catch (error) {
            console.error('Gagal memuat filter:', error);
        }
    };

    const handleAssignLecturer = async (courseId, assignmentData) => {
        try {
            await axios.post('/lecturer-assignments', {
                ...assignmentData,
                mata_kuliah_id: courseId
            });
            Swal.fire(getSwalConfig({ title: 'Berhasil!', text: 'Dosen berhasil ditugaskan.', icon: 'success' }));
            setAssigningCourse(null);
            loadCourses(); // Refresh to show updated assignments
        } catch (error) {
            // Handle 409 Conflict - course already has an active assignment
            if (error.response?.status === 409 && error.response?.data?.existing) {
                const existing = error.response.data.existing;
                const result = await Swal.fire(getSwalConfig({
                    title: 'Konfirmasi Penugasan',
                    text: `Mata kuliah ini sudah ditugaskan ke ${existing.dosen?.nama_lengkap || 'dosen lain'}.\n\nApakah Anda ingin mengganti penugasan ini ke dosen yang baru dipilih?\n(Dosen lama akan menerima notifikasi).`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Ya, Ganti',
                    cancelButtonText: 'Batal'
                }));

                if (result.isConfirmed) {
                    try {
                        // Retry with force: true to replace existing assignment
                        await axios.post('/lecturer-assignments', {
                            ...assignmentData,
                            mata_kuliah_id: courseId,
                            force: true
                        });
                        Swal.fire(getSwalConfig({ title: 'Berhasil!', text: 'Penugasan diperbarui! Dosen lama telah dinotifikasi.', icon: 'success' }));
                        setAssigningCourse(null);
                        loadCourses();
                    } catch (forceError) {
                        console.error('Failed to force assign:', forceError);
                        Swal.fire(getSwalConfig({ title: 'Error', text: forceError.response?.data?.message || 'Gagal mengganti penugasan', icon: 'error' }));
                    }
                }
            } else {
                console.error('Failed to assign lecturer:', error);
                Swal.fire(getSwalConfig({ title: 'Error', text: 'Gagal menugaskan dosen: ' + (error.response?.data?.message || 'Error occurred'), icon: 'error' }));
            }
        }
    };

    const handleUpdateCourse = async (id, data) => {
        try {
            await axios.put(`/courses/${id}`, data);
            setEditingCourse(null);
            loadCourses(); // Reload to refresh data
        } catch (error) {
            console.error('Failed to update course:', error);
            Swal.fire(getSwalConfig({ title: 'Error', text: 'Gagal memperbarui mata kuliah', icon: 'error' }));
        }
    };

    const filteredCourses = courses.filter(course => {
        // Filter by semester from store (Ganjil/Genap)
        // Mapped: 1,3,5,7 -> Ganjil; 2,4,6,8 -> Genap
        const isGanjil = course.semester % 2 !== 0;
        const courseSemesterType = isGanjil ? 'Ganjil' : 'Genap';

        const matchSemester = activeSemester === courseSemesterType;
        const matchSearch = course.nama_mk.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.kode_mk.toLowerCase().includes(searchQuery.toLowerCase());

        return matchSemester && matchSearch;
    });

    // Import MK handler
    const handleImportMK = async () => {
        if (!importFile) return;
        setImporting(true);
        setImportMessage(null);

        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const res = await axios.post('/curriculum/mata-kuliah/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setImportMessage({ type: 'success', text: res.data.message });
            setImportFile(null);
            loadCourses(); // Refresh list
        } catch (error) {
            setImportMessage({ type: 'error', text: error.response?.data?.message || 'Import gagal' });
        } finally {
            setImporting(false);
        }
    };

    const handleExportMK = () => {
        const headers = ['kode_mk', 'nama_mk', 'sks_teori', 'sks_praktek', 'semester', 'deskripsi', 'kode_prodi'];
        const dataToExport = filteredCourses.map(item => ({
            kode_mk: item.kode_mk,
            nama_mk: item.nama_mk,
            sks_teori: item.sks_teori || 0,
            sks_praktek: item.sks_praktek || 0,
            semester: item.semester,
            deskripsi: item.deskripsi || '',
            kode_prodi: item.prodi?.kode || ''
        }));
        exportToCSV(dataToExport, `export_mk_${Date.now()}.csv`, headers);
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mata Kuliah</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total {courses.length} mata kuliah
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="btn btn-outline flex items-center gap-2"
                    >
                        <FileUp size={18} />
                        <span>Import MK</span>
                    </button>
                    <button
                        onClick={handleExportMK}
                        className="btn btn-outline flex items-center gap-2"
                    >
                        <Download size={18} />
                        <span>Export CSV</span>
                    </button>
                    <button className="btn btn-primary flex items-center gap-2">
                        <Plus size={18} />
                        <span>Tambah MK</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari berdasarkan kode atau nama..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-10 w-full"
                        />
                    </div>

                    {/* Admin/Dekan Filters */}
                    {user?.role === 'admin_institusi' && (
                        <select
                            className="input w-full md:w-48"
                            value={selectedFakultas}
                            onChange={(e) => {
                                setSelectedFakultas(e.target.value);
                                setSelectedProdi(''); // reset prodi when fakultas changes
                            }}
                        >
                            <option value="">Semua Fakultas</option>
                            {fakultasList.map(f => (
                                <option key={f.id} value={f.id}>{f.nama}</option>
                            ))}
                        </select>
                    )}

                    {(user?.role === 'admin_institusi' || user?.role === 'dekan') && (
                        <select
                            className="input w-full md:w-48"
                            value={selectedProdi}
                            onChange={(e) => setSelectedProdi(e.target.value)}
                        >
                            <option value="">Semua Prodi</option>
                            {prodiList
                                .filter(p => !selectedFakultas || p.fakultas_id == selectedFakultas)
                                .map(p => (
                                    <option key={p.id} value={p.id}>{p.nama}</option>
                                ))
                            }
                        </select>
                    )}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                    Menampilkan mata kuliah Semester {activeSemester} (Tahun Ajaran {activeYear})
                </div>
            </div>

            {/* Content Display */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Memuat...</div>
            ) : filteredCourses.length === 0 ? (
                <div className="card p-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">Tidak ada mata kuliah yang ditemukan</p>
                </div>
            ) : (
                <>
                    {/* GRID VIEW */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCourses.map((course) => (
                                <div key={course.id} className="card p-6 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-4 gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-2" title={course.nama_mk}>
                                                {course.nama_mk}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-2 mt-1">
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-mono">
                                                    {course.kode_mk}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${course.scope === 'institusi' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' :
                                                    course.scope === 'fakultas' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' :
                                                        'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                                                    }`}>
                                                    {course.scope}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]" title={course.prodi?.nama || course.fakultas?.nama || course.institusi?.nama}>
                                                    {course.prodi?.nama || course.fakultas?.nama || course.institusi?.nama || '-'}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end flex-shrink-0">
                                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded px-2 py-1 text-right">
                                                <div className="text-sm font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap leading-tight">
                                                    {course.sks} SKS
                                                </div>
                                                <div className="text-[11px] text-blue-500/80 dark:text-blue-500 font-bold whitespace-nowrap mt-0.5">
                                                    {course.sks_teori || 0}T / {course.sks_praktek || 0}P
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4 border-t border-b border-gray-100 dark:border-gray-700 py-3">
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <Clock className="w-4 h-4 mr-2" />
                                            Semester {course.semester}
                                        </div>
                                        {/* Lecturer Display for Grid */}
                                        <div className="flex items-start text-sm text-gray-600 dark:text-gray-400 mt-2">
                                            <div className="min-w-[1.25rem] pt-0.5 mr-2">
                                                <UserPlus className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {course.assignments && course.assignments.length > 0 ? (
                                                    course.assignments.map((assignment, idx) => (
                                                        <span key={assignment.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 border border-gray-200 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-800">
                                                            {assignment.dosen?.nama_lengkap}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 italic">Belum ada dosen</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate(`/kaprodi/rps/${course.id}`)}
                                            className="btn btn-primary btn-sm flex-1"
                                        >
                                            Lihat RPS
                                        </button>
                                        <button
                                            onClick={() => setAssigningCourse(course)}
                                            className="btn btn-ghost btn-sm px-2 text-green-600"
                                            title="Tugaskan Dosen"
                                        >
                                            <UserPlus size={16} />
                                        </button>
                                        <button
                                            onClick={() => setEditingCourse(course)}
                                            className="btn btn-ghost btn-sm px-2"
                                            title="Ubah"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* LIST VIEW */}
                    {viewMode === 'list' && (
                        <div className="flex flex-col gap-3">
                            {filteredCourses.map((course) => (
                                <div key={course.id} className="card p-4 flex flex-col md:flex-row items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                {course.kode_mk}
                                            </span>
                                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                {course.nama_mk}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${course.scope === 'institusi' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' :
                                                course.scope === 'fakultas' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' :
                                                    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                                                }`}>
                                                {course.scope}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium">
                                                • {course.prodi?.nama || course.fakultas?.nama || course.institusi?.nama || '-'}
                                            </span>
                                        </div>
                                        {/* Lecturer Display for List */}
                                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                            <span className="font-medium text-gray-400">Dosen:</span>
                                            {course.assignments && course.assignments.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {course.assignments.map((assignment, idx) => (
                                                        <span key={assignment.id} className="text-gray-700 dark:text-gray-300">
                                                            {assignment.dosen?.nama_lengkap}{idx < course.assignments.length - 1 ? ',' : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="italic text-gray-400">Belum ditugaskan</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            <span>Sem {course.semester}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} />
                                            <span className="font-bold">{course.sks} SKS</span>
                                            <span className="text-xs text-gray-400">({course.sks_teori || 0}T / {course.sks_praktek || 0}P)</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                                        <button
                                            onClick={() => navigate(`/kaprodi/rps/${course.id}`)}
                                            className="btn btn-outline btn-sm flex-1"
                                        >
                                            RPS
                                        </button>
                                        <button
                                            onClick={() => setAssigningCourse(course)}
                                            className="btn btn-ghost btn-sm text-green-600"
                                            title="Tugaskan Dosen"
                                        >
                                            <UserPlus size={16} />
                                        </button>
                                        <button
                                            onClick={() => setEditingCourse(course)}
                                            className="btn btn-ghost btn-sm"
                                            title="Ubah"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TABLE VIEW */}
                    {viewMode === 'table' && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Kode</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mata Kuliah</th>
                                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">SKS</th>
                                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">T</th>
                                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">P</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Semester</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dosen Pengampu</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Level</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Unit</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredCourses.map((course) => (
                                        <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                {course.kode_mk}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {course.nama_mk}
                                            </td>
                                            <td className="px-2 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900 dark:text-white">
                                                {course.sks}
                                            </td>
                                            <td className="px-2 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">
                                                {course.sks_teori || 0}
                                            </td>
                                            <td className="px-2 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">
                                                {course.sks_praktek || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {course.semester}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                                                {course.assignments && course.assignments.length > 0 ? (
                                                    <div className="flex flex-col gap-1">
                                                        {course.assignments.map((assignment, idx) => (
                                                            <span key={assignment.id} className="inline-flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-600">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                                {assignment.dosen?.nama_lengkap}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic text-xs">Belum ditugaskan</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`${getTagColor(course.scope)} px-2.5 py-1 rounded-full text-xs font-semibold uppercase border`}>
                                                    {course.scope}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`${getTagColor(course.scope || 'prodi')} px-2 py-0.5 rounded text-[10px] font-bold uppercase border`}>
                                                    {course.prodi?.nama || course.fakultas?.nama || course.institusi?.nama || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => navigate(`/kaprodi/rps/${course.id}`)}
                                                    className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 mr-4"
                                                >
                                                    RPS
                                                </button>
                                                <button
                                                    onClick={() => setAssigningCourse(course)}
                                                    className="text-green-600 hover:text-green-900 dark:hover:text-green-400 mr-4"
                                                    title="Tugaskan Dosen"
                                                >
                                                    Tugaskan
                                                </button>
                                                <button
                                                    onClick={() => setEditingCourse(course)}
                                                    className="text-amber-600 hover:text-amber-900 dark:hover:text-amber-400"
                                                >
                                                    Ubah
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            <EditCourseModal
                course={editingCourse}
                isOpen={!!editingCourse}
                onClose={() => setEditingCourse(null)}
                onSave={handleUpdateCourse}
            />

            <AssignLecturerModal
                course={assigningCourse}
                isOpen={!!assigningCourse}
                onClose={() => setAssigningCourse(null)}
                onSave={handleAssignLecturer}
            />

            {/* Import MK Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full">
                        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import Mata Kuliah</h2>
                            <button onClick={() => { setShowImportModal(false); setImportFile(null); setImportMessage(null); }} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {importMessage && (
                                <div className={`p-3 rounded-lg ${importMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {importMessage.text}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Upload File CSV
                                </label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setImportFile(e.target.files[0])}
                                    className="file-input file-input-bordered w-full"
                                />
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                    <strong>Format CSV:</strong> kode_mk, nama_mk, sks, semester, deskripsi
                                </p>
                                <button
                                    onClick={() => downloadCSVTemplate('mk')}
                                    className="btn btn-outline btn-sm gap-2"
                                >
                                    <Download size={16} />
                                    Download Template
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-6 border-t dark:border-gray-700">
                            <button
                                onClick={() => { setShowImportModal(false); setImportFile(null); setImportMessage(null); }}
                                className="btn btn-ghost"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleImportMK}
                                disabled={!importFile || importing}
                                className="btn btn-primary gap-2"
                            >
                                {importing ? 'Mengimpor...' : 'Import'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
