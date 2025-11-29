                  ┌─────────────────────────────────────────┐
                  │             FRONTEND (React)            │
                  │-----------------------------------------│
                  │ - Dashboard (stats + alerts)            │
                  │ - Live Tracking (Ola Maps + markers)    │
                  │ - History Playback                      │
                  │ - Vehicle Registration                  │
                  │ - Alerts Management                     │
                  └───────────────▲───────────┬────────────┘
                                  │socket.io   │ REST API
                                  │            │
                                  │            │
        ┌─────────────────────────┴────────────▼──────────────────────────────┐
        │                         BACKEND (Node.js/Express)                   │
        │---------------------------------------------------------------------│
        │ ROUTES:                                                             │
        │  • /api/telemetry/update  ←–– DRIVER APP telemetry                  │
        │  • /api/trips/start       ←–– Start trip                            │
        │  • /api/trips/end         ←–– End trip                              │
        │  • /api/alerts/sos        ←–– Driver SOS                            │
        │                                                                  NEW │
        │  • /api/iot/telemetry     ←–– IoT ESP32 telemetry                   │
        │  • /api/iot/alerts        ←–– IoT alerts (overheat, vibration)      │
        │                                                                  NEW │
        │ CONTROLLERS:                                                        │
        │  - appTelemetryController                                           │
        │  - iotTelemetryController                                           │
        │  - alertController                                                  │
        │                                                                     │
        │ SOCKET.IO BROADCASTS:                                              │
        │  - io.emit("vehicle-location", data)                                │
        │  - io.emit("alert", alert)                                          │
        │                                                                     │
        │ DATABASE (MongoDB):                                                 │
        │  - Vehicle Model                                                    │
        │  - Alert Model   (*now includes source: app/iot*)                   │
        │  - Telemetry Model (*temperature, vibration, fuel*)                 │
        └──────────▲─────────────────────────────────────────────▲────────────┘
                   │                                              │
                   │ REST API                                     │ WebSocket (Optional)
                   │                                              │
        ┌──────────┴────────────┐                     ┌───────────┴───────────┐
        │     DRIVER APP        │                     │        IoT ESP32       │
        │   (React Native)      │                     │        Hardware        │
        │------------------------│                     │------------------------│
        │ Sends:                 │                     │ Sends:                 │
        │  - GPS location        │                     │  - GPS (lat,lng)       │
        │  - Speed               │                     │  - Speed               │
        │  - SOS button          │                     │  - Temperature         │
        │  - Start/End trip      │                     │  - Vibration/Shock     │
        │                        │                     │  - Fuel sensor         │
        │ Uses mobile data       │                     │ Uses WiFi/4G module    │
        └──────────┬─────────────┘                     └───────────┬───────────┘
                   │ (JSON)                                         │ (JSON)
                   │                                                │
                   └───────────────────────────────┬───────────────┘
                                                   │
                                                   ▼
                              ┌───────────────────────────────┐
                              │     REAL-TIME DATA FUSION     │
                              │-------------------------------│
                              │ Backend merges app + IoT data │
                              │ Priority: IoT over app speed  │
                              │ Unified vehicle state sent to │
                              │ frontend in real-time         │
                              └───────────────────────────────┘
