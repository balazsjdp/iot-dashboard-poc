import { useState, useEffect, useCallback } from 'react';
import SensorSelector from './SensorSelector.jsx';
import IntervalSelector from './IntervalSelector.jsx';
import DateRangePicker from './DateRangePicker.jsx';
import SensorChart from './SensorChart.jsx';

function toLocalDatetimeValue(date) {
  const d = new Date(date - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

export default function Dashboard() {
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [interval, setInterval_] = useState('-1h');
  const [customRange, setCustomRange] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [liveFrom, setLiveFrom] = useState(() => toLocalDatetimeValue(new Date(Date.now() - 3600_000)));
  const [lastUpdated, setLastUpdated] = useState(null);

  // Szenzor lista betöltés
  useEffect(() => {
    fetch('/api/sensors')
      .then(r => r.json())
      .then(list => {
        setSensors(list);
        if (list.length > 0) setSelectedSensor(list[0].sensorId);
      })
      .catch(console.error);
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedSensor) return;
    setLoading(true);
    try {
      let url;
      if (liveMode) {
        const from = new Date(liveFrom).toISOString();
        const to = new Date().toISOString();
        url = `/api/data?sensorId=${selectedSensor}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      } else if (customRange) {
        const from = new Date(customRange.from).toISOString();
        const to = new Date(customRange.to).toISOString();
        url = `/api/data?sensorId=${selectedSensor}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      } else {
        const to = new Date().toISOString();
        url = `/api/data?sensorId=${selectedSensor}&from=${interval}&to=${encodeURIComponent(to)}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSensor, interval, customRange, liveMode, liveFrom]);

  // Adatok betöltése szenzor/intervallum/live váltáskor
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // LIVE mód: 5 másodpercenként frissít
  useEffect(() => {
    if (!liveMode) return;
    const id = window.setInterval(fetchData, 5000);
    return () => window.clearInterval(id);
  }, [liveMode, fetchData]);

  const currentSensor = sensors.find(s => s.sensorId === selectedSensor);

  const handleIntervalChange = (val) => {
    setCustomRange(null);
    setInterval_(val);
  };

  const handleCustomRange = ({ from, to }) => {
    setInterval_(null);
    setCustomRange({ from, to });
  };

  const handleLiveToggle = () => {
    setLiveMode(v => !v);
  };

  const now = lastUpdated ?? new Date();
  const defaultCustomFrom = toLocalDatetimeValue(new Date(now - 3600_000));
  const defaultCustomTo = toLocalDatetimeValue(now);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      {/* Fejléc */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' }}>
          IoT Szenzor Dashboard
        </h1>
        {lastUpdated && (
          <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: 4 }}>
            Utolsó frissítés: {lastUpdated.toLocaleTimeString('hu-HU')}
          </p>
        )}
      </div>

      {/* Vezérlők */}
      <div style={{
        background: '#1e293b',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 20,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          {sensors.length > 0 && (
            <SensorSelector
              sensors={sensors}
              selected={selectedSensor}
              onChange={id => { setSelectedSensor(id); setCustomRange(null); }}
            />
          )}
          {!liveMode && (
            <IntervalSelector active={interval} onChange={handleIntervalChange} />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {liveMode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Kezdő időpont:</label>
              <input
                type="datetime-local"
                value={liveFrom}
                onChange={e => setLiveFrom(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                → {lastUpdated ? lastUpdated.toLocaleTimeString('hu-HU') : 'most'}
              </span>
            </div>
          ) : (
            <DateRangePicker
              from={customRange?.from ?? defaultCustomFrom}
              to={customRange?.to ?? defaultCustomTo}
              onChange={handleCustomRange}
            />
          )}
          <button
            className={liveMode ? 'active' : ''}
            onClick={handleLiveToggle}
          >
            {liveMode ? '● LIVE' : '○ LIVE'}
          </button>
        </div>
      </div>

      {/* Grafikon */}
      <SensorChart
        data={data}
        sensorType={currentSensor?.sensorType}
        loading={loading}
      />

      {/* Statisztika */}
      {data.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          marginTop: 16,
        }}>
          {[
            { label: 'Min', value: Math.min(...data.map(d => d.value)) },
            { label: 'Max', value: Math.max(...data.map(d => d.value)) },
            { label: 'Átlag', value: data.reduce((s, d) => s + d.value, 0) / data.length },
            { label: 'Pontok', value: data.length, noUnit: true },
          ].map(stat => (
            <div key={stat.label} style={{
              background: '#1e293b', borderRadius: 10, padding: '14px 18px',
            }}>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4 }}>{stat.label}</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#38bdf8' }}>
                {stat.noUnit ? stat.value : stat.value.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
