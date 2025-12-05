import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Route, TrendingUp } from "lucide-react";
import HistoryMap from "../components/HistoryMap";
import { API } from "../api/api";

export default function History() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedDays, setSelectedDays] = useState(0); // Default to Today
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch vehicles list on mount
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await API.get("/vehicles");
        const vehicleList = res.data?.data || res.data || [];
        setVehicles(Array.isArray(vehicleList) ? vehicleList : []);

        if (Array.isArray(vehicleList) && vehicleList.length > 0) {
          setSelectedVehicle(vehicleList[0].vehicleId);
        }
      } catch (err) {
        console.error("❌ Error fetching vehicles:", err);
      }
    };
    fetchVehicles();
  }, []);

  // Fetch history when vehicle or days changes
  useEffect(() => {
    if (!selectedVehicle) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch location history
        const historyRes = await API.get(`/history/${selectedVehicle}?days=${selectedDays}`);
        const locations = historyRes.data?.locations || [];
        setHistory(locations);

        // Fetch summary statistics
        const summaryRes = await API.get(`/history/${selectedVehicle}/summary?days=${selectedDays}`);
        setSummary(summaryRes.data);
      } catch (err) {
        console.error("❌ Error fetching history:", err);
        setError("Failed to load vehicle history");
        setHistory([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedVehicle, selectedDays]);

  const dayOptions = [
    { value: 0, label: "Today" },
    { value: 1, label: "Yesterday" },
    { value: 3, label: "Last 3 Days" },
    { value: 7, label: "Last 7 Days" },
  ];

  return (
    <div className="h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 p-4 sm:p-6 lg:p-8 overflow-scroll">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
              <Clock className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Vehicle History</h1>
          </div>
          <p className="text-sm sm:text-base text-slate-400">View vehicle travel routes and statistics</p>
        </div>

        {/* Controls */}
        <div className="mb-8 p-4 sm:p-6 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl">
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center">
            {/* Vehicle Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-300">Vehicle:</span>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 text-sm bg-slate-900/50 border border-slate-700 text-slate-200 rounded-lg hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              >
                {vehicles.length === 0 ? (
                  <option>No vehicles available</option>
                ) : (
                  vehicles.map((v) => (
                    <option key={v.vehicleId} value={v.vehicleId}>
                      {v.vehicleId}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Date Range Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto sm:ml-auto">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-300">Period:</span>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {dayOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedDays(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${selectedDays === option.value
                      ? "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-500/20"
                      : "bg-slate-900/50 border border-slate-700 text-slate-400 hover:bg-slate-800"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16 bg-slate-800/20 backdrop-blur-xl border border-slate-700/50 rounded-xl">
            <div className="inline-flex gap-2 mb-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
            </div>
            <p className="text-slate-400 text-sm">Loading vehicle history...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            {summary && summary.hasData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Route className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Distance</p>
                      <p className="text-lg sm:text-xl font-bold text-white">{summary.distance} km</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Duration</p>
                      <p className="text-lg sm:text-xl font-bold text-white">{summary.durationFormatted}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Avg Speed</p>
                      <p className="text-lg sm:text-xl font-bold text-white">{summary.averageSpeed} km/h</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Data Points</p>
                      <p className="text-lg sm:text-xl font-bold text-white">{summary.pointsCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Map */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4">Travel Route</h2>
              <HistoryMap locations={history} vehicleId={selectedVehicle} />

              {history.length > 0 && summary && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <p className="text-slate-400">Start Time</p>
                      <p className="font-medium text-slate-200">
                        {new Date(summary.startTime).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">End Time</p>
                      <p className="font-medium text-slate-200">
                        {new Date(summary.endTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* No Data Message */}
            {history.length === 0 && !loading && (
              <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-12 text-center">
                <MapPin className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No Travel History</h3>
                <p className="text-slate-500">
                  No location data found for {selectedVehicle} in the selected time period.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
