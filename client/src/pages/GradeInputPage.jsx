import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Download, Calculator, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import axios from '../lib/axios';

export default function GradeInputPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [components, setComponents] = useState([]);
    const [students, setStudents] = useState([]);
    const [grades, setGrades] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState(null);

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

            // Fetch components
            const componentsRes = await axios.get('/api/grading/components', {
                params: { mataKuliahId: courseId, semester, tahunAjaran }
            });
            setComponents(componentsRes.data);

            if (componentsRes.data.length > 0) {
                setSelectedComponent(componentsRes.data[0].id);
            }

            // Fetch students (TODO: create endpoint to get students enrolled in course)
            // For now, fetch all students from prodi
            // const studentsRes = await axios.get('/api/students', {
            //     params: { prodiId: courseRes.data.prodi_id }
            // });
            // setStudents(studentsRes.data);

            // Mock students for demo
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
        if (selectedComponent) {
            fetchGrades(selectedComponent);
        }
    }, [selectedComponent]);

    const fetchGrades = async (componentId) => {
        try {
            const res = await axios.get('/api/grading/student-grades', {
                params: {
                    mataKuliahId: courseId,
                    componentId
                }
            });

            const gradesMap = {};
            res.data.forEach(grade => {
                gradesMap[grade.mahasiswa_id] = {
                    nilai_angka: grade.nilai_angka,
                    nilai_huruf: grade.nilai_huruf,
                    nilai_ip: grade.nilai_ip
                };
            });
            setGrades(gradesMap);
        } catch (error) {
            console.error('Error fetching grades:', error);
        }
    };

    const handleGradeChange = useCallback(async (mahasiswaId, nilai) => {
        if (nilai === '' || (nilai >= 0 && nilai <= 100)) {
            setGrades(prev => ({
                ...prev,
                [mahasiswaId]: {
                    ...prev[mahasiswaId],
                    nilai_angka: nilai,
                    saving: true
                }
            }));

            // Debounced save
            if (nilai !== '') {
                try {
                    setSaving(true);
                    const res = await axios.post('/api/grading/student-grades', {
                        mahasiswa_id: mahasiswaId,
                        mata_kuliah_id: parseInt(courseId),
                        assessment_component_id: selectedComponent,
                        nilai_angka: parseFloat(nilai)
                    });

                    setGrades(prev => ({
                        ...prev,
                        [mahasiswaId]: {
                            nilai_angka: res.data.nilai_angka,
                            nilai_huruf: res.data.nilai_huruf,
                            nilai_ip: res.data.nilai_ip,
                            saving: false
                        }
                    }));
                } catch (error) {
                    console.error('Error saving grade:', error);
                    alert('Failed to save grade');
                } finally {
                    setSaving(false);
                }
            }
        }
    }, [courseId, selectedComponent]);

    const handleCalculateFinalGrades = async () => {
        if (!confirm('Calculate final grades for all students? This will compute weighted averages.')) return;

        try {
            setSaving(true);
            const promises = students.map(student =>
                axios.post('/api/grading/final-grades/calculate', {
                    mahasiswaId: student.id,
                    mataKuliahId: parseInt(courseId),
                    semester,
                    tahunAjaran
                })
            );

            await Promise.all(promises);
            alert('Final grades calculated successfully!');
        } catch (error) {
            console.error('Error calculating final grades:', error);
            alert(error.response?.data?.message || 'Failed to calculate final grades');
        } finally {
            setSaving(false);
        }
    };

    const selectedComponentData = components.find(c => c.id === selectedComponent);

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    if (components.length === 0) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">No Assessment Components</h2>
                <p className="text-gray-600 mb-4">
                    Please set up assessment components first
                </p>
                <button
                    onClick={() => navigate(`/dosen/courses/${courseId}/assessment-setup`)}
                    className="btn btn-primary"
                >
                    Go to Assessment Setup
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <button
                        onClick={() => navigate(`/dosen/courses/${courseId}/assessment-setup`)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Assessment Setup
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Grade Input</h1>
                    <p className="text-gray-600 mt-1">
                        {course?.kode_mk} - {course?.nama_mk}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleCalculateFinalGrades}
                        disabled={saving}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Calculator className="w-5 h-5" />
                        Calculate Final Grades
                    </button>
                    <button className="btn btn-secondary flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        Export
                    </button>
                </div>
            </div>

            {/* Component Tabs */}
            <div className="card p-4">
                <div className="flex gap-2 overflow-x-auto">
                    {components.map(comp => (
                        <button
                            key={comp.id}
                            onClick={() => setSelectedComponent(comp.id)}
                            className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${selectedComponent === comp.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            {comp.component_type === 'legacy' ? comp.legacy_type : `Sub-CPMK ${comp.sub_cpmk_id}`}
                            <span className="ml-2 text-sm opacity-75">
                                ({comp.component_type === 'legacy' ? comp.legacy_weight : comp.obe_weight}%)
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Grading Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-6 py-3 text-sm font-semibold w-32">NPM</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold">Nama Mahasiswa</th>
                                <th className="text-center px-6 py-3 text-sm font-semibold w-32">Nilai (0-100)</th>
                                <th className="text-center px-6 py-3 text-sm font-semibold w-24">Huruf</th>
                                <th className="text-center px-6 py-3 text-sm font-semibold w-24">IP</th>
                                <th className="text-center px-6 py-3 text-sm font-semibold w-24">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {students.map(student => {
                                const grade = grades[student.id] || {};
                                return (
                                    <tr key={student.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-mono text-sm">{student.npm}</td>
                                        <td className="px-6 py-4">{student.nama}</td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                value={grade.nilai_angka || ''}
                                                onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                className="w-full border rounded px-3 py-1 text-center focus:ring-2 focus:ring-blue-500"
                                                placeholder="0-100"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {grade.nilai_huruf ? (
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${['A', 'A-'].includes(grade.nilai_huruf) ? 'bg-green-100 text-green-800' :
                                                        ['B+', 'B', 'B-'].includes(grade.nilai_huruf) ? 'bg-blue-100 text-blue-800' :
                                                            ['C+', 'C'].includes(grade.nilai_huruf) ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                    }`}>
                                                    {grade.nilai_huruf}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center font-semibold">
                                            {grade.nilai_ip ? grade.nilai_ip.toFixed(2) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {grade.saving ? (
                                                <span className="text-amber-600 text-sm">Saving...</span>
                                            ) : grade.nilai_angka ? (
                                                <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Summary */}
                <div className="border-t bg-gray-50 px-6 py-3 flex justify-between text-sm">
                    <div className="text-gray-600">
                        Total Students: <span className="font-semibold">{students.length}</span>
                    </div>
                    <div className="text-gray-600">
                        Graded: <span className="font-semibold text-green-600">
                            {Object.keys(grades).length}
                        </span> / {students.length}
                    </div>
                    <div className="text-gray-600">
                        Completion: <span className="font-semibold">
                            {((Object.keys(grades).length / students.length) * 100).toFixed(0)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="card p-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Enter scores (0-100) for each student</li>
                    <li>• Grades auto-save and convert to Huruf + IP</li>
                    <li>• Complete all components before calculating final grades</li>
                    <li>• Final grade = weighted average of all components</li>
                </ul>
            </div>

            {saving && (
                <div className="fixed bottom-4 right-4 bg-amber-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <Save className="w-4 h-4 animate-spin" />
                    Saving...
                </div>
            )}
        </div>
    );
}
