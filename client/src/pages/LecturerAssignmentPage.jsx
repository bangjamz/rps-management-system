import { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, X, Check, AlertCircle, BookOpen, Edit, UserPlus } from 'lucide-react';
import axios from '../lib/axios';
import useAuthStore from '../store/useAuthStore';
import useAcademicStore from '../store/useAcademicStore';
import { getTagColor } from '../utils/ui';

export default function LecturerAssignmentPage() {
    const { user } = useAuthStore();
    const [assignments, setAssignments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [allLecturers, setAllLecturers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [availableLecturers, setAvailableLecturers] = useState([]);
    const [loadingLecturers, setLoadingLecturers] = useState(false);
    const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' or 'lecturers'
    const [editingDosen, setEditingDosen] = useState(null);
    const [showDosenModal, setShowDosenModal] = useState(false);
    const [dosenFormData, setDosenFormData] = useState({
        nama_lengkap: '',
        nidn: '',
        email: '',
        status: 'Aktif'
    });

    // Advanced Filters State
    const [selectedProdi, setSelectedProdi] = useState('');
    const [prodiList, setProdiList] = useState([]);

    useEffect(() => {
        if (user && (user.role === 'admin_institusi' || user.role === 'dekan')) {
            fetchFilters();
        }
    }, [user]);

    const fetchFilters = async () => {
        try {
            const params = {};
            if (user.role === 'dekan') params.fakultasId = user.fakultas_id;

            const res = await axios.get('/organization/prodi', { params });
            setProdiList(res.data);
        } catch (error) {
            console.error('Failed to fetch filter options:', error);
        }
    };

    // Form state
    const [formData, setFormData] = useState({
        dosen_id: '',
        mata_kuliah_id: '',
        semester: 'Ganjil',
        tahun_ajaran: '2025/2026',
        catatan: ''
    });

    const { activeSemester, activeYear } = useAcademicStore();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAssignments();
        fetchCourses();
        fetchAllLecturers();
    }, [activeSemester, activeYear, selectedProdi]); // Refetch on filter change

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/lecturer-assignments', {
                params: {
                    semester: activeSemester,
                    tahunAjaran: activeYear,
                    search: searchQuery,
                    prodiId: selectedProdi // Add filter
                }
            });
            setAssignments(res.data);
        } catch (error) {
            console.error('Failed to fetch assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await axios.get('/courses');
            setCourses(res.data);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        }
    };

    const fetchAllLecturers = async () => {
        try {
            // Fetch all lecturers with their assigned courses
            // Use selectedProdi if set, otherwise user's prodi (or none for Admin see all?)
            // If Admin/Dekan and selectedProdi is empty, maybe fetch all in scope?
            const filterProdi = selectedProdi || user?.prodi_id;

            const res = await axios.get('/lecturer-assignments/available-lecturers', {
                params: { prodiId: filterProdi }
            });
            setAllLecturers(res.data.lecturers || []);
        } catch (error) {
            console.error('Failed to fetch all lecturers:', error);
            setAllLecturers([]);
        }
    };

    const fetchAvailableLecturers = async (courseId) => {
        try {
            setLoadingLecturers(true);
            // Get course details to find prodi_id
            const course = courses.find(c => c.id === courseId);
            if (!course) return;

            const res = await axios.get('/lecturer-assignments/available-lecturers', {
                params: { prodiId: course.prodi_id }
            });
            setAvailableLecturers(res.data.lecturers || []);
        } catch (error) {
            console.error('Failed to fetch available lecturers:', error);
            setAvailableLecturers([]);
        } finally {
            setLoadingLecturers(false);
        }
    };

    const handleOpenModal = (course) => {
        setSelectedCourse(course);
        setFormData({
            ...formData,
            mata_kuliah_id: course.id
        });
        fetchAvailableLecturers(course.id);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedCourse(null);
        setAvailableLecturers([]);
        setFormData({
            dosen_id: '',
            mata_kuliah_id: '',
            semester: 'Ganjil',
            tahun_ajaran: '2025/2026',
            catatan: ''
        });
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/lecturer-assignments', formData);
            fetchAssignments();
            handleCloseModal();
            alert('Berhasil menugaskan dosen');
        } catch (error) {
            if (error.response?.status === 409 && error.response?.data?.existing) {
                const existing = error.response.data.existing;
                const confirmReassign = window.confirm(
                    `Mata kuliah ini sudah ditugaskan ke ${existing.dosen?.nama_lengkap || 'dosen lain'}. \n\nApakah Anda ingin mengganti penugasan ini ke dosen yang baru dipilih? \n(Dosen lama akan menerima notifikasi).`
                );

                if (confirmReassign) {
                    try {
                        // Retry with force: true
                        await axios.post('/lecturer-assignments', { ...formData, force: true });
                        fetchAssignments();
                        handleCloseModal();
                        alert('Penugasan berhasil diperbarui! Dosen lama telah dinotifikasi.');
                    } catch (forceError) {
                        console.error('Failed to force assign:', forceError);
                        alert(forceError.response?.data?.message || 'Gagal mengganti penugasan');
                    }
                }
            } else {
                console.error('Failed to create assignment:', error);
                alert(error.response?.data?.message || 'Gagal membuat penugasan');
            }
        }
    };

    const handleDeleteAssignment = async (id) => {
        if (!confirm('Hapus assignment ini?')) return;

        try {
            await axios.delete(`/lecturer-assignments/${id}`);
            fetchAssignments();
        } catch (error) {
            console.error('Failed to delete assignment:', error);
            alert('Failed to delete assignment');
        }
    };

    const handleOpenDosenModal = (dosen = null) => {
        if (dosen) {
            setEditingDosen(dosen);
            setDosenFormData({
                nama_lengkap: dosen.nama_lengkap || '',
                nidn: dosen.nidn || '',
                email: dosen.email || '',
                status: dosen.status || 'Aktif'
            });
        } else {
            setEditingDosen(null);
            setDosenFormData({
                nama_lengkap: '',
                nidn: '',
                email: '',
                status: 'Aktif'
            });
        }
        setShowDosenModal(true);
    };

    const handleCloseDosenModal = () => {
        setShowDosenModal(false);
        setEditingDosen(null);
        setDosenFormData({
            nama_lengkap: '',
            nidn: '',
            email: '',
            status: 'Aktif'
        });
    };

    const handleSaveDosen = async (e) => {
        e.preventDefault();
        try {
            if (editingDosen) {
                await axios.put(`/lecturer-assignments/dosen/${editingDosen.id}`, dosenFormData);
                alert('Data dosen berhasil diperbarui');
            } else {
                await axios.post('/lecturer-assignments/dosen', dosenFormData);
                alert('Dosen baru berhasil ditambahkan');
            }
            handleCloseDosenModal();
            fetchAllLecturers();
        } catch (error) {
            console.error('Failed to save dosen:', error);
            alert(error.response?.data?.message || 'Gagal menyimpan data dosen');
        }
    };

    const getCategoryBadge = (category) => {
        const style = getTagColor(category);
        const labels = {
            'same-prodi': '✓ Same Prodi',
            'same-fakultas': 'Same Fakultas',
            'cross-faculty': 'Cross-Faculty'
        };

        return (
            <span className={`px-2 py-0.5 rounded-full border ${style}`}>
                {labels[category] || category}
            </span>
        );
    };

    // Filter locally if needed, but API likely handles it. 
    // If API returns all, we filter here:
    const filteredAssignments = assignments.filter(a => {
        const matchesContext = a.semester === activeSemester && a.tahun_ajaran === activeYear;
        // Search is handled by API or here if API ignores it
        return matchesContext;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Penugasan Dosen</h1>
                    <p className="text-gray-600 mt-1">
                        Kelola penugasan dosen untuk Semester {activeSemester} {activeYear}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5" />
                        Tambah Penugasan
                    </button>
                    {activeTab === 'lecturers' && (
                        <button
                            onClick={() => handleOpenDosenModal()}
                            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                        >
                            <UserPlus className="w-5 h-5" />
                            Tambah Dosen
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-6">
                    <button
                        onClick={() => setActiveTab('assignments')}
                        className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'assignments'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Dosen Ditugaskan ({filteredAssignments.length})
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('lecturers')}
                        className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'lecturers'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Data Dosen ({allLecturers.length})
                        </div>
                    </button>
                </nav>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari dosen atau mata kuliah..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchAssignments()}
                            className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2"
                        />
                    </div>

                    {/* Role-based Filters */}
                    {(user?.role === 'admin_institusi' || user?.role === 'dekan') && (
                        <select
                            value={selectedProdi}
                            onChange={(e) => setSelectedProdi(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-64"
                        >
                            <option value="">Semua Prodi</option>
                            {prodiList.map(p => (
                                <option key={p.id} value={p.id}>{p.nama}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Tab Content: Dosen Ditugaskan (Assignments) */}
            {activeTab === 'assignments' && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Mata Kuliah</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Dosen</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Semester</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Home Base</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Catatan</th>
                                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-900">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredAssignments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        No assignments found
                                    </td>
                                </tr>
                            ) : (
                                filteredAssignments.map((assignment) => (
                                    <tr key={assignment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {assignment.mata_kuliah?.nama_mk}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {assignment.mata_kuliah?.kode_mk} • {assignment.mata_kuliah?.sks} SKS
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {assignment.dosen?.nama_lengkap}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {assignment.dosen?.nidn}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <div className="font-medium">{assignment.semester}</div>
                                                <div className="text-gray-500">{assignment.tahun_ajaran}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                {assignment.dosen?.prodi?.nama && (
                                                    <span className={`${getTagColor('prodi')} px-2 py-0.5 rounded text-[10px] font-bold uppercase border`}>
                                                        {assignment.dosen.prodi.nama}
                                                    </span>
                                                )}
                                                {assignment.dosen?.prodi?.fakultas && (
                                                    <span className={`${getTagColor('fakultas')} px-2 py-0.5 rounded text-[10px] font-bold uppercase border`}>
                                                        {assignment.dosen.prodi.fakultas.nama}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {assignment.catatan || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteAssignment(assignment.id)}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Tab Content: Data Dosen */}
            {activeTab === 'lecturers' && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Nama Dosen</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">NIDN</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Email</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Prodi</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Kategori</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {allLecturers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        Tidak ada data dosen
                                    </td>
                                </tr>
                            ) : (
                                allLecturers.filter(lecturer =>
                                    !searchQuery ||
                                    lecturer.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    lecturer.nidn?.toLowerCase().includes(searchQuery.toLowerCase())
                                ).map((lecturer) => (
                                    <tr key={lecturer.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">
                                                {lecturer.nama_lengkap}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {lecturer.nidn || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {lecturer.email || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {lecturer.prodi?.nama || '-'}
                                            {lecturer.prodi?.fakultas && (
                                                <div className="text-gray-400 text-xs">
                                                    {lecturer.prodi.fakultas.nama}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getCategoryBadge(lecturer.assignmentCategory)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleOpenDosenModal(lecturer)}
                                                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                                title="Edit Dosen"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Assignment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Tugaskan Dosen</h2>
                            <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAssignment} className="p-6 space-y-6">
                            {/* Course Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mata Kuliah *
                                </label>
                                <select
                                    value={formData.mata_kuliah_id}
                                    onChange={(e) => {
                                        const courseId = parseInt(e.target.value);
                                        setFormData({ ...formData, mata_kuliah_id: courseId });
                                        if (courseId) {
                                            const course = courses.find(c => c.id === courseId);
                                            setSelectedCourse(course);
                                            fetchAvailableLecturers(courseId);
                                        }
                                    }}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                >
                                    <option value="">Pilih Mata Kuliah</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.kode_mk} - {course.nama_mk} ({course.sks} SKS)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Lecturer Selection with Search and Multi-select */}
                            {formData.mata_kuliah_id && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Pilih Dosen *
                                        </label>
                                        <div className="relative w-64">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Cari dosen..."
                                                className="pl-8 w-full border border-gray-300 rounded-md py-1 text-sm"
                                                onChange={(e) => {
                                                    const query = e.target.value.toLowerCase();
                                                    // Local filter for the view
                                                    const filtered = availableLecturers.map(l => ({
                                                        ...l,
                                                        hidden: !l.nama_lengkap.toLowerCase().includes(query)
                                                    }));
                                                    setAvailableLecturers(filtered);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {loadingLecturers ? (
                                        <div className="text-center py-4 text-gray-500">Memuat data dosen...</div>
                                    ) : (
                                        <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                                            {availableLecturers.filter(l => !l.hidden).map(lecturer => (
                                                <label
                                                    key={lecturer.id}
                                                    className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition ${(Array.isArray(formData.dosen_id) ? formData.dosen_id.includes(lecturer.id) : formData.dosen_id === lecturer.id)
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="dosen_id"
                                                        value={lecturer.id}
                                                        checked={Array.isArray(formData.dosen_id) ? formData.dosen_id.includes(lecturer.id) : formData.dosen_id === lecturer.id}
                                                        onChange={(e) => {
                                                            const id = parseInt(e.target.value);
                                                            let newDosenIds = Array.isArray(formData.dosen_id) ? [...formData.dosen_id] : (formData.dosen_id ? [formData.dosen_id] : []);

                                                            if (e.target.checked) {
                                                                if (!newDosenIds.includes(id)) newDosenIds.push(id);
                                                            } else {
                                                                newDosenIds = newDosenIds.filter(val => val !== id);
                                                            }

                                                            setFormData({
                                                                ...formData,
                                                                dosen_id: newDosenIds,
                                                                catatan: newDosenIds.length > 1 ? 'Team Teaching' : formData.catatan
                                                            });
                                                        }}
                                                        className="mt-1 mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium text-gray-900">
                                                                {lecturer.nama_lengkap}
                                                            </span>
                                                            {getCategoryBadge(lecturer.assignmentCategory)}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            {lecturer.nidn && `NIDN: ${lecturer.nidn} • `}
                                                            {lecturer.prodi?.nama}
                                                            {lecturer.prodi?.fakultas && (
                                                                ` • ${lecturer.prodi.fakultas.nama}`
                                                            )}
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                            {availableLecturers.filter(l => !l.hidden).length === 0 && (
                                                <div className="text-center py-4 text-gray-500 text-sm">Dosen tidak ditemukan</div>
                                            )}
                                        </div>
                                    )}
                                    {Array.isArray(formData.dosen_id) && formData.dosen_id.length > 1 && (
                                        <div className="mt-2 text-xs font-semibold text-blue-600 flex items-center gap-1 bg-blue-50 p-2 rounded border border-blue-100">
                                            <Users className="w-3 h-3" />
                                            Mode Team Teaching Otomatis Aktif
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Semester & Year */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Semester *
                                    </label>
                                    <select
                                        value={formData.semester}
                                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                    >
                                        <option value="Ganjil">Ganjil</option>
                                        <option value="Genap">Genap</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tahun Ajaran *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tahun_ajaran}
                                        onChange={(e) => setFormData({ ...formData, tahun_ajaran: e.target.value })}
                                        placeholder="2025/2026"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Catatan
                                </label>
                                <textarea
                                    value={formData.catatan}
                                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                                    placeholder="Catatan tambahan (opsional)..."
                                    rows="3"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={!formData.mata_kuliah_id || (!formData.dosen_id || (Array.isArray(formData.dosen_id) && formData.dosen_id.length === 0))}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Check className="w-5 h-5" />
                                    Tugaskan Dosen
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit/Tambah Dosen Modal */}
            {showDosenModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {editingDosen ? 'Edit Data Dosen' : 'Tambah Dosen Baru'}
                            </h2>
                            <button onClick={handleCloseDosenModal} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDosen} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Lengkap *
                                </label>
                                <input
                                    type="text"
                                    value={dosenFormData.nama_lengkap}
                                    onChange={(e) => setDosenFormData({ ...dosenFormData, nama_lengkap: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                    placeholder="Dr. John Doe, M.Kom"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    NIDN
                                </label>
                                <input
                                    type="text"
                                    value={dosenFormData.nidn}
                                    onChange={(e) => setDosenFormData({ ...dosenFormData, nidn: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                    placeholder="0123456789"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={dosenFormData.email}
                                    onChange={(e) => setDosenFormData({ ...dosenFormData, email: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                    placeholder="dosen@email.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={dosenFormData.status}
                                    onChange={(e) => setDosenFormData({ ...dosenFormData, status: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                >
                                    <option value="Aktif">Aktif</option>
                                    <option value="Cuti">Cuti</option>
                                    <option value="Keluar">Keluar</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={handleCloseDosenModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={!dosenFormData.nama_lengkap}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Check className="w-5 h-5" />
                                    {editingDosen ? 'Simpan Perubahan' : 'Tambah Dosen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
