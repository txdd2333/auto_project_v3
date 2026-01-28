import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ModulesPage from './pages/ModulesPage'
import WorkflowsPage from './pages/WorkflowsPage'
import WorkflowEditorPage from './pages/WorkflowEditorPage'
import ScenariosPage from './pages/ScenariosPage'
import ScenarioDetailPage from './pages/ScenarioDetailPage'
import SOPLibraryPage from './pages/SOPLibraryPage'
import SOPViewerPage from './pages/SOPViewerPage'
import ExecutionLogsPage from './pages/ExecutionLogsPage'
import AIConfigPage from './pages/AIConfigPage'
import UserManagementPage from './pages/UserManagementPage'
import AccountApprovalPage from './pages/AccountApprovalPage'
import UserSettingsPage from './pages/UserSettingsPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/sop-library" replace />} />
              <Route path="modules" element={<ModulesPage />} />
              <Route path="workflows" element={<WorkflowsPage />} />
              <Route path="workflows/:id" element={<WorkflowEditorPage />} />
              <Route path="scenarios" element={<ScenariosPage />} />
              <Route path="scenarios/:id" element={<ScenarioDetailPage />} />
              <Route path="sop-library" element={<SOPLibraryPage />} />
              <Route path="sop-viewer/:id" element={<SOPViewerPage />} />
              <Route path="logs" element={<ExecutionLogsPage />} />
              <Route path="ai-config" element={<AIConfigPage />} />
              <Route path="admin/users" element={<UserManagementPage />} />
              <Route path="admin/approvals" element={<AccountApprovalPage />} />
              <Route path="settings" element={<UserSettingsPage />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
