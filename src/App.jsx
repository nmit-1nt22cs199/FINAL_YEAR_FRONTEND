import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import LiveTracking from './pages/LiveTracking';
import RegisterVehicle from './pages/RegisterVehicle';
import Alerts from './pages/Alerts';
import History from './pages/History';
import Geofences from './pages/Geofences';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import { VehicleProvider } from './context/VehicleContext';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('fleetMonitorAuth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    localStorage.setItem('fleetMonitorAuth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('fleetMonitorAuth');
    setIsAuthenticated(false);
    setPage('dashboard'); // Reset to dashboard page
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Show main app if authenticated
  return (
    <VehicleProvider>
      <div className="flex flex-col h-screen">
        <Navbar currentPage={page} setPage={setPage} onLogout={handleLogout} />

        {page === 'dashboard' && <Dashboard />}
        {page === 'register' && <RegisterVehicle />}
        {page === 'track' && <LiveTracking />}
        {page === 'alerts' && <Alerts />}
        {page === 'history' && <History />}
        {page === 'geofences' && <Geofences />}
      </div>
    </VehicleProvider>
  );
}
