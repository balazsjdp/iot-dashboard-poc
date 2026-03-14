export default function SensorSelector({ sensors, selected, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <label style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Szenzor:</label>
      <select value={selected} onChange={e => onChange(e.target.value)}>
        {sensors.map(s => (
          <option key={s.sensorId} value={s.sensorId}>
            {s.sensorId} ({s.sensorType})
          </option>
        ))}
      </select>
    </div>
  );
}
