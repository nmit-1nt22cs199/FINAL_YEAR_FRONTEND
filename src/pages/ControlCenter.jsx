import { useEffect, useRef, useState } from "react";
import { connectSocket } from "../socketConnection";
import { fetchGeofences } from "../api/geofenceApi";
import { getRoutes } from "../api/routeApi";
import {
    Activity, AlertTriangle, Truck, Fuel, Thermometer,
    MapPin, Navigation, Shield, Radio, DoorOpen, Vibrate, Bell
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL + "/api";

// Polyline decoder
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

export default function ControlCenter() {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const olaRef = useRef(null);
    const markersRef = useRef(new Map());
    const routeLayersRef = useRef(new Set());

    const [vehicles, setVehicles] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [activeRoutes, setActiveRoutes] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    // Fetch initial data
    useEffect(() => {
        const load = async () => {
            try {
                const [vRes, tRes, aRes] = await Promise.all([
                    fetch(`${API_BASE}/vehicles`).then(r => r.json()),
                    fetch(`${API_BASE}/telemetry`).then(r => r.json()),
                    fetch(`${API_BASE}/alerts`).then(r => r.json())
                ]);

                const vehicleData = vRes.data || [];
                const telemetryData = tRes.data || [];
                const combined = vehicleData.map(v => {
                    const t = telemetryData.find(tel => tel.vehicleId === v.vehicleId);
                    return {
                        vehicleId: v.vehicleId,
                        registrationNumber: v.registrationNumber,
                        model: v.model,
                        driverName: v.driverName,
                        location: t?.location || null,
                        speed: t?.speed || 0,
                        temperature: t?.temperature || 0,
                        fuel: t?.fuel || 0,
                        ignition: t?.ignition || false,
                        doorStatus: t?.doorStatus || null,
                        vibration: t?.vibration || 0,
                        motion: t?.motion || false,
                        offline: false
                    };
                }).filter(v => v.location);

                setVehicles(combined);
                setAlerts((aRes.data || []).slice(0, 50));
            } catch (e) { console.error(e); }
        };
        load();
    }, []);

    // Fetch active routes
    useEffect(() => {
        const loadRoutes = async () => {
            try {
                const res = await getRoutes({ status: 'assigned' });
                const data = res.data?.data || res.data || [];
                const inProgress = await getRoutes({ status: 'in-progress' });
                const ipData = inProgress.data?.data || inProgress.data || [];
                setActiveRoutes([...data, ...ipData]);
            } catch (e) { console.error(e); }
        };
        loadRoutes();
        const interval = setInterval(loadRoutes, 30000);
        return () => clearInterval(interval);
    }, []);

    // Socket connection
    useEffect(() => {
        const socket = connectSocket();

        socket.on('vehicle:telemetry', (data) => {
            setVehicles(prev => {
                const existing = prev.find(v => v.vehicleId === data.vehicleId);
                if (existing) {
                    return prev.map(v =>
                        v.vehicleId === data.vehicleId
                            ? { ...v, location: data.location || v.location, speed: data.speed ?? v.speed, temperature: data.temperature ?? v.temperature, fuel: data.fuel ?? v.fuel, doorStatus: data.doorStatus ?? v.doorStatus, vibration: data.vibration ?? v.vibration, offline: false }
                            : v
                    );
                } else if (data.location) {
                    return [...prev, { vehicleId: data.vehicleId, location: data.location, speed: data.speed || 0, temperature: data.temperature || 0, fuel: data.fuel || 0, doorStatus: data.doorStatus || null, vibration: data.vibration || 0, offline: false }];
                }
                return prev;
            });
        });

        socket.on('vehicle_update', (data) => {
            setVehicles(prev => prev.map(v =>
                v.vehicleId === data.vehicleId
                    ? { ...v, location: data.location || v.location, speed: data.speed ?? v.speed, temperature: data.temperature ?? v.temperature, offline: false }
                    : v
            ));
        });

        socket.on('alert_triggered', (alert) => {
            setAlerts(prev => [alert, ...prev].slice(0, 50));
        });

        socket.on('vehicle:alert', (alert) => {
            setAlerts(prev => {
                if (prev.find(a => a._id === alert._id)) return prev;
                return [alert, ...prev].slice(0, 50);
            });
        });

        return () => socket.disconnect();
    }, []);

    // Init map
    useEffect(() => {
        if (mapInstanceRef.current) return;
        const apiKey = import.meta.env.VITE_OLA_MAPS_API_KEY || "";

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
            map.on("load", () => setIsMapLoaded(true));
        });
    }, []);

    // Update markers
    useEffect(() => {
        if (!mapInstanceRef.current || !olaRef.current || !isMapLoaded) return;
        const map = mapInstanceRef.current;
        const ola = olaRef.current;

        vehicles.forEach(v => {
            if (!v.location?.lat || !v.location?.lng) return;

            const existing = markersRef.current.get(v.vehicleId);
            const isSelected = selectedVehicle === v.vehicleId;
            const statusColor = v.fuel < 30 || v.temperature > 100 ? '#ef4444' : v.fuel < 50 || v.temperature > 85 ? '#f59e0b' : '#10b981';

            const markerHTML = `
        <div style="position:relative;width:max-content;display:flex;justify-content:center;align-items:center;">
          <div style="position:absolute;width:${isSelected ? '22px' : '16px'};height:${isSelected ? '22px' : '16px'};background:${statusColor};border-radius:50%;animation:pulseAnim 1.5s infinite;z-index:1;"></div>
          <div style="position:relative;top:20px;transform:translateX(-50%);left:50%;background:#151836f2;padding:3px 8px;font-size:9px;border-radius:4px;border:2px solid ${isSelected ? '#00d4aa' : '#e0e6d8'};color:#f3efef;font-weight:600;white-space:nowrap;z-index:2;">
            ${v.vehicleId} • ${Math.round(v.speed)}km/h • ${v.fuel}%
          </div>
        </div>
        <style>@keyframes pulseAnim{0%{transform:scale(0.9);opacity:0.8}50%{transform:scale(${isSelected ? '2.5' : '1.6'});opacity:0.4}100%{transform:scale(0.9);opacity:0.8}}</style>
      `;

            if (existing) {
                existing.marker.setLngLat([v.location.lng, v.location.lat]);
                existing.element.innerHTML = markerHTML;
            } else {
                const el = document.createElement("div");
                el.innerHTML = markerHTML;
                const marker = ola.addMarker({ element: el }).setLngLat([v.location.lng, v.location.lat]).addTo(map);
                markersRef.current.set(v.vehicleId, { marker, element: el });
            }
        });
    }, [vehicles, isMapLoaded, selectedVehicle]);

    // Draw active routes on map
    useEffect(() => {
        if (!mapInstanceRef.current || !isMapLoaded) return;
        const map = mapInstanceRef.current;

        // Remove old route layers
        routeLayersRef.current.forEach(id => {
            try {
                if (map.getLayer(id)) map.removeLayer(id);
                if (map.getSource(id)) map.removeSource(id);
            } catch (e) { }
        });
        routeLayersRef.current.clear();

        activeRoutes.forEach(route => {
            if (!route.encodedPolyline) return;
            const layerId = `route-${route._id}`;
            const coords = decodePolyline(route.encodedPolyline);

            try {
                map.addSource(layerId, {
                    type: 'geojson',
                    data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } }
                });

                map.addLayer({
                    id: layerId,
                    type: 'line',
                    source: layerId,
                    paint: {
                        'line-color': route.status === 'in-progress' ? '#080808' : '#080808',
                        'line-width': 4,
                        'line-opacity': 0.8,
                        'line-dasharray': route.status === 'assigned' ? [2, 2] : [1]
                    }
                });

                routeLayersRef.current.add(layerId);
            } catch (e) { console.error(e); }
        });
    }, [activeRoutes, isMapLoaded]);

    // Focus on selected vehicle
    useEffect(() => {
        if (!mapInstanceRef.current || !selectedVehicle) return;
        const v = vehicles.find(x => x.vehicleId === selectedVehicle);
        if (v?.location) {
            mapInstanceRef.current.flyTo({ center: [v.location.lng, v.location.lat], zoom: 14 });
        }
    }, [selectedVehicle]);

    const getVehicleStatus = (v) => {
        if (v.fuel < 30 || v.temperature > 100) return { label: "Critical", color: "text-red-400", bg: "bg-red-500/10" };
        if (v.fuel < 50 || v.temperature > 85) return { label: "Warning", color: "text-amber-400", bg: "bg-amber-500/10" };
        return { label: "Healthy", color: "text-emerald-400", bg: "bg-emerald-500/10" };
    };

    const alertTypeIcon = (type) => {
        if (type?.includes('geofence')) return <MapPin className="w-3.5 h-3.5 text-blue-400" />;
        if (type === 'route_deviation') return <Navigation className="w-3.5 h-3.5 text-orange-400" />;
        if (type === 'unexpected_stop') return <Radio className="w-3.5 h-3.5 text-red-400" />;
        if (type === 'unauthorized_door') return <DoorOpen className="w-3.5 h-3.5 text-purple-400" />;
        if (type === 'tamper_detected') return <Vibrate className="w-3.5 h-3.5 text-pink-400" />;
        if (type === 'overspeed') return <Activity className="w-3.5 h-3.5 text-amber-400" />;
        return <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />;
    };

    const alertLevelColor = (level) => {
        if (level === 'high') return "border-l-red-500 bg-red-500/5";
        if (level === 'medium') return "border-l-amber-500 bg-amber-500/5";
        return "border-l-cyan-500 bg-cyan-500/5";
    };

    return (
        <div className="h-full bg-slate-950 overflow-hidden flex flex-col lg:flex-row pt-16">
            {/* Left Sidebar — Vehicles */}
            <div className="w-full lg:w-[300px] xl:w-[340px] flex-shrink-0 overflow-y-auto border-r border-slate-800/50 bg-slate-950/80 backdrop-blur-sm">
                {/* Header */}
                <div className="p-4 border-b border-slate-800/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-lg font-bold text-white">Control Center</h2>
                    </div>
                    {/* Fleet stats */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="text-center p-2 bg-slate-800/40 rounded-lg">
                            <p className="text-lg font-bold text-cyan-400">{vehicles.length}</p>
                            <p className="text-[10px] text-slate-400">Active</p>
                        </div>
                        <div className="text-center p-2 bg-slate-800/40 rounded-lg">
                            <p className="text-lg font-bold text-amber-400">{alerts.filter(a => !a.acknowledged).length}</p>
                            <p className="text-[10px] text-slate-400">Alerts</p>
                        </div>
                        <div className="text-center p-2 bg-slate-800/40 rounded-lg">
                            <p className="text-lg font-bold text-emerald-400">{activeRoutes.length}</p>
                            <p className="text-[10px] text-slate-400">Routes</p>
                        </div>
                    </div>
                </div>

                {/* Vehicle List */}
                <div className="p-2 space-y-1">
                    {vehicles.map(v => {
                        const status = getVehicleStatus(v);
                        const isSelected = selectedVehicle === v.vehicleId;
                        const activeRoute = activeRoutes.find(r => r.vehicleId === v.vehicleId);

                        return (
                            <button
                                key={v.vehicleId}
                                onClick={() => setSelectedVehicle(isSelected ? null : v.vehicleId)}
                                className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${isSelected
                                        ? "bg-cyan-500/10 border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                                        : "bg-slate-800/30 border border-transparent hover:bg-slate-800/50 hover:border-slate-700/50"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <Truck className={`w-3.5 h-3.5 ${status.color}`} />
                                        <span className="text-white font-semibold text-xs">{v.vehicleId}</span>
                                    </div>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${status.bg} ${status.color}`}>
                                        {status.label}
                                    </span>
                                </div>

                                {/* Metrics Row */}
                                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                    <span className="flex items-center gap-0.5">
                                        <Activity className="w-3 h-3" /> {Math.round(v.speed)} km/h
                                    </span>
                                    <span className="flex items-center gap-0.5">
                                        <Fuel className="w-3 h-3" /> {v.fuel}%
                                    </span>
                                    <span className="flex items-center gap-0.5">
                                        <Thermometer className="w-3 h-3" /> {Math.round(v.temperature)}°C
                                    </span>
                                </div>

                                {/* Sensor Data */}
                                {isSelected && (
                                    <div className="mt-2 pt-2 border-t border-slate-700/30 grid grid-cols-3 gap-1.5 text-[10px]">
                                        <div className={`flex items-center gap-1 ${v.doorStatus === 'open' ? 'text-red-400' : 'text-slate-400'}`}>
                                            <DoorOpen className="w-3 h-3" />
                                            {v.doorStatus || '—'}
                                        </div>
                                        <div className={`flex items-center gap-1 ${v.vibration > 80 ? 'text-red-400' : 'text-slate-400'}`}>
                                            <Vibrate className="w-3 h-3" />
                                            {v.vibration || 0}
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <Radio className="w-3 h-3" />
                                            {v.ignition ? 'ON' : 'OFF'}
                                        </div>
                                    </div>
                                )}

                                {activeRoute && (
                                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400">
                                        <Navigation className="w-3 h-3" />
                                        <span>Route {activeRoute.status}</span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Center — Map */}
            <div className="flex-1 relative">
                <div ref={mapRef} className="w-full h-full min-h-[400px] lg:min-h-0" />

                {/* Map overlay — Active routes legend */}
                {activeRoutes.length > 0 && (
                    <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 text-xs">
                        <p className="text-slate-300 font-semibold mb-2">Active Routes</p>
                        {activeRoutes.map(r => (
                            <div key={r._id} className="flex items-center gap-2 text-slate-400 mb-1">
                                <div className={`w-4 h-0.5 ${r.status === 'in-progress' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                <span>{r.vehicleId}</span>
                                <span className="capitalize text-[10px]">{r.status}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Right Sidebar — Alerts */}
            <div className="w-full lg:w-[280px] xl:w-[320px] flex-shrink-0 overflow-y-auto border-l border-slate-800/50 bg-slate-950/80 backdrop-blur-sm">
                <div className="p-4 border-b border-slate-800/50">
                    <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-bold text-white">Live Alerts</h3>
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded-full">
                            {alerts.filter(a => !a.acknowledged).length}
                        </span>
                    </div>
                </div>

                <div className="p-2 space-y-1">
                    {alerts.length === 0 ? (
                        <div className="text-center py-8">
                            <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <p className="text-slate-500 text-xs">No alerts</p>
                        </div>
                    ) : (
                        alerts.map((alert, i) => (
                            <div
                                key={alert._id || i}
                                className={`p-2.5 rounded-lg border-l-2 ${alertLevelColor(alert.level)} ${alert.acknowledged ? 'opacity-50' : ''} transition-all`}
                            >
                                <div className="flex items-start gap-2">
                                    {alertTypeIcon(alert.type)}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[10px] font-semibold text-slate-300 uppercase">
                                                {(alert.type || 'alert').replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-[9px] text-slate-500">
                                                {alert.vehicleId}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 leading-snug truncate">{alert.message}</p>
                                        <p className="text-[9px] text-slate-500 mt-0.5">
                                            {alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString() : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
