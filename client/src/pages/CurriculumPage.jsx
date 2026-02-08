
import { useState, useEffect } from 'react';
import axios from '../lib/axios';
import Swal from 'sweetalert2';
import { downloadCSVTemplate, exportToCSV } from '../utils/csvHelper';
import { hasPermission, PERMISSIONS } from '../utils/permissions';
import { getTagColor } from '../utils/ui';
import { Info, List, Table, LayoutGrid, Trash2, Plus, FileDown, FileUp, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';

// Prefix Mapping
const UNIT_PREFIXES = {
    'Informatika': 'IF',
    'Keperawatan': 'KEP',
    'Ners': 'KEP',
    'Kebidanan': 'KEB',
    'Rekam Medis': 'RMIK',
    'RMIK': 'RMIK',
    'Kesehatan Masyarakat': 'KESMAS',
    'Fakultas Kesehatan': 'FKES',
    'Fakultas Teknik': 'FT',
    'Teknik': 'FT'
};

export default function CurriculumPage() {
    const [activeTab, setActiveTab] = useState('cpl');

    // Data States
    const [cplData, setCplData] = useState([]);
    const [cpmkData, setCpmkData] = useState([]);
    const [subCpmkData, setSubCpmkData] = useState([]);
    const [mkData, setMkData] = useState([]);
    const [bkData, setBkData] = useState([]);
    const [userProfile, setUserProfile] = useState(null);

    // UI States
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('table'); // table, list, card
    const [selectedItems, setSelectedItems] = useState([]); // IDs for batch actions
    const [message, setMessage] = useState({ type: '', text: '' });

    // Modal States
    const [showImportModal, setShowImportModal] = useState(false);
    const [importType, setImportType] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [importConflicts, setImportConflicts] = useState(null);
    const [conflictStrategy, setConflictStrategy] = useState('skip'); // skip, overwrite, duplicate
    const [isImporting, setIsImporting] = useState(false);

    const [showCPLModal, setShowCPLModal] = useState(false);
    const [showCPMKModal, setShowCPMKModal] = useState(false);
    const [showSubCPMKModal, setShowSubCPMKModal] = useState(false);
    const [showMKModal, setShowMKModal] = useState(false);
    const [showBKModal, setShowBKModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);

    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});

    // Dropdown states for Tambah buttons
    const [showAddDropdown, setShowAddDropdown] = useState({ cpl: false, cpmk: false, bk: false, subCpmk: false });
    const [addMode, setAddMode] = useState('single'); // 'single', 'bulk', 'import'
    const [bulkItems, setBulkItems] = useState([{ kode: '', deskripsi: '', kategori: '' }]);

    // Filter states
    const [searchTerms, setSearchTerms] = useState({ cpl: '', bk: '', cpmk: '', subCpmk: '' });
    const [levelFilters, setLevelFilters] = useState({ cpl: '', bk: '', cpmk: '', subCpmk: '' });
    const [fakultasData, setFakultasData] = useState([]);
    const [prodiData, setProdiData] = useState([]);

    // Sorting states for each tab
    const [sortConfig, setSortConfig] = useState({
        cpl: { field: 'kode_cpl', direction: 'asc' },
        bk: { field: 'kode_bk', direction: 'asc' },
        cpmk: { field: 'kode_cpmk', direction: 'asc' },
        subCpmk: { field: 'kode_sub_cpmk', direction: 'asc' }
    });

    // CPL filter for Sub-CPMK modal
    const [filterCPLForSubCPMK, setFilterCPLForSubCPMK] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadProfile(),
                loadCPL(),
                loadCPMK(),
                loadSubCPMK(),
                loadMK(),
                loadBK(),
                loadFakultas(),
                loadProdi()
            ]);
        } catch (e) {
            console.error("Error loading data", e);
        } finally {
            setLoading(false);
        }
    };

    const loadProfile = async () => {
        try {
            const response = await axios.get('/auth/profile');
            // Backend returns { user: { ... } }
            setUserProfile(response.data.user || response.data);
        } catch (error) { console.error(error); }
    };

    const loadCPL = async () => {
        try {
            const response = await axios.get('/curriculum/cpl');
            setCplData(response.data);
        } catch (error) { console.error(error); }
    };

    const loadCPMK = async () => {
        try {
            const response = await axios.get('/curriculum/cpmk');
            setCpmkData(response.data);
        } catch (error) { console.error(error); }
    };

    const loadSubCPMK = async () => {
        try {
            const response = await axios.get('/curriculum/sub-cpmk');
            setSubCpmkData(response.data);
        } catch (error) { console.error(error); }
    };

    const loadMK = async () => {
        try {
            // Placeholder: Replace with actual endpoint to get MK list
            // For now assuming we might fetch all MataKuliah for the prodi
            // If endpoint doesn't allow listing all, we might need one.
            // Assuming /academic/courses or similar exists or we use the curriculum controller one if made.
            // Let's assume we can fetch it. If not, I'll fix it later.
            // Using a generic endpoint for now or empty if not ready.
            const response = await axios.get('/academic-years/courses/all'); // Try this or fallback
            setMkData(response.data || []);
        } catch (error) {
            // If failed, maybe try a different endpoint or leave empty
            console.error("Failed to load MK", error);
            setMkData([]);
        }
    };

    const loadBK = async () => {
        try {
            const response = await axios.get('/curriculum/bahan-kajian');
            setBkData(response.data);
        } catch (error) { console.error(error); }
    };

    const loadFakultas = async () => {
        try {
            const response = await axios.get('/organization/fakultas');
            setFakultasData(response.data);
        } catch (error) { console.error(error); }
    };

    const loadProdi = async () => {
        try {
            const response = await axios.get('/organization/prodi');
            setProdiData(response.data);
        } catch (error) { console.error(error); }
    };

    // --- Batch Actions ---
    const handleSelectAll = (e, data) => {
        if (e.target.checked) {
            setSelectedItems(data.map(item => item.id));
        } else {
            setSelectedItems([]);
        }
    };

    const handleSelectItem = (id) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(i => i !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    const handleLevelChange = (level) => {
        const role = userProfile?.role;
        let updates = { level };

        if (role === 'kaprodi') {
            if (level === 'institusi') {
                updates.fakultas_id = null;
                updates.prodi_id = null;
            } else if (level === 'fakultas') {
                updates.fakultas_id = userProfile.fakultas_id;
                updates.prodi_id = null;
            } else if (level === 'prodi') {
                updates.fakultas_id = null;
                updates.prodi_id = userProfile.prodi_id;
            }
        }
        setFormData({ ...formData, ...updates });
    };

    const renderUnitSelection = (type) => {
        const role = userProfile?.role;
        const data = type === 'fakultas' ? fakultasData : prodiData;
        const currentId = type === 'fakultas' ? formData.fakultas_id : formData.prodi_id;
        const label = type === 'fakultas' ? 'Fakultas' : 'Program Studi';
        const placeholder = type === 'fakultas' ? '-- Pilih Fakultas --' : '-- Pilih Prodi --';

        if (role === 'kaprodi') {
            const unit = data.find(d => String(d.id) === String(currentId));
            return (
                <div className="form-control">
                    <label className="label"><span className="label-text font-semibold">{label}</span></label>
                    <div className="input input-bordered input-sm flex items-center bg-gray-100 dark:bg-gray-800 font-medium cursor-not-allowed">
                        {unit?.nama || '-'}
                    </div>
                </div>
            );
        }

        return (
            <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Pilih {label}</span></label>
                <select
                    className={`select select-bordered select-sm w-full ${type === 'fakultas' ? 'border-orange-200' : 'border-blue-200'}`}
                    value={currentId || ''}
                    onChange={e => setFormData({ ...formData, [type === 'fakultas' ? 'fakultas_id' : 'prodi_id']: e.target.value })}
                >
                    <option value="">{placeholder}</option>
                    {data.map(d => <option key={d.id} value={d.id}>{d.nama}</option>)}
                </select>
            </div>
        );
    };

    const handleBatchDelete = async () => {
        if (selectedItems.length === 0) return;
        if (!window.confirm(`Hapus ${selectedItems.length} item terpilih?`)) return;

        try {
            let endpoint = '';
            if (activeTab === 'cpmk') endpoint = '/curriculum/cpmk/batch-delete';
            else if (activeTab === 'sub-cpmk') endpoint = '/curriculum/sub-cpmk/batch-delete';
            else return; // Only CPMK/Sub-CPMK supported for now

            await axios.post(endpoint, { ids: selectedItems });
            setMessage({ type: 'success', text: 'Batch delete berhasil' });
            setSelectedItems([]);
            if (activeTab === 'cpmk') loadCPMK();
            if (activeTab === 'sub-cpmk') loadSubCPMK();
        } catch (error) {
            setMessage({ type: 'error', text: 'Batch delete gagal: ' + (error.response?.data?.message || error.message) });
        }
    };


    // --- Helper Functions ---
    const getUnitPrefix = (level) => { /* ... existing ... */
        if (!userProfile) return 'UNKNOWN';
        let unitName = '';
        if (level === 'prodi') unitName = userProfile.prodi?.nama || '';
        else if (level === 'fakultas') unitName = userProfile.fakultas?.nama || '';
        else if (level === 'institusi') return 'UNIV';
        for (const [key, val] of Object.entries(UNIT_PREFIXES)) {
            if (unitName.toLowerCase().includes(key.toLowerCase())) return val;
        }
        return 'GEN';
    };

    // Sort toggle function
    const toggleSort = (tab, field) => {
        setSortConfig(prev => ({
            ...prev,
            [tab]: {
                field,
                direction: prev[tab].field === field && prev[tab].direction === 'asc' ? 'desc' : 'asc'
            }
        }));
    };

    // Generic sort function
    const sortData = (data, tab) => {
        const config = sortConfig[tab];
        if (!config || !data) return data;
        return [...data].sort((a, b) => {
            let valueA = a[config.field] || '';
            let valueB = b[config.field] || '';
            if (typeof valueA === 'string') valueA = valueA.toLowerCase();
            if (typeof valueB === 'string') valueB = valueB.toLowerCase();
            if (valueA < valueB) return config.direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return config.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    // Get filtered CPMK based on CPL filter for Sub-CPMK modal
    const getFilteredCPMK = () => {
        if (filterCPLForSubCPMK === 'all') return cpmkData;
        if (filterCPLForSubCPMK === 'none') return cpmkData.filter(c => !c.cpl_id);
        return cpmkData.filter(c => c.cpl_id === parseInt(filterCPLForSubCPMK));
    };

    const generateCPLCode = () => { /* ... existing ... */
        const level = formData.level || 'prodi';
        const prefix = getUnitPrefix(level);
        const regex = new RegExp(`^${prefix}-CPL(\\d+)`);
        let maxNum = 0;
        cplData.forEach(cpl => {
            const match = cpl.kode_cpl.match(regex);
            if (match) {
                const num = parseInt(match[1]);
                if (num > maxNum) maxNum = num;
            }
        });
        const nextNum = String(maxNum + 1).padStart(2, '0');
        const displayCode = `${prefix}-CPL${nextNum}`;
        setFormData({
            ...formData,
            kode_cpl: displayCode, // Internal is default same as display but with prefix logic later on backend
            kode_tampilan: `CPL${nextNum}`
        });
    };

    const generateCPMKCode = () => { /* ... existing ... */
        if (!formData.cpl_id) { setMessage({ type: 'error', text: 'Pilih CPL terlebih dahulu!' }); return; }
        const cpl = cplData.find(c => c.id == formData.cpl_id);
        if (!cpl) { setMessage({ type: 'error', text: 'CPL tidak ditemukan!' }); return; }
        const cplNumMatch = cpl.kode_cpl.match(/CPL(\d+)$/);
        const cplNum = cplNumMatch ? cplNumMatch[1] : 'XX';
        const existingForCPL = cpmkData.filter(c => c.cpl_id == formData.cpl_id);
        const nextIndex = existingForCPL.length + 1;
        const newCode = `CPMK${cplNum}${nextIndex}`;
        const internalCode = `${userProfile.prodi.kode}-${newCode}`;
        setFormData({ ...formData, kode_tampilan: newCode, kode_cpmk: internalCode });
    };

    const generateSubCPMKCode = () => { /* ... existing ... */
        if (!formData.cpmk_id) { setMessage({ type: 'error', text: 'Pilih CPMK terlebih dahulu!' }); return; }
        const cpmk = cpmkData.find(c => c.id == formData.cpmk_id);
        if (!cpmk) { setMessage({ type: 'error', text: 'CPMK tidak ditemukan!' }); return; }
        const cpmkBaseMatch = cpmk.kode_cpmk.replace('CPMK', '');
        const existingForCPMK = subCpmkData.filter(s => s.cpmk_id == formData.cpmk_id);
        const nextIndex = String(existingForCPMK.length + 1).padStart(2, '0');
        const newCode = `SCPMK${cpmkBaseMatch}${nextIndex}`;
        const internalCode = `${userProfile.prodi.kode}-${newCode}`;
        setFormData({ ...formData, kode_tampilan: newCode, kode_sub_cpmk: internalCode });
    };

    const generateBKCode = () => {
        if (!bkData || !Array.isArray(bkData)) return;
        let maxNum = 0;
        bkData.forEach(item => {
            if (!item.kode_bk) return;
            const match = item.kode_bk.match(/BK(\d+)/);
            if (match) {
                const num = parseInt(match[1]);
                if (num > maxNum) maxNum = num;
            }
        });
        const nextNum = String(maxNum + 1).padStart(2, '0');
        const newCode = `BK${nextNum}`;
        const internalCode = `${userProfile.prodi.kode}-${newCode}`;
        setFormData({ ...formData, kode_bk: internalCode, kode_tampilan: newCode });
    };

    const checkDuplicate = (type, code, id) => {
        let existing = null;
        if (type === 'cpl') existing = cplData.find(c => (c.kode_tampilan === code || c.kode_cpl === code) && c.id !== id);
        if (type === 'bk') existing = bkData.find(c => (c.kode_tampilan === code || c.kode_bk === code) && c.id !== id);
        if (type === 'cpmk') existing = cpmkData.find(c => (c.kode_tampilan === code || c.kode_cpmk === code) && c.id !== id);
        if (type === 'sub-cpmk') existing = subCpmkData.find(c => (c.kode_tampilan === code || c.kode_sub_cpmk === code) && c.id !== id);
        return existing;
    };



    // --- Actions ---
    // CPL
    const handleAddCPL = () => { setEditingItem(null); setFormData({ kode_tampilan: '', deskripsi: '', kategori: 'Sikap', level: 'prodi' }); setShowCPLModal(true); };
    const handleEditCPL = (item) => { setEditingItem(item); setFormData({ ...item }); setShowCPLModal(true); };
    const handleDeleteCPL = async (id) => {
        if (!window.confirm('Delete?')) return;
        try { await axios.delete(`/curriculum/cpl/${id}`); loadCPL(); } catch (e) { alert(e.message); }
    };
    const handleSaveCPL = async () => {
        try {
            const displayCode = formData.kode_tampilan || formData.kode_cpl;
            const duplicate = checkDuplicate('cpl', displayCode, editingItem?.id);
            if (duplicate && !window.confirm(`Kode CPL "${displayCode}" sudah ada. Tetap simpan? (Sistem akan otomatis menambahkan akhiran angka jika perlu)`)) return;

            // Prepare data with correct org IDs based on level
            const submitData = { ...formData };
            if (submitData.level === 'institusi') {
                submitData.fakultas_id = null;
                submitData.prodi_id = null;
            } else if (submitData.level === 'fakultas') {
                submitData.institusi_id = null;
                submitData.prodi_id = null;
            } else if (submitData.level === 'prodi') {
                submitData.institusi_id = null;
                submitData.fakultas_id = null;
            }

            if (editingItem) await axios.put(`/curriculum/cpl/${editingItem.id}`, submitData);
            else await axios.post('/curriculum/cpl', submitData);
            setShowCPLModal(false); loadCPL();
            setMessage({ type: 'success', text: 'CPL berhasil disimpan' });
        } catch (e) { setMessage({ type: 'error', text: e.response?.data?.message || e.message }); }
    };

    // CPMK
    const handleAddCPMK = () => {
        setEditingItem(null);
        setFormData({
            kode_tampilan: '',
            deskripsi: '',
            cpl_id: '',
            level: 'prodi',
            prodi_id: userProfile?.prodi_id || '',
            fakultas_id: userProfile?.fakultas_id || '',
            institusi_id: userProfile?.institusi_id || ''
        });
        setShowCPMKModal(true);
    };
    const handleEditCPMK = (item) => { setEditingItem(item); setFormData({ ...item }); setShowCPMKModal(true); };
    const handleDeleteCPMK = async (id) => {
        if (!window.confirm('Delete?')) return;
        try { await axios.delete(`/curriculum/cpmk/${id}`); loadCPMK(); } catch (e) { alert(e.message); }
    };
    const handleSaveCPMK = async () => {
        try {
            const displayCode = formData.kode_tampilan || formData.kode_cpmk;
            const duplicate = checkDuplicate('cpmk', displayCode, editingItem?.id);
            if (duplicate && !window.confirm(`Kode CPMK "${displayCode}" sudah ada. Tetap simpan? (Sistem akan otomatis menambahkan akhiran angka jika perlu)`)) return;

            const submitData = { ...formData };

            // Handle organizational hierarchy
            if (submitData.level === 'institusi') { submitData.fakultas_id = null; submitData.prodi_id = null; }
            else if (submitData.level === 'fakultas') { submitData.institusi_id = null; submitData.prodi_id = null; }
            else if (submitData.level === 'prodi') { submitData.institusi_id = null; submitData.fakultas_id = null; }

            // Sanitize foreign keys - Ensure they are integers or null, avoiding NaN
            const toIntOrNull = (val) => {
                const parsed = parseInt(val);
                return isNaN(parsed) ? null : parsed;
            };
            submitData.cpl_id = toIntOrNull(submitData.cpl_id);
            submitData.mata_kuliah_id = toIntOrNull(submitData.mata_kuliah_id);

            if (editingItem) await axios.put(`/curriculum/cpmk/${editingItem.id}`, submitData);
            else await axios.post('/curriculum/cpmk', submitData);

            setShowCPMKModal(false);
            await loadCPMK();
            setMessage({ type: 'success', text: 'CPMK berhasil disimpan' });
        } catch (e) { setMessage({ type: 'error', text: e.response?.data?.message || e.message }); }
    };

    // Sub-CPMK
    const handleAddSubCPMK = () => {
        setEditingItem(null);
        setFormData({
            kode_tampilan: '',
            deskripsi: '',
            cpmk_id: '',
            indikator: '',
            bobot_nilai: '',
            level: 'prodi',
            prodi_id: userProfile?.prodi_id || '',
            fakultas_id: userProfile?.fakultas_id || '',
            institusi_id: userProfile?.institusi_id || ''
        });
        setShowSubCPMKModal(true);
    };
    const handleEditSubCPMK = (item) => { setEditingItem(item); setFormData({ ...item }); setShowSubCPMKModal(true); };
    const handleDeleteSubCPMK = async (id) => {
        if (!window.confirm('Delete?')) return;
        try { await axios.delete(`/curriculum/sub-cpmk/${id}`); loadSubCPMK(); } catch (e) { alert(e.message); }
    };
    const handleSaveSubCPMK = async () => {
        try {
            const displayCode = formData.kode_tampilan || formData.kode_sub_cpmk;
            const duplicate = checkDuplicate('sub-cpmk', displayCode, editingItem?.id);
            if (duplicate && !window.confirm(`Kode Sub-CPMK "${displayCode}" sudah ada. Tetap simpan? (Sistem akan otomatis menambahkan akhiran angka jika perlu)`)) return;

            const submitData = { ...formData };
            if (submitData.level === 'institusi') { submitData.fakultas_id = null; submitData.prodi_id = null; }
            else if (submitData.level === 'fakultas') { submitData.institusi_id = null; submitData.prodi_id = null; }
            else if (submitData.level === 'prodi') { submitData.institusi_id = null; submitData.fakultas_id = null; }

            const toIntOrNull = (val) => {
                const parsed = parseInt(val);
                return isNaN(parsed) ? null : parsed;
            };
            submitData.cpmk_id = toIntOrNull(submitData.cpmk_id);

            if (editingItem) await axios.put(`/curriculum/sub-cpmk/${editingItem.id}`, submitData);
            else await axios.post('/curriculum/sub-cpmk', submitData);
            setShowSubCPMKModal(false); loadSubCPMK();
            setMessage({ type: 'success', text: 'Sub-CPMK berhasil disimpan' });
        } catch (e) { setMessage({ type: 'error', text: e.response?.data?.message || e.message }); }
    };

    // BK Handlers
    const handleAddBK = () => {
        setEditingItem(null);
        setFormData({
            kode_tampilan: '',
            deskripsi: '',
            jenis: '',
            bobot_min: '',
            bobot_max: '',
            level: 'prodi',
            prodi_id: userProfile?.prodi_id || '',
            fakultas_id: userProfile?.fakultas_id || '',
            institusi_id: userProfile?.institusi_id || ''
        });
        setShowBKModal(true);
    };
    const handleEditBK = (item) => { setEditingItem(item); setFormData({ ...item }); setShowBKModal(true); };
    const handleDeleteBK = async (id) => {
        if (!window.confirm('Hapus Bahan Kajian ini?')) return;
        try { await axios.delete(`/curriculum/bahan-kajian/${id}`); loadBK(); } catch (e) { setMessage({ type: 'error', text: e.message }); }
    };
    const handleSaveBK = async () => {
        try {
            const displayCode = formData.kode_tampilan || formData.kode_bk;
            const duplicate = checkDuplicate('bk', displayCode, editingItem?.id);
            if (duplicate && !window.confirm(`Kode Bahan Kajian "${displayCode}" sudah ada. Tetap simpan? (Sistem akan otomatis menambahkan akhiran angka jika perlu)`)) return;

            const submitData = { ...formData };
            if (submitData.level === 'institusi') { submitData.fakultas_id = null; submitData.prodi_id = null; }
            else if (submitData.level === 'fakultas') { submitData.institusi_id = null; submitData.prodi_id = null; }
            else if (submitData.level === 'prodi') { submitData.institusi_id = null; submitData.fakultas_id = null; }

            if (editingItem) await axios.put(`/curriculum/bahan-kajian/${editingItem.id}`, submitData);
            else await axios.post('/curriculum/bahan-kajian', submitData);
            setShowBKModal(false); loadBK();
            setMessage({ type: 'success', text: 'Bahan Kajian berhasil disimpan' });
        } catch (e) { setMessage({ type: 'error', text: e.response?.data?.message || e.message }); }
    };

    // Import
    const handleOpenImport = (type) => { setImportType(type); setSelectedFile(null); setShowImportModal(true); };
    const handleDownloadTemplate = () => { downloadCSVTemplate(importType, userProfile?.prodi?.nama); };
    const handleFileSelect = (e) => setSelectedFile(e.target.files[0]);

    // Helper to config Swal for dark mode
    const getSwalConfig = (overrides = {}) => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        return {
            background: isDarkMode ? '#1f2937' : '#ffffff',
            color: isDarkMode ? '#f3f4f6' : '#1f2937',
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: isDarkMode ? '#374151' : '#d1d5db',
            padding: '2em',
            customClass: {
                popup: 'rounded-xl shadow-xl border border-gray-200 dark:border-gray-700',
                confirmButton: 'px-6 py-2.5 rounded-lg font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors mx-2',
                cancelButton: 'px-6 py-2.5 rounded-lg font-semibold dark:text-gray-200 text-gray-700 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mx-2'
            },
            buttonsStyling: false,
            ...overrides
        };
    };

    const showToast = (icon, title, text) => {
        Swal.fire(getSwalConfig({
            icon: icon,
            title: title,
            text: text,
        }));
    };

    const handleImportCheck = async () => {
        if (!selectedFile) {
            showToast('warning', 'File Belum Dipilih', 'Silakan pilih file CSV terlebih dahulu.');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('mode', 'check');

        Swal.fire(getSwalConfig({
            title: 'Memeriksa Konflik...',
            text: 'Mencari data duplikat di database',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        }));

        try {
            let url = `/curriculum/${importType === 'bahan-kajian' ? 'bahan-kajian' : importType}/import`;
            const response = await axios.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            Swal.close();
            if (response.data.conflicts && response.data.conflicts.length > 0) {
                setImportConflicts(response.data.conflicts);
            } else {
                // No conflicts, proceed to commit directly or ask confirmation
                handleImportCommit('skip');
            }
        } catch (e) {
            Swal.close();
            showToast('error', 'Check Gagal', e.response?.data?.message || e.message);
        }
    };

    const handleImportCommit = async (strategy) => {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('mode', 'commit');
        formData.append('on_conflict', strategy || conflictStrategy);

        setIsImporting(true);
        Swal.fire(getSwalConfig({
            title: 'Sedang Mengimpor...',
            text: 'Menyimpan data ke database',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        }));

        try {
            let url = `/curriculum/${importType === 'bahan-kajian' ? 'bahan-kajian' : importType}/import`;
            const response = await axios.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            Swal.close();
            setImportConflicts(null);
            setShowImportModal(false);
            showToast('success', 'Import Berhasil', response.data.message);
            loadData();
        } catch (e) {
            Swal.close();
            showToast('error', 'Import Gagal', e.response?.data?.message || e.message);
        } finally {
            setIsImporting(false);
        }
    };

    const handleExport = (type) => {
        let dataToExport = [];
        let headers = [];
        let filename = `export_${type}_${Date.now()}.csv`;

        if (type === 'cpl') {
            headers = ['kode_cpl', 'deskripsi', 'keterangan', 'kategori', 'kode_prodi'];
            dataToExport = cplData.map(item => ({
                kode_cpl: item.kode_tampilan || item.kode_cpl,
                deskripsi: item.deskripsi,
                keterangan: item.keterangan || '',
                kategori: item.kategori,
                kode_prodi: userProfile?.prodi?.kode || ''
            }));
        } else if (type === 'bahan-kajian') {
            headers = ['kode_bk', 'jenis', 'deskripsi', 'bobot_min', 'bobot_max', 'kode_prodi'];
            dataToExport = bkData.map(item => ({
                kode_bk: item.kode_tampilan || item.kode_bk,
                jenis: item.jenis,
                deskripsi: item.deskripsi,
                bobot_min: item.bobot_min,
                bobot_max: item.bobot_max,
                kode_prodi: userProfile?.prodi?.kode || ''
            }));
        } else if (type === 'cpmk') {
            headers = ['kode_cpmk', 'deskripsi', 'kode_cpl', 'kode_mk'];
            dataToExport = cpmkData.map(item => ({
                kode_cpmk: item.kode_tampilan || item.kode_cpmk,
                deskripsi: item.deskripsi,
                kode_cpl: item.cpl?.kode_tampilan || item.cpl?.kode_cpl || '',
                kode_mk: '' // Placeholder if needed
            }));
        } else if (type === 'sub-cpmk') {
            headers = ['kode_sub_cpmk', 'deskripsi', 'kode_cpmk', 'kode_mk', 'bobot_persen'];
            dataToExport = subCpmkData.map(item => ({
                kode_sub_cpmk: item.kode_tampilan || item.kode_sub_cpmk,
                deskripsi: item.deskripsi,
                kode_cpmk: item.cpmk?.kode_tampilan || item.cpmk?.kode_cpmk || '',
                kode_mk: '',
                bobot_persen: item.bobot_nilai
            }));
        }

        exportToCSV(dataToExport, filename, headers);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Data Kurikulum
                        <button onClick={() => setShowHelpModal(true)} className="text-gray-400 hover:text-gray-600">
                            <Info className="w-5 h-5" />
                        </button>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kelola CPL, Bahan Kajian, CPMK, Sub-CPMK</p>
                </div>
                <div className="flex gap-2">
                    {/* View Mode Toggle - Show for all tabs */}
                    <div className="join bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <button onClick={() => setViewMode('table')} className={`join-item btn btn-sm btn-ghost ${viewMode === 'table' ? 'bg-gray-100 dark:bg-gray-700' : ''}`} title="Table View"><Table className="w-4 h-4" /></button>
                        <button onClick={() => setViewMode('list')} className={`join-item btn btn-sm btn-ghost ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700' : ''}`} title="List View"><List className="w-4 h-4" /></button>
                        <button onClick={() => setViewMode('card')} className={`join-item btn btn-sm btn-ghost ${viewMode === 'card' ? 'bg-gray-100 dark:bg-gray-700' : ''}`} title="Card View"><LayoutGrid className="w-4 h-4" /></button>
                    </div>

                    {/* Batch Delete (Mobile/Unified if needed, but we have tab-specific ones now) */}
                    {selectedItems.length > 0 && (
                        <button onClick={handleBatchDelete} className="btn btn-error btn-sm flex items-center gap-1">
                            <Trash2 className="w-4 h-4" /> Hapus ({selectedItems.length})
                        </button>
                    )}
                </div>
            </div>

            {message.text && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage({ type: '', text: '' })} className="btn btn-xs btn-ghost">X</button>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto">
                <nav className="flex gap-8 min-w-max">
                    {[
                        { id: 'cpl', label: 'CPL' },
                        { id: 'bahan-kajian', label: 'BK' },
                        { id: 'cpmk', label: 'CPMK' },
                        { id: 'sub-cpmk', label: 'Sub-CPMK' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setSelectedItems([]);
                                // Reset all modals and dropdowns when switching tabs
                                setShowCPLModal(false);
                                setShowCPMKModal(false);
                                setShowSubCPMKModal(false);
                                setShowBKModal(false);
                                setShowImportModal(false);
                                setShowAddDropdown({ cpl: false, cpmk: false, bk: false, subCpmk: false });
                                setAddMode('single');
                                setEditingItem(null);
                                setFormData({});
                            }}
                            className={`pb-3 whitespace-nowrap border-b-2 transition-colors transition-all duration-200 ${activeTab === tab.id ? 'border-primary-600 text-primary-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {loading ? <div className="text-center py-10">Loading...</div> : (
                    <>
                        {/* CPL CONTENT */}
                        {activeTab === 'cpl' && (
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto flex-1">
                                        <div className="relative flex-1 max-w-md">
                                            <input
                                                type="text"
                                                placeholder="Cari CPL..."
                                                className="input input-bordered input-sm w-full pl-8"
                                                value={searchTerms.cpl}
                                                onChange={e => setSearchTerms({ ...searchTerms, cpl: e.target.value })}
                                            />
                                            <Search className="w-4 h-4 absolute left-2.5 top-2 text-gray-400" />
                                        </div>
                                        <select
                                            className="select select-bordered select-sm w-full md:w-40"
                                            value={levelFilters.cpl}
                                            onChange={e => setLevelFilters({ ...levelFilters, cpl: e.target.value })}
                                        >
                                            <option value="">Semua Level</option>
                                            <option value="institusi">Institusi</option>
                                            <option value="fakultas">Fakultas</option>
                                            <option value="prodi">Prodi</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        {selectedItems.length > 0 && (
                                            <button onClick={handleBatchDelete} className="btn btn-error btn-sm gap-2">
                                                <Trash2 className="w-4 h-4" /> Hapus massal
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowAddDropdown(prev => ({ ...prev, cpl: !prev.cpl }))}
                                            className="btn btn-primary btn-sm gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Kelola CPL
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                        {showAddDropdown.cpl && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                                                <button
                                                    onClick={() => { handleAddCPL(); setShowAddDropdown(prev => ({ ...prev, cpl: false })); }}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                >
                                                    <Plus className="w-4 h-4" /> Satuan
                                                </button>
                                                <button
                                                    onClick={() => { setAddMode('bulk'); setShowCPLModal(true); setShowAddDropdown(prev => ({ ...prev, cpl: false })); }}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                >
                                                    <List className="w-4 h-4" /> Massal (Bulk)
                                                </button>
                                                <button
                                                    onClick={() => { handleOpenImport('cpl'); setShowAddDropdown(prev => ({ ...prev, cpl: false })); }}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                >
                                                    <FileUp className="w-4 h-4" /> Import CSV
                                                </button>
                                                <button
                                                    onClick={() => { handleExport('cpl'); setShowAddDropdown(prev => ({ ...prev, cpl: false })); }}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                >
                                                    <FileDown className="w-4 h-4" /> Export CSV
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {viewMode === 'table' ? (
                                    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                        <table className="table table-zebra w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-900">
                                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                                    <th
                                                        className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                                        onClick={() => toggleSort('cpl', 'kode_cpl')}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Kode
                                                            {sortConfig.cpl.field === 'kode_cpl' ? (
                                                                sortConfig.cpl.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                            ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                                                        </div>
                                                    </th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4">Deskripsi</th>
                                                    <th
                                                        className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                                        onClick={() => toggleSort('cpl', 'kategori')}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Kategori
                                                            {sortConfig.cpl.field === 'kategori' ? (
                                                                sortConfig.cpl.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                            ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                                                        </div>
                                                    </th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4">Level</th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4">Unit</th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4 w-32">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {cplData.length === 0 ? (
                                                    <tr><td colSpan="6" className="text-center py-8 text-gray-500 italic">Belum ada data CPL</td></tr>
                                                ) : sortData(cplData.filter(item => {
                                                    const matchesSearch = !searchTerms.cpl || (item.kode_cpl + (item.kode_tampilan || '') + item.deskripsi + (item.kategori || '')).toLowerCase().includes(searchTerms.cpl.toLowerCase());
                                                    const matchesLevel = !levelFilters.cpl || item.level === levelFilters.cpl;
                                                    return matchesSearch && matchesLevel;
                                                }), 'cpl').map(item => (
                                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="font-mono font-semibold text-primary-600 dark:text-primary-400 py-3 px-4 whitespace-nowrap" title={`Internal: ${item.kode_cpl}`}>{item.kode_tampilan || item.kode_cpl}</td>
                                                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 max-w-xl">{item.deskripsi}</td>
                                                        <td className="py-3 px-4">
                                                            <span className={`${getTagColor(item.kategori)} px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap border`}>
                                                                {item.kategori}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`${getTagColor(item.level)} px-2.5 py-1 rounded-full text-xs font-semibold uppercase border`}>
                                                                {item.level}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`${getTagColor(item.level || 'prodi')} px-2 py-0.5 rounded text-[10px] font-bold uppercase border`}>
                                                                {item.prodi?.nama || item.fakultas?.nama || item.institusi?.nama || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex gap-1">
                                                                <button onClick={() => handleEditCPL(item)} className="btn btn-xs btn-ghost text-primary-600">Edit</button>
                                                                <button onClick={() => handleDeleteCPL(item.id)} className="btn btn-xs btn-ghost text-error">Hapus</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className={`grid gap-4 ${viewMode === 'card' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                        {cplData.filter(item => {
                                            const matchesSearch = !searchTerms.cpl || (item.kode_cpl + (item.kode_tampilan || '') + item.deskripsi + (item.kategori || '')).toLowerCase().includes(searchTerms.cpl.toLowerCase());
                                            const matchesLevel = !levelFilters.cpl || item.level === levelFilters.cpl;
                                            return matchesSearch && matchesLevel;
                                        }).map(item => (
                                            <div key={item.id} className="card bg-base-100 shadow-sm border border-gray-200 dark:border-gray-700">
                                                <div className="card-body p-4">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="card-title text-sm" title={`Internal: ${item.kode_cpl}`}>{item.kode_tampilan || item.kode_cpl}</h3>
                                                        <span className="badge badge-xs">{item.kategori}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{item.deskripsi}</p>
                                                    <div className="card-actions justify-end mt-4">
                                                        <button onClick={() => handleEditCPL(item)} className="btn btn-xs">Edit</button>
                                                        <button onClick={() => handleDeleteCPL(item.id)} className="btn btn-xs btn-error btn-outline">Hapus</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* BAHAN KAJIAN CONTENT */}
                        {activeTab === 'bahan-kajian' && (
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto flex-1">
                                        <div className="relative flex-1 max-w-md">
                                            <input
                                                type="text"
                                                placeholder="Cari BK..."
                                                className="input input-bordered input-sm w-full pl-8"
                                                value={searchTerms.bk}
                                                onChange={e => setSearchTerms({ ...searchTerms, bk: e.target.value })}
                                            />
                                            <Search className="w-4 h-4 absolute left-2.5 top-2 text-gray-400" />
                                        </div>
                                        <select
                                            className="select select-bordered select-sm w-full md:w-40"
                                            value={levelFilters.bk}
                                            onChange={e => setLevelFilters({ ...levelFilters, bk: e.target.value })}
                                        >
                                            <option value="">Semua Level</option>
                                            <option value="institusi">Institusi</option>
                                            <option value="fakultas">Fakultas</option>
                                            <option value="prodi">Prodi</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        {selectedItems.length > 0 && (
                                            <button onClick={handleBatchDelete} className="btn btn-error btn-sm gap-2">
                                                <Trash2 className="w-4 h-4" /> Hapus massal
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowAddDropdown(prev => ({ ...prev, bk: !prev.bk }))}
                                            className="btn btn-primary btn-sm gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Kelola BK
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                        {showAddDropdown.bk && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                                                <button
                                                    onClick={() => { handleAddBK(); setShowAddDropdown(prev => ({ ...prev, bk: false })); }}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                >
                                                    <Plus className="w-4 h-4" /> Satuan
                                                </button>
                                                <button
                                                    onClick={() => { setShowBKModal(true); setAddMode('bulk'); setShowAddDropdown(prev => ({ ...prev, bk: false })); }}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                >
                                                    <List className="w-4 h-4" /> Massal (Bulk)
                                                </button>
                                                <button
                                                    onClick={() => { handleOpenImport('bahan-kajian'); setShowAddDropdown(prev => ({ ...prev, bk: false })); }}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                >
                                                    <FileUp className="w-4 h-4" /> Import CSV
                                                </button>
                                                <button
                                                    onClick={() => { handleExport('bahan-kajian'); setShowAddDropdown(prev => ({ ...prev, bk: false })); }}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                >
                                                    <FileDown className="w-4 h-4" /> Export CSV
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {viewMode === 'table' ? (
                                    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                        <table className="table table-zebra w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-900">
                                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                                    <th
                                                        className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                                        onClick={() => toggleSort('bk', 'kode_bk')}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Kode BK
                                                            {sortConfig.bk.field === 'kode_bk' ? (
                                                                sortConfig.bk.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                            ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                                                        </div>
                                                    </th>
                                                    <th
                                                        className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                                        onClick={() => toggleSort('bk', 'jenis')}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Jenis
                                                            {sortConfig.bk.field === 'jenis' ? (
                                                                sortConfig.bk.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                            ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                                                        </div>
                                                    </th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4">Deskripsi</th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4">Bobot SKS (Min-Max)</th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4 text-xs">Level</th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4 text-xs">Unit</th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4 w-32">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {bkData.length === 0 ? (
                                                    <tr><td colSpan="7" className="text-center py-8 text-gray-500 italic">Belum ada data Bahan Kajian</td></tr>
                                                ) : sortData(bkData.filter(item => {
                                                    const matchesSearch = !searchTerms.bk || (item.kode_bk + (item.kode_tampilan || '') + item.deskripsi + (item.jenis || '')).toLowerCase().includes(searchTerms.bk.toLowerCase());
                                                    const matchesLevel = !levelFilters.bk || item.level === levelFilters.bk;
                                                    return matchesSearch && matchesLevel;
                                                }), 'bk').map(item => (
                                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="font-mono font-semibold text-primary-600 dark:text-primary-400 py-3 px-4 whitespace-nowrap" title={`Internal: ${item.kode_bk}`}>{item.kode_tampilan || item.kode_bk}</td>
                                                        <td className="py-3 px-4">
                                                            <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2.5 py-1 rounded-full text-xs font-semibold border border-indigo-200 dark:border-indigo-800">
                                                                {item.jenis}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{item.deskripsi}</td>
                                                        <td className="py-3 px-4 text-sm font-medium">{Math.round(item.bobot_min || 0)} - {Math.round(item.bobot_max || 0)}</td>
                                                        <td className="py-3 px-4">
                                                            <span className={`${getTagColor(item.level || 'prodi')} px-2.5 py-1 rounded-full text-xs font-semibold uppercase border`}>
                                                                {item.level || 'prodi'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${(item.level || 'prodi') === 'institusi' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' :
                                                                (item.level || 'prodi') === 'fakultas' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' :
                                                                    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                                                                }`}>
                                                                {item.prodi?.nama || item.fakultas?.nama || item.institusi?.nama || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex gap-1">
                                                                <button onClick={() => handleEditBK(item)} className="btn btn-xs btn-ghost text-primary-600">Edit</button>
                                                                <button onClick={() => handleDeleteBK(item.id)} className="btn btn-xs btn-ghost text-error">Hapus</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className={`grid gap-4 ${viewMode === 'card' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                        {bkData.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 col-span-full">Belum ada data Bahan Kajian</div>
                                        ) : bkData.filter(item => {
                                            const matchesSearch = !searchTerms.bk || (item.kode_bk + (item.kode_tampilan || '') + item.deskripsi + (item.jenis || '')).toLowerCase().includes(searchTerms.bk.toLowerCase());
                                            const matchesLevel = !levelFilters.bk || item.level === levelFilters.bk;
                                            return matchesSearch && matchesLevel;
                                        }).map(item => (
                                            <div key={item.id} className="card bg-base-100 shadow-sm border border-gray-200 dark:border-gray-700">
                                                <div className="card-body p-4">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="card-title text-sm font-mono text-primary-600" title={`Internal: ${item.kode_bk}`}>{item.kode_tampilan || item.kode_bk}</h3>
                                                        <span className="badge badge-outline badge-xs">{item.jenis}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{item.deskripsi}</p>
                                                    <div className="text-xs text-gray-500 mt-2">Bobot SKS: {Math.round(item.bobot_min || 0)} - {Math.round(item.bobot_max || 0)}</div>
                                                    <div className="card-actions justify-end mt-4">
                                                        <button onClick={() => handleEditBK(item)} className="btn btn-xs">Edit</button>
                                                        <button onClick={() => handleDeleteBK(item.id)} className="btn btn-xs btn-error btn-outline">Hapus</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CPMK CONTENT */}
                        {activeTab === 'cpmk' && (
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto flex-1">
                                        <div className="relative flex-1 max-w-md">
                                            <input
                                                type="text"
                                                placeholder="Cari CPMK..."
                                                className="input input-bordered input-sm w-full pl-8"
                                                value={searchTerms.cpmk}
                                                onChange={e => setSearchTerms({ ...searchTerms, cpmk: e.target.value })}
                                            />
                                            <Search className="w-4 h-4 absolute left-2.5 top-2 text-gray-400" />
                                        </div>
                                        <select
                                            className="select select-bordered select-sm w-full md:w-40"
                                            value={levelFilters.cpmk}
                                            onChange={e => setLevelFilters({ ...levelFilters, cpmk: e.target.value })}
                                        >
                                            <option value="">Semua Level</option>
                                            <option value="institusi">Institusi</option>
                                            <option value="fakultas">Fakultas</option>
                                            <option value="prodi">Prodi</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        {selectedItems.length > 0 && (
                                            <button onClick={handleBatchDelete} className="btn btn-error btn-sm gap-2">
                                                <Trash2 className="w-4 h-4" /> Hapus massal
                                            </button>
                                        )}
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowAddDropdown(prev => ({ ...prev, cpmk: !prev.cpmk }))}
                                                className="btn btn-primary btn-sm gap-2"
                                            >
                                                <Plus className="w-4 h-4" /> Kelola CPMK
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                            {showAddDropdown.cpmk && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                                                    <button
                                                        onClick={() => { handleAddCPMK(); setShowAddDropdown(prev => ({ ...prev, cpmk: false })); }}
                                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                    >
                                                        <Plus className="w-4 h-4" /> Satuan
                                                    </button>
                                                    <button
                                                        onClick={() => { setAddMode('bulk'); setShowCPMKModal(true); setShowAddDropdown(prev => ({ ...prev, cpmk: false })); }}
                                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                    >
                                                        <List className="w-4 h-4" /> Massal (Bulk)
                                                    </button>
                                                    <button
                                                        onClick={() => { handleOpenImport('cpmk'); setShowAddDropdown(prev => ({ ...prev, cpmk: false })); }}
                                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                    >
                                                        <FileUp className="w-4 h-4" /> Import CSV
                                                    </button>
                                                    <button
                                                        onClick={() => { handleExport('cpmk'); setShowAddDropdown(prev => ({ ...prev, cpmk: false })); }}
                                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                    >
                                                        <FileDown className="w-4 h-4" /> Export CSV
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {viewMode === 'table' ? (
                                    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                        <table className="table table-zebra w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-900">
                                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                                    <th className="py-3 px-4 w-10">
                                                        <input type="checkbox" className="checkbox checkbox-sm" onChange={(e) => handleSelectAll(e, cpmkData)} checked={cpmkData.length > 0 && selectedItems.length === cpmkData.length} />
                                                    </th>
                                                    <th
                                                        className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                                        onClick={() => toggleSort('cpmk', 'kode_cpmk')}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Kode CPMK
                                                            {sortConfig.cpmk.field === 'kode_cpmk' ? (
                                                                sortConfig.cpmk.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                            ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                                                        </div>
                                                    </th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4">Deskripsi</th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4">CPL</th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4">Level</th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4">Unit</th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4 w-32">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {cpmkData.length === 0 ? (
                                                    <tr><td colSpan="7" className="text-center py-8 text-gray-500 italic">Belum ada data CPMK</td></tr>
                                                ) : sortData(cpmkData.filter(item => {
                                                    const matchesSearch = !searchTerms.cpmk || (item.kode_cpmk + (item.kode_tampilan || '') + item.deskripsi + (item.cpl?.kode_tampilan || '')).toLowerCase().includes(searchTerms.cpmk.toLowerCase());
                                                    const matchesLevel = !levelFilters.cpmk || item.level === levelFilters.cpmk;
                                                    return matchesSearch && matchesLevel;
                                                }), 'cpmk').map(item => (
                                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="py-3 px-4">
                                                            <input type="checkbox" className="checkbox checkbox-sm" checked={selectedItems.includes(item.id)} onChange={() => handleSelectItem(item.id)} />
                                                        </td>
                                                        <td className="font-mono font-semibold text-primary-600 dark:text-primary-400 py-3 px-4 whitespace-nowrap" title={`Internal: ${item.kode_cpmk}`}>{item.kode_tampilan || item.kode_cpmk}</td>
                                                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 max-w-md">{item.deskripsi}</td>
                                                        <td className="py-3 px-4">
                                                            {item.cpl ? <span className="badge badge-outline badge-sm" title={`Internal: ${item.cpl.kode_cpl}`}>{item.cpl.kode_tampilan || item.cpl.kode_cpl}</span> : '-'}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`${getTagColor(item.level || 'prodi')} px-2.5 py-1 rounded-full text-xs font-semibold uppercase border`}>
                                                                {item.level || 'prodi'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${(item.level || 'prodi') === 'institusi' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' :
                                                                (item.level || 'prodi') === 'fakultas' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' :
                                                                    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                                                                }`}>
                                                                {item.prodi?.nama || item.fakultas?.nama || item.institusi?.nama || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex gap-1">
                                                                <button onClick={() => handleEditCPMK(item)} className="btn btn-xs btn-ghost text-primary-600">Edit</button>
                                                                <button onClick={() => handleDeleteCPMK(item.id)} className="btn btn-xs btn-ghost text-error">Hapus</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className={`grid gap-4 ${viewMode === 'card' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                        {cpmkData.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 col-span-full">Belum ada data CPMK</div>
                                        ) : cpmkData.filter(item => {
                                            const matchesSearch = !searchTerms.cpmk || (item.kode_cpmk + (item.kode_tampilan || '') + item.deskripsi + (item.cpl?.kode_tampilan || '')).toLowerCase().includes(searchTerms.cpmk.toLowerCase());
                                            const matchesLevel = !levelFilters.cpmk || item.level === levelFilters.cpmk;
                                            return matchesSearch && matchesLevel;
                                        }).map(item => (
                                            <div key={item.id} className="card bg-base-100 shadow-sm border border-gray-200 dark:border-gray-700">
                                                <div className="card-body p-4">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="card-title text-sm font-mono text-primary-600" title={`Internal: ${item.kode_cpmk}`}>{item.kode_tampilan || item.kode_cpmk}</h3>
                                                        {item.cpl && <span className="badge badge-outline badge-xs" title={`Internal: ${item.cpl.kode_cpl}`}>{item.cpl.kode_tampilan || item.cpl.kode_cpl}</span>}
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{item.deskripsi}</p>
                                                    <div className="card-actions justify-end mt-4">
                                                        <button onClick={() => handleEditCPMK(item)} className="btn btn-xs">Edit</button>
                                                        <button onClick={() => handleDeleteCPMK(item.id)} className="btn btn-xs btn-error btn-outline">Hapus</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SUB-CPMK CONTENT */}
                        {activeTab === 'sub-cpmk' && (
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto flex-1">
                                        <div className="relative flex-1 max-w-md">
                                            <input
                                                type="text"
                                                placeholder="Cari Sub-CPMK..."
                                                className="input input-bordered input-sm w-full pl-8"
                                                value={searchTerms.subCpmk}
                                                onChange={e => setSearchTerms({ ...searchTerms, subCpmk: e.target.value })}
                                            />
                                            <Search className="w-4 h-4 absolute left-2.5 top-2 text-gray-400" />
                                        </div>
                                        <select
                                            className="select select-bordered select-sm w-full md:w-40"
                                            value={levelFilters.subCpmk}
                                            onChange={e => setLevelFilters({ ...levelFilters, subCpmk: e.target.value })}
                                        >
                                            <option value="">Semua Level</option>
                                            <option value="institusi">Institusi</option>
                                            <option value="fakultas">Fakultas</option>
                                            <option value="prodi">Prodi</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        {selectedItems.length > 0 && (
                                            <button onClick={handleBatchDelete} className="btn btn-error btn-sm gap-2">
                                                <Trash2 className="w-4 h-4" /> Hapus massal
                                            </button>
                                        )}
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowAddDropdown(prev => ({ ...prev, subCpmk: !prev.subCpmk }))}
                                                className="btn btn-primary btn-sm gap-2"
                                            >
                                                <Plus className="w-4 h-4" /> Kelola Sub-CPMK
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                            {showAddDropdown.subCpmk && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                                                    <button
                                                        onClick={() => { handleAddSubCPMK(); setShowAddDropdown(prev => ({ ...prev, subCpmk: false })); }}
                                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                    >
                                                        <Plus className="w-4 h-4" /> Satuan
                                                    </button>
                                                    <button
                                                        onClick={() => { setAddMode('bulk'); setShowSubCPMKModal(true); setShowAddDropdown(prev => ({ ...prev, subCpmk: false })); }}
                                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                    >
                                                        <List className="w-4 h-4" /> Massal (Bulk)
                                                    </button>
                                                    <button
                                                        onClick={() => { handleOpenImport('sub-cpmk'); setShowAddDropdown(prev => ({ ...prev, subCpmk: false })); }}
                                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                    >
                                                        <FileUp className="w-4 h-4" /> Import CSV
                                                    </button>
                                                    <button
                                                        onClick={() => { handleExport('sub-cpmk'); setShowAddDropdown(prev => ({ ...prev, subCpmk: false })); }}
                                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                    >
                                                        <FileDown className="w-4 h-4" /> Export CSV
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {viewMode === 'table' ? (
                                    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                        <table className="table table-zebra w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-900">
                                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                                    <th className="py-3 px-4 w-10">
                                                        <input type="checkbox" className="checkbox checkbox-sm" onChange={(e) => handleSelectAll(e, subCpmkData)} checked={subCpmkData.length > 0 && selectedItems.length === subCpmkData.length} />
                                                    </th>
                                                    <th
                                                        className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                                        onClick={() => toggleSort('subCpmk', 'kode_sub_cpmk')}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Kode
                                                            {sortConfig.subCpmk.field === 'kode_sub_cpmk' ? (
                                                                sortConfig.subCpmk.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                            ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                                                        </div>
                                                    </th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4">Deskripsi</th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4">Induk CPMK</th>
                                                    <th
                                                        className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                                        onClick={() => toggleSort('subCpmk', 'bobot_nilai')}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Bobot
                                                            {sortConfig.subCpmk.field === 'bobot_nilai' ? (
                                                                sortConfig.subCpmk.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                            ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                                                        </div>
                                                    </th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4">Level</th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4">Unit</th>
                                                    <th className="text-xs uppercase tracking-wider text-gray-500 font-semibold py-3 px-4 w-32">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {subCpmkData.length === 0 ? (
                                                    <tr><td colSpan="8" className="text-center py-8 text-gray-500 italic">Belum ada data Sub-CPMK</td></tr>
                                                ) : sortData(subCpmkData.filter(item => {
                                                    const matchesSearch = !searchTerms.subCpmk || (item.kode_sub_cpmk + (item.kode_tampilan || '') + item.deskripsi + (item.cpmk?.kode_tampilan || '')).toLowerCase().includes(searchTerms.subCpmk.toLowerCase());
                                                    const matchesLevel = !levelFilters.subCpmk || item.level === levelFilters.subCpmk;
                                                    return matchesSearch && matchesLevel;
                                                }), 'subCpmk').map(item => (
                                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="py-3 px-4">
                                                            <input type="checkbox" className="checkbox checkbox-sm" checked={selectedItems.includes(item.id)} onChange={() => handleSelectItem(item.id)} />
                                                        </td>
                                                        <td className="font-mono font-semibold text-primary-600 dark:text-primary-400 py-3 px-4 whitespace-nowrap" title={`Internal: ${item.kode_sub_cpmk}`}>{item.kode_tampilan || item.kode_sub_cpmk}</td>
                                                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 max-w-md">{item.deskripsi}</td>
                                                        <td className="py-3 px-4">
                                                            {item.cpmk ? <span className="badge badge-outline badge-sm" title={`Internal: ${item.cpmk.kode_cpmk}`}>{item.cpmk.kode_tampilan || item.cpmk.kode_cpmk}</span> : '-'}
                                                        </td>
                                                        <td className="py-3 px-4 font-medium">{item.bobot_nilai}%</td>
                                                        <td className="py-3 px-4">
                                                            <span className={`${getTagColor(item.level || 'prodi')} px-2.5 py-1 rounded-full text-xs font-semibold uppercase border`}>
                                                                {item.level || 'prodi'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${(item.level || 'prodi') === 'institusi' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' :
                                                                (item.level || 'prodi') === 'fakultas' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' :
                                                                    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                                                                }`}>
                                                                {item.prodi?.nama || item.fakultas?.nama || item.institusi?.nama || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex gap-1">
                                                                <button onClick={() => handleEditSubCPMK(item)} className="btn btn-xs btn-ghost text-primary-600">Edit</button>
                                                                <button onClick={() => handleDeleteSubCPMK(item.id)} className="btn btn-xs btn-ghost text-error">Hapus</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className={`grid gap-4 ${viewMode === 'card' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                        {subCpmkData.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 col-span-full">Belum ada data Sub-CPMK</div>
                                        ) : subCpmkData.filter(item => {
                                            const matchesSearch = !searchTerms.subCpmk || (item.kode_sub_cpmk + (item.kode_tampilan || '') + item.deskripsi + (item.cpmk?.kode_tampilan || '')).toLowerCase().includes(searchTerms.subCpmk.toLowerCase());
                                            const matchesLevel = !levelFilters.subCpmk || item.level === levelFilters.subCpmk;
                                            return matchesSearch && matchesLevel;
                                        }).map(item => (
                                            <div key={item.id} className="card bg-base-100 shadow-sm border border-gray-200 dark:border-gray-700">
                                                <div className="card-body p-4">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="card-title text-sm font-mono text-primary-600 dark:text-primary-400" title={`Internal: ${item.kode_sub_cpmk}`}>{item.kode_tampilan || item.kode_sub_cpmk}</h3>
                                                        <div className="flex items-center gap-2">
                                                            {item.cpmk && <span className="badge badge-outline badge-xs" title={`Internal: ${item.cpmk.kode_cpmk}`}>{item.cpmk.kode_tampilan || item.cpmk.kode_cpmk}</span>}
                                                            <span className="badge badge-primary badge-xs">{item.bobot_nilai}%</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{item.deskripsi}</p>
                                                    <div className="card-actions justify-end mt-4">
                                                        <button onClick={() => handleEditSubCPMK(item)} className="btn btn-xs">Edit</button>
                                                        <button onClick={() => handleDeleteSubCPMK(item.id)} className="btn btn-xs btn-error btn-outline">Hapus</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* --- MODALS --- */}
            {/* CPL Modal */}
            {showCPLModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 my-auto">
                        <h3 className="font-bold text-lg mb-4">{editingItem ? 'Edit CPL' : 'Tambah CPL'}</h3>

                        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-100 dark:border-gray-800">
                            <div className="form-control">
                                <label className="label"><span className="label-text font-semibold">Level Organisasi</span></label>
                                <select className="select select-bordered select-sm w-full" value={formData.level || 'prodi'} onChange={e => handleLevelChange(e.target.value)}>
                                    <option value="institusi">Institusi (Global)</option>
                                    <option value="fakultas">Fakultas</option>
                                    <option value="prodi">Program Studi</option>
                                </select>
                            </div>
                            {formData.level === 'fakultas' && renderUnitSelection('fakultas')}
                            {formData.level === 'prodi' && renderUnitSelection('prodi')}
                            {formData.level === 'institusi' && (userProfile?.role === 'kaprodi' || userProfile?.role === 'dosen') && (
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-semibold">Unit</span></label>
                                    <div className="input input-bordered input-sm flex items-center bg-gray-100 dark:bg-gray-800 font-medium cursor-not-allowed">
                                        -
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">Kode CPL Display</span></label>
                            <div className="flex gap-2">
                                <input className="input input-bordered w-full" value={formData.kode_tampilan || ''} onChange={e => {
                                    const val = e.target.value;
                                    setFormData({
                                        ...formData,
                                        kode_tampilan: val,
                                        kode_cpl: `${userProfile?.prodi?.kode || 'GEN'}-${val.replace(/^[A-Z]+-/, '')}`
                                    });
                                }} placeholder="CPL01" />
                                <button onClick={generateCPLCode} className="btn btn-secondary">Gen</button>
                            </div>
                            <label className="label"><span className="label-text-alt text-gray-500">Masukkan kode display (misal: CPL01).</span></label>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text text-primary-600 font-semibold">Kode Unik Internal</span></label>
                            <input
                                className="input input-bordered w-full font-mono text-sm bg-gray-50 dark:bg-gray-700"
                                value={formData.kode_cpl || ''}
                                onChange={e => setFormData({ ...formData, kode_cpl: e.target.value })}
                                disabled={!(userProfile?.role === 'super_admin' || userProfile?.role === 'kaprodi')}
                                placeholder="IF-CPL01"
                            />
                            <label className="label"><span className="label-text-alt text-gray-500">Identitas unik di database. Hanya bisa diubah oleh Admin/Kaprodi.</span></label>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">Deskripsi</span></label>
                            <textarea className="textarea textarea-bordered h-48 w-full border border-gray-300 dark:border-gray-600 p-3" value={formData.deskripsi} onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}></textarea>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">Kategori</span></label>
                            <select className="select select-bordered w-full border border-gray-300 dark:border-gray-600" value={formData.kategori} onChange={e => setFormData({ ...formData, kategori: e.target.value })}>
                                <option value="Sikap">Sikap</option>
                                <option value="Pengetahuan">Pengetahuan</option>
                                <option value="Keterampilan Umum">Keterampilan Umum</option>
                                <option value="Keterampilan Khusus">Keterampilan Khusus</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button onClick={() => setShowCPLModal(false)} className="btn">Batal</button>
                            <button onClick={handleSaveCPL} className="btn btn-primary">Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CPMK Modal */}
            {showCPMKModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 my-auto">
                        <h3 className="font-bold text-lg mb-4">{editingItem ? 'Edit CPMK' : 'Tambah CPMK'}</h3>

                        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-100 dark:border-gray-800">
                            <div className="form-control">
                                <label className="label"><span className="label-text font-semibold">Level Organisasi</span></label>
                                <select className="select select-bordered select-sm w-full" value={formData.level || 'prodi'} onChange={e => handleLevelChange(e.target.value)}>
                                    <option value="institusi">Institusi (Global)</option>
                                    <option value="fakultas">Fakultas</option>
                                    <option value="prodi">Program Studi</option>
                                </select>
                            </div>
                            {formData.level === 'fakultas' && renderUnitSelection('fakultas')}
                            {formData.level === 'prodi' && renderUnitSelection('prodi')}
                            {formData.level === 'institusi' && (userProfile?.role === 'kaprodi' || userProfile?.role === 'dosen') && (
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-semibold">Unit</span></label>
                                    <div className="input input-bordered input-sm flex items-center bg-gray-100 dark:bg-gray-800 font-medium cursor-not-allowed">
                                        -
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">CPL Induk</span></label>
                            <select className="select select-bordered w-full border border-gray-300 dark:border-gray-600" value={formData.cpl_id || ''} onChange={e => setFormData({ ...formData, cpl_id: e.target.value })}>
                                <option value="">Pilih CPL</option>
                                {cplData.map(c => <option key={c.id} value={c.id} title={c.deskripsi}>{c.kode_tampilan || c.kode_cpl}</option>)}
                            </select>
                            {formData.cpl_id && (
                                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                                        <span className="font-semibold">{cplData.find(c => c.id == formData.cpl_id)?.kode_tampilan || cplData.find(c => c.id == formData.cpl_id)?.kode_cpl}:</span>{' '}
                                        {cplData.find(c => c.id == formData.cpl_id)?.deskripsi}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">Kode CPMK Display</span></label>
                            <div className="flex gap-2">
                                <input className="input input-bordered w-full" value={formData.kode_tampilan || ''} onChange={e => {
                                    const val = e.target.value;
                                    setFormData({
                                        ...formData,
                                        kode_tampilan: val,
                                        kode_cpmk: `${userProfile?.prodi?.kode || 'GEN'}-${val.replace(/^[A-Z]+-/, '')}`
                                    });
                                }} placeholder="CPMK01" />
                                <button onClick={generateCPMKCode} className="btn btn-secondary">Gen</button>
                            </div>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text text-primary-600 font-semibold">Kode Unik Internal</span></label>
                            <input
                                className="input input-bordered w-full font-mono text-sm bg-gray-50 dark:bg-gray-700"
                                value={formData.kode_cpmk || ''}
                                onChange={e => setFormData({ ...formData, kode_cpmk: e.target.value })}
                                disabled={!(userProfile?.role === 'super_admin' || userProfile?.role === 'kaprodi')}
                                placeholder="IF-CPMK01"
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">Deskripsi</span></label>
                            <textarea className="textarea textarea-bordered h-48 w-full border border-gray-300 dark:border-gray-600 p-3" value={formData.deskripsi} onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}></textarea>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button onClick={() => setShowCPMKModal(false)} className="btn">Batal</button>
                            <button onClick={handleSaveCPMK} className="btn btn-primary">Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* BK Modal */}
            {showBKModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 my-auto">
                        <h3 className="font-bold text-lg mb-4">{editingItem ? 'Edit Bahan Kajian' : 'Tambah Bahan Kajian'}</h3>

                        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-100 dark:border-gray-800">
                            <div className="form-control">
                                <label className="label"><span className="label-text font-semibold">Level Organisasi</span></label>
                                <select className="select select-bordered select-sm w-full" value={formData.level || 'prodi'} onChange={e => handleLevelChange(e.target.value)}>
                                    <option value="institusi">Institusi (Global)</option>
                                    <option value="fakultas">Fakultas</option>
                                    <option value="prodi">Program Studi</option>
                                </select>
                            </div>
                            {formData.level === 'fakultas' && renderUnitSelection('fakultas')}
                            {formData.level === 'prodi' && renderUnitSelection('prodi')}
                            {formData.level === 'institusi' && (userProfile?.role === 'kaprodi' || userProfile?.role === 'dosen') && (
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-semibold">Unit</span></label>
                                    <div className="input input-bordered input-sm flex items-center bg-gray-100 dark:bg-gray-800 font-medium cursor-not-allowed">
                                        -
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">Kode BK Display</span></label>
                            <div className="flex gap-2">
                                <input className="input input-bordered w-full" value={formData.kode_tampilan || ''} onChange={e => {
                                    const val = e.target.value;
                                    setFormData({
                                        ...formData,
                                        kode_tampilan: val,
                                        kode_bk: `${userProfile?.prodi?.kode || 'GEN'}-${val.replace(/^[A-Z]+-/, '')}`
                                    });
                                }} placeholder="BK01" />
                                <button onClick={generateBKCode} className="btn btn-secondary">Gen</button>
                            </div>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text text-primary-600 font-semibold">Kode Unik Internal</span></label>
                            <input
                                className="input input-bordered w-full font-mono text-sm bg-gray-50 dark:bg-gray-700"
                                value={formData.kode_bk || ''}
                                onChange={e => setFormData({ ...formData, kode_bk: e.target.value })}
                                disabled={!(userProfile?.role === 'super_admin' || userProfile?.role === 'kaprodi')}
                                placeholder="IF-BK01"
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">Jenis</span></label>
                            <input className="input input-bordered w-full" value={formData.jenis} onChange={e => setFormData({ ...formData, jenis: e.target.value })} placeholder="Inti / Pendukung" />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">Deskripsi</span></label>
                            <textarea className="textarea textarea-bordered h-48 w-full border border-gray-300 dark:border-gray-600 p-3" value={formData.deskripsi} onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="form-control">
                                <label className="label"><span className="label-text">Bobot SKS Min</span></label>
                                <input type="number" className="input input-bordered" value={formData.bobot_min} onChange={e => setFormData({ ...formData, bobot_min: e.target.value })} />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Bobot SKS Max</span></label>
                                <input type="number" className="input input-bordered" value={formData.bobot_max} onChange={e => setFormData({ ...formData, bobot_max: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button onClick={() => setShowBKModal(false)} className="btn">Batal</button>
                            <button onClick={handleSaveBK} className="btn btn-primary">Simpan</button>
                        </div>
                    </div>
                </div>
            )}


            {/* Sub-CPMK Modal */}
            {
                showSubCPMKModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 my-auto">
                            <h3 className="font-bold text-lg mb-4">{editingItem ? 'Edit Sub-CPMK' : 'Tambah Sub-CPMK'}</h3>

                            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-100 dark:border-gray-800">
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-semibold">Level Organisasi</span></label>
                                    <select className="select select-bordered select-sm w-full" value={formData.level || 'prodi'} onChange={e => handleLevelChange(e.target.value)}>
                                        <option value="institusi">Institusi (Global)</option>
                                        <option value="fakultas">Fakultas</option>
                                        <option value="prodi">Program Studi</option>
                                    </select>
                                </div>
                                {formData.level === 'fakultas' && renderUnitSelection('fakultas')}
                                {formData.level === 'prodi' && renderUnitSelection('prodi')}
                                {formData.level === 'institusi' && (userProfile?.role === 'kaprodi' || userProfile?.role === 'dosen') && (
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-semibold">Unit</span></label>
                                        <div className="input input-bordered input-sm flex items-center bg-gray-100 dark:bg-gray-800 font-medium cursor-not-allowed">
                                            -
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* CPL Filter */}
                            <div className="form-control mb-4">
                                <label className="label"><span className="label-text">Filter berdasarkan CPL</span></label>
                                <select
                                    className="select select-bordered w-full border border-gray-300 dark:border-gray-600"
                                    value={filterCPLForSubCPMK}
                                    onChange={e => { setFilterCPLForSubCPMK(e.target.value); setFormData({ ...formData, cpmk_id: '' }); }}
                                >
                                    <option value="all">Semua CPMK</option>
                                    <option value="none">CPMK tanpa CPL</option>
                                    {cplData.map(cpl => (
                                        <option key={cpl.id} value={cpl.id} title={cpl.deskripsi}>{cpl.kode_tampilan || cpl.kode_cpl}</option>
                                    ))}
                                </select>
                                {filterCPLForSubCPMK && filterCPLForSubCPMK !== 'all' && filterCPLForSubCPMK !== 'none' && (
                                    <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                                        <p className="text-sm text-purple-800 dark:text-purple-300 leading-relaxed">
                                            <span className="font-semibold">{cplData.find(c => c.id == filterCPLForSubCPMK)?.kode_tampilan || cplData.find(c => c.id == filterCPLForSubCPMK)?.kode_cpl}:</span>{' '}
                                            {cplData.find(c => c.id == filterCPLForSubCPMK)?.deskripsi}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* CPMK Selection */}
                            <div className="form-control mb-4">
                                <label className="label"><span className="label-text">CPMK Induk</span></label>
                                <select
                                    className="select select-bordered w-full border border-gray-300 dark:border-gray-600"
                                    value={formData.cpmk_id || ''}
                                    onChange={e => setFormData({ ...formData, cpmk_id: e.target.value })}
                                >
                                    <option value="">Pilih CPMK</option>
                                    {getFilteredCPMK().map(c => (
                                        <option key={c.id} value={c.id} title={c.deskripsi}>{c.kode_tampilan || c.kode_cpmk}</option>
                                    ))}
                                </select>
                                <label className="label">
                                    <span className="label-text-alt text-gray-500">{getFilteredCPMK().length} CPMK tersedia</span>
                                </label>
                                {formData.cpmk_id && (
                                    <div className="mt-1 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                        <p className="text-sm text-green-800 dark:text-green-300 leading-relaxed">
                                            <span className="font-semibold">{cpmkData.find(c => c.id == formData.cpmk_id)?.kode_tampilan || cpmkData.find(c => c.id == formData.cpmk_id)?.kode_cpmk}:</span>{' '}
                                            {cpmkData.find(c => c.id == formData.cpmk_id)?.deskripsi}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="form-control mb-4">
                                <label className="label"><span className="label-text">Kode Sub-CPMK Display</span></label>
                                <div className="flex gap-2">
                                    <input className="input input-bordered w-full" value={formData.kode_tampilan || ''} onChange={e => {
                                        const val = e.target.value;
                                        setFormData({
                                            ...formData,
                                            kode_tampilan: val,
                                            kode_sub_cpmk: `${userProfile?.prodi?.kode || 'GEN'}-${val.replace(/^[A-Z]+-/, '')}`
                                        });
                                    }} placeholder="SCPMK01" />
                                    <button onClick={generateSubCPMKCode} className="btn btn-secondary">Gen</button>
                                </div>
                            </div>
                            <div className="form-control mb-4">
                                <label className="label"><span className="label-text text-primary-600 font-semibold">Kode Unik Internal</span></label>
                                <input
                                    className="input input-bordered w-full font-mono text-sm bg-gray-50 dark:bg-gray-700"
                                    value={formData.kode_sub_cpmk || ''}
                                    onChange={e => setFormData({ ...formData, kode_sub_cpmk: e.target.value })}
                                    disabled={!(userProfile?.role === 'super_admin' || userProfile?.role === 'kaprodi')}
                                    placeholder="IF-SCPMK01"
                                />
                            </div>
                            <div className="form-control mb-4">
                                <label className="label"><span className="label-text">Deskripsi</span></label>
                                <textarea className="textarea textarea-bordered h-48 w-full border border-gray-300 dark:border-gray-600 p-3" value={formData.deskripsi} onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}></textarea>
                            </div>
                            <div className="form-control mb-4">
                                <label className="label"><span className="label-text">Bobot (%)</span></label>
                                <input type="number" className="input input-bordered" value={formData.bobot_nilai} onChange={e => setFormData({ ...formData, bobot_nilai: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button onClick={() => setShowSubCPMKModal(false)} className="btn">Batal</button>
                                <button onClick={handleSaveSubCPMK} className="btn btn-primary">Simpan</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Import Modal */}
            {
                showImportModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
                            <h3 className="font-bold text-lg mb-4 capitalize">Import {importType.replace('-', ' ')}</h3>
                            <p className="text-sm mb-4">Upload file CSV sesuai template.</p>
                            <div className="form-control w-full mb-4">
                                <input type="file" className="file-input file-input-bordered w-full" accept=".csv" onChange={handleFileSelect} />
                            </div>
                            <div className="alert alert-info shadow-sm text-xs mb-4">
                                <Info className="w-4 h-4" />
                                <span>Gunakan template yang disediakan agar format data sesuai. Pastikan kode prodi terisi jika diperlukan.</span>
                            </div>
                            <div className="flex justify-between items-center mb-4">
                                <button onClick={handleDownloadTemplate} className="btn btn-ghost btn-sm text-primary">Download Template CSV</button>
                            </div>
                            <div className="modal-action">
                                <button onClick={() => setShowImportModal(false)} className="btn">Batal</button>
                                <button onClick={handleImportCheck} className="btn btn-primary" disabled={!selectedFile}>Periksa File</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Help Modal */}
            {
                showHelpModal && (
                    <div className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg mb-4">Bantuan</h3>
                            <div className="prose">
                                <p>Gunakan menu Import untuk memasukkan data secara massal.</p>
                                <p>Data yang didukung: CPL, CPMK, Sub-CPMK, Bahan Kajian, Mata Kuliah.</p>
                                <p>Gunakan tombol "Gen" (Generate) atau "Magic" untuk membuat kode otomatis berdasarkan hierarki data.</p>
                            </div>
                            <div className="modal-action">
                                <button onClick={() => setShowHelpModal(false)} className="btn">Tutup</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Conflict Resolution Modal */}
            {importConflicts && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="font-bold text-lg mb-2 text-warning flex items-center gap-2">
                            <Info className="w-5 h-5" /> Konflik Data Ditemukan
                        </h3>
                        <p className="text-sm mb-4">
                            Ditemukan <strong>{importConflicts.length}</strong> data dengan kode tampilan yang sama. Pilih strategi penyelesaian:
                        </p>

                        <div className="space-y-3 mb-6">
                            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${conflictStrategy === 'skip' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700'}`}>
                                <input type="radio" name="strategy" value="skip" checked={conflictStrategy === 'skip'} onChange={(e) => setConflictStrategy(e.target.value)} className="radio radio-primary radio-sm mt-1" />
                                <div>
                                    <div className="font-semibold text-sm">Lewati (Skip)</div>
                                    <div className="text-xs text-gray-500">Hanya impor data baru yang belum ada di sistem.</div>
                                </div>
                            </label>

                            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${conflictStrategy === 'overwrite' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700'}`}>
                                <input type="radio" name="strategy" value="overwrite" checked={conflictStrategy === 'overwrite'} onChange={(e) => setConflictStrategy(e.target.value)} className="radio radio-primary radio-sm mt-1" />
                                <div>
                                    <div className="font-semibold text-sm">Timpa (Overwrite)</div>
                                    <div className="text-xs text-gray-500">Perbarui data lama dengan informasi dari file CSV terbaru.</div>
                                </div>
                            </label>

                            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${conflictStrategy === 'duplicate' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700'}`}>
                                <input type="radio" name="strategy" value="duplicate" checked={conflictStrategy === 'duplicate'} onChange={(e) => setConflictStrategy(e.target.value)} className="radio radio-primary radio-sm mt-1" />
                                <div>
                                    <div className="font-semibold text-sm">Duplikat Saja</div>
                                    <div className="text-xs text-gray-500">Impor sebagai data baru (sistem otomatis menambah angka di belakang kode).</div>
                                </div>
                            </label>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setImportConflicts(null)} className="btn btn-sm">Batal</button>
                            <button onClick={() => handleImportCommit(conflictStrategy)} className="btn btn-sm btn-primary" disabled={isImporting}>
                                Lanjutkan Impor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
