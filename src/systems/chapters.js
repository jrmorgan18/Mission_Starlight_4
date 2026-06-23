// The six chapters of Mission: Starlight 3 — "Race the Dying Star". Each is an
// async storybook script: build the diorama, talk, explore, sneak in the
// learning, raise a shield. Dialogue lines can carry stamp:'real'|'magic' —
// Bolt's fact-checker marks REAL SCIENCE vs STORY MAGIC.
import * as THREE from 'three';
import { WorldScene } from './worldScene.js';
import { collectParts, echoBlinks, beaconPickup, animate } from './minigames.js';
import { KillerStarScene, pinwheelClimax } from './sliceScene.js';
import { HyperspaceScene } from '../hyperspace/hyperspace.js';
import { makeAlien, makeLuma, makeRock, makeCrystal, makeLighthouse, makeShip, makeGlowSprite, makeBeacon } from '../world/builders.js';
import * as ui from '../ui/ui.js';
import { pickMath, pickScience, pickReading } from '../edu/engine.js';
import { loadSave } from '../save.js';

/* ---------- shared bits ---------- */

async function askScience(topic, opts = {}) {
  return ui.askQuestion(pickScience(topic), { contextLabel: opts.label || "BOLT'S DATABANK CHECK", icon: opts.icon || '🔭', gauge: opts.gauge });
}

async function askMath(skill, opts = {}) {
  return ui.askQuestion(pickMath(skill), { contextLabel: opts.label || 'SHIP COMPUTER', icon: opts.icon || '🧮', gauge: opts.gauge });
}

async function askReadingSet(chapterTag, howMany, opts = {}) {
  const set = pickReading(chapterTag);
  const qs = set.questions.slice(0, howMany);
  for (const q of qs) {
    await ui.askQuestion(q, { contextLabel: opts.label || 'READ CAREFULLY', icon: '📖' });
  }
}

function scatter(scene, makeFn, n, spread = 18) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = 8 + Math.random() * spread;
    scene.place(makeFn(), Math.cos(a) * d, Math.sin(a) * d * 0.7 - 2);
  }
}

/** A bright "second sun" sprite hanging in a diorama's sky — the looming Pinwheel. */
function addPinwheelSky(scene, color = 0xbfe8ff, size = 10, pos = [12, 19, -38]) {
  const glow = makeGlowSprite(color, size);
  glow.position.set(...pos);
  scene.scene.add(glow);
  const core = makeGlowSprite(0xffffff, size * 0.4);
  core.position.set(...pos);
  scene.scene.add(core);
}

function addLuma(scene, x, y, z) {
  const luma = makeLuma(0.85);
  luma.position.set(x, y, z);
  scene.scene.add(luma);
  return luma;
}

async function openScene(game, key) {
  const scene = new WorldScene(game, key);
  game.setScene(scene);
  await ui.fade(false);
  return scene;
}

async function closeScene(game, scene) {
  await ui.fade(true);
  scene.dispose();
}

