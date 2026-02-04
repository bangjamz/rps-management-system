import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, CheckCircle, Users, Calendar, BookOpen, ArrowLeft } from 'lucide-react';
import axios from '../lib/axios';

export default function AttendanceMarkingPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [rps, setRps] = useState(null);
    const [pertemuanList, setPertemuanList] = useState([]);
    const [selectedPertemuan, setSelectedPertemuan] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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

            // TODO: Fetch RPS and pertemuan from actual endpoint
            // For now, mock data
            const mockPertemuan = [
                { id: 1, pertemuan_ke: 1, topik: 'Pengenalan Algoritma', tanggal: '2025-09-01' },
                { id: 2, pertemuan_ke: 2, topik: 'Variabel dan Tipe Data', tanggal: '2025-09-08' },
                { id: 3, pertemuan_ke: 3, topik: 'Percabangan', tanggal: '2025-09-15' }
            ];
            setPertemuanList(mockPertemuan);
            setSelectedPertemuan(mockPertemuan[0]);

            // Mock students
            setStudents([
                { id: 1, npm: '2024123', nama: 'Agus Santoso' },
                { id: 2, npm: '2024142', nama: 'Bambang Wijaya' },
                { id: 3, npm: '2024235', nama: 'Citra Dewi' }
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedPertemuan) {
            fetchAttendance(selectedPertemuan.id);
        }
    }, [selectedPertemuan]);

    const fetchAttendance = async (pertemuanId) => {
        try {
            const res = await axios.get(`/api/attendance/pertemuan/${pertemuanId}`);

            const attendanceMap = {};
            res.data.attendance.forEach(record => {
                attendanceMap[record.mahasiswa.id] = {
                    status: record.status,
                    notes: record.notes || ''
                };
            });
            setAttendance(attendanceMap);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            setAttendance({});
        }
    };

    const handleStatusChange = (mahasiswaId, status) => {
        setAttendance(prev => ({
            ...prev,
            [mahasiswaId]: {
                ...prev[mahasiswaId],
                status
            }
        }));
    };

    const handleNotesChange = (mahasiswaId, notes) => {
        setAttendance(prev => ({
            ...prev,
            [mahasiswaId]: {
                ...prev[mahasiswaId],
                notes
            }
        }));
    };

    const handleMarkAllPresent = () => {
        const updatedAttendance = {};
        students.forEach(student => {
            updatedAttendance[student.id] = {
                status: 'Hadir',
                notes: ''
            };
        });
        setAttendance(updatedAttendance);
    };

    const handleSave = async () => {
        if (!selectedPertemuan) return;

        try {
            setSaving(true);
            const attendanceData = students.map(student => ({
                mahasiswa_id: student.id,
                status: attendance[student.id]?.status || 'Hadir',
                notes: attendance[student.id]?.notes || ''
            }));

            await axios.post('/api/attendance/bulk-mark', {
                rps_pertemuan_id: selectedPertemuan.id,
                attendance: attendanceData
            });

            alert('Attendance saved successfully!');
        } catch (error) {
            console.error('Error saving attendance:', error);
            alert('Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    const summary = {
        total: students.length,
        hadir: students.filter(s => attendance[s.id]?.status === 'Hadir').length,
        izin: students.filter(s => attendance[s.id]?.status === 'Izin').length,
        sakit: students.filter(s => attendance[s.id]?.status === 'Sakit').length,
        alpa: students.filter(s => attendance[s.id]?.status === 'Alpa').length
    };

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <button
                    onClick={() => navigate('/dosen/courses')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Courses
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Attendance Marking</h1>
                <p className="text-gray-600 mt-1">
                    {course?.kode_mk} - {course?.nama_mk}
                </p>
            </div>

            {/* Pertemuan Selector */}
            <div className="card p-4">
                <label className="block text-sm font-medium mb-2">Select Meeting:</label>
                <select
                    value={selectedPertemuan?.id || ''}
                    onChange={(e) => {
                        const pertemuan = pertemuanList.find(p => p.id === parseInt(e.target.value));
                        setSelectedPertemuan(pertemuan);
                    }}
                    className="w-full md:w-96 border rounded-lg px-4 py-2"
                >
                    {pertemuanList.map(p => (
                        <option key={p.id} value={p.id}>
                            Pertemuan {p.pertemuan_ke} - {p.topik} ({p.tanggal})
                        </option>
                    ))}
                </select>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
                <button
                    onClick={handleMarkAllPresent}
                    className="btn btn-secondary flex items-center gap-2"
                >
                    <CheckCircle className="w-5 h-5" />
                    Mark All Present
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Attendance'}
                </button>
            </div>

            {/* Attendance Table */}
            <div className="card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-6 py-3 text-sm font-semibold w-32">NPM</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold">Nama</th>
                            <th className="text-center px-6 py-3 text-sm font-semibold">Status</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {students.map(student => {
                            const studentAttendance = attendance[student.id] || { status: 'Hadir', notes: '' };
                            return (
                                <tr key={student.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-sm">{student.npm}</td>
                                    <td className="px-6 py-4">{student.nama}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-4">
                                            {['Hadir', 'Izin', 'Sakit', 'Alpa'].map(status => (
                                                <label key={status} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`status-${student.id}`}
                                                        value={status}
                                                        checked={studentAttendance.status === status}
                                                        onChange={() => handleStatusChange(student.id, status)}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className={`text-sm ${status === 'Hadir' ? 'text-green-700' :
                                                            status === 'Izin' ? 'text-blue-700' :
                                                                status === 'Sakit' ? 'text-yellow-700' :
                                                                    'text-red-700'
                                                        }`}>
                                                        {status}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="text"
                                            value={studentAttendance.notes}
                                            onChange={(e) => handleNotesChange(student.id, e.target.value)}
                                            placeholder="Optional notes..."
                                            className="w-full border rounded px-3 py-1 text-sm"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Summary */}
                <div className="border-t bg-gray-50 px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-gray-700">Summary:</div>
                        <div className="flex gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                <span>Hadir: <strong>{summary.hadir}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                <span>Izin: <strong>{summary.izin}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                <span>Sakit: <strong>{summary.sakit}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                <span>Alpa: <strong>{summary.alpa}</strong></span>
                            </div>
                            <div className="font-semibold">
                                Total: {summary.total}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="card p-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Status Guide:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Hadir</strong>: Student present</li>
                    <li>• <strong>Izin</strong>: Excused absence (dengan izin)</li>
                    <li>• <strong>Sakit</strong>: Sick leave</li>
                    <li>• <strong>Alpa</strong>: Unexcused absence (tanpa keterangan)</li>
                </ul>
            </div>
        </div>
    );
}
