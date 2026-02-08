import { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';
import {
    Users, UserCheck, UserX, Search, Filter, MoreVertical,
    Shield, Check, X, ChevronRight, Loader, Key, Upload, ArrowUpDown, Trash2, CheckSquare, Square, LogIn, Pencil
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function UserManagementPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { startImpersonation, user: currentUser } = useAuthStore();
    const isApprovalsPage = location.pathname.includes('approvals');

    const [activeTab, setActiveTab] = useState(isApprovalsPage ? 'pending' : 'all'); // 'all' or 'pending'
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [selectedRole, setSelectedRole] = useState('all'); // Added state

    // Role Editing State
    const [editingUser, setEditingUser] = useState(null);
    const [newRole, setNewRole] = useState('');
    const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
    const [error, setError] = useState(null);

    // Add User State
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [newUserFormData, setNewUserFormData] = useState({
        nama_lengkap: '',
        email: '',
        username: '',
        password: '',
        role: 'mahasiswa'
    });

    // Password Reset State
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resettingUser, setResettingUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    // Sort State
    const [sortField, setSortField] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

    // Selection State
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Action Dropdown State
    const [openActionId, setOpenActionId] = useState(null);

    // CSV Import State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [importing, setImporting] = useState(false);

    // For processing actions
    const [processingId, setProcessingId] = useState(null);

    // Dropdown positioning - using fixed position and coordinates
    const [dropdownPosition, setDropdownPosition] = useState('bottom');
    const [dropdownStyle, setDropdownStyle] = useState({});

    // Close dropdown when clicking outside (using data attributes for reliability)
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Don't close if clicking on inputs, selects, or action menu elements
            const target = event.target;
            const isInput = target.tagName === 'INPUT' || target.tagName === 'SELECT';
            const isActionMenu = target.closest('[data-action-menu]');
            const isActionButton = target.closest('[data-action-button]');

            if (!isInput && !isActionMenu && !isActionButton) {
                setOpenActionId(null);
            }
        };
        if (openActionId) {
            // Use setTimeout to avoid immediate closing on the same click
            const timer = setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 0);
            return () => {
                clearTimeout(timer);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [openActionId]);

    // Smart positioning for dropdown with fixed coordinates
    const handleActionClick = useCallback((userId, event) => {
        event.stopPropagation();
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const menuHeight = 200;
        const spaceBelow = window.innerHeight - rect.bottom;
        const showAbove = spaceBelow < menuHeight;

        // Calculate fixed position
        const style = {
            position: 'fixed',
            right: `${window.innerWidth - rect.right}px`,
            zIndex: 9999,
        };

        if (showAbove) {
            style.bottom = `${window.innerHeight - rect.top + 4}px`;
        } else {
            style.top = `${rect.bottom + 4}px`;
        }

        setDropdownStyle(style);
        setDropdownPosition(showAbove ? 'top' : 'bottom');
        setOpenActionId(openActionId === userId ? null : userId);
    }, [openActionId]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'pending' ? '/users/pending' : '/users';
            const response = await axios.get(endpoint);
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            const msg = 'Failed to fetch users.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    const handleApprove = async (userId) => {
        if (!window.confirm('Are you sure you want to approve this user?')) return;
        setProcessingId(userId);
        try {
            await axios.post(`/users/${userId}/approve`);
            // Refresh list
            fetchUsers();

        } catch (error) {
            toast.error('Failed to approve user');
            setError('Failed to approve user.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (userId) => {
        if (!window.confirm('Are you sure you want to reject this user?')) return;
        setProcessingId(userId); // Added processingId for reject
        try {
            await axios.post(`/users/${userId}/reject`); // Changed endpoint
            fetchUsers();
        } catch (error) {
            console.error('Error rejecting user:', error);
            const msg = 'Failed to reject user';
            setError(msg);
            toast.error(msg);
        } finally {
            setProcessingId(null); // Added processingId for reject
        }
    };

    const openEditRoleModal = (user) => {
        setEditingUser(user);
        setNewRole(user.role);
        setIsEditRoleModalOpen(true);
    };

    const handleUpdateRole = async () => {
        if (!editingUser || !newRole) return;
        setProcessingId(editingUser.id);
        try {
            await axios.put(`/users/${editingUser.id}`, {
                ...editingUser, // Includes nama_lengkap, email, username, angkatan
                role: newRole
            });
            setIsEditRoleModalOpen(false);
            setEditingUser(null);
            fetchUsers();
            toast.success('User updated successfully');
        } catch (error) {
            console.error('Error updating user:', error);
            const msg = error.response?.data?.message || 'Failed to update user';
            setError(msg);
            toast.error(msg);
        } finally {
            setProcessingId(null);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!resettingUser || !newPassword) return;
        setProcessingId(resettingUser.id);
        try {
            await axios.post(`/users/${resettingUser.id}/reset-password`, { newPassword });
            toast.success(`Password for ${resettingUser.nama_lengkap} has been reset`);
            setIsResetModalOpen(false);
            setNewPassword('');
            setResettingUser(null);
        } catch (error) {
            console.error('Error resetting password:', error);
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setProcessingId(null);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/users', newUserFormData);
            setIsAddUserModalOpen(false);
            setNewUserFormData({
                nama_lengkap: '',
                email: '',
                username: '',
                password: '',
                role: 'mahasiswa'
            });
            setActiveTab('all'); // Switch to 'all' tab to see the new user
            toast.success('User created successfully');
            // We need to fetch 'all' users, so if activeTab was 'pending', the useEffect will trigger.
            // But since we just set state, we might need to manually trigger if it was already 'all'.
            if (activeTab === 'all') {
                fetchUsers();
            }
        } catch (error) {
            console.error('Error creating user:', error);
            const msg = error.response?.data?.message || 'Failed to create user';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter ? user.role === roleFilter : true;
        return matchesSearch && matchesRole;
    });

    // Sorted users
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        if (sortField === 'created_at') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        }
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === sortedUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(sortedUsers.map(u => u.id));
        }
    };

    const toggleSelectUser = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUsers.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) return;
        // Placeholder - implement actual bulk delete
        toast.error('Bulk delete not yet implemented on backend');
    };

    const downloadCsvTemplate = () => {
        const template = 'nama_lengkap,email,username,role\nJohn Doe,john@example.com,johndoe,dosen\nJane Smith,jane@example.com,janesmith,mahasiswa';
        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'user_import_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleImportCSV = async (e) => {
        e.preventDefault();
        if (!csvFile) return;
        setImporting(true);
        const formData = new FormData();
        formData.append('file', csvFile);
        try {
            const res = await axios.post('/users/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(`Imported ${res.data.count || 0} users successfully`);
            setIsImportModalOpen(false);
            setCsvFile(null);
            fetchUsers();
        } catch (error) {
            console.error('Import error:', error);
            toast.error(error.response?.data?.message || 'Failed to import users');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage system users, roles, and approvals.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="btn btn-outline flex items-center gap-2"
                    >
                        <Upload className="w-4 h-4" /> Import CSV
                    </button>
                    <button
                        onClick={() => setIsAddUserModalOpen(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Users className="w-4 h-4" /> Add User
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'all'
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        All Users
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'pending'
                            ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <UserCheck className="w-4 h-4" />
                        Pending Approvals
                        {activeTab !== 'pending' && (
                            <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-xs">
                                ?
                            </span>
                        )}
                    </button>
                </nav>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users by name, email, or username..."
                        className="input pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="input w-full sm:w-48"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="">All Roles</option>
                    <option value="mahasiswa">Mahasiswa</option>
                    <option value="dosen">Dosen</option>
                    <option value="kaprodi">Kaprodi</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            {/* Bulk Action Bar */}
            {selectedUsers.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {selectedUsers.length} user(s) selected
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedUsers([])}
                            className="btn btn-sm btn-outline"
                        >
                            Clear Selection
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="btn btn-sm bg-red-100 text-red-600 hover:bg-red-200 border-red-200 flex items-center gap-1"
                        >
                            <Trash2 className="w-4 h-4" /> Delete Selected
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="px-4 py-4 w-12">
                                    <button onClick={toggleSelectAll} className="p-1 hover:bg-gray-200 rounded">
                                        {selectedUsers.length === sortedUsers.length && sortedUsers.length > 0 ? (
                                            <CheckSquare className="w-5 h-5 text-primary-600" />
                                        ) : (
                                            <Square className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-gray-700" onClick={() => toggleSort('nama_lengkap')}>
                                    <span className="flex items-center gap-1">
                                        User Info
                                        <ArrowUpDown className="w-3 h-3" />
                                    </span>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-gray-700" onClick={() => toggleSort('username')}>
                                    <span className="flex items-center gap-1">
                                        Username
                                        <ArrowUpDown className="w-3 h-3" />
                                    </span>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-gray-700" onClick={() => toggleSort('role')}>
                                    <span className="flex items-center gap-1">
                                        Role
                                        <ArrowUpDown className="w-3 h-3" />
                                    </span>
                                </th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 cursor-pointer hover:text-gray-700" onClick={() => toggleSort('created_at')}>
                                    <span className="flex items-center gap-1">
                                        Joined
                                        <ArrowUpDown className="w-3 h-3" />
                                    </span>
                                </th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader className="w-5 h-5 animate-spin" />
                                            Loading users...
                                        </div>
                                    </td>
                                </tr>
                            ) : sortedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                sortedUsers.map((user) => (
                                    <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${selectedUsers.includes(user.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                                        <td className="px-4 py-4">
                                            <button onClick={() => toggleSelectUser(user.id)} className="p-1 hover:bg-gray-200 rounded">
                                                {selectedUsers.includes(user.id) ? (
                                                    <CheckSquare className="w-5 h-5 text-primary-600" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-gray-400" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg">
                                                    {user.nama_lengkap?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {user.nama_lengkap}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono text-gray-700 dark:text-gray-300">
                                                {user.username}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                ${user.role === 'superadmin' ? 'bg-purple-100 text-purple-700 border-purple-200' : ''}
                                                ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : ''}
                                                ${user.role === 'dosen' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
                                                ${user.role === 'mahasiswa' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                                            `}>
                                                {user.role}
                                            </span>
                                            {user.role === 'mahasiswa' && user.angkatan && (
                                                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                                    {user.angkatan}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex w-fit items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                                                    ${user.status === 'active' || user.status === 'approved' ? 'bg-green-100 text-green-700' : ''}
                                                    ${user.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                                                    ${user.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
                                                `}>
                                                    {user.status}
                                                </span>
                                                {user.email_verified ? (
                                                    <span className="text-[10px] text-green-600 flex items-center gap-1">
                                                        <Check className="w-3 h-3" /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-amber-600 flex items-center gap-1">
                                                        Wait Verification
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {activeTab === 'pending' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleApprove(user.id)}
                                                        disabled={processingId === user.id}
                                                        className="btn btn-sm bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                                                        title="Approve User"
                                                    >
                                                        {processingId === user.id ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(user.id)}
                                                        disabled={processingId === user.id}
                                                        className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                                        title="Reject User"
                                                    >
                                                        {processingId === user.id ? <Loader className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setResettingUser(user);
                                                            setIsResetModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200"
                                                        title="Reset Password"
                                                    >
                                                        <Key className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditRoleModal(user)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                                        title="Edit User"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <div className="relative">
                                                        <button
                                                            data-action-button
                                                            onClick={(e) => handleActionClick(user.id, e)}
                                                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                        {openActionId === user.id && (
                                                            <div
                                                                data-action-menu
                                                                style={dropdownStyle}
                                                                className="w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
                                                            >
                                                                <button
                                                                    onClick={() => {
                                                                        setResettingUser(user);
                                                                        setIsResetModalOpen(true);
                                                                        setOpenActionId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                                >
                                                                    <Key className="w-4 h-4" /> Reset Password
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        openEditRoleModal(user);
                                                                        setOpenActionId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                                >
                                                                    <Shield className="w-4 h-4" /> Change Role
                                                                </button>
                                                                {currentUser?.role === 'superadmin' && user.role !== 'superadmin' && (
                                                                    <button
                                                                        onClick={async () => {
                                                                            try {
                                                                                const res = await axios.post(`/auth/impersonate/${user.id}`);
                                                                                startImpersonation(res.data.user, res.data.token, res.data.adminRestoreToken);
                                                                                toast.success(`Now logged in as ${user.nama_lengkap}`);
                                                                                // Navigate to appropriate dashboard
                                                                                const dashboardRoutes = {
                                                                                    kaprodi: '/kaprodi/dashboard',
                                                                                    dosen: '/dosen/dashboard',
                                                                                    mahasiswa: '/mahasiswa/dashboard',
                                                                                    admin: '/super-admin',
                                                                                    dekan: '/dekan/dashboard'
                                                                                };
                                                                                navigate(dashboardRoutes[user.role] || '/dashboard');
                                                                            } catch (err) {
                                                                                toast.error('Failed to impersonate user');
                                                                            }
                                                                            setOpenActionId(null);
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-2"
                                                                    >
                                                                        <LogIn className="w-4 h-4" /> Login As
                                                                    </button>
                                                                )}
                                                                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                                                <button
                                                                    onClick={() => setOpenActionId(null)}
                                                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                                                >
                                                                    <Trash2 className="w-4 h-4" /> Delete User
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit User Modal */}
            {
                isEditRoleModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Edit User: {editingUser?.nama_lengkap}
                                </h3>
                                <button onClick={() => setIsEditRoleModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={editingUser.nama_lengkap || ''}
                                        onChange={(e) => setEditingUser({ ...editingUser, nama_lengkap: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                        <input
                                            type="email"
                                            className="input w-full"
                                            value={editingUser.email || ''}
                                            onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                                        <input
                                            type="text"
                                            className="input w-full"
                                            value={editingUser.username || ''}
                                            onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                        <select
                                            className="input w-full"
                                            value={newRole}
                                            onChange={(e) => setNewRole(e.target.value)}
                                        >
                                            <option value="mahasiswa">Mahasiswa</option>
                                            <option value="dosen">Dosen</option>
                                            <option value="kaprodi">Kaprodi</option>
                                            <option value="dekan">Dekan</option>
                                            <option value="admin">Admin</option>
                                            <option value="superadmin">Super Admin</option>
                                        </select>
                                    </div>
                                    {newRole === 'mahasiswa' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Angkatan</label>
                                            <input
                                                type="text"
                                                className="input w-full"
                                                placeholder="e.g. 2023"
                                                value={editingUser.angkatan || ''}
                                                onChange={(e) => setEditingUser({ ...editingUser, angkatan: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => setIsEditRoleModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateRole} // We'll update this function next
                                    disabled={processingId === editingUser?.id}
                                    className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center gap-2"
                                >
                                    {processingId === editingUser?.id ? <Loader className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add User Modal */}
            {
                isAddUserModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New User</h3>
                                <button onClick={() => setIsAddUserModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAddUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="input w-full"
                                        value={newUserFormData.nama_lengkap}
                                        onChange={e => setNewUserFormData({ ...newUserFormData, nama_lengkap: e.target.value })}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            className="input w-full"
                                            value={newUserFormData.email}
                                            onChange={e => setNewUserFormData({ ...newUserFormData, email: e.target.value })}
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                                        <input
                                            type="text"
                                            className="input w-full"
                                            value={newUserFormData.username}
                                            onChange={e => setNewUserFormData({ ...newUserFormData, username: e.target.value })}
                                            placeholder="(Optional)"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                        <input
                                            type="password"
                                            required
                                            className="input w-full"
                                            value={newUserFormData.password}
                                            onChange={e => setNewUserFormData({ ...newUserFormData, password: e.target.value })}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                        <select
                                            className="input w-full"
                                            value={newUserFormData.role}
                                            onChange={e => setNewUserFormData({ ...newUserFormData, role: e.target.value })}
                                        >
                                            <option value="mahasiswa">Mahasiswa</option>
                                            <option value="dosen">Dosen</option>
                                            <option value="kaprodi">Kaprodi</option>
                                            <option value="admin">Admin</option>
                                            <option value="superadmin">Super Admin</option>
                                        </select>
                                    </div>
                                    {newUserFormData.role === 'mahasiswa' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Angkatan</label>
                                            <input
                                                type="text"
                                                className="input w-full"
                                                placeholder="e.g. 2023"
                                                value={newUserFormData.angkatan || ''}
                                                onChange={e => setNewUserFormData({ ...newUserFormData, angkatan: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddUserModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center gap-2"
                                    >
                                        {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Reset Password Modal */}
            {
                isResetModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Reset Password
                                </h3>
                                <button onClick={() => setIsResetModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 mb-6 font-medium">
                                Set a new password for <span className="text-gray-900 dark:text-white font-bold">{resettingUser?.nama_lengkap}</span>
                            </p>

                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        className="input w-full"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter at least 6 characters"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsResetModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processingId === resettingUser?.id}
                                        className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 flex items-center gap-2"
                                    >
                                        {processingId === resettingUser?.id ? <Loader className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                        Reset Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* CSV Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[450px] shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Import Users from CSV
                            </h3>
                            <button onClick={() => setIsImportModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2 font-medium">CSV Format:</p>
                            <code className="text-xs bg-white dark:bg-gray-700 p-2 rounded block font-mono text-gray-700 dark:text-gray-300">
                                nama_lengkap,email,username,role
                            </code>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                Passwords will be auto-generated. Users will receive email to set their password.
                            </p>
                            <button
                                type="button"
                                onClick={downloadCsvTemplate}
                                className="mt-2 text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800 flex items-center gap-1"
                            >
                                📥 Download Template CSV
                            </button>
                        </div>

                        <form onSubmit={handleImportCSV} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Select CSV File
                                </label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    required
                                    className="input w-full"
                                    onChange={(e) => setCsvFile(e.target.files[0])}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsImportModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={importing || !csvFile}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                                >
                                    {importing ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    Import Users
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
}
