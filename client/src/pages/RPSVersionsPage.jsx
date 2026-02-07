import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import { FileText, Clock, User, Plus, Eye, History, ArrowRight, Layout, Check, RotateCcw } from 'lucide-react';

import useAuthStore from '../store/useAuthStore';

export default function RPSVersionsPage() {
    const { user } = useAuthStore();
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [versions, setVersions] = useState([]);

    const basePath = user?.role === 'dosen' ? '/dosen' : '/kaprodi';

    useEffect(() => {
        if (courseId) {
            loadData();
        }
    }, [courseId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch course
            const courseRes = await axios.get(`/courses/${courseId}`);
            setCourse(courseRes.data);

            // Fetch versions
            const versionsRes = await axios.get(`/rps/versions/${courseId}`);
            setVersions(versionsRes.data);

        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRevision = async (latestRpsId) => {
        if (!window.confirm('Buat revisi baru dari versi ini?')) return;

        try {
            const res = await axios.post(`/rps/dosen/${latestRpsId}/revise`);
            // Navigate to edit the new revision
            navigate(`${basePath}/rps/${res.data.rps.id}/edit`);
        } catch (error) {
            console.error('Failed to create revision:', error);
            alert(error.response?.data?.message || 'Gagal membuat revisi');
        }
    };

    const handleApproveRPS = async (rpsId) => {
        if (!window.confirm('Setujui RPS ini sebagai versi final untuk semester ini?')) return;

        try {
            await axios.put(`/rps/${rpsId}/approve`);
            alert('RPS berhasil disetujui!');
            loadData(); // Refresh list
        } catch (error) {
            console.error('Failed to approve RPS:', error);
            alert(error.response?.data?.message || 'Gagal menyetujui RPS');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-700';
            case 'submitted': return 'bg-orange-100 text-orange-700';
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Memuat riwayat RPS...</div>;

    // Separate Template vs Implementations (Lecturer Versions)
    const templates = versions.filter(v => v.is_template);
    const implementations = versions.filter(v => !v.is_template);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate(`${basePath}/courses`)} className="btn btn-ghost">
                    ← Kembali ke Kursus
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Kelola RPS
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {course?.kode_mk} - {course?.nama_mk}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Versions List */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Template Section (Optional view for context) */}
                    {templates.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                <Layout className="w-5 h-5" />
                                Template Prodi
                            </h2>
                            <div className="space-y-3">
                                {templates.map(rps => (
                                    <div key={rps.id} className="card p-4 flex items-center justify-between border-l-4 border-blue-500">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-gray-900">Versi {rps.revision}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(rps.status)}`}>
                                                    {rps.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Updated: {new Date(rps.updated_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`${basePath}/rps/${rps.id}/edit`)} // Or view
                                            className="btn btn-sm btn-outline"
                                        >
                                            Lihat Template
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Implementations List */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <History className="w-5 h-5" />
                                Riwayat Implementasi
                            </h2>
                            {/* Button to create new RPS when nothing exists */}
                            {versions.length === 0 && (
                                <button
                                    onClick={() => navigate(`${basePath}/rps/create?courseId=${courseId}`)}
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    <Plus size={18} /> Buat RPS Baru
                                </button>
                            )}
                        </div>

                        {implementations.length === 0 ? (
                            <div className="card p-8 text-center bg-gray-50 border-dashed border-2 border-gray-200">
                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 mb-2">Belum ada RPS yang dibuat untuk mata kuliah ini.</p>
                                <p className="text-xs text-gray-400 mb-4 max-w-xs mx-auto">
                                    Jika Anda merasa sudah membuat RPS, pastikan Anda memilih mata kuliah yang benar.
                                    Cek menu "Kelola RPS" di sidebar untuk melihat semua RPS yang pernah Anda buat.
                                </p>
                                <button
                                    onClick={() => navigate(`${basePath}/rps/create?courseId=${courseId}`)}
                                    className="btn btn-primary mx-auto flex items-center gap-2"
                                >
                                    <Plus size={18} /> Mulai Buat RPS
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {implementations.map((rps) => (
                                    <div key={rps.id} className="card p-5 transition-all hover:shadow-md">
                                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                                        Revisi {rps.revision}
                                                    </span>
                                                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full uppercase ${getStatusColor(rps.status)}`}>
                                                        {rps.status}
                                                    </span>
                                                </div>

                                                {/* Edit/Continue Button for Drafts */}
                                                {rps.status === 'draft' && (
                                                    <div className="mb-3">
                                                        <button
                                                            onClick={() => navigate(`${basePath}/rps/${rps.id}/edit`)}
                                                            className="btn btn-sm btn-primary w-full sm:w-auto"
                                                        >
                                                            Lanjutkan Edit Draft
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4" />
                                                        <span>{rps.dosen?.nama_lengkap}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{new Date(rps.updated_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 col-span-2 mt-1">
                                                        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">
                                                            Sem. {rps.semester} {rps.tahun_ajaran}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-start sm:self-center">
                                                <button
                                                    onClick={() => navigate(`${basePath}/rps/view/${rps.id}`)}
                                                    className="btn btn-secondary btn-sm flex items-center gap-1"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Lihat
                                                </button>

                                                {/* Kaprodi Action: Approve Submitted RPS */}
                                                {user?.role === 'kaprodi' && rps.status === 'submitted' && (
                                                    <button
                                                        onClick={() => handleApproveRPS(rps.id)}
                                                        className="btn btn-sm bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                                                    >
                                                        <ArrowRight className="w-4 h-4" />
                                                        Finalisasi / Setujui
                                                    </button>
                                                )}

                                                {/* Only show Edit if not draft (draft has button above) or logic permits */}
                                                {rps.status !== 'draft' && (
                                                    <button
                                                        onClick={() => navigate(`${basePath}/rps/${rps.id}/edit`)}
                                                        className="btn btn-outline btn-sm flex items-center gap-1"
                                                    >
                                                        Review / Revisi
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar / Info */}
                <div className="space-y-6">
                    <div className="card p-5 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Status Terkini</h3>
                        {versions.length > 0 ? (
                            <div>
                                <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                                    Versi terbaru adalah <strong>Revisi {versions[0].revision}</strong> dengan status <strong>{versions[0].status}</strong>.
                                </p>
                                {/* Only allow creating new revision if latest is NOT draft (i.e. it's submitted/approved) */}
                                {versions[0].status !== 'draft' && (
                                    <button
                                        onClick={() => handleCreateRevision(versions[0].id)}
                                        className="btn btn-primary w-full shadow-md"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Buat Revisi Baru ({versions[0].revision + 1})
                                    </button>
                                )}
                                {versions[0].status === 'draft' && (
                                    <div className="text-xs bg-yellow-100 text-yellow-800 p-2 rounded">
                                        Revisi tersimpan sebagai Draft. Silakan lanjutkan pengeditan.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                                    Belum ada versi RPS. Klik tombol di bawah untuk membuat RPS baru.
                                </p>
                                <button
                                    onClick={() => navigate(`${basePath}/rps/create?courseId=${courseId}`)}
                                    className="btn btn-primary w-full shadow-md flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Buat RPS Baru
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
