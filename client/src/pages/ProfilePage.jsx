import React, { useState, useRef, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { User, Mail, Phone, Briefcase, MapPin, Hash, Award, Camera, Image as ImageIcon, Palette, Search, Upload, X, Check, Loader2, Lock } from 'lucide-react';
import { getTagColor } from '../utils/ui';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';

// Expanded color/gradient options
const SOLID_COLORS = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500',
    'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
    'bg-pink-500', 'bg-rose-500', 'bg-slate-500', 'bg-gray-500', 'bg-zinc-700',
];

const GRADIENTS = [
    'bg-gradient-to-r from-primary-700 to-primary-500',
    'bg-gradient-to-r from-blue-700 to-cyan-500',
    'bg-gradient-to-r from-emerald-700 to-teal-500',
    'bg-gradient-to-r from-orange-700 to-amber-500',
    'bg-gradient-to-r from-purple-700 to-pink-500',
    'bg-gradient-to-r from-slate-800 to-slate-600',
    'bg-gradient-to-r from-rose-500 to-orange-400',
    'bg-gradient-to-r from-violet-600 to-indigo-600',
    'bg-gradient-to-r from-cyan-500 to-blue-500',
    'bg-gradient-to-r from-green-400 to-cyan-500',
];

// Sample Unsplash images for quick selection
const UNSPLASH_PRESETS = [
    'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&q=80&w=1200',
];

