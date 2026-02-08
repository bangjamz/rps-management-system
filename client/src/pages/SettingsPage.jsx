import { useState, useRef, useEffect } from 'react';
import { Camera, User, Plus, Edit, Check, X, Calendar, Upload } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useThemeStore from '../store/useThemeStore';
import useAcademicStore from '../store/useAcademicStore';
import axios from '../lib/axios';
import { ROLES } from '../utils/permissions';

export default function SettingsPage() {
    const { user, updateUser } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();

    // Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        nama_lengkap: user?.nama_lengkap || '',
        email: user?.email || '',
    });

    // Photo Upload State
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(user?.foto_profil || null);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Academic Year State (Kaprodi Only)
    const [academicYears, setAcademicYears] = useState([]);
    const [isAddingYear, setIsAddingYear] = useState(false);
    const [newYearName, setNewYearName] = useState('');

    // UI State
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Fetch Academic Years on Mount
    useEffect(() => {
        if (user?.role === ROLES.KAPRODI || user?.role === 'admin_institusi' || user?.role === 'superadmin' || user?.role === 'admin') {
            fetchAcademicYears();
        }
    }, [user]);

    const fetchAcademicYears = async () => {
        try {
            const response = await axios.get('/academic-years');
            setAcademicYears(response.data);
            // Sync with global store for header dropdown
            useAcademicStore.getState().setAcademicYears(response.data);
        } catch (error) {
            console.error('Failed to fetch academic years:', error);
        }
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Ukuran foto maksimal 2MB' });
            return;
        }

        // Immediate upload
        const formData = new FormData();
        formData.append('photo', file);

        setLoading(true);
        try {
            const response = await axios.post('/auth/profile-picture', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Update user in store
            updateUser(response.data.user);

            // Update preview
            setPreviewUrl(response.data.user.foto_profil);

            setMessage({ type: 'success', text: 'Foto profil berhasil diperbarui' });
        } catch (error) {
            console.error('Upload error:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Gagal mengupload foto' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await axios.put('/auth/profile', formData);
            updateUser(response.data.user);
            setMessage({ type: 'success', text: 'Profil berhasil diperbarui' });
            setIsEditing(false);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Gagal memperbarui profil' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Password baru tidak cocok' });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password minimal 6 karakter' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await axios.post('/auth/change-password', { currentPassword, newPassword });
            setMessage({ type: 'success', text: 'Password berhasil diubah' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Gagal mengubah password' });
        } finally {
            setLoading(false);
        }
    };

    // Academic Year Handlers
    const handleAddYear = async () => {
        if (!newYearName.trim()) return;
        try {
            await axios.post('/academic-years', { name: newYearName });
            setNewYearName('');
            setIsAddingYear(false);
            fetchAcademicYears();
            setMessage({ type: 'success', text: 'Tahun akademik berhasil ditambahkan' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Gagal menambahkan tahun akademik' });
        }
    };

    const handleActivateYear = async (id, semester) => {
        try {
            const response = await axios.put(`/academic-years/${id}/activate`, { active_semester: semester });
            fetchAcademicYears();

            // Sync with global academic store
            const activatedYear = response.data;
            if (activatedYear) {
                const { setSemester, setYear } = useAcademicStore.getState();
                setSemester(semester);
                setYear(activatedYear.name);
            }

            setMessage({ type: 'success', text: `Tahun ${semester} berhasil diaktifkan` });
        } catch (error) {
            setMessage({ type: 'error', text: 'Gagal mengaktifkan tahun akademik' });
        }
    };

    // --- Signature Pad Logic ---
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const canvasRef = useRef(null);
    const isDrawing = useRef(false);

    // Initialize canvas context
    useEffect(() => {
        if (showSignaturePad && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000000';

            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        }
    }, [showSignaturePad]);

    const getCoordinates = (e) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDrawing = (e) => {
        isDrawing.current = true;
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e) => {
        if (!isDrawing.current) return;
        e.preventDefault();
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        const ctx = canvasRef.current.getContext('2d');
        ctx.closePath();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Note: clearing with scaled width/height
    };

    const saveSignature = async () => {
        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL('image/png');

        try {
            setLoading(true);
            await axios.post('/auth/signature', { signature: dataUrl });
            // Update user in store (need to fetch latest user or manually update)
            const updatedUser = { ...user, signature: dataUrl };
            updateUser(updatedUser);

            setMessage({ type: 'success', text: 'Tanda tangan berhasil disimpan' });
            setShowSignaturePad(false);
        } catch (error) {
            console.error('Save signature error:', error);
            setMessage({ type: 'error', text: 'Gagal menyimpan tanda tangan' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Pengaturan
            </h1>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg flex justify-between items-center ${message.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                    }`}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage({ type: '', text: '' })}><X className="w-4 h-4" /></button>
                </div>
            )}

            <div className="space-y-6">
                {/* Profile Section - Redesigned */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Informasi Profil
                        </h2>

                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Left: Photo */}
                        <div className="flex flex-col items-center space-y-3">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border items-center justify-center flex">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-10 h-10 text-gray-400" />
                                    )}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 p-1.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors shadow-sm border-2 border-white dark:border-gray-900"
                                >
                                    <Camera className="w-3 h-3" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                            <p className="text-xs text-center text-gray-500 max-w-[150px]">
                                Maks. 2MB, Disarankan 1:1 (persegi)
                            </p>
                        </div>

                        {/* Right: Info */}
                        <div className="flex-1 w-full">
                            { /* Always show form */}
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="label">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        value={formData.nama_lengkap}
                                        onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Role</p>
                                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                                        {user?.role === ROLES.KAPRODI ? 'Ketua Program Studi' : 'Dosen'}
                                    </span>
                                </div>
                                <div className="pt-2">
                                    <button type="submit" disabled={loading} className="btn btn-primary">
                                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Academic Settings (Kaprodi, Admin, Super Admin) */}
                {(user?.role === ROLES.KAPRODI || user?.role === 'admin_institusi' || user?.role === 'superadmin' || user?.role === 'admin') && (
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Pengaturan Akademik
                                </h2>
                                <p className="text-sm text-gray-500">Kelola tahun akademik dan semester aktif sistem.</p>
                            </div>
                            {(user?.role === 'superadmin' || user?.role === 'admin') && (
                                <button
                                    onClick={() => setIsAddingYear(!isAddingYear)}
                                    className="btn btn-primary btn-sm flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" /> Tambah Tahun
                                </button>
                            )}
                        </div>

                        {isAddingYear && (
                            <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg flex items-end gap-3 border border-gray-200 dark:border-gray-700">
                                <div className="flex-1">
                                    <label className="label text-xs mb-1">Nama Tahun Akademik (cth: 2025/2026)</label>
                                    <input
                                        type="text"
                                        value={newYearName}
                                        onChange={(e) => setNewYearName(e.target.value)}
                                        placeholder="2025/2026"
                                        className="input"
                                    />
                                </div>
                                <button onClick={handleAddYear} className="btn btn-primary">Simpan</button>
                                <button onClick={() => setIsAddingYear(false)} className="btn btn-ghost">Batal</button>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Tahun Akademik</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Status Ganjil</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Status Genap</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {academicYears.map((year) => (
                                        <tr key={year.id} className={year.is_active ? 'bg-primary-50/30' : ''}>
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                {year.name}
                                                {year.is_active && (
                                                    <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                                                        Aktif ({year.active_semester})
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {/* Activation is Super Admin / Admin only */}
                                                {(user?.role === 'superadmin' || user?.role === 'admin') ? (
                                                    <button
                                                        onClick={() => handleActivateYear(year.id, 'Ganjil')}
                                                        className={`px-3 py-1 rounded text-xs border ${year.is_active && year.active_semester === 'Ganjil'
                                                            ? 'bg-primary-600 text-white border-primary-600 cursor-default'
                                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                        disabled={year.is_active && year.active_semester === 'Ganjil'}
                                                    >
                                                        {year.is_active && year.active_semester === 'Ganjil' ? 'Sedang Aktif' : 'Aktifkan'}
                                                    </button>
                                                ) : (
                                                    <span className={`text-xs ${year.is_active && year.active_semester === 'Ganjil' ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                                                        {year.is_active && year.active_semester === 'Ganjil' ? 'Sedang Aktif' : '-'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {(user?.role === 'superadmin' || user?.role === 'admin') ? (
                                                    <button
                                                        onClick={() => handleActivateYear(year.id, 'Genap')}
                                                        className={`px-3 py-1 rounded text-xs border ${year.is_active && year.active_semester === 'Genap'
                                                            ? 'bg-primary-600 text-white border-primary-600 cursor-default'
                                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                        disabled={year.is_active && year.active_semester === 'Genap'}
                                                    >
                                                        {year.is_active && year.active_semester === 'Genap' ? 'Sedang Aktif' : 'Aktifkan'}
                                                    </button>
                                                ) : (
                                                    <span className={`text-xs ${year.is_active && year.active_semester === 'Genap' ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                                                        {year.is_active && year.active_semester === 'Genap' ? 'Sedang Aktif' : '-'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button className="text-gray-400 hover:text-gray-600">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {academicYears.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-6 text-center text-gray-500">
                                                Belum ada data tahun akademik. Klik Tambah Tahun.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Signature Section */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Tanda Tangan Digital
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Tanda tangan ini akan digunakan secara otomatis pada dokumen RPS dan laporannya.
                    </p>

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Preview / Canvas Area */}
                        <div className="flex-1">
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 h-48 relative flex items-center justify-center overflow-hidden group">
                                {user?.signature ? (
                                    <>
                                        <img src={user.signature} alt="Signature" className="max-h-full max-w-full object-contain p-4" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Hapus tanda tangan?')) {
                                                        try {
                                                            setLoading(true);
                                                            await axios.post('/auth/signature', { signature: null });
                                                            updateUser({ ...user, signature: null });
                                                            setMessage({ type: 'success', text: 'Tanda tangan dihapus' });
                                                        } catch (e) { setMessage({ type: 'error', text: 'Gagal menghapus' }); }
                                                        finally { setLoading(false); }
                                                    }
                                                }}
                                                className="btn btn-sm btn-error text-white"
                                            >
                                                <X className="w-4 h-4" /> Hapus
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-gray-400 text-sm">Belum ada tanda tangan</span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 w-full md:w-48">
                            <input
                                type="file"
                                accept="image/*"
                                id="sig-upload"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const formData = new FormData();
                                    formData.append('signature', file);
                                    try {
                                        setLoading(true);
                                        const res = await axios.post('/auth/signature', formData, {
                                            headers: { 'Content-Type': 'multipart/form-data' }
                                        });
                                        // Assumption: backend returns updated user or we refresh
                                        // For now, let's assume we need to reload or manually set logic if backend returns url
                                        // Better to fetch profile or check auth check
                                        // The backend likely updates session. Let's try manual update if we knew the URL, 
                                        // but since it's an upload, we might need the response.
                                        // Let's assume response.data.signature or similar.
                                        // If not, we trigger a fetch
                                        await axios.get('/auth/me').then(r => updateUser(r.data));

                                        setMessage({ type: 'success', text: 'Tanda tangan diupload' });
                                    } catch (e) { setMessage({ type: 'error', text: 'Upload gagal' }); }
                                    finally { setLoading(false); }
                                }}
                            />
                            <button onClick={() => document.getElementById('sig-upload').click()} className="btn btn-outline btn-sm justify-start" disabled={loading}>
                                <Upload className="w-4 h-4 mr-2" /> Upload Gambar
                            </button>

                            <button
                                onClick={() => setShowSignaturePad(true)}
                                className="btn btn-outline btn-sm justify-start"
                                disabled={loading}
                            >
                                <span className="w-4 h-4 mr-2">✏️</span> Gambar (Draw)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Signature Pad Modal */}
                {showSignaturePad && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-scale-in">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Gambar Tanda Tangan</h3>
                                <button onClick={() => setShowSignaturePad(false)} className="btn btn-ghost btn-circle btn-sm">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white touch-none">
                                <canvas
                                    ref={canvasRef}
                                    width={500}
                                    height={200}
                                    className="w-full h-48 cursor-crosshair"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2 text-center">Tanda tangan di dalam kotak di atas</p>

                            <div className="flex justify-between mt-6">
                                <button onClick={clearCanvas} className="btn btn-sm btn-ghost text-red-500">
                                    Reset
                                </button>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowSignaturePad(false)} className="btn btn-sm">Batal</button>
                                    <button onClick={saveSignature} className="btn btn-sm btn-primary">Simpan</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Theme Section */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Tampilan
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-900 dark:text-white font-medium">Mode Gelap</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Aktifkan mode gelap untuk kenyamanan mata
                            </p>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-primary-600' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Password Section */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                        Ubah Password
                    </h2>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="label">Password Saat Ini</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Password Baru</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="input"
                                required
                                minLength={6}
                            />
                            <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
                        </div>
                        <div>
                            <label className="label">Konfirmasi Password Baru</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? 'Mengubah...' : 'Ubah Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
