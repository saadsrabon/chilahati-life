/** Local, fictional game economy. Money values and prayer timings are prototype data. */
export type Vehicle = 'walk' | 'van' | 'bicycle' | 'motorcycle';

export interface GameState {
  version: 1;
  cash: number;
  bank: number;
  debt: number;
  trust: number;
  heat: number;
  energy: number;
  day: number;
  minutes: number;
  vehicle: Vehicle;
  ownedVehicles: string[];
  ownsHome: boolean;
  inventory: { tea: number; meals: number };
  job: { active: boolean; stage: number; completed: number };
  lessonCount: number;
  career: { tutoringShifts: number; schoolAvailableAt: number; lastTeachingDay: number };
  teaStall: { owned: boolean; ingredients: number; ordersServed: number; orderAvailableAt: number };
  stats: { earned: number; rides: number; stolen: number };
  log: string[];
  settings: { quality: 'low' | 'high'; sound: boolean };
  lastAzanDay: number;
  lastAzanIndex: number;
  bagStatus: 'available' | 'stolen' | 'returned';
  freeRideAvailableAt: number;
  studyAvailableAt: number;
}

export interface ActionResult { ok: boolean; message: string }
export const SAVE_KEY = 'chilahati-life-save-v1';
export const GAME_MINUTES_PER_SECOND = 0.4;
export const SCHOOL_WORK = {
  tutoringLessons: 2, teacherLessons: 4, teacherExperience: 2, tutoringPay: 85, teacherPay: 180,
} as const;
export const TEA_STALL = {
  openingCost: 350, stockCost: 40, stockPack: 5, maxStock: 15, pricePerOrder: 24,
} as const;
/** Illustrative GAME-clock schedule, not Chilahati's verified prayer timetable. */
export const DEMO_PRAYER_SCHEDULE = [
  { name: 'Fajr', minutes: 5 * 60 },
  { name: 'Dhuhr', minutes: 12 * 60 + 15 },
  { name: 'Asr', minutes: 15 * 60 + 30 },
  { name: 'Maghrib', minutes: 17 * 60 + 30 },
  { name: 'Isha', minutes: 19 * 60 },
] as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const now = (state: GameState) => (state.day - 1) * 1440 + state.minutes;
const money = (value: number) => `৳${Math.round(value).toLocaleString('en-US')}`;

export function createGameState(): GameState {
  return {
    version: 1, cash: 650, bank: 0, debt: 0, trust: 50, heat: 0, energy: 100,
    day: 1, minutes: 8 * 60 + 10, vehicle: 'walk', ownedVehicles: [], ownsHome: false,
    inventory: { tea: 0, meals: 0 }, job: { active: false, stage: 0, completed: 0 },
    lessonCount: 0, stats: { earned: 0, rides: 0, stolen: 0 },
    career: { tutoringShifts: 0, schoolAvailableAt: 0, lastTeachingDay: 0 },
    teaStall: { owned: false, ingredients: 0, ordersServed: 0, orderAvailableAt: 0 },
    log: ['Welcome to Chilahati. Your first day is yours to choose.'],
    settings: { quality: 'low', sound: false }, lastAzanDay: 1, lastAzanIndex: 0,
    bagStatus: 'available', freeRideAvailableAt: 0, studyAvailableAt: 0,
  };
}

function record(state: GameState, message: string): ActionResult {
  state.log.unshift(message);
  state.log = state.log.slice(0, 12);
  return { ok: true, message };
}
const fail = (message: string): ActionResult => ({ ok: false, message });

function spend(state: GameState, cost: number): boolean {
  if (state.cash < cost) return false;
  state.cash -= cost;
  return true;
}

function earn(state: GameState, amount: number): void {
  state.cash += amount;
  state.stats.earned += amount;
}

function getVehicle(state: GameState, vehicle: Exclude<Vehicle, 'walk'>, price: number, buy: boolean): ActionResult {
  if (buy && state.ownedVehicles.includes(vehicle)) {
    state.vehicle = vehicle;
    return record(state, `You are riding your ${vehicle}.`);
  }
  if (!buy && state.vehicle === vehicle) return fail(`You are already riding a ${vehicle}.`);
  if (!buy && state.ownedVehicles.includes(vehicle)) {
    state.vehicle = vehicle;
    return record(state, `You are riding your ${vehicle}. No rental charge.`);
  }
  if (!spend(state, price)) return fail(`You need ${money(price)} to ${buy ? 'buy' : 'rent'} a ${vehicle}.`);
  state.vehicle = vehicle;
  if (buy) state.ownedVehicles.push(vehicle);
  return record(state, `${buy ? 'Bought' : 'Rented'} a ${vehicle} for ${money(price)}.`);
}

