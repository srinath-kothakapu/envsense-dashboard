import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { METRICS, formatValue } from '../lib/metrics.js';
import { mergeSeries } from '../lib/series.js';

const time = (ts) => new Date(ts).toLocaleTimeString([], { hour12: false });

export default function TelemetryChart({ series, metric, threshold, devices }) {
  const data = useMemo(() => mergeSeries(series, metric), [series, metric]);
  const { label, unit } = METRICS[metric];

  return (
    <section className="card chart" aria-label={`${label} chart`}>
      <h2>
        {label} <small>({unit})</small>
      </h2>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tickFormatter={time} stroke="#64748b" minTickGap={48} />
            <YAxis stroke="#64748b" domain={['auto', 'auto']} width={48} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
              labelFormatter={time}
              formatter={(v, name) => [`${formatValue(metric, v)} ${unit}`, name]}
            />
            <Legend />
            {threshold && (
              <>
                <ReferenceLine y={threshold.max} stroke="#f87171" strokeDasharray="6 4" label="max" />
                <ReferenceLine y={threshold.min} stroke="#fbbf24" strokeDasharray="6 4" label="min" />
              </>
            )}
            {devices.map((d) => (
              <Line
                key={d.id}
                type="monotone"
                dataKey={d.id}
                name={d.name}
                stroke={d.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
