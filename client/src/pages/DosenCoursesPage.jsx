import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import { BookOpen, GraduationCap, Calendar } from 'lucide-react';

export default function DosenCoursesPage() {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [rpsList, setRpsList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [assignmentsRes, rpsRes] = await Promise.all([
                axios.get('/lecturer-assignments'),
                axios.get('/rps')
            ]);
            setAssignments(assignmentsRes.data);
            setRpsList(rpsRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRpsForCourse = (courseId, semester, tahunAjaran) => {
        return rpsList.find(rps =>
            rps.mata_kuliah_id === courseId &&
            rps.semester === semester &&
            rps.tahun_ajaran === tahunAjaran
        );
    };

    if (loading) return <div className="p-6 text-center text-gray-500">Memuat mata kuliah...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Mata Kuliah Saya</h1>

            {assignments.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Belum Ada Mata Kuliah</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        Anda belum ditugaskan untuk mengampu mata kuliah apapun pada semester ini. Hubungi Kaprodi jika ini adalah kesalahan.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.map((assignment) => {
                        // Skip if mata_kuliah is missing (deleted or integrity issue)
                        if (!assignment.mata_kuliah) return null;

                        const rps = getRpsForCourse(
                            assignment.mata_kuliah.id,
                            assignment.semester,
                            assignment.tahun_ajaran
                        );

                        return (
                            <div key={assignment.id} className="card p-6 flex flex-col h-full hover:shadow-lg transition-all duration-200 border border-transparent hover:border-primary-100 dark:hover:border-primary-900">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="inline-block px-2.5 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold rounded-md mb-2">
                                            {assignment.mata_kuliah.kode_mk}
                                        </span>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                                            {assignment.mata_kuliah.nama_mk}
                                        </h3>
                                    </div>
                                    <span className="flex-shrink-0 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                        {assignment.mata_kuliah.sks} SKS
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6 flex-grow">
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                        <Calendar className="w-4 h-4 mr-2.5 text-gray-400" />
                                        <span>Semester {assignment.semester} {assignment.tahun_ajaran}</span>
                                    </div>
                                    {assignment.catatan && (
                                        <div className="flex items-start text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                                            <span className="text-xs italic line-clamp-2">"{assignment.catatan}"</span>
                                        </div>
                                    )}

                                    {/* RPS Status Badge */}
                                    <div className="flex items-center mt-2">
                                        {rps ? (
                                            <span className={`text-xs px-2 py-1 rounded-full border ${rps.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                rps.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    'bg-gray-50 text-gray-700 border-gray-200'
                                                }`}>
                                                RPS: {rps.status}
                                            </span>
                                        ) : (
                                            // Check if ANY RPS exists for this course (wrong semester/year)
                                            rpsList.some(r => r.mata_kuliah_id === assignment.mata_kuliah.id) ? (
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                                                        RPS: Beda Semester
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        Cek semester/tahun di RPS
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                                                    RPS: Belum Dibuat
                                                </span>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        onClick={() => navigate(`/dosen/rps/${assignment.mata_kuliah.id}`)}
                                        className="btn btn-sm btn-primary flex items-center justify-center gap-2"
                                    >
                                        <BookOpen size={16} />
                                        Kelola RPS
                                    </button>
                                    <button
                                        onClick={() => navigate(`/dosen/courses/${assignment.mata_kuliah.id}/grades`)}
                                        className="btn btn-outline btn-sm flex items-center justify-center gap-2"
                                    >
                                        <GraduationCap size={16} />
                                        Nilai
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
