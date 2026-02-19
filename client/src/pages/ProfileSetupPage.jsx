import { useState, useEffect } from 'react';
import { User, Save, AlertCircle, School, Award, Briefcase, LogOut } from 'lucide-react';
import axios from '../lib/axios';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export default function ProfileSetupPage() {
    const { user, setUser, logout } = useAuthStore();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        // Common
        phone: '',
        address: '',

        // Dosen
        nidn: '',
        jabatan_fungsional: '',
        pendidikan_terakhir: '',
        bidang_keahlian: '',
        homebase: '',
        status_kepegawaian: 'Dosen Tetap',

        // Mahasiswa
        nim: '',
        angkatan: new Date().getFullYear(),
        status_mahasiswa: 'aktif'
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get('/profile');
            if (response.data) {
                setFormData(prev => ({
                    ...prev,
                    ...response.data
                }));
            }
        } catch (error) {
            // It's okay if profile doesn't exist yet
            console.log('Profile fetch result:', error.response?.status);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            const payload = {
                ...formData,
                profile_type: (user.role === 'dosen' || user.role === 'kaprodi') ? 'dosen' : 'mahasiswa'
            };

            const response = await axios.post('/profile', payload);

            setSuccess('Profile updated successfully!');

            // Wait a moment then redirect to dashboard
            setTimeout(() => {
                const dashboardPath = user.role === 'kaprodi' ? '/kaprodi/dashboard' :
                    user.role === 'dosen' ? '/dosen/dashboard' : '/dashboard';
                navigate(dashboardPath);
            }, 1000);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading profile...</div>;

    const isDosen = user.role === 'dosen' || user.role === 'kaprodi';
    const isMahasiswa = user.role === 'mahasiswa';

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="w-8 h-8 text-primary-600" />
                        Lengkapi Profil Anda
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Mohon lengkapi data diri Anda sebelum melanjutkan akses ke sistem.
                    </p>
                </div>
                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Keluar
                </button>
            </div>

            <div className="card p-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Common Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label">Nomor Telepon / WA</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="input"
                                placeholder="08123456789"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Alamat Domisili</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="input"
                                placeholder="Alamat lengkap"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            {isDosen ? <Briefcase className="w-5 h-5" /> : <School className="w-5 h-5" />}
                            {isDosen ? 'Data Akademik Dosen' : 'Data Akademik Mahasiswa'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {isDosen && (
                                <>
                                    <div>
                                        <label className="label">NIDN</label>
                                        <input
                                            type="text"
                                            name="nidn"
                                            value={formData.nidn}
                                            onChange={handleChange}
                                            className="input"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Jabatan Fungsional</label>
                                        <select
                                            name="jabatan_fungsional"
                                            value={formData.jabatan_fungsional}
                                            onChange={handleChange}
                                            className="input"
                                        >
                                            <option value="">Pilih Jabatan</option>
                                            <option value="Asisten Ahli">Asisten Ahli</option>
                                            <option value="Lektor">Lektor</option>
                                            <option value="Lektor Kepala">Lektor Kepala</option>
                                            <option value="Profesor">Profesor</option>
                                            <option value="Tenaga Pengajar">Tenaga Pengajar</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Pendidikan Terakhir</label>
                                        <select
                                            name="pendidikan_terakhir"
                                            value={formData.pendidikan_terakhir}
                                            onChange={handleChange}
                                            className="input"
                                        >
                                            <option value="">Pilih Pendidikan</option>
                                            <option value="S1">S1</option>
                                            <option value="S2">S2</option>
                                            <option value="S3">S3</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Bidang Keahlian</label>
                                        <input
                                            type="text"
                                            name="bidang_keahlian"
                                            value={formData.bidang_keahlian}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="Contoh: AI, Software Engineering"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Homebase (Prodi)</label>
                                        <input
                                            type="text"
                                            name="homebase"
                                            value={formData.homebase}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="Nama Program Studi"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Status Kepegawaian</label>
                                        <select
                                            name="status_kepegawaian"
                                            value={formData.status_kepegawaian}
                                            onChange={handleChange}
                                            className="input"
                                        >
                                            <option value="Dosen Tetap">Dosen Tetap</option>
                                            <option value="Dosen Tidak Tetap">Dosen Tidak Tetap</option>
                                            <option value="Dosen Luar Biasa">Dosen Luar Biasa</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {isMahasiswa && (
                                <>
                                    <div>
                                        <label className="label">NIM</label>
                                        <input
                                            type="text"
                                            name="nim"
                                            value={formData.nim}
                                            onChange={handleChange}
                                            className="input"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Angkatan</label>
                                        <input
                                            type="number"
                                            name="angkatan"
                                            value={formData.angkatan}
                                            onChange={handleChange}
                                            className="input"
                                            min="2000"
                                            max={new Date().getFullYear()}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Status Mahasiswa</label>
                                        <select
                                            name="status_mahasiswa"
                                            value={formData.status_mahasiswa}
                                            onChange={handleChange}
                                            className="input"
                                        >
                                            <option value="aktif">Aktif</option>
                                            <option value="cuti">Cuti</option>
                                            <option value="lulus">Lulus</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary flex items-center gap-2 px-8"
                        >
                            {saving ? 'Menyimpan...' : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Simpan Profil
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
