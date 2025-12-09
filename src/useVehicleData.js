
import { useVehicleContext } from './context/VehicleContext';

// This hook now just wraps the context usage
// This ensures backward compatibility for components using useVehicleData()
export default function useVehicleData() {
    return useVehicleContext();
}
