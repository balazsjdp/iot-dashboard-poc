/**
 * Dummy adatgenerátor
 *
 * Módok:
 *   node src/seed.js           – visszamenőleg feltölti az elmúlt 24h adatait
 *   node src/seed.js --live    – valós idejű mód: másodpercenként küld adatot a POST /api/data végpontra
 */

import { InfluxDB, Point } from '@influxdata/influxdb-client';

const url = process.env.INFLUXDB_URL || 'http://localhost:8086';
const token = process.env.INFLUXDB_TOKEN || 'my-super-secret-token';
const org = process.env.INFLUXDB_ORG || 'iot-org';
const bucket = process.env.INFLUXDB_BUCKET || 'sensors';

const SENSORS = [
  { sensorId: 'sensor-1', sensorType: 'temperature', baseValue: 22,   amplitude: 5  },
  { sensorId: 'sensor-2', sensorType: 'humidity',    baseValue: 55,   amplitude: 10 },
  { sensorId: 'sensor-3', sensorType: 'pressure',    baseValue: 1013, amplitude: 8  },
];

const isLive = process.argv.includes('--live');

if (isLive) {
  runLive();
} else {
  runBackfill();
}

async function runBackfill() {
  const client = new InfluxDB({ url, token });
  const writeApi = client.getWriteApi(org, bucket, 'ns');

  const now = Date.now();
  const hoursBack = 24;
  const intervalMs = 1000; // 1 másodperces felbontás
  const totalPoints = hoursBack * 3600;

  console.log(`Visszamenőleges feltöltés: ${totalPoints} pont szenzorönként...`);

  for (const sensor of SENSORS) {
    for (let i = totalPoints; i >= 0; i--) {
      const ts = now - i * intervalMs;
      const value = sensorValue(sensor, ts);

      const point = new Point('sensor_data')
        .tag('sensor_id', sensor.sensorId)
        .tag('sensor_type', sensor.sensorType)
        .floatField('value', value)
        .timestamp(BigInt(ts) * 1_000_000n); // ms → ns

      writeApi.writePoint(point);
    }
    console.log(`  ✓ ${sensor.sensorId} kész`);
  }

  await writeApi.close();
  console.log('Kész. Adatok betöltve.');
}

function runLive() {
  const apiUrl = process.env.API_URL || 'http://localhost:3000';
  console.log(`Valós idejű mód: POST ${apiUrl}/api/data (Ctrl+C a leállításhoz)`);

  setInterval(async () => {
    for (const sensor of SENSORS) {
      const value = sensorValue(sensor, Date.now());
      try {
        const res = await fetch(`${apiUrl}/api/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sensorId: sensor.sensorId, sensorType: sensor.sensorType, value }),
        });
        if (res.ok) {
          console.log(`[${new Date().toISOString()}] ${sensor.sensorId}: ${value.toFixed(2)}`);
        }
      } catch (err) {
        console.error(`Hiba (${sensor.sensorId}):`, err.message);
      }
    }
  }, 1000);
}

function sensorValue(sensor, timestamp) {
  const t = timestamp / 1000;
  const noise = (Math.random() - 0.5) * 2;
  return sensor.baseValue + sensor.amplitude * Math.sin(t / 3600) + noise;
}
