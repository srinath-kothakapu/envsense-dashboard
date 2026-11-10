import { useMemo, useRef, useState } from 'react';
import StatCard from './components/StatCard.jsx';
import TelemetryChart from './components/TelemetryChart.jsx';
import AlertsPanel from './components/AlertsPanel.jsx';
import ThresholdEditor from './components/ThresholdEditor.jsx';
import { useTelemetry } from './hooks/useTelemetry.js';
import { DEFAULT_THRESHOLDS, METRIC_KEYS } from './lib/metrics.js';
import { DEVICES } from './lib/simulator.js';
import { parseCsv, toCsv } from './lib/csv.js';
import { flatten, summarize } from './lib/series.js';

const PALETTE = ['#22d3ee', '#f472b6', '#a3e635', '#fbbf24', '#c084fc', '#fb923c'];

function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [metric, setMetric] = useState('temperature');
  const [selectedDevice, setSelectedDevice] = useState(DEVICES[0].id);
  const [importErrors, setImportErrors] = useState([]);
  const fileRef = useRef(null);

  const { series, alerts, paused, setPaused, source, importReadings, backToLive, clearAlerts } =
    useTelemetry({ thresholds });

  // Device list: simulated nodes in live mode, whatever the CSV contained otherwise.
  const devices = useMemo(() => {
    if (source === 'live') return DEVICES;
    return Object.keys(series).map((id, i) => ({ id, name: id, color: PALETTE[i % PALETTE.length] }));
  }, [source, series]);

  const activeId = devices.some((d) => d.id === selectedDevice) ? selectedDevice : devices[0]?.id;
  const stats = useMemo(() => summarize(series[activeId] ?? []), [series, activeId]);
  const nameOf = (id) => devices.find((d) => d.id === id)?.name ?? id;

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const { readings, errors } = parseCsv(await file.text());
    setImportErrors(errors.slice(0, 5));
    if (readings.length) {
      importReadings(readings);
      setSelectedDevice(readings[0].device);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>
            <span className="logo" aria-hidden="true">
              ◢
            </span>{' '}
            EnvSense
          </h1>
          <p className="subtitle">
            Environmental sensor monitoring ·{' '}
            <span className={`pill ${source === 'live' && !paused ? 'live' : ''}`}>
              {source === 'imported' ? 'Imported data' : paused ? 'Paused' : 'Live'}
            </span>
          </p>
        </div>
        <div className="actions">
          {source === 'live' ? (
            <button type="button" className="btn" onClick={() => setPaused(!paused)}>
              {paused ? 'Resume' : 'Pause'}
            </button>
          ) : (
            <button type="button" className="btn" onClick={backToLive}>
              Back to live
            </button>
          )}
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            Import CSV
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => download('envsense-export.csv', toCsv(flatten(series)))}
          >
            Export CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onFile} data-testid="file-input" />
        </div>
      </header>

      {importErrors.length > 0 && (
        <div className="notice" role="alert">
          {importErrors.map((err) => (
            <div key={err}>{err}</div>
          ))}
        </div>
      )}

      <nav className="device-tabs" aria-label="Devices">
        {devices.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`tab ${d.id === activeId ? 'active' : ''}`}
            style={{ '--dot': d.color }}
            onClick={() => setSelectedDevice(d.id)}
          >
            <i /> {d.name}
          </button>
        ))}
      </nav>

      <div className="stats">
        {METRIC_KEYS.map((m) => (
          <StatCard
            key={m}
            metric={m}
            stats={stats[m]}
            threshold={thresholds[m]}
            selected={m === metric}
            onSelect={setMetric}
          />
        ))}
      </div>

      <div className="grid">
        <TelemetryChart series={series} metric={metric} threshold={thresholds[metric]} devices={devices} />
        <aside className="side">
          <AlertsPanel alerts={alerts} deviceName={nameOf} onClear={clearAlerts} />
          <ThresholdEditor thresholds={thresholds} onChange={setThresholds} />
        </aside>
      </div>
    </div>
  );
}
