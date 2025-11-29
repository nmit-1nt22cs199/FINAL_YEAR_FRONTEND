import { useEffect, useRef } from "react";
import { OlaMaps } from "olamaps-web-sdk";

// Polyline Decoder (Ola uses Google Encoded Polyline Algorithm)
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

export default function Navigate({ origin, destination, waypoints = [] }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!origin || !destination) {
      console.error("Missing origin/destination");
      return;
    }

    const apiKey = "dy2XUoKlCty24eGO3Lt2w5zuBvz4rcek0BFR73kQ";

    const olaInstance = new OlaMaps({ apiKey });

    const map = olaInstance.init({
      style:
        "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
      container: mapRef.current,
      center: [origin.lng, origin.lat],
      zoom: 12,
    });

    // --------------------------
    // Prepare Routing URL
    // --------------------------
    const wp = waypoints
      .map((wp) => `${wp.lat},${wp.lng}`)
      .join("%7C");

    const url = `https://api.olamaps.io/routing/v1/directions/basic?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}${
      wp ? `&waypoints=${wp}` : ""
    }&api_key=${apiKey}`;

    // --------------------------
    // Fetch Route
    // --------------------------
    const fetchRoute = async () => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "X-Request-Id": import.meta.env.SECRETID,
          },
        });

        const data = await res.json();
        // console.log("Route Data:", data);

        if (!data.routes || !data.routes[0]) {
          console.error("No route found");
          return;
        }

        // ✓ DECODE POLYLINE (Correct Fix)
        const encodedPolyline = data.routes[0].overview_polyline;
        const coords = decodePolyline(encodedPolyline);

        // --------------------------
        // Draw Polyline on Map
        // --------------------------
        map.on("load", () => {
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: coords,
              },
            },
          });

          map.addLayer({
            id: "routeLine",
            type: "line",
            source: "route",
            paint: {
              "line-color": "#007AFF",
              "line-width": 5,
            },
          });

          // --------------------------
          // Add Markers
          // --------------------------
          new window.OlaMaps.Marker()
            .setLngLat([origin.lng, origin.lat])
            .addTo(map);

          new window.OlaMaps.Marker()
            .setLngLat([destination.lng, destination.lat])
            .addTo(map);

          // --------------------------
          // Fit Map to Route
          // --------------------------
          let bounds = {
            minLng: Infinity,
            minLat: Infinity,
            maxLng: -Infinity,
            maxLat: -Infinity,
          };

          coords.forEach(([lng, lat]) => {
            bounds.minLng = Math.min(bounds.minLng, lng);
            bounds.minLat = Math.min(bounds.minLat, lat);
            bounds.maxLng = Math.max(bounds.maxLng, lng);
            bounds.maxLat = Math.max(bounds.maxLat, lat);
          });

          map.fitBounds(
            [
              [bounds.minLng, bounds.minLat],
              [bounds.maxLng, bounds.maxLat],
            ],
            { padding: 40 }
          );
        });
      } catch (e) {
        console.error("Route Fetch Failed:", e);
      }
    };

    fetchRoute();
  }, [origin, destination, waypoints]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[500px] rounded-xl border mt-20"
    />
  );
}
