import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = { lat: 26.24314, lon: 88.79631 };
const bounds = { south: 26.225, west: 88.775, north: 26.265, east: 88.825 };
const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
const query = `[out:json][timeout:35];(way[highway](${bbox});way[railway](${bbox});way[building](${bbox});nwr[amenity~"school|college|post_office|place_of_worship|marketplace"](${bbox});node[railway=station](${bbox});node[shop](${bbox});nwr[tourism=hotel](${bbox}););out geom center tags;`;
const endpoints = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
let responseData;
let sourceUrl;
for (const endpoint of endpoints) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'ChilahatiLifePrototype/0.1 public-map-snapshot' },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.elements)) throw new Error('OSM elements missing');
    responseData = data;
    sourceUrl = endpoint;
    break;
  } catch (error) {
    console.error(`${endpoint}: ${error.message}`);
  }
}
if (!responseData) throw new Error('Map source unavailable; no synthetic map was substituted.');

const project = (p) => ({
  x: Math.round((p.lon - origin.lon) * Math.cos(origin.lat * Math.PI / 180) * 111320 * 100) / 100,
  z: Math.round(-(p.lat - origin.lat) * 111320 * 100) / 100,
});
const name = (tags) => tags['name:bn'] || tags.name || '';
const roads = [], rails = [], pois = [], buildings = [];
for (const e of responseData.elements) {
  const tags = e.tags || {};
  const id = `${e.type}/${e.id}`;
  const points = (e.geometry || []).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon)).map(project);
  if (e.type === 'way' && tags.highway && points.length > 1) roads.push({ id, name: name(tags), kind: tags.highway, points });
  if (e.type === 'way' && tags.railway && points.length > 1) rails.push({ id, name: name(tags), kind: tags.railway, points });
  if (e.type === 'way' && tags.building && points.length > 2) buildings.push({ id, name: name(tags), points, levels: Math.max(1, Math.min(12, Number.parseInt(tags['building:levels'] || '1', 10) || 1)) });
  if (tags.amenity || tags.railway === 'station' || tags.shop || tags.tourism === 'hotel') {
    const p = e.type === 'node' ? e : e.center;
    if (p && Number.isFinite(p.lat) && Number.isFinite(p.lon)) pois.push({ id, name: name(tags), kind: tags.amenity === 'place_of_worship' && tags.religion === 'muslim' ? 'mosque' : tags.amenity || tags.railway || tags.shop || tags.tourism, ...project(p), tags: { religion: tags.religion, denomination: tags.denomination } });
  }
}
const output = {
  source: 'OpenStreetMap',
  attribution: '© OpenStreetMap contributors',
  license: 'ODbL-1.0',
  licenseUrl: 'https://www.openstreetmap.org/copyright',
  sourceUrl,
  query,
  fetchedAt: new Date().toISOString(),
  osmTimestamp: responseData.osm3s?.timestamp_osm_base || null,
  origin, bounds, roads, rails, pois, buildings,
};
await mkdir(path.join(root, 'public/data'), { recursive: true });
await writeFile(path.join(root, 'public/data/chilahati-map.json'), JSON.stringify(output));
console.log(JSON.stringify({ roads: roads.length, rails: rails.length, pois: pois.length, buildings: buildings.length, bytes: Buffer.byteLength(JSON.stringify(output)), sourceUrl, osmTimestamp: output.osmTimestamp }));
