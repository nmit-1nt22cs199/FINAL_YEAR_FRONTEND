export default function VehicleCard({ v }) {
  // Determine status based on vehicle metrics
  const getSpeedStatus = (speed) => {
    if (speed > 100) return { label: 'High Speed', color: 'text-red-500', bg: 'bg-red-500/10' };
    if (speed > 60) return { label: 'Normal', color: 'text-cyan-400', bg: 'bg-cyan-400/10' };
    return { label: 'Low Speed', color: 'text-blue-400', bg: 'bg-blue-400/10' };
  };

  const getFuelStatus = (fuel) => {
    if (fuel < 20) return { label: 'Critical', color: 'text-red-500', bg: 'bg-red-500/10' };
    if (fuel < 50) return { label: 'Low', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    return { label: 'Good', color: 'text-green-500', bg: 'bg-green-500/10' };
  };

  const getTempStatus = (temp) => {
    if (temp > 100) return { label: 'Overheating', color: 'text-red-500', bg: 'bg-red-500/10' };
    if (temp > 85) return { label: 'Warning', color: 'text-orange-500', bg: 'bg-orange-500/10' };
    return { label: 'Normal', color: 'text-cyan-400', bg: 'bg-cyan-400/10' };
  };

  const speedStatus = getSpeedStatus(v.speed);
  const fuelStatus = getFuelStatus(v.fuel);
  const tempStatus = getTempStatus(v.temperature);

  return (
    <div className="group relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-xl p-6 hover:border-cyan-400/60 transition-all duration-300 overflow-hidden">
      {/* <CHANGE> Added animated gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all duration-300"></div>

      <div className="relative z-10">
        {/* Vehicle ID Header with Status Indicator */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            {v.vehicleId}
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-semibold">Active</span>
          </div>
        </div>

        {/* Divider Line */}
        <div className="h-px bg-gradient-to-r from-cyan-500/50 to-transparent mb-4"></div>

        {/* Speed Metric */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400 font-medium">⚡ Speed</span>
            <span className={`text-xs font-bold px-2 py-1 rounded ${speedStatus.bg} ${speedStatus.color}`}>
              {speedStatus.label}
            </span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden border border-cyan-500/20">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((v.speed / 150) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 mt-1">{v.speed} km/h</p>
        </div>

        {/* Fuel Metric */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400 font-medium">⛽ Fuel</span>
            <span className={`text-xs font-bold px-2 py-1 rounded ${fuelStatus.bg} ${fuelStatus.color}`}>
              {fuelStatus.label}
            </span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden border border-cyan-500/20">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${v.fuel}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 mt-1">{v.fuel}%</p>
        </div>

        {/* Temperature Metric */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400 font-medium">🌡️ Temperature</span>
            <span className={`text-xs font-bold px-2 py-1 rounded ${tempStatus.bg} ${tempStatus.color}`}>
              {tempStatus.label}
            </span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden border border-cyan-500/20">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((v.temperature / 120) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 mt-1">{v.temperature} °C</p>
        </div>

        {/* Divider Line */}
        <div className="h-px bg-gradient-to-r from-cyan-500/50 to-transparent my-3"></div>

        {/* Last Update Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">Last Update</span>
          <span className="text-xs text-cyan-400 font-mono">
            {new Date(v.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}
