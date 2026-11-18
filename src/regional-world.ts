import * as THREE from 'three';
import { material, sign } from './scene-assets';
import type { Snapshot } from './source-map';

type Point = { x: number; z: number };
type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };

const roadStyles: Record<string, { width: number; color: string }> = {
  primary: { width: 9, color: '#656b63' },
  secondary: { width: 8, color: '#676e64' },
  tertiary: { width: 6.5, color: '#71776b' },
  unclassified: { width: 4.8, color: '#858678' },
  residential: { width: 4.5, color: '#8a8876' },
  living_street: { width: 3.5, color: '#938a72' },
  service: { width: 3.2, color: '#9b937a' },
  track: { width: 2.8, color: '#b6a279' },
  path: { width: 1.3, color: '#bdad85' },
  footway: { width: 1.3, color: '#bdad85' },
};
const defaultRoad = { width: 3, color: '#a69a7e' };

function clipSegment(a: Point, b: Point, bounds: Bounds): [Point, Point] | null {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  let start = 0;
  let end = 1;
  for (const [step, edge] of [
    [-dx, a.x - bounds.minX], [dx, bounds.maxX - a.x],
    [-dz, a.z - bounds.minZ], [dz, bounds.maxZ - a.z],
  ]) {
    if (step === 0) {
      if (edge < 0) return null;
      continue;
    }
    const crossing = edge / step;
    if (step < 0) start = Math.max(start, crossing);
    else end = Math.min(end, crossing);
  }
  if (start >= end) return null;
  return [{ x: a.x + start * dx, z: a.z + start * dz }, { x: a.x + end * dx, z: a.z + end * dz }];
}

function distanceSquared(a: Point, b: Point) {
  return (a.x - b.x) ** 2 + (a.z - b.z) ** 2;
}

function clipWay(points: Point[], bounds: Bounds) {
  const paths: Point[][] = [];
  let current: Point[] | undefined;
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1];
    const b = points[index];
    if (![a.x, a.z, b.x, b.z].every(Number.isFinite) || distanceSquared(a, b) < 0.0001) continue;
    const segment = clipSegment(a, b, bounds);
    if (!segment) {
      current = undefined;
      continue;
    }
    if (current && distanceSquared(current[current.length - 1], segment[0]) < 0.0001) {
      current.push(segment[1]);
    } else {
      current = segment;
      paths.push(current);
    }
  }
  return paths;
}

function nearestOnSegment(point: Point, start: Point, end: Point): Point {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const fraction = THREE.MathUtils.clamp(
    ((point.x - start.x) * dx + (point.z - start.z) * dz) / (dx * dx + dz * dz), 0, 1,
  );
  return { x: start.x + fraction * dx, z: start.z + fraction * dz };
}

function buildRibbonBatch() {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  function add(points: Point[], width: number, y: number, shade: string, offset = 0) {
    const color = new THREE.Color(shade);
    const firstVertex = positions.length / 3;
    const normals = points.slice(1).map((end, index) => {
      const start = points[index];
      const dx = end.x - start.x;
      const dz = end.z - start.z;
      const distance = Math.hypot(dx, dz);
      return new THREE.Vector2(-dz / distance, dx / distance);
    });
    for (let index = 0; index < points.length; index++) {
      const point = points[index];
      const previous = normals[Math.max(0, index - 1)];
      const next = normals[Math.min(index, normals.length - 1)];
      const miter = previous.clone().add(next);
      if (miter.lengthSq() < 0.01) miter.copy(next);
      miter.normalize();
      const stretch = 1 / Math.max(miter.dot(next), 0.5);
      for (const side of [1, -1]) {
        const lateral = (offset + side * width / 2) * stretch;
        positions.push(point.x + lateral * miter.x, y, point.z + lateral * miter.y);
        colors.push(color.r, color.g, color.b);
      }
      if (index > 0) {
        const vertex = firstVertex + index * 2;
        indices.push(vertex - 2, vertex, vertex - 1, vertex, vertex + 1, vertex - 1);
      }
    }
  }

  function mesh() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  }
  return { add, mesh };
}

export function createRegionalWorld(snapshot: Snapshot) {
  const group = new THREE.Group();
  group.name = 'Regional OpenStreetMap source view';
  const metersPerDegree = 111320;
  const longitudeScale = metersPerDegree * Math.cos(THREE.MathUtils.degToRad(snapshot.origin.lat));
  const bounds = {
    minX: (snapshot.bounds.west - snapshot.origin.lon) * longitudeScale,
    maxX: (snapshot.bounds.east - snapshot.origin.lon) * longitudeScale,
    minZ: (snapshot.origin.lat - snapshot.bounds.north) * metersPerDegree,
    maxZ: (snapshot.origin.lat - snapshot.bounds.south) * metersPerDegree,
  };
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material('#9da97a'));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set((bounds.minX + bounds.maxX) / 2, 0, (bounds.minZ + bounds.maxZ) / 2);
  group.add(ground);

  const station = snapshot.pois.find(point => point.kind === 'station' &&
    point.x >= bounds.minX && point.x <= bounds.maxX && point.z >= bounds.minZ && point.z <= bounds.maxZ);
  const target = station ?? ground.position;
  let spawnPoint: Point = target;
  let nearestDistance = Infinity;
  const roads = buildRibbonBatch();
  for (const way of snapshot.roads) {
    const style = roadStyles[way.kind] ?? defaultRoad;
    for (const points of clipWay(way.points, bounds)) {
      // Ribbons follow mapped centerlines. Their widths and surfaces are illustrative.
      roads.add(points, style.width, 0.025 + style.width * 0.004, style.color);
      for (let index = 1; index < points.length; index++) {
        const point = nearestOnSegment(target, points[index - 1], points[index]);
        const distance = distanceSquared(target, point);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          spawnPoint = point;
        }
      }
    }
  }
  group.add(roads.mesh());

  const rails = buildRibbonBatch();
  for (const way of snapshot.rails) {
    if (way.kind !== 'rail') continue;
    for (const points of clipWay(way.points, bounds)) {
      rails.add(points, 2.7, 0.08, '#776e5e');
      for (const side of [-1, 1]) rails.add(points, 0.15, 0.12, '#d0ccc2', side * 0.75);
    }
  }
  group.add(rails.mesh());

  if (station) {
    const marker = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.1, 16), material('#b36d3f'));
    marker.position.set(station.x, 0.1, station.z);
    group.add(marker);
    const stationSign = sign(group, station.name || 'চিলাহাটি', station.x, 2.6, station.z, 9, 2.25,
      '#1b4f68', '#fff9e7', 'CHILAHATI RAILWAY STATION · MAPPED POINT');
    if (nearestDistance > 0.01) stationSign.lookAt(spawnPoint.x, stationSign.position.y, spawnPoint.z);
  }
  const spawn = new THREE.Vector3(spawnPoint.x, 0, spawnPoint.z);
  const yaw = station && nearestDistance > 0.01
    ? Math.atan2(station.x - spawn.x, spawn.z - station.z)
    : 0;
  return { group, spawn, bounds, yaw };
}
