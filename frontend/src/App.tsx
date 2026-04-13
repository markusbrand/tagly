import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppearanceProvider } from './context/AppearanceContext';
import AppShell from './components/Layout/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import Scanner from './pages/Scanner';
import AssetOnboarding from './pages/AssetOnboarding';
import AssetBorrow from './pages/AssetBorrow';
import AssetReturn from './pages/AssetReturn';
import QRGenerate from './pages/QRGenerate';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import AdminLayout from './pages/admin/AdminLayout';
import CustomFields from './pages/admin/CustomFields';
import StickerTemplates from './pages/admin/StickerTemplates';
import UserManagement from './pages/admin/UserManagement';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppearanceProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="assets" element={<Assets />} />
                <Route path="assets/:id" element={<AssetDetail />} />
                <Route path="scanner" element={<Scanner />} />
                <Route path="scanner/onboard/:guid" element={<AssetOnboarding />} />
                <Route path="scanner/borrow/:id" element={<AssetBorrow />} />
                <Route path="scanner/return/:id" element={<AssetReturn />} />
                <Route path="qr-generate" element={<QRGenerate />} />

                <Route element={<ProtectedRoute adminOnly />}>
                  <Route path="admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="custom-fields" replace />} />
                    <Route path="custom-fields" element={<CustomFields />} />
                    <Route path="sticker-templates" element={<StickerTemplates />} />
                    <Route path="users" element={<UserManagement />} />
                  </Route>
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </AppearanceProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
