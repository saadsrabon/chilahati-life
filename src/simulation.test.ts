import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceSimulation, createGameState, formatTime, loadGame, normalizeSavedGame,
  performAction, saveGame, SAVE_KEY, SCHOOL_WORK, TEA_STALL,
} from './simulation.ts';

test('purchases reject insufficient funds without changing balances or ownership', () => {
  const state = createGameState();
  const before = structuredClone(state);
  assert.equal(performAction(state, 'buy-motorcycle').ok, false);
  assert.deepEqual(state, before);
  assert.equal(performAction(state, 'rent-bicycle').ok, true);
  assert.equal(state.cash, 620);
  assert.equal(state.vehicle, 'bicycle');
  assert.equal(performAction(state, 'rent-bicycle').ok, false);
  assert.equal(state.cash, 620);
});

test('ownership is persistent and mounting owned vehicles does not charge another rental', () => {
  const state = createGameState();
  state.cash = 1300;
  assert.equal(performAction(state, 'buy-bicycle').ok, true);
  performAction(state, 'dismount');
  assert.equal(performAction(state, 'rent-bicycle').ok, true);
  assert.equal(state.cash, 100);
  assert.deepEqual(state.ownedVehicles, ['bicycle']);
});

test('loans are bounded, repayments never exceed available cash or debt', () => {
  const state = createGameState();
  for (let i = 0; i < 5; i += 1) assert.equal(performAction(state, 'borrow').ok, true);
  assert.equal(state.debt, 2500);
  const cash = state.cash;
  assert.equal(performAction(state, 'borrow').ok, false);
  assert.equal(state.cash, cash);
  state.cash = 25;
  performAction(state, 'repay');
  assert.equal(state.cash, 0);
  assert.equal(state.debt, 2475);
  assert.equal(performAction(state, 'repay').ok, false);
  state.cash = 100;
  performAction(state, 'repay');
  assert.equal(state.debt, 2375);
  performAction(state, 'borrow');
  assert.equal(state.debt, 2500);
  assert.equal(state.cash, 125);
});

test('job payout requires collection and can only be claimed once', () => {
  const state = createGameState();
  assert.equal(performAction(state, 'complete-job').ok, false);
  assert.equal(performAction(state, 'start-job').ok, true);
  assert.equal(state.job.stage, 1);
  assert.equal(performAction(state, 'start-job').ok, false);
  assert.equal(performAction(state, 'complete-job').ok, true);
  assert.equal(state.cash, 830);
  assert.equal(state.job.active, false);
  assert.equal(state.job.completed, 1);
  assert.equal(performAction(state, 'complete-job').ok, false);
  assert.equal(state.cash, 830);
});

test('theft and honest return cannot produce repeated money or trust rewards', () => {
  const state = createGameState();
  assert.equal(performAction(state, 'steal-bag').ok, true);
  assert.equal(state.cash, 770);
  assert.equal(state.heat, 35);
  assert.equal(performAction(state, 'steal-bag').ok, false);
  assert.equal(performAction(state, 'return-bag').ok, true);
  assert.equal(state.cash, 650);
  assert.equal(state.bagStatus, 'returned');
  assert.equal(performAction(state, 'return-bag').ok, false);
  assert.equal(performAction(state, 'steal-bag').ok, false);
  const honest = createGameState();
  assert.equal(performAction(honest, 'return-bag').ok, true);
  assert.equal(honest.cash, 690);
  assert.equal(performAction(honest, 'return-bag').ok, false);
});

test('free rides require transport and have a persistent cooldown', () => {
  const state = createGameState();
  assert.equal(performAction(state, 'free-ride').ok, false);
  performAction(state, 'rent-van');
  assert.equal(performAction(state, 'free-ride').ok, true);
  assert.equal(performAction(state, 'free-ride').ok, false);
  advanceSimulation(state, 120);
  assert.equal(performAction(state, 'free-ride').ok, true);
});

test('saving guards against corrupted values and preserves progression', () => {
  const map = new Map<string, string>();
  const storage = { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value); } };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  try {
    const state = createGameState();
    state.cash = 10000;
    performAction(state, 'buy-home');
    performAction(state, 'buy-bicycle');
    performAction(state, 'start-job');
    assert.equal(saveGame(state), true);
    assert.deepEqual(loadGame(), state);
    map.set(SAVE_KEY, '{broken');
    assert.equal(loadGame(), null);
    map.set(SAVE_KEY, JSON.stringify({ ...state, cash: -4 }));
    assert.equal(loadGame(), null);
    assert.equal(normalizeSavedGame({ ...state, heat: 200 })?.heat, 100);
    assert.equal(normalizeSavedGame({ ...state, stats: null }), null);
    assert.equal(normalizeSavedGame({ ...state, cash: Infinity }), null);
  } finally { Reflect.deleteProperty(globalThis, 'localStorage'); }
});

