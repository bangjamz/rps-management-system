
import React, { useState, useEffect } from 'react';
import {
    FaCalendarAlt,
    FaPlus,
    FaEdit,
    FaCheckCircle,
    FaToggleOff,
    FaToggleOn,
    FaHistory,
    FaUniversity
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axios from '../lib/axios';
import { format } from 'date-fns';
import useAcademicStore from '../store/useAcademicStore';

const AcademicSettingsPage = () => {
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const { setSemester, setYear } = useAcademicStore();

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
    const [yearToActivate, setYearToActivate] = useState(null);

    // Form data
    const [form, setForm] = useState({ name: '' });
    const [activateForm, setActivateForm] = useState({ active_semester: 'Ganjil' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/academic-years');
            setYears(res.data);
        } catch (error) {
            console.error('Failed to fetch academic years:', error);
            toast.error('Gagal memuat data tahun akademik');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await axios.put(`/academic-years/${editingItem.id}`, form);
                toast.success('Tahun Akademik berhasil diperbarui');
            } else {
                await axios.post('/academic-years', form);
                toast.success('Tahun Akademik berhasil ditambahkan');
            }
            setIsModalOpen(false);
            setEditingItem(null);
            setForm({ name: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal menyimpan tahun akademik');
        }
    };

    const handleActivate = async () => {
        if (!yearToActivate) return;

        try {
            await axios.put(`/academic-years/${yearToActivate.id}/activate`, activateForm);

            // Sync with global store immediately
            setYear(yearToActivate.name);
            setSemester(activateForm.active_semester);

            toast.success(`Tahun ${yearToActivate.name} Semester ${activateForm.active_semester} diaktifkan`);
            setIsActivateModalOpen(false);
            setYearToActivate(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal mengaktifkan tahun akademik');
        }
    };

    const openActivateModal = (year) => {
        setYearToActivate(year);
        // Default to Ganjil if not currently active, otherwise toggle
        const nextSemester = year.is_active && year.active_semester === 'Ganjil' ? 'Genap' : 'Ganjil';
        setActivateForm({ active_semester: nextSemester });
        setIsActivateModalOpen(true);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FaCalendarAlt className="text-blue-600 dark:text-blue-400" />
                        Pengaturan Akademik
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola Tahun Akademik dan Semester Aktif</p>
                </div>

                <button
                    onClick={() => {
                        setEditingItem(null);
                        setForm({ name: '' });
                        setIsModalOpen(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <FaPlus className="w-4 h-4" />
                    Tambah Tahun Akademik
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">Memuat data...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Tahun Akademik</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Semester Aktif</th>
                                    <th className="px-6 py-3">Dibuat Pada</th>
                                    <th className="px-6 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {years.length > 0 ? (
                                    years.map((year) => (
                                        <tr key={year.id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-700/50 ${year.is_active ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{year.name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {year.is_active ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                        <FaCheckCircle className="w-3 h-3" /> Aktif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                                        Non-Aktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                {year.is_active ? (
                                                    <span className="font-semibold text-blue-600 dark:text-blue-400">{year.active_semester}</span>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-600">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {year.createdAt ? new Date(year.createdAt).toLocaleDateString('id-ID') : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openActivateModal(year)}
                                                        className={`p-1.5 rounded-lg transition-colors ${year.is_active
                                                            ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 dark:text-green-400'
                                                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200'
                                                            }`}
                                                        title={year.is_active ? "Ubah Semester / Non-aktifkan" : "Aktifkan Tahun Ini"}
                                                    >
                                                        {year.is_active ? <FaToggleOn className="w-5 h-5" /> : <FaToggleOff className="w-5 h-5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingItem(year);
                                                            setForm({ name: year.name });
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 rounded-lg transition-colors"
                                                    >
                                                        <FaEdit className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Belum ada data tahun akademik</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm">
                        <div className="p-6 border-b dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                {editingItem ? 'Edit Tahun Akademik' : 'Tambah Tahun Akademik'}
                            </h2>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Tahun Akademik</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Contoh: 2023/2024"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Format: YYYY/YYYY (Contoh: 2023/2024)</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
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

            {/* Activate Modal */}
            {isActivateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm">
                        <div className="p-6 border-b dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Aktifkan Semester</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tahun Akademik: {yearToActivate?.name}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 p-3 rounded-lg text-sm mb-4">
                                <strong>Perhatian:</strong> Mengaktifkan tahun akademik ini akan menonaktifkan tahun akademik lainnya.
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pilih Semester Aktif</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setActivateForm({ active_semester: 'Ganjil' })}
                                        className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${activateForm.active_semester === 'Ganjil'
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-500'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        Ganjil
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActivateForm({ active_semester: 'Genap' })}
                                        className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${activateForm.active_semester === 'Genap'
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-500'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        Genap
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsActivateModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleActivate}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg"
                                >
                                    Aktifkan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicSettingsPage;
