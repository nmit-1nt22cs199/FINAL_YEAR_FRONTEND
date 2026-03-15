import { useState, useEffect, useRef } from "react";
import { assignRoute, getRoutes, cancelRoute, completeRoute } from "../api/routeApi";
import { useAuth } from "../context/AuthContext";
import { MapPin, Navigation, Truck, Route, CheckCircle, XCircle, Loader2, Shield } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL + "/api";

// Polyline Decoder (Google Encoded Polyline Algorithm)
function decodePolyline(encoded) {
    let index = 0, lat = 0, lng = 0, coordinates = [];
    while (index < encoded.length) {
        let b, shift = 0, result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lat += (result & 1) ? ~(result >> 1) : result >> 1;
        shift = 0; result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lng += (result & 1) ? ~(result >> 1) : result >> 1;
        coordinates.push([lng / 1e5, lat / 1e5]);
    }
    return coordinates;
}

export default function SafeRoute() {
    const { role } = useAuth();
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const olaRef = useRef(null);
    const routeLayerRef = useRef(null);

    const [vehicles, setVehicles] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState("");
    const [originAddress, setOriginAddress] = useState("");
    const [destAddress, setDestAddress] = useState("");
    const [originCoords, setOriginCoords] = useState(null);
    const [destCoords, setDestCoords] = useState(null);
    const [loading, setLoading] = useState(false);
    const [routeResult, setRouteResult] = useState(null);
    const [error, setError] = useState("");
    const [tab, setTab] = useState("plan"); // plan | history

    // Geocoding state
    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [destSuggestions, setDestSuggestions] = useState([]);

    const apiKey = import.meta.env.VITE_OLA_MAPS_API_KEY || "";
    const [apiKeyErrorShown, setApiKeyErrorShown] = useState(false);

    // Fetch vehicles
    useEffect(() => {
        fetch(`${API_BASE}/vehicles`)
            .then(r => r.json())
            .then(data => setVehicles(data.data || []))
            .catch(console.error);
    }, []);

    // Fetch routes
    useEffect(() => {
        loadRoutes();
    }, []);

    const loadRoutes = async () => {
        try {
            const res = await getRoutes();
            console.debug("[SafeRoute] getRoutes response", res);
            setRoutes(res.data?.data || res.data || []);
        } catch (e) { console.error(e); }
    };

    // Init map
    useEffect(() => {
        if (mapInstanceRef.current) return;

        import("olamaps-web-sdk").then(({ OlaMaps }) => {
            const ola = new OlaMaps({ apiKey });
            olaRef.current = ola;

            const map = ola.init({
                container: mapRef.current,
                center: [77.5946, 12.9716],
                zoom: 10,
                style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
            });

            mapInstanceRef.current = map;
        });
    }, []);

    const keyParamCandidates = ["api_key"];

    const fetchOlaJson = async (baseUrl) => {
        let lastError = "Unknown error";
        for (const keyParam of keyParamCandidates) {
            const url = `${baseUrl}&${keyParam}=${encodeURIComponent(apiKey)}`;
            try {
                const res = await fetch(url, {
                    headers: {
                        "X-Request-Id": `ola-${Date.now()}`
                    }
                });
                if (res.ok) return await res.json();
                const text = await res.text().catch(() => "");
                lastError = `status ${res.status}${text ? `: ${text}` : ""}`;
                console.warn("OLA request failed", res.status, keyParam);
            } catch (e) {
                lastError = e.message || String(e);
            }
        }
        throw new Error(`OLA Maps request failed (${lastError})`);
    };

    // Geocode helper using OLA Maps
    const geocode = async (query) => {
        if (!query || query.length < 3) return [];
        if (!apiKey) {
            if (!apiKeyErrorShown) {
                setError("OLA Maps API key missing. Set VITE_OLA_MAPS_API_KEY in frontend .env and restart.");
                setApiKeyErrorShown(true);
            }
            return [];
        }
        try {
            const data = await fetchOlaJson(
                `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(query)}`
            );
            return (data.predictions || []).map(p => ({
                description: p.description,
                lat: p.geometry?.location?.lat,
                lng: p.geometry?.location?.lng,
                placeId: p.place_id
            }));
        } catch (e) {
            console.warn("OLA autocomplete failed", e.message || e);
            return [];
        }
    };

    // Get place details for coordinates
    const getPlaceDetails = async (placeId) => {
        try {
            const data = await fetchOlaJson(
                `https://api.olamaps.io/places/v1/details?place_id=${placeId}`
            );
            return {
                lat: data.result?.geometry?.location?.lat,
                lng: data.result?.geometry?.location?.lng
            };
        } catch { return null; }
    };

    const handleOriginSearch = async (value) => {
        setOriginAddress(value);
        setOriginCoords(null);
        if (value.length >= 3) {
            const suggestions = await geocode(value);
            setOriginSuggestions(suggestions);
        } else {
            setOriginSuggestions([]);
        }
    };

    const handleDestSearch = async (value) => {
        setDestAddress(value);
        setDestCoords(null);
        if (value.length >= 3) {
            const suggestions = await geocode(value);
            setDestSuggestions(suggestions);
        } else {
            setDestSuggestions([]);
        }
    };

    const selectOrigin = async (suggestion) => {
        setOriginAddress(suggestion.description);
        setOriginSuggestions([]);
        if (suggestion.lat && suggestion.lng) {
            setOriginCoords({ lat: suggestion.lat, lng: suggestion.lng });
        } else if (suggestion.placeId) {
            const coords = await getPlaceDetails(suggestion.placeId);
            if (coords) setOriginCoords(coords);
        }
    };

    const selectDest = async (suggestion) => {
        setDestAddress(suggestion.description);
        setDestSuggestions([]);
        if (suggestion.lat && suggestion.lng) {
            setDestCoords({ lat: suggestion.lat, lng: suggestion.lng });
        } else if (suggestion.placeId) {
            const coords = await getPlaceDetails(suggestion.placeId);
            if (coords) setDestCoords(coords);
        }
    };

    // Draw route on map
    const drawRouteOnMap = (encodedPolyline, origin, destination) => {
        const map = mapInstanceRef.current;
        const ola = olaRef.current;
        if (!map || !ola) return;

        // Remove old route
        if (routeLayerRef.current) {
            try {
                if (map.getLayer('safe-route-line')) map.removeLayer('safe-route-line');
                if (map.getSource('safe-route')) map.removeSource('safe-route');
            } catch (e) { }
        }

        const coords = decodePolyline(encodedPolyline);

        const addRoute = () => {
            map.addSource('safe-route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: coords }
                }
            });

            map.addLayer({
                id: 'safe-route-line',
                type: 'line',
                source: 'safe-route',
                paint: {
                    'line-color': '#080808',
                    'line-width': 5,
                    'line-opacity': 0.9
                }
            });

            routeLayerRef.current = true;

            // Fit map bounds to route
            const lngs = coords.map(c => c[0]);
            const lats = coords.map(c => c[1]);
            map.fitBounds(
                [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
                { padding: 60 }
            );
        };

        if (map.isStyleLoaded()) {
            addRoute();
        } else {
            map.on('load', addRoute);
        }
    };

    // Find route via OLA (frontend) and assign via backend (persists to DB)
    const handleFindRoute = async () => {
        if (!selectedVehicle) { setError("Please select a vehicle"); return; }
        if (!originCoords) { setError("Please select an origin from suggestions"); return; }
        if (!destCoords) { setError("Please select a destination from suggestions"); return; }

        setLoading(true);
        setError("");

        try {
            const url = `https://api.olamaps.io/routing/v1/directions?origin=${originCoords.lat},${originCoords.lng}&destination=${destCoords.lat},${destCoords.lng}&api_key=${apiKey}`;

            const response = await fetch(url, { method: "POST" });
            const data = await response.json();

            if (!data.routes || data.routes.length === 0) {
                throw new Error("No routes returned from Ola Maps API");
            }

            const firstRoute = data.routes[0];
            const encodedPolyline = firstRoute.overview_polyline;

            const leg = firstRoute.legs?.[0] || {};
            const distanceValue = leg.distance?.value ?? leg.distance ?? 0;
            const durationValue = leg.duration?.value ?? leg.duration ?? 0;

            const payload = {
                vehicleId: selectedVehicle,
                origin: { ...originCoords, address: originAddress },
                destination: { ...destCoords, address: destAddress },
                waypoints: [],
                encodedPolyline,
                distance: distanceValue,
                duration: durationValue
            };
            console.debug("[SafeRoute] assignRoute payload", payload);

            const res = await assignRoute(payload);
            console.debug("[SafeRoute] assignRoute response", res);

            const routeData = res?.data || res;
            if (!routeData) throw new Error("Assign route failed: empty response");

            setRouteResult(routeData);

            // Draw on map
            if (routeData.encodedPolyline) {
                drawRouteOnMap(routeData.encodedPolyline, routeData.origin, routeData.destination);
            }

            await loadRoutes();
        } catch (err) {
            setError(err.message || "Failed to find route");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRoute = async (routeId) => {
        try {
            await cancelRoute(routeId);
            loadRoutes();
        } catch (e) { console.error(e); }
    };

    const handleCompleteRoute = async (routeId) => {
        try {
            await completeRoute(routeId);
            loadRoutes();
        } catch (e) { console.error(e); }
    };

    const formatDistance = (meters) => {
        if (!meters) return "—";
        return meters > 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
    };

    const formatDuration = (seconds) => {
        if (!seconds) return "—";
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    };

    const statusColors = {
        assigned: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        "in-progress": "bg-amber-500/20 text-amber-300 border-amber-500/30",
        completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        cancelled: "bg-red-500/20 text-red-300 border-red-500/30"
    };

    useEffect(() => {
        console.debug("[SafeRoute] routes state updated", routes);
    }, [routes]);

    return (
        <div className="h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
            {/* Background accents */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-10 w-80 h-80 bg-emerald-500/8 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 left-10 w-80 h-80 bg-cyan-500/8 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 h-full flex flex-col lg:flex-row pt-16 lg:pt-16">
                {/* Left Panel — Controls */}
                <div className="w-full lg:w-[420px] xl:w-[460px] flex-shrink-0 overflow-y-auto p-4 lg:p-6 border-r border-slate-800/50">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl">
                            <Shield className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Safe Route</h1>
                            <p className="text-xs text-slate-400">Assign secure routes to vehicles</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6">
                        {[
                            { id: "plan", label: "Plan Route", icon: Navigation },
                            { id: "history", label: "Route History", icon: Route }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${tab === t.id
                                    ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-500/30"
                                    : "bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:border-slate-600/50"
                                    }`}
                            >
                                <t.icon className="w-4 h-4" />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {tab === "plan" && (
                        <div className="space-y-4">
                            {/* Vehicle Selector */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                    <Truck className="w-3.5 h-3.5 inline mr-1" />
                                    Vehicle
                                </label>
                                <select
                                    value={selectedVehicle}
                                    onChange={e => setSelectedVehicle(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                >
                                    <option value="">Select vehicle...</option>
                                    {vehicles.map(v => (
                                        <option key={v.vehicleId} value={v.vehicleId}>
                                            {v.vehicleId} — {v.registrationNumber || v.model || ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Origin */}
                            <div className="relative">
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                    <MapPin className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                                    Origin
                                </label>
                                <input
                                    type="text"
                                    value={originAddress}
                                    onChange={e => handleOriginSearch(e.target.value)}
                                    placeholder="Search for origin location..."
                                    className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                />
                                {originCoords && (
                                    <span className="absolute right-3 top-8 text-emerald-400 text-xs">✓ Selected</span>
                                )}
                                {originSuggestions.length > 0 && (
                                    <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                                        {originSuggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => selectOrigin(s)}
                                                className="w-full text-left px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors border-b border-slate-700/30 last:border-0"
                                            >
                                                {s.description}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Destination */}
                            <div className="relative">
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                    <MapPin className="w-3.5 h-3.5 inline mr-1 text-red-400" />
                                    Destination
                                </label>
                                <input
                                    type="text"
                                    value={destAddress}
                                    onChange={e => handleDestSearch(e.target.value)}
                                    placeholder="Search for destination..."
                                    className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                />
                                {destCoords && (
                                    <span className="absolute right-3 top-8 text-emerald-400 text-xs">✓ Selected</span>
                                )}
                                {destSuggestions.length > 0 && (
                                    <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                                        {destSuggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => selectDest(s)}
                                                className="w-full text-left px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors border-b border-slate-700/30 last:border-0"
                                            >
                                                {s.description}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Find Route Button */}
                            <button
                                onClick={handleFindRoute}
                                disabled={loading || role === 'receiver'}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Finding Safest Route...</>
                                ) : role === 'receiver' ? (
                                    <><Shield className="w-4 h-4" /> View Only Access</>
                                ) : (
                                    <><Navigation className="w-4 h-4" /> Find & Assign Safe Route</>
                                )}
                            </button>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Route Result */}
                            {routeResult && (
                                <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                                        <span className="text-emerald-300 font-semibold text-sm">Route Assigned</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <p className="text-slate-400">Distance</p>
                                            <p className="text-white font-medium text-base">{formatDistance(routeResult.distance)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Duration</p>
                                            <p className="text-white font-medium text-base">{formatDuration(routeResult.duration)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Vehicle</p>
                                            <p className="text-white font-medium">{routeResult.vehicleId}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Status</p>
                                            <p className="text-emerald-300 font-medium capitalize">{routeResult.status}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === "history" && (
                        <div className="space-y-3">
                            {routes.length === 0 ? (
                                <div className="text-center py-12">
                                    <Route className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                                    <p className="text-slate-400 text-sm">No routes assigned yet</p>
                                </div>
                            ) : (
                                routes.map(route => {
                                    console.debug("[SafeRoute] render route card", route?._id, route?.vehicleId);
                                    return (
                                        <div
                                            key={route._id}
                                            className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-all"
                                        >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-white font-semibold text-sm">{route.vehicleId}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-lg border ${statusColors[route.status] || "bg-slate-700/50 text-slate-300"}`}>
                                                {route.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-400 space-y-1">
                                            <p className="truncate">📍 {route.origin?.address || `${route.origin?.lat?.toFixed(4)}, ${route.origin?.lng?.toFixed(4)}`}</p>
                                            <p className="truncate">🏁 {route.destination?.address || `${route.destination?.lat?.toFixed(4)}, ${route.destination?.lng?.toFixed(4)}`}</p>
                                            <div className="flex gap-3 mt-1.5">
                                                <span>{formatDistance(route.distance)}</span>
                                                <span>{formatDuration(route.duration)}</span>
                                                <span>{new Date(route.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        {(route.status === "assigned" || route.status === "in-progress") && role !== 'receiver' && (
                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={() => handleCompleteRoute(route._id)}
                                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs hover:bg-emerald-500/20 transition-all"
                                                >
                                                    <CheckCircle className="w-3 h-3" /> Complete
                                                </button>
                                                <button
                                                    onClick={() => handleCancelRoute(route._id)}
                                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs hover:bg-red-500/20 transition-all"
                                                >
                                                    <XCircle className="w-3 h-3" /> Cancel
                                                </button>
                                            </div>
                                        )}
                                        {route.status === "assigned" || route.status === "in-progress" ? (
                                            <button
                                                onClick={() => route.encodedPolyline && drawRouteOnMap(route.encodedPolyline, route.origin, route.destination)}
                                                className="w-full mt-2 flex items-center justify-center gap-1 px-2 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-300 text-xs hover:bg-cyan-500/20 transition-all"
                                            >
                                                <MapPin className="w-3 h-3" /> Show on Map
                                            </button>
                                        ) : null}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* Right Panel — Map */}
                <div className="flex-1 relative">
                    <div
                        ref={mapRef}
                        className="w-full h-full min-h-[400px] lg:min-h-0"
                    />
                </div>
            </div>
        </div>
    );
}
