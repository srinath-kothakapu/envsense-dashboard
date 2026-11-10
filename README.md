# EnvSense Dashboard

A real-time **environmental sensor monitoring dashboard** built with React. It visualises temperature, humidity, pressure and CO₂ from multiple sensor nodes, raises threshold alerts, and imports/exports data as CSV, so it can sit on top of embedded projects such as STM32 or Raspberry Pi data loggers.

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
