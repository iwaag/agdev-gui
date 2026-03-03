import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './shared/components/Layout'
import AGVideoDashboardPage from './features/agvideo/pages/DashboardPage'
import AGVideoGalleryPage from './features/agvideo/pages/GalleryPage'
import AGVideoEditorPage from './features/agvideo/pages/EditorPage'
import AGVideoClipAssetsPage from './features/agvideo/pages/ClipAssetsPage'
import AGVideoSettingsPage from './features/agvideo/pages/SettingsPage'
import AGCoreDashboardPage from './features/agcore/pages/DashboardPage'
import AGCoreBrainMining from './features/agcore/pages/BrainMining'
import AGCodeDashboardPage from './features/agcode/pages/DashboardPage'
import AGCodeSessionPage from './features/agcode/pages/SessionPage'
import LoginPage from './app/pages/LoginPage'
import PrivateRoute from './shared/components/PrivateRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/agcore" replace />} />
      <Route
        path="/agvideo"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<AGVideoDashboardPage />} />
        <Route path="gallery" element={<AGVideoGalleryPage />} />
        <Route path="editor" element={<AGVideoEditorPage />} />
        <Route path="clip-assets" element={<AGVideoClipAssetsPage />} />
        <Route path="settings" element={<AGVideoSettingsPage />} />
      </Route>
      <Route
        path="/agcore"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<AGCoreDashboardPage />} />
        <Route path="brain-mining" element={<AGCoreBrainMining />} />
      </Route>
      <Route
        path="/agcode"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<AGCodeDashboardPage />} />
        <Route path="session" element={<AGCodeSessionPage />} />
      </Route>
    </Routes>
  )
}

export default App
