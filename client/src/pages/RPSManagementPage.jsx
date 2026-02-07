import { useState, useEffect } from 'react';
import { FileText, Search, Filter, Eye, CheckCircle, XCircle, Clock, FileCheck } from 'lucide-react';
import axios from '../lib/axios';
import useAuthStore from '../store/useAuthStore';
import { exportRPSToPDF } from '../utils/rpsExport';

export default function RPSManagementPage() {
    const { user, canApproveRPS } = useAuthStore();
    const [rpsList, setRpsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedRPS, setSelectedRPS] = useState(null);
    const [approvalAction, setApprovalAction] = useState(null); // 'approve' or 'reject'
    const [catatan, setCatatan] = useState('');
    const [processing, setProcessing] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        semester: '',
        tahunAjaran: ''
    });

    useEffect(() => {
        fetchRPSList();
    }, []);

    const fetchRPSList = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/rps', {
                params: filters
            });
            setRpsList(res.data);
        } catch (error) {
            console.error('Failed to fetch RPS list:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintRPS = async (rpsId) => {
        try {
            // Fetch full details
            const res = await axios.get(`/rps/${rpsId}`);
            const fullRps = res.data;
            // Course info might be inside fullRps.mata_kuliah or need separate fetch if structure differs
            // Based on rpsExport.js, it expects (course, rpsData).
            // Usually rpsData.mata_kuliah is sufficient if populated.
            await exportRPSToPDF(fullRps.mata_kuliah, fullRps);
        } catch (error) {
            console.error('Failed to export PDF:', error);
            alert('Gagal export PDF');
        }
    };

    const handleOpenApprovalModal = (rps, action) => {
        setSelectedRPS(rps);
        setApprovalAction(action);
        setCatatan('');
        setShowApprovalModal(true);
    };

    const handleCloseApprovalModal = () => {
        setShowApprovalModal(false);
        setSelectedRPS(null);
        setApprovalAction(null);
        setCatatan('');
    };

    const handleSubmitApproval = async (e) => {
        e.preventDefault();
        if (!selectedRPS || !approvalAction) return;

        try {
            setProcessing(true);
            const endpoint = `/rps/${selectedRPS.id}/${approvalAction}`;
            await axios.put(endpoint, { catatan_approval: catatan });

            // Refresh list
            await fetchRPSList();
            handleCloseApprovalModal();
        } catch (error) {
            console.error(`Failed to ${approvalAction} RPS:`, error);
            alert(error.response?.data?.message || `Failed to ${approvalAction} RPS`);
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            draft: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
            pending: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
            approved: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
            rejected: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
        };

        const icons = {
            draft: <FileText className="w-3.5 h-3.5" />,
            pending: <Clock className="w-3.5 h-3.5" />,
            approved: <CheckCircle className="w-3.5 h-3.5" />,
            rejected: <XCircle className="w-3.5 h-3.5" />
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border shadow-sm transition-all ${styles[status]}`}>
                {icons[status]}
                <span className="uppercase tracking-wider">
                    {status === 'pending' ? 'Butuh Review' : status === 'approved' ? 'Disetujui' : status === 'rejected' ? 'Ditolak' : 'Draft'}
                </span>
            </span>
        );
    };

    const filteredRPS = rpsList.filter(rps => {
        if (filters.status && rps.status !== filters.status) return false;
        if (filters.search) {
            const search = filters.search.toLowerCase();
            return (
                rps.mata_kuliah?.nama_mk.toLowerCase().includes(search) ||
                rps.mata_kuliah?.kode_mk.toLowerCase().includes(search) ||
                rps.dosen?.nama_lengkap.toLowerCase().includes(search)
            );
        }
        return true;
    });

    // Group by status for better UX
    const pendingRPS = filteredRPS.filter(r => r.status === 'pending');
    const approvedRPS = filteredRPS.filter(r => r.status === 'approved');
    const draftRPS = filteredRPS.filter(r => r.status === 'draft');
    const rejectedRPS = filteredRPS.filter(r => r.status === 'rejected');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Manajemen RPS</h1>
                <p className="text-gray-600 mt-1">
                    {canApproveRPS() ? 'Review dan setujui dokumen RPS' : 'Lihat dokumen RPS'}
                </p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-amber-700 dark:text-amber-400">Butuh Review</p>
                            <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">{pendingRPS.length}</p>
                        </div>
                        <Clock className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                    </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-700 dark:text-green-400">Disetujui</p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-200">{approvedRPS.length}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-500" />
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-700 dark:text-gray-400">Draft</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-200">{draftRPS.length}</p>
                        </div>
                        <FileText className="w-8 h-8 text-gray-600 dark:text-gray-500" />
                    </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-700 dark:text-red-400">Ditolak</p>
                            <p className="text-2xl font-bold text-red-900 dark:text-red-200">{rejectedRPS.length}</p>
                        </div>
                        <XCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari mata kuliah atau dosen..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Semua Status</option>
                        <option value="draft">Draft</option>
                        <option value="pending">Butuh Review</option>
                        <option value="approved">Disetujui</option>
                        <option value="rejected">Ditolak</option>
                    </select>
                    <select
                        value={filters.semester}
                        onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Semua Semester</option>
                        <option value="Ganjil">Ganjil</option>
                        <option value="Genap">Genap</option>
                    </select>
                    <select
                        value={filters.tahunAjaran}
                        onChange={(e) => setFilters({ ...filters, tahunAjaran: e.target.value })}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Semua Tahun</option>
                        <option value="2025/2026">2025/2026</option>
                        <option value="2024/2025">2024/2025</option>
                    </select>
                </div>
            </div>

            {/* RPS Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900 dark:text-gray-200">Mata Kuliah</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900 dark:text-gray-200">Dosen</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900 dark:text-gray-200">Semester</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900 dark:text-gray-200">Status</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900 dark:text-gray-200">Terakhir Diupdate</th>
                            <th className="text-right px-6 py-3 text-sm font-semibold text-gray-900 dark:text-gray-200">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                    Memuat daftar RPS...
                                </td>
                            </tr>
                        ) : filteredRPS.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                    Tidak ada RPS ditemukan
                                </td>
                            </tr>
                        ) : (
                            filteredRPS.map((rps) => (
                                <tr key={rps.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-gray-200">
                                                {rps.mata_kuliah?.nama_mk}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {rps.mata_kuliah?.kode_mk} • <span className="font-bold">{rps.mata_kuliah?.sks} SKS</span> <span className="text-xs">({rps.mata_kuliah?.sks_teori || 0}T / {rps.mata_kuliah?.sks_praktek || 0}P)</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <div className="font-medium text-gray-900 dark:text-gray-200">{rps.dosen?.nama_lengkap}</div>
                                            <div className="text-gray-500 dark:text-gray-400">{rps.dosen?.nidn}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="text-gray-900 dark:text-gray-300">{rps.semester}</div>
                                        <div className="text-gray-500 dark:text-gray-500">{rps.tahun_ajaran}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(rps.status)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(rps.updatedAt).toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handlePrintRPS(rps.id)}
                                                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium flex items-center gap-1"
                                                title="Download PDF"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => window.location.href = `/kaprodi/rps/view/${rps.id}`}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Lihat
                                            </button>
                                            {rps.status === 'draft' && (
                                                <button
                                                    onClick={() => window.location.href = `/kaprodi/rps/${rps.id}/edit`}
                                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                                                >
                                                    <FileCheck className="w-4 h-4" />
                                                    Edit
                                                </button>
                                            )}
                                            {canApproveRPS() && (rps.status === 'pending' || rps.status === 'draft' || rps.status === 'approved') && (
                                                <>
                                                    {rps.status !== 'approved' && (
                                                        <button
                                                            onClick={() => handleOpenApprovalModal(rps, 'approve')}
                                                            className="text-green-600 hover:text-green-800 dark:hover:text-green-400 text-sm font-medium flex items-center gap-1"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Setujui
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleOpenApprovalModal(rps, 'reject')}
                                                        className="text-red-600 hover:text-red-800 dark:hover:text-red-400 text-sm font-medium flex items-center gap-1"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        {rps.status === 'draft' ? 'Revisi' : (rps.status === 'approved' ? 'Kembalikan ke Draft' : 'Tolak/Revisi')}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Approval Modal */}
            {showApprovalModal && selectedRPS && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-xl ring-1 ring-gray-200 dark:ring-gray-700">
                        <div className="border-b border-gray-100 dark:border-gray-700 px-6 py-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {approvalAction === 'approve' ? (
                                    <>
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                        Setujui RPS
                                    </>
                                ) : (
                                    <>
                                        <div className="text-red-600 flex items-center gap-2">
                                            <XCircle className="w-6 h-6" />
                                            Tolak / Revisi RPS
                                        </div>
                                    </>
                                )}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmitApproval} className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Mata Kuliah:</p>
                                <p className="font-medium text-gray-900 dark:text-white">{selectedRPS.mata_kuliah?.nama_mk}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {selectedRPS.mata_kuliah?.kode_mk} • Dosen: {selectedRPS.dosen?.nama_lengkap}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Catatan {approvalAction === 'reject' ? '*' : '(Opsional)'}
                                </label>
                                <textarea
                                    value={catatan}
                                    onChange={(e) => setCatatan(e.target.value)}
                                    placeholder={
                                        approvalAction === 'approve'
                                            ? 'Tambahkan komentar atau masukan...'
                                            : 'Jelaskan alasan pengembalian/penolakan...'
                                    }
                                    rows="4"
                                    required={approvalAction === 'reject'}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={handleCloseApprovalModal}
                                    disabled={processing}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || (approvalAction === 'reject' && !catatan.trim())}
                                    className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${approvalAction === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {processing ? (
                                        <>Memproses...</>
                                    ) : (
                                        <>
                                            {approvalAction === 'approve' ? 'Setujui RPS' : 'Tolak / Minta Revisi'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
