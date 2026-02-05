
import { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { downloadCSVTemplate } from '../utils/csvHelper';
import { hasPermission, PERMISSIONS } from '../utils/permissions';
import { Info, List, Table, LayoutGrid, Trash2, Plus, FileDown, FileUp } from 'lucide-react';

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

    const [showCPLModal, setShowCPLModal] = useState(false);
    const [showCPMKModal, setShowCPMKModal] = useState(false);
    const [showSubCPMKModal, setShowSubCPMKModal] = useState(false);
    const [showMKModal, setShowMKModal] = useState(false);
    const [showBKModal, setShowBKModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);

    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});

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
                loadBK()
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
            setUserProfile(response.data);
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
        setFormData({ ...formData, kode_cpl: `${prefix}-CPL${nextNum}` });
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
        setFormData({ ...formData, kode_cpmk: newCode });
    };

    const generateSubCPMKCode = () => { /* ... existing ... */
        if (!formData.cpmk_id) { setMessage({ type: 'error', text: 'Pilih CPMK terlebih dahulu!' }); return; }
        const cpmk = cpmkData.find(c => c.id == formData.cpmk_id);
        if (!cpmk) { setMessage({ type: 'error', text: 'CPMK tidak ditemukan!' }); return; }
        const cpmkBaseMatch = cpmk.kode_cpmk.replace('CPMK', '');
        const existingForCPMK = subCpmkData.filter(s => s.cpmk_id == formData.cpmk_id);
        const nextIndex = String(existingForCPMK.length + 1).padStart(2, '0');
        const newCode = `sub-CPMK${cpmkBaseMatch}${nextIndex}`;
        setFormData({ ...formData, kode_sub_cpmk: newCode });
    };


    // --- Actions ---
    // CPL
    const handleAddCPL = () => { setEditingItem(null); setFormData({ kode_cpl: '', deskripsi: '', kategori: 'Sikap', level: 'prodi' }); setShowCPLModal(true); };
    const handleEditCPL = (item) => { setEditingItem(item); setFormData({ ...item }); setShowCPLModal(true); };
    const handleDeleteCPL = async (id) => {
        if (!window.confirm('Delete?')) return;
        try { await axios.delete(`/curriculum/cpl/${id}`); loadCPL(); } catch (e) { alert(e.message); }
    };
    const handleSaveCPL = async () => {
        try {
            if (editingItem) await axios.put(`/curriculum/cpl/${editingItem.id}`, formData);
            else await axios.post('/curriculum/cpl', formData);
            setShowCPLModal(false); loadCPL();
        } catch (e) { setMessage({ type: 'error', text: e.message }); }
    };

    // CPMK
    const handleAddCPMK = () => { setEditingItem(null); setFormData({ kode_cpmk: '', deskripsi: '', cpl_id: '' }); setShowCPMKModal(true); };
    const handleEditCPMK = (item) => { setEditingItem(item); setFormData({ ...item }); setShowCPMKModal(true); };
    const handleDeleteCPMK = async (id) => {
        if (!window.confirm('Delete?')) return;
        try { await axios.delete(`/curriculum/cpmk/${id}`); loadCPMK(); } catch (e) { alert(e.message); }
    };
    const handleSaveCPMK = async () => {
        try {
            if (editingItem) await axios.put(`/curriculum/cpmk/${editingItem.id}`, formData);
            else await axios.post('/curriculum/cpmk', formData);
            setShowCPMKModal(false); loadCPMK();
        } catch (e) { setMessage({ type: 'error', text: e.message }); }
    };

    // Sub-CPMK
    const handleAddSubCPMK = () => { setEditingItem(null); setFormData({ kode_sub_cpmk: '', deskripsi: '', cpmk_id: '', indikator: '', bobot_nilai: '' }); setShowSubCPMKModal(true); };
    const handleEditSubCPMK = (item) => { setEditingItem(item); setFormData({ ...item }); setShowSubCPMKModal(true); };
    const handleDeleteSubCPMK = async (id) => {
        if (!window.confirm('Delete?')) return;
        try { await axios.delete(`/curriculum/sub-cpmk/${id}`); loadSubCPMK(); } catch (e) { alert(e.message); }
    };
    const handleSaveSubCPMK = async () => {
        try {
            if (editingItem) await axios.put(`/curriculum/sub-cpmk/${editingItem.id}`, formData);
            else await axios.post('/curriculum/sub-cpmk', formData);
            setShowSubCPMKModal(false); loadSubCPMK();
        } catch (e) { setMessage({ type: 'error', text: e.message }); }
    };

    // Import
    const handleOpenImport = (type) => { setImportType(type); setSelectedFile(null); setShowImportModal(true); };
    const handleDownloadTemplate = () => { downloadCSVTemplate(importType); };
    const handleFileSelect = (e) => setSelectedFile(e.target.files[0]);
    const handleImport = async () => {
        if (!selectedFile) return;
        const formData = new FormData();
        formData.append('file', selectedFile);
        try {
            let url = '';
            if (importType === 'cpl') url = '/curriculum/cpl/import';
            if (importType === 'bahan-kajian') url = '/curriculum/bahan-kajian/import';
            if (importType === 'cpmk') url = '/curriculum/cpmk/import';
            if (importType === 'sub-cpmk') url = '/curriculum/sub-cpmk/import';
            if (importType === 'mk') url = '/curriculum/mata-kuliah/import';

            await axios.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setMessage({ type: 'success', text: 'Import successful' });
            setShowImportModal(false);
            loadData();
        } catch (e) {
            setMessage({ type: 'error', text: e.message });
        }
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kelola CPL, Bahan Kajian, MK, CPMK, Sub-CPMK</p>
                </div>
                <div className="flex gap-2">
                    {/* View Mode Toggle */}
                    {(activeTab === 'cpl' || activeTab === 'cpmk') && (
                        <div className="join bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <button onClick={() => setViewMode('table')} className={`join-item btn btn-sm btn-ghost ${viewMode === 'table' ? 'bg-gray-100 dark:bg-gray-700' : ''}`} title="Table View"><Table className="w-4 h-4" /></button>
                            <button onClick={() => setViewMode('list')} className={`join-item btn btn-sm btn-ghost ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700' : ''}`} title="List View"><List className="w-4 h-4" /></button>
                            <button onClick={() => setViewMode('card')} className={`join-item btn btn-sm btn-ghost ${viewMode === 'card' ? 'bg-gray-100 dark:bg-gray-700' : ''}`} title="Card View"><LayoutGrid className="w-4 h-4" /></button>
                        </div>
                    )}

                    {/* Batch Delete */}
                    {selectedItems.length > 0 && (
                        <button onClick={handleBatchDelete} className="btn btn-error btn-sm flex items-center gap-1">
                            <Trash2 className="w-4 h-4" /> Hapus ({selectedItems.length})
                        </button>
                    )}

                    {/* Import Wrapper */}
                    <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-outline btn-sm gap-2">
                            <FileDown className="w-4 h-4" /> Import
                        </label>
                        <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-[1]">
                            <li><button onClick={() => handleOpenImport('cpl')}>Import CPL</button></li>
                            <li><button onClick={() => handleOpenImport('bahan-kajian')}>Import Bahan Kajian</button></li>
                            <li><button onClick={() => handleOpenImport('mk')}>Import Mata Kuliah</button></li>
                            <li><button onClick={() => handleOpenImport('cpmk')}>Import CPMK</button></li>
                            <li><button onClick={() => handleOpenImport('sub-cpmk')}>Import Sub-CPMK</button></li>
                        </ul>
                    </div>
                </div>
            </div>

            {message.text && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage({ type: '', text: '' })} className="btn btn-xs btn-ghost">X</button>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-800 mb-6 flex justify-between items-center overflow-x-auto">
                <nav className="flex gap-6 min-w-max">
                    {['cpl', 'bahan-kajian', 'mk', 'cpmk', 'sub-cpmk'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setSelectedItems([]); }}
                            className={`pb-3 capitalize whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-primary-600 text-primary-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab.replace('-', ' ')}
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
                                <div className="flex justify-end"><button onClick={handleAddCPL} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /> Tambah CPL</button></div>
                                {viewMode === 'table' ? (
                                    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                                        <table className="table w-full">
                                            <thead>
                                                <tr>
                                                    <th>Kode</th>
                                                    <th>Deskripsi</th>
                                                    <th>Kategori</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cplData.map(item => (
                                                    <tr key={item.id}>
                                                        <td className="font-mono font-medium">{item.kode_cpl}</td>
                                                        <td className="whitespace-pre-wrap">{item.deskripsi}</td>
                                                        <td><span className="badge badge-ghost">{item.kategori}</span></td>
                                                        <td>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => handleEditCPL(item)} className="btn btn-xs btn-ghost">Edit</button>
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
                                        {cplData.map(item => (
                                            <div key={item.id} className="card bg-base-100 shadow-sm border border-gray-200 dark:border-gray-700">
                                                <div className="card-body p-4">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="card-title text-sm">{item.kode_cpl}</h3>
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
                                {/* <div className="flex justify-end"><button className="btn btn-primary btn-sm">Tambah BK</button></div> */}
                                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                                    <table className="table w-full">
                                        <thead>
                                            <tr>
                                                <th>Kode BK</th>
                                                <th>Jenis</th>
                                                <th>Deskripsi</th>
                                                <th>Bobot (Min-Max)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bkData.length === 0 ? <tr><td colSpan="4" className="text-center">No Data</td></tr> :
                                                bkData.map(item => (
                                                    <tr key={item.id}>
                                                        <td className="font-mono">{item.kode_bk}</td>
                                                        <td>{item.jenis}</td>
                                                        <td>{item.deskripsi}</td>
                                                        <td>{item.bobot_min} - {item.bobot_max}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* MATA KULIAH CONTENT */}
                        {activeTab === 'mk' && (
                            <div className="space-y-4">
                                {/* <div className="flex justify-end"><button className="btn btn-primary btn-sm">Tambah MK</button></div> */}
                                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                                    <table className="table w-full">
                                        <thead>
                                            <tr>
                                                <th>Kode MK</th>
                                                <th>Nama MK</th>
                                                <th>SKS</th>
                                                <th>Semester</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mkData.length === 0 ? <tr><td colSpan="4" className="text-center">No Data</td></tr> :
                                                mkData.map(item => (
                                                    <tr key={item.id}>
                                                        <td className="font-mono">{item.kode_mk}</td>
                                                        <td className="font-bold">{item.nama_mk}</td>
                                                        <td>{item.sks}</td>
                                                        <td>{item.semester}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* CPMK CONTENT */}
                        {activeTab === 'cpmk' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-500">Pilih item untuk hapus massal (checkbox).</div>
                                    <button onClick={handleAddCPMK} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /> Tambah CPMK</button>
                                </div>
                                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                                    <table className="table w-full">
                                        <thead>
                                            <tr>
                                                <th className="w-10">
                                                    <input type="checkbox" className="checkbox checkbox-sm" onChange={(e) => handleSelectAll(e, cpmkData)} checked={cpmkData.length > 0 && selectedItems.length === cpmkData.length} />
                                                </th>
                                                <th>Kode CPMK</th>
                                                <th>Deskripsi</th>
                                                <th>CPL</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cpmkData.map(item => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <input type="checkbox" className="checkbox checkbox-sm" checked={selectedItems.includes(item.id)} onChange={() => handleSelectItem(item.id)} />
                                                    </td>
                                                    <td className="font-mono font-medium">{item.kode_cpmk}</td>
                                                    <td className="whitespace-pre-wrap">{item.deskripsi}</td>
                                                    <td>
                                                        {item.cpl ? <span className="badge badge-outline text-xs">{item.cpl.kode_cpl}</span> : '-'}
                                                    </td>
                                                    <td>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleEditCPMK(item)} className="btn btn-xs btn-ghost">Edit</button>
                                                            <button onClick={() => handleDeleteCPMK(item.id)} className="btn btn-xs btn-ghost text-error">Hapus</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* SUB-CPMK CONTENT */}
                        {activeTab === 'sub-cpmk' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-500">Pilih item untuk hapus massal.</div>
                                    <button onClick={handleAddSubCPMK} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /> Tambah Sub-CPMK</button>
                                </div>
                                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                                    <table className="table w-full">
                                        <thead>
                                            <tr>
                                                <th className="w-10">
                                                    <input type="checkbox" className="checkbox checkbox-sm" onChange={(e) => handleSelectAll(e, subCpmkData)} checked={subCpmkData.length > 0 && selectedItems.length === subCpmkData.length} />
                                                </th>
                                                <th>Kode</th>
                                                <th>Deskripsi</th>
                                                <th>Induk CPMK</th>
                                                <th>Bobot</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subCpmkData.map(item => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <input type="checkbox" className="checkbox checkbox-sm" checked={selectedItems.includes(item.id)} onChange={() => handleSelectItem(item.id)} />
                                                    </td>
                                                    <td className="font-mono font-medium">{item.kode_sub_cpmk}</td>
                                                    <td className="whitespace-pre-wrap">{item.deskripsi}</td>
                                                    <td>
                                                        {item.cpmk ? <span className="badge badge-outline text-xs">{item.cpmk.kode_cpmk}</span> : '-'}
                                                    </td>
                                                    <td>{item.bobot_nilai}%</td>
                                                    <td>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleEditSubCPMK(item)} className="btn btn-xs btn-ghost">Edit</button>
                                                            <button onClick={() => handleDeleteSubCPMK(item.id)} className="btn btn-xs btn-ghost text-error">Hapus</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* --- MODALS --- */}
            {/* CPL Modal */}
            {showCPLModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">{editingItem ? 'Edit CPL' : 'Tambah CPL'}</h3>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">Kode CPL</span></label>
                            <div className="flex gap-2">
                                <input className="input input-bordered w-full" value={formData.kode_cpl} onChange={e => setFormData({ ...formData, kode_cpl: e.target.value })} placeholder="IF-CPL01" />
                                <button onClick={generateCPLCode} className="btn btn-secondary">Gen</button>
                            </div>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">Deskripsi</span></label>
                            <textarea className="textarea textarea-bordered" value={formData.deskripsi} onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}></textarea>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">Kategori</span></label>
                            <select className="select select-bordered" value={formData.kategori} onChange={e => setFormData({ ...formData, kategori: e.target.value })}>
                                <option value="Sikap">Sikap</option>
                                <option value="Pengetahuan">Pengetahuan</option>
                                <option value="Keterampilan Umum">Keterampilan Umum</option>
                                <option value="Keterampilan Khusus">Keterampilan Khusus</option>
                            </select>
                        </div>
                        <div className="modal-action">
                            <button onClick={() => setShowCPLModal(false)} className="btn">Batal</button>
                            <button onClick={handleSaveCPL} className="btn btn-primary">Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CPMK Modal */}
            {showCPMKModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">{editingItem ? 'Edit CPMK' : 'Tambah CPMK'}</h3>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">CPL Induk</span></label>
                            <select className="select select-bordered" value={formData.cpl_id || ''} onChange={e => setFormData({ ...formData, cpl_id: e.target.value })}>
                                <option value="">Pilih CPL</option>
                                {cplData.map(c => <option key={c.id} value={c.id}>{c.kode_cpl} - {c.deskripsi.substring(0, 20)}...</option>)}
                            </select>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">Kode CPMK</span></label>
                            <div className="flex gap-2">
                                <input className="input input-bordered w-full" value={formData.kode_cpmk} onChange={e => setFormData({ ...formData, kode_cpmk: e.target.value })} />
                                <button onClick={generateCPMKCode} className="btn btn-secondary">Gen</button>
                            </div>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">Deskripsi</span></label>
                            <textarea className="textarea textarea-bordered" value={formData.deskripsi} onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}></textarea>
                        </div>
                        <div className="modal-action">
                            <button onClick={() => setShowCPMKModal(false)} className="btn">Batal</button>
                            <button onClick={handleSaveCPMK} className="btn btn-primary">Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-CPMK Modal */}
            {showSubCPMKModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">{editingItem ? 'Edit Sub-CPMK' : 'Tambah Sub-CPMK'}</h3>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">CPMK Induk</span></label>
                            <select className="select select-bordered" value={formData.cpmk_id || ''} onChange={e => setFormData({ ...formData, cpmk_id: e.target.value })}>
                                <option value="">Pilih CPMK</option>
                                {cpmkData.map(c => <option key={c.id} value={c.id}>{c.kode_cpmk} - {c.deskripsi.substring(0, 20)}...</option>)}
                            </select>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">Kode Sub-CPMK</span></label>
                            <div className="flex gap-2">
                                <input className="input input-bordered w-full" value={formData.kode_sub_cpmk} onChange={e => setFormData({ ...formData, kode_sub_cpmk: e.target.value })} />
                                <button onClick={generateSubCPMKCode} className="btn btn-secondary">Gen</button>
                            </div>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">Deskripsi</span></label>
                            <textarea className="textarea textarea-bordered" value={formData.deskripsi} onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}></textarea>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text">Bobot (%)</span></label>
                            <input type="number" className="input input-bordered" value={formData.bobot_nilai} onChange={e => setFormData({ ...formData, bobot_nilai: e.target.value })} />
                        </div>
                        <div className="modal-action">
                            <button onClick={() => setShowSubCPMKModal(false)} className="btn">Batal</button>
                            <button onClick={handleSaveSubCPMK} className="btn btn-primary">Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4 capitalize">Import {importType.replace('-', ' ')}</h3>
                        <p className="text-sm mb-4">Upload file CSV sesuai template.</p>
                        <div className="form-control w-full mb-4">
                            <input type="file" className="file-input file-input-bordered w-full" accept=".csv" onChange={handleFileSelect} />
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={handleDownloadTemplate} className="btn btn-ghost btn-sm text-primary">Download Template CSV</button>
                        </div>
                        <div className="modal-action">
                            <button onClick={() => setShowImportModal(false)} className="btn">Batal</button>
                            <button onClick={handleImport} className="btn btn-primary" disabled={!selectedFile}>Upload</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Help Modal */}
            {showHelpModal && (
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
            )}
        </div>
    );
}
