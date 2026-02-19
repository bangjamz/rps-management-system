import { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';
import useGlobalStore from '../store/useGlobalStore';
import {
    Loader, Palette, Shuffle, Info, Settings, Layout,
    Save, Globe, Trash2, Upload,
    Facebook, Instagram, Twitter, Youtube, Linkedin
} from 'lucide-react';
import { FaSave, FaGlobe, FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaLinkedin, FaTrash, FaUpload } from 'react-icons/fa';

const THEME_PRESETS = [
    { name: 'Sky Blue', primary: '#3b82f6', secondary: '#64748b', accent: '#f59e0b' },
    { name: 'Emerald', primary: '#10b981', secondary: '#475569', accent: '#f59e0b' },
    { name: 'Indigo Night', primary: '#6366f1', secondary: '#475569', accent: '#ec4899' },
    { name: 'Rose', primary: '#f43f5e', secondary: '#57534e', accent: '#fbbf24' },
    { name: 'Violet', primary: '#8b5cf6', secondary: '#4b5563', accent: '#10b981' },
    { name: 'Amber', primary: '#f59e0b', secondary: '#45474a', accent: '#3b82f6' },
    { name: 'Cyber Neon', primary: '#00f2ff', secondary: '#1e293b', accent: '#ff00ea' },
    { name: 'Modern Forest', primary: '#166534', secondary: '#2d2d2d', accent: '#fbbf24' },
];

const InitialsAvatar = ({ name, className = "w-full h-full" }) => {
    const initials = name
        ?.split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '??';

    return (
        <div className={`${className} bg-primary-600 flex items-center justify-center text-white font-bold`}>
            <span className="text-[35%] tracking-tighter">{initials}</span>
        </div>
    );
};

const LogoUploader = ({ label, currentImage, onFileSelect, onDelete, className = "aspect-square max-w-[140px]", description }) => {
    const [preview, setPreview] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onFileSelect(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const clearPreview = () => {
        setPreview(null);
        onDelete();
    };

    const displayImage = preview || (currentImage?.startsWith('http') ? currentImage : (currentImage ? `/${currentImage}?t=${new Date().getTime()}` : null));

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">{label}</label>
            <div className={`relative group rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950/30 flex items-center justify-center overflow-hidden transition-all hover:border-primary-500/50 hover:bg-white dark:hover:bg-gray-900 ${className}`}>
                {displayImage ? (
                    <div className="w-full h-full p-2 flex items-center justify-center">
                        <img
                            src={displayImage}
                            alt={label}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                                // If image fails, revert to upload state
                                e.target.style.display = 'none';
                                e.target.parentElement.classList.add('broken-image');
                            }}
                        />

                        {/* Overlay on Hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                            <label className="p-2.5 bg-white dark:bg-gray-800 rounded-full text-primary-600 dark:text-primary-400 cursor-pointer hover:scale-110 transition-transform shadow-lg border border-gray-100 dark:border-gray-700">
                                <FaUpload size={14} />
                                <input type="file" className="hidden" onChange={handleFileChange} />
                            </label>
                            <button
                                type="button"
                                onClick={clearPreview}
                                className="p-2.5 bg-red-600 rounded-full text-white hover:scale-110 transition-transform shadow-lg"
                            >
                                <FaTrash size={12} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-primary-500 transition-colors">
                        <Upload className="w-6 h-6 mb-1.5" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">Upload</span>
                        <input type="file" className="hidden" onChange={handleFileChange} />
                    </label>
                )}
            </div>
            {description && (
                <p className="text-[10px] text-gray-400 leading-tight">
                    {description}
                </p>
            )}
        </div>
    );
};

const socials = [
    { id: 'facebook', icon: FaFacebook, label: 'Facebook', color: 'text-blue-600' },
    { id: 'instagram', icon: FaInstagram, label: 'Instagram', color: 'text-pink-600' },
    { id: 'twitter', icon: FaTwitter, label: 'Twitter (X)', color: 'text-slate-900 dark:text-white' },
    { id: 'youtube', icon: FaYoutube, label: 'YouTube', color: 'text-red-600' },
    { id: 'linkedin', icon: FaLinkedin, label: 'LinkedIn', color: 'text-blue-700' },
];

const GlobalSettingsPage = () => {
    const { updateSettingsLocally } = useGlobalStore();
    const [activeTab, setActiveTab] = useState('identitas');

    // General Settings State
    const [settings, setSettings] = useState({
        nama_pt: '',
        kode_pt: '',
        alamat_pt: '',
        website: '',
        social_media: {},
        color_palette: {
            primary: '#3b82f6',
            secondary: '#64748b',
            accent: '#f59e0b'
        },
        default_lms_name: '',
        default_lms_url: '',
        logo_path: null,
        favicon_path: null,
        kop_surat_path: null
    });
    const [logoFile, setLogoFile] = useState(null);
    const [faviconFile, setFaviconFile] = useState(null);
    const [kopSuratFile, setKopSuratFile] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await axios.get(`/settings`);
            const data = response.data;
            if (!data.social_media) data.social_media = {};
            if (!data.color_palette) {
                data.color_palette = {
                    primary: '#3b82f6',
                    secondary: '#64748b',
                    accent: '#f59e0b'
                };
            }
            setSettings(data);
        } catch (error) {
            console.error('Failed to load settings:', error);
            toast.error('Gagal memuat pengaturan');
        } finally {
            setLoading(false);
        }
    };

    const handleRandomize = () => {
        const randomIndex = Math.floor(Math.random() * THEME_PRESETS.length);
        const preset = THEME_PRESETS[randomIndex];
        setSettings(prev => ({
            ...prev,
            color_palette: {
                primary: preset.primary,
                secondary: preset.secondary,
                accent: preset.accent
            }
        }));
        toast.success(`Palet ${preset.name} diterapkan!`, { icon: '🎨' });
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSaving(true);

        const formData = new FormData();
        formData.append('nama_pt', settings.nama_pt);
        formData.append('kode_pt', settings.kode_pt || '');
        formData.append('alamat_pt', settings.alamat_pt || '');
        formData.append('website', settings.website || '');
        formData.append('default_lms_name', settings.default_lms_name || '');
        formData.append('default_lms_url', settings.default_lms_url || '');
        formData.append('social_media', JSON.stringify(settings.social_media));
        formData.append('color_palette', JSON.stringify(settings.color_palette));

        if (logoFile) formData.append('logo', logoFile);
        if (faviconFile) formData.append('favicon', faviconFile);
        if (kopSuratFile) formData.append('kop_surat', kopSuratFile);

        // Add delete flags if existing images were cleared but no new file is uploaded
        if (!settings.logo_path && !logoFile) formData.append('remove_logo', 'true');
        if (!settings.favicon_path && !faviconFile) formData.append('remove_favicon', 'true');
        if (!settings.kop_surat_path && !kopSuratFile) formData.append('remove_kop_surat', 'true');

        try {
            const response = await axios.put(
                `/settings`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            setSettings(response.data.settings);
            updateSettingsLocally(response.data.settings);
            setLogoFile(null);
            setFaviconFile(null);
            setKopSuratFile(null);
            toast.success('Pengaturan berhasil disimpan');
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Gagal menyimpan pengaturan');
        } finally {
            setSaving(false);
        }
    };

    const handleSocialChange = (platform, value) => {
        setSettings(prev => ({
            ...prev,
            social_media: {
                ...prev.social_media,
                [platform]: value
            }
        }));
    };

    const handleColorChange = (type, value) => {
        setSettings(prev => ({
            ...prev,
            color_palette: {
                ...prev.color_palette,
                [type]: value
            }
        }));
    };

    if (loading) return <div className="p-8 text-center flex justify-center"><Loader className="w-8 h-8 animate-spin" /></div>;

    const tabs = [
        { id: 'identitas', label: 'Identitas', icon: Info },
        { id: 'tema', label: 'Tema & Warna', icon: Palette },
        { id: 'sistem', label: 'Sistem & LMS', icon: Layout },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan Global</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Kelola identitas institusi dan tampilan aplikasi secara terpusat.</p>
                </div>
                <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="btn btn-primary shadow-soft flex items-center gap-2"
                >
                    {saving ? <Loader className="animate-spin w-4 h-4" /> : <FaSave />}
                    Simpan Perubahan
                </button>
            </div>

            <div className="flex flex-col gap-8">
                {/* Tabs Navigation (Top) */}
                <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-100 dark:bg-gray-900/50 rounded-2xl w-fit">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${isActive
                                    ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[500px]">
                    <div className="p-8">
                        {activeTab === 'identitas' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Logo & Branding</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                        <div className="grid grid-cols-2 gap-6 w-fit">
                                            <LogoUploader
                                                label="Logo Institusi"
                                                currentImage={settings.logo_path}
                                                onFileSelect={setLogoFile}
                                                onDelete={() => {
                                                    setLogoFile(null);
                                                    setSettings(prev => ({ ...prev, logo_path: null }));
                                                }}
                                                description="Min. 512x512px. Maks 2MB (PNG/JPG)"
                                            />
                                            <LogoUploader
                                                label="Favicon"
                                                currentImage={settings.favicon_path}
                                                onFileSelect={setFaviconFile}
                                                onDelete={() => {
                                                    setFaviconFile(null);
                                                    setSettings(prev => ({ ...prev, favicon_path: null }));
                                                }}
                                                description="Min. 32x32px. Maks 100KB (ICO/PNG)"
                                            />
                                        </div>
                                        <div className="w-full">
                                            <LogoUploader
                                                label="Kop Surat"
                                                currentImage={settings.kop_surat_path}
                                                onFileSelect={setKopSuratFile}
                                                onDelete={() => {
                                                    setKopSuratFile(null);
                                                    setSettings(prev => ({ ...prev, kop_surat_path: null }));
                                                }}
                                                className="aspect-[5/1] w-full max-w-lg"
                                                description="Rec. 700x140px. Maks 5MB (PNG/JPG)"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="label">Nama Perguruan Tinggi</label>
                                        <input
                                            type="text"
                                            className="input font-semibold"
                                            value={settings.nama_pt}
                                            onChange={(e) => setSettings({ ...settings, nama_pt: e.target.value })}
                                            placeholder="Contoh: Universitas Mahardika"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Kode PT</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={settings.kode_pt}
                                            onChange={(e) => setSettings({ ...settings, kode_pt: e.target.value })}
                                            placeholder="001001"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Website Resmi</label>
                                        <div className="relative">
                                            <FaGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                className="input pl-10"
                                                value={settings.website}
                                                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                                                placeholder="https://mahardika.ac.id"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="label">Alamat Lengkap</label>
                                        <textarea
                                            className="input min-h-[100px] py-3 h-auto"
                                            value={settings.alamat_pt}
                                            onChange={(e) => setSettings({ ...settings, alamat_pt: e.target.value })}
                                            placeholder="Jalan Jenderal Sudirman No. 1..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tema' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Kustomisasi Tema</h3>
                                    <button
                                        type="button"
                                        onClick={handleRandomize}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all font-medium text-sm"
                                    >
                                        <Shuffle className="w-4 h-4" />
                                        Randomize
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Primary Color */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Primary Color</label>
                                            <div className="w-6 h-6 rounded border border-gray-200" style={{ backgroundColor: settings.color_palette.primary }}></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={settings.color_palette.primary}
                                                onChange={(e) => handleColorChange('primary', e.target.value)}
                                                className="h-11 w-14 rounded-lg cursor-pointer border-none bg-transparent"
                                            />
                                            <input
                                                type="text"
                                                value={settings.color_palette.primary}
                                                onChange={(e) => handleColorChange('primary', e.target.value)}
                                                className="input text-center font-mono text-sm uppercase"
                                            />
                                        </div>
                                        <p className="text-[11px] text-gray-500">Tombol utama, header, dan link aktif.</p>
                                    </div>

                                    {/* Secondary Color */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Secondary Color</label>
                                            <div className="w-6 h-6 rounded border border-gray-200" style={{ backgroundColor: settings.color_palette.secondary }}></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={settings.color_palette.secondary}
                                                onChange={(e) => handleColorChange('secondary', e.target.value)}
                                                className="h-11 w-14 rounded-lg cursor-pointer border-none bg-transparent"
                                            />
                                            <input
                                                type="text"
                                                value={settings.color_palette.secondary}
                                                onChange={(e) => handleColorChange('secondary', e.target.value)}
                                                className="input text-center font-mono text-sm uppercase"
                                            />
                                        </div>
                                        <p className="text-[11px] text-gray-500">Elemen netral, border, dan teks sekunder.</p>
                                    </div>

                                    {/* Accent Color */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Accent Color</label>
                                            <div className="w-6 h-6 rounded border border-gray-200" style={{ backgroundColor: settings.color_palette.accent }}></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={settings.color_palette.accent}
                                                onChange={(e) => handleColorChange('accent', e.target.value)}
                                                className="h-11 w-14 rounded-lg cursor-pointer border-none bg-transparent"
                                            />
                                            <input
                                                type="text"
                                                value={settings.color_palette.accent}
                                                onChange={(e) => handleColorChange('accent', e.target.value)}
                                                className="input text-center font-mono text-sm uppercase"
                                            />
                                        </div>
                                        <p className="text-[11px] text-gray-500">Notifikasi, badge penting, dan highlight.</p>
                                    </div>
                                </div>

                                <div className="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-xl border border-primary-100 dark:border-primary-900/30 flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white shrink-0">
                                        <Info className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-primary-900 dark:text-primary-100 mb-1">Preview Real-time</h4>
                                        <p className="text-xs text-primary-700 dark:text-primary-300 leading-relaxed">
                                            Warna yang Anda pilih akan langsung diterapkan secara instan di sidebar dan menu lainnya untuk membantu Anda memvisualisasikan perubahan sebelum disimpan secara permanen.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'sistem' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Integrasi LMS</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="label">Nama LMS Default</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={settings.default_lms_name}
                                                onChange={(e) => setSettings({ ...settings, default_lms_name: e.target.value })}
                                                placeholder="Contoh: Moodle Mahardika"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">URL LMS Default</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={settings.default_lms_url}
                                                onChange={(e) => setSettings({ ...settings, default_lms_url: e.target.value })}
                                                placeholder="https://lms.mahardika.ac.id"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Media Sosial</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {socials.map((social) => {
                                            const SocialIcon = social.icon;
                                            return (
                                                <div key={social.id} className="relative">
                                                    <SocialIcon className={`absolute left-3 top-1/2 -translate-y-1/2 ${social.color} text-lg`} />
                                                    <input
                                                        type="text"
                                                        className="input pl-10"
                                                        value={settings.social_media?.[social.id] || ''}
                                                        onChange={(e) => handleSocialChange(social.id, e.target.value)}
                                                        placeholder={`URL ${social.label}`}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalSettingsPage;
