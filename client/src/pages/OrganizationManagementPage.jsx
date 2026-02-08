
import React, { useState, useEffect } from 'react';
import {
    FaBuilding,
    FaGraduationCap,
    FaPlus,
    FaEdit,
    FaTrash,
    FaSearch,
    FaFilter,
    FaUniversity,
    FaLaptopCode,
    FaUserTie
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axios from '../lib/axios';

const OrganizationManagementPage = () => {
    const [activeTab, setActiveTab] = useState('fakultas');
    const [fakultas, setFakultas] = useState([]);
    const [prodi, setProdi] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [isFakultasModalOpen, setIsFakultasModalOpen] = useState(false);
    const [isProdiModalOpen, setIsProdiModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Form data
    const [fakultasForm, setFakultasForm] = useState({ kode: '', nama: '', deskripsi: '' });
    const [prodiForm, setProdiForm] = useState({ fakultas_id: '', kode: '', nama: '', jenjang: 'S1', deskripsi: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [fakultasRes, prodiRes] = await Promise.all([
                axios.get('/organization/fakultas'),
                axios.get('/organization/prodi')
            ]);
            setFakultas(fakultasRes.data);
            setProdi(prodiRes.data);
        } catch (error) {
            console.error('Failed to fetch organization data:', error);
            toast.error('Gagal memuat data organisasi');
        } finally {
            setLoading(false);
        }
    };

    // --- Fakultas Handlers ---
    const handleSaveFakultas = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await axios.put(`/organization/fakultas/${editingItem.id}`, fakultasForm);
                toast.success('Fakultas berhasil diperbarui');
            } else {
                await axios.post('/organization/fakultas', fakultasForm);
                toast.success('Fakultas berhasil ditambahkan');
            }
            setIsFakultasModalOpen(false);
            setEditingItem(null);
            setFakultasForm({ kode: '', nama: '', deskripsi: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal menyimpan fakultas');
        }
    };

    const confirmDeleteFakultas = (item) => {
        if (item.prodiCount > 0) {
            toast.error(`Tidak dapat menghapus fakultas yang memiliki ${item.prodiCount} program studi`);
            return;
        }
        setItemToDelete({ ...item, type: 'fakultas' });
        setIsDeleteModalOpen(true);
    };

    // --- Prodi Handlers ---
    const handleSaveProdi = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await axios.put(`/organization/prodi/${editingItem.id}`, prodiForm);
                toast.success('Program Studi berhasil diperbarui');
            } else {
                await axios.post('/organization/prodi', prodiForm);
                toast.success('Program Studi berhasil ditambahkan');
            }
            setIsProdiModalOpen(false);
            setEditingItem(null);
            setProdiForm({ fakultas_id: '', kode: '', nama: '', jenjang: 'S1', deskripsi: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal menyimpan program studi');
        }
    };

    const confirmDeleteProdi = (item) => {
        setItemToDelete({ ...item, type: 'prodi' });
        setIsDeleteModalOpen(true);
    };

    // --- Common Delete Handler ---
    const handleDelete = async () => {
        if (!itemToDelete) return;

        try {
            const endpoint = itemToDelete.type === 'fakultas'
                ? `/organization/fakultas/${itemToDelete.id}`
                : `/organization/prodi/${itemToDelete.id}`;

            await axios.delete(endpoint);
            toast.success(`${itemToDelete.type === 'fakultas' ? 'Fakultas' : 'Program Studi'} berhasil dihapus`);
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
            fetchData();
        } catch (error) {
            toast.error('Gagal menghapus data');
        }
    };

    // --- Render Helpers ---
    const filteredFakultas = fakultas.filter(f =>
        f.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.kode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredProdi = prodi.filter(p =>
        p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.fakultas?.nama.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FaUniversity className="text-blue-600 dark:text-blue-400" />
                        Manajemen Organisasi
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola Fakultas dan Program Studi</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            if (activeTab === 'fakultas') {
                                setFakultasForm({ kode: '', nama: '', deskripsi: '' });
                                setIsFakultasModalOpen(true);
                            } else {
                                setProdiForm({ fakultas_id: fakultas[0]?.id || '', kode: '', nama: '', jenjang: 'S1', deskripsi: '' });
                                setIsProdiModalOpen(true);
                            }
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                    >
                        <FaPlus className="w-4 h-4" />
                        Tambah {activeTab === 'fakultas' ? 'Fakultas' : 'Prodi'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-colors">
                <div className="flex border-b dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('fakultas')}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'fakultas'
                            ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        <FaBuilding /> Fakultas ({fakultas.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('prodi')}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'prodi'
                            ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        <FaGraduationCap /> Program Studi ({prodi.length})
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={`Cari ${activeTab === 'fakultas' ? 'fakultas' : 'program studi'}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">Memuat data...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-3">Kode</th>
                                        <th className="px-6 py-3">Nama</th>
                                        {activeTab === 'prodi' && <th className="px-6 py-3">Jenjang</th>}
                                        {activeTab === 'prodi' && <th className="px-6 py-3">Fakultas</th>}
                                        {activeTab === 'fakultas' && <th className="px-6 py-3">Jumlah Prodi</th>}
                                        <th className="px-6 py-3">Pimpinan</th>
                                        <th className="px-6 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {activeTab === 'fakultas' ? (
                                        filteredFakultas.length > 0 ? (
                                            filteredFakultas.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.kode}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                        <div className="font-medium">{item.nama}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.deskripsi}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                            {item.prodiCount} Prodi
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {item.dekan ? (
                                                            <div className="flex items-center gap-2">
                                                                <FaUserTie className="text-gray-400" />
                                                                <span>{item.dekan.nama_lengkap}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 italic">Belum ditentukan</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingItem(item);
                                                                    setFakultasForm({ kode: item.kode, nama: item.nama, deskripsi: item.deskripsi || '' });
                                                                    setIsFakultasModalOpen(true);
                                                                }}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 rounded-lg transition-colors"
                                                            >
                                                                <FaEdit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => confirmDeleteFakultas(item)}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 rounded-lg transition-colors"
                                                            >
                                                                <FaTrash className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Tidak ada data fakultas</td>
                                            </tr>
                                        )
                                    ) : (
                                        filteredProdi.length > 0 ? (
                                            filteredProdi.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.kode}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                        <div className="font-medium">{item.nama}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.deskripsi}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                                                            {item.jenjang}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                        <div className="flex items-center gap-2">
                                                            <FaBuilding className="text-gray-400 w-3 h-3" />
                                                            {item.fakultas?.nama}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {item.kaprodi ? (
                                                            <div className="flex items-center gap-2">
                                                                <FaUserTie className="text-gray-400" />
                                                                <span>{item.kaprodi.nama_lengkap}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 italic">Belum ditentukan</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingItem(item);
                                                                    setProdiForm({
                                                                        fakultas_id: item.fakultas_id,
                                                                        kode: item.kode,
                                                                        nama: item.nama,
                                                                        jenjang: item.jenjang,
                                                                        deskripsi: item.deskripsi || ''
                                                                    });
                                                                    setIsProdiModalOpen(true);
                                                                }}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 rounded-lg transition-colors"
                                                            >
                                                                <FaEdit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => confirmDeleteProdi(item)}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 rounded-lg transition-colors"
                                                            >
                                                                <FaTrash className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Tidak ada data program studi</td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Fakultas Modal */}
            {isFakultasModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                {editingItem ? 'Edit Fakultas' : 'Tambah Fakultas'}
                            </h2>
                        </div>
                        <form onSubmit={handleSaveFakultas} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kode Fakultas</label>
                                <input
                                    type="text"
                                    required
                                    value={fakultasForm.kode}
                                    onChange={(e) => setFakultasForm({ ...fakultasForm, kode: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Contoh: FT, FKIP"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Fakultas</label>
                                <input
                                    type="text"
                                    required
                                    value={fakultasForm.nama}
                                    onChange={(e) => setFakultasForm({ ...fakultasForm, nama: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Nama lengkap fakultas"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi (Opsional)</label>
                                <textarea
                                    value={fakultasForm.deskripsi}
                                    onChange={(e) => setFakultasForm({ ...fakultasForm, deskripsi: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    rows="3"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsFakultasModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Prodi Modal */}
            {isProdiModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                {editingItem ? 'Edit Program Studi' : 'Tambah Program Studi'}
                            </h2>
                        </div>
                        <form onSubmit={handleSaveProdi} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fakultas</label>
                                <select
                                    required
                                    value={prodiForm.fakultas_id}
                                    onChange={(e) => setProdiForm({ ...prodiForm, fakultas_id: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">Pilih Fakultas</option>
                                    {fakultas.map(f => (
                                        <option key={f.id} value={f.id}>{f.nama}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kode Prodi</label>
                                    <input
                                        type="text"
                                        required
                                        value={prodiForm.kode}
                                        onChange={(e) => setProdiForm({ ...prodiForm, kode: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Contoh: IF"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenjang</label>
                                    <select
                                        required
                                        value={prodiForm.jenjang}
                                        onChange={(e) => setProdiForm({ ...prodiForm, jenjang: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="D3">D3</option>
                                        <option value="D4">D4</option>
                                        <option value="S1">S1</option>
                                        <option value="S2">S2</option>
                                        <option value="S3">S3</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Program Studi</label>
                                <input
                                    type="text"
                                    required
                                    value={prodiForm.nama}
                                    onChange={(e) => setProdiForm({ ...prodiForm, nama: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Nama lengkap prodi"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi (Opsional)</label>
                                <textarea
                                    value={prodiForm.deskripsi}
                                    onChange={(e) => setProdiForm({ ...prodiForm, deskripsi: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    rows="3"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsProdiModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
                            <FaTrash className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hapus Data?</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                            Anda yakin ingin menghapus {itemToDelete?.type === 'fakultas' ? 'Fakultas' : 'Program Studi'} <strong>{itemToDelete?.nama}</strong>?
                            Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizationManagementPage;
