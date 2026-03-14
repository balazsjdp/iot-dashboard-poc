import { InfluxDB } from '@influxdata/influxdb-client';

const url = process.env.INFLUXDB_URL || 'http://localhost:8086';
const token = process.env.INFLUXDB_TOKEN || 'my-super-secret-token';

export const org = process.env.INFLUXDB_ORG || 'iot-org';
export const bucket = process.env.INFLUXDB_BUCKET || 'sensors';

const client = new InfluxDB({ url, token });

export const queryApi = client.getQueryApi(org);

// Minden write-hoz külön writeApi példány – elkerüli a megosztott buffer problémáját
export function createWriteApi() {
  return client.getWriteApi(org, bucket, 'ns');
}
