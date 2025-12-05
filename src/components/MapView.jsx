import { useEffect, useRef, useState } from "react";
import { connectSocket } from "../socketConnection";

const API_BASE = import.meta.env.VITE_API_URL + "/api";

export default function MapView({
  followVehicleId = null,
  autoFit = false,
}) {
  const mapRef = useRef(null);
  const olaRef = useRef(null);
  const markersRef = useRef(new Map());
  const socketRef = useRef(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [vehicles, setVehicles] = useState([]);

  // --- FETCH INITIAL VEHICLE DATA FROM BACKEND ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [vehiclesRes, telemetryRes] = await Promise.all([
          fetch(`${API_BASE}/vehicles`).then(r => r.json()),
          fetch(`${API_BASE}/telemetry`).then(r => r.json())
        ]);

        const vehicleData = vehiclesRes.data || [];
        const telemetryData = telemetryRes.data || [];

        // Combine vehicles with their latest telemetry
        const combined = vehicleData.map(vehicle => {
          const telemetry = telemetryData.find(t => t.vehicleId === vehicle.vehicleId);
          return {
            vehicleId: vehicle.vehicleId,
            location: telemetry?.location || null,
            speed: telemetry?.speed || 0,
            temperature: telemetry?.temperature || 0,
            fuel: telemetry?.fuel || 0,
            offline: false
          };
        }).filter(v => v.location); // Only include vehicles with location data

        setVehicles(combined);
        console.log('[MapView] Loaded initial vehicles:', combined);
      } catch (error) {
        console.error('[MapView] Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, []);

  // --- CONNECT TO SOCKET FOR REAL-TIME UPDATES ---
  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[MapView] Socket connected');
    });

    socket.on('vehicle:telemetry', (data) => {
      console.log('[MapView] Received telemetry update:', data);

      setVehicles(prev => {
        const existing = prev.find(v => v.vehicleId === data.vehicleId);

        if (existing) {
          // Update existing vehicle
          return prev.map(v =>
            v.vehicleId === data.vehicleId
              ? {
                ...v,
                location: data.location || v.location,
                speed: data.speed ?? v.speed,
                temperature: data.temperature ?? v.temperature,
                fuel: data.fuel ?? v.fuel,
                offline: false
              }
              : v
          );
        } else {
          // Add new vehicle if it has location
          if (data.location) {
            return [...prev, {
              vehicleId: data.vehicleId,
              location: data.location,
              speed: data.speed || 0,
              temperature: data.temperature || 0,
              fuel: data.fuel || 0,
              offline: false
            }];
          }
          return prev;
        }
      });
    });

    socket.on('vehicle:location', (data) => {
      console.log('[MapView] Received location update:', data);

      setVehicles(prev =>
        prev.map(v =>
          v.vehicleId === data.vehicleId
            ? { ...v, location: data.location }
            : v
        )
      );
    });

    socket.on('vehicle_update', (data) => {
      console.log('[MapView] Received vehicle_update:', data);

      setVehicles(prev => {
        const existing = prev.find(v => v.vehicleId === data.vehicleId);

        if (existing) {
          return prev.map(v =>
            v.vehicleId === data.vehicleId
              ? {
                ...v,
                location: data.location || v.location,
                speed: data.speed ?? v.speed,
                temperature: data.temperature ?? v.temperature,
                offline: false
              }
              : v
          );
        } else if (data.location) {
          return [...prev, {
            vehicleId: data.vehicleId,
            location: data.location,
            speed: data.speed || 0,
            temperature: data.temperature || 0,
            offline: false
          }];
        }
        return prev;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // --- CUSTOM MARKER ELEMENT ---
  function createVehicleMarker(v) {
    const el = document.createElement("div");
    console.log(v);
    el.innerHTML = `
    <div class="custom-marker">
  <div class="pulse"></div>

  <div class="marker-content">
    ${Math.round(v.speed)} km/h • 
    ${Math.round(v.temperature)}°C • 
    ${v.fuel}% • 
    ${v.offline ? 'Offline' : 'Online'} • 
    ${v.vehicleId}
  </div>
</div>
<style>
.custom-marker {
  position: relative;
  width: max-content;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Pulse circle */
.pulse {
  position: absolute;
  width: 18px;
  height: 18px;
  background: #e8cdcdff;       /* red pulse */
  border-radius: 50%;
  animation: pulseAnim 1.5s infinite;
  z-index: 1;
}

/* Pointer arrow + info box */
.marker-content {
  position: relative;
  top: 22px;
  transform: translateX(-50%);
  left: 50%;
  background: #151836f2;
  padding: 3px 8px;
  font-size: 9px;
  border-radius: 4px;
  border: 2px solid #e0e6d8;
  color: #f3efef;
  font-weight: 600;
  white-space: nowrap;
  z-index: 2;
}

/* Pointer arrow */
.marker-content::after {
  content: "";
  position: absolute;
  top: -7px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 7px solid rgba(12, 8, 8, 0.95);
}

/* Pulse animation */
@keyframes pulseAnim {
  0% {
    transform: scale(0.9);
    opacity: 0.8;
  }
  50% {
    transform: scale(5.4);
    opacity: 0.4;
  }
  100% {
    transform: scale(0.9);
    opacity: 0.8;
  }
}

}
</style>
  `;

    return el;
  }

  // --- INIT MAP ---
  useEffect(() => {
    if (mapRef.current) return;

    const apiKey =
      import.meta.env.VITE_OLA_MAPS_API_KEY ||
      "";

    import("olamaps-web-sdk").then(({ OlaMaps }) => {
      const ola = new OlaMaps({ apiKey });
      olaRef.current = ola;

      const map = ola.init({
        container: "ola-map",
        center: [77.5946, 12.9716],
        zoom: 10,
        style:
          "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
      });

      mapRef.current = map;

      map.on("load", () => {
        setIsMapLoaded(true);
      });
    });
  }, []);

  // --- ADD / UPDATE MARKERS ---
  useEffect(() => {
    if (!mapRef.current || !olaRef.current || !isMapLoaded) return;

    const map = mapRef.current;
    const ola = olaRef.current;

    vehicles.forEach((v) => {
      if (!v.location?.lat || !v.location?.lng) return;

      const { vehicleId, location } = v;
      const { lat, lng } = location;

      const existing = markersRef.current.get(vehicleId);

      // --- UPDATE MARKER ---
      if (existing) {
        existing.marker.setLngLat([lng, lat]);

        existing.element.querySelector("div").innerHTML =
          `<div class="custom-marker">
  <div class="pulse"></div>

  <div class="marker-content">
    ${Math.round(v.speed)} km/h • 
    ${Math.round(v.temperature)}°C • 
    ${v.fuel}% • 
    ${v.offline ? 'Offline' : 'Online'} • 
    ${v.vehicleId}
  </div>
</div>
<style>
.custom-marker {
  position: relative;
  width: max-content;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Pulse circle */
.pulse {
  position: absolute;
  width: 18px;
  height: 18px;
  background: #ff4d4d;       /* red pulse */
  border-radius: 50%;
  animation: pulseAnim 1.5s infinite;
  z-index: 1;
}

/* Pointer arrow + info box */
.marker-content {
  position: relative;
  top: 22px;
  transform: translateX(-50%);
  left: 50%;
  background: #151836f2;
  padding: 3px 8px;
  font-size: 9px;
  border-radius: 4px;
  border: 2px solid #e0e6d8;
  color: #f3efef;
  font-weight: 600;
  white-space: nowrap;
  z-index: 2;
}

/* Pointer arrow */
.marker-content::after {
  content: "";
  position: absolute;
  top: -7px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 7px solid rgba(12, 8, 8, 0.95);
}

/* Pulse animation */
@keyframes pulseAnim {
  0% {
    transform: scale(0.9);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.6);
    opacity: 0.4;
  }
  100% {
    transform: scale(0.9);
    opacity: 0.8;
  }
}

}
</style>`;

        return;
      }

      // --- CREATE NEW MARKER ---
      const markerElement = createVehicleMarker(v);

      const marker = ola
        .addMarker({
          element: markerElement,
        })
        .setLngLat([lng, lat])
        .addTo(map);

      markersRef.current.set(vehicleId, {
        marker,
        element: markerElement,
      });
    });

    // --- REMOVE OLD MARKERS ---
    const currentIds = new Set(vehicles.map((x) => x.vehicleId));

    markersRef.current.forEach((entry, id) => {
      if (!currentIds.has(id)) {
        entry.marker.remove();
        markersRef.current.delete(id);
      }
    });
  }, [vehicles, isMapLoaded]);

  // --- FOLLOW VEHICLE ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !followVehicleId) return;

    const v = vehicles.find((x) => x.vehicleId === followVehicleId);

    if (v?.location) {
      map.setCenter([v.location.lng, v.location.lat]);
    }
  }, [followVehicleId, vehicles]);

  // --- AUTO FIT ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !autoFit || vehicles.length === 0) return;

    const coords = vehicles
      .filter((v) => v.location)
      .map((v) => [v.location.lng, v.location.lat]);

    if (coords.length < 1) return;

    const lons = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);

    const bounds = [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ];

    map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
  }, [autoFit, vehicles]);

  return (
    <div
      id="ola-map"
      className="w-full h-[100%] sm:h-[500px] md:h-[600px] lg:h-full rounded-xl mt-12 sm:mt-14 md:mt-16"
      style={{ borderRadius: "12px" }}
    ></div>
  );
}
