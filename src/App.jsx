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
  const [page, setPage] = useState('dashboard');
  const { isAuthenticated, user, logout } = useAuth();

  // If not authenticated, we could redirect to login, OR show login page.
  // The AuthProvider loads initial token from storage.
  // But we have a legacy "Login.jsx" that handles its own auth state via props ideally?
  // Let's integrate: if !isAuthenticated, show Login.

  if (!isAuthenticated) {
    return <Login onLogin={() => {
      // The Login component handles the API call usually? 
      // Wait, our new Login logic is inside AuthProvider's login() method.
      // But the existing Login.jsx does its own thing.
      // We should probably modify Login.jsx to use useAuth().login()
      // For now, let's keep it simple: simpler Login.jsx which calls a prop that calls useAuth().login()
      // Or simply:
      window.location.reload(); // Quick fix to pick up the token from storage if Login set it
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


