import { useEffect, useRef, useState } from 'react';
import { initSocket, getSocket } from './socket';

/**
 * useVehicleTracking
 * - connects to socket via initSocket()
 * - listens to backend events:
 *   - 'vehicle:location' -> { vehicleId, lat, lng, timestamp }
 *   - 'vehicle:telemetry' -> { vehicleId, speed, temperature, fuel, timestamp }
 *   - 'vehicle:alert' -> { vehicleId, type, message, level, timestamp }
 *
 * Exposes:
 * - vehicles: { [vehicleId]: { lat, lng, speed, temperature, fuel, alerts: [], lastUpdated }}
 * - latestUpdateTime: unix ms of last received update
 * - activeAlerts: array of alerts
 * - connectionStatus
 */
export default function useVehicleTracking() {
  const [vehiclesState, setVehiclesState] = useState({});
  const [latestUpdateTime, setLatestUpdateTime] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const vehiclesRef = useRef({});

  useEffect(() => {
    const socket = initSocket();

    function safeUpdateVehicle(vehicleId, patch = {}) {
      if (!vehicleId) return;
      const prev = vehiclesRef.current[vehicleId] || { alerts: [] };
      const updated = { ...prev, ...patch, alerts: prev.alerts || [] };
      vehiclesRef.current[vehicleId] = updated;
      setVehiclesState({ ...vehiclesRef.current });
    }

    function handleLocation(payload) {
      // payload: { vehicleId, lat, lng, timestamp }
      if (!payload) return;
      const vehicleId = payload.vehicleId || payload.id;
      if (!vehicleId) return;
      const lat = Number(payload.lat);
      const lng = Number(payload.lng);
      const ts = payload.timestamp ? Number(payload.timestamp) : Date.now();
      safeUpdateVehicle(vehicleId, { lat, lng, lastUpdated: ts });
      setLatestUpdateTime((prev) => Math.max(prev || 0, ts));
    }

    function handleTelemetry(payload) {
      // payload: { vehicleId, speed, temperature, fuel, timestamp }
      if (!payload) return;
      const vehicleId = payload.vehicleId || payload.id;
      if (!vehicleId) return;
      const ts = payload.timestamp ? Number(payload.timestamp) : Date.now();
      const speed = payload.speed != null ? Number(payload.speed) : undefined;
      const temperature = payload.temperature != null ? Number(payload.temperature) : undefined;
      const fuel = payload.fuel != null ? Number(payload.fuel) : undefined;
      safeUpdateVehicle(vehicleId, { speed, temperature, fuel, lastUpdated: ts });
      setLatestUpdateTime((prev) => Math.max(prev || 0, ts));
    }

    function handleAlert(payload) {
      // payload: { vehicleId, type, message, level, timestamp }
      if (!payload) return;
      const vehicleId = payload.vehicleId || payload.id;
      if (!vehicleId) return;
      const ts = payload.timestamp ? Number(payload.timestamp) : Date.now();
      const alert = { vehicleId, type: payload.type, message: payload.message, level: payload.level, timestamp: ts };
      // append to active alerts
      setActiveAlerts((prev) => [alert, ...prev]);
      // add to vehicle alerts
      const prev = vehiclesRef.current[vehicleId] || { alerts: [] };
      const updatedAlerts = [alert, ...(prev.alerts || [])];
      vehiclesRef.current[vehicleId] = { ...prev, alerts: updatedAlerts, lastUpdated: ts };
      setVehiclesState({ ...vehiclesRef.current });
      setLatestUpdateTime((prev) => Math.max(prev || 0, ts));
    }

    function handleConnect() {
      console.log('[useVehicleTracking] socket connected');
      setConnectionStatus('connected');
    }

    function handleDisconnect(reason) {
      console.log('[useVehicleTracking] socket disconnected', reason);
      setConnectionStatus('disconnected');
    }

    function handleConnectError(err) {
      console.error('[useVehicleTracking] connect_error', err);
      setConnectionStatus('error');
    }

    // Register handlers
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    socket.on('vehicle:location', handleLocation);
    socket.on('vehicle:telemetry', handleTelemetry);
    socket.on('vehicle:alert', handleAlert);

    // If socket already connected
    const curr = getSocket();
    if (curr && curr.connected) {
      setTimeout(() => setConnectionStatus('connected'), 0);
    }

    return () => {
      try {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('connect_error', handleConnectError);
        socket.off('vehicle:location', handleLocation);
        socket.off('vehicle:telemetry', handleTelemetry);
        socket.off('vehicle:alert', handleAlert);
      } catch (e) {
        console.warn('[useVehicleTracking] cleanup error', e);
      }
    };
  }, []);

  return { vehicles: vehiclesState, latestUpdateTime, activeAlerts, connectionStatus };
}
