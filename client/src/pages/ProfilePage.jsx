import React, { useState, useRef, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { User, Mail, Phone, Briefcase, MapPin, Hash, Award, Camera, Image as ImageIcon, Palette, Search, Upload, X, Check, Loader2 } from 'lucide-react';
import { getTagColor } from '../utils/ui';
import axios from '../lib/axios';

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
    const [coverImage, setCoverImage] = useState(user?.cover_image || null);
    const fileInputRef = useRef(null);
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

    const handleUpdateCover = async (coverValue) => {
        try {
            setLoading(true);
            setCoverImage(coverValue);

            // Update via API
            await axios.put('/auth/profile', { cover_image: coverValue });
            await checkAuth(); // Refresh user data

            setShowCoverMenu(false);
        } catch (error) {
            console.error('Failed to update cover:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchUnsplash = async () => {
        if (!unsplashQuery.trim()) return;

        setSearchingUnsplash(true);
        try {
            // Using Unsplash Source for simple random images by query
            // In production, use Unsplash API with proper key
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

    const handleFileUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Convert to base64 for preview and storage
        const reader = new FileReader();
        reader.onloadend = () => {
            handleUpdateCover(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveCover = async () => {
        try {
            setLoading(true);
            setCoverImage(null);
            await axios.put('/auth/profile', { cover_image: null });
            await checkAuth();
            setShowCoverMenu(false);
        } catch (error) {
            console.error('Failed to remove cover:', error);
        } finally {
            setLoading(false);
        }
    };

    // Determine Cover Style
    const currentCover = coverImage || user.cover_image;
    const isImageUrl = currentCover && (currentCover.startsWith('http') || currentCover.startsWith('data:'));

    const coverStyle = isImageUrl
        ? { backgroundImage: `url(${currentCover})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : {};

    const coverClass = !isImageUrl && currentCover
        ? currentCover
        : (!currentCover ? GRADIENTS[0] : '');

    return (
        <div className="p-6 max-w-4xl mx-auto mb-20">
            {/* Cover Area */}
            <div
                className={`group relative h-48 w-full rounded-xl shadow-lg overflow-visible transition-all duration-300 ${coverClass}`}
                style={coverStyle}
                onMouseEnter={() => setIsHoveringCover(true)}
                onMouseLeave={() => setIsHoveringCover(false)}
            >
                {/* Overlay for better text visibility on images */}
                {isImageUrl && <div className="absolute inset-0 bg-black/10" />}

                {/* Change Cover Button */}
                <div className={`absolute top-4 right-4 transition-opacity duration-200 ${isHoveringCover ? 'opacity-100' : 'opacity-0'}`}>
                    <div ref={menuRef} className="relative">
                        <button
                            onClick={() => setShowCoverMenu(!showCoverMenu)}
                            className="btn btn-sm bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm border-0 gap-2 shadow-lg"
                        >
                            <ImageIcon className="w-4 h-4" /> Ubah Cover
                        </button>

                        {showCoverMenu && (
                            <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-4 w-80 z-50 border border-gray-200 dark:border-gray-700 animate-fade-in">
                                {/* Tabs */}
                                <div className="flex gap-1 mb-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <button
                                        onClick={() => setActiveTab('colors')}
                                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${activeTab === 'colors'
                                            ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <Palette className="w-3 h-3 inline mr-1" /> Warna
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('unsplash')}
                                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${activeTab === 'unsplash'
                                            ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <Search className="w-3 h-3 inline mr-1" /> Unsplash
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('upload')}
                                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${activeTab === 'upload'
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
                                            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Warna Solid</h4>
                                            <div className="grid grid-cols-10 gap-1.5">
                                                {SOLID_COLORS.map((c, i) => (
                                                    <button
                                                        key={i}
                                                        className={`w-6 h-6 rounded-md ${c} border-2 border-transparent hover:border-gray-400 hover:scale-110 transition-transform`}
                                                        onClick={() => handleUpdateCover(c)}
                                                        disabled={loading}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Gradient</h4>
                                            <div className="grid grid-cols-5 gap-2">
                                                {GRADIENTS.map((c, i) => (
                                                    <button
                                                        key={i}
                                                        className={`w-full h-8 rounded-lg ${c} border-2 border-transparent hover:border-gray-400 hover:scale-105 transition-transform`}
                                                        onClick={() => handleUpdateCover(c)}
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

                                        <div>
                                            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                                                {unsplashResults.length > 0 ? 'Hasil Pencarian' : 'Pilihan Populer'}
                                            </h4>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(unsplashResults.length > 0 ? unsplashResults : UNSPLASH_PRESETS).map((url, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleUpdateCover(url)}
                                                        className="aspect-video rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all hover:scale-105"
                                                        disabled={loading}
                                                    >
                                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Upload Tab */}
                                {activeTab === 'upload' && (
                                    <div className="space-y-3">
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                        >
                                            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Klik untuk upload gambar</p>
                                            <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF (max 5MB)</p>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                    </div>
                                )}

                                {/* Remove Cover Option */}
                                {currentCover && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3">
                                        <button
                                            onClick={handleRemoveCover}
                                            className="btn btn-xs btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                                            disabled={loading}
                                        >
                                            <X className="w-3 h-3 mr-1" /> Hapus Cover
                                        </button>
                                    </div>
                                )}

                                {/* Loading Indicator */}
                                {loading && (
                                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-xl flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Header Content - FIXED SPACING */}
            <div className="px-8 max-w-4xl mx-auto">
                <div className="relative flex flex-col md:flex-row items-start md:items-end -mt-16 pt-4 mb-8 gap-6">
                    {/* Avatar */}
                    <div className="relative group flex-shrink-0">
                        <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-700 overflow-hidden shadow-lg flex items-center justify-center">
                            {user.foto_profil ? (
                                <img src={user.foto_profil} alt={user.nama_lengkap} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-16 h-16 text-gray-400" />
                            )}
                        </div>
                    </div>

                    {/* Name & Role - INCREASED TOP SPACING */}
                    <div className="flex-1 pt-20 md:pt-0 md:pb-2">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">{user.nama_lengkap}</h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400 font-medium capitalize flex items-center gap-2 mt-1">
                            {user.role}
                            {user.is_active && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Active"></span>}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="md:pb-2">
                        {/* <button className="btn btn-outline btn-sm">Edit Profil</button> */}
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-slide-up">
                    {/* Column 1: Contact */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Kontak</h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="truncate" title={user.email}>{user.email}</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                    <span className="w-4 flex justify-center text-gray-400 font-bold">@</span>
                                    <span>{user.username}</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{user.telepon || '-'}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Column 2: Academic */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Akademik</h3>
                            <ul className="space-y-3">
                                {user.nidn && (
                                    <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <Hash className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <span className="block text-xs text-gray-400">NIDN</span>
                                            {user.nidn}
                                        </div>
                                    </li>
                                )}
                                {user.homebase && (
                                    <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span className={`${getTagColor('prodi')} px-2 py-0.5 rounded text-[10px] font-bold uppercase border`}>
                                            {user.homebase}
                                        </span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Column 3: Employment */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Kepegawaian</h3>
                            <ul className="space-y-3">
                                {user.jabatan && (
                                    <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <Award className="w-4 h-4 text-gray-400" />
                                        <span>{user.jabatan}</span>
                                    </li>
                                )}
                                {user.status_kepegawaian && (
                                    <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <Briefcase className="w-4 h-4 text-gray-400" />
                                        <span className={`${getTagColor(user.status_kepegawaian)} px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider`}>
                                            {user.status_kepegawaian}
                                        </span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
