
import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Calendar,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    Save,
    User,
    Users,
    AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from '../lib/axios';
import useAuthStore from '../store/useAuthStore';

const KaprodiMKAktifPage = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Data States
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState('Ganjil'); // Default
    const [masterCourses, setMasterCourses] = useState([]);
    const [activeCourses, setActiveCourses] = useState([]); // From MKAktif
    const [lecturers, setLecturers] = useState([]);

    // UI States
    const [filterSemesterMK, setFilterSemesterMK] = useState('all'); // Filter master courses by their default semester (1-8)

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedYear && selectedSemester) {
            fetchActiveCourses();
        }
    }, [selectedYear, selectedSemester]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [yearsRes, coursesRes, lecturersRes] = await Promise.all([
                axios.get('/academic-years'),
                axios.get('/academic-years/courses/all'),
                axios.get('/lecturer-assignments/available-lecturers')
            ]);

            setAcademicYears(yearsRes.data);
            setMasterCourses(coursesRes.data);
            setLecturers(lecturersRes.data.lecturers || []);

            // Set default selected year to active one
            const activeYear = yearsRes.data.find(y => y.is_active);
            if (activeYear) {
                setSelectedYear(activeYear.id);
                setSelectedSemester(activeYear.active_semester || 'Ganjil');
            } else if (yearsRes.data.length > 0) {
                setSelectedYear(yearsRes.data[0].id);
            }

        } catch (error) {
            console.error('Failed to fetch initial data:', error);
            toast.error('Gagal memuat data awal');
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveCourses = async () => {
        try {
            const res = await axios.get('/mk-aktif', {
                params: {
                    tahun_akademik_id: selectedYear,
                    semester: selectedSemester,
                    prodi_id: user.prodi_id
                }
            });
            setActiveCourses(res.data);
        } catch (error) {
            console.error('Failed to fetch active courses:', error);
            toast.error('Gagal memuat data MK Aktif');
        }
    };

    const handleToggleActive = async (courseId, currentState) => {
        const isActive = !currentState;

        // Find existing record or prepare new data
        const existingRecord = activeCourses.find(mk => mk.mata_kuliah_id === courseId);

        const payload = {
            mata_kuliah_id: courseId,
            prodi_id: user.prodi_id,
            tahun_akademik_id: selectedYear,
            semester: selectedSemester,
            is_active: isActive,
            // Preserve existing data if any
            angkatan_target: existingRecord?.angkatan_target || [],
            dosen_pengampu_id: existingRecord?.dosen_pengampu_id || null
        };

        try {
            await axios.post('/mk-aktif', payload);
            toast.success(isActive ? 'Mata Kuliah diaktifkan' : 'Mata Kuliah dinonaktifkan');
            fetchActiveCourses();
        } catch (error) {
            toast.error('Gagal memperbarui status MK');
        }
    };

    const handleUpdateDetails = async (courseId, field, value) => {
        const existingRecord = activeCourses.find(mk => mk.mata_kuliah_id === courseId);

        if (!existingRecord) {
            // Should activate first before editing details, but we can auto-activate
            toast.error('Aktifkan mata kuliah terlebih dahulu');
            return;
        }

        const payload = {
            ...existingRecord, // Contains all needed IDs
            mata_kuliah_id: courseId, // Ensure explicit
            prodi_id: user.prodi_id,
            tahun_akademik_id: selectedYear,
            semester: selectedSemester,
            [field]: value
        };

        try {
            await axios.post('/mk-aktif', payload);
            fetchActiveCourses(); // Refresh to ensure sync
        } catch (error) {
            toast.error('Gagal memperbarui detail');
        }
    };

    // Calculate Angkatan Options (e.g., last 4 years)
    const currentYear = new Date().getFullYear();
    const angkatanOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

    // Merged Data for Rendering
    const getMergedCourses = () => {
        return masterCourses.map(master => {
            const active = activeCourses.find(a => a.mata_kuliah_id === master.id);
            return {
                ...master,
                isActive: !!active?.is_active,
                angkatan_target: active?.angkatan_target || [],
                dosen_pengampu_id: active?.dosen_pengampu_id || ''
            };
        });
    };

    const filteredCourses = getMergedCourses().filter(course => {
        const matchesSearch = course.nama_mk.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.kode_mk.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSemester = filterSemesterMK === 'all' || course.semester.toString() === filterSemesterMK;

        return matchesSearch && matchesSemester;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen className="text-blue-600" />
                        Distribusi Mata Kuliah
                    </h1>
                    <p className="text-gray-500 mt-1">Kelola Mata Kuliah Aktif per Semester</p>
                </div>
            </div>

            {/* Controls Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Akademik</label>
                        <select
                            value={selectedYear || ''}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {academicYears.map(year => (
                                <option key={year.id} value={year.id}>{year.name} {year.is_active ? '(Aktif)' : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                        <select
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Ganjil">Ganjil</option>
                            <option value="Genap">Genap</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <div className="w-full bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm border border-blue-100 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {activeCourses.length} Mata Kuliah Aktif
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 bg-white border p-1 rounded-lg shadow-sm">
                    <button
                        onClick={() => setFilterSemesterMK('all')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterSemesterMK === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Semua
                    </button>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <button
                            key={sem}
                            onClick={() => setFilterSemesterMK(sem.toString())}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterSemesterMK === sem.toString() ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Sem {sem}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Cari Mata Kuliah..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-3 w-16">Status</th>
                                <th className="px-6 py-3">Kode & Mata Kuliah</th>
                                <th className="px-6 py-3 w-24">SKS</th>
                                <th className="px-6 py-3 w-24">Sem. Asal</th>
                                <th className="px-6 py-3 w-64">Target Angkatan</th>
                                <th className="px-6 py-3 w-64">Koordinator</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : filteredCourses.length > 0 ? (
                                filteredCourses.map((course) => (
                                    <tr key={course.id} className={`hover:bg-gray-50/50 ${course.isActive ? 'bg-blue-50/10' : ''}`}>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleActive(course.id, course.isActive)}
                                                className={`p-2 rounded-lg transition-colors ${course.isActive
                                                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                    }`}
                                                title={course.isActive ? "Nonaktifkan" : "Aktifkan"}
                                            >
                                                {course.isActive ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{course.nama_mk}</div>
                                            <div className="text-xs text-gray-500">{course.kode_mk}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {course.sks} SKS
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            Sem {course.semester}
                                        </td>
                                        <td className="px-6 py-4">
                                            {course.isActive && (
                                                <div className="flex flex-wrap gap-1">
                                                    {angkatanOptions.map(angkatan => {
                                                        const isSelected = course.angkatan_target.includes(angkatan);
                                                        return (
                                                            <button
                                                                key={angkatan}
                                                                onClick={() => {
                                                                    const newTarget = isSelected
                                                                        ? course.angkatan_target.filter(a => a !== angkatan)
                                                                        : [...course.angkatan_target, angkatan];
                                                                    handleUpdateDetails(course.id, 'angkatan_target', newTarget);
                                                                }}
                                                                className={`text-xs px-2 py-1 rounded border transition-colors ${isSelected
                                                                        ? 'bg-blue-100 border-blue-200 text-blue-700'
                                                                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                {angkatan}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {course.isActive && (
                                                <select
                                                    value={course.dosen_pengampu_id || ''}
                                                    onChange={(e) => handleUpdateDetails(course.id, 'dosen_pengampu_id', e.target.value)}
                                                    className="w-full text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="">-- Pilih Koordinator --</option>
                                                    {lecturers.map(dosen => (
                                                        <option key={dosen.id} value={dosen.user_id}>
                                                            {dosen.nama_lengkap}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Tidak ada mata kuliah ditemukan</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default KaprodiMKAktifPage;
