import { useEffect, useState } from 'react';
import { connectSocket } from './socketConnection';

const API_BASE = import.meta.env.VITE_API_URL + '/api';

export default function useVehicleData() {
    const [vehicles, setVehicles] = useState([]);
    const [telemetry, setTelemetry] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch initial data from REST API
        const fetchInitialData = async () => {
            try {
                setLoading(true);

                console.log('[useVehicleData] 🔄 Fetching initial data from backend...');

                const [vehiclesRes, telemetryRes, alertsRes] = await Promise.all([
                    fetch(`${API_BASE}/vehicles`).then(r => r.json()),
                    fetch(`${API_BASE}/telemetry`).then(r => r.json()),
                    fetch(`${API_BASE}/alerts`).then(r => r.json())
                ]);

                console.log('[useVehicleData] 📦 Vehicles:', vehiclesRes.data);
                console.log('[useVehicleData] 📡 Telemetry:', telemetryRes.data);
                console.log('[useVehicleData] 🚨 Alerts:', alertsRes.data);

                setVehicles(vehiclesRes.data || []);
                setTelemetry(telemetryRes.data || []);
                setAlerts(alertsRes.data || []);
                setError(null);

                console.log('[useVehicleData] ✅ Initial data loaded successfully');
            } catch (err) {
                console.error('[useVehicleData] ❌ Error fetching initial data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        // Connect to Socket.IO for real-time updates
        const socket = connectSocket();

        socket.on('connect', () => {
            console.log('[useVehicleData] ✅ Socket connected:', socket.id);
        });

        socket.on('vehicle:telemetry', (data) => {
            console.log('[useVehicleData] 📡 Received telemetry update:', data);

            setTelemetry(prev => {
                const filtered = prev.filter(t => t.vehicleId !== data.vehicleId);
                return [data, ...filtered];
            });
        });

        socket.on('vehicle:location', (data) => {
            console.log('[useVehicleData] 📍 Received location update:', data);

            setTelemetry(prev => {
                const existing = prev.find(t => t.vehicleId === data.vehicleId);
                if (existing) {
                    return prev.map(t =>
                        t.vehicleId === data.vehicleId
                            ? { ...t, location: data.location, timestamp: data.timestamp }
                            : t
                    );
                }
                return [data, ...prev];
            });
        });

        socket.on('vehicle:alert', (alert) => {
            console.log('[useVehicleData] 🚨 Received alert:', alert);
            setAlerts(prev => [alert, ...prev]);
        });

        socket.on('alert:acked', (updatedAlert) => {
            console.log('[useVehicleData] ✓ Alert acknowledged:', updatedAlert);
            setAlerts(prev =>
                prev.map(a =>
                    a._id === updatedAlert._id
                        ? updatedAlert
                        : a
                )
            );
        });

        socket.on('disconnect', () => {
            console.log('[useVehicleData] ❌ Socket disconnected');
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Combine vehicles with their latest telemetry
    const vehiclesWithTelemetry = vehicles.map(vehicle => {
        const latestTelemetry = telemetry.find(t => t.vehicleId === vehicle.vehicleId);
        return {
            ...vehicle,
            ...latestTelemetry,
            // Ensure backward compatibility with Dashboard expectations
            speed: latestTelemetry?.speed || 0,
            fuel: latestTelemetry?.fuel || 0,
            temperature: latestTelemetry?.temperature || 0,
            location: latestTelemetry?.location || null,
            timestamp: latestTelemetry?.timestamp || vehicle.createdAt
        };
    });

    console.log('[useVehicleData] 🚗 Combined vehicles with telemetry:', vehiclesWithTelemetry);

    // Function to acknowledge an alert
    const acknowledgeAlert = async (alertId, acknowledgedBy, note) => {
        try {
            console.log('[useVehicleData] 🔔 Acknowledging alert:', alertId);

            const response = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ acknowledgedBy, note })
            });

            if (!response.ok) {
                throw new Error('Failed to acknowledge alert');
            }

            const result = await response.json();
            console.log('[useVehicleData] ✅ Alert acknowledged:', result);

            // Optimistically update local state
            setAlerts(prev =>
                prev.map(a =>
                    a._id === alertId
                        ? {
                            ...a,
                            acknowledged: true,
                            acknowledgedBy,
                            acknowledgmentNote: note,
                            acknowledgedAt: new Date().toISOString()
                        }
                        : a
                )
            );

            return result;
        } catch (err) {
            console.error('[useVehicleData] ❌ Error acknowledging alert:', err);
            throw err;
        }
    };

    return {
        vehicles: vehiclesWithTelemetry,
        rawVehicles: vehicles,
        telemetry,
        alerts,
        loading,
        error,
        acknowledgeAlert
    };
}
