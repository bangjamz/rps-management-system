import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import KaprodiDashboard from './pages/KaprodiDashboard';
import DosenDashboard from './pages/DosenDashboard';
import MahasiswaDashboard from './pages/MahasiswaDashboard';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import CurriculumPage from './pages/CurriculumPage';
import CoursesPage from './pages/CoursesPage';
import RPSViewPage from './pages/RPSViewPage';
import RPSVersionsPage from './pages/RPSVersionsPage';
import LecturerAssignmentPage from './pages/LecturerAssignmentPage';
import RPSManagementPage from './pages/RPSManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import DosenCoursesPage from './pages/DosenCoursesPage';
import AssessmentSetupPage from './pages/AssessmentSetupPage';
import GradeInputPage from './pages/GradeInputPage';
import AttendanceMarkingPage from './pages/AttendanceMarkingPage';
import EnrollmentManagementPage from './pages/EnrollmentManagementPage';
import RPSEditorPage from './pages/RPSEditorPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import CPLAnalyticsPage from './pages/CPLAnalyticsPage';
import DataDosenPage from './pages/DataDosenPage';
import KaprodiMKAktifPage from './pages/KaprodiMKAktifPage'; // Add this line
import SuperAdminDashboard from './pages/SuperAdminDashboard'; // Add this line
import GlobalSettingsPage from './pages/GlobalSettingsPage';
import DekanDashboard from './pages/DekanDashboard'; // Add this line
import QADashboard from './pages/QADashboard'; // Add this line
import UserRolesPage from './pages/UserRolesPage';
import OrganizationManagementPage from './pages/OrganizationManagementPage';
import AcademicSettingsPage from './pages/AcademicSettingsPage';
import AdminCoursesPage from './pages/AdminCoursesPage';
import { ROLES } from './utils/permissions';
import useAuthStore from './store/useAuthStore';

// Role-based dashboard router
const Dashboard = () => {
    const { user } = useAuthStore();

    if (!user) return <Navigate to="/login" replace />;

    switch (user.role) {
        case ROLES.KAPRODI:
            return <Navigate to="/kaprodi/dashboard" replace />;
        case ROLES.DOSEN:
            return <Navigate to="/dosen/dashboard" replace />;
        case ROLES.MAHASISWA:
            return <Navigate to="/mahasiswa/dashboard" replace />;
        case 'superadmin':
        case 'admin':
            return <Navigate to="/super-admin" replace />;
        case 'dekan':
            return <Navigate to="/dekan/dashboard" replace />;
        case 'penjaminan_mutu':
            return <Navigate to="/qa/dashboard" replace />;
        default:
            return (
                <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">Role not recognized</h1>
                    <p className="text-gray-500">Contact admin to assign a role to your account.</p>
                </div>
            );
    }
};

import { useEffect } from 'react';
import useGlobalStore from './store/useGlobalStore';

