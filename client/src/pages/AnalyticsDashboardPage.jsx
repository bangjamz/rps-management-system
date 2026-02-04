import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, BookOpen, FileText } from 'lucide-react';
import axios from '../lib/axios';

export default function AnalyticsDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [semester, setSemester] = useState('Ganjil');
    const [tahunAjaran, setTahunAjaran] = useState('2025/2026');

    // Chart data
    const [gradeData, setGradeData] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [cplData, setCplData] = useState([]);

    useEffect(() => {
        fetchDashboardStats();
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) {
            fetchGradeDistribution();
            fetchAttendanceTrends();
        }
    }, [selectedCourse, semester, tahunAjaran]);

    const fetchDashboardStats = async () => {
        try {
            const res = await axios.get('/api/analytics/dashboard/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await axios.get('/api/analytics/courses');
            setCourses(res.data);
            if (res.data.length > 0) {
                setSelectedCourse(res.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGradeDistribution = async () => {
        try {
            const res = await axios.get('/api/analytics/grade-distribution', {
                params: {
                    mata_kuliah_id: selectedCourse,
                    semester,
                    tahun_ajaran: tahunAjaran
                }
            });
            setGradeData(res.data);
        } catch (error) {
            console.error('Error fetching grade distribution:', error);
        }
    };

    const fetchAttendanceTrends = async () => {
        try {
            const res = await axios.get('/api/analytics/attendance-trends', {
                params: {
                    mata_kuliah_id: selectedCourse,
                    semester,
                    tahun_ajaran: tahunAjaran
                }
            });
            setAttendanceData(res.data);
        } catch (error) {
            console.error('Error fetching attendance trends:', error);
        }
    };

    const fetchCPLAttainment = async () => {
        try {
            const res = await axios.get('/api/analytics/cpl-attainment', {
                params: {
                    prodi_id: 1, // TODO: Get from user context
                    tahun_ajaran: tahunAjaran
                }
            });
            setCplData(res.data);
        } catch (error) {
            console.error('Error fetching CPL attainment:', error);
        }
    };

    useEffect(() => {
        fetchCPLAttainment();
    }, [tahunAjaran]);

    if (loading) {
        return <div className="p-6">Loading analytics...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600 mt-1">Visualize grades, attendance, and learning outcomes</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Students</p>
                            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalStudents || 0}</p>
                        </div>
                        <Users className="w-10 h-10 text-blue-600 opacity-50" />
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Courses</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">{stats.totalCourses || 0}</p>
                        </div>
                        <BookOpen className="w-10 h-10 text-green-600 opacity-50" />
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active RPS</p>
                            <p className="text-3xl font-bold text-purple-600 mt-1">{stats.activeRPS || 0}</p>
                        </div>
                        <FileText className="w-10 h-10 text-purple-600 opacity-50" />
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Draft RPS</p>
                            <p className="text-3xl font-bold text-orange-600 mt-1">{stats.draftRPS || 0}</p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-orange-600 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-6">
                <h2 className="font-semibold mb-4">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Course</label>
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>
                                    {course.kode_mk} - {course.nama_mk}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Semester</label>
                        <select
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="Ganjil">Ganjil</option>
                            <option value="Genap">Genap</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Academic Year</label>
                        <input
                            type="text"
                            value={tahunAjaran}
                            onChange={(e) => setTahunAjaran(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="2025/2026"
                        />
                    </div>
                </div>
            </div>

            {/* Grade Distribution Chart */}
            <div className="card p-6">
                <h2 className="font-semibold mb-4">Grade Distribution</h2>
                {gradeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={gradeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="grade" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#3b82f6" name="Number of Students" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center text-gray-500 py-12">
                        No grade data available for this course
                    </div>
                )}
            </div>

            {/* Attendance Trends Chart */}
            <div className="card p-6">
                <h2 className="font-semibold mb-4">Attendance Trends</h2>
                {attendanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={attendanceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottom', offset: -5 }} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="Hadir" stroke="#10b981" strokeWidth={2} name="Present" />
                            <Line type="monotone" dataKey="Izin" stroke="#f59e0b" strokeWidth={2} name="Excused" />
                            <Line type="monotone" dataKey="Sakit" stroke="#6366f1" strokeWidth={2} name="Sick" />
                            <Line type="monotone" dataKey="Alpa" stroke="#ef4444" strokeWidth={2} name="Absent" />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center text-gray-500 py-12">
                        No attendance data available for this course
                    </div>
                )}
            </div>

            {/* CPL Attainment Chart */}
            <div className="card p-6">
                <h2 className="font-semibold mb-4">CPL Attainment (Program Level)</h2>
                {cplData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <RadarChart data={cplData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="cpl" />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} />
                            <Radar name="Attainment %" dataKey="attainment" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                            <Tooltip />
                            <Legend />
                        </RadarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center text-gray-500 py-12">
                        No CPL attainment data available
                    </div>
                )}
            </div>
        </div>
    );
}
