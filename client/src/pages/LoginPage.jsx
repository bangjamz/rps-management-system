import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useGlobalStore from '../store/useGlobalStore';
import axios from '../lib/axios';

import HelpModal from '../components/HelpModal';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const { settings } = useGlobalStore();

    const appName = settings?.nama_pt || 'Institut Teknologi dan Kesehatan Mahardika';
    const appLogo = settings?.logo_path
        ? `/${settings.logo_path}?t=${new Date().getTime()}`
        : null;

    const initials = appName
        ?.split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '??';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('/auth/login', { username, password });
            const { user, token } = response.data;

            setAuth(user, token);

            // Navigate based on role
            if (user.role === 'kaprodi') {
                navigate('/kaprodi/dashboard');
            } else if (user.role === 'dosen') {
                navigate('/dosen/dashboard');
            } else if (user.role === 'superadmin' || user.role === 'admin') {
                navigate('/super-admin');
            } else if (user.role === 'mahasiswa') {
                navigate('/mahasiswa/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login gagal. Periksa username dan password Anda.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-primary-50 to-secondary-50 dark:from-gray-950 dark:via-primary-950/30 dark:to-gray-900 px-4 py-12 sm:py-0">
            <div className="w-full max-w-md">
                {/* Logo & Title */}
                <div className="text-center mb-10">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-soft overflow-hidden border border-gray-100 dark:border-gray-800">
                        {appLogo ? (
                            <img src={appLogo} alt={appName} className="w-full h-full object-contain p-2" />
                        ) : (
                            <div className="w-full h-full bg-primary-600 flex items-center justify-center text-white font-bold text-2xl">
                                {initials}
                            </div>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 mb-2">
                        SAMPIRANS
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium px-4">
                        {appName}
                    </p>
                </div>

                {/* Login Form */}
                <div className="card p-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Masuk ke Akun Anda
                    </h2>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="username" className="label">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input"
                                placeholder="Masukkan username"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="label">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                placeholder="Masukkan password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-3"
                        >
                            {loading ? (
                                <span className="inline-flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Memproses...
                                </span>
                            ) : (
                                'Masuk'
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Demo Credentials:</p>
                        <div className="space-y-1 text-xs">
                            <p className="text-gray-600 dark:text-gray-300">
                                <strong>Kaprodi:</strong> kaprodi_informatika / password123
                            </p>
                            <p className="text-gray-600 dark:text-gray-300">
                                <strong>Dosen:</strong> dosen_andi / password123
                            </p>
                            <p className="text-gray-600 dark:text-gray-300">
                                <strong>Mahasiswa:</strong> mahasiswa_andi / password123
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Belum punya akun?{' '}
                            <a href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                                Daftar Sekarang
                            </a>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    © {new Date().getFullYear()} {appName}
                </p>
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={() => setShowHelp(true)}
                        className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center gap-2 hover:underline transition-all"
                    >
                        <BookOpen className="w-4 h-4" />
                        Pusat Bantuan
                    </button>
                </div>
            </div>

            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        </div >
    );
}
