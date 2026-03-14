import { Router } from 'express';
import { Point } from '@influxdata/influxdb-client';
import { createWriteApi, queryApi, bucket } from '../influx.js';

const router = Router();

// POST /api/data – szenzor adat fogadás
router.post('/data', async (req, res) => {
  const { sensorId, sensorType, value } = req.body;

  if (!sensorId || !sensorType || value === undefined) {
    return res.status(400).json({ error: 'sensorId, sensorType és value megadása kötelező' });
  }

  const point = new Point('sensor_data')
    .tag('sensor_id', sensorId)
    .tag('sensor_type', sensorType)
    .floatField('value', parseFloat(value));

  const writeApi = createWriteApi();
  writeApi.writePoint(point);
  await writeApi.close();

  res.status(201).json({ ok: true });
});

// GET /api/data?sensorId=s1&from=-1h&to=now()&window=1m
router.get('/data', async (req, res) => {
  const { sensorId, from = '-1h', to = 'now()', window: win } = req.query;

  if (!sensorId) {
    return res.status(400).json({ error: 'sensorId megadása kötelező' });
  }

  // Auto window: ha nincs megadva, az időtartam alapján választunk
  const autoWindow = win || resolveAutoWindow(from);

  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: ${from}, stop: ${to})
      |> filter(fn: (r) => r._measurement == "sensor_data")
      |> filter(fn: (r) => r.sensor_id == "${sensorId}")
      |> filter(fn: (r) => r._field == "value")
      |> aggregateWindow(every: ${autoWindow}, fn: mean, createEmpty: false)
      |> yield(name: "mean")
  `;

  const results = [];
  try {
    await new Promise((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const obj = tableMeta.toObject(row);
          results.push({ time: obj._time, value: obj._value });
        },
        error: reject,
        complete: resolve,
      });
    });
    res.json(results);
  } catch (err) {
    console.error('Query error:', err.message);
    res.status(500).json({ error: 'Lekérdezési hiba' });
  }
});

// GET /api/sensors – elérhető szenzor ID-k
router.get('/sensors', async (req, res) => {
  const fluxQuery = `
    import "influxdata/influxdb/schema"
    schema.tagValues(bucket: "${bucket}", tag: "sensor_id")
  `;

  const sensorTypeQuery = `
    from(bucket: "${bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => r._measurement == "sensor_data")
      |> keep(columns: ["sensor_id", "sensor_type"])
      |> distinct(column: "sensor_id")
      |> limit(n: 100)
  `;

  const sensors = {};
  try {
    await new Promise((resolve, reject) => {
      queryApi.queryRows(sensorTypeQuery, {
        next(row, tableMeta) {
          const obj = tableMeta.toObject(row);
          if (obj.sensor_id && !sensors[obj.sensor_id]) {
            sensors[obj.sensor_id] = { sensorId: obj.sensor_id, sensorType: obj.sensor_type || '' };
          }
        },
        error: reject,
        complete: resolve,
      });
    });
    res.json(Object.values(sensors));
  } catch (err) {
    console.error('Sensors query error:', err.message);
    res.status(500).json({ error: 'Lekérdezési hiba' });
  }
});

function resolveAutoWindow(from) {
  if (typeof from !== 'string') return '1m';
  if (from.includes('7d') || from.includes('168h')) return '1h';
  if (from.includes('24h') || from.includes('1d')) return '15m';
  if (from.includes('6h')) return '5m';
  if (from.includes('1h')) return '10s';
  return '1m';
}

export default router;
