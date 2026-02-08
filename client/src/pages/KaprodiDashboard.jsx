import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen, CheckCircle, Clock, FileText,
    TrendingUp, Users, AlertTriangle, ArrowRight
} from 'lucide-react';
import { getTagColor } from '../utils/ui';
import axios from '../lib/axios';
import useAuthStore from '../store/useAuthStore';

export default function KaprodiDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get('/dashboard/stats');
            setStats(res.data.stats);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Welcome */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        Dashboard Eksekutif
                    </h1>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <span>Overview Kurikulum & RPS</span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className={`${getTagColor('prodi')} px-2 py-0.5 rounded text-[10px] font-bold uppercase border`}>
                            {user?.prodi?.nama || '-'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Sistem Aktif
                </div>
            </div>

            {/* Main Hero Card: RPS Progress */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-900 dark:to-primary-950 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden ring-1 ring-white/10 dark:ring-white/5 shadow-neon">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-16 -mb-16 blur-2xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 text-primary-10">
                            <TrendingUp className="w-5 h-5" />
                            <span className="font-medium tracking-wide">PROGRESS KELENGKAPAN RPS</span>
                        </div>
                        <div className="text-5xl font-bold mb-2 tracking-tight">
                            {stats?.rpsStats?.completionRate}%
                        </div>
                        <p className="text-primary-100 opacity-90 max-w-md">
                            Persentase mata kuliah yang telah memiliki dokumen RPS dengan status <b>Approved</b> untuk semester ini.
                        </p>
                    </div>

                    {/* Funnel Stats */}
                    <div className="flex gap-4 md:gap-8 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                        <div className="text-center px-4 border-r border-white/10 last:border-0">
                            <div className="text-2xl font-bold">{stats?.rpsStats?.total}</div>
                            <div className="text-xs uppercase tracking-wider opacity-70">Total MK</div>
                        </div>
                        <div className="text-center px-4 border-r border-white/10 last:border-0 text-accent-300">
                            <div className="text-2xl font-bold">{stats?.rpsStats?.pending}</div>
                            <div className="text-xs uppercase tracking-wider opacity-70">Butuh Review</div>
                        </div>
                        <div className="text-center px-4 text-green-300">
                            <div className="text-2xl font-bold">{stats?.rpsStats?.approved}</div>
                            <div className="text-xs uppercase tracking-wider opacity-70">Approved</div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar Visual */}
                <div className="mt-8 bg-black/20 rounded-full h-3 overflow-hidden">
                    <div
                        className="bg-accent-400 h-full rounded-full shadow-[0_0_10px_color-mix(in_srgb,var(--color-accent),transparent_50%)] transition-all duration-1000"
                        style={{ width: `${stats?.rpsStats?.completionRate}%` }}
                    ></div>
                </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pending Review Card */}
                {stats?.rpsStats?.pending > 0 ? (
                    <div className="bg-accent-50 dark:bg-accent-900/10 border border-accent-200 dark:border-accent-800 rounded-xl p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AlertTriangle className="w-24 h-24 text-accent-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/30 rounded-lg flex items-center justify-center text-accent-600 dark:text-accent-400 mb-4">
                                <Clock className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-accent-900 dark:text-accent-100 mb-1">
                                {stats.rpsStats.pending} Menunggu Review
                            </h3>
                            <p className="text-sm text-accent-700 dark:text-accent-300 mb-4">
                                Dokumen RPS yang perlu Anda periksa dan setujui.
                            </p>
                            <Link to="/kaprodi/rps?status=pending" className="inline-flex items-center text-sm font-semibold text-accent-700 hover:text-accent-900 dark:text-accent-400 dark:hover:text-accent-200">
                                Review Sekarang <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-6">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-1">
                            Semua Aman!
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300">
                            Tidak ada antrian review RPS saat ini.
                        </p>
                    </div>
                )}

                {/* Assignment Shortcut */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 group hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                    <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4 group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        Penugasan Dosen
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Kelola tim teaching dan dosen pengampu mata kuliah.
                    </p>
                    <Link to="/kaprodi/courses" className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700">
                        Ke Data Mata Kuliah <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>

                {/* Master Data Shortcut */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 group hover:border-secondary-300 dark:hover:border-secondary-700 transition-colors">
                    <div className="w-12 h-12 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg flex items-center justify-center text-secondary-600 dark:text-secondary-400 mb-4 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        Data Kurikulum
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Lihat struktur mata kuliah, CPL, dan pemetaan CPMK.
                    </p>
                    <Link to="/kaprodi/curriculum" className="inline-flex items-center text-sm font-semibold text-secondary-600 hover:text-secondary-700">
                        Kelola Kurikulum <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
