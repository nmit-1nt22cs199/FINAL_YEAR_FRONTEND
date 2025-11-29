import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Route, TrendingUp } from "lucide-react";
import HistoryMap from "../components/HistoryMap";
import { API } from "../api/api";

export default function History() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedDays, setSelectedDays] = useState(1);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch vehicles list on mount
  useEffect(() => {
    const fetchVehicles = async () => {
      console.log('🚗 Fetching vehicles from /api/vehicles...');
      try {
        const res = await API.get("/vehicles");
        console.log('✅ Vehicles response:', res.data);

        // Backend returns { status: 'ok', data: [...] }
        // API wrapper wraps it in { data: {...} }
        // So we need to extract res.data.data
        const vehicleList = res.data?.data || res.data || [];
        console.log('📋 Extracted vehicle list:', vehicleList);

        setVehicles(Array.isArray(vehicleList) ? vehicleList : []);

        if (Array.isArray(vehicleList) && vehicleList.length > 0) {
          console.log('✅ Setting selected vehicle to:', vehicleList[0].vehicleId);
          setSelectedVehicle(vehicleList[0].vehicleId);
        } else {
          console.warn('⚠️ No vehicles found in response');
        }
      } catch (err) {
        console.error("❌ Error fetching vehicles:", err);
        console.error("Error details:", err.response?.data || err.message);
      }
    };
    fetchVehicles();
  }, []);

  // Fetch history when vehicle or days changes
  useEffect(() => {
    if (!selectedVehicle) {
      console.log('⏭️ Skipping history fetch - no vehicle selected');
      return;
    }

    const fetchHistory = async () => {
      console.log(`📍 Fetching history for ${selectedVehicle}, days: ${selectedDays}`);
      setLoading(true);
      setError(null);

      try {
        // Fetch location history
        console.log(`Calling: /history/${selectedVehicle}?days=${selectedDays}`);
        const historyRes = await API.get(`/history/${selectedVehicle}?days=${selectedDays}`);
        console.log('✅ History response:', historyRes.data);

        // Extract locations array (handle nested structure)
        const locations = historyRes.data?.locations || [];
        console.log(`   - Locations count: ${locations.length}`);
        setHistory(locations);

        // Fetch summary statistics
        console.log(`Calling: /history/${selectedVehicle}/summary?days=${selectedDays}`);
        const summaryRes = await API.get(`/history/${selectedVehicle}/summary?days=${selectedDays}`);
        console.log('✅ Summary response:', summaryRes.data);
        setSummary(summaryRes.data);
      } catch (err) {
        console.error("❌ Error fetching history:", err);
        console.error("Error details:", err.response?.data || err.message);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Vehicle History</h1>
        <p className="text-slate-600">View vehicle travel routes and statistics</p>
      </div>

      {/* Controls */}
      <div className="max-w-6xl mx-auto mb-6 bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Vehicle Selector */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Vehicle:</span>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Period:</span>
            <div className="flex gap-2">
              {dayOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedDays(option.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedDays === option.value
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
        <div className="max-w-6xl mx-auto text-center py-12 bg-white rounded-lg border border-slate-200">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading vehicle history...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="max-w-6xl mx-auto text-center py-12 bg-white rounded-lg border border-red-200">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Statistics Cards */}
          {summary && summary.hasData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Route className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Distance</p>
                    <p className="text-xl font-bold text-slate-900">{summary.distance} km</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Duration</p>
                    <p className="text-xl font-bold text-slate-900">{summary.durationFormatted}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Avg Speed</p>
                    <p className="text-xl font-bold text-slate-900">{summary.averageSpeed} km/h</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Data Points</p>
                    <p className="text-xl font-bold text-slate-900">{summary.pointsCount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Map */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Travel Route</h2>
            <HistoryMap locations={history} vehicleId={selectedVehicle} />

            {history.length > 0 && summary && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Start Time</p>
                    <p className="font-medium text-slate-900">
                      {new Date(summary.startTime).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">End Time</p>
                    <p className="font-medium text-slate-900">
                      {new Date(summary.endTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* No Data Message */}
          {history.length === 0 && !loading && (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-sm">
              <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Travel History</h3>
              <p className="text-slate-600">
                No location data found for {selectedVehicle} in the selected time period.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
