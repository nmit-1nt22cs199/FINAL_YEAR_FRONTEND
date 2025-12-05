import { useEffect, useState } from "react";
import VehicleCard from '../components/VehicleCard.jsx'
import DashboardAnalytics from '../components/DashboardAnalytics.jsx'
import useVehicleData from '../useVehicleData';



export default function Dashboard() {
  const { vehicles, loading, error } = useVehicleData();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-lg">Loading fleet data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4"></div>
          <p className="text-red-400 text-lg">Error loading data: {error}</p>
        </div>
      </div>
    );
  }

  const filteredVehicles = vehicles.filter(v => {
    if (filter === 'critical') return v.fuel < 30 || v.temperature > 100 || v.speed > 100;
    if (filter === 'warning') return v.fuel < 50 || v.temperature > 85;
    if (filter === 'good') return v.fuel >= 50 && v.temperature <= 85;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 overflow-y-scroll">
      {/* Decorative top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50"></div>

      <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-8 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full"></div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              Fleet Monitor
            </h1>
          </div>
          {/* <p className="text-slate-400 text-lg ml-4">Real-time vehicle tracking and performance metrics</p>  */}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
          {[
            { label: 'Active Vehicles', value: vehicles.length.toString(), icon: '' },
            { label: 'Avg Speed', value: `${Math.round(vehicles.reduce((a, v) => a + v.speed, 0) / vehicles.length)} km/h`, icon: '' },
            { label: 'Low Fuel Alert', value: vehicles.filter(v => v.fuel < 30).length.toString(), icon: '' },
            { label: 'Overheating', value: vehicles.filter(v => v.temperature > 100).length.toString(), icon: '' },
          ].map((stat, i) => (
            <div
              key={i}
              className="group relative bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-lg p-4 sm:p-6 hover:border-cyan-400/60 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{stat.icon}</span>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                </div>
                <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-transparent rounded-full"></span>
                Active Fleet
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 ml-4">Monitor and manage all vehicles in real-time</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'critical', label: 'Critical' },
                { id: 'warning', label: 'Warning' },
                { id: 'good', label: 'Good' }
              ].map(btn => (
                <button
                  key={btn.id}
                  onClick={() => setFilter(btn.id)}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${filter === btn.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-cyan-500/50'
                    }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fleet Stats Bar */}
          <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-cyan-500/20 rounded-lg p-3 sm:p-4 mb-6 backdrop-blur-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
                <div>
                  <p className="text-xs text-slate-400">Healthy</p>
                  <p className="text-base sm:text-lg font-bold text-green-400">{vehicles.filter(v => v.fuel >= 50 && v.temperature <= 85).length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400">⚠</div>
                <div>
                  <p className="text-xs text-slate-400">Warning</p>
                  <p className="text-base sm:text-lg font-bold text-yellow-400">{vehicles.filter(v => (v.fuel >= 30 && v.fuel < 50) || (v.temperature > 85 && v.temperature <= 100)).length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">!</div>
                <div>
                  <p className="text-xs text-slate-400">Critical</p>
                  <p className="text-base sm:text-lg font-bold text-red-400">{vehicles.filter(v => v.fuel < 30 || v.temperature > 100).length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">📍</div>
                <div>
                  <p className="text-xs text-slate-400">Total Active</p>
                  <p className="text-base sm:text-lg font-bold text-cyan-400">{vehicles.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.vehicleId} v={vehicle} />
              ))
            ) : (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-slate-400 font-medium">No vehicles matching this filter</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Section */}
        <DashboardAnalytics vehicles={vehicles} />

      </main>

      {/* Decorative bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mt-12"></div>
    </div>
  );
}
