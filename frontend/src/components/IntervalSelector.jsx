const PRESETS = [
  { label: '1 óra',   from: '-1h' },
  { label: '6 óra',   from: '-6h' },
  { label: '24 óra',  from: '-24h' },
  { label: '7 nap',   from: '-168h' },
];

export default function IntervalSelector({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {PRESETS.map(p => (
        <button
          key={p.from}
          className={active === p.from ? 'active' : ''}
          onClick={() => onChange(p.from)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
