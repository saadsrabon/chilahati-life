import * as THREE from 'three';
import { bicycle, box, cylinder, material, motorcycle, person, sign, sphere, tree } from './scene-assets';

export interface WorldResult {
  spawn: THREE.Vector3;
  colliders: { x: number; z: number; hx: number; hz: number }[];
  interactables: { id: string; label: string; kind: string; x: number; z: number }[];
  landmarks: { id: string; label: string; x: number; z: number }[];
  update: (dt: number, time: number) => void;
}

/** Landmark architecture is illustrative until locally verified photographs are supplied. */
export function createWorld(scene: THREE.Scene): WorldResult {
  const colliders: WorldResult['colliders'] = [];
  const interactables: WorldResult['interactables'] = [];
  const landmarks: WorldResult['landmarks'] = [];
  const animated: { group: THREE.Group; x: number; z: number; phase: number; travel: number }[] = [];
  const markers: THREE.Mesh[] = [];
  const village = new THREE.Group(); village.name = 'Chilahati village prototype'; scene.add(village);
  let seed = 9403;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), material('#91a76b'));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; village.add(ground);

  const road = (x: number, z: number, width: number, length: number) => {
    box(village, x, 0.018, z, width + 2.4, 0.03, length + 1, '#bdab83', false);
    box(village, x, 0.045, z, width, 0.055, length, '#777d70', false);
  };
  road(0, 74, 13, 240); road(0, 0, 230, 12); road(0, 51, 172, 8);
  // Broken center lines help communicate the travel direction without hiding the scene.
  for (let z = 29; z < 185; z += 14) box(village, 0, 0.083, z, 0.13, 0.008, 4.4, '#ded6a8', false);
  box(village, 0, 0.065, -13, 41, 0.08, 24, '#c7b79a', false);
  for (const xx of [-10.5, 10.5]) box(village, xx, 0.1, 48, 3.5, 0.2, 100, '#c2b493', false);

  function obstacle(x: number, z: number, sx: number, sz: number) { colliders.push({ x, z, hx: sx / 2, hz: sz / 2 }); }
  function point(id: string, label: string, kind: string, x: number, z: number) {
    interactables.push({ id, label, kind, x, z });
    const pad = cylinder(village, x, 0.035, z, 0.95, 0.95, 0.055, '#e5bd63', 24); pad.receiveShadow = true;
    const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.18), new THREE.MeshStandardMaterial({ color: '#f1cc78', emissive: '#8c6325', emissiveIntensity: 0.18, roughness: 0.5 }));
    marker.position.set(x, 2.2, z); village.add(marker); markers.push(marker);
  }
  const landmark = (id: string, label: string, x: number, z: number) => landmarks.push({ id, label, x, z });

  function window(parent: THREE.Object3D, x: number, y: number, z: number, width = 1.35, height = 1.65) {
    box(parent, x, y, z, width + 0.16, height + 0.16, 0.13, '#e2dbb8');
    box(parent, x, y, z + 0.08, width, height, 0.07, '#3f6866');
    box(parent, x, y, z + 0.14, 0.08, height, 0.04, '#c1c8ad');
  }
  function house(x: number, z: number, width: number, depth: number, color: string, roof: string, levels = 1, rotation = 0) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotation; village.add(g);
    const h = 3.8 * levels;
    box(g, 0, 0.18, 0, width + 0.6, 0.36, depth + 0.6, '#b5a489');
    box(g, 0, h / 2 + 0.36, 0, width, h, depth, color);
    for (let floor = 0; floor < levels; floor++) {
      window(g, -width * 0.28, 2.1 + floor * 3.8, depth / 2 + 0.03);
      window(g, width * 0.28, 2.1 + floor * 3.8, depth / 2 + 0.03);
    }
    box(g, 0, 1.58, depth / 2 + 0.08, 1.5, 2.6, 0.12, '#4b6557');
    box(g, 0, h + 0.54, 0, width + 1.1, 0.3, depth + 1.1, roof);
    box(g, 0, h + 0.79, -depth * 0.22, width + 1, 0.18, depth * 0.65, roof).rotation.x = -0.16;
    box(g, 0, h + 0.79, depth * 0.22, width + 1, 0.18, depth * 0.65, roof).rotation.x = 0.16;
    if (Math.abs(rotation) % Math.PI > 0.1) obstacle(x, z, depth + 0.4, width + 0.4); else obstacle(x, z, width + 0.4, depth + 0.4);
    return g;
  }

  // Railway station and platform. The façade is a reference-ready prototype.
  const station = new THREE.Group(); station.position.set(0, 0, -27); village.add(station);
  box(station, 0, 0.35, 0, 42, 0.7, 12, '#c9b89a');
  box(station, 0, 2.9, -0.8, 34, 4.9, 8, '#eadab5');
  box(station, 0, 5.6, -0.7, 37, 0.45, 13, '#ad6047');
  for (let i = -3; i <= 3; i++) {
    box(station, i * 4.7, 2.25, 3.3, 1.6, 3.2, 0.2, '#3c6666');
    cylinder(station, i * 5.4, 2.55, 5.3, 0.2, 0.25, 4.7, '#e7d6ae', 8);
  }
  box(station, 0, 4.7, 5.3, 39, 0.4, 0.5, '#cfbc8f');
  sign(station, 'চিলাহাটি', 0, 4.47, 5.65, 9.1, 2.05, '#124d4c', '#fff7dc', 'CHILAHATI RAILWAY STATION');
  sign(station, 'টিকিট কাউন্টার', -10.2, 3.3, 3.48, 3.2, 0.8, '#244f51');
  box(station, 0, 0.1, 7, 13, 0.2, 2, '#b6a183');
  box(station, 0, 0.18, 5.8, 13, 0.36, 1.5, '#c9b798');
  obstacle(0, -27.8, 35, 8.5); landmark('station', 'চিলাহাটি রেলওয়ে স্টেশন', 0, -20);

  box(village, 0, 0.5, -39, 260, 1, 8.4, '#c9b9a0');
  box(village, 0, 1.03, -42.6, 260, 0.05, 0.28, '#eedda4', false);
  box(village, 0, 0.03, -47.6, 1500, 0.08, 6.1, '#8a8570', false);
  const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.14, 3.5), material('#675d4a'), 1000);
  const sleeperTransform = new THREE.Object3D();
  for (let i = 0; i < 1000; i++) { sleeperTransform.position.set(-750 + i * 1.5, 0.1, -47.6); sleeperTransform.updateMatrix(); sleepers.setMatrixAt(i, sleeperTransform.matrix); }
  sleepers.receiveShadow = true; village.add(sleepers);
  for (const z of [-48.35, -46.85]) box(village, 0, 0.23, z, 1500, 0.15, 0.13, '#b8b6a3', false);
  const train = new THREE.Group(); train.position.set(-43, 0, -47.6); village.add(train);
  for (let i = 0; i < 4; i++) {
    const car = new THREE.Group(); car.position.x = i * 17.2; train.add(car);
    box(car, 0, 2.1, 0, 16.2, 2.9, 2.9, i === 0 ? '#346d60' : '#d3d1ad');
    box(car, 0, 3.64, 0, 16.3, 0.25, 3.08, '#647b6c');
    box(car, 0, 1.5, 1.5, 16.15, 0.47, 0.04, '#b74f3e');
    for (let w = -5; w <= 5; w += 2) { box(car, w, 2.65, 1.48, 1.38, 0.85, 0.06, '#325b5b', false); }
    for (const wx of [-5, 5]) { const wh = cylinder(car, wx, 0.62, 0, 0.52, 0.52, 2.6, '#3d4540', 12); wh.rotation.x = Math.PI / 2; }
  }

  // Station forecourt: tree shade, luggage, seating and a rental van.
  for (const x of [-19, 19]) {
    tree(village, x, -11, 8.3);
    box(village, x, 0.4, -8.3, 5.5, 0.8, 1.1, '#9c8f71');
    box(village, x, 0.94, -8.65, 5.5, 0.5, 0.25, '#8d775c');
  }
  const rental = new THREE.Group(); rental.position.set(10.5, 0, 3); village.add(rental);
  for (const x of [-2.6, 2.6]) cylinder(rental, x, 1.5, 0, 0.1, 0.12, 3, '#6d7869', 7);
  box(rental, 0, 3, 0, 6.4, 0.18, 3.5, '#517c75');
  sign(rental, 'ভ্যান ও সাইকেল ভাড়া', 0, 2.38, 1.85, 5.7, 1.15, '#285b57', '#fff0c5');
  bicycle(village, 10.5, 4.5, '#3e7374', true).rotation.y = -0.6;
  bicycle(village, 14, 5.2, '#b36142').rotation.y = -0.4;
  motorcycle(village, 16.8, 5.3).rotation.y = -0.35;
  point('rental', 'ভ্যান ও বাইক ভাড়া', 'rental', 7, 6.5);

  // Market shops face the central street. Actual sign names await verification.
  const shopNames = ['চায়ের দোকান', 'মুদি দোকান', 'বাজারের হোটেল', 'সাইকেল মেরামত', 'সবজি বাজার', 'বই ও খাতা'];
  const shopColors = ['#dcc78f', '#b9c3a0', '#cda485', '#a9bdaf', '#dbcaa0', '#c4b2a0'];
  for (let i = 0; i < 6; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const z = 19 + Math.floor(i / 2) * 18;
    const x = side * 24;
    const g = house(x, z, 12, 8, shopColors[i]!, '#718479', i === 3 || i === 5 ? 2 : 1, side * Math.PI / 2);
    // Local +Z is the frontage; rotating maps it toward the central road.
    g.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    sign(g, shopNames[i]!, 0, 3.3, 4.18, 10.9, 1.5, ['#25584f', '#83543e', '#6e5842'][i % 3]!, '#fff1cc', 'ILLUSTRATIVE SHOP · DEMO');
    box(g, 0, 2.65, 5.1, 12.6, 0.15, 2.8, i % 2 ? '#ad7354' : '#6e8d71').rotation.x = 0.09;
    box(g, 0, 0.8, 4.95, 8.3, 1.2, 1.3, '#9b7752');
    for (let j = 0; j < 5; j++) {
      if (i === 4) sphere(g, -3 + j * 1.5, 1.55, 5.1, 0.38, ['#7d994b', '#d59f55', '#9eaf51'][j % 3]!);
      else box(g, -3 + j * 1.5, 1.53, 5.1, 0.65, 0.42, 0.6, ['#b65a3d', '#e0c58c', '#698c74'][j % 3]!);
    }
    person(village, x - side * 6.2, z + 1.4, ['#d59b5b', '#749c9b', '#c36c53'][i % 3]!, true).rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
  }
  point('tea', 'চা ও খাবার', 'shop', 17, 17);
  point('loan', 'সঞ্চয় ও ঋণ', 'loan', 17, 36);
  landmark('market', 'চিলাহাটি বাজার', 18, 19);

  // Post office: civic red details and a mail box.
  const post = house(49, -9, 15, 9, '#e5cbb0', '#9b5143', 1);
  sign(post, 'চিলাহাটি ডাকঘর', 0, 3.95, 4.7, 12.6, 1.5, '#9b4439', '#fff4d9', 'CHILAHATI POST OFFICE · PROTOTYPE');
  cylinder(village, 41.8, 0.8, -2.7, 0.36, 0.36, 1.6, '#a2483d');
  box(village, 41.8, 1.3, -2.32, 0.4, 0.08, 0.07, '#382e29');
  point('job', 'ডাকঘরে পার্সেলের কাজ', 'job', 49, -2.1); landmark('post', 'চিলাহাটি ডাকঘর', 49, -9);

  // Mosque: cream courtyard, emerald dome, shaded entrance and slender minaret.
  const mosque = new THREE.Group(); mosque.position.set(-52, 0, 27); village.add(mosque);
  box(mosque, 0, 0.12, 2.7, 28, 0.24, 24, '#cbbf9f');
  box(mosque, 0, 2.7, 0, 19, 5.2, 14, '#eee0b8');
  box(mosque, 0, 5.42, 0, 20, 0.3, 15.2, '#d8cb9e');
  const dome = new THREE.Mesh(new THREE.SphereGeometry(4.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), material('#538378'));
  dome.position.set(0, 5.65, 0); dome.castShadow = true; mosque.add(dome);
  cylinder(mosque, 0, 10.4, 0, 0.06, 0.06, 1.5, '#d7b45d'); sphere(mosque, 0, 11.2, 0, 0.18, '#e7c470');
  for (let x = -6; x <= 6; x += 3) {
    box(mosque, x, 2.2, 7.06, 1.7, 3.1, 0.08, '#35665e');
    const arch = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), material('#35665e')); arch.position.set(x, 3.75, 7.09); arch.scale.z = 0.15; mosque.add(arch);
  }
  sign(mosque, 'জামে মসজিদ', 0, 4.63, 7.2, 8.3, 1.05, '#36685e', '#fff0c1', 'MOSQUE · REFERENCE MODEL');
  cylinder(mosque, -11.5, 6.3, -3, 0.9, 1.1, 12.6, '#e6dbb5');
  cylinder(mosque, -11.5, 12, -3, 1.5, 1.5, 0.6, '#5e8b79');
  cylinder(mosque, -11.5, 13.25, -3, 0.64, 0.75, 2.1, '#eee2bd');
  const minaretCap = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.8, 12), material('#4b7c6e')); minaretCap.position.set(-11.5, 15.2, -3); mosque.add(minaretCap);
  box(mosque, -10.9, 13.4, -3, 0.6, 0.35, 0.36, '#74826d');
  obstacle(-52, 27, 19, 14); obstacle(-63.5, 24, 2.4, 2.4);
  point('mosque', 'মসজিদ ও নামাজের সময়', 'mosque', -43, 37.7); landmark('mosque', 'জামে মসজিদ', -52, 27);

  // School and a player's first home.
  const school = house(55, 64, 26, 12, '#e2c38d', '#8d6554', 2, Math.PI);
  sign(school, 'চিলাহাটি বিদ্যালয়', 0, 6.7, 6.18, 19.8, 1.7, '#295d58', '#fff0c7', 'SCHOOL · ILLUSTRATIVE BUILDING');
  box(village, 55, 0.04, 49, 28, 0.06, 15, '#c3b486', false);
  for (const xx of [40, 70]) box(village, xx, 0.7, 51, 0.35, 1.4, 20, '#b7a277');
  point('school', 'পড়াশোনা ও দক্ষতা', 'school', 52, 53.5); landmark('school', 'বিদ্যালয়', 55, 64);
  const home = house(-37, 73, 12, 9, '#d9c49f', '#6e8d80', 1, Math.PI);
  sign(home, 'আপনার নতুন ঠিকানা', 0, 3.5, 4.7, 9.6, 1.05, '#626f51', '#fff3d5');
  box(village, -37, 0.035, 64, 17, 0.05, 9, '#bdad86', false);
  point('home', 'ঘর ভাড়া ও বাড়ি কেনা', 'home', -33, 65); landmark('home', 'আপনার বাড়ি', -37, 73);
  bicycle(village, -30, 78, '#ac634b').rotation.y = 1.9;

  const bag = new THREE.Group(); bag.position.set(-5, 0, -9); village.add(bag);
  box(bag, 0, 0.32, 0, 0.58, 0.64, 0.3, '#9d7050');
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 5, 10, Math.PI), material('#6b5038')); handle.position.y = 0.7; bag.add(handle);
  point('bag', 'হারিয়ে যাওয়া ব্যাগ', 'bag', -5, -8.5);

  // Rural perimeter: green water, crop plots, homes and dirt paths.
  const pond = new THREE.Mesh(new THREE.CircleGeometry(25, 36), new THREE.MeshStandardMaterial({ color: '#6c9d8d', roughness: 0.38, metalness: 0.14 }));
  pond.rotation.x = -Math.PI / 2; pond.scale.y = 0.66; pond.position.set(-91, 0.07, 85); village.add(pond);
  const bank = new THREE.Mesh(new THREE.RingGeometry(25, 27.4, 36), material('#b4aa77')); bank.rotation.x = -Math.PI / 2; bank.scale.y = 0.66; bank.position.set(-91, 0.075, 85); village.add(bank);
  obstacle(-91, 85, 43, 25);
  for (let i = 0; i < 5; i++) {
    const x = 78 + i * 23;
    box(village, x, 0.025, 104, 20, 0.03, 70, i % 2 ? '#91a65a' : '#a7ad63', false);
    for (let j = 0; j < 9; j++) box(village, x - 9 + j * 2.2, 0.13, 104, 0.32, 0.2, 66, '#7f9954', false);
  }
  for (let i = 0; i < 16; i++) {
    const x = (i % 2 ? -1 : 1) * (62 + random() * 115);
    const z = 95 + Math.floor(i / 2) * 22;
    house(x, z, 8 + random() * 5, 7 + random() * 3, ['#ccb993', '#bbbaa0', '#c6aa88'][i % 3]!, ['#7d8d7a', '#a87250', '#758f86'][i % 3]!, 1);
  }
  for (let i = 0; i < 57; i++) {
    const side = i % 2 ? -1 : 1;
    let x = side * (38 + random() * 155); let z = -70 + random() * 310;
    if (x < -65 && x > -117 && z > 62 && z < 106) z += 50;
    tree(village, x, z, 4.5 + random() * 6.5, ['#527946', '#63864c', '#698744'][i % 3]!);
  }
  for (const x of [-10.2, 10.2]) for (let z = 18; z < 155; z += 33) {
    cylinder(village, x, 3.6, z, 0.12, 0.17, 7.2, '#7f7d66', 7);
    box(village, x + (x < 0 ? 0.7 : -0.7), 7.15, z, 1.6, 0.12, 0.14, '#6c7567');
    box(village, x + (x < 0 ? 1.35 : -1.35), 7.1, z, 0.6, 0.1, 0.35, '#e5d6a1');
  }
  for (let i = 0; i < 18; i++) {
    const x = (i % 2 ? -1 : 1) * (8 + random() * 7);
    const z = -13 + random() * 100;
    const npc = person(village, x, z, ['#c78456', '#85a398', '#c9b570', '#a77c83', '#697f8d'][i % 5]!, i % 3 === 0);
    animated.push({ group: npc, x, z, phase: random() * Math.PI * 2, travel: i % 4 === 0 ? 0 : 4 + random() * 8 });
  }
  const flag = new THREE.Group(); flag.position.set(72, 0, 48); village.add(flag);
  cylinder(flag, 0, 4.6, 0, 0.065, 0.1, 9.2, '#a0aa8f', 7);
  box(flag, 1.2, 8.2, 0, 2.35, 1.5, 0.035, '#28714e', false);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(0.44, 18), material('#ba5743')); sun.position.set(1.06, 8.2, 0.03); flag.add(sun);

  return {
    spawn: new THREE.Vector3(0, 0, 10), colliders, interactables, landmarks,
    update(dt, time) {
      for (let i = 0; i < markers.length; i++) { const marker = markers[i]!; marker.position.y = 2.12 + Math.sin(time * 1.7 + i) * 0.12; marker.rotation.y += dt * 0.7; }
      for (const item of animated) {
        const phase = time * 0.22 + item.phase;
        item.group.position.z = item.z + Math.sin(phase) * item.travel;
        item.group.rotation.y = Math.cos(phase) > 0 ? 0 : Math.PI;
        item.group.position.y = item.travel ? Math.sin(time * 5 + item.phase) * 0.025 : 0;
      }
      // A passing arrival brings life to the railway without obstructing the player.
      const trainCycle = time % 180;
      train.position.x = trainCycle < 110 ? -43 : -43 + (trainCycle - 110) * 4;
    },
  };
}
