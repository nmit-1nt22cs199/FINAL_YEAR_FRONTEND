import React from 'react';
import useVehicleSocket from '../useVehicleSocket';

export default function SocketDemo() {
  const { vehicles, alerts, connectionStatus } = useVehicleSocket();

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Socket Demo</h2>
      <div className="mb-4">Connection: <strong>{connectionStatus}</strong></div>

      <section className="mb-4">
        <h3 className="font-semibold">Vehicles ({vehicles.length})</h3>
        <ul className="space-y-2 mt-2">
          {vehicles.map((v) => (
            <li key={v.vehicleId} className="p-2 border rounded">
              <div><strong>{v.vehicleId}</strong> {v.offline ? '(offline)' : ''}</div>
              <div>Speed: {v.speed ?? '—'}</div>
              <div>Location: {v.location ? `${v.location.lat}, ${v.location.lng}` : '—'}</div>
              <div>Last: {v.timestamp ? new Date(v.timestamp).toLocaleString() : '—'}</div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="font-semibold">Alerts ({alerts.length})</h3>
        <ul className="space-y-2 mt-2">
          {alerts.map((a, idx) => (
            <li key={idx} className="p-2 border rounded bg-red-50">
              <div><strong>{a.type || a.title || 'Alert'}</strong></div>
              <div>{a.message || JSON.stringify(a)}</div>
              <div className="text-xs text-gray-500">{a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
