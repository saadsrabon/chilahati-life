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

export interface PersonRig { leftArm: THREE.Group; rightArm: THREE.Group; leftLeg: THREE.Group; rightLeg: THREE.Group; leftKnee: THREE.Group; rightKnee: THREE.Group; torso: THREE.Group; }

let lungiMaterial: THREE.MeshStandardMaterial | undefined;
function checkedLungi(): THREE.MeshStandardMaterial {
  if (lungiMaterial) return lungiMaterial;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#365d67'; ctx.fillRect(0,0,128,128);
  for(let i=0;i<128;i+=32){ctx.fillStyle='#81a49a';ctx.fillRect(i,0,11,128);ctx.fillRect(0,i,128,11);ctx.fillStyle='#b9bb91';ctx.fillRect(i+13,0,2,128);ctx.fillRect(0,i+13,128,2);}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  lungiMaterial=new THREE.MeshStandardMaterial({map:texture,roughness:1});return lungiMaterial;
}

/** A 1.75m articulated figure. Local +Z is the face/walking direction. */
export function person(parent: THREE.Object3D, x: number, z: number, shirt: string, lungi = false, dress: 'kurta'|'lungi'|'salwar' = lungi?'lungi':'kurta'): THREE.Group {
  const group = new THREE.Group(); group.position.set(x, 0, z); parent.add(group);
  const skin='#a57550', hair='#29251f', cloth=shirt;
  const torso = new THREE.Group(); group.add(torso);
  // Shoulders and waist have human proportions rather than oversized heads and barrel bodies.
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.215,0.18,0.53,10),material(cloth)); body.scale.z=0.59;body.position.y=1.17;body.castShadow=true;torso.add(body);
  cylinder(torso,0,1.47,0,0.061,0.07,0.12,skin,8);
  sphere(torso,0,1.61,0,0.145,skin,new THREE.Vector3(0.89,1.12,0.92));
  sphere(torso,0,1.71,-0.022,0.14,hair,new THREE.Vector3(0.94,0.52,0.96));
  sphere(torso,0,1.606,0.133,0.026,skin,new THREE.Vector3(0.65,0.9,0.9));
  for(const xx of [-0.049,0.049])sphere(torso,xx,1.647,0.12,0.009,'#302b23');
  const collar=box(torso,0,1.405,0.075,0.12,0.08,0.07,dress==='salwar'?'#e0c08e':'#ece1c5');
  collar.rotation.x=0.13;
  if(dress==='kurta'){
    const hem=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.23,0.37,10),material(cloth));hem.scale.z=0.66;hem.position.y=0.82;hem.castShadow=true;torso.add(hem);
    box(torso,0,1.22,0.133,0.026,0.38,0.015,'#c7b588');
  }else if(dress==='lungi'){
    const wrap=new THREE.Mesh(new THREE.CylinderGeometry(0.19,0.24,0.63,12),checkedLungi());wrap.scale.z=0.72;wrap.position.y=0.565;wrap.castShadow=true;torso.add(wrap);
    box(torso,0.09,0.865,0.13,0.15,0.11,0.04,'#759489');
  }else{
    const kameez=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.255,0.48,12),material(cloth));kameez.scale.z=0.7;kameez.position.y=0.76;kameez.castShadow=true;torso.add(kameez);
    // Orna crosses the shoulders and falls down the back, distinct from a Western dress.
    box(torso,-0.12,1.33,0.145,0.12,0.29,0.035,'#e4bd89');
    box(torso,0.12,1.22,-0.14,0.13,0.53,0.035,'#e4bd89');
    sphere(torso,0,1.62,-0.055,0.15,hair,new THREE.Vector3(0.92,1.05,0.78));
    sphere(torso,0,1.51,-0.16,0.074,hair);
  }
  function arm(side:number){const pivot=new THREE.Group();pivot.position.set(side*0.255,1.385,0);torso.add(pivot);
    cylinder(pivot,0,-0.145,0,0.068,0.061,0.29,cloth,8);cylinder(pivot,0,-0.408,0.012,0.052,0.043,0.25,skin,8);sphere(pivot,0,-0.552,0.02,0.047,skin,new THREE.Vector3(0.8,1.15,0.8));pivot.rotation.z=side*0.06;return pivot;}
  function leg(side:number){const pivot=new THREE.Group();pivot.position.set(side*0.105,0.88,0);group.add(pivot);
    const trouser=dress==='lungi'?skin:dress==='salwar'?'#d9be8a':'#e4dfcb';
    cylinder(pivot,0,-0.205,0,0.085,0.062,0.41,trouser,8);const knee=new THREE.Group();knee.position.y=-0.405;pivot.add(knee);
    cylinder(knee,0,-0.19,0,0.06,0.043,0.38,trouser,8);box(knee,0,-0.425,0.065,0.115,0.07,0.23,'#554638');return {pivot,knee};}
  const left=leg(-1),right=leg(1);
  group.userData.rig={leftArm:arm(-1),rightArm:arm(1),leftLeg:left.pivot,rightLeg:right.pivot,leftKnee:left.knee,rightKnee:right.knee,torso} satisfies PersonRig;
  group.userData.dress=dress;
  return group;
}

export function animatePerson(group: THREE.Group, phase: number, amount=1, seated=false): void {
  const rig=group.userData.rig as PersonRig|undefined;if(!rig)return;
  const gait=Math.sin(phase)*0.55*amount;
  rig.leftLeg.rotation.x=seated?-1.2:gait;rig.rightLeg.rotation.x=seated?-1.2:-gait;
  rig.leftKnee.rotation.x=seated?1.2:Math.max(0,-Math.sin(phase))*0.65*amount;
  rig.rightKnee.rotation.x=seated?1.2:Math.max(0,Math.sin(phase))*0.65*amount;
  rig.leftArm.rotation.x=seated?-0.85:-gait*0.8;rig.rightArm.rotation.x=seated?-0.85:gait*0.8;
  rig.torso.position.y=seated?0:Math.abs(Math.sin(phase))*0.035*amount;
  rig.torso.rotation.z=seated?0:Math.sin(phase)*0.025*amount;
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
