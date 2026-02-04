import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/LoginPage';
import KaprodiDashboard from './pages/KaprodiDashboard';
import DosenDashboard from './pages/DosenDashboard';
import SettingsPage from './pages/SettingsPage';
import CurriculumPage from './pages/CurriculumPage';
import CoursesPage from './pages/CoursesPage';
import RPSViewPage from './pages/RPSViewPage';
import LecturerAssignmentPage from './pages/LecturerAssignmentPage';
import RPSManagementPage from './pages/RPSManagementPage';
import AssessmentSetupPage from './pages/AssessmentSetupPage';
import GradeInputPage from './pages/GradeInputPage';
import AttendanceMarkingPage from './pages/AttendanceMarkingPage';
import EnrollmentManagementPage from './pages/EnrollmentManagementPage';
import RPSEditorPage from './pages/RPSEditorPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import { ROLES } from './utils/permissions';

function App() {
    return (
        <BrowserRouter>
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
                                    <Route path="courses/:courseId/enrollment" element={<EnrollmentManagementPage />} />
                                    <Route path="rps/:courseId" element={<RPSViewPage />} />
                                    <Route path="rps" element={<RPSManagementPage />} />
                                    <Route path="rps/create" element={<RPSEditorPage />} />
                                    <Route path="rps/:rpsId/edit" element={<RPSEditorPage />} />
                                    <Route path="reports" element={<div className="p-6"><h1 className="text-2xl font-bold">Reports Page (Coming Soon)</h1></div>} />
                                    <Route path="analytics" element={<AnalyticsDashboardPage />} />
                                </Routes>
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Dosen Routes */}
                <Route
                    path="/dosen/*"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.DOSEN]}>
                            <DashboardLayout>
                                <Routes>
                                    <Route path="dashboard" element={<DosenDashboard />} />
                                    <Route path="courses" element={<div className="p-6"><h1 className="text-2xl font-bold">My Courses Page (Coming Soon)</h1></div>} />
                                    <Route path="courses/:courseId/assessment-setup" element={<AssessmentSetupPage />} />
                                    <Route path="courses/:courseId/grades" element={<GradeInputPage />} />
                                    <Route path="courses/:courseId/attendance" element={<AttendanceMarkingPage />} />
                                    <Route path="rps" element={<div className="p-6"><h1 className="text-2xl font-bold">My RPS Page (Coming Soon)</h1></div>} />
                                    <Route path="grades" element={<div className="p-6"><h1 className="text-2xl font-bold">Grades Page (Coming Soon)</h1></div>} />
                                </Routes>
                            </DashboardLayout>
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

                {/* Default Redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
