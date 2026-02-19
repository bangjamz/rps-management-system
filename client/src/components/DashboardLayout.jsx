import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useThemeStore from '../store/useThemeStore';
import useAcademicStore from '../store/useAcademicStore';
import useGlobalStore from '../store/useGlobalStore';
import { ROLES } from '../utils/permissions';
import {
    Home, GraduationCap, BookOpen, FileText, Users, BarChart, Award, FileQuestion, HelpCircle, AlertTriangle, LogIn, Search, X, Sun, Moon,
    Calendar, Settings, ArrowLeftRight, ChevronDown, User, LogOut
} from 'lucide-react';
import axios from '../lib/axios';
import HelpModal from './HelpModal';
import toast from 'react-hot-toast';

// Role display names
const ROLE_LABELS = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    dekan: 'Dekan',
    kaprodi: 'Kaprodi',
    dosen: 'Dosen',
    mahasiswa: 'Mahasiswa'
};

export default function DashboardLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, activeRole, setActiveRole, isImpersonating, adminRestoreToken, endImpersonation, canSwitchRoles, getAvailableRoles } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const { activeSemester, activeYear, setSemester, setYear, academicYears, setAcademicYears } = useAcademicStore();
    const { settings } = useGlobalStore();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const profileMenuRef = useRef(null);
    const [isSwitchingRole, setIsSwitchingRole] = useState(false);

    // Login As modal state
    const [showLoginAsModal, setShowLoginAsModal] = useState(false);
    const [loginAsUsers, setLoginAsUsers] = useState([]);
    const [loginAsSearch, setLoginAsSearch] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);
    const { startImpersonation } = useAuthStore();

    // Confirmation dialog state
    const [pendingImpersonation, setPendingImpersonation] = useState(null);
    const [impersonating, setImpersonating] = useState(false);

    // Notifications State
    const [unreadCount, setUnreadCount] = useState(0);

    // Sync activeRole with user.role on mount/change
    useEffect(() => {
        if (user?.role) {
            setActiveRole(user.role);
        }
    }, [user?.role]);

    // Handle Click Outside for Profile Menu
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [profileMenuRef]);

    // Handle Role Switch with API call to get new token
    const handleRoleSwitch = async (e) => {
        const newRole = e.target.value;
        if (newRole === activeRole) return;

        setIsSwitchingRole(true);
        try {
            const res = await axios.post('/auth/switch-role', { newRole });
            setActiveRole(res.data.activeRole, res.data.token);
            toast.success(`Switched to ${ROLE_LABELS[newRole] || newRole}`);

            // Navigate to the respective dashboard
            const dashboardRoutes = {
                superadmin: '/super-admin',
                admin: '/super-admin',
                dekan: '/dekan/dashboard',
                kaprodi: '/kaprodi/dashboard',
                dosen: '/dosen/dashboard',
                mahasiswa: '/mahasiswa/dashboard'
            };
            if (dashboardRoutes[newRole]) {
                navigate(dashboardRoutes[newRole]);
            }
        } catch (err) {
            console.error('Role switch failed:', err);
            toast.error('Failed to switch role');
        } finally {
            setIsSwitchingRole(false);
        }
    };

    // Handle end impersonation
    const handleEndImpersonation = async () => {
        if (!window.confirm('Kembali ke akun Super Admin?')) return;

        try {
            const res = await axios.post('/auth/impersonate/end', { adminRestoreToken });
            endImpersonation(res.data.user, res.data.token);
            toast.success('Returned to admin session');
            // Use window.location for clean state transition
            window.location.href = '/super-admin/users';
        } catch (err) {
            console.error('End impersonation failed:', err);
            toast.error('Failed to end impersonation');
        }
    };

    // Confirm and execute impersonation
    const confirmImpersonation = async () => {
        if (!pendingImpersonation) return;

        setImpersonating(true);
        try {
            const res = await axios.post(`/auth/impersonate/${pendingImpersonation.id}`);
            startImpersonation(res.data.user, res.data.token, res.data.adminRestoreToken);
            toast.success(`Now logged in as ${pendingImpersonation.nama_lengkap}`);
            setPendingImpersonation(null);
            setShowLoginAsModal(false);

            const dashboardRoutes = {
                kaprodi: '/kaprodi/dashboard',
                dosen: '/dosen/dashboard',
                mahasiswa: '/mahasiswa/dashboard',
                admin: '/super-admin',
                dekan: '/dekan/dashboard'
            };
            // Use window.location for clean state transition
            window.location.href = dashboardRoutes[pendingImpersonation.role] || '/dashboard';
        } catch (err) {
            toast.error('Failed to login as this user');
        } finally {
            setImpersonating(false);
        }
    };

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await axios.get('/notifications');
                setUnreadCount(res.data.unreadCount || 0);
            } catch (err) {
                console.error('Failed to fetch notifications', err);
            }
        };
        fetchNotifications();
    }, []);

    // Sync active academic year from DB on mount
    useEffect(() => {
        const syncActiveAcademicYear = async () => {
            try {
                const res = await axios.get('/academic-years');
                const activeYear = res.data.find(y => y.is_active);
                if (activeYear) {
                    setSemester(activeYear.active_semester || 'Ganjil');
                    setYear(activeYear.name);
                }
            } catch (err) {
                console.error('Failed to sync academic year', err);
            }
        };
        syncActiveAcademicYear();
    }, [setSemester, setYear]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Navigation items based on role
    const navItems = useMemo(() => {
        // KAPRODI VIEW
        if (activeRole === ROLES.KAPRODI) {
            return [
                { label: 'Beranda', icon: Home, path: '/kaprodi/dashboard' },
                { label: 'Kurikulum', icon: GraduationCap, path: '/kaprodi/curriculum' },
                { label: 'Mata Kuliah', icon: BookOpen, path: '/kaprodi/courses' },
                { label: 'Distribusi MK', icon: Calendar, path: '/kaprodi/mk-aktif' },
                { label: 'Kelola RPS', icon: FileText, path: '/kaprodi/rps' },
                { label: 'Data Dosen', icon: Users, path: '/kaprodi/data-dosen' },
                { label: 'Laporan', icon: BarChart, path: '/kaprodi/reports' },
            ];
        }

        // DOSEN VIEW (Active Role is Dosen OR User is just Dosen)
        if (activeRole === ROLES.DOSEN) {
            return [
                { label: 'Beranda', icon: Home, path: '/dosen/dashboard' },
                { label: 'Mata Kuliah Saya', icon: BookOpen, path: '/dosen/courses' },
                { label: 'RPS Saya', icon: FileText, path: '/dosen/rps' },
            ];
        }

        // MAHASISWA VIEW
        if (activeRole === ROLES.MAHASISWA) {
            return [
                { label: 'Beranda', icon: Home, path: '/mahasiswa/dashboard' },
                { label: 'Jadwal Kuliah', icon: Calendar, path: '/mahasiswa/schedule' },
                { label: 'Nilai Semester', icon: Award, path: '/mahasiswa/grades' },
            ];
        }

        // SUPER ADMIN VIEW
        if (activeRole === 'superadmin' || activeRole === 'admin') {
            return [
                { label: 'Panel Admin', icon: Settings, path: '/super-admin' },
                // Add other common views if needed, or keep it exclusive
            ];
        }

        return [];
    }, [activeRole]);

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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex font-sans">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="bg-white dark:bg-gray-800 rounded-lg w-10 h-10 flex items-center justify-center overflow-hidden border dark:border-gray-700 shadow-sm shrink-0">
                        <img
                            src={appLogo}
                            alt={appName}
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
                            {appName}
                        </p>
                    </div>
                </div>

                {/* Navigation Scroll Area */}
                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu Utama</div>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Sidebar Footer: Settings & Role Switcher */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0 space-y-3">
                    {/* Dynamic Role Switcher (for users with multiple roles) */}
                    {canSwitchRoles() && (
                        <div className="relative">
                            <label className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1 block pl-1 flex items-center gap-1">
                                <ArrowLeftRight className="w-3 h-3" />
                                Beralih Peran
                            </label>
                            <div className="relative">
                                <select
                                    value={activeRole || user?.role}
                                    onChange={handleRoleSwitch}
                                    disabled={isSwitchingRole}
                                    className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-2 pl-3 pr-8 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-shadow disabled:opacity-50"
                                >
                                    {getAvailableRoles().map(role => (
                                        <option key={role} value={role}>
                                            {ROLE_LABELS[role] || role}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    )}

                    <Link
                        to="/settings"
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/settings'
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700'
                            }`}
                    >
                        <Settings className="w-5 h-5 text-gray-500" />
                        Pengaturan
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 ml-64 flex flex-col min-w-0">
                {/* Impersonation Banner */}
                {isImpersonating && (
                    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between z-30">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                Sedang Login Sebagai: <strong>{user?.nama_lengkap}</strong> ({user?.role})
                            </span>
                        </div>
                        <button
                            onClick={handleEndImpersonation}
                            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
                        >
                            Kembali ke Admin
                        </button>
                    </div>
                )}
                {/* Header */}
                <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
                    <div>
                        {/* Breadcrumb or Page Title could go here */}
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Semester Selector (Kaprodi Only) */}
                        {user?.role === 'kaprodi' && (
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 text-sm">
                                <select
                                    value={activeSemester}
                                    onChange={(e) => setSemester(e.target.value)}
                                    className="bg-transparent border-none text-xs font-semibold focus:ring-0 cursor-pointer text-gray-700 dark:text-gray-300 pr-6 py-0 focus:outline-none"
                                >
                                    <option value="Ganjil">Sem. Ganjil</option>
                                    <option value="Genap">Sem. Genap</option>
                                </select>
                                <div className="w-px h-3 bg-gray-300 dark:bg-gray-600"></div>
                                <select
                                    value={activeYear}
                                    onChange={(e) => setYear(e.target.value)}
                                    className="bg-transparent border-none text-xs font-semibold focus:ring-0 cursor-pointer text-gray-700 dark:text-gray-300 pr-6 py-0 focus:outline-none"
                                >
                                    {academicYears.length > 0 ? (
                                        academicYears.sort((a, b) => b.name.localeCompare(a.name)).map((year) => (
                                            <option key={year.id || year.name} value={year.name}>{year.name}</option>
                                        ))
                                    ) : (
                                        <option value={new Date().getFullYear() + '/' + (new Date().getFullYear() + 1)}>
                                            {new Date().getFullYear()}/{new Date().getFullYear() + 1}
                                        </option>
                                    )}
                                </select>
                            </div>
                        )}

                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        <button
                            onClick={() => setShowHelp(true)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            title="Bantuan"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={profileMenuRef}>
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                            >
                                { /* Hidden as per request
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                                        {user?.nama_lengkap}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide font-medium">
                                        {activeRole}
                                    </p>
                                </div>
                                */ }
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white dark:ring-gray-900 overflow-hidden">
                                    {user?.foto_profil ? (
                                        <img src={user.foto_profil} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{user?.nama_lengkap?.charAt(0) || 'U'}</span>
                                    )}
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {showProfileMenu && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 py-2 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 mb-1">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.nama_lengkap}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                    <Link
                                        to="/profile"
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => setShowProfileMenu(false)}
                                    >
                                        <User size={16} />
                                        Profil Saya
                                    </Link>
                                    <Link
                                        to="/settings"
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => setShowProfileMenu(false)}
                                    >
                                        <Settings size={16} />
                                        Pengaturan Akun
                                    </Link>
                                    <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                                    {/* Login As - Super Admin Only */}
                                    {user?.role === 'superadmin' && (
                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                setShowLoginAsModal(true);
                                                // Fetch users
                                                setLoadingUsers(true);
                                                axios.get('/users').then(res => {
                                                    setLoginAsUsers(res.data.filter(u => u.role !== 'superadmin'));
                                                }).catch(() => toast.error('Failed to load users')).finally(() => setLoadingUsers(false));
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left"
                                        >
                                            <LogIn size={16} />
                                            Login Sebagai User Lain
                                        </button>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-left"
                                    >
                                        <LogOut size={16} />
                                        Keluar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div >
            {/* Help Modal */}
            < HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)
            } />

            {/* Login As User Selector Modal */}
            {
                showLoginAsModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLoginAsModal(false)}>
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <LogIn className="w-5 h-5 text-indigo-600" />
                                    Login Sebagai User Lain
                                </h3>
                                <button onClick={() => setShowLoginAsModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama atau email user..."
                                        value={loginAsSearch}
                                        onChange={(e) => setLoginAsSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="overflow-y-auto max-h-[50vh]">
                                {loadingUsers ? (
                                    <div className="p-8 text-center text-gray-500">Loading users...</div>
                                ) : loginAsUsers.filter(u =>
                                    u.nama_lengkap?.toLowerCase().includes(loginAsSearch.toLowerCase()) ||
                                    u.email?.toLowerCase().includes(loginAsSearch.toLowerCase()) ||
                                    u.username?.toLowerCase().includes(loginAsSearch.toLowerCase())
                                ).length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">No users found</div>
                                ) : (
                                    loginAsUsers.filter(u =>
                                        u.nama_lengkap?.toLowerCase().includes(loginAsSearch.toLowerCase()) ||
                                        u.email?.toLowerCase().includes(loginAsSearch.toLowerCase()) ||
                                        u.username?.toLowerCase().includes(loginAsSearch.toLowerCase())
                                    ).slice(0, 20).map(targetUser => (
                                        <button
                                            key={targetUser.id}
                                            onClick={() => setPendingImpersonation(targetUser)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 text-left"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                {targetUser.nama_lengkap?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-white truncate">{targetUser.nama_lengkap}</p>
                                                <p className="text-xs text-gray-500 truncate">{targetUser.email}</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full
                                            ${targetUser.role === 'kaprodi' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                    targetUser.role === 'dosen' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        targetUser.role === 'mahasiswa' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                                            >
                                                {ROLE_LABELS[targetUser.role] || targetUser.role}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Impersonation Confirmation Modal */}
            {
                pendingImpersonation && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]" onClick={() => setPendingImpersonation(null)}>
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                    {pendingImpersonation.nama_lengkap?.charAt(0) || 'U'}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    Konfirmasi Login Sebagai
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-1">
                                    Anda akan login sebagai:
                                </p>
                                <p className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                                    {pendingImpersonation.nama_lengkap}
                                </p>
                                <p className="text-sm text-gray-500 mb-4">
                                    dengan peran <span className={`font-semibold px-2 py-0.5 rounded-full text-xs
                                    ${pendingImpersonation.role === 'kaprodi' ? 'bg-purple-100 text-purple-700' :
                                            pendingImpersonation.role === 'dosen' ? 'bg-blue-100 text-blue-700' :
                                                pendingImpersonation.role === 'mahasiswa' ? 'bg-green-100 text-green-700' :
                                                    'bg-gray-100 text-gray-700'}`}>
                                        {ROLE_LABELS[pendingImpersonation.role] || pendingImpersonation.role}
                                    </span>
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPendingImpersonation(null)}
                                    disabled={impersonating}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmImpersonation}
                                    disabled={impersonating}
                                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    {impersonating ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Memproses...
                                        </>
                                    ) : (
                                        'OK'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
