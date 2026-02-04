import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, UserPlus, UserMinus, Upload, Download, ArrowLeft } from 'lucide-react';
import axios from '../lib/axios';

export default function EnrollmentManagementPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [stats, setStats] = useState({});

    const semester = 'Ganjil';
    const tahunAjaran = '2025/2026';

    useEffect(() => {
        fetchData();
    }, [courseId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch course
            const courseRes = await axios.get(`/api/courses/${courseId}`);
            setCourse(courseRes.data);

            // Fetch enrolled students
            const enrolledRes = await axios.get(`/api/enrollment/course/${courseId}`, {
                params: { semester, tahunAjaran, status: 'Active' }
            });
            setEnrolledStudents(enrolledRes.data);

            // Fetch enrollment stats
            const statsRes = await axios.get(`/api/enrollment/course/${courseId}/stats`, {
                params: { semester, tahunAjaran }
            });
            setStats(statsRes.data);

            // Fetch available students (from same prodi, not yet enrolled)
            // TODO: Create endpoint to filter non-enrolled students
            // For now, mock data
            setAvailableStudents([
                { id: 4, npm: '2024301', nama: 'Dewi Lestari' },
                { id: 5, npm: '2024315', nama: 'Eko Prasetyo' }
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (selectedStudents.length === 0) {
            alert('Please select at least one student');
            return;
        }

        try {
            await axios.post('/api/enrollment/enroll', {
                mata_kuliah_id: parseInt(courseId),
                mahasiswa_ids: selectedStudents,
                semester,
                tahun_ajaran: tahunAjaran
            });

            alert(`${selectedStudents.length} student(s) enrolled successfully!`);
            setSelectedStudents([]);
            setShowEnrollModal(false);
            fetchData();
        } catch (error) {
            console.error('Error enrolling students:', error);
            alert('Failed to enroll students');
        }
    };

    const handleUnenroll = async (enrollmentId, studentName) => {
        if (!confirm(`Unenroll ${studentName} from this course?`)) return;

        try {
            await axios.delete(`/api/enrollment/${enrollmentId}`);
            alert('Student unenrolled successfully');
            fetchData();
        } catch (error) {
            console.error('Error unenrolling student:', error);
            alert('Failed to unenroll student');
        }
    };

    const toggleStudentSelection = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <button
                    onClick={() => navigate('/kaprodi/courses')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Courses
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Enrollment Management</h1>
                <p className="text-gray-600 mt-1">
                    {course?.kode_mk} - {course?.nama_mk}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-4">
                    <div className="text-sm text-gray-600">Total Enrolled</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.total || 0}</div>
                </div>
                <div className="card p-4">
                    <div className="text-sm text-gray-600">Active</div>
                    <div className="text-2xl font-bold text-green-600">{stats.active || 0}</div>
                </div>
                <div className="card p-4">
                    <div className="text-sm text-gray-600">Dropped</div>
                    <div className="text-2xl font-bold text-red-600">{stats.dropped || 0}</div>
                </div>
                <div className="card p-4">
                    <div className="text-sm text-gray-600">Completed</div>
                    <div className="text-2xl font-bold text-gray-600">{stats.completed || 0}</div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
                <button
                    onClick={() => setShowEnrollModal(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <UserPlus className="w-5 h-5" />
                    Enroll Students
                </button>
                <div className="flex gap-2">
                    <button className="btn btn-secondary flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Import CSV
                    </button>
                    <button className="btn btn-secondary flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        Export List
                    </button>
                </div>
            </div>

            {/* Enrolled Students Table */}
            <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Enrolled Students ({enrolledStudents.length})
                    </h2>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-6 py-3 text-sm font-semibold">NPM</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold">Nama</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold">Email</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold">Status</th>
                            <th className="text-center px-6 py-3 text-sm font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {enrolledStudents.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                    No students enrolled yet. Click "Enroll Students" to add.
                                </td>
                            </tr>
                        ) : (
                            enrolledStudents.map(enrollment => (
                                <tr key={enrollment.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-sm">
                                        {enrollment.mahasiswa.npm}
                                    </td>
                                    <td className="px-6 py-4">{enrollment.mahasiswa.nama}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {enrollment.mahasiswa.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${enrollment.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                enrollment.status === 'Dropped' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {enrollment.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {enrollment.status === 'Active' && (
                                            <button
                                                onClick={() => handleUnenroll(enrollment.id, enrollment.mahasiswa.nama)}
                                                className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1 mx-auto"
                                            >
                                                <UserMinus className="w-4 h-4" />
                                                Unenroll
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Enroll Modal */}
            {showEnrollModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Enroll Students</h2>
                            <button onClick={() => setShowEnrollModal(false)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <p className="text-sm text-gray-600 mb-4">
                                Select students to enroll in {course?.kode_mk}
                            </p>

                            {availableStudents.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No available students to enroll
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {availableStudents.map(student => (
                                        <label
                                            key={student.id}
                                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.includes(student.id)}
                                                onChange={() => toggleStudentSelection(student.id)}
                                                className="w-5 h-5"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">{student.nama}</div>
                                                <div className="text-sm text-gray-600">NPM: {student.npm}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="border-t px-6 py-4 flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                {selectedStudents.length} student(s) selected
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowEnrollModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEnroll}
                                    disabled={selectedStudents.length === 0}
                                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Enroll {selectedStudents.length > 0 && `(${selectedStudents.length})`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