/* ============================================================
   CHAPTER 1 — ARRIVAL AT VEYRA
============================================================ */
export async function chapterVeyra(game) {
  const s = loadSave();
  const scene = await openScene(game, 'veyra');
  addPinwheelSky(scene, 0xbfe8ff, 11, [-16, 20, -40]);
  scatter(scene, () => makeRock(0.4 + Math.random() * 1.0, 0xff8a5a), 8, 16);   // coral lumps
  addLuma(scene, 7, 3.4, 3);

  const sola = makeAlien('solari');
  scene.place(sola, -4, -2, { id: 'sola', ry: 0.5 });
  const pip = makeAlien('solari');
  pip.scale.setScalar(0.7);
  scene.place(pip, 5, 0, { id: 'pip', ry: -0.5 });

  await ui.dialogue([
    { who: 'bolt', text: `Cadet ${s.name}, we followed the distress call all the way to Veyra — an ocean world with TWO suns in its sky.` },
    { who: 'bolt', text: 'That dazzling one isn\'t their sun. It\'s the Pinwheel: a Wolf-Rayet star, the biggest, hottest kind there is — and it\'s almost out of fuel.', stamp: 'real' },
    { who: 'luma', text: 'The little folk down there are waving at us! Let\'s go say hello, Cadet.' }
  ]);
  await ui.giveCard('veyra');

  ui.setObjective('Tap Elder Sola to say hello');
  await scene.waitInteract('sola');
  await ui.dialogue([
    { who: 'sola', text: 'Welcome, sky-traveler. I am Sola, eldest of the Solari. For all my long life the Pinwheel has lit our nights...' },
    { who: 'sola', text: '...but now it spins faster every evening, and shivers in the dark. We are afraid, and we do not know why. Will you help us read its secrets?' },
    { who: 'player', text: 'That\'s exactly why we came. We\'ll figure it out together!' }
  ]);
  await ui.giveCard('sola');

  await askReadingSet('veyra', 2);

  ui.setObjective('Tap Pip the young Solari');
  await scene.waitInteract('pip');
  await ui.dialogue([
    { who: 'pip', text: 'Hi hi! I\'m Pip! My singing shells washed all over the shore. Help me find them and I\'ll show you everything!' }
  ]);
  await ui.giveCard('pip');

  const shellIds = ['shell1', 'shell2', 'shell3'];
  shellIds.forEach((id, i) => {
    const shell = makeCrystal(0xff9a6a, 1.1);
    scene.place(shell, -9 + i * 9, -6 - (i % 2) * 3, { id });
  });
  await collectParts(scene, shellIds, "Gather Pip's singing shells");

  await ui.dialogue([
    { who: 'bolt', text: 'Beep — databank question, Cadet. Let\'s make sure we understand what we\'re dealing with.' }
  ]);
  await askScience('killerstar');

  await ui.giveClue('ks1');
  await ui.dialogue([
    { who: 'sola', text: 'Our sky-watchers live on the little moon above. Astra keeps the great telescope there. She can show you the Pinwheel up close.' },
    { who: 'bolt', text: 'Then that\'s our next jump. Buckle up, Cadet — to the sky-watch tower!' }
  ]);
  await closeScene(game, scene);
}

/* ============================================================
   CHAPTER 2 — THE SKY-WATCHERS (observatory)
============================================================ */
export async function chapterObservatory(game) {
  const scene = await openScene(game, 'observatory');
  addPinwheelSky(scene, 0xcfeaff, 11, [13, 18, -36]);

  const tower = makeLighthouse(6);
  scene.place(tower, 0, -9, { id: 'tower' });
  const astra = makeAlien('solari');
  astra.scale.setScalar(1.05);
  scene.place(astra, -5, -1, { id: 'astra', ry: 0.4 });

  await ui.dialogue([
    { who: 'bolt', text: 'The sky-watch moon! That tall tower is the great telescope. Let\'s find Astra.' }
  ]);
  ui.setObjective('Tap Astra the sky-watcher');
  await scene.waitInteract('astra');
  await ui.dialogue([
    { who: 'astra', text: 'You came! Good. Look through the scope — see how the Pinwheel flings out two glowing arms of dust as it spins?' },
    { who: 'astra', text: 'A spinning star this big can die in a GAMMA-RAY BURST — a beam of deadly light. The question that keeps me awake is not WHEN. It is WHERE it points.', stamp: 'real' },
    { who: 'bolt', text: 'Smart watcher. A burst only burns what it\'s aimed at. Let\'s measure that spin first.' }
  ]);
  await ui.giveCard('astra');
  await ui.giveCard('pinwheel');

  await askReadingSet('observatory', 2);

  await ui.dialogue([
    { who: 'astra', text: 'The tower will flash the Pinwheel\'s spin-beat. Count the flashes, then echo them back on the drum!' }
  ]);
  await echoBlinks(scene, tower, [3, 4, 5]);

  await ui.giveClue('ks2');
  await askScience('killerstar');
  await askScience('killerstar');

  await ui.giveBeacon('the sky-watch tower');
  await ui.dialogue([
    { who: 'astra', text: 'Now you must see it up close to chart where the beam will point. Fly carefully, Cadet. That star bites.' }
  ]);
  await closeScene(game, scene);
}