const ProfilePage = () => {
    const { user, checkAuth } = useAuthStore();
    const [isHoveringCover, setIsHoveringCover] = useState(false);
    const [showCoverMenu, setShowCoverMenu] = useState(false);
    const [activeTab, setActiveTab] = useState('colors'); // colors, unsplash, upload
    const [loading, setLoading] = useState(false);
    const [unsplashQuery, setUnsplashQuery] = useState('');
    const [unsplashResults, setUnsplashResults] = useState([]);
    const [searchingUnsplash, setSearchingUnsplash] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [changingPassword, setChangingPassword] = useState(false);

    // Upload refs
    const coverFileRef = useRef(null);
    const avatarFileRef = useRef(null);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowCoverMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    // --- Cover Image Handlers ---

    const handleUpdateCoverUrl = async (coverValue) => {
        try {
            setLoading(true);
            await axios.put('/auth/profile', { cover_image: coverValue });
            await checkAuth();
            setShowCoverMenu(false);
            toast.success('Cover image updated');
        } catch (error) {
            console.error('Failed to update cover:', error);
            toast.error('Failed to update cover');
        } finally {
            setLoading(false);
        }
    };

    const handleCoverFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        const formData = new FormData();
        formData.append('cover', file);

        try {
            setLoading(true);
            await axios.post('/auth/cover-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await checkAuth();
            setShowCoverMenu(false);
            toast.success('Cover image uploaded');
        } catch (error) {
            console.error('Failed to upload cover:', error);
            const msg = error.response?.data?.message || 'Failed to upload cover';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchUnsplash = async () => {
        if (!unsplashQuery.trim()) return;

        setSearchingUnsplash(true);
        try {
            // Using Unsplash Source for simple random images by query (deprecated but using for demo) or placeholders
            const results = Array.from({ length: 6 }, (_, i) =>
                `https://source.unsplash.com/1200x400/?${encodeURIComponent(unsplashQuery)}&sig=${Date.now() + i}`
            );
            setUnsplashResults(results);
        } catch (error) {
            console.error('Unsplash search failed:', error);
        } finally {
            setSearchingUnsplash(false);
        }
    };

    const handleRemoveCover = async () => {
        try {
            setLoading(true);
            await axios.put('/auth/profile', { cover_image: null });
            await checkAuth();
            setShowCoverMenu(false);
        } catch (error) {
            toast.error('Failed to remove cover');
        } finally {
            setLoading(false);
        }
    };

    // --- Avatar Handlers ---

    const handleAvatarUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        const formData = new FormData();
        formData.append('photo', file);

        try {
            setLoading(true);
            await axios.post('/auth/profile-picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await checkAuth();
            toast.success('Avatar updated');
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            const msg = error.response?.data?.message || 'Failed to upload avatar';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // --- Password Handler ---

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setChangingPassword(true);
        try {
            await axios.post('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Password changed successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };


    // Determine Cover Style
    const currentCover = user.cover_image;
    const isImageUrl = currentCover && (currentCover.startsWith('http') || currentCover.startsWith('/') || currentCover.startsWith('data:'));

    const coverStyle = isImageUrl
        ? { backgroundImage: `url(${currentCover})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : {};

    const coverClass = !isImageUrl && currentCover
        ? currentCover
        : (!currentCover ? GRADIENTS[0] : '');

    return (
        <div className="p-6 max-w-4xl mx-auto mb-20 animate-fade-in">
            {/* Cover Area */}
            <div
                className={`group relative h-48 w-full rounded-xl shadow-lg overflow-visible transition-all duration-300 ${coverClass}`}
                style={coverStyle}
                onMouseEnter={() => setIsHoveringCover(true)}
                onMouseLeave={() => setIsHoveringCover(false)}
            >
                {/* Overlay for better text visibility on images */}
                {isImageUrl && <div className="absolute inset-0 bg-black/10 rounded-xl" />}

                {/* Change Cover Button */}
                <div className={`absolute top-4 right-4 transition-opacity duration-200 ${isHoveringCover || showCoverMenu ? 'opacity-100' : 'opacity-0'}`}>
                    <div ref={menuRef} className="relative">
                        <button
                            onClick={() => setShowCoverMenu(!showCoverMenu)}
                            className="btn btn-sm bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm border-0 gap-2 shadow-lg"
                        >
                            <ImageIcon className="w-4 h-4" /> Ubah Cover
                        </button>

                        {showCoverMenu && (
                            <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-4 w-80 z-50 border border-gray-200 dark:border-gray-700 animate-slide-up-sm">
                                {/* Tabs */}
                                <div className="flex gap-1 mb-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <button
                                        onClick={() => setActiveTab('colors')}
                                        className={`flex-1 py-1 px-3 text-xs font-medium rounded-md transition-all ${activeTab === 'colors'
                                            ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <Palette className="w-3 h-3 inline mr-1" /> Warna
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('unsplash')}
                                        className={`flex-1 py-1 px-3 text-xs font-medium rounded-md transition-all ${activeTab === 'unsplash'
                                            ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <Search className="w-3 h-3 inline mr-1" /> Unsplash
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('upload')}
                                        className={`flex-1 py-1 px-3 text-xs font-medium rounded-md transition-all ${activeTab === 'upload'
                                            ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <Upload className="w-3 h-3 inline mr-1" /> Upload
                                    </button>
                                </div>

                                {/* Colors Tab */}
                                {activeTab === 'colors' && (
                                    <div className="space-y-3">
                                        <div>
                                            <h4 className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">Warna Solid</h4>
                                            <div className="grid grid-cols-10 gap-1.5">
                                                {SOLID_COLORS.map((c, i) => (
                                                    <button
                                                        key={i}
                                                        className={`w-6 h-6 rounded-md ${c} border-2 border-transparent hover:border-gray-400 hover:scale-110 transition-transform`}
                                                        onClick={() => handleUpdateCoverUrl(c)}
                                                        disabled={loading}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">Gradient</h4>
                                            <div className="grid grid-cols-5 gap-2">
                                                {GRADIENTS.map((c, i) => (
                                                    <button
                                                        key={i}
                                                        className={`w-full h-8 rounded-md ${c} border-2 border-transparent hover:border-gray-400 hover:scale-105 transition-transform`}
                                                        onClick={() => handleUpdateCoverUrl(c)}
                                                        disabled={loading}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Unsplash Tab */}
                                {activeTab === 'unsplash' && (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Cari gambar..."
                                                value={unsplashQuery}
                                                onChange={(e) => setUnsplashQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearchUnsplash()}
                                                className="input input-sm input-bordered flex-1 text-sm"
                                            />
                                            <button
                                                onClick={handleSearchUnsplash}
                                                className="btn btn-sm btn-primary"
                                                disabled={searchingUnsplash}
                                            >
                                                {searchingUnsplash ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                            {(unsplashResults.length > 0 ? unsplashResults : UNSPLASH_PRESETS).map((url, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleUpdateCoverUrl(url)}
                                                    className="aspect-video rounded-md overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all hover:scale-105"
                                                    disabled={loading}
                                                >
                                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Upload Tab */}
                                {activeTab === 'upload' && (
                                    <div className="space-y-3">
                                        <div
                                            onClick={() => coverFileRef.current?.click()}
                                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                        >
                                            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Klik untuk upload gambar</p>
                                            <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF (max 5MB)</p>
                                        </div>
                                        <input
                                            ref={coverFileRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCoverFileUpload}
                                            className="hidden"
                                        />
                                    </div>
                                )}

                                {/* Remove Cover Option */}
                                <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3">
                                    <button
                                        onClick={handleRemoveCover}
                                        className="btn btn-xs btn-ghost text-red-500 w-full"
                                        disabled={loading}
                                    >
                                        <X className="w-3 h-3 mr-1" /> Hapus Cover
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Header Content */}
            <div className="px-8 max-w-4xl mx-auto">
                <div className="relative flex flex-col md:flex-row items-start md:items-end -mt-16 pt-4 mb-8 gap-6">
                    {/* Avatar */}
                    <div className="relative group flex-shrink-0">
                        <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-700 overflow-hidden shadow-lg flex items-center justify-center relative">
                            {user.foto_profil ? (
                                <img src={user.foto_profil} alt={user.nama_lengkap} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-16 h-16 text-gray-400" />
                            )}

                            {/* Avatar Upload Overlay */}
                            <div
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]"
                                onClick={() => avatarFileRef.current?.click()}
                            >
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                            <input
                                ref={avatarFileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                            />
                        </div>
                    </div>

                    {/* Name & Role */}
                    <div className="flex-1 pt-20 md:pt-0 md:pb-2">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">{user.nama_lengkap}</h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400 font-medium capitalize flex items-center gap-2 mt-1">
                            {user.role}
                            {user.is_active && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Active"></span>}
                        </p>
                    </div>
                </div>

                {/* Main Grid: Details + Security */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Details (Span 2) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Contact Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-primary-500" /> Kontak
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Email</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{user.email}</span>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Username</span>
                                    <span className="font-medium text-gray-900 dark:text-white">@{user.username}</span>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Telepon</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{user.telepon || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Academic Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Award className="w-4 h-4 text-primary-500" /> Akademik & Pekerjaan
                            </h3>
                            <div className="space-y-4">
                                {(user.nidn || user.homebase) && (
                                    <div className="flex gap-4">
                                        {user.nidn && <span className="badge badge-outline">NIDN: {user.nidn}</span>}
                                        {user.homebase && <span className="badge badge-primary badge-outline">{user.homebase}</span>}
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user.jabatan && (
                                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                            <Briefcase className="w-4 h-4 text-gray-400" />
                                            <span>{user.jabatan}</span>
                                        </div>
                                    )}
                                    {user.status_kepegawaian && (
                                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                            <Award className="w-4 h-4 text-gray-400" />
                                            <span className={`${getTagColor(user.status_kepegawaian)} px-2 py-0.5 rounded text-xs font-semibold`}>
                                                {user.status_kepegawaian}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Security (Span 1) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 sticky top-24">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-primary-500" /> Keamanan
                            </h3>

                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Password Saat Ini</label>
                                    <input
                                        type="password"
                                        className="input input-sm w-full"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Password Baru</label>
                                    <input
                                        type="password"
                                        className="input input-sm w-full"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Konfirmasi Password</label>
                                    <input
                                        type="password"
                                        className="input input-sm w-full"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-sm w-full mt-2"
                                    disabled={changingPassword}
                                >
                                    {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ganti Password'}
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