/** Actions mutate the provided state. World proximity is checked by the caller. */
export function performAction(state: GameState, action: string): ActionResult {
  switch (action) {
    case 'rent-van': return getVehicle(state, 'van', 80, false);
    case 'rent-bicycle': return getVehicle(state, 'bicycle', 30, false);
    case 'rent-motorcycle': return getVehicle(state, 'motorcycle', 150, false);
    case 'buy-bicycle': return getVehicle(state, 'bicycle', 1200, true);
    case 'buy-motorcycle': return getVehicle(state, 'motorcycle', 9000, true);
    case 'buy-van': return getVehicle(state, 'van', 4500, true);
    case 'dismount':
      if (state.vehicle === 'walk') return fail('You are already on foot.');
      state.vehicle = 'walk';
      return record(state, 'You parked and stepped off.');
    case 'buy-tea':
      if (!spend(state, 10)) return fail('A cup of tea costs ৳10.');
      state.inventory.tea += 1;
      state.energy = clamp(state.energy + 12, 0, 100);
      return record(state, 'A warm cup of tea. Energy restored. −৳10');
    case 'buy-meal':
      if (!spend(state, 50)) return fail('A meal costs ৳50.');
      state.inventory.meals += 1;
      state.energy = clamp(state.energy + 40, 0, 100);
      return record(state, 'A fresh meal. Ready for the next trip. −৳50');
    case 'borrow': {
      if (state.debt >= 2500) return fail('Your ৳2,500 credit limit is reached. Repay before borrowing again.');
      if (state.heat >= 60) return fail('Resolve your police attention before requesting more credit.');
      const amount = Math.min(500, 2500 - state.debt);
      state.debt += amount;
      state.cash += amount;
      return record(state, `Borrowed ${money(amount)}. Repay the same ${money(amount)}; no interest in this prototype.`);
    }
    case 'repay': {
      if (state.debt <= 0) return fail('You have no outstanding loan.');
      const amount = Math.min(100, state.debt, state.cash);
      if (amount <= 0) return fail('Earn some cash before making a repayment.');
      state.debt -= amount;
      state.cash -= amount;
      state.trust = clamp(state.trust + 1, 0, 100);
      return record(state, `Repaid ${money(amount)}. Loan remaining: ${money(state.debt)}.`);
    }
    case 'deposit': {
      const amount = Math.min(100, state.cash);
      if (amount <= 0) return fail('You have no cash to deposit.');
      state.cash -= amount;
      state.bank += amount;
      return record(state, `Saved ${money(amount)}. Savings balance: ${money(state.bank)}.`);
    }
    case 'withdraw': {
      const amount = Math.min(100, state.bank);
      if (amount <= 0) return fail('Your savings account is empty.');
      state.bank -= amount;
      state.cash += amount;
      return record(state, `Withdrew ${money(amount)} from savings.`);
    }
    case 'buy-home':
      if (state.ownsHome) return fail('This home is already yours.');
      if (!spend(state, 3500)) return fail('Your first home costs ৳3,500. Save or earn a little more.');
      state.ownsHome = true;
      state.trust = clamp(state.trust + 5, 0, 100);
      return record(state, 'Your own front door. Bought a home for ৳3,500.');
    case 'study':
      if (now(state) < state.studyAvailableAt) return fail('Your next lesson starts later. Explore or take a job first.');
      if (state.energy < 8) return fail('Have tea or a meal before your lesson.');
      state.energy -= 8;
      state.lessonCount += 1;
      state.trust = clamp(state.trust + 3, 0, 100);
      state.studyAvailableAt = now(state) + 30;
      return record(state, `Lesson ${state.lessonCount} completed. Knowledge and local trust improved.`);
    case 'tutor':
    case 'teach': {
      const teaching = action === 'teach';
      if (state.lessonCount < (teaching ? SCHOOL_WORK.teacherLessons : SCHOOL_WORK.tutoringLessons)) {
        return fail('Attend more lessons to qualify for this work.');
      }
      if (teaching && state.career.tutoringShifts < SCHOOL_WORK.teacherExperience) {
        return fail('Complete two tutoring sessions to join the teaching roster.');
      }
      if (teaching && state.career.lastTeachingDay >= state.day) return fail('Your class has finished for today.');
      if (now(state) < state.career.schoolAvailableAt) return fail('The next school session starts later.');
      const energyCost = teaching ? 16 : 10;
      if (state.energy < energyCost) return fail('Have tea or a meal before starting work.');
      state.energy -= energyCost;
      state.career.schoolAvailableAt = now(state) + (teaching ? 60 : 45);
      state.trust = clamp(state.trust + (teaching ? 4 : 2), 0, 100);
      if (teaching) {
        state.career.lastTeachingDay = state.day;
        earn(state, SCHOOL_WORK.teacherPay);
        return record(state, `Class finished. The pupils can multiply mangoes, although they can still make them disappear. +${money(SCHOOL_WORK.teacherPay)}`);
      }
      state.career.tutoringShifts += 1;
      earn(state, SCHOOL_WORK.tutoringPay);
      return record(state, `Tutoring finished. The missing homework turned up inside the lunch tin. +${money(SCHOOL_WORK.tutoringPay)}`);
    }
    case 'open-tea-stall':
      if (state.teaStall.owned) return fail('This counter already belongs to you.');
      if (!spend(state, TEA_STALL.openingCost)) return fail(`The counter costs ${money(TEA_STALL.openingCost)} to open.`);
      state.teaStall.owned = true;
      state.teaStall.ingredients = TEA_STALL.stockPack;
      return record(state, 'The kettle is yours! You have ingredients for five orders.');
    case 'restock-tea-stall':
      if (!state.teaStall.owned) return fail('Open the counter first.');
      if (state.teaStall.ingredients + TEA_STALL.stockPack > TEA_STALL.maxStock) return fail('The shelf is full. Serve a few more customers first.');
      if (!spend(state, TEA_STALL.stockCost)) return fail(`Ingredients cost ${money(TEA_STALL.stockCost)}.`);
      state.teaStall.ingredients += TEA_STALL.stockPack;
      return record(state, `The shelf is stocked. Ingredients for ${state.teaStall.ingredients} orders.`);
    case 'serve-tea-order': {
      if (!state.teaStall.owned) return fail('Open the counter first.');
      if (now(state) < state.teaStall.orderAvailableAt) return fail('The next customer is still on their way.');
      if (state.teaStall.ingredients < 1) return fail('The kettle is ready. Restock the ingredients.');
      if (state.energy < 4) return fail('Take a short break for food or tea before serving.');
      state.energy -= 4;
      state.teaStall.ingredients -= 1;
      state.teaStall.ordersServed += 1;
      state.teaStall.orderAvailableAt = now(state) + 12;
      earn(state, TEA_STALL.pricePerOrder);
      const customers = [
        'The first customer requested half a spoon of sugar and a full spoon of gossip.',
        'The customer asked for strong tea. The spoon stood up in it.',
        'A passenger finished their tea just as someone yelled “train!”',
      ];
      const customer = customers[(state.teaStall.ordersServed - 1) % customers.length];
      return record(state, `${customer} +${money(TEA_STALL.pricePerOrder)}`);
    }
    case 'start-job':
      if (state.job.active) return fail('Finish your current delivery before accepting another.');
      if (state.energy < 5) return fail('Have a little food or tea before taking a delivery.');
      state.job.active = true;
      state.job.stage = 1;
      return record(state, 'Parcel collected. Follow the destination marker to deliver it.');
    case 'complete-job': {
      if (!state.job.active || state.job.stage !== 1) return fail('Collect a parcel at the station first.');
      const reward = 180 + Math.min(state.lessonCount, 5) * 10;
      state.job.active = false;
      state.job.stage = 0;
      state.job.completed += 1;
      state.stats.rides += 1;
      state.energy = clamp(state.energy - 5, 0, 100);
      state.trust = clamp(state.trust + 2, 0, 100);
      earn(state, reward);
      return record(state, `Delivery complete! Earned ${money(reward)}. Your customer will remember you.`);
    }
    case 'free-ride':
      if (state.vehicle === 'walk') return fail('Rent or buy a vehicle before offering a free ride.');
      if (state.energy < 6) return fail('Have tea or food before offering a ride.');
      if (now(state) < state.freeRideAvailableAt) return fail('You have helped this passenger. Another opportunity will appear later.');
      state.energy -= 6;
      state.trust = clamp(state.trust + 5, 0, 100);
      state.stats.rides += 1;
      state.freeRideAvailableAt = now(state) + 45;
      return record(state, 'A free ride, a grateful neighbour. Trust +5.');
    case 'steal-bag':
      if (state.bagStatus !== 'available') return fail('That bag is no longer available.');
      state.bagStatus = 'stolen';
      state.cash += 120;
      state.stats.stolen += 1;
      state.trust = clamp(state.trust - 15, 0, 100);
      state.heat = clamp(state.heat + 35, 0, 100);
      return record(state, 'A witness saw you take the bag. +৳120, trust −15, police attention +35.');
    case 'return-bag':
      if (state.bagStatus === 'returned') return fail('The bag has already been returned.');
      if (state.bagStatus === 'stolen') {
        if (!spend(state, 120)) return fail('Return the ৳120 with the bag. Earn the missing money first.');
        state.bagStatus = 'returned';
        state.trust = clamp(state.trust + 8, 0, 100);
        state.heat = clamp(state.heat - 25, 0, 100);
        return record(state, 'Returned the bag and ৳120. You have started making things right.');
      }
      state.bagStatus = 'returned';
      state.trust = clamp(state.trust + 12, 0, 100);
      earn(state, 40);
      return record(state, 'Returned the lost bag. A grateful owner gave you ৳40. Trust +12.');
    case 'pay-fine': {
      if (state.heat <= 0) return fail('You have no outstanding police attention.');
      const fine = Math.max(20, Math.ceil(state.heat * 3));
      if (!spend(state, fine)) return fail(`Restitution costs ${money(fine)}. You can earn it through basic jobs.`);
      state.heat = 0;
      return record(state, `Paid ${money(fine)} restitution. The incident is resolved.`);
    }
    case 'rest':
      if (!state.ownsHome) return fail('Buy your home before resting here.');
      state.energy = 100;
      return record(state, 'Rested at home. Your energy is restored.');
    default: return fail('This activity is not available yet.');
  }
}

