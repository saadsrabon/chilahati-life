import * as THREE from 'three';
import './style.css';
import { createWorld } from './world';
import { loadSourceMap } from './source-map';
import { person, bicycle, motorcycle, box, animatePerson } from './scene-assets';
import { createGameState, performAction, advanceSimulation, saveGame, loadGame, formatTime } from './simulation';
import { mountUI, type HUDView } from './ui';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
let renderer: THREE.WebGLRenderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
catch {
  document.querySelector('#ui')!.innerHTML = '<div style="margin:10vh auto;padding:32px;max-width:540px;background:#faf4e5;color:#193f32;border-radius:12px;font-family:system-ui"><h1>Chilahati Life</h1><p>Your browser could not start the 3D view. Enable hardware acceleration or try an updated Chrome, Edge or Firefox browser.</p><button onclick="location.reload()">Try again</button></div>';
  throw new Error('WebGL unavailable');
}
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#b9d2cc');
scene.fog = new THREE.Fog('#b9d2cc', 140, 650);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.15, 1800);
const hemi = new THREE.HemisphereLight('#f5efd8', '#6c7750', 2.4);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffe7b2', 3.3);
sun.position.set(-65, 100, 35); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -120; sun.shadow.camera.right = 120;
sun.shadow.camera.top = 120; sun.shadow.camera.bottom = -120; sun.shadow.normalBias = 0.035;
scene.add(sun); scene.add(sun.target);
const world = createWorld(scene);
let state = loadGame() ?? createGameState();
let started = false, yaw = 0, pitch = 0.31, speed = 0, elapsed = 0, hudTimer = 0, autosave = 0;
let routeTarget: string | null = null, policeWarned = false;
const walkVelocity = new THREE.Vector3();
let gaitPhase = 0, gaitAmount = 0;
const input = new Set<string>();
const position = world.spawn.clone();
const player = new THREE.Group(); scene.add(player);
const onFoot = person(player, 0, 0, '#e6bd58', true, 'lungi');
const cycle = bicycle(player, 0, 0, '#3a6f68');
const motor = motorcycle(player, 0, 0, '#b35337');
const van = bicycle(player, 0, 0, '#26776b', true);
const rider = person(cycle, 0, 0, '#e6bd58'); rider.position.y = 0.3; rider.scale.setScalar(0.92);
const motorRider = person(motor, 0, 0, '#e6bd58'); motorRider.position.y = 0.4; motorRider.scale.setScalar(0.92);
const vanRider = person(van, 0, 0, '#e6bd58'); vanRider.position.y = 0.3; vanRider.scale.setScalar(0.92);
for (const seatedRider of [rider, motorRider, vanRider]) { seatedRider.rotation.y = Math.PI; animatePerson(seatedRider, 0, 0, true); }
const officer = new THREE.Group(); scene.add(officer); person(officer, 0, 0, '#38556b');
officer.position.set(24, 0, 0); officer.visible = false;
const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.04, 24), new THREE.MeshBasicMaterial({color:'#f8dc80',transparent:true,opacity:0.8}));
scene.add(marker); marker.visible = false;
let ui: ReturnType<typeof mountUI>;
let audio: AudioContext | undefined;
let audioReady = false;
function chime(freq = 540, length = 0.08) {
  if (!state.settings.sound || !audioReady) return;
  try {
    audio ??= new AudioContext();
    const osc=audio.createOscillator(), gain=audio.createGain();
    osc.type='sine'; osc.frequency.value=freq; gain.gain.setValueAtTime(0.025,audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,audio.currentTime+length);
    osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(audio.currentTime+length);
  } catch { /* Ambient sound is optional. */ }
}
function persist(quiet = false) {
  const saved = saveGame(state);
  try { localStorage.setItem('chilahati-life-position-v1', JSON.stringify({ x:position.x,z:position.z,yaw })); } catch {}
  if (!quiet) ui.toast(saved ? 'Your village life is saved on this device.' : 'Saving is unavailable. Check browser storage permissions.');
}
function restorePosition() {
  try {
    const raw=JSON.parse(localStorage.getItem('chilahati-life-position-v1')??'null');
    if(raw && Number.isFinite(raw.x)&&Number.isFinite(raw.z)&&Math.abs(raw.x)<1100&&Math.abs(raw.z)<1100) {
      position.set(raw.x,0,raw.z); yaw=Number.isFinite(raw.yaw)?raw.yaw:0;
      if(collides(position.x,position.z)) position.copy(world.spawn);
    }
  } catch {}
}
function applyQuality() {
  const high=state.settings.quality==='high';
  renderer.setPixelRatio(Math.min(devicePixelRatio,high?1.75:1.15)); renderer.shadowMap.enabled=high;
  renderer.setSize(innerWidth,innerHeight);
}
function nearest() {
  let best: typeof world.interactables[number] | undefined, distance=Infinity;
  for(const point of world.interactables) {
    const d=Math.hypot(position.x-point.x,position.z-point.z);
    if(d<distance){best=point;distance=d;}
  }
  return {point:best,distance};
}
function isNear(id:string,distance=8) {
  const p=world.interactables.find(p=>p.id===id);
  return !!p&&Math.hypot(position.x-p.x,position.z-p.z)<distance;
}
function navigate(id:string) {
  routeTarget=id; const target=world.interactables.find(p=>p.id===id);
  if(target){ui.toast('Follow the gold marker to '+target.label+'.');ui.closePanel();}
}
function collides(x:number,z:number) {
  const radius=state.vehicle==='walk'?0.45:0.85;
  return world.colliders.some(b=>Math.abs(x-b.x)<b.hx+radius&&Math.abs(z-b.z)<b.hz+radius);
}
function doAction(action:string) {
  if(action.startsWith('navigate-')) { navigate(action.slice(9));return; }
  if(action==='save'){persist();return;}
  if(action==='interact'){
    if(state.heat>0&&officer.visible&&officer.position.distanceTo(position)<5){ui.openPanel('police');return;}
    const n=nearest();
    if(n.point&&n.distance<8)ui.openPanel(n.point.kind);
    else ui.toast('Walk toward a gold marker to meet someone or visit a place.');
    return;
  }
  if(action==='map'||action==='help'||action==='inventory'||action==='settings'){ui.openPanel(action);return;}
  if(action==='transport'||action==='vehicle'){ui.openPanel('rental');return;}
  let at:string|undefined;
  if(/^(rent|buy)-(van|bicycle|motorcycle)$/.test(action))at='rental';
  else if(['buy-tea','buy-meal','open-tea-stall','restock-tea-stall','serve-tea-order'].includes(action))at='tea';
  else if(['borrow','repay','deposit','withdraw'].includes(action))at='loan';
  else if(action==='buy-home'||action==='rest')at='home';
  else if(['study','complete-job','tutor','teach'].includes(action))at='school';
  else if(action==='start-job'||action==='return-bag')at='job';
  else if(action==='steal-bag')at='bag';
  if(at&&!isNear(at)){
    navigate(at);ui.toast('Visit '+(world.interactables.find(p=>p.id===at)?.label??at)+' first. Follow the gold marker.');return;
  }
  if(action==='pay-fine'&&!(state.heat>0&&officer.position.distanceTo(position)<8)){ui.toast('There is no officer here to resolve an incident.');return;}
  const before=state.vehicle;
  const result=performAction(state,action);
  ui.toast(result.message);
  if(result.ok){
    chime(action==='steal-bag'?180:580);
    if(action==='start-job')navigate('school');
    if(action==='complete-job')routeTarget=null;
    if(action==='steal-bag'){policeWarned=false;ui.closePanel();ui.toast('A witness reported the missing bag. Police are looking for you. Return it at the post office.');}
    if(action==='return-bag'||action==='pay-fine')policeWarned=false;
    if(before!==state.vehicle){speed=0;walkVelocity.set(0,0,0);gaitAmount=0;ui.closePanel();}
    persist(true); updateHUD();
  }
}
ui=mountUI({
  onStart(fresh) {
    if(fresh){state=createGameState();position.copy(world.spawn);yaw=0;speed=0;routeTarget=null;}
    else restorePosition();
    started=true;audioReady=true;applyQuality();ui.closePanel();
    ui.toast('Welcome to Chilahati. Visit the van stand or collect a delivery at the post office.');
    updateHUD();
  },
  onAction:doAction,
  onSetting(key,value) {
    if(key==='quality'){state.settings.quality=value==='high'?'high':'low';applyQuality();}
    if(key==='sound'){state.settings.sound=value==='true'||value==='on';if(state.settings.sound){audioReady=true;chime();}}
    persist(true);
  },
  onInput(control,pressed){pressed?input.add(control):input.delete(control);},
  onLook(dx,dy){yaw-=dx*0.004;pitch=THREE.MathUtils.clamp(pitch+dy*0.003,-0.04,0.8);}
});
applyQuality();
const controls:Record<string,string>={KeyW:'forward',ArrowUp:'forward',KeyS:'backward',ArrowDown:'backward',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',ShiftLeft:'sprint',ShiftRight:'sprint',Space:'brake'};
addEventListener('keydown',e=>{
  if((e.target as HTMLElement)?.matches('input,select,textarea'))return;
  if(controls[e.code]){input.add(controls[e.code]);e.preventDefault();}
  if(e.repeat||!started)return;
  if(e.code==='KeyE')doAction('interact');
  if(e.code==='KeyM')ui.openPanel('map');
  if(e.code==='KeyV')ui.openPanel('rental');
  if(e.code==='KeyI')ui.openPanel('inventory');
  if(e.code==='KeyX')doAction('dismount');
  if(e.code==='KeyH')ui.openPanel('help');
  if(e.code==='Escape'){ui.isPanelOpen()?ui.closePanel():ui.openPanel('help');input.clear();}
});
addEventListener('keyup',e=>input.delete(controls[e.code]??''));
addEventListener('blur',()=>{input.clear();if(started)persist(true);});
let dragging=false,lastX=0,lastY=0;
canvas.addEventListener('pointerdown',e=>{if(!started)return;dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw-=(e.clientX-lastX)*0.004;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-lastY)*0.003,-0.04,0.8);lastX=e.clientX;lastY=e.clientY;});
canvas.addEventListener('pointerup',()=>dragging=false);
canvas.addEventListener('pointercancel',()=>dragging=false);
canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
document.addEventListener('visibilitychange',()=>{input.clear();if(started)persist(true);});
function updateHUD() {
  const n=nearest();
  const target=routeTarget?world.interactables.find(p=>p.id===routeTarget):undefined;
  const distance=target?Math.round(Math.hypot(position.x-target.x,position.z-target.z)):0;
  const location=n.distance<28&&n.point?n.point.label:'Chilahati village';
  const job=state.job.active?'Deliver the parcel to the school'+(target?' · '+distance+' m':''):target?'Visit '+target.label+' · '+distance+' m':'Find your first job at the post office';
  const gameMinute = (state.day - 1) * 1440 + state.minutes;
  const work = {
    lessons: state.lessonCount,
    tutoringShifts: state.career.tutoringShifts,
    sessionReady: gameMinute >= state.career.schoolAvailableAt,
    taughtToday: state.career.lastTeachingDay === state.day,
    teaStall: state.teaStall,
    teaOrderReady: gameMinute >= state.teaStall.orderAvailableAt,
  };
  const view:HUDView={cash:state.cash,debt:state.debt,trust:state.trust,heat:state.heat,energy:state.energy,time:formatTime(state.minutes),day:state.day,vehicle:state.vehicle,location,prompt:n.point&&n.distance<8?n.point.label:'Explore the village',job,fps,ownedVehicles:state.ownedVehicles,ownsHome:state.ownsHome,inventory:state.inventory,log:state.log,started,work};
  ui.update(view); drawMap();
}
const drawSourceMap = loadSourceMap();
function drawMap(){
  const map=document.querySelector<HTMLCanvasElement>('#village-map');
  if(!map)return;
  const ctx=map.getContext('2d');if(!ctx)return;
  const w=map.width=640,h=map.height=440;
  ctx.fillStyle='#e6e6c8';ctx.fillRect(0,0,w,h);
  const scale=1.8,ox=w/2,oz=105;
  const px=(x:number)=>ox+x*scale,pz=(z:number)=>oz+z*scale;
  ctx.strokeStyle='#8b9680';ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(px(0),pz(-50));ctx.lineTo(px(0),pz(185));ctx.stroke();
  ctx.lineWidth=10;for(const z of [0,51]){ctx.beginPath();ctx.moveTo(px(-100),pz(z));ctx.lineTo(px(100),pz(z));ctx.stroke();}
  ctx.strokeStyle='#4e6258';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,pz(-45));ctx.lineTo(w,pz(-45));ctx.stroke();
  ctx.font='12px system-ui';ctx.textBaseline='middle';
  for(const p of world.interactables){ctx.fillStyle='#b4862e';ctx.beginPath();ctx.arc(px(p.x),pz(p.z),4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#193f32';ctx.fillText(p.label,px(p.x)+8,pz(p.z)-8);}
  ctx.fillStyle='#c8543b';ctx.beginPath();ctx.arc(px(position.x),pz(position.z),6,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#193f32';ctx.font='bold 13px system-ui';ctx.fillText('Playable station-area guide · illustrative layout',15,h-38);
  drawSourceMap();
}
let frameCount=0,fps=60,fpsTime=0;
let last=performance.now();
const desiredCamera=new THREE.Vector3();
const targetLook=new THREE.Vector3();
function frame(now:number){
  requestAnimationFrame(frame);
  const dt=Math.min((now-last)/1000,0.05);last=now;elapsed+=dt;frameCount++;fpsTime+=dt;
  if(fpsTime>1){fps=Math.round(frameCount/fpsTime);frameCount=0;fpsTime=0;}
  const paused=ui.isPanelOpen();
  if(started&&!paused){
    const events=advanceSimulation(state,dt);
    if(events.azan)ui.toast(events.azan+' · demo game-clock prayer event. Azan recording pending local approval.');
    if(events.message)ui.toast(events.message);
    const forward=(input.has('forward')?1:0)-(input.has('backward')?1:0);
    const turn=(input.has('right')?1:0)-(input.has('left')?1:0);
    let dx=0,dz=0;
    if(state.vehicle==='walk'){
      const walkingSpeed=input.has('sprint')&&state.energy>1?7.5:4.4;
      dx=(Math.sin(yaw)*forward+Math.cos(yaw)*turn)*walkingSpeed*dt;
      dz=(-Math.cos(yaw)*forward+Math.sin(yaw)*turn)*walkingSpeed*dt;
      const length=Math.hypot(dx,dz);if(length>walkingSpeed*dt){dx*=walkingSpeed*dt/length;dz*=walkingSpeed*dt/length;}
      walkVelocity.lerp(new THREE.Vector3(dx / Math.max(dt, 0.001), 0, dz / Math.max(dt, 0.001)), 1 - Math.exp(-dt * 10));
      dx = walkVelocity.x * dt; dz = walkVelocity.z * dt;
      const actualSpeed = Math.hypot(walkVelocity.x, walkVelocity.z);
      gaitAmount = THREE.MathUtils.damp(gaitAmount, Math.min(actualSpeed / 3.8, 1), 10, dt);
      gaitPhase += actualSpeed * dt * 4.1;
      if(actualSpeed>0.08){const desiredAngle=Math.atan2(dx,dz);const difference=THREE.MathUtils.euclideanModulo(desiredAngle-player.rotation.y+Math.PI,Math.PI*2)-Math.PI;player.rotation.y+=difference*(1-Math.exp(-dt*12));if(input.has('sprint'))state.energy=Math.max(0,state.energy-dt*0.25);}
    }else{
      const max=state.vehicle==='motorcycle'?17:state.vehicle==='bicycle'?9.5:8;
      speed=THREE.MathUtils.damp(speed,forward*max,input.has('brake')?12:2.4,dt);
      yaw+=turn*dt*(speed<0?-1:1)*1.5*(Math.abs(speed)>0.3?1:0.4);
      dx=Math.sin(yaw)*speed*dt;dz=-Math.cos(yaw)*speed*dt;player.rotation.y=-yaw;
      if(state.vehicle==='bicycle'&&Math.abs(speed)>2)state.energy=Math.max(0,state.energy-dt*0.06);
    }
    if(Math.abs(position.x+dx)<1050&&!collides(position.x+dx,position.z))position.x+=dx;else speed*=0.3;
    if(Math.abs(position.z+dz)<1050&&!collides(position.x,position.z+dz))position.z+=dz;else speed*=0.3;
    const target=routeTarget?world.interactables.find(p=>p.id===routeTarget):undefined;
    marker.visible=!!target;
    if(target){marker.position.set(target.x,0.12,target.z);marker.scale.setScalar(1+Math.sin(elapsed*3)*0.1);if(isNear(routeTarget!,5)){routeTarget=null;ui.toast('You have arrived. Press E or tap Interact.');}}
    if(state.heat>0){
      officer.visible=true;
      const direction=position.clone().sub(officer.position);direction.y=0;
      if(direction.length()>3){officer.position.addScaledVector(direction.normalize(),dt*3.5);officer.rotation.y=Math.atan2(direction.x,direction.z);}
      else if(!policeWarned){policeWarned=true;ui.toast('An officer wants to speak to you. Interact to resolve the complaint.');}
    }else officer.visible=false;
    autosave+=dt;if(autosave>25){persist(true);autosave=0;}
  }
  player.position.copy(position);
  animatePerson(onFoot, gaitPhase, state.vehicle === 'walk' && !paused ? gaitAmount : 0);
  onFoot.visible=state.vehicle==='walk';cycle.visible=state.vehicle==='bicycle';motor.visible=state.vehicle==='motorcycle';van.visible=state.vehicle==='van';
  if(!started){
    const angle=Math.sin(elapsed*0.055)*0.2;
    desiredCamera.set(24+Math.sin(angle)*25,12,-2+Math.cos(angle)*35);targetLook.set(0,3,-24);
  }else{
    const distance=state.vehicle==='walk'?7.5:10.5;
    desiredCamera.set(position.x-Math.sin(yaw)*distance,2.7+Math.sin(pitch)*distance,position.z+Math.cos(yaw)*distance);
    targetLook.set(position.x,1.5,position.z);
  }
  camera.position.lerp(desiredCamera,1-Math.exp(-dt*(started?7:1)));
  camera.lookAt(targetLook);
  const time=state.minutes/60;
  const daylight=THREE.MathUtils.clamp(Math.sin((time-6)/12*Math.PI),0.08,1);
  hemi.intensity=1.0+daylight*1.35;sun.intensity=0.25+daylight*3;
  sun.position.set(position.x-65,80,position.z+35);sun.target.position.copy(position);
  world.update(paused&&started?0:dt,elapsed);
  renderer.render(scene,camera);
  hudTimer+=dt;if(hudTimer>0.16){hudTimer=0;updateHUD();}
}
camera.position.set(24,12,36);camera.lookAt(0,3,-24);
requestAnimationFrame(frame);
updateHUD();
Object.assign(window,{chilahatiDebug:{get state(){return state;},get position(){return {x:position.x,z:position.z};},get world(){return world;},perform:doAction}});

