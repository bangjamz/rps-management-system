import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from '../lib/axios';
import useGlobalStore from '../store/useGlobalStore';
import { CheckCircle, XCircle, Loader, ArrowRight, BookOpen } from 'lucide-react';

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const { settings } = useGlobalStore();

    const appName = settings?.nama_pt || 'Institut Teknologi dan Kesehatan Mahardika';
    const appLogo = settings?.logo_path
        ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${settings.logo_path}?t=${new Date().getTime()}`
        : null;

    const initials = appName
        ?.split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '??';

    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Memverifikasi email Anda...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token verifikasi tidak ditemukan.');
            return;
        }

        const verify = async () => {
            try {
                // In a real GET request, we send token as query param
                // Our backend expects query param 'token'
                const response = await axios.get(`/auth/verify-email?token=${token}`);
                setStatus('success');
                setMessage(response.data.message || 'Email berhasil diverifikasi!');
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verifikasi gagal. Token mungkin sudah kedaluwarsa.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
            <div className="max-w-md w-full">
                {/* Branding Header */}
                <div className="text-center mb-8">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-soft overflow-hidden border border-gray-100 dark:border-gray-800">
                        {appLogo ? (
                            <img src={appLogo} alt={appName} className="w-full h-full object-contain p-2" />
                        ) : (
                            <div className="w-full h-full bg-primary-600 flex items-center justify-center text-white font-bold text-xl uppercase tracking-tighter">
                                {initials}
                            </div>
                        )}
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        SAMPIRANS
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {appName}
                    </p>
                </div>

                <div className="card p-8 text-center">
                    {status === 'verifying' && (
                        <div className="flex flex-col items-center">
                            <Loader className="w-16 h-16 text-primary-600 animate-spin mb-6" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Memverifikasi...
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400">
                                Mohon tunggu sebentar, kami sedang memvalidasi token Anda.
                            </p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Verifikasi Berhasil!
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-8">
                                {message}
                            </p>
                            <Link to="/login" className="btn btn-primary w-full flex items-center justify-center gap-2">
                                Lanjut ke Login
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                                <XCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Verifikasi Gagal
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-8">
                                {message}
                            </p>
                            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium hover:underline">
                                Kembali ke Halaman Login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