export function advanceSimulation(state: GameState, dtSeconds: number): { azan?: string; message?: string } {
  if (!Number.isFinite(dtSeconds) || dtSeconds <= 0) return {};
  const delta = Math.min(dtSeconds, 86400);
  const before = now(state);
  const after = before + delta * GAME_MINUTES_PER_SECOND;
  state.day = Math.floor(after / 1440) + 1;
  state.minutes = after % 1440;
  state.energy = clamp(state.energy - delta * 0.006, 0, 100);
  state.heat = clamp(state.heat - delta * 0.025, 0, 100);

  // A long pause/time skip never queues up missed calls.
  if (delta > 60) {
    let index = -1;
    for (let i = 0; i < DEMO_PRAYER_SCHEDULE.length; i += 1) {
      if (DEMO_PRAYER_SCHEDULE[i].minutes <= state.minutes) index = i;
    }
    state.lastAzanDay = index < 0 ? state.day - 1 : state.day;
    state.lastAzanIndex = index < 0 ? DEMO_PRAYER_SCHEDULE.length - 1 : index;
    return {};
  }
  const firstDay = Math.floor(before / 1440) + 1;
  for (let day = firstDay; day <= state.day; day += 1) {
    for (let index = 0; index < DEMO_PRAYER_SCHEDULE.length; index += 1) {
      const prayer = DEMO_PRAYER_SCHEDULE[index];
      const eventTime = (day - 1) * 1440 + prayer.minutes;
      if (eventTime > before && eventTime <= after &&
        (day > state.lastAzanDay || (day === state.lastAzanDay && index > state.lastAzanIndex))) {
        state.lastAzanDay = day;
        state.lastAzanIndex = index;
        const message = `${prayer.name} — illustrative game prayer time. Local timetable and recorded azan pending.`;
        record(state, message);
        return { azan: prayer.name, message };
      }
    }
  }
  return {};
}

