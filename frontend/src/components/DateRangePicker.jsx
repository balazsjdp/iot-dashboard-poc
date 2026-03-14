export default function DateRangePicker({ from, to, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <label style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Egyedi:</label>
      <input
        type="datetime-local"
        value={from}
        onChange={e => onChange({ from: e.target.value, to })}
      />
      <span style={{ color: '#475569' }}>–</span>
      <input
        type="datetime-local"
        value={to}
        onChange={e => onChange({ from, to: e.target.value })}
      />
    </div>
  );
}
