import { Gauge, Droplet, Thermometer, MapPin, AlertCircle } from "lucide-react"

export default function VehicleCard({ v }) {
  const getSpeedStatus = (speed) => {
    if (speed > 100) return { label: "High Speed", color: "text-red-500", bg: "bg-red-500/15", icon: AlertCircle }
    if (speed > 60) return { label: "Normal", color: "text-blue-500", bg: "bg-blue-500/15", icon: Gauge }
    return { label: "Idle", color: "text-emerald-500", bg: "bg-emerald-500/15", icon: Gauge }
  }

  const getFuelStatus = (fuel) => {
    if (fuel < 20) return { label: "Critical", color: "text-red-500", bg: "bg-red-500/15", icon: AlertCircle }
    if (fuel < 50) return { label: "Low", color: "text-amber-500", bg: "bg-amber-500/15", icon: Droplet }
    return { label: "Good", color: "text-emerald-500", bg: "bg-emerald-500/15", icon: Droplet }
  }

  const getTempStatus = (temp) => {
    if (temp > 100) return { label: "Overheating", color: "text-red-500", bg: "bg-red-500/15", icon: AlertCircle }
    if (temp > 85) return { label: "Warning", color: "text-amber-500", bg: "bg-amber-500/15", icon: Thermometer }
    return { label: "Optimal", color: "text-emerald-500", bg: "bg-emerald-500/15", icon: Thermometer }
  }

  const speedStatus = getSpeedStatus(v.speed)
  const fuelStatus = getFuelStatus(v.fuel)
  const tempStatus = getTempStatus(v.temperature)

  return (
    <div className="group relative bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 shadow-lg hover:shadow-xl hover:border-slate-600/50 transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-cyan-600/5 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-xl"></div>
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/10 blur-3xl rounded-full"></div>

      <div className="relative z-10 flex flex-col gap-4">
        {/* HEADER - Vehicle ID and Status */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-100">{v.vehicleId}</h2>
            <p className="text-xs text-slate-500 mt-1">Fleet Vehicle</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-emerald-400">Active</span>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="h-px bg-gradient-to-r from-slate-700/50 to-transparent"></div>

        {/* METRICS GRID */}
        <div className="space-y-3">
          {/* SPEED METRIC */}
          <MetricRow
            icon={speedStatus.icon}
            label="Speed"
            value={`${v.speed} km/h`}
            status={speedStatus}
            percentage={Math.min((v.speed / 150) * 100, 100)}
            maxValue="150"
          />

          {/* FUEL METRIC */}
          <MetricRow
            icon={fuelStatus.icon}
            label="Fuel Level"
            value={`${v.fuel}%`}
            status={fuelStatus}
            percentage={v.fuel}
            maxValue="100"
          />

          {/* TEMPERATURE METRIC */}
          <MetricRow
            icon={tempStatus.icon}
            label="Temperature"
            value={`${v.temperature}°C`}
            status={tempStatus}
            percentage={Math.min((v.temperature / 120) * 100, 100)}
            maxValue="120"
          />
        </div>

        {/* LOCATION */}
        {v.location && (v.location.lat || v.location.lng) && (
          <div className="mt-2 pt-3 border-t border-slate-700/30">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">Location</span>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/30 space-y-1">
              <p className="text-xs text-slate-400">
                <span className="text-blue-400 font-semibold">Latitude:</span> {v.location.lat?.toFixed(6)}
              </p>
              <p className="text-xs text-slate-400">
                <span className="text-blue-400 font-semibold">Longitude:</span> {v.location.lng?.toFixed(6)}
              </p>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/30 mt-2">
          <span className="text-xs text-slate-500">Last Update</span>
          <span className="text-xs font-mono text-slate-400">{new Date(v.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  )
}

/* ----------------------- */
/*   Metric Row Component   */
/* ----------------------- */
function MetricRow({ icon: Icon, label, value, status, percentage, maxValue }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">{label}</span>
        </div>
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg ${status.bg} border border-slate-700/30`}>
          <span className={`text-xs font-bold ${status.color}`}>{status.label}</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden border border-slate-700/30">
          <div
            className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${getGradientClass(status.label)}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between">
          <p className="text-xs text-slate-400">{value}</p>
          <p className="text-xs text-slate-500">{maxValue} max</p>
        </div>
      </div>
    </div>
  )
}

function getGradientClass(status) {
  switch (status) {
    case "High Speed":
    case "Critical":
    case "Overheating":
      return "from-red-500 to-red-400"
    case "Normal":
      return "from-blue-500 to-blue-400"
    case "Idle":
      return "from-emerald-500 to-emerald-400"
    case "Low":
      return "from-amber-500 to-amber-400"
    case "Warning":
      return "from-amber-500 to-orange-400"
    case "Good":
    case "Optimal":
      return "from-emerald-500 to-emerald-400"
    default:
      return "from-blue-500 to-blue-400"
  }
}
