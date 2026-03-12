import { API } from './api.js';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api';

/**
 * Assign a route to a vehicle
 */
export async function assignRoute(data, token = null) {
    // data: { vehicleId, origin: {lat, lng, address}, destination: {lat, lng, address}, waypoints, assignedBy }
    return API.post('/routes/assign', data, token);
}

/**
 * Get the active route for a vehicle
 */
export async function getActiveRoute(vehicleId, token = null) {
    return API.get(`/routes/active/${vehicleId}`, token);
}

/**
 * Get all routes, optionally filtered
 */
export async function getRoutes(params = {}, token = null) {
    const query = new URLSearchParams(params).toString();
    return API.get(`/routes${query ? `?${query}` : ''}`, token);
}

/**
 * Complete a route
 */
export async function completeRoute(routeId, token = null) {
    return API.put(`/routes/${routeId}/complete`, {}, token);
}

/**
 * Cancel a route
 */
export async function cancelRoute(routeId, token = null) {
    return API.put(`/routes/${routeId}/cancel`, {}, token);
}
