import React, { useState, useRef, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import useThemeStore from '../store/useThemeStore';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import useGlobalStore from '../store/useGlobalStore';
import {
    FaUniversity,
    FaUsers,
    FaUserCheck,
    FaUserShield,
    FaCogs,
    FaChartLine,
    FaSignOutAlt,
    FaUserCircle,
    FaChevronDown,
    FaHome,
    FaBuilding,
    FaGraduationCap,
    FaFileAlt,
    FaCalendarAlt,
    FaClock,
    FaCheckCircle,
    FaTimesCircle,
    FaHourglassHalf,
    FaUserPlus,
    FaBars
} from 'react-icons/fa';
import { Sun, Moon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from '../lib/axios';

// Role labels
const ROLE_LABELS = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    dekan: 'Dekan',
    kaprodi: 'Kaprodi',
    dosen: 'Dosen',
    mahasiswa: 'Mahasiswa'
};

// Role colors for chart
const ROLE_COLORS = {
    superadmin: '#6366f1',
    admin: '#8b5cf6',
    dekan: '#ec4899',
    kaprodi: '#f59e0b',
    dosen: '#3b82f6',
    mahasiswa: '#10b981'
};

const SuperAdminDashboard = () => {
    const { user, logout } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const { settings } = useGlobalStore();
    const location = useLocation();

    const appName = settings?.nama_pt || 'Institut Teknologi dan Kesehatan Mahardika';
    const initials = appName
        ?.split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '??';
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const profileRef = useRef(null);

    // Dashboard stats state
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch dashboard stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/dashboard/stats');
                setStats(res.data.stats);
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoadingStats(false);
            }
        };
        if (location.pathname === '/super-admin') {
            fetchStats();
        }
    }, [location.pathname]);

    // Redirect if not superadmin
    if (user?.role !== 'superadmin' && user?.role !== 'admin') {
        return <Navigate to="/login" replace />;
    }

    const menuItems = [
        {
            title: 'Dashboard',
            path: '/super-admin',
            icon: <FaHome className="w-5 h-5" />,
            description: 'Ringkasan dan statistik'
        },
        {
            title: 'Pengaturan Global',
            path: '/super-admin/settings',
            icon: <FaUniversity className="w-5 h-5" />,
            description: 'Kelola identitas institusi dan default'
        },
        {
            title: 'Manajemen Pengguna',
            path: '/super-admin/users',
            icon: <FaUsers className="w-5 h-5" />,
            description: 'Lihat dan kelola semua pengguna'
        },
        {
            title: 'Peran Kustom',
            path: '/super-admin/roles',
            icon: <FaUserShield className="w-5 h-5" />,
            description: 'Buat dan kelola peran admin kustom'
        },
        {
            title: 'Fakultas & Prodi',
            path: '/super-admin/organization',
            icon: <FaBuilding className="w-5 h-5" />,
            description: 'Kelola fakultas dan program studi'
        },
        {
            title: 'Pengaturan Akademik',
            path: '/super-admin/academic',
            icon: <FaCalendarAlt className="w-5 h-5" />,
            description: 'Tahun akademik dan semester'
        }
    ];

    // Simple donut chart component
    const DonutChart = ({ data, colors, total, label }) => {
        const size = 140;
        const strokeWidth = 20;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        let offset = 0;

        const segments = Object.entries(data).filter(([, value]) => value > 0);

        return (
            <div className="flex flex-col items-center">
                <svg width={size} height={size} className="transform -rotate-90">
                    {segments.map(([key, value], index) => {
                        const percentage = (value / total) * 100;
                        const strokeDasharray = (percentage / 100) * circumference;
                        const strokeDashoffset = -offset;
                        offset += strokeDasharray;

                        return (
                            <circle
                                key={key}
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="none"
                                stroke={colors[key] || '#e5e7eb'}
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${strokeDasharray} ${circumference}`}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-500"
                            />
                        );
                    })}
                </svg>
                <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">{total}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                </div>
            </div>
        );
    };

    // Dashboard Overview Content
    const DashboardOverview = () => {
        if (loadingStats) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            );
        }

        if (!stats) {
            return <div className="text-center text-gray-500 dark:text-gray-400 py-8">Gagal memuat statistik</div>;
        }

        const statCards = [
            { label: 'Total Pengguna', value: stats.totalUsers, icon: <FaUsers />, color: 'bg-primary-500', change: `+${stats.recentRegistrations} minggu ini` },
            { label: 'Menunggu Persetujuan', value: stats.pendingApprovals, icon: <FaUserCheck />, color: 'bg-accent-500', urgent: stats.pendingApprovals > 0 },
            { label: 'Total RPS', value: stats.totalRPS, icon: <FaFileAlt />, color: 'bg-green-500' },
            { label: 'Fakultas', value: stats.fakultasCount, icon: <FaBuilding />, color: 'bg-purple-500' },
            { label: 'Program Studi', value: stats.prodiCount, icon: <FaGraduationCap />, color: 'bg-secondary-500' },
            { label: 'Mata Kuliah', value: stats.mataKuliahCount, icon: <FaFileAlt />, color: 'bg-teal-500' }
        ];

        return (
            <div className="space-y-6">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white shadow-lg">
                    <h2 className="text-2xl font-bold mb-2">Selamat datang kembali, {user?.nama_lengkap}!</h2>
                    <p className="text-primary-100">Berikut adalah ringkasan sistem hari ini.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {statCards.map((card, idx) => (
                        <div key={idx} className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 ${card.urgent ? 'ring-2 ring-amber-400' : ''}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 rounded-lg ${card.color} text-white flex items-center justify-center shadow-md`}>
                                    {card.icon}
                                </div>
                                {card.urgent && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs rounded-full font-medium">Action</span>}
                            </div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{card.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
                            {card.change && <p className="text-xs text-green-600 dark:text-green-400 mt-1">{card.change}</p>}
                        </div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Users by Role */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Pengguna berdasarkan Peran</h3>
                        <div className="flex items-center justify-between">
                            <div className="relative">
                                <DonutChart
                                    data={stats.usersByRole}
                                    colors={ROLE_COLORS}
                                    total={stats.totalUsers}
                                    label="Pengguna"
                                />
                            </div>
                            <div className="flex-1 ml-6 space-y-2">
                                {Object.entries(stats.usersByRole).map(([role, count]) => (
                                    <div key={role} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ROLE_COLORS[role] }}></div>
                                            <span className="text-sm text-gray-600 dark:text-gray-300">{ROLE_LABELS[role]}</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-800 dark:text-white">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RPS by Status */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Status RPS</h3>
                        <div className="space-y-4">
                            {[
                                { key: 'draft', label: 'Draft', icon: <FaClock className="text-gray-400" />, color: 'bg-gray-200 dark:bg-gray-600' },
                                { key: 'pending', label: 'Menunggu Review', icon: <FaHourglassHalf className="text-amber-500" />, color: 'bg-amber-400' },
                                { key: 'approved', label: 'Disetujui', icon: <FaCheckCircle className="text-green-500" />, color: 'bg-green-400' },
                                { key: 'rejected', label: 'Ditolak', icon: <FaTimesCircle className="text-red-500" />, color: 'bg-red-400' }
                            ].map(status => (
                                <div key={status.key} className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                                        {status.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-gray-600 dark:text-gray-300">{status.label}</span>
                                            <span className="text-sm font-medium text-gray-800 dark:text-white">{stats.rpsByStatus[status.key]}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${status.color} rounded-full transition-all duration-500`}
                                                style={{ width: stats.totalRPS > 0 ? `${(stats.rpsByStatus[status.key] / stats.totalRPS) * 100}%` : '0%' }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions & Recent Users */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Akses Cepat</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Link to="/super-admin/users" className="flex items-center gap-3 p-3 rounded-lg bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 transition-colors">
                                <FaUsers className="text-primary-600 dark:text-primary-400" />
                                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">Pengguna</span>
                            </Link>
                            <Link to="/super-admin/settings" className="flex items-center gap-3 p-3 rounded-lg bg-secondary-50 hover:bg-secondary-100 dark:bg-secondary-900/20 dark:hover:bg-secondary-900/30 transition-colors">
                                <FaCogs className="text-secondary-600 dark:text-secondary-400" />
                                <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Pengaturan</span>
                            </Link>
                            <Link to="/super-admin/organization" className="flex items-center gap-3 p-3 rounded-lg bg-accent-50 hover:bg-accent-100 dark:bg-accent-900/20 dark:hover:bg-accent-900/30 transition-colors">
                                <FaBuilding className="text-accent-600 dark:text-accent-400" />
                                <span className="text-sm font-medium text-accent-700 dark:text-accent-300">Organisasi</span>
                            </Link>
                            <Link to="/super-admin/roles" className="flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 transition-colors">
                                <FaUserShield className="text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium text-green-700 dark:text-green-300">Peran Kustom</span>
                            </Link>
                        </div>
                    </div>

                    {/* Recent Users */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Pendaftaran Terbaru</h3>
                            <Link to="/super-admin/users" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Lihat semua</Link>
                        </div>
                        <div className="space-y-3">
                            {stats.recentUsers?.slice(0, 5).map(u => (
                                <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm">
                                        {u.nama?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{u.nama}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${u.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            u.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                            }`}>
                                            {u.status}
                                        </span>
                                        <span className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded-full">
                                            {ROLE_LABELS[u.role] || u.role}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Menu Cards (existing) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {menuItems.slice(1).map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                    {item.icon}
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{item.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                        </Link>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:shadow-none border-r dark:border-gray-800 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Branding Sidebar Header */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="bg-white dark:bg-gray-800 rounded-lg w-10 h-10 flex items-center justify-center overflow-hidden border dark:border-gray-700 shadow-sm shrink-0">
                        <img
                            src={settings?.logo_path
                                ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${settings.logo_path}?t=${new Date().getTime()}`
                                : null}
                            alt={settings?.nama_pt || 'Institut Mahardika'}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <div style={{ display: 'none' }} className="w-full h-full bg-primary-600 flex items-center justify-center text-white font-bold text-xs uppercase tracking-tighter">
                            {initials}
                        </div>
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">SAMPIRANS</h1>
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium line-clamp-2 max-w-[150px] leading-tight">
                            {settings?.nama_pt || 'Institut Teknologi dan Kesehatan Mahardika'}
                        </p>
                    </div>
                </div>

                <div className="px-6 py-3 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <h2 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FaCogs className="text-primary-600 dark:text-primary-500" />
                        Panel Admin
                    </h2>
                </div>
                <nav className="mt-2 p-4 space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${location.pathname === item.path
                                ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400'
                                : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
                                }`}
                        >
                            <span className="mr-3">{item.icon}</span>
                            {item.title}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white dark:bg-gray-900 shadow-sm z-20 border-b dark:border-gray-800 transition-colors">
                    <div className="px-6 py-3 flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="md:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            >
                                <FaBars className="w-6 h-6" />
                            </button>
                            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                                {menuItems.find(m => m.path === location.pathname)?.title || 'Super Admin'}
                            </h1>
                        </div>

                        <div className="flex items-center gap-4 relative" ref={profileRef}>
                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            <div
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 cursor-pointer p-1.5 px-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">{user?.nama_lengkap}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{user?.role}</p>
                                </div>
                                {user?.foto_profil ? (
                                    <img
                                        src={`${import.meta.env.VITE_API_URL}${user.foto_profil}`}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-primary-100 dark:border-gray-700"
                                        alt="Profile"
                                        onError={(e) => { e.target.src = null; e.target.className = "hidden"; }}
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-gray-700 flex items-center justify-center text-primary-600 dark:text-gray-300">
                                        <FaUserCircle className="w-8 h-8" />
                                    </div>
                                )}
                                <FaChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-2 border-b dark:border-gray-700 mb-1 sm:hidden">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{user?.nama_lengkap}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
                                    </div>
                                    <Link
                                        to="/dashboard"
                                        onClick={() => setIsProfileOpen(false)}
                                        className="flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400"
                                    >
                                        <FaChartLine className="mr-3 w-4 h-4" />
                                        Dashboard Utama
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            toast.success('Berhasil keluar');
                                            window.location.href = '/login';
                                        }}
                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <FaSignOutAlt className="mr-3 w-4 h-4" />
                                        Keluar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950 transition-colors">
                    {location.pathname === '/super-admin' ? (
                        <DashboardOverview />
                    ) : (
                        <Outlet />
                    )}
                </main>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