/* ============================================================
   CHAPTER 3 — THE PINWHEEL (the showpiece)
============================================================ */
export async function chapterPinwheel(game) {
  const scene = new KillerStarScene(game, { showFps: false });
  game.setScene(scene);
  game.pipeline.setBloom(1.15, 0.7, 0.62);   // crank the glow for the showpiece
  await ui.fade(false);

  await ui.dialogue([
    { who: 'bolt', text: 'There it is up close, Cadet. The Pinwheel — a Wolf-Rayet star spinning itself to death. Stay sharp.', stamp: 'real' },
    { who: 'luma', text: 'It\'s... beautiful. And terrible.' },
    { who: 'bolt', text: 'Charting the burst\'s aim now... got it. The beam won\'t hit Veyra. It points PAST it — off toward a tiny faraway blue world. Huh. I\'ll log those coordinates. For later.' }
  ]);
  await ui.giveCard('pinwheel');

  await askScience('killerstar');
  await askMath('subtraction', { label: 'COUNTDOWN COMPUTER', icon: '⏱️' });
  await askScience('killerstar');

  await ui.giveClue('ks3');
  await ui.dialogue([
    { who: 'bolt', text: 'Wait — the core just flared! It\'s throwing a WARNING shot. Raise the deflector, NOW! Hold it steady!' }
  ]);
  await pinwheelClimax(scene);

  await ui.dialogue([
    { who: 'bolt', text: 'The shield split it clean around us. But Cadet — that was only a warm-up. The real death is coming, and soon.', stamp: 'real' },
    { who: 'luma', text: 'Then there\'s no time. We have to get every Solari off Veyra before it fires for real!' }
  ]);
  await ui.giveBeacon('the deflector buoy');

  await ui.fade(true);
  scene.dispose();
}

/* ============================================================
   CHAPTER 4 — THE GREAT EVACUATION (spaceport)
============================================================ */
export async function chapterEvacuation(game) {
  const scene = await openScene(game, 'spaceport');
  addPinwheelSky(scene, 0xffc0b0, 12, [0, 20, -36]);   // angrier, redder now

  for (let i = 0; i < 3; i++) {
    const ark = makeShip();
    ark.scale.setScalar(2.2);
    ark.position.set(-13 + i * 13, 1.6, -11);
    ark.rotation.y = 0.25;
    scene.scene.add(ark);
  }
  const vega = makeAlien('solari');
  vega.scale.setScalar(1.1);
  scene.place(vega, -4, -1, { id: 'vega', ry: 0.4 });
  for (let i = 0; i < 3; i++) {
    const fam = makeAlien('solari');
    fam.scale.setScalar(0.75);
    scene.place(fam, 7 + i * 2.2, 3 + i, { ry: -0.6 });
  }

  await ui.dialogue([
    { who: 'bolt', text: 'Back on Veyra — the great spaceport. Three ark-ships fueled and waiting. Find Captain Vega.' }
  ]);
  ui.setObjective('Tap Captain Vega');
  await scene.waitInteract('vega');
  await ui.dialogue([
    { who: 'vega', text: 'Cadet! I am Vega, captain of the arks. Every family must be aboard before the Pinwheel dies — babies and elders first.' },
    { who: 'vega', text: 'We cannot move a whole world. But we can carry our home in every story and song. Help me load the family pods!' }
  ]);
  await ui.giveCard('vega');

  await askReadingSet('spaceport', 2);

  const podIds = ['pod1', 'pod2', 'pod3', 'pod4'];
  podIds.forEach((id, i) => {
    const pod = makeBeacon();
    pod.scale.setScalar(0.7);
    scene.place(pod, -11 + i * 7, -6, { id });
  });
  await collectParts(scene, podIds, 'Carry the family pods to the arks');

  await ui.dialogue([
    { who: 'bolt', text: 'Quick logistics check, Cadet — how many seats do the arks have?' }
  ]);
  await askMath('multiplication', { label: 'ARK MANIFEST', icon: '🚀' });
  await askMath('addition', { label: 'ARK MANIFEST', icon: '🚀' });

  await ui.giveClue('ks4');
  await ui.giveBeacon('the launch tower');
  await ui.dialogue([
    { who: 'vega', text: 'Everyone is aboard! The Pinwheel is collapsing — I can feel it. ALL SHIPS, LAUNCH!' }
  ]);
  await closeScene(game, scene);
}

