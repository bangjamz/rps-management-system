import { useState, useEffect } from 'react';
import { BookOpen, User, Mail, Lock, Shield, School, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../lib/axios';

export default function RegistrationPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        nama_lengkap: '',
        role: 'mahasiswa', // default
        prodi_id: ''
    });

    const [prodis, setProdis] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // Fetch lists of prodi for selection
    useEffect(() => {
        // Mocking prodi fetch for now or actual fetch if endpoint exists
        // simplified for this phase, assuming we might need a public endpoint for prodis
        // For now, let's just hardcode or fetch if possible. 
        // We'll skip fetching from DB for this step to focus on UI, or use a known list.
        setProdis([
            { id: 1, name: 'S1 Teknik Informatika' },
            { id: 2, name: 'S1 Sistem Informasi' },
            { id: 3, name: 'D3 Kebidanan' },
            { id: 4, name: 'S1 Keperawatan' }
        ]);
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError('Password tidak sama');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post('/auth/register', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                nama_lengkap: formData.nama_lengkap,
                role: formData.role,
                prodi_id: formData.prodi_id || null
            });

            setSuccess('Registrasi berhasil! Silakan cek email Anda untuk verifikasi akun.');
            // Optional: Redirect after delay
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            setError(err.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900 px-4 py-12">
            <div className="w-full max-w-xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <Link to="/login" className="inline-block">
                        <div className="bg-primary-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/30">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Buat Akun Baru
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Bergabunglah dengan Sistem Akademik Mahardika
                    </p>
                </div>

                <div className="card p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
                            <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm flex items-start gap-3">
                            <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>{success}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nama Lengkap */}
                            <div className="col-span-2">
                                <label className="label">Nama Lengkap</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        name="nama_lengkap"
                                        type="text"
                                        required
                                        className="input pl-10"
                                        placeholder="Contoh: Budi Santoso"
                                        value={formData.nama_lengkap}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Username */}
                            <div>
                                <label className="label">Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        name="username"
                                        type="text"
                                        required
                                        className="input pl-10"
                                        placeholder="Username"
                                        value={formData.username}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="label">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        className="input pl-10"
                                        placeholder="email@mahardika.ac.id"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div>
                                <label className="label">Daftar Sebagai</label>
                                <select
                                    name="role"
                                    className="input"
                                    value={formData.role}
                                    onChange={handleChange}
                                >
                                    <option value="mahasiswa">Mahasiswa</option>
                                    <option value="dosen">Dosen</option>
                                    <option value="user">Staf / Umum</option>
                                </select>
                            </div>

                            {/* Prodi Selection - Only if not 'user' (optional logic, but good for context) */}
                            <div>
                                <label className="label">Program Studi</label>
                                <div className="relative">
                                    <School className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <select
                                        name="prodi_id"
                                        className="input pl-10"
                                        value={formData.prodi_id}
                                        onChange={handleChange}
                                    >
                                        <option value="">Pilih Prodi (Opsional)</option>
                                        {prodis.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="label">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        className="input pl-10"
                                        placeholder="******"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="label">Konfirmasi Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        className="input pl-10"
                                        placeholder="******"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || success}
                            className="btn btn-primary w-full py-3 flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <span>Memproses...</span>
                            ) : (
                                <>
                                    Daftar Sekarang
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Sudah punya akun?{' '}
                        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                            Masuk di sini
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
