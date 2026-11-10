import { DEFAULT_THRESHOLDS, METRIC_KEYS, METRICS } from '../lib/metrics.js';

export default function ThresholdEditor({ thresholds, onChange }) {
  const update = (metric, field, raw) => {
    const value = Number(raw);
    if (raw === '' || Number.isNaN(value)) return;
    onChange({ ...thresholds, [metric]: { ...thresholds[metric], [field]: value } });
  };

  return (
    <section className="card thresholds" aria-label="Alert thresholds">
      <div className="panel-head">
        <h2>Thresholds</h2>
        <button type="button" className="btn ghost" onClick={() => onChange(DEFAULT_THRESHOLDS)}>
          Reset
        </button>
      </div>
      {METRIC_KEYS.map((m) => (
        <div className="threshold-row" key={m}>
          <span>
            {METRICS[m].label} <small>({METRICS[m].unit})</small>
          </span>
          <label>
            min
            <input
              type="number"
              aria-label={`${METRICS[m].label} minimum`}
              value={thresholds[m].min}
              onChange={(e) => update(m, 'min', e.target.value)}
            />
          </label>
          <label>
            max
            <input
              type="number"
              aria-label={`${METRICS[m].label} maximum`}
              value={thresholds[m].max}
              onChange={(e) => update(m, 'max', e.target.value)}
            />
          </label>
        </div>
      ))}
    </section>
  );
}
