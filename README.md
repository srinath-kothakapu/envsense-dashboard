# EnvSense Dashboard

EnvSense is a browser-based dashboard for exploring environmental telemetry from several sensor nodes. It brings temperature, relative humidity, atmospheric pressure, and CO2 readings together in a time-series view, with per-device comparisons, rolling statistics, configurable limits, and readable alerts.

The application is intentionally self-contained: it starts with a deterministic in-browser sensor simulator, so you can run the complete interface without a microcontroller, database, or API. You can also import a CSV recording, inspect it with the same charts and threshold logic, and export the readings. The simulator makes this a practical UI and data-flow demo; it is not a connection to real environmental sensors.

## At a glance

| | |
|---|---|
| Application | React single-page web dashboard |
| Development server | Vite; local URL is `http://localhost:5173` |
| Default source | Three deterministic simulated sensor nodes |
| Available metrics | Temperature (C), relative humidity (%), pressure (hPa), CO2 (ppm) |
| History | Rolling live window per device; CSV files can be reviewed as a separate source |
| Tests | Vitest and Testing Library |

## What the dashboard does

- **Streams simulated readings.** Three virtual nodes represent a lab bench, server room, and vehicle cabin. A seeded, mean-reverting random walk produces believable changes and occasional spikes. The live view starts with a short prefilled history and then adds a reading about once per second.
- **Compares devices over time.** Recharts displays each metric as a timeline with a separate series for each node. A bounded rolling window keeps the live view focused on recent history.
- **Summarizes current conditions.** Metric cards show the latest reading and rolling minimum, average, and maximum, together with whether a configured range is currently satisfied.
- **Alerts on transitions.** A notification is emitted when a device's metric enters a high or low threshold breach. Further out-of-range samples do not repeatedly create the same alert; the condition is re-armed when the reading returns to the allowed range.
- **Lets you adjust thresholds.** The controls update the metric limits used by the cards and alert logic.
- **Supports recorded data.** Import a CSV file to inspect historical readings and calculate threshold events across the imported samples. You can pause the live stream, clear the alert list, switch back to simulated live data, and export readings in CSV form.

## How data flows

```text
Seeded browser simulator ─┐
                          ├──> useTelemetry ───> metric cards
Imported CSV file ────────┘         │             time-series charts
                                    └───────────> threshold alerts
                                                       │
                                                       └──> alert panel
```

The simulator is the only live data source in this repository. `useTelemetry` owns the rolling series, pause and source state, and alert history; the user interface renders that state. Sensor-specific decisions and CSV parsing live in small JavaScript modules so they can be tested independently of the React components.

## Quick start

### Requirements

- Node.js and npm versions supported by the installed Vite release
- A modern browser

### Install and run

```bash
git clone https://github.com/srinath-kothakapu/envsense-dashboard.git
cd envsense-dashboard
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). No account, external data source, database, API service, or hardware is needed. Try importing [`sample-data/sample-readings.csv`](sample-data/sample-readings.csv) to explore the historical-data flow.

### Test and build

```bash
npm test
npm run build
npm run preview
```

`npm test` runs the Vitest suite, including component tests and tests for the sensor, alert, series, and CSV utilities. `npm run build` creates the deployable static site in `dist/`; `npm run preview` serves that built site locally.

## Importing CSV data

The parser expects a header row and at least one following data row. Column names are case-insensitive. `timestamp` and at least one metric column are required.

| Column | Required? | Meaning |
|---|---|---|
| `timestamp` | Yes | ISO-8601 date/time or a numeric Unix timestamp in milliseconds |
| `device` | No | Device label; omitted or empty values become `imported` |
| `temperature` | One or more metrics required | Temperature in C |
| `humidity` | One or more metrics required | Relative humidity in percent |
| `pressure` | One or more metrics required | Pressure in hPa |
| `co2` | One or more metrics required | CO2 concentration in ppm |

Each row may include any subset of the four metric columns; blank metric cells are left absent. Rows with invalid timestamps are skipped and reported. A row containing a non-numeric supplied metric is skipped and reported. Parsed readings are ordered by timestamp before they are displayed. The CSV parser uses simple comma-separated fields and does not support quoted values containing commas.

Example:

```csv
timestamp,device,temperature,humidity,pressure,co2
2026-03-20T10:00:00Z,node-01,23.4,41,1012,612
2026-03-20T10:00:01Z,node-02,24.1,43,,
```

Use the sample file as the canonical working example for importing and exporting records.

## Threshold and alert behavior

Thresholds define a minimum and maximum for each metric. Values above the maximum are high breaches; values below the minimum are low breaches. Missing values are not evaluated. Alert detection keeps the active breach state by device and metric, so one continuous breach produces one entry rather than one message per reading. If the metric returns to its allowed range, a later breach generates a new alert. For an imported file, the same transition rule is applied in timestamp order across that file.

These alerts are a demonstration of configurable monitoring logic. They are not safety alarms and should not be used as a substitute for calibrated instruments, validated operating limits, or a certified alarm system.

## Repository layout

```text
src/
  App.jsx                    Dashboard composition and source controls
  hooks/useTelemetry.js      Live/imported state, rolling readings, alert history
  components/
    StatCard.jsx             Latest values, ranges, and status
    TelemetryChart.jsx       Multi-device time-series chart
    AlertsPanel.jsx          Recent alert list
    ThresholdEditor.jsx      Editable metric limits
  lib/
    simulator.js             Reproducible virtual sensor nodes
    alerts.js                Threshold evaluation and edge-triggered events
    csv.js                   CSV parsing, validation, and export
    metrics.js               Metric names and units
    series.js                Time-series utilities
sample-data/
  sample-readings.csv        Example file for the import feature
```

## Technology

- React 19 and React DOM
- Vite for development and production builds
- Recharts for time-series visualizations
- Vitest, jsdom, and Testing Library for automated tests
- GitHub Actions for continuous integration

## Connecting a real sensor

There is no physical-device integration in the current version. A future adapter can replace the interval-based simulator in `src/hooks/useTelemetry.js` with an input that produces reading objects in the same shape:

```js
{
  timestamp: Date.now(),
  device: 'node-01',
  temperature: 23.4,
  humidity: 41,
  pressure: 1012,
  co2: 612
}
```

The charts, summaries, threshold evaluation, and CSV export can then continue to consume that shared reading shape. A real integration would need its own transport, reconnection behavior, data validation, and device identity policy; those are not provided here.

## Project status and limitations

- The bundled source is a deterministic simulator and a sample CSV, not measurements from live sensors.
- The live series and alert list are held in browser memory; this app does not persist data to a server.
- There is no backend, user account, access control, device authentication, or remote notification service.
- CSV import supports basic unquoted CSV fields and reports malformed rows; it is not a general-purpose spreadsheet importer.
- The configured thresholds are for demonstrating the interface, not calibrated environmental limits.

