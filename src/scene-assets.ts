import * as THREE from 'three';

const materials = new Map<string, THREE.MeshStandardMaterial>();
export function material(color: string, roughness = 0.9): THREE.MeshStandardMaterial {
  const key = `${color}:${roughness}`;
  let result = materials.get(key);
  if (!result) { result = new THREE.MeshStandardMaterial({ color, roughness }); materials.set(key, result); }
  return result;
}

export function box(parent: THREE.Object3D, x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string, shadows = true): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material(color));
  mesh.position.set(x, y, z); mesh.castShadow = shadows; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}

export function cylinder(parent: THREE.Object3D, x: number, y: number, z: number, rt: number, rb: number, height: number, color: string, segments = 12): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, height, segments), material(color));
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}

export function sphere(parent: THREE.Object3D, x: number, y: number, z: number, radius: number, color: string, scale?: THREE.Vector3): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 7), material(color)); mesh.position.set(x, y, z);
  if (scale) mesh.scale.copy(scale); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}

export function sign(parent: THREE.Object3D, text: string, x: number, y: number, z: number, width: number, height: number, background = '#174c46', ink = '#fff5d4', subtitle?: string): THREE.Mesh {
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = background; ctx.fillRect(0, 0, 1024, 256);
  ctx.strokeStyle = ink; ctx.lineWidth = 5; ctx.strokeRect(12, 12, 1000, 232);
  ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `700 ${subtitle ? 88 : 110}px "Noto Sans Bengali", "Hind Siliguri", sans-serif`;
  ctx.fillText(text, 512, subtitle ? 104 : 135, 950);
  if (subtitle) { ctx.font = '500 31px sans-serif'; ctx.fillText(subtitle, 512, 195, 940); }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
  mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}

export function tree(parent: THREE.Object3D, x: number, z: number, size: number, shade = '#4f7841'): void {
  const trunk = cylinder(parent, x, size * 0.4, z, size * 0.055, size * 0.08, size * 0.8, '#79603d', 7);
  trunk.castShadow = true;
  sphere(parent, x, size * 0.93, z, size * 0.44, shade, new THREE.Vector3(1.1, 1.15, 1));
  sphere(parent, x - size * 0.25, size * 0.79, z + size * 0.1, size * 0.3, '#658847');
  sphere(parent, x + size * 0.25, size * 0.77, z - size * 0.13, size * 0.29, '#789450');
}

export function person(parent: THREE.Object3D, x: number, z: number, shirt: string, skirt = false): THREE.Group {
  const group = new THREE.Group(); group.position.set(x, 0, z); parent.add(group);
  cylinder(group, 0, 0.95, 0, 0.24, 0.28, 0.62, shirt, 7);
  sphere(group, 0, 1.56, 0, 0.23, '#ac774e');
  sphere(group, 0, 1.68, -0.035, 0.21, '#302921', new THREE.Vector3(1, 0.63, 1));
  if (skirt) cylinder(group, 0, 0.42, 0, 0.23, 0.37, 0.56, '#f0e0c3', 7);
  else {
    box(group, -0.12, 0.33, 0, 0.19, 0.6, 0.2, '#50574e');
    box(group, 0.12, 0.33, 0, 0.19, 0.6, 0.2, '#50574e');
  }
  const armA = box(group, -0.34, 0.91, 0, 0.13, 0.61, 0.14, '#ac774e'); armA.rotation.z = -0.08;
  const armB = box(group, 0.34, 0.91, 0, 0.13, 0.61, 0.14, '#ac774e'); armB.rotation.z = 0.08;
  return group;
}

export function bicycle(parent: THREE.Object3D, x: number, z: number, color = '#205d66', cargo = false): THREE.Group {
  const group = new THREE.Group(); group.position.set(x, 0, z); parent.add(group);
  const wheelGeometry = new THREE.TorusGeometry(0.48, 0.065, 7, 18);
  const rubber = material('#282c29');
  for (const wz of [-0.9, 0.9]) {
    const wheel = new THREE.Mesh(wheelGeometry, rubber); wheel.rotation.y = Math.PI / 2; wheel.position.set(0, 0.5, wz); group.add(wheel);
    const spoke = box(group, 0, 0.5, wz, 0.055, 0.84, 0.055, '#a9b4a7', false); spoke.rotation.x = Math.PI / 3;
  }
  const frameA = box(group, 0, 0.93, -0.12, 0.1, 0.1, 1.5, color); frameA.rotation.x = -0.31;
  box(group, 0, 0.88, 0.45, 0.09, 0.8, 0.09, color).rotation.x = -0.4;
  box(group, 0, 1.26, 0.02, 0.37, 0.1, 0.43, '#383a30');
  box(group, 0, 1.35, -0.8, 0.68, 0.07, 0.09, '#b9c3b7');
  if (cargo) {
    box(group, 0, 0.92, 1.35, 1.9, 0.16, 1.75, '#516f72');
    box(group, 0, 1.1, 2.12, 1.92, 0.35, 0.09, '#335a60');
    for (const xx of [-0.85, 0.85]) { const wheel = new THREE.Mesh(wheelGeometry, rubber); wheel.rotation.y = Math.PI / 2; wheel.position.set(xx, 0.5, 1.65); group.add(wheel); }
  }
  return group;
}

export function motorcycle(parent: THREE.Object3D, x: number, z: number, color = '#ac5944'): THREE.Group {
  const group = new THREE.Group(); group.position.set(x, 0, z); parent.add(group);
  const wheelGeometry = new THREE.TorusGeometry(0.39, 0.115, 8, 18);
  for (const wz of [-0.82, 0.82]) {
    const wheel = new THREE.Mesh(wheelGeometry, material('#2c302c')); wheel.rotation.y = Math.PI / 2; wheel.position.set(0, 0.43, wz); wheel.castShadow = true; group.add(wheel);
    const hub = cylinder(group, 0, 0.43, wz, 0.19, 0.19, 0.24, '#a9ae9e', 10); hub.rotation.z = Math.PI / 2;
  }
  box(group, 0, 0.68, 0.05, 0.35, 0.45, 0.7, '#555f58');
  sphere(group, 0, 1.06, -0.16, 0.35, color, new THREE.Vector3(0.8, 0.63, 1.28));
  box(group, 0, 1.01, 0.43, 0.53, 0.18, 0.92, '#333b35');
  box(group, 0, 0.84, 0.9, 0.47, 0.16, 0.45, color);
  for (const xx of [-0.13, 0.13]) box(group, xx, 0.88, -0.79, 0.07, 0.85, 0.07, '#a9ae9e').rotation.x = -0.22;
  box(group, 0, 1.29, -0.7, 0.83, 0.07, 0.1, '#b2b5a5');
  sphere(group, 0, 1.1, -0.96, 0.19, '#eed6a1', new THREE.Vector3(1, 1, 0.5));
  box(group, 0.3, 0.43, 0.42, 0.14, 0.13, 1.02, '#9a9e8d');
  return group;
}
