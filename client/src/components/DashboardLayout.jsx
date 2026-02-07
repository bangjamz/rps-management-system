import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useThemeStore from '../store/useThemeStore';
import useAcademicStore from '../store/useAcademicStore';
import { ROLES } from '../utils/permissions';
import {
    Calendar, Bell, User, Settings, LogOut, ChevronDown,
    Home, GraduationCap, BookOpen, FileText, Users, BarChart, Award, FileQuestion, HelpCircle
} from 'lucide-react';
import axios from '../lib/axios';
import HelpModal from './HelpModal';

export default function DashboardLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const { activeSemester, activeYear, setSemester, setYear } = useAcademicStore();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const profileMenuRef = useRef(null);

    // Role Switcher State
    const [activeRole, setActiveRole] = useState(user?.role || ROLES.DOSEN);

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

    // Handle Role Switch
    const handleRoleSwitch = (e) => {
        const newRole = e.target.value;
        setActiveRole(newRole);

        // Navigate to the respective dashboard to avoid dead links
        if (newRole === ROLES.KAPRODI) {
            navigate('/kaprodi/dashboard');
        } else if (newRole === ROLES.DOSEN) {
            navigate('/dosen/dashboard');
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
                { label: 'Dashboard', icon: Home, path: '/kaprodi/dashboard' },
                { label: 'Data Kurikulum', icon: GraduationCap, path: '/kaprodi/curriculum' },
                { label: 'Mata Kuliah', icon: BookOpen, path: '/kaprodi/courses' },
                { label: 'Kelola RPS', icon: FileText, path: '/kaprodi/rps' },
                { label: 'Data Dosen', icon: Users, path: '/kaprodi/data-dosen' }, // Adjusted order: Below RPS
                { label: 'Laporan', icon: BarChart, path: '/kaprodi/reports' },
            ];
        }

        // DOSEN VIEW (Active Role is Dosen OR User is just Dosen)
        if (activeRole === ROLES.DOSEN) {
            return [
                { label: 'Dashboard', icon: Home, path: '/dosen/dashboard' },
                { label: 'Mata Kuliah Saya', icon: BookOpen, path: '/dosen/courses' },
                { label: 'RPS Saya', icon: FileText, path: '/dosen/rps' },
            ];
        }

        // MAHASISWA VIEW
        if (activeRole === ROLES.MAHASISWA) {
            return [
                { label: 'Dashboard', icon: Home, path: '/mahasiswa/dashboard' },
                { label: 'Jadwal Kuliah', icon: Calendar, path: '/mahasiswa/schedule' },
                { label: 'Nilai Semester', icon: Award, path: '/mahasiswa/grades' },
            ];
        }

        return [];
    }, [activeRole]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex font-sans">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <img
                        src="/logo-mahardika.jpg"
                        alt="Logo Institut Mahardika"
                        className="w-10 h-10 rounded-lg object-cover shadow-sm"
                    />
                    <div>
                        <h1 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">SAMPIRANS</h1>
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">Institut Mahardika</p>
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
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Sidebar Footer: Settings & Role Switcher */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0 space-y-3">
                    {/* Role Switcher (Only if Kaprodi) */}
                    {user?.role === ROLES.KAPRODI && (
                        <div className="relative">
                            <label className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1 block pl-1">Switch View</label>
                            <div className="relative">
                                <select
                                    value={activeRole}
                                    onChange={handleRoleSwitch}
                                    className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-2 pl-3 pr-8 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow"
                                >
                                    <option value={ROLES.KAPRODI}>Kaprodi</option>
                                    <option value={ROLES.DOSEN}>Dosen</option>
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
                                    {Array.from({ length: 5 }, (_, i) => {
                                        const startYear = new Date().getFullYear() - 1 + i;
                                        const yearStr = `${startYear}/${startYear + 1}`;
                                        return <option key={yearStr} value={yearStr}>{yearStr}</option>;
                                    })}
                                </select>
                            </div>
                        )}

                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            {theme === 'dark' ? <div className="w-5 h-5">☀️</div> : <div className="w-5 h-5">🌙</div>}
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
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white dark:ring-gray-900 overflow-hidden">
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
            </div>
            {/* Help Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        </div>
    );
}
