import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const UNITS = {
  temperature: '°C',
  humidity: '%',
  pressure: 'hPa',
};

function formatTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatTooltipLabel(isoStr) {
  return new Date(isoStr).toLocaleString('hu-HU');
}

export default function SensorChart({ data, sensorType, loading }) {
  const unit = UNITS[sensorType] || '';

  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: '24px 8px 16px' }}>
      {loading ? (
        <p style={{ textAlign: 'center', color: '#475569', padding: 40 }}>Betöltés...</p>
      ) : data.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#475569', padding: 40 }}>Nincs adat a kiválasztott időszakra.</p>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              tick={{ fill: '#64748b', fontSize: 11 }}
              minTickGap={60}
            />
            <YAxis
              tickFormatter={v => `${v.toFixed(1)}${unit}`}
              tick={{ fill: '#64748b', fontSize: 11 }}
              width={64}
            />
            <Tooltip
              labelFormatter={formatTooltipLabel}
              formatter={v => [`${v.toFixed(2)} ${unit}`, 'Érték']}
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: '#38bdf8' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
