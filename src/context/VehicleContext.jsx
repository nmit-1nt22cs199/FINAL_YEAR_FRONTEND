import { createContext, useContext, useEffect, useState } from 'react';
import { connectSocket } from '../socketConnection';
import { useAuth } from './AuthContext';
import { getMySessions } from '../api/api';

const API_BASE = import.meta.env.VITE_API_URL + '/api';

const VehicleContext = createContext(null);

export function VehicleProvider({ children }) {
    const { user, role, token } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [telemetry, setTelemetry] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch alerts-related sessions for non-admins
    useEffect(() => {
        if (role && role !== 'admin' && token) {
            getMySessions(token).then(res => {
                if (res?.data?.data) {
                    setSessions(res.data.data);
                }
            }).catch(err => console.error("Failed to fetch sessions for alert filtering", err));
        }
    }, [role, token]);

    // Derive accessible vehicle IDs (string IDs like 'VEH-001')
    const accessibleVehicleIds = role === 'admin' ? null : (() => {
        const ids = new Set();
        // Add vehicles from active sessions
        sessions.forEach(s => {
            if (s.status === 'in-progress' || s.status === 'pending') {
                // We need the string vehicleId. Assuming s.vehicleId is populated or we can match it.
                // If s.vehicleId is an object (populated), use s.vehicleId.vehicleId
                // If it's an ID, we'll need to find it in the vehicles list.
                const vId = typeof s.vehicleId === 'object' ? s.vehicleId.vehicleId : null;
                if (vId) ids.add(vId);
                else {
                    // Search in vehicles state by _id
                    const v = vehicles.find(v => v._id === s.vehicleId);
                    if (v) ids.add(v.vehicleId);
                }
            }
        });
        return Array.from(ids);
    })();

    const filteredAlerts = role === 'admin' || !accessibleVehicleIds
        ? alerts
        : alerts.filter(a => accessibleVehicleIds.includes(a.vehicleId));

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
        const refreshSessions = () => {
            if (role && role !== 'admin' && token) {
                getMySessions(token).then(res => {
                    if (res?.data?.data) {
                        setSessions(res.data.data);
                    }
                }).catch(err => console.error("Failed to refresh sessions", err));
            }
        };

        socket.on('transfer_initiated', (data) => {
            console.log('[VehicleContext] 💰 Transfer Initiated:', data);
            refreshSessions();
        });

        socket.on('transfer_verified', (data) => {
            console.log('[VehicleContext] ✅ Transfer Verified:', data);
            refreshSessions();
        });

        socket.on('transfer_status', (data) => {
            console.log('[VehicleContext] 💰 Transfer Status Update:', data);
            refreshSessions();
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

    const filteredVehicles = role === 'admin' || !accessibleVehicleIds
        ? vehiclesWithTelemetry
        : vehiclesWithTelemetry.filter(v => accessibleVehicleIds.includes(v.vehicleId));

    const filteredTelemetry = role === 'admin' || !accessibleVehicleIds
        ? telemetry
        : telemetry.filter(t => accessibleVehicleIds.includes(t.vehicleId));

    const value = {
        vehicles: filteredVehicles,
        rawVehicles: vehicles,
        telemetry: filteredTelemetry,
        alerts: filteredAlerts,
        accessibleVehicleIds,
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
