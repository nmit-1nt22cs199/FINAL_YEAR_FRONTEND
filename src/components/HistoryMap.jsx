import { useEffect, useRef, useState } from "react";
import { OlaMaps } from "olamaps-web-sdk";

// Polyline Decoder (same as Navigate.jsx)
function decodePolyline(encoded) {
    let index = 0,
        lat = 0,
        lng = 0,
        coordinates = [];

    while (index < encoded.length) {
        let b,
            shift = 0,
            result = 0;

        // Decode latitude
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const deltaLat = (result & 1) ? ~(result >> 1) : result >> 1;
        lat += deltaLat;

        // Decode longitude
        shift = 0;
        result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const deltaLng = (result & 1) ? ~(result >> 1) : result >> 1;
        lng += deltaLng;

        coordinates.push([lng / 1e5, lat / 1e5]);
    }

    return coordinates;
}

/**
 * HistoryMap - Visualizes vehicle travel history using Ola Maps
 * Uses actual GPS points to draw polyline (no routing API needed)
 */
export default function HistoryMap({ locations = [], vehicleId }) {
    const mapRef = useRef(null);
    const [mapError, setMapError] = useState(null);

    useEffect(() => {
        if (!locations || locations.length === 0) {
            return;
        }

        const apiKey = import.meta.env.VITE_OLA_MAPS_API_KEY || "";

        if (!apiKey) {
            setMapError("Ola Maps API key not configured");
            return;
        }

        let map = null;

        const initMap = () => {
            try {
                const olaInstance = new OlaMaps({ apiKey });

                // Calculate center point (middle of route)
                const centerLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
                const centerLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;

                // Initialize map
                map = olaInstance.init({
                    style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
                    container: mapRef.current,
                    center: [centerLng, centerLat],
                    zoom: 10,
                });

                map.on("load", () => {
                    // Convert locations to GeoJSON coordinates [lng, lat]
                    const coordinates = locations.map(loc => [loc.lng, loc.lat]);

                    // Add route source
                    map.addSource("route", {
                        type: "geojson",
                        data: {
                            type: "Feature",
                            geometry: {
                                type: "LineString",
                                coordinates: coordinates,
                            },
                        },
                    });

                    // Add route layer (polyline)
                    map.addLayer({
                        id: "routeLine",
                        type: "line",
                        source: "route",
                        paint: {
                            "line-color": "#007AFF",
                            "line-width": 4,
                            "line-opacity": 0.8,
                        },
                    });

                    // Add start marker (green)
                    const startLoc = locations[0];
                    new window.OlaMaps.Marker({ color: "#10b981" })
                        .setLngLat([startLoc.lng, startLoc.lat])
                        .setPopup(
                            new window.OlaMaps.Popup().setHTML(
                                `<div style="padding: 8px;">
                  <strong>Start</strong><br/>
                  ${new Date(startLoc.timestamp).toLocaleString()}
                </div>`
                            )
                        )
                        .addTo(map);

                    // Add end marker (red)
                    const endLoc = locations[locations.length - 1];
                    new window.OlaMaps.Marker({ color: "#ef4444" })
                        .setLngLat([endLoc.lng, endLoc.lat])
                        .setPopup(
                            new window.OlaMaps.Popup().setHTML(
                                `<div style="padding: 8px;">
                  <strong>End</strong><br/>
                  ${new Date(endLoc.timestamp).toLocaleString()}
                </div>`
                            )
                        )
                        .addTo(map);

                    // Fit map to show entire route
                    const bounds = coordinates.reduce(
                        (bounds, coord) => {
                            return [
                                [Math.min(bounds[0][0], coord[0]), Math.min(bounds[0][1], coord[1])],
                                [Math.max(bounds[1][0], coord[0]), Math.max(bounds[1][1], coord[1])],
                            ];
                        },
                        [
                            [coordinates[0][0], coordinates[0][1]],
                            [coordinates[0][0], coordinates[0][1]],
                        ]
                    );

                    map.fitBounds(bounds, { padding: 50 });
                });

            } catch (error) {
                console.error("Error initializing Ola Maps:", error);
                setMapError("Failed to load map: " + error.message);
            }
        };

        initMap();

        // Cleanup
        return () => {
            if (map) {
                try {
                    map.remove();
                } catch (e) {
                    console.error("Error removing map:", e);
                }
            }
        };
    }, [locations]);

    if (mapError) {
        return (
            <div className="w-full h-[500px] bg-slate-100 rounded-lg flex items-center justify-center border border-slate-300">
                <div className="text-center p-4">
                    <p className="text-red-600 font-medium">{mapError}</p>
                    <p className="text-slate-500 text-sm mt-2">Check console for details</p>
                </div>
            </div>
        );
    }

    if (!locations || locations.length === 0) {
        return (
            <div className="w-full h-[500px] bg-slate-100 rounded-lg flex items-center justify-center border border-slate-300">
                <div className="text-center">
                    <p className="text-slate-600 text-lg">No location data available</p>
                    <p className="text-slate-500 text-sm mt-2">Select a vehicle and date range to view history</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={mapRef}
            className="w-full h-[500px] rounded-lg border border-slate-300 shadow-sm"
        />
    );
}
