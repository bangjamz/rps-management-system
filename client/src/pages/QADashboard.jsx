import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    CheckCircle, Clock, FileText,
    TrendingUp, AlertTriangle, ArrowRight, ShieldCheck
} from 'lucide-react';
import axios from '../lib/axios';
import useAuthStore from '../store/useAuthStore';

export default function QADashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Backend should return institution-wide stats for QA
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
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Welcome */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        Dashboard Penjaminan Mutu
                    </h1>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <span>Monitoring Kualitas RPS & Kurikulum</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-full shadow-sm border border-emerald-100 dark:border-emerald-800">
                    <ShieldCheck className="w-4 h-4" />
                    QA Mode Active
                </div>
            </div>

            {/* Main Hero Card: RPS Progress */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 dark:from-emerald-900 dark:to-teal-950 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden ring-1 ring-white/10 dark:ring-white/5 shadow-neon">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-16 -mb-16 blur-2xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 text-emerald-100">
                            <TrendingUp className="w-5 h-5" />
                            <span className="font-medium tracking-wide">TOTAL KETERSEDIAAN RPS</span>
                        </div>
                        <div className="text-5xl font-bold mb-2 tracking-tight">
                            {stats?.rpsStats?.completionRate || 0}%
                        </div>
                        <p className="text-emerald-100 opacity-90 max-w-md">
                            Persentase mata kuliah di seluruh institut yang telah memiliki dokumen RPS <b>Approved</b>.
                        </p>
                    </div>

                    {/* Funnel Stats */}
                    <div className="flex gap-4 md:gap-8 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                        <div className="text-center px-4 border-r border-white/10 last:border-0">
                            <div className="text-2xl font-bold">{stats?.rpsStats?.total || 0}</div>
                            <div className="text-xs uppercase tracking-wider opacity-70">Total MK</div>
                        </div>
                        <div className="text-center px-4 border-r border-white/10 last:border-0 text-accent-300">
                            <div className="text-2xl font-bold">{stats?.rpsStats?.pending || 0}</div>
                            <div className="text-xs uppercase tracking-wider opacity-70">Butuh Review</div>
                        </div>
                        <div className="text-center px-4 text-green-300">
                            <div className="text-2xl font-bold">{stats?.rpsStats?.approved || 0}</div>
                            <div className="text-xs uppercase tracking-wider opacity-70">Approved</div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar Visual */}
                <div className="mt-8 bg-black/20 rounded-full h-3 overflow-hidden">
                    <div
                        className="bg-accent-400 h-full rounded-full shadow-[0_0_10px_color-mix(in_srgb,var(--color-accent),transparent_50%)] transition-all duration-1000"
                        style={{ width: `${stats?.rpsStats?.completionRate || 0}%` }}
                    ></div>
                </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                {stats.rpsStats.pending} Menunggu Approval
                            </h3>
                            <p className="text-sm text-accent-700 dark:text-accent-300 mb-4">
                                Dokumen RPS yang perlu review QA untuk validasi standar mutu.
                            </p>
                            <Link to="/qa/rps-approval?status=pending" className="inline-flex items-center text-sm font-semibold text-accent-700 hover:text-accent-900 dark:text-accent-400 dark:hover:text-accent-200">
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
                            Semua dokumen RPS telah divalidasi.
                        </p>
                    </div>
                )}

                {/* Report Shortcut */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 group hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        Laporan Audit RPS
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Lihat rekapitulasi kepatuhan RPS seluruh program studi.
                    </p>
                    <Link to="/qa/rps-summary" className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                        Lihat Laporan <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
