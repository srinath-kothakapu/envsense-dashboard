# EnvSense Dashboard

EnvSense is a real-time **environmental sensor monitoring dashboard** for following temperature, humidity, pressure and CO₂ across multiple sensor nodes. A shared timeline makes it easy to compare devices, while live readings, rolling statistics and editable thresholds help surface changing conditions as they happen.

The dashboard runs out of the box with a built-in simulator, so it can be explored without sensor hardware or a backend. It can also pause the live stream, load recorded readings from CSV, and export the data for further analysis. The simulator makes this a useful starting point for sensor prototypes and demonstrations; hardware integrations can replace its data source with a WebSocket, MQTT-over-WebSocket or Web Serial connection while reusing the dashboard's charts and alerts.

## Features

- **Live telemetry** from three simulated sensor nodes (deterministic, mean-reverting random walks with occasional spikes)
- **Multi-device charts** (Recharts) with min/max threshold lines per metric
- **Stat cards** with latest value, window min/avg/max and an in-range / too high / too low badge
- **Edge-triggered alerts**: one alert when a metric *enters* a breach, not one per sample
- **Editable thresholds** that apply immediately
- **CSV import / export**: drop in a log from a real logger and review it, with alerts computed over the whole file
- Pause/resume the stream; switch back to live from imported data

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit + component tests (Vitest)
npm run build    # production build in dist/
```

Try the import with [`sample-data/sample-readings.csv`](sample-data/sample-readings.csv).

## CSV format

| column | required | notes |
| --- | --- | --- |
| `timestamp` | yes | ISO 8601 string or epoch milliseconds |
| `device` | no | defaults to `imported` |
| `temperature`, `humidity`, `pressure`, `co2` | at least one | units: °C, %, hPa, ppm |

Rows with bad values are skipped and reported in the UI. Quoted fields are not supported.

## Project structure

```
src/
  lib/          pure logic: simulator, alerts, csv, series helpers (fully unit-tested)
  hooks/        useTelemetry: streaming, rolling window, alert log, import/live switching
  components/   StatCard, TelemetryChart, AlertsPanel, ThresholdEditor
  App.jsx       layout and wiring
```

## Connecting real hardware

The simulator is the only data source. To use real sensors, replace the `setInterval` in `src/hooks/useTelemetry.js` with a WebSocket, MQTT-over-WebSocket or Web Serial reader that produces objects shaped like `{ timestamp, device, temperature, humidity, pressure, co2 }`. Everything downstream (charts, alerts, export) stays the same.

## Tech stack

React 19 · Vite · Recharts · Vitest + Testing Library · GitHub Actions CI

## License

MIT