function App() {
    const { fetchSettings } = useGlobalStore();

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return (
        <BrowserRouter>
            <Toaster position="top-right" />
            <Routes>
                {/* Public Routes */}
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <LoginPage />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <PublicRoute>
                            <RegistrationPage />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/verify-email"
                    element={
                        <PublicRoute>
                            <VerifyEmailPage />
                        </PublicRoute>
                    }
                />

                {/* Kaprodi Routes */}
                <Route
                    path="/kaprodi/*"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.KAPRODI]}>
                            <DashboardLayout>
                                <Routes>
                                    <Route path="dashboard" element={<KaprodiDashboard />} />
                                    <Route path="curriculum" element={<CurriculumPage />} />
                                    <Route path="courses" element={<CoursesPage />} />
                                    <Route path="lecturer-assignments" element={<LecturerAssignmentPage />} />
                                    <Route path="mk-aktif" element={<KaprodiMKAktifPage />} />
                                    <Route path="courses/:courseId/enrollment" element={<EnrollmentManagementPage />} />
                                    <Route path="rps/:courseId" element={<RPSVersionsPage />} />
                                    <Route path="rps/view/:rpsId" element={<RPSViewPage />} />
                                    <Route path="rps" element={<RPSManagementPage />} />
                                    <Route path="rps/create" element={<RPSEditorPage />} />
                                    <Route path="rps/:rpsId/edit" element={<RPSEditorPage />} />
                                    <Route path="reports" element={<div className="p-6"><h1 className="text-2xl font-bold">Reports Page (Coming Soon)</h1></div>} />
                                    <Route path="analytics" element={<AnalyticsDashboardPage />} />
                                    <Route path="cpl-analytics" element={<CPLAnalyticsPage />} />
                                    <Route path="data-dosen" element={<DataDosenPage />} />
                                </Routes>
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Dosen Routes */}
                <Route
                    path="/dosen/*"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.DOSEN, ROLES.KAPRODI]}>
                            <DashboardLayout>
                                <Routes>
                                    <Route path="dashboard" element={<DosenDashboard />} />
                                    <Route path="courses" element={<DosenCoursesPage />} />
                                    <Route path="courses/:courseId/assessment-setup" element={<AssessmentSetupPage />} />
                                    <Route path="courses/:courseId/grades" element={<GradeInputPage />} />
                                    <Route path="courses/:courseId/attendance" element={<AttendanceMarkingPage />} />
                                    <Route path="rps" element={<RPSManagementPage />} />
                                    <Route path="rps/:courseId" element={<RPSVersionsPage />} />
                                    <Route path="rps/create" element={<RPSEditorPage />} />
                                    <Route path="rps/:rpsId/edit" element={<RPSEditorPage />} />
                                    <Route path="grades" element={<div className="p-6"><h1 className="text-2xl font-bold">Grades Page (Coming Soon)</h1></div>} />
                                </Routes>
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Mahasiswa Routes */}
                <Route
                    path="/mahasiswa/*"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.MAHASISWA]}>
                            <DashboardLayout>
                                <Routes>
                                    <Route path="dashboard" element={<MahasiswaDashboard />} />
                                    <Route path="schedule" element={<div className="p-6"><h1 className="text-2xl font-bold">Jadwal Kuliah (Coming Soon)</h1></div>} />
                                    <Route path="grades" element={<div className="p-6"><h1 className="text-2xl font-bold">Nilai Semester (Coming Soon)</h1></div>} />
                                </Routes>
                            </DashboardLayout>
                        </ProtectedRoute>
                    }

                />

                {/* Dekan Routes */}
                <Route
                    path="/dekan/*"
                    element={
                        <ProtectedRoute allowedRoles={['dekan']}>
                            <DashboardLayout>
                                <Routes>
                                    <Route path="dashboard" element={<DekanDashboard />} />
                                    <Route path="rps-approval" element={<RPSManagementPage />} />
                                    <Route path="curriculum" element={<CurriculumPage />} />
                                    <Route path="courses" element={<CoursesPage />} />
                                    <Route path="rps-summary" element={<RPSManagementPage />} />
                                    <Route path="rps/view/:rpsId" element={<RPSViewPage />} />
                                </Routes>
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                {/* QA Routes */}
                <Route
                    path="/qa/*"
                    element={
                        <ProtectedRoute allowedRoles={['penjaminan_mutu']}>
                            <DashboardLayout>
                                <Routes>
                                    <Route path="dashboard" element={<QADashboard />} />
                                    <Route path="rps-approval" element={<RPSManagementPage />} />
                                    <Route path="rps-summary" element={<RPSManagementPage />} />
                                    <Route path="rps/view/:rpsId" element={<RPSViewPage />} />
                                </Routes>
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <ProfilePage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile-setup"
                    element={
                        <ProtectedRoute>
                            <ProfileSetupPage />
                        </ProtectedRoute>
                    }
                />

                {/* Settings Route (accessible by all authenticated users) */}
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <SettingsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Unauthorized Page */}
                <Route
                    path="/unauthorized"
                    element={
                        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                            <div className="text-center">
                                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">403</h1>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">Anda tidak memiliki akses ke halaman ini</p>
                                <a href="/login" className="btn btn-primary">
                                    Kembali ke Login
                                </a>
                            </div>
                        </div>
                    }
                />

                {/* Super Admin Routes */}
                <Route path="/super-admin" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><SuperAdminDashboard /></ProtectedRoute>}>
                    <Route index element={<div className="p-8 text-center text-gray-500">Welcome to Super Admin Dashboard. Select an option from the menu.</div>} />
                    <Route path="settings" element={<GlobalSettingsPage />} />
                    <Route path="users" element={<UserManagementPage />} />
                    <Route path="approvals" element={<UserManagementPage />} />
                    <Route path="roles" element={<UserRolesPage />} />
                    <Route path="organization" element={<OrganizationManagementPage />} />
                    <Route path="academic" element={<AcademicSettingsPage />} />
                    <Route path="courses" element={<AdminCoursesPage />} />
                    <Route path="curriculum" element={<CurriculumPage />} />
                </Route>

                {/* Default Redirect */}

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
