import { useEffect, useRef, useState } from "react";
import { connectSocket, getSocket } from "./socketConnection";

export default function useVehicleSocket() {
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const vehiclesMapRef = useRef(new Map());

  useEffect(() => {
    const socket = connectSocket();

    socket.on("connect", () => {
      setConnectionStatus("connected");
      console.log("[Socket] Connected");
    });

    socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });

    socket.on("connect_error", (err) => {
      console.error(err);
      setConnectionStatus("error");
    });

    // -------------------------
    // VEHICLE UPDATE
    // -------------------------
    socket.on("vehicle_update", (data) => {
      if (!data) return;

      const vehicleId =
        data.vehicleId || data.id || data.vehicle_id || "unknown";

      const location = {
        lat: data.location?.lat ?? data.lat,
        lng: data.location?.lng ?? data.lng,
      };

      const normalized = {
        vehicleId,
        location,
        speed: data.speed,
        temperature: data.temperature,
        offline: false,
      };

      vehiclesMapRef.current.set(vehicleId, normalized);
      setVehicles([...vehiclesMapRef.current.values()]);
    });

    // -------------------------
    // ALERT TRIGGERED
    // -------------------------
    socket.on("alert_triggered", (alert) => {
      setAlerts((prev) => [alert, ...prev]);
    });

    // -------------------------
    // VEHICLE OFFLINE
    // -------------------------
    socket.on("vehicle_offline", ({ vehicleId }) => {
      const v = vehiclesMapRef.current.get(vehicleId);
      if (v) {
        v.offline = true;
      }
      setVehicles([...vehiclesMapRef.current.values()]);
      setAlerts((a) => [{ type: "vehicle_offline", vehicleId }, ...a]);
    });
  }, []);

  return { vehicles, alerts, connectionStatus };
}
