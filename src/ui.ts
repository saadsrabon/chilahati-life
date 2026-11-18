export interface HUDView {
  cash: number; debt: number; trust: number; heat: number; energy: number;
  time: string; day: number; vehicle: string; location: string; prompt: string;
  job: string; fps: number; ownedVehicles: string[]; ownsHome: boolean;
  inventory: { tea: number; meals: number }; log: string[]; started: boolean;
}

interface Callbacks {
  onStart: (fresh: boolean) => void;
  onAction: (action: string) => void;
  onSetting: (key: string, value: string) => void;
  onInput: (control: string, pressed: boolean) => void;
  onLook: (dx: number, dy: number) => void;
}

const icons: Record<string, string> = {
  bag: '<path d="M6 7h12l2 14H4L6 7Z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Z"/><path d="M9 3v16m6-14v16"/>',
  settings: '<path d="M4 7h16M4 17h16M8 4v6m8 4v6"/><circle cx="8" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.1 1-1.1 2.2M12 17h.01"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  save: '<path d="M5 3h12l4 4v14H3V3h2Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/>',
  arrow: '<path d="M12 20V4m-6 6 6-6 6 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
};
function icon(name: string) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.chevron}</svg>`; }
const money = (n: number) => `৳ ${Math.round(n).toLocaleString('en-BD')}`;
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]!));

export function mountUI(callbacks: Callbacks) {
  const container = document.getElementById('ui');
  if (!container) throw new Error('The game interface could not find #ui.');
  let view: HUDView | null = null;
  let panel = '';
  let panelSignature = '';
  let toastTimer = 0;
  let sound = true;
  let quality = 'high';

  container.innerHTML = `
    <div class="game-vignette" aria-hidden="true"></div>
    <section class="start-screen" id="start-screen" aria-label="Chilahati Life start menu">
      <div class="start-wordmark"><span class="wordmark-symbol" aria-hidden="true">চি</span><span>CHILAHATI LIFE</span></div>
      <div class="start-copy">
        <h1 lang="bn">চিলাহাটি জীবন</h1>
        <p class="start-translation">A little village.<br>A life of your own.</p>
        <p class="start-description">Catch the morning train crowd. Earn your first fare. Open a shop. Find your own way through Chilahati.</p>
        <div class="start-actions"><button class="button button-primary start-button" data-start="continue">Start your story ${icon('chevron')}</button><button class="button button-quiet" data-start="new">New game</button></div>
        <div class="start-input-hint"><span class="desktop-hint"><kbd>W A S D</kbd> Move <span class="hint-dot"></span> Drag to look <span class="hint-dot"></span> <kbd>E</kbd> Interact</span><span class="mobile-hint">Touch controls · Drag the village to look around</span></div>
      </div>
      <div class="start-footer"><span>DOMAR · NILPHAMARI · BANGLADESH</span><span>Early build · geography under verification</span></div>
    </section>

    <div class="game-hud" id="game-hud" hidden>
      <header class="hud-header">
        <div class="place-hud"><div class="place-brand">চিলাহাটি জীবন</div><div class="place-name" id="hud-location">Station forecourt</div><div class="time-row">${icon('sun')}<span id="hud-time">08:10</span><span class="time-separator">/</span><span id="hud-day">Day 1</span></div></div>
        <div class="wallet-hud"><span class="wallet-label">IN YOUR POCKET</span><strong id="hud-cash">৳ 500</strong><div class="wallet-details"><span id="hud-debt">Debt ৳ 0</span><span id="hud-vehicle">On foot</span></div></div>
      </header>
      <div class="vitals" aria-label="Player status"><div class="vital"><span>Energy</span><div class="vital-track"><i id="energy-fill"></i></div><b id="hud-energy">100</b></div><div class="vital"><span>Trust</span><div class="vital-track trust-track"><i id="trust-fill"></i></div><b id="hud-trust">50</b></div><div class="heat-vital" id="heat-vital" hidden>Police attention <b id="hud-heat">0</b></div></div>
      <div class="mission-hud"><span class="mission-label">YOUR NEXT CHAPTER</span><p id="hud-job">Find work around the station.</p><span class="mission-tip">Explore. Talk to people. Make a living.</span></div>
      <button class="interact-prompt" id="interact-prompt" data-action="interact" hidden><kbd>E</kbd><span id="hud-prompt">Interact</span></button>
      <nav class="game-toolbar" aria-label="Game tools"><button data-panel="inventory" aria-label="Open backpack" title="Backpack">${icon('bag')}<span>Bag</span></button><button data-panel="map" aria-label="Open village guide" title="Village guide (M)">${icon('map')}<span>Map</span></button><button data-action="save" aria-label="Save game" title="Save game">${icon('save')}<span>Save</span></button><button data-panel="settings" aria-label="Open settings" title="Settings">${icon('settings')}<span>Settings</span></button><button data-panel="help" aria-label="Open controls and help" title="Controls and help">${icon('help')}<span>Help</span></button></nav>
      <div class="touch-controls" id="touch-controls"><div class="touch-dpad"><button class="touch-key touch-up" data-control="forward" aria-label="Move forward">${icon('arrow')}</button><button class="touch-key touch-left" data-control="left" aria-label="Steer left">${icon('arrow')}</button><button class="touch-key touch-down" data-control="backward" aria-label="Move backward or brake">${icon('arrow')}</button><button class="touch-key touch-right" data-control="right" aria-label="Steer right">${icon('arrow')}</button></div><button class="touch-sprint" data-control="sprint" aria-label="Sprint">Run</button><button class="touch-vehicle" data-panel="rental" aria-label="Open vehicles">Ride</button></div>
      <div class="build-mark">EARLY BUILD <span id="hud-fps"></span></div>
    </div>

    <div class="panel-scrim" id="panel-scrim" hidden><section class="game-panel" id="game-panel" role="dialog" aria-modal="true" aria-labelledby="panel-title"><header class="panel-header"><div><p class="panel-location" id="panel-location">Chilahati village</p><h2 id="panel-title"></h2></div><button class="icon-button" id="panel-close" aria-label="Close menu">${icon('close')}</button></header><div class="panel-content" id="panel-content"></div><footer class="panel-footer"><span id="panel-wallet">Your cash</span><span class="desktop-hint"><kbd>Esc</kbd> Close</span><button class="button button-quiet" id="panel-done">Back to village</button></footer></section></div>
    <div class="game-toast" id="game-toast" role="status" aria-live="polite" hidden></div>
  `;

  const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  const scrim = el('panel-scrim');
  const content = el('panel-content');
  const setText = (id: string, value: string) => { const e=el(id); if(e.textContent !== value) e.textContent=value; };
  function toast(message: string) {
    const e = el('game-toast');
    e.textContent = message;
    e.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { e.hidden = true; }, 3800);
  }
  function closePanel() { panel = ''; panelSignature=''; scrim.hidden = true; }
  function item(label: string, detail: string, action: string, price?: number, locked = false) {
    const disabled = locked || (price !== undefined && !!view && view.cash < price);
    return `<button class="shop-item" data-action="${action}" ${disabled?'disabled':''}><span><strong>${label}</strong><small>${detail}</small></span><b>${price === undefined ? icon('chevron') : money(price)}</b></button>`;
  }
  function renderPanel() {
    if (!panel) return;
    const titles: Record<string,string> = {shop:'A little refreshment',rental:'Find your next ride',home:'A place of your own',loan:'Money & borrowing',school:'Learn something new',job:'Work around the station',bag:'Someone left a bag',police:'Resolve a complaint',mosque:'Village mosque',map:'Your village guide',settings:'Make yourself comfortable',help:'A few things to know',inventory:'Your belongings'};
    el('panel-title').textContent=titles[panel]||'Around the village';
    el('panel-location').textContent=view?.location||'Chilahati village';
    el('panel-wallet').textContent=view?`In your pocket ${money(view.cash)}`:'';
    if(panel==='shop') content.innerHTML=`<p class="panel-intro">Take a break before the next fare. A warm cup of tea goes a long way.</p>${item('এক কাপ চা · A cup of tea','A small energy boost.','buy-tea',10)}${item('ভাতের খাবার · A meal','Refuel for the rest of your day.','buy-meal',50)}`;
    else if(panel==='rental') content.innerHTML=`<p class="panel-intro">Start small, earn your way, and make the next vehicle your own.</p><div class="section-label">RENT FOR THE DAY</div>${item('Pedal van','Carry passengers and market deliveries.','rent-van',80)}${item('Bicycle','An easy way around the village.','rent-bicycle',30)}${item('Motorcycle','Cover more ground, a little faster.','rent-motorcycle',150)}<div class="section-label">BUY YOUR OWN</div>${item(view?.ownedVehicles.includes('bicycle')?'Bicycle · owned':'Bicycle','Your first set of wheels.','buy-bicycle',1200,view?.ownedVehicles.includes('bicycle'))}${item(view?.ownedVehicles.includes('van')?'Pedal van · owned':'Pedal van','A vehicle that can earn its keep.','buy-van',4500,view?.ownedVehicles.includes('van'))}${item(view?.ownedVehicles.includes('motorcycle')?'Motorcycle · owned':'Motorcycle','Your own motorcycle, parked at home.','buy-motorcycle',9000,view?.ownedVehicles.includes('motorcycle'))}${view&&view.vehicle!=='walk'?item('Get off your vehicle','Continue exploring on foot.','dismount'):''}`;
    else if(panel==='home') content.innerHTML=`<p class="panel-intro">${view?.ownsHome?'Welcome home. You have a place to rest and keep your belongings.':'A small village home. Somewhere to return to after a long day.'}</p><div class="property-facts"><span>Village home</span><strong>${view?.ownsHome?'Yours':money(3500)}</strong><p>Rest · Storage · Vehicle parking</p></div>${item(view?.ownsHome?'You own this home':'Buy this home','Fictional in-game ownership.','buy-home',3500,view?.ownsHome)}${item('Save your progress','Keep the life you are building.','save')}`;
    else if(panel==='loan') content.innerHTML=`<p class="panel-intro">A little capital can get a small business moving. Keep an eye on what you owe.</p><div class="account-summary"><span>Outstanding debt<strong>${money(view?.debt||0)}</strong></span><span>Cash available<strong>${money(view?.cash||0)}</strong></span></div>${item('Borrow ৳ 500','See your balance change immediately.','borrow')}${item('Repay up to ৳ 100','Reduce your outstanding debt.','repay',undefined,!view?.debt||!view?.cash)}${item('Put up to ৳ 100 into savings','Keep a little aside.','deposit',undefined,!view?.cash)}${item('Withdraw up to ৳ 100','Move your savings into your pocket.','withdraw')}${(view?.heat||0)>0?item('Resolve police fine','Pay the fine and reduce police attention.','pay-fine'):''}`;
    else if(panel==='school') content.innerHTML=`<p class="panel-intro">There is always something new to learn. Build knowledge as you build your life.</p><div class="lesson-note" lang="bn">আজকের পাঠ<br><strong>শেখার কোনো শেষ নেই।</strong></div>${item('Attend a short lesson','Spend a little energy and build village trust.','study')}`;
    else if(panel==='job') content.innerHTML=`<p class="panel-intro">${escape(view?.job||'Someone around the station could use a hand.')}</p><p class="muted-note">Pick up the parcel at the station delivery counter, then take it to the school entrance.</p>${item('Take a delivery job','A small job is a good place to start.','start-job')}${item('Find the school','Mark your delivery destination.','navigate-school')}${item('Hand over your delivery','You need to be near the school entrance.','complete-job')}${item('Offer a free ride','Help a neighbour when you have a vehicle.','free-ride')}`;
    else if(panel==='bag') content.innerHTML=`<p class="panel-intro">A passenger seems to have forgotten something. You can take it, but someone may have seen you. Return it at the Dakghor if you change your mind.</p>${item('Take the bag','A risky choice with possible consequences.','steal-bag')}${item('Return the bag at the Dakghor','Bring it to the post office to help its owner.','return-bag')}`;
    else if(panel==='police') content.innerHTML=`<p class="panel-intro">${view?.heat?'A complaint has brought attention your way. Settle the fine and make a fresh start.':'No complaint is currently waiting for you. Keep looking after your village.'}</p><div class="account-summary"><span>Police attention<strong>${Math.round(view?.heat||0)}</strong></span><span>Cash available<strong>${money(view?.cash||0)}</strong></span></div>${item('Pay the fine','Resolve this incident and reduce attention.','pay-fine',undefined,!view?.heat)}`;
    else if(panel==='mosque') content.innerHTML=`<p class="panel-intro">A familiar part of village life. Prayer events follow this early build’s game clock.</p><div class="lesson-note" lang="bn">চিলাহাটি<br><strong>গ্রামের জামে মসজিদ</strong></div><p class="muted-note">Mosque names, buildings and local prayer schedules are still being verified. This build does not claim to provide actual prayer times. A permission-granted azan recording will be added when available.</p>`;
    else if(panel==='map') content.innerHTML=`<p class="panel-intro">Get to know the first playable district. Explore the station forecourt and look for signs at each place.</p><canvas id="village-map" width="700" height="520" aria-label="Map of the playable village area"></canvas><p class="map-caption">Playable area illustration; verified road survey in progress.</p><div class="village-guide"><div><span class="guide-dot station-dot"></span><strong>Railway station</strong><span>Passengers & work</span></div><div><span class="guide-dot"></span><strong>Tea stalls & shops</strong><span>Food & supplies</span></div><div><span class="guide-dot"></span><strong>Van stand</strong><span>Rent your first ride</span></div><div><span class="guide-dot"></span><strong>Dakghor</strong><span>Village post office</span></div><div><span class="guide-dot"></span><strong>School & mosque</strong><span>Everyday village life</span></div></div>${item('Find the school','Show the delivery destination.','navigate-school')}${item('Find delivery work','Show the station job counter.','navigate-job')}<div class="section-label">FULL WORLD COVERAGE PLAN</div><p class="coverage-copy">Chilahati · Botolganj Bazar · Kazirhat · Boaed Bazar · Bouer Bazar</p><p class="muted-note">Detailed geography and the wider market areas are under development.</p>`;
    else if(panel==='settings') content.innerHTML=`<p class="panel-intro">The same village, with a view that suits your device.</p><label class="setting-row"><span><strong>Graphics quality</strong><small>Lower detail can help on phones.</small></span><select id="quality-setting" aria-label="Graphics quality"><option value="low" ${quality==='low'?'selected':''}>Low</option><option value="high" ${quality==='high'?'selected':''}>High</option></select></label><label class="setting-row"><span><strong>Village sound</strong><small>Ambient sound and available audio.</small></span><button class="setting-toggle ${sound?'is-on':''}" id="sound-setting" aria-pressed="${sound}">${sound?'On':'Off'}</button></label>${item('Save your progress','Continue this life another day.','save')}<p class="muted-note">Saves are stored in this browser on this device.</p>`;
    else if(panel==='help') content.innerHTML=`<p class="panel-intro">A living village, and a little freedom. Earn money, help your neighbours, or take a risk.</p><dl class="controls-list"><div><dt>Move</dt><dd><kbd>W A S D</kbd> or arrow keys</dd></div><div><dt>Look around</dt><dd>Drag across the village</dd></div><div><dt>Interact</dt><dd><kbd>E</kbd> near a place or person</dd></div><div><dt>Run</dt><dd>Hold <kbd>Shift</kbd></dd></div><div><dt>Vehicles</dt><dd><kbd>V</kbd></dd></div><div><dt>Village guide</dt><dd><kbd>M</kbd></dd></div><div><dt>Close menu</dt><dd><kbd>Esc</kbd></dd></div></dl><p class="muted-note">On Android, use the direction buttons and drag the scene to look. Tap the interaction prompt when you approach something.</p><p class="build-disclosure">Early build · geography under verification. Buildings, prices, characters and missions are illustrative while the real Chilahati is mapped.</p>`;
    else if(panel==='inventory') content.innerHTML=`<div class="inventory-summary"><div><span>Tea</span><strong>${view?.inventory.tea||0}</strong></div><div><span>Meals</span><strong>${view?.inventory.meals||0}</strong></div><div><span>Your vehicles</span><strong>${view?.ownedVehicles.length||0}</strong></div></div><p class="panel-intro">${view?.ownsHome?'You own a village home.':'Your first home is waiting somewhere ahead.'}</p><div class="section-label">RECENT VILLAGE LIFE</div><ul class="activity-log">${view?.log.length?view.log.slice(-6).reverse().map(l=>`<li>${escape(l)}</li>`).join(''):'<li>Your story is just beginning.</li>'}</ul>${item('Save your progress','Store this life on your device.','save')}`;
    else content.innerHTML = '<p class="panel-intro">Keep exploring the village.</p>';
  }

  function openPanel(kind: string) { panel=kind;panelSignature='';renderPanel();scrim.hidden=false;el<HTMLButtonElement>('panel-close').focus(); }
  el('panel-close').addEventListener('click',closePanel);
  el('panel-done').addEventListener('click',closePanel);
  scrim.addEventListener('click',e=>{if(e.target===scrim)closePanel();});
  container.addEventListener('click',e=>{
    const target=(e.target as HTMLElement).closest<HTMLElement>('[data-start],[data-action],[data-panel],#sound-setting');
    if(!target||target.hasAttribute('disabled'))return;
    if(target.dataset.start) { callbacks.onStart(target.dataset.start==='new');return; }
    if(target.dataset.panel) { openPanel(target.dataset.panel);return; }
    if(target.id==='sound-setting'){sound=!sound;callbacks.onSetting('sound',String(sound));renderPanel();return;}
    if(target.dataset.action) callbacks.onAction(target.dataset.action);
  });
  container.addEventListener('change',e=>{const t=e.target as HTMLSelectElement;if(t.id==='quality-setting'){quality=t.value;callbacks.onSetting('quality',quality);}});
  container.querySelectorAll<HTMLButtonElement>('[data-control]').forEach(button=>{
    const release=(e:PointerEvent)=>{e.preventDefault();callbacks.onInput(button.dataset.control!,false);};
    button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);callbacks.onInput(button.dataset.control!,true);});
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',()=>callbacks.onInput(button.dataset.control!,false));
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&panel){e.preventDefault();closePanel();}
    if(e.key==='Tab'&&panel){
      const buttons=Array.from(el('game-panel').querySelectorAll<HTMLElement>('button:not(:disabled),select'));
      const first=buttons[0],last=buttons[buttons.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }
  });
  window.addEventListener('blur',()=>['forward','backward','left','right','sprint'].forEach(c=>callbacks.onInput(c,false)));

  function update(next: HUDView) {
    view=next;
    el('start-screen').hidden=next.started;
    el('game-hud').hidden=!next.started;
    setText('hud-location',next.location);
    setText('hud-time',next.time);
    setText('hud-day',`Day ${next.day}`);
    setText('hud-cash',money(next.cash));
    setText('hud-debt',next.debt>0?`Debt ${money(next.debt)}`:'Debt free');
    const names:Record<string,string>={walk:'On foot',van:'Pedal van',bicycle:'Bicycle',motorcycle:'Motorcycle'};
    setText('hud-vehicle',names[next.vehicle]||next.vehicle);
    setText('hud-energy',String(Math.round(next.energy)));
    setText('hud-trust',String(Math.round(next.trust)));
    const energy=Math.max(0,Math.min(100,next.energy)),trust=Math.max(0,Math.min(100,next.trust));
    el('energy-fill').style.width=`${energy}%`;
    el('trust-fill').style.width=`${trust}%`;
    el('heat-vital').hidden=next.heat<=0;
    setText('hud-heat',String(Math.round(next.heat)));
    setText('hud-job',next.job||'Rent a van. Earn your first fare.');
    el('interact-prompt').hidden=!next.prompt||!!panel;
    setText('hud-prompt',next.prompt||'Interact');
    setText('hud-fps',next.fps>0?`${Math.round(next.fps)} FPS`:'');
    if(panel){
      const signature=JSON.stringify([panel,next.cash,next.debt,next.heat,next.vehicle,next.ownedVehicles,next.ownsHome,next.inventory,next.job,next.log.length]);
      if(signature!==panelSignature){const focus=(document.activeElement as HTMLElement)?.dataset.action;renderPanel();panelSignature=signature;if(focus)content.querySelector<HTMLElement>(`[data-action="${focus}"]:not(:disabled)`)?.focus();}
    }
  }
  return {update,toast,openPanel,closePanel,isPanelOpen:()=>!!panel};
}
