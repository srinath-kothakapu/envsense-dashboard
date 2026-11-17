# EnvSense Dashboard

A browser dashboard for looking at environmental data from several sensor nodes: temperature, humidity, air pressure and CO2 over time. You can compare devices, see rolling statistics, set limits and get alerts.

It runs completely on its own. A sensor simulator in the browser produces the data (always the same sequence, because it's seeded), so you don't need a microcontroller, a database or an API to try it. You can also import a CSV recording, look at it with the same charts and limit checks, and export readings again. The simulator makes it a UI and data-flow demo; it is not connected to real sensors.

Short overview:

- React single-page app, Vite dev server on `http://localhost:5173`
- default data: three simulated sensor nodes
- metrics: temperature (°C), humidity (%), pressure (hPa), CO2 (ppm)
- rolling live window per device; CSV files can be loaded as a separate source
- tests with Vitest and Testing Library

## What it does

- **Simulated live data.** Three virtual nodes: a lab bench, a server room and a vehicle cabin. A seeded, mean-reverting random walk gives realistic changes and sometimes a spike. The live view starts with a bit of history already filled in and then adds about one reading per second.
- **Devices over time.** Recharts draws each metric as a timeline with one line per node. The live view only keeps a limited recent window.
- **Current state.** Cards show the latest value, the rolling min, average and max, and whether the value is inside the set range.
- **Alerts when something changes.** An alert fires when a device's metric goes above or below its limit. More out-of-range samples don't create the same alert again; it re-arms once the value is back in range.
- **Editable limits.** You can change the limits used by the cards and alerts.
- **Recorded data.** Import a CSV to look at old readings and get the limit events for the whole file. You can pause the live stream, clear the alerts, switch back to live data and export readings as CSV.

```text
seeded browser simulator --+
                           +--> useTelemetry --> metric cards
imported CSV file ---------+         |           charts
                                     +---------> limit alerts --> alert panel
```

The simulator is the only live source in this repo. `useTelemetry` holds the rolling series, the pause and source state and the alert history; the UI just renders it. The sensor logic and CSV parsing are in small JavaScript modules so I could test them without the React components.

## Quick start

You need Node.js and npm (a version the installed Vite supports) and a modern browser.

```bash
git clone https://github.com/srinath-kothakapu/envsense-dashboard.git
cd envsense-dashboard
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). No account, database, API or hardware needed. To try the import, load [`sample-data/sample-readings.csv`](sample-data/sample-readings.csv).

Tests and build:

```bash
npm test
npm run build
npm run preview
```

`npm test` runs the Vitest tests (components plus the sensor, alert, series and CSV code). `npm run build` creates the static site in `dist/`, and `npm run preview` serves it locally.

## CSV import

The file needs a header row and at least one data row. Column names are not case-sensitive. `timestamp` and at least one metric are required.

| Column | Required | Meaning |
|---|---|---|
| `timestamp` | yes | ISO date/time or Unix time in milliseconds |
| `device` | no | device name; empty becomes `imported` |
| `temperature` | at least one metric | °C |
| `humidity` | at least one metric | % |
| `pressure` | at least one metric | hPa |
| `co2` | at least one metric | ppm |

A row can have any subset of the four metrics; empty cells are just left out. Rows with a bad timestamp or a non-numeric metric are skipped and reported. The readings are sorted by time before they're shown. The parser only handles simple comma-separated fields, no quoted values with commas inside.

```csv
timestamp,device,temperature,humidity,pressure,co2
2026-03-20T10:00:00Z,node-01,23.4,41,1012,612
2026-03-20T10:00:01Z,node-02,24.1,43,,
```

The sample file is the best working example for import and export.

## How the alerts work

Each metric has a min and a max. Above the max is a high breach, below the min a low breach, and missing values are ignored. The alert logic remembers which device/metric is currently in breach, so one long breach gives one alert, not one per reading. When the value goes back into range and later breaks the limit again, you get a new alert. For an imported file the same rule runs through the file in time order.

These alerts show how configurable monitoring can work. They are not safety alarms and don't replace calibrated instruments or a certified alarm system.

## Folder structure

```text
src/
  App.jsx                    layout and source controls
  hooks/useTelemetry.js      live/imported state, rolling readings, alert history
  components/
    StatCard.jsx             latest values, ranges, status
    TelemetryChart.jsx       multi-device chart
    AlertsPanel.jsx          recent alerts
    ThresholdEditor.jsx      editable limits
  lib/
    simulator.js             reproducible virtual sensor nodes
    alerts.js                limit checks and alert events
    csv.js                   CSV parsing, validation, export
    metrics.js               metric names and units
    series.js                time-series helpers
sample-data/
  sample-readings.csv        example file for import
```

Built with React 19, Vite, Recharts, Vitest + jsdom + Testing Library, and GitHub Actions for CI.

## Connecting a real sensor

There's no hardware connection yet. A real source could replace the interval-based simulator in `src/hooks/useTelemetry.js`, as long as it produces readings in the same shape:

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

The charts, summaries, limit checks and CSV export would then work unchanged. A real connection would still need its own transport, reconnect handling, validation and device identity, which aren't included here.

## Limitations

- The data comes from a seeded simulator and a sample CSV, not from live sensors.
- The live data and alerts only live in browser memory; nothing is saved on a server.
- No backend, user accounts, access control, device authentication or remote notifications.
- The CSV import only handles simple unquoted fields and reports bad rows. It's not a general spreadsheet importer.
- The default limits are for showing the UI, not calibrated environmental limits.
