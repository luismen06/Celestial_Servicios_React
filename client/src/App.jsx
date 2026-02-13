// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

// Imports de Páginas
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventarioPage from './pages/InventarioPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import RecetasPage from './pages/RecetasPage';
import ProduccionPage from './pages/ProduccionPage';
import ComprasPage from './pages/ComprasPage';
import ReportesPage from './pages/ReportesPage';
import SalidasPage from './pages/SalidasPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas protegidas */}
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="flex min-h-screen bg-gray-100">
                <Sidebar />
                <div className="ml-64 w-full">
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/salidas" element={<SalidasPage />} />
                    <Route path="/inventario" element={<InventarioPage />} />
                    <Route path="/configuracion" element={<ConfiguracionPage />} />
                    <Route path="/recetas" element={<RecetasPage />} />
                    <Route path="/produccion" element={<ProduccionPage />} />
                    <Route path="/compras" element={<ComprasPage />} />
                    <Route path="/reportes" element={<ReportesPage />} />
                  </Routes>
                </div>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;