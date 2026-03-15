import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import LiveTracking from './pages/LiveTracking';
import RegisterVehicle from './pages/RegisterVehicle';
import Alerts from './pages/Alerts';
import History from './pages/History';
import Geofences from './pages/Geofences';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import TransferManagement from './pages/TransferManagement';
import KeyExchange from './pages/KeyExchange';
import SafeRoute from './pages/SafeRoute';
import ControlCenter from './pages/ControlCenter';
import Navbar from './components/Navbar';
import { VehicleProvider } from './context/VehicleContext';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const [page, setPage] = useState('control-center');
  const { isAuthenticated, user, logout } = useAuth();


  if (!isAuthenticated) {
    return <Login onLogin={() => {
      window.location.reload(); 
    }} />;
  }

  return (
    <VehicleProvider>
      <div className="flex flex-col h-screen">
        <Navbar currentPage={page} setPage={setPage} onLogout={logout} />

        {page === 'dashboard' && <Dashboard />}
        {page === 'register' && <RegisterVehicle />}
        {page === 'track' && <LiveTracking />}
        {page === 'alerts' && <Alerts />}
        {page === 'history' && <History />}
        {page === 'geofences' && <Geofences />}

        {/* New Pages */}
        {page === 'users' && <UserManagement />}
        {page === 'transfers' && <TransferManagement setPage={setPage} />}
        {page === 'key-exchange' && <KeyExchange />}
        {page === 'safe-route' && <SafeRoute />}
        {page === 'control-center' && <ControlCenter />}
      </div>
    </VehicleProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

