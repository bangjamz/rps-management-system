
import { useState, useEffect } from 'react';
import {
    Search, Mail, User, MapPin, LayoutGrid, LayoutList,
    Settings, Plus, Trash2, Edit2, MoreVertical, X, Check
} from 'lucide-react';
import { getTagColor } from '../utils/ui';
import axios from '../lib/axios';
import useAuthStore from '../store/useAuthStore';
import { ROLES } from '../utils/permissions';
import Swal from 'sweetalert2';

export default function DataDosenPage() {
    const { user } = useAuthStore();
    const [lecturers, setLecturers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // View State
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
    const [isManageMode, setIsManageMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDosen, setEditingDosen] = useState(null);
    const [formData, setFormData] = useState({
        nama_lengkap: '',
        nidn: '',
        email: '',
        status: 'Aktif'
    });

    // Helper for theme-aware Swal
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
        fetchLecturers();
    }, []);

    const fetchLecturers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/lecturer-assignments/available-lecturers');
            setLecturers(res.data.lecturers || []);
        } catch (error) {
            console.error('Failed to fetch lecturers:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredLecturers = lecturers.filter(d =>
        d.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.nidn && d.nidn.includes(searchQuery))
    );

    // Selection Handlers
    const toggleSelection = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredLecturers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredLecturers.map(l => l.id)));
        }
    };

    // CRUD Handlers
    const handleAdd = () => {
        setEditingDosen(null);
        setFormData({ nama_lengkap: '', nidn: '', email: '', status: 'Aktif' });
        setIsModalOpen(true);
    };

    const handleEdit = (dosen) => {
        setEditingDosen(dosen);
        setFormData({
            nama_lengkap: dosen.nama_lengkap,
            nidn: dosen.nidn || '',
            email: dosen.email || '',
            status: dosen.is_active !== false ? 'Aktif' : 'Tidak Aktif' // Handle missing is_active as true
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire(getSwalConfig({
            title: 'Apakah Anda yakin?',
            text: "Dosen akan dinonaktifkan (soft delete).",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        }));

        if (result.isConfirmed) {
            try {
                await axios.delete(`/lecturer-assignments/dosen/${id}`);
                Swal.fire(getSwalConfig({ title: 'Terhapus!', text: 'Dosen berhasil dihapus.', icon: 'success' }));
                fetchLecturers();
                // Remove from selection if selected
                if (selectedIds.has(id)) {
                    const newSelected = new Set(selectedIds);
                    newSelected.delete(id);
                    setSelectedIds(newSelected);
                }
            } catch (error) {
                Swal.fire(getSwalConfig({ title: 'Error', text: error.response?.data?.message || 'Gagal menghapus dosen', icon: 'error' }));
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        const result = await Swal.fire(getSwalConfig({
            title: `Hapus ${selectedIds.size} Dosen?`,
            text: "Dosen yang dipilih akan dinonaktifkan.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Hapus Semua',
            cancelButtonText: 'Batal'
        }));

        if (result.isConfirmed) {
            try {
                // Serial delete for now as API is single
                for (const id of selectedIds) {
                    await axios.delete(`/lecturer-assignments/dosen/${id}`);
                }
                Swal.fire(getSwalConfig({ title: 'Terhapus!', text: 'Data dosen berhasil dihapus.', icon: 'success' }));
                fetchLecturers();
                setSelectedIds(new Set());
            } catch (error) {
                Swal.fire(getSwalConfig({ title: 'Error', text: 'Terjadi kesalahan saat menghapus beberapa data', icon: 'error' }));
                fetchLecturers(); // Refresh to match server state
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingDosen) {
                await axios.put(`/lecturer-assignments/dosen/${editingDosen.id}`, formData);
                Swal.fire(getSwalConfig({ title: 'Sukses', text: 'Data dosen diperbarui', icon: 'success' }));
            } else {
                await axios.post('/lecturer-assignments/dosen', formData);
                Swal.fire(getSwalConfig({ title: 'Sukses', text: 'Dosen berhasil ditambahkan', icon: 'success' }));
            }
            setIsModalOpen(false);
            fetchLecturers();
        } catch (error) {
            Swal.fire(getSwalConfig({ title: 'Error', text: error.response?.data?.message || 'Gagal menyimpan data', icon: 'error' }));
        }
    };

    // Only authorized roles can manage
    const canManage = [ROLES.KAPRODI, ROLES.ADMIN_INSTITUSI, ROLES.DEKAN].includes(user?.role);

    return (
        <div>
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Dosen</h1>
                    <p className="text-gray-600 dark:text-gray-400">Direktori Dosen Pengampu & Homebase</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari nama / NIDN..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 w-full md:w-56"
                        />
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2">
                    {canManage && (
                        <button
                            onClick={() => {
                                setIsManageMode(!isManageMode);
                                if (isManageMode) setSelectedIds(new Set()); // Clear selection on exit
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isManageMode
                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            <Settings size={18} />
                            {isManageMode ? 'Selesai Mengelola' : 'Kelola Data Dosen'}
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                    {/* Bulk Actions (Visible in Manage Mode) */}
                    {isManageMode && (
                        <div className="flex items-center gap-2 mr-auto md:mr-4 border-r border-gray-200 dark:border-gray-700 pr-4">
                            <button
                                onClick={handleAdd}
                                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <Plus size={16} />
                                Tambah
                            </button>

                            {selectedIds.size > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Trash2 size={16} />
                                    Hapus ({selectedIds.size})
                                </button>
                            )}
                        </div>
                    )}

                    {/* View Toggles */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow text-primary-600 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                            title="Tampilan Grid"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow text-primary-600 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                            title="Tampilan Tabel"
                        >
                            <LayoutList size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : filteredLecturers.length === 0 ? (
                <div className="py-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>Tidak ada data dosen yang ditemukan.</p>
                </div>
            ) : viewMode === 'table' ? (
                // TABLE VIEW
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    {isManageMode && (
                                        <th className="px-4 py-3 w-10">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                checked={selectedIds.size === filteredLecturers.length && filteredLecturers.length > 0}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                    )}
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Nama Lengkap</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">NIDN/NUPTK</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Homebase</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                                    {isManageMode && <th className="px-4 py-3 text-center font-medium text-gray-500">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredLecturers.map((dosen) => (
                                    <tr
                                        key={dosen.id}
                                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedIds.has(dosen.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                                        onClick={() => isManageMode && toggleSelection(dosen.id)}
                                    >
                                        {isManageMode && (
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                    checked={selectedIds.has(dosen.id)}
                                                    onChange={() => toggleSelection(dosen.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>
                                        )}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs uppercase">
                                                    {dosen.nama_lengkap.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-white">{dosen.nama_lengkap}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{dosen.nidn || '-'}</td>
                                        <td className="px-4 py-3 text-gray-500">{dosen.email || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`${getTagColor(dosen.prodi ? 'prodi' : 'cross-faculty')} px-2 py-0.5 rounded text-[10px] font-bold uppercase border`}>
                                                {dosen.prodi ? dosen.prodi.nama : 'Lintas Fakultas'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`${getTagColor(dosen.is_active !== false ? 'aktif' : 'non-aktif')} inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider`}>
                                                {dosen.is_active !== false ? 'Aktif' : 'Tidak Aktif'}
                                            </span>
                                        </td>
                                        {isManageMode && (
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(dosen); }}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(dosen.id); }}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                // GRID VIEW
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredLecturers.map((dosen) => (
                        <div
                            key={dosen.id}
                            className={`group relative bg-white dark:bg-gray-800 rounded-lg border p-4 transition-all hover:shadow-md ${selectedIds.has(dosen.id)
                                ? 'border-primary-500 ring-1 ring-primary-500 bg-primary-50/10'
                                : 'border-gray-200 dark:border-gray-700'
                                }`}
                            onClick={() => isManageMode && toggleSelection(dosen.id)}
                        >
                            {isManageMode && (
                                <div className="absolute top-3 right-3 z-10">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedIds.has(dosen.id) ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-300'}`}>
                                        {selectedIds.has(dosen.id) && <Check size={12} className="text-white" />}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                    <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-6" title={dosen.nama_lengkap}>
                                        {dosen.nama_lengkap}
                                    </h3>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-medium">NIDN: {dosen.nidn || '-'}</p>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <Mail className="w-3.5 h-3.5" />
                                            <span className="truncate">{dosen.email || '-'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                            <span className={`${getTagColor(dosen.prodi ? 'prodi' : 'cross-faculty')} px-2 py-0.5 rounded font-bold border uppercase truncate`}>
                                                {dosen.prodi ? dosen.prodi.nama : 'Lintas Fakultas'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Hover Actions in Manage Mode */}
                            {isManageMode && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEdit(dosen); }}
                                        className="text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 active:bg-blue-100 dark:active:bg-blue-900/50 px-3 py-1.5 rounded transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(dosen.id); }}
                                        className="text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 active:bg-red-100 dark:active:bg-red-900/50 px-3 py-1.5 rounded transition-colors"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Manage Dosen Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="font-semibold text-lg">{editingDosen ? 'Edit Dosen' : 'Tambah Dosen'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="label">Nama Lengkap</label>
                                <input
                                    type="text"
                                    value={formData.nama_lengkap}
                                    onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                                    className="input"
                                    placeholder="Gelar dan Nama Lengkap"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">NIDN / NUPTK</label>
                                <input
                                    type="text"
                                    value={formData.nidn}
                                    onChange={(e) => setFormData({ ...formData, nidn: e.target.value })}
                                    className="input"
                                    placeholder="Nomor Induk"
                                />
                            </div>
                            <div>
                                <label className="label">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input"
                                    placeholder="email@institusi.ac.id"
                                />
                            </div>
                            <div>
                                <label className="label">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="input"
                                >
                                    <option value="Aktif">Aktif</option>
                                    <option value="Keluar">Tidak Aktif / Keluar</option>
                                </select>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1">
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary flex-1">
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