/* ============================================================
   CHAPTER 5 — RACE THE BEAM (self-travel escape flight)
============================================================ */
export async function chapterRace(game) {
  await ui.dialogue([
    { who: 'bolt', text: 'The Pinwheel\'s core is collapsing — it\'s going to fire ANY SECOND. Everybody, PUNCH IT!' },
    { who: 'luma', text: 'Deflector wrapped around the whole fleet! Steer hard and HOLD LIGHTSPEED — we have to outrun the burst!' }
  ]);

  await ui.fade(true);
  const ride = new HyperspaceScene(game, 'SAFE HARBOR', { peril: true });
  game.setScene(ride);
  await ui.fade(false);
  await ride.run();      // resolves faded-to-black after arrival
  ride.dispose();
  ui.countJump();

  await game.toBackdrop();
  await ui.dialogue([
    { who: 'bolt', text: 'FLASH — the burst swept past right behind us! The deflector split it around the fleet. We MADE it!', stamp: 'real' },
    { who: 'bolt', text: 'See, Cadet? A dying star is fierce — but even its beam is just light, and light still takes TIME to cross space. That sliver of time is how we outran it.', stamp: 'real' }
  ]);
  await askScience('lightspeed');
  await ui.giveClue('ks5');
}

/* ============================================================
   CHAPTER 6 — SAFE HARBOR (finale)
============================================================ */
export async function chapterHarbor(game) {
  const scene = await openScene(game, 'harbor');
  addLuma(scene, 0, 4.5, -6);
  for (let i = 0; i < 3; i++) {
    const ark = makeShip();
    ark.scale.setScalar(1.8);
    ark.position.set(-12 + i * 12, 1.2, -12);
    ark.rotation.y = -0.2;
    scene.scene.add(ark);
  }
  const sola = makeAlien('solari');
  scene.place(sola, -4, -2, { id: 'sola', ry: 0.5 });
  const vega = makeAlien('solari');
  vega.scale.setScalar(1.1);
  scene.place(vega, 5, -1, { id: 'vega', ry: -0.5 });

  await ui.dialogue([
    { who: 'bolt', text: 'We coasted into a calm harbor far from the Pinwheel. Look — the whole fleet made it. Every single family.' }
  ]);
  ui.setObjective('Tap Elder Sola');
  await scene.waitInteract('sola');
  await ui.dialogue([
    { who: 'sola', text: 'You gave us tomorrow, Cadet. We will never forget the sky-traveler who read the stars for us.' },
    { who: 'vega', text: 'We\'ve charted a course to a small red world — dusty, quiet, and safe. A good place to begin again.' },
    { who: 'bolt', text: 'A little red world... I\'ll remember that. And Cadet — one more thing.', stamp: 'real' },
    { who: 'bolt', text: 'That burst didn\'t stop. Its beam flies on across the galaxy, toward a tiny blue world very, very far away. It won\'t arrive for ages... but someday, somebody will have to warn them. I\'m logging where it points. For later.', stamp: 'real' }
  ]);
  await ui.giveCard('luma');

  await askReadingSet('harbor', 2);
  await beaconPickup(scene);
  await askScience('galaxy');

  await ui.giveClue('ks6');
  await ui.dialogue([
    { who: 'luma', text: 'A whole world, saved. You\'re a real star, Cadet — the kind that lights the way home.' },
    { who: 'player', text: 'Couldn\'t have done it without my crew. Onward — there\'s a red world waiting!' }
  ]);
  await closeScene(game, scene);
}

export const CHAPTER_SCRIPTS = [
  chapterVeyra,
  chapterObservatory,
  chapterPinwheel,
  chapterEvacuation,
  chapterRace,
  chapterHarbor
];
