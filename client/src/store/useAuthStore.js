import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import axios from '../lib/axios';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            // Check Auth & Refresh Data
            checkAuth: async () => {
                const token = get().token;
                if (!token) return;

                try {
                    const response = await axios.get('/auth/profile');
                    set({
                        user: { ...get().user, ...response.data.user },
                        isAuthenticated: true
                    });
                } catch (error) {
                    console.error('Check auth failed:', error);
                    // If 401, maybe logout? But let's be careful not to loop.
                    if (error.response?.status === 401) {
                        set({ user: null, token: null, isAuthenticated: false });
                    }
                }
            },

            // Multi-role support
            activeRole: null, // Currently active role (can differ from primary role)

            // Impersonation support
            isImpersonating: false,
            adminRestoreToken: null,
            originalAdminId: null,
            originalAdminName: null,

            setAuth: (user, token) => set({
                user,
                token,
                isAuthenticated: true,
                activeRole: user.activeRole || user.role,
                isImpersonating: user.isImpersonated || false,
                originalAdminId: user.originalAdminId || null,
                originalAdminName: user.originalAdminName || null
            }),

            logout: () => set({
                user: null,
                token: null,
                isAuthenticated: false,
                activeRole: null,
                isImpersonating: false,
                adminRestoreToken: null,
                originalAdminId: null,
                originalAdminName: null
            }),

            updateUser: (userData) => set((state) => ({
                user: { ...state.user, ...userData }
            })),

            // Set active role when switching
            setActiveRole: (role, newToken) => set((state) => ({
                activeRole: role,
                token: newToken || state.token,
                user: { ...state.user, activeRole: role }
            })),

            // Start impersonation session
            startImpersonation: (user, token, adminRestoreToken) => set({
                user,
                token,
                isAuthenticated: true,
                activeRole: user.role,
                isImpersonating: true,
                adminRestoreToken,
                originalAdminId: user.originalAdminId,
                originalAdminName: user.originalAdminName
            }),

            // End impersonation and restore admin session
            endImpersonation: (adminUser, adminToken) => set({
                user: adminUser,
                token: adminToken,
                isAuthenticated: true,
                activeRole: adminUser.role,
                isImpersonating: false,
                adminRestoreToken: null,
                originalAdminId: null,
                originalAdminName: null
            }),

            // Helper getters for organizational context
            getInstitusi: () => get().user?.institusi,
            getFakultas: () => get().user?.fakultas,
            getProdi: () => get().user?.prodi,
            getActiveRole: () => get().activeRole || get().user?.role,
            getAvailableRoles: () => get().user?.available_roles || [get().user?.role],

            // Permission helpers using activeRole
            hasRole: (...roles) => {
                const role = get().activeRole || get().user?.role;
                return role && roles.includes(role);
            },

            isAdminInstitusi: () => {
                const role = get().activeRole || get().user?.role;
                return role === 'admin_institusi' || role === 'admin';
            },
            isSuperAdmin: () => {
                const role = get().activeRole || get().user?.role;
                return role === 'superadmin';
            },
            isDekan: () => (get().activeRole || get().user?.role) === 'dekan',
            isKaprodi: () => (get().activeRole || get().user?.role) === 'kaprodi',
            isDosen: () => (get().activeRole || get().user?.role) === 'dosen',
            isMahasiswa: () => (get().activeRole || get().user?.role) === 'mahasiswa',

            // Check if user can switch roles
            canSwitchRoles: () => {
                const availableRoles = get().user?.available_roles;
                return availableRoles && availableRoles.length > 1;
            },

            // Organization access helpers
            canManageProdi: (prodiId) => {
                const user = get().user;
                const activeRole = get().activeRole || user?.role;
                if (!user) return false;
                if (activeRole === 'superadmin' || activeRole === 'admin' || activeRole === 'admin_institusi') return true;
                if (activeRole === 'dekan') {
                    return user.fakultas_id && prodiId;
                }
                if (activeRole === 'kaprodi') {
                    return user.prodi_id === prodiId;
                }
                return false;
            },

            canAssignLecturers: () => {
                const role = get().activeRole || get().user?.role;
                return role === 'kaprodi' || role === 'dekan' || role === 'superadmin' || role === 'admin';
            },

            canApproveRPS: () => {
                const role = get().activeRole || get().user?.role;
                return role === 'kaprodi' || role === 'dekan' || role === 'superadmin' || role === 'admin';
            },

            // Hydration state
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state })
        }),
        {
            name: 'rps-auth-storage',
            onRehydrateStorage: () => (state) => {
                state.setHasHydrated(true);
            }
        }
    )
);

export default useAuthStore;

