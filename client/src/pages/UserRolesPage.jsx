import React, { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';
import { Shield, Plus, Edit2, Trash2, X, Check, Loader, Copy, Info } from 'lucide-react';

const SYSTEM_ROLES = [
    { id: 'superadmin', name: 'Super Admin', description: 'Full access to all system features.', isSystem: true, permissions: ['all'] },
    { id: 'admin', name: 'Admin', description: 'Administrative access with some restrictions.', isSystem: true, permissions: ['users.manage', 'content.manage'] },
    { id: 'dekan', name: 'Dekan', description: 'Faculty level management.', isSystem: true, permissions: ['faculty.view', 'reports.view'] },
    { id: 'kaprodi', name: 'Kaprodi', description: 'Program study management.', isSystem: true, permissions: ['prodi.manage', 'curriculum.manage'] },
    { id: 'dosen', name: 'Dosen', description: 'Lecturer access.', isSystem: true, permissions: ['courses.view', 'grades.manage'] },
    { id: 'mahasiswa', name: 'Mahasiswa', description: 'Student access.', isSystem: true, permissions: ['courses.view', 'grades.view'] },
];

const UserRolesPage = () => {
    const [activeTab, setActiveTab] = useState('system'); // 'system' or 'custom'
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', permissions: [] });
    const [saving, setSaving] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

    // Available permissions (Mock list - can be expanded)
    const availablePermissions = [
        { id: 'users.view', label: 'View Users' },
        { id: 'users.edit', label: 'Edit Users' },
        { id: 'roles.manage', label: 'Manage Roles' },
        { id: 'settings.view', label: 'View Settings' },
        { id: 'settings.edit', label: 'Edit Settings' },
        { id: 'curriculum.manage', label: 'Manage Curriculum' },
        { id: 'courses.view', label: 'View Courses' },
        { id: 'reports.view', label: 'View Reports' },
    ];

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await axios.get('/admin/roles');
            setRoles(response.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
            toast.error('Failed to load roles');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (role = null, copyFromSystem = false) => {
        setIsCopying(copyFromSystem);
        if (role) {
            setEditingRole(copyFromSystem ? null : role); // If copying, we are creating new
            setFormData({
                name: copyFromSystem ? `${role.name} Custom 01` : role.name,
                description: copyFromSystem ? `Custom version of ${role.name}` : (role.description || ''),
                permissions: role.permissions || []
            });
        } else {
            setEditingRole(null);
            setFormData({ name: '', description: '', permissions: [] });
        }
        setIsModalOpen(true);
    };

    const handlePermissionToggle = (permId) => {
        setFormData(prev => {
            const permissions = prev.permissions.includes(permId)
                ? prev.permissions.filter(p => p !== permId)
                : [...prev.permissions, permId];
            return { ...prev, permissions };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingRole) {
                await axios.put(`/admin/roles/${editingRole.id}`, formData);
                toast.success('Role updated successfully');
            } else {
                await axios.post('/admin/roles', formData);
                toast.success(isCopying ? 'Custom role created from default' : 'Role created successfully');
            }
            setIsModalOpen(false);
            fetchRoles();
            if (isCopying) setActiveTab('custom'); // Switch to custom tab to see new role
        } catch (error) {
            console.error('Error saving role:', error);
            toast.error(error.response?.data?.message || 'Failed to save role');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this role?')) return;
        try {
            await axios.delete(`/admin/roles/${id}`);
            toast.success('Role deleted successfully');
            fetchRoles();
        } catch (error) {
            console.error('Error deleting role:', error);
            toast.error('Failed to delete role');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Peran Pengguna</h1>
                    <p className="text-gray-500 dark:text-gray-400">Kelola akses dan izin pengguna dalam sistem.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Tambah Peran Khusus
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('system')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'system'
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    Peran Sistem (Default)
                </button>
                <button
                    onClick={() => setActiveTab('custom')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'custom'
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    Peran Khusus (Custom)
                </button>
            </div>

            {/* System Roles Tab */}
            {activeTab === 'system' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {SYSTEM_ROLES.map(role => (
                        <div key={role.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 opacity-90 hover:opacity-100 transition-opacity">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">System Default</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleOpenModal(role, true)} // Copy on write
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Customize this role"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 h-10 overflow-hidden text-ellipsis">
                                {role.description}
                            </p>
                            <div className="flex bg-blue-50 dark:bg-blue-900/10 p-2 rounded text-xs text-blue-700 dark:text-blue-300 items-start gap-2">
                                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                <p>Peran ini adalah bawaan sistem dan tidak dapat diubah langsung. Klik ikon copy untuk membuat versi custom.</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Custom Roles Tab */}
            {activeTab === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {loading ? (
                        <div className="col-span-full p-8 text-center">Loading custom roles...</div>
                    ) : roles.length === 0 ? (
                        <div className="col-span-full p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Belum ada Peran Khusus</h3>
                            <p className="text-gray-500 mb-4">Buat peran baru atau kustomisasi peran sistem yang ada.</p>
                            <button
                                onClick={() => handleOpenModal()}
                                className="btn btn-primary btn-sm"
                            >
                                Buat Peran Baru
                            </button>
                        </div>
                    ) : (
                        roles.map(role => (
                            <div key={role.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 group hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                                            <p className="text-xs text-gray-500">Created by {role.creator?.nama_lengkap || 'Admin'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleOpenModal(role)}
                                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(role.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 h-10 overflow-hidden text-ellipsis line-clamp-2">
                                    {role.description || 'Tidak ada deskripsi.'}
                                </p>
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Permissions</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {role.permissions && role.permissions.length > 0 ? (
                                            role.permissions.slice(0, 3).map(p => (
                                                <span key={p} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] rounded-full">
                                                    {p}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">No permissions</span>
                                        )}
                                        {role.permissions && role.permissions.length > 3 && (
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 text-[10px] rounded-full">
                                                +{role.permissions.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-[500px] shadow-2xl max-h-[90vh] overflow-y-auto transform scale-100 transition-transform">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {editingRole ? 'Edit Peran' : 'Buat Peran Baru'}
                                    {isCopying && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Copying</span>}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {isCopying ? 'Mumbuat salinan dari peran sistem.' : 'Konfigurasi detil peran dan izin.'}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Peran</label>
                                <input
                                    type="text"
                                    required
                                    className="input w-full"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: Auditor Keuangan"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
                                <textarea
                                    className="input w-full h-24 resize-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Jelaskan tanggung jawab dan wewenang peran ini..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Izin Akses (Permissions)</label>
                                <div className="space-y-1 border border-gray-200 dark:border-gray-700 rounded-lg max-h-48 overflow-y-auto p-1 bg-gray-50 dark:bg-gray-900/50">
                                    {availablePermissions.map(perm => (
                                        <label key={perm.id} className="flex items-center gap-3 cursor-pointer hover:bg-white dark:hover:bg-gray-800 p-2 rounded transition-colors group">
                                            <input
                                                type="checkbox"
                                                checked={formData.permissions.includes(perm.id)}
                                                onChange={() => handlePermissionToggle(perm.id)}
                                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white font-medium">{perm.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 font-medium shadow-sm"
                                >
                                    {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Simpan Peran
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserRolesPage;
