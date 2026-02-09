import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, Users, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from '../lib/axios';
import useAuthStore from '../store/useAuthStore';

export default function DosenDashboard() {
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
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Dashboard Dosen
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Welcome back, {user?.nama_lengkap}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Assigned Courses</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {stats?.assignedCoursesCount || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">This semester</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total RPS</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {stats?.rpsStats?.total || 0}
                            </p>
                            {stats?.rpsStats && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {stats.rpsStats.approved} approved • {stats.rpsStats.pending} pending
                                </p>
                            )}
                        </div>
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Draft RPS</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {stats?.rpsStats?.draft || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Need completion</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Students</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {stats?.totalStudents || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Across all courses</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* RPS Breakdown */}
            {stats?.rpsStats && (
                <div className="card p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        RPS Status Breakdown
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rpsStats.draft}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Draft</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rpsStats.pending}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-700 dark:text-green-300" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rpsStats.approved}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="card p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link to="/dosen/rps" className="btn btn-primary justify-start">
                        <FileText className="w-5 h-5 mr-2" />
                        Kelola RPS Saya
                    </Link>
                    <Link to="/dosen/courses" className="btn btn-secondary justify-start">
                        <BookOpen className="w-5 h-5 mr-2" />
                        Lihat Mata Kuliah
                    </Link>
                    <Link to="/dosen/grades" className="btn btn-secondary justify-start">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Input Nilai
                    </Link>
                </div>
            </div>

            {/* Action Needed Alert */}
            {stats?.rpsStats?.draft > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                                RPS Needs Completion
                            </h3>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                You have {stats.rpsStats.draft} RPS draft{stats.rpsStats.draft > 1 ? 's' : ''} that need to be completed and submitted for approval.
                            </p>
                            <Link
                                to="/dosen/rps"
                                className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline mt-2 inline-block"
                            >
                                Continue Editing →
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