test('time crosses midnight correctly and rejects invalid deltas', () => {
  const state = createGameState();
  state.minutes = 1439;
  advanceSimulation(state, 5);
  assert.equal(state.day, 2);
  assert.equal(state.minutes, 1);
  advanceSimulation(state, Number.NaN);
  assert.equal(state.minutes, 1);
  assert.equal(formatTime(490), '08:10');
  assert.equal(formatTime(-1), '23:59');
});

test('lessons unlock tutoring, then experience unlocks a single paid class per day', () => {
  const state = createGameState();
  assert.equal(performAction(state, 'tutor').ok, false);
  for (let i = 0; i < SCHOOL_WORK.teacherLessons; i += 1) {
    assert.equal(performAction(state, 'study').ok, true);
    advanceSimulation(state, 75);
  }
  assert.equal(performAction(state, 'teach').ok, false);
  for (let i = 0; i < SCHOOL_WORK.teacherExperience; i += 1) {
    assert.equal(performAction(state, 'tutor').ok, true);
    assert.equal(performAction(state, 'tutor').ok, false);
    advanceSimulation(state, 120);
  }
  assert.equal(performAction(state, 'teach').ok, true);
  const earned = SCHOOL_WORK.tutoringPay * SCHOOL_WORK.teacherExperience + SCHOOL_WORK.teacherPay;
  assert.equal(state.cash, 650 + earned);
  assert.equal(state.stats.earned, earned);
  advanceSimulation(state, 150);
  assert.equal(performAction(state, 'teach').ok, false);
  const restored = normalizeSavedGame(state)!;
  assert.deepEqual(restored.career, state.career);
  restored.minutes = 1439;
  advanceSimulation(restored, 5);
  assert.equal(performAction(restored, 'teach').ok, true);
});

test('a tea counter has startup costs, finite stock, timed sales and saved progress', () => {
  const state = createGameState();
  assert.equal(performAction(state, 'serve-tea-order').ok, false);
  assert.equal(performAction(state, 'open-tea-stall').ok, true);
  assert.equal(performAction(state, 'open-tea-stall').ok, false);
  assert.equal(state.cash, 650 - TEA_STALL.openingCost);
  for (let order = 0; order < TEA_STALL.stockPack; order += 1) {
    assert.equal(performAction(state, 'serve-tea-order').ok, true);
    assert.equal(performAction(state, 'serve-tea-order').ok, false);
    advanceSimulation(state, 30);
  }
  assert.equal(performAction(state, 'serve-tea-order').ok, false);
  assert.equal(state.teaStall.ingredients, 0);
  assert.equal(state.stats.earned, TEA_STALL.stockPack * TEA_STALL.pricePerOrder);
  assert.equal(performAction(state, 'restock-tea-stall').ok, true);
  assert.equal(state.cash, 650 - TEA_STALL.openingCost + state.stats.earned - TEA_STALL.stockCost);
  assert.deepEqual(normalizeSavedGame(state)?.teaStall, state.teaStall);
});

test('earlier version-one saves retain progress and start with no school work or business history', () => {
  const state = createGameState();
  const { career, teaStall, ...earlierSave } = state;
  earlierSave.cash = 980;
  earlierSave.lessonCount = 4;
  const restored = normalizeSavedGame(earlierSave);
  assert.equal(restored?.cash, 980);
  assert.equal(restored?.lessonCount, 4);
  assert.deepEqual(restored?.career, career);
  assert.deepEqual(restored?.teaStall, teaStall);
});

test('demo prayer events occur once and long time skips do not queue old calls', () => {
  const state = createGameState();
  state.minutes = 12 * 60 + 14;
  const first = advanceSimulation(state, 5);
  assert.equal(first.azan, 'Dhuhr');
  assert.equal(advanceSimulation(state, 1).azan, undefined);
  assert.equal(advanceSimulation(state, 4000).azan, undefined);
  assert.ok(state.log[0].includes('illustrative game prayer time'));
});
