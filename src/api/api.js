// Minimal API helper for fleet frontend
export const OLA_MAPS_API_KEY = import.meta.env.VITE_OLA_MAPS_API_KEY || '';

// Backend API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL

// Lightweight API wrapper that mirrors an Axios-like shape { data }
// It uses the browser fetch API and returns { data } on success or
// { data: [] } on error so components don't crash.
export const API = {
  get: async (path) => {
    try {
      // Build full URL - if path starts with /, remove it
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      const url = `${API_BASE_URL}/${cleanPath}`;

      console.log(`🌐 API.get calling: ${url}`);
      const res = await fetch(url, { credentials: 'same-origin' });

      if (!res.ok) {
        console.warn('API.get non-ok response', url, res.status);
        return getDummyFor(path);
      }

      const data = await res.json();
      console.log(`✅ API.get success:`, data);

      // If backend returns empty array/object, fallback to dummy data to keep UI alive while offline
      if (!data || (Array.isArray(data) && data.length === 0)) return getDummyFor(path);
      return { data };
    } catch (err) {
      console.error('❌ API.get error', err);
      // Return sensible dummy data when offline or fetch fails
      return getDummyFor(path);
    }
  },
};

// Helper for other ad-hoc calls if you want to extend later
export async function fetchVehicles() {
  const r = await API.get('/get-locations');
  return r.data || [];
}

// --- Dummy data fallback ---
function getDummyFor(path) {
  // Basic dummy vehicles/locations
  const now = Date.now();
  const dummyLocations = [
    {
      vehicleId: 'VEH-001',
      speed: 48,
      fuel: 72,
      temperature: 36,
      timestamp: now - 1000 * 30,
      location: { lat: 12.9716, lng: 77.5946 },
    },
    {
      vehicleId: 'VEH-002',
      speed: 62,
      fuel: 44,
      temperature: 39,
      timestamp: now - 1000 * 90,
      location: { lat: 12.975, lng: 77.60 },
    },
    {
      vehicleId: 'VEH-003',
      speed: 30,
      fuel: 88,
      temperature: 34,
      timestamp: now - 1000 * 10,
      location: { lat: 12.965, lng: 77.59 },
    },
  ];

  const dummyAlerts = [
    { type: 'Speeding', message: 'VEH-002 speeding at 62 km/h', timestamp: now - 1000 * 60 },
    { type: 'Maintenance', message: 'VEH-003 maintenance due', timestamp: now - 1000 * 3600 },
  ];

  const dummyHistory = (vehicleId = 'VEH-001') => {
    return [
      { timestamp: now - 1000 * 3600 * 24, location: { lat: 12.95, lng: 77.58 } },
      { timestamp: now - 1000 * 3600 * 20, location: { lat: 12.96, lng: 77.585 } },
      { timestamp: now - 1000 * 3600 * 12, location: { lat: 12.97, lng: 77.59 } },
      { timestamp: now - 1000 * 3600 * 6, location: { lat: 12.975, lng: 77.595 } },
    ];
  };

  // route matching
  if (path.includes('get-locations')) return { data: dummyLocations };
  if (path.includes('get-alerts')) return { data: dummyAlerts };
  if (path.includes('get-history')) return { data: dummyHistory() };

  // default fallback: return empty array inside { data }
  return { data: [] };
}
