type Point = { x: number; z: number };
type Snapshot = {
  origin: { lat: number; lon: number };
  bounds: { south: number; west: number; north: number; east: number };
  roads: { points: Point[]; kind: string }[];
  rails: { points: Point[]; kind: string }[];
  pois: (Point & { name: string; kind: string })[];
  fetchedAt: string;
};

export function loadSourceMap() {
  const fetchSnapshot = () => fetch('./data/chilahati-map.json')
    .then(async response => {
      if (!response.ok) return null;
      const data: Snapshot = await response.json();
      return data.roads.length && data.rails.length && data.bounds && data.origin ? data : null;
    })
    .catch(() => null);
  let request: ReturnType<typeof fetchSnapshot> | undefined;
  let current: HTMLCanvasElement | null = null;

  return function drawSourceMap() {
    const canvas = document.querySelector<HTMLCanvasElement>('#source-map');
    if (!canvas || canvas === current) return;
    current = canvas;
    request ??= fetchSnapshot();
    void request.then(snapshot => {
      if (!canvas.isConnected) return;
      const status = document.querySelector('#source-map-status');
      if (!snapshot) {
        canvas.hidden = true;
        if (status) status.textContent = 'The regional source extract is unavailable in this copy.';
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { width } = canvas;
      const { bounds, origin } = snapshot;
      const metersPerDegree = 111320;
      const longitudeScale = Math.cos(origin.lat * Math.PI / 180) * metersPerDegree;
      const west = (bounds.west - origin.lon) * longitudeScale;
      const north = (origin.lat - bounds.north) * metersPerDegree;
      const scale = width / ((bounds.east - bounds.west) * longitudeScale);
      const height = canvas.height = Math.ceil((bounds.north - bounds.south) * metersPerDegree * scale);
      const x = (point: Point) => (point.x - west) * scale;
      const y = (point: Point) => (point.z - north) * scale;
      ctx.fillStyle = '#e6e6c8';
      ctx.fillRect(0, 0, width, height);
      const drawWays = (ways: Snapshot['roads'], color: string, weight: number) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = weight;
        ctx.beginPath();
        for (const way of ways) {
          const [start, ...rest] = way.points;
          if (!start) continue;
          ctx.moveTo(x(start), y(start));
          for (const point of rest) ctx.lineTo(x(point), y(point));
        }
        ctx.stroke();
      };
      const mainRoads = new Set(['primary', 'secondary', 'tertiary']);
      drawWays(snapshot.roads, '#88947c', 1.3);
      drawWays(snapshot.roads.filter(way => mainRoads.has(way.kind)), '#5e7054', 3);
      drawWays(snapshot.rails.filter(way => way.kind === 'rail'), '#715044', 3);
      const station = snapshot.pois.find(point => point.kind === 'station');
      if (station) {
        ctx.fillStyle = '#9d4635';
        ctx.beginPath();
        ctx.arc(x(station), y(station), 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = 'bold 20px system-ui';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#e6e6c8';
        ctx.strokeText(station.name, x(station) + 10, y(station) - 8);
        ctx.fillText(station.name, x(station) + 10, y(station) - 8);
      }
      if (status) status.textContent = `${snapshot.roads.length} mapped road ways and ${snapshot.rails.length} railway ways. Retrieved ${snapshot.fetchedAt.slice(0, 10)}.`;
      canvas.hidden = false;
    });
  };
}
