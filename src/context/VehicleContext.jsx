import { createContext, useContext, useEffect, useState } from 'react';
import { connectSocket } from '../socketConnection';

const API_BASE = import.meta.env.VITE_API_URL + '/api';

const VehicleContext = createContext(null);

export function VehicleProvider({ children }) {
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

                console.log('[VehicleContext] 🔄 Fetching initial data from backend...');

                const [vehiclesRes, telemetryRes, alertsRes] = await Promise.all([
                    fetch(`${API_BASE}/vehicles`).then(r => r.json()),
                    fetch(`${API_BASE}/telemetry`).then(r => r.json()),
                    fetch(`${API_BASE}/alerts`).then(r => r.json())
                ]);

                setVehicles(vehiclesRes.data || []);
                setTelemetry(telemetryRes.data || []);
                setAlerts(alertsRes.data || []);
                setError(null);

                console.log('[VehicleContext] ✅ Initial data loaded successfully');
            } catch (err) {
                console.error('[VehicleContext] ❌ Error fetching initial data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        // Connect to Socket.IO for real-time updates
        const socket = connectSocket();

        socket.on('connect', () => {
            console.log('[VehicleContext] ✅ Socket connected:', socket.id);
        });

        socket.on('vehicle:telemetry', (data) => {
            setTelemetry(prev => {
                const filtered = prev.filter(t => t.vehicleId !== data.vehicleId);
                return [data, ...filtered];
            });
        });

        socket.on('vehicle:location', (data) => {
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
            console.log('[VehicleContext] 🚨 Received alert:', alert);
            setAlerts(prev => [alert, ...prev]);
        });

        socket.on('alert:acked', (updatedAlert) => {
            console.log('[VehicleContext] ✓ Alert acknowledged:', updatedAlert);
            setAlerts(prev =>
                prev.map(a =>
                    a._id === updatedAlert._id
                        ? updatedAlert
                        : a
                )
            );
        });

        // --- CASH TRANSFER EVENTS ---
        socket.on('transfer_initiated', (data) => {
            console.log('[VehicleContext] 💰 Transfer Initiated:', data);
            // Optionally add to alerts or just a toast
        });

        socket.on('transfer_verified', (data) => {
            console.log('[VehicleContext] ✅ Transfer Verified:', data);
        });

        socket.on('unlock', (data) => {
            console.log('[VehicleContext] 🔓 UNLOCK COMMAND:', data);
            // Trigger some UI feedback
            const unlockAlert = {
                _id: Date.now().toString(),
                type: 'Unlock',
                message: `Unlock command sent to vehicle ${data.vehicleId}`,
                level: 'success',
                timestamp: new Date().toISOString(),
                vehicleId: data.vehicleId
            };
            setAlerts(prev => [unlockAlert, ...prev]);
        });


        socket.on('disconnect', () => {
            console.log('[VehicleContext] ❌ Socket disconnected');
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
            // Ensure backward compatibility
            speed: latestTelemetry?.speed || 0,
            fuel: latestTelemetry?.fuel || 0,
            temperature: latestTelemetry?.temperature || 0,
            location: latestTelemetry?.location || null,
            timestamp: latestTelemetry?.timestamp || vehicle.createdAt
        };
    });

    const acknowledgeAlert = async (alertId, acknowledgedBy, note) => {
        try {
            console.log('[VehicleContext] 🔔 Acknowledging alert:', alertId);

            const response = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acknowledgedBy, note })
            });

            if (!response.ok) {
                throw new Error('Failed to acknowledge alert');
            }

            const result = await response.json();

            // Optimistically update
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
            console.error('[VehicleContext] ❌ Error acknowledging alert:', err);
            throw err;
        }
    };

    const value = {
        vehicles: vehiclesWithTelemetry,
        rawVehicles: vehicles,
        telemetry,
        alerts,
        loading,
        error,
        acknowledgeAlert
    };

    return (
        <VehicleContext.Provider value={value}>
            {children}
        </VehicleContext.Provider>
    );
}

export const useVehicleContext = () => {
    const context = useContext(VehicleContext);
    if (!context) {
        throw new Error('useVehicleContext must be used within a VehicleProvider');
    }
    return context;
};
