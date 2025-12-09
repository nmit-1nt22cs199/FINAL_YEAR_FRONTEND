const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';


/**
 * Fetch all geofences
 * @param {boolean} activeOnly - If true, only fetch active geofences
 * @returns {Promise<Array>} Array of geofence objects
 */
export const fetchGeofences = async (activeOnly = false) => {
    try {
        const url = activeOnly
            ? `${API_BASE_URL}/api/geofences?active=true`
            : `${API_BASE_URL}/api/geofences`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch geofences: ${response.statusText}`);
        }

        const data = await response.json();
        return data.geofences || [];
    } catch (error) {
        console.error('Error fetching geofences:', error);
        throw error;
    }
};

/**
 * Create a new geofence
 * @param {Object} geofenceData - Geofence data
 * @returns {Promise<Object>} Created geofence object
 */
export const createGeofence = async (geofenceData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/geofences`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(geofenceData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create geofence');
        }

        const data = await response.json();
        return data.geofence;
    } catch (error) {
        console.error('Error creating geofence:', error);
        throw error;
    }
};

/**
 * Update an existing geofence
 * @param {string} id - Geofence ID
 * @param {Object} updates - Updated geofence data
 * @returns {Promise<Object>} Updated geofence object
 */
export const updateGeofence = async (id, updates) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/geofences/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            throw new Error('Failed to update geofence');
        }

        const data = await response.json();
        return data.geofence;
    } catch (error) {
        console.error('Error updating geofence:', error);
        throw error;
    }
};

/**
 * Delete a geofence
 * @param {string} id - Geofence ID
 * @returns {Promise<void>}
 */
export const deleteGeofence = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/geofences/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete geofence');
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting geofence:', error);
        throw error;
    }
};

/**
 * Toggle geofence active status
 * @param {string} id - Geofence ID
 * @returns {Promise<Object>} Updated geofence object
 */
export const toggleGeofence = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/geofences/${id}/toggle`, {
            method: 'PATCH',
        });

        if (!response.ok) {
            throw new Error('Failed to toggle geofence');
        }

        const data = await response.json();
        return data.geofence;
    } catch (error) {
        console.error('Error toggling geofence:', error);
        throw error;
    }
};