export function formatTime(minutes: number): string {
  const safe = Number.isFinite(minutes) ? ((Math.floor(minutes) % 1440) + 1440) % 1440 : 0;
  return `${Math.floor(safe / 60).toString().padStart(2, '0')}:${(safe % 60).toString().padStart(2, '0')}`;
}

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const bounded = (value: unknown, min: number, max: number, integer = false): number => {
  const result = clamp(Number(value), min, max);
  return integer ? Math.floor(result) : result;
};

/** Reject malformed saves; bound valid numeric fields and restore optional v1 defaults. */
export function normalizeSavedGame(value: unknown): GameState | null {
  if (!isRecord(value) || value.version !== 1) return null;
  if (!['cash', 'bank', 'debt', 'trust', 'heat', 'energy', 'day', 'minutes', 'lessonCount', 'lastAzanDay', 'lastAzanIndex'].every(key => finite(value[key]))) return null;
  if (!['walk', 'van', 'bicycle', 'motorcycle'].includes(String(value.vehicle))) return null;
  if (!Array.isArray(value.ownedVehicles) || typeof value.ownsHome !== 'boolean') return null;
  if (!isRecord(value.inventory) || !finite(value.inventory.tea) || !finite(value.inventory.meals)) return null;
  if (!isRecord(value.job) || typeof value.job.active !== 'boolean' || !finite(value.job.stage) || !finite(value.job.completed)) return null;
  if (!isRecord(value.stats)) return null;
  const checkedStats = value.stats;
  if (!['earned', 'rides', 'stolen'].every(key => finite(checkedStats[key]))) return null;
  if (!isRecord(value.settings) || !['low', 'high'].includes(String(value.settings.quality)) || typeof value.settings.sound !== 'boolean') return null;
  if (!Array.isArray(value.log) || value.log.some(item => typeof item !== 'string')) return null;
  if (Number(value.cash) < 0 || Number(value.bank) < 0 || Number(value.debt) < 0) return null;
  const defaults = createGameState();
  const job = value.job;
  const inventory = value.inventory;
  const stats = value.stats;
  const settings = value.settings;
  const day = bounded(value.day, 1, 100000, true);
  const career = isRecord(value.career) ? value.career : {};
  const teaStall = isRecord(value.teaStall) ? value.teaStall : {};
  const ownsTeaStall = teaStall.owned === true;
  const optionalNumber = (field: unknown, max: number, integer = false) =>
    finite(field) ? bounded(field, 0, max, integer) : 0;
  return {
    version: 1,
    cash: bounded(value.cash, 0, 10_000_000), bank: bounded(value.bank, 0, 10_000_000), debt: bounded(value.debt, 0, 2500),
    trust: bounded(value.trust, 0, 100), heat: bounded(value.heat, 0, 100), energy: bounded(value.energy, 0, 100),
    day, minutes: bounded(value.minutes, 0, 1439.999),
    vehicle: value.vehicle as Vehicle,
    ownedVehicles: [...new Set(value.ownedVehicles.filter((vehicle): vehicle is string => typeof vehicle === 'string' && ['van', 'bicycle', 'motorcycle'].includes(vehicle)))],
    ownsHome: value.ownsHome,
    inventory: { tea: bounded(inventory.tea, 0, 100000, true), meals: bounded(inventory.meals, 0, 100000, true) },
    job: { active: job.active === true, stage: job.active ? 1 : 0, completed: bounded(job.completed, 0, 100000, true) },
    lessonCount: bounded(value.lessonCount, 0, 100000, true),
    career: {
      tutoringShifts: optionalNumber(career.tutoringShifts, 100000, true),
      schoolAvailableAt: optionalNumber(career.schoolAvailableAt, 144_000_000),
      lastTeachingDay: optionalNumber(career.lastTeachingDay, day, true),
    },
    teaStall: {
      owned: ownsTeaStall,
      ingredients: ownsTeaStall ? optionalNumber(teaStall.ingredients, TEA_STALL.maxStock, true) : 0,
      ordersServed: ownsTeaStall ? optionalNumber(teaStall.ordersServed, 100000, true) : 0,
      orderAvailableAt: ownsTeaStall ? optionalNumber(teaStall.orderAvailableAt, 144_000_000) : 0,
    },
    stats: { earned: bounded(stats.earned, 0, 100_000_000), rides: bounded(stats.rides, 0, 100000, true), stolen: bounded(stats.stolen, 0, 100000, true) },
    log: (value.log as string[]).slice(0, 12).map(item => item.slice(0, 240)),
    settings: { quality: settings.quality as 'low' | 'high', sound: settings.sound === true },
    lastAzanDay: bounded(value.lastAzanDay, 0, 100000, true), lastAzanIndex: bounded(value.lastAzanIndex, -1, 4, true),
    bagStatus: ['available', 'stolen', 'returned'].includes(String(value.bagStatus)) ? value.bagStatus as GameState['bagStatus'] : defaults.bagStatus,
    freeRideAvailableAt: finite(value.freeRideAvailableAt) ? bounded(value.freeRideAvailableAt, 0, 144_000_000) : 0,
    studyAvailableAt: finite(value.studyAvailableAt) ? bounded(value.studyAvailableAt, 0, 144_000_000) : 0,
  };
}

export function saveGame(state: GameState): boolean {
  try {
    const normalized = normalizeSavedGame(state);
    if (!normalized || typeof localStorage === 'undefined') return false;
    localStorage.setItem(SAVE_KEY, JSON.stringify(normalized));
    return true;
  } catch { return false; }
}

export function loadGame(): GameState | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? normalizeSavedGame(JSON.parse(raw)) : null;
  } catch { return null; }
}
