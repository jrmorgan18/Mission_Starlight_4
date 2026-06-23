// The six chapters of Mission: Starlight 4 — "Waking the Red Planet". Each is an
// async storybook script: build the diorama, talk, explore, sneak in the
// learning. Dialogue lines can carry stamp:'real'|'magic' — Bolt's fact-checker
// marks REAL SCIENCE vs STORY MAGIC.
import * as THREE from 'three';
import { WorldScene } from './worldScene.js';
import { collectParts, boulderHunt, animate } from './minigames.js';
import { CaveScene } from '../cave/caveScene.js';
import { TerraformScene, makeSolarWind } from '../mars/showpieces.js';
import { makeAlien, makeLuma, makeRover, makeRock, makeCrystal, makeShip, makeGlowSprite, makePlanet } from '../world/builders.js';
import * as ui from '../ui/ui.js';
import { pickMath, pickScience, pickReading } from '../edu/engine.js';
import { loadSave } from '../save.js';
import { sfx } from '../audio.js';

/* ---------- shared bits ---------- */

async function askScience(topic, opts = {}) {
  return ui.askQuestion(pickScience(topic), { contextLabel: opts.label || "BOLT'S DATABANK CHECK", icon: opts.icon || '🔭', gauge: opts.gauge });
}

async function askMath(skill, opts = {}) {
  return ui.askQuestion(pickMath(skill), { contextLabel: opts.label || 'SHIP COMPUTER', icon: opts.icon || '🧮', gauge: opts.gauge });
}

async function askReadingSet(chapterTag, howMany, opts = {}) {
  const set = pickReading(chapterTag);
  for (const q of set.questions.slice(0, howMany)) {
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

/** A big distant mountain (Olympus Mons) on the horizon. */
function addMountain(scene, x, z, h = 12) {
  const m = new THREE.Mesh(
    new THREE.ConeGeometry(h * 1.3, h, 6),
    new THREE.MeshStandardMaterial({ color: 0x7a3a22, roughness: 1, flatShading: true })
  );
  m.position.set(x, h / 2 - 2, z);
  scene.scene.add(m);
  return m;
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
   CHAPTER 1 — THE RED WELCOME
============================================================ */
export async function chapterWelcome(game) {
  const s = loadSave();
  const scene = await openScene(game, 'marsred');
  addMountain(scene, -22, -34, 16);            // Olympus Mons on the horizon
  scatter(scene, () => makeRock(0.5 + Math.random() * 1.2, 0x8a4028), 10, 18);
  addLuma(scene, 7, 3.4, 3);

  const rusty = makeRover();
  scene.place(rusty, -3, -3, { id: 'rusty', ry: 0.4 });
  const sola = makeAlien('solari');
  scene.place(sola, 5, 0, { id: 'sola', ry: -0.5 });
  const pip = makeAlien('solari');
  pip.scale.setScalar(0.7);
  scene.place(pip, 8, 3, { ry: -0.6 });

  await ui.dialogue([
    { who: 'bolt', text: `Cadet ${s.name}, we did it — we brought the Solari to their new home. This is MARS, the Red Planet.`, stamp: 'real' },
    { who: 'sola', text: 'But sky-friend... it is so cold and quiet. This world looks fast asleep. Can our people really live here?' },
    { who: 'bolt', text: 'Red from rusty iron dust, with the biggest volcano AND deepest canyon in the whole solar system. A mighty world — but yes, right now, a sleeping one.', stamp: 'real' }
  ]);
  await ui.giveCard('mars');
  await ui.giveCard('sola');

  ui.setObjective('Tap the lonely little rover');
  await scene.waitInteract('rusty');
  await ui.dialogue([
    { who: 'rusty', text: 'A ship! Real visitors! Oh, hello, hello! I am Rusty. I have rolled across Mars all alone for... oh, I lost count of the years.' },
    { who: 'rusty', text: 'I know every rock and crater. I will help you, friends — I have waited SO long for friends. Where shall we begin?' },
    { who: 'player', text: 'Together, Rusty. Let\'s figure out how to wake your planet up.' }
  ]);
  await ui.giveCard('rusty');

  await askReadingSet('welcome', 2);
  await askScience('mars');

  // first sample — teaches the Suit Lab loop
  await ui.giveSample('a rusty red Mars rock', 3);
  await ui.dialogue([
    { who: 'bolt', text: 'Nice find! Samples earn ⭐ stars. Tap the Suit Lab 🧰 up top any time to trade stars for gear — a brighter headlamp helps in caves!' }
  ]);

  await ui.giveClue('mr1');
  game.checkBadges();
  await ui.dialogue([
    { who: 'rusty', text: 'If you want to know what happened here, come see the ghost rivers. Follow me — beep beep!' }
  ]);
  await closeScene(game, scene);
}

/* ============================================================
   CHAPTER 2 — THE GHOST RIVERS
============================================================ */
export async function chapterRivers(game) {
  const scene = await openScene(game, 'marscanyon');
  addMountain(scene, 20, -36, 13);
  // dry, winding riverbed of pale stones
  for (let i = 0; i < 16; i++) {
    const r = makeRock(0.4 + Math.random() * 0.7, 0xc89a6a);
    r.position.set(-18 + i * 2.4 + Math.sin(i) * 2, 0.2, -6 + Math.cos(i * 0.8) * 6);
    scene.scene.add(r);
  }
  const rusty = makeRover();
  scene.place(rusty, -4, -2, { id: 'rusty', ry: 0.5 });

  await ui.dialogue([
    { who: 'rusty', text: 'See this winding ditch? It was a RIVER once. Long ago Mars was warm and wet — rain, rivers, lakes, maybe even an ocean!', stamp: 'real' },
    { who: 'bolt', text: 'The water is gone now, but the shapes it carved are still here. If we read the ghost rivers, they\'ll tell us what happened.', stamp: 'real' }
  ]);

  await askReadingSet('rivers', 2);

  // boulder hunt: heave 6 boulders aside; 3 of them hide a river stone
  await ui.dialogue([
    { who: 'rusty', text: 'The smooth river stones rolled under these boulders ages ago. Heave the boulders aside to find them — but you can\'t tell which hides one until you try!' }
  ]);
  const boulderIds = ['bh1', 'bh2', 'bh3', 'bh4', 'bh5', 'bh6'];
  const stonePlaces = new Set([0, 2, 4]);   // which boulders hide a stone
  boulderIds.forEach((id, i) => {
    const b = makeRock(1.1 + Math.random() * 0.5, 0x8a4a30);
    b.userData.hasStone = stonePlaces.has(i);
    const x = -12 + i * 4.6, z = -5 - (i % 2) * 4;
    scene.place(b, x, z, { id });
  });
  await boulderHunt(scene, boulderIds, 3);
  await ui.giveSample('smooth water-worn river stones', 3);

  await askScience('mars');
  await askMath('subtraction', { label: 'RIVER SURVEY', icon: '📏' });

  await ui.giveClue('mr2');
  game.checkBadges();
  await ui.dialogue([
    { who: 'rusty', text: 'So Mars HAD water. The big question is... where did it all go? Rusty knows who can explain — to the icy poles!' }
  ]);
  await closeScene(game, scene);
}

/* ============================================================
   CHAPTER 3 — WHY A PLANET DIES (solar wind + magnetic shield)
============================================================ */
export async function chapterDeath(game) {
  const scene = await openScene(game, 'marspolar');
  scatter(scene, () => makeRock(0.4 + Math.random() * 0.8, 0xb8b0d0), 8, 16);   // frosty rocks

  // Mars hangs in the sky with the solar wind streaming at it
  const wind = makeSolarWind(game.lowDetail ? 90 : 170);
  wind.position.set(0, 14, -28);
  scene.scene.add(wind);
  const skyMars = makePlanet('marsred', 2.6);
  skyMars.position.copy(wind.position);
  scene.scene.add(skyMars);

  const rusty = makeRover();
  scene.place(rusty, -4, -2, { id: 'rusty', ry: 0.5 });

  await ui.dialogue([
    { who: 'bolt', text: 'Here\'s the sad secret, Cadet. Look up — those gold streaks are the SOLAR WIND, tiny particles blasting out from the Sun.', stamp: 'real' },
    { who: 'bolt', text: 'Long ago Mars had a magnetic SHIELD that blocked the wind. But Mars is small; its iron heart cooled, the shield faded — and the wind stripped its air and water away.', stamp: 'real' }
  ]);

  await askReadingSet('death', 2);

  // raise-the-shield moment — POWER it up with math first
  await ui.dialogue([
    { who: 'rusty', text: 'I kept a spare shield bubble! But the generator needs POWER. Solve the power numbers, then we raise it!' }
  ]);
  for (let i = 0; i < 2; i++) {
    await askMath('addition', { label: `SHIELD POWER ${i + 1} OF 2`, icon: '🧲', gauge: { current: i, total: 2, icon: '🛡️' } });
  }
  await ui.dialogue([
    { who: 'bolt', text: 'Generator charged! Now — RAISE THE SHIELD and watch what it does to the solar wind!' }
  ]);
  await raiseShieldMoment(wind);
  await ui.dialogue([
    { who: 'bolt', text: 'See? With a shield, the wind slides right around. Without one... poor Mars lost everything. Earth still has its shield — that\'s why WE\'RE safe.', stamp: 'real' }
  ]);

  await askScience('mars');
  await askScience('mars');

  await ui.giveSample('a frost-covered polar rock', 2);
  await ui.giveClue('mr3');
  game.checkBadges();
  await ui.dialogue([
    { who: 'rusty', text: 'But here\'s hope: not all the water left. Some hid deep underground, in the caves. Dare to go down with me?' }
  ]);
  await closeScene(game, scene);
}

/** Show a RAISE THE SHIELD button; on tap the wind deflects around the bubble. */
function raiseShieldMoment(wind) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;left:50%;bottom:24%;transform:translateX(-50%);z-index:40;';
    const btn = document.createElement('button');
    btn.className = 'big-btn cyan';
    btn.textContent = '🧲 RAISE THE SHIELD!';
    wrap.appendChild(btn);
    document.getElementById('ui').appendChild(wrap);
    btn.onclick = () => {
      wind.userData.setShield(true);
      sfx.shard?.();
      ui.toast('🛡️ Shield up — the solar wind bends away!', true);
      btn.disabled = true;
      setTimeout(() => { wrap.remove(); resolve(); }, 2200);
    };
  });
}

/* ============================================================
   CHAPTER 4 — INTO THE CAVES (first-person)
============================================================ */
export async function chapterCaves(game) {
  const scene = new CaveScene(game, { showFps: false });
  game.setScene(scene);
  game.pipeline.setBloom(0.7, 0.55, 0.5);
  await ui.fade(false);

  await ui.dialogue([
    { who: 'rusty', text: 'Down we go — a real Martian lava tube! Caves like this could shelter explorers one day. Mind the dark!', stamp: 'real' },
    { who: 'bolt', text: 'Drag to look, hold WALK to move, tap the Lamp if it\'s dark. Find what Mars hides best down here: WATER. Go, Cadet!' }
  ]);

  ui.setObjective('🔦 Explore the lava tube — find the underground water!');
  await scene.run();        // resolves when the player reaches the water

  const finds = scene.findCount || 0;
  await ui.dialogue([
    { who: 'bolt', text: 'WATER! Frozen and liquid, hidden in the dark for a billion years. Where there\'s water, there might once have been LIFE.', stamp: 'real' }
  ]);
  await ui.giveSample('hidden cave water ice', 2 + finds);
  await askScience('mars');

  await ui.giveClue('mr4');
  game.checkBadges();   // Cave Explorer badge
  await ui.dialogue([
    { who: 'rusty', text: 'You found it! Now we know everything Mars lost — and what it needs. There is an ancient Keystone that can wake the planet... but only for those who understand it.' }
  ]);
  await ui.fade(true);
  scene.dispose();
}

/* ============================================================
   CHAPTER 5 — THE KEYSTONE (recall mystery)
============================================================ */
export async function chapterKeystone(game) {
  const scene = await openScene(game, 'marsred');
  addMountain(scene, 18, -34, 14);

  // the Keystone: a glowing ancient monolith
  const key = new THREE.Group();
  const stone = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 5, 1),
    new THREE.MeshStandardMaterial({ color: 0x3a3050, roughness: 0.4, metalness: 0.5, emissive: 0x2a1c5a, emissiveIntensity: 0.6 })
  );
  stone.position.y = 2.5;
  key.add(stone);
  const rune = new THREE.Mesh(
    new THREE.TorusGeometry(0.7, 0.12, 10, 24),
    new THREE.MeshStandardMaterial({ color: 0x5ce8ff, emissive: 0x5ce8ff, emissiveIntensity: 0 })
  );
  rune.position.set(0, 3, 0.55);
  key.add(rune);
  key.userData.rune = rune;
  scene.place(key, 0, -4, { id: 'keystone' });
  const rusty = makeRover();
  scene.place(rusty, -5, -1, { ry: 0.5 });

  await ui.dialogue([
    { who: 'bolt', text: 'There it is — the Keystone. But it\'s in PIECES, scattered by a billion years of dust storms. First we have to put it back together.' }
  ]);
  ui.setObjective('Tap the broken Keystone');
  await scene.waitInteract('keystone');
  ui.setObjective('');

  // STAGE 1: fit the keystone pieces together (sequencing puzzle)
  await ui.dialogue([
    { who: 'rusty', text: 'Fit the pieces in order, bottom to top — follow the numbers to build the arch!' }
  ]);
  await keystonePuzzle();
  rune.material.emissiveIntensity = 1;
  sfx.fanfare?.();

  // STAGE 2: the ancient language turns out to be MATH
  await askReadingSet('keystone', 1);
  await ui.dialogue([
    { who: 'keystone', text: 'THE GLYPHS GLOW...' },
    { who: 'bolt', text: 'Cadet — the ancient language is NUMBERS! It\'s math! Solve the glyph-sums to unlock the final lock.' }
  ]);
  for (let i = 0; i < 2; i++) {
    await askMath('addition', { label: `ANCIENT GLYPHS ${i + 1} OF 2`, icon: '🔣', gauge: { current: i, total: 2, icon: '🗝️' } });
    rune.material.emissiveIntensity = 1.5 + i;
  }

  // STAGE 3: the final mystery — recall everything learned on Mars
  await ui.dialogue([
    { who: 'keystone', text: 'ONE LOCK REMAINS. SPEAK TRUE WHAT THE RED PLANET LOST, AND WHAT ALL LIFE NEEDS.' },
    { who: 'bolt', text: 'This is it — the final mystery. Remember everything: the shield, the air, the water, the secret of life!' }
  ]);
  const total = 3;
  for (let i = 0; i < total; i++) {
    await askScience('keystone', { label: `FINAL MYSTERY ${i + 1} OF ${total}`, icon: '🗝️', gauge: { current: i, total, icon: '🗝️' } });
    rune.material.emissiveIntensity = 3 + i;   // the rune blazes brighter with each truth
    sfx.shard?.();
  }

  await ui.dialogue([
    { who: 'keystone', text: 'KNOWLEDGE ACCEPTED. THE ENGINES OF SPRING... AWAKEN.' },
    { who: 'bolt', text: 'YES! The waking-engines are firing up across Mars! You did it, Cadet — you rebuilt the Keystone AND solved its mystery!' }
  ]);
  await ui.giveClue('mr5');
  game.checkBadges();   // Planet Waker badge
  await closeScene(game, scene);
}

/** Fit the Keystone back together: DRAG each carved fragment into its matching
 *  socket on the tablet (match by colour + rune). Snaps when dropped close;
 *  bounces back otherwise. Window-tracked pointers so it works on iPad. */
function keystonePuzzle() {
  return new Promise((resolve) => {
    const FRAG = [
      { glyph: '✦', color: '#e8884a' }, { glyph: '◆', color: '#5cc8e8' }, { glyph: '▲', color: '#8ad06a' },
      { glyph: '☼', color: '#e8c44a' }, { glyph: '◉', color: '#c98ae0' }, { glyph: '❖', color: '#e87a7a' }
    ];
    const COLS = 3, ROWS = 2, CW = 100, CH = 84, PW = CW - 10, PH = CH - 10, OX = 18, OY = 12;
    const trayY = OY + ROWS * CH + 22;

    const screen = document.createElement('div');
    screen.className = 'screen dim';
    screen.style.zIndex = 65;
    screen.innerHTML = '<div class="ks-title">🧩 Drag each piece into its matching socket!</div>';
    const board = document.createElement('div');
    board.className = 'ks2-board';
    screen.appendChild(board);

    const slots = [];
    for (let i = 0; i < 6; i++) {
      const c = i % COLS, r = Math.floor(i / COLS);
      const slot = document.createElement('div');
      slot.className = 'ks2-slot';
      slot.style.cssText = `left:${OX + c * CW}px;top:${OY + r * CH}px;width:${PW}px;height:${PH}px;color:${FRAG[i].color};`;
      slot.textContent = FRAG[i].glyph;
      board.appendChild(slot);
      slots.push({ filled: false, cx: OX + c * CW + PW / 2, cy: OY + r * CH + PH / 2 });
    }

    const pieces = [];
    let placed = 0;
    const order = [...Array(6).keys()].sort(() => Math.random() - 0.5);
    order.forEach((target, pos) => {
      const f = FRAG[target];
      const homeX = OX + (pos % COLS) * CW, homeY = trayY + Math.floor(pos / COLS) * CH;
      const piece = document.createElement('div');
      piece.className = 'ks2-piece';
      piece.textContent = f.glyph;
      piece.style.cssText = `left:${homeX}px;top:${homeY}px;width:${PW}px;height:${PH}px;background:${f.color};`;
      piece.dataset.target = target;
      board.appendChild(piece);
      pieces.push({ el: piece, target, homeX, homeY, locked: false });
    });

    let drag = null, offX = 0, offY = 0;
    const rect = () => board.getBoundingClientRect();
    const onMove = (e) => {
      if (!drag) return;
      e.preventDefault();
      const r = rect();
      drag.el.style.left = `${e.clientX - r.left - offX}px`;
      drag.el.style.top = `${e.clientY - r.top - offY}px`;
    };
    const place = (obj) => {
      const slot = slots[obj.target];
      obj.el.style.left = `${slot.cx - PW / 2}px`;
      obj.el.style.top = `${slot.cy - PH / 2}px`;
      obj.locked = true; slot.filled = true;
      obj.el.classList.add('locked');
      placed++;
      if (placed === 6) { cleanup(); sfx.fanfare?.(); setTimeout(() => { screen.remove(); resolve(); }, 550); }
    };
    const onUp = () => {
      if (!drag) return;
      const obj = drag; drag = null;
      obj.el.classList.remove('drag');
      const slot = slots[obj.target];
      const px = parseFloat(obj.el.style.left) + PW / 2, py = parseFloat(obj.el.style.top) + PH / 2;
      if (!slot.filled && Math.hypot(px - slot.cx, py - slot.cy) < 56) { sfx.collect?.(); place(obj); }
      else { obj.el.style.left = `${obj.homeX}px`; obj.el.style.top = `${obj.homeY}px`; sfx.tap?.(); }
    };
    for (const obj of pieces) {
      obj.el.addEventListener('pointerdown', (e) => {
        if (obj.locked) return;
        e.preventDefault();
        drag = obj; obj.el.classList.add('drag');
        const r = rect();
        offX = e.clientX - (r.left + parseFloat(obj.el.style.left));
        offY = e.clientY - (r.top + parseFloat(obj.el.style.top));
      }, { passive: false });
    }
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.__ksSolve = undefined;
    };
    // test hook: snap every remaining piece home
    window.__ksSolve = () => { for (const obj of pieces) if (!obj.locked) place(obj); };

    document.getElementById('ui').appendChild(screen);
  });
}

/* ============================================================
   CHAPTER 6 — A NEW DAWN (terraform showpiece + cliffhanger)
============================================================ */
export async function chapterDawn(game) {
  // --- showpiece: Mars blooms from red to blue-green ---
  const terra = new TerraformScene(game);
  game.setScene(terra);
  game.pipeline.setBloom(0.95, 0.6, 0.6);
  await ui.fade(false);

  await ui.dialogue([
    { who: 'luma', text: 'Look at it, Cadet... the engines are working. Watch the Red Planet wake up!' }
  ]);
  ui.setObjective('🌅 Waking the Red Planet...');
  await animate(game.pipeline?.quality === 'low' ? 2600 : 4200, (k) => terra.setProgress(k));
  ui.setObjective('');
  sfx.fanfare?.();
  await ui.dialogue([
    { who: 'bolt', text: 'The ice is melting into new rivers. The air is thickening. Green is spreading along the old shores. Mars is ALIVE again!', stamp: 'real' },
    { who: 'luma', text: 'A whole world, reborn. The Solari finally have a home of their own.' }
  ]);
  await ui.fade(true);
  terra.dispose();

  // --- surface finale: the Solari's first dawn on a living Mars ---
  const scene = await openScene(game, 'marsalive');
  addLuma(scene, 0, 4.5, -6);
  // a blue lake and green plant tufts make the new world feel alive
  const lake = new THREE.Mesh(
    new THREE.CircleGeometry(11, 40),
    new THREE.MeshStandardMaterial({ color: 0x2f7fb4, emissive: 0x1c5a86, emissiveIntensity: 0.4, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.9 })
  );
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(-2, 0.05, -16);
  scene.scene.add(lake);
  for (let i = 0; i < 26; i++) {
    const blade = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.7 + Math.random() * 0.5, 4),
      new THREE.MeshStandardMaterial({ color: i % 2 ? 0x4aa860 : 0x6ec878, roughness: 0.8, flatShading: true })
    );
    const a = Math.random() * Math.PI * 2, d = 9 + Math.random() * 12;
    blade.position.set(Math.cos(a) * d, 0.35, Math.sin(a) * d * 0.7 - 2);
    scene.scene.add(blade);
  }
  const sola = makeAlien('solari');
  scene.place(sola, -4, -2, { id: 'sola', ry: 0.5 });
  const vega = makeAlien('solari');
  vega.scale.setScalar(1.1);
  scene.place(vega, 5, -1, { ry: -0.5 });
  const rusty = makeRover();
  scene.place(rusty, 1, -4, { ry: 0 });

  await ui.dialogue([
    { who: 'sola', text: 'Green hills. Blue water. Warm air. You gave my people a future, Cadet. We are home at last.' },
    { who: 'rusty', text: 'And I\'m not alone anymore! Best. Day. Ever. Beep beep!' }
  ]);
  await ui.giveCard('vega');
  await ui.giveCard('luma');
  await askReadingSet('dawn', 2);
  await askScience('mars');

  // --- the cliffhanger ---
  await ui.dialogue([
    { who: 'signal', text: '...kzzt... this is Earth... we see something far off in the sky... is anyone out there?... kzzt...' },
    { who: 'bolt', text: 'Cadet — my tracker just lit up RED. That killer beam from the Pinwheel, the one we saw long ago? After ages crossing space, it\'s finally on a path toward EARTH.', stamp: 'real' },
    { who: 'bolt', text: 'It won\'t arrive for a long, long time — but it IS coming. And that faint signal is from home. They\'ve spotted it, and they\'re scared.', stamp: 'real' },
    { who: 'luma', text: 'Earth is just our neighbor — we can zip home and warn everyone quickly. But STOPPING that beam? Its source is unimaginably far across the galaxy.' },
    { who: 'bolt', text: 'To reach something that far, we\'d have to fly so close to light-speed that time itself would bend. We might return to a changed world...', stamp: 'real' },
    { who: 'player', text: 'Then first we warn Earth — and then we go the distance to save it. Crew, set course for home!' }
  ]);
  await ui.giveClue('mr6');
  await closeScene(game, scene);

  await toBeContinued();
}

/** A dramatic "TO BE CONTINUED" stinger into game 5. */
function toBeContinued() {
  return new Promise((resolve) => {
    const screen = document.createElement('div');
    screen.className = 'screen dim';
    screen.style.zIndex = 95;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center;padding:0 22px;';
    const t1 = document.createElement('div');
    t1.style.cssText = 'font-size:clamp(22px,5vw,40px);font-weight:900;color:#ffd95c;text-shadow:0 0 18px rgba(255,217,92,0.6);';
    t1.textContent = 'Course set for home — and then the long road to save it...';
    const t2 = document.createElement('div');
    t2.style.cssText = 'font-size:clamp(28px,7vw,60px);font-weight:900;letter-spacing:2px;color:#5ce8ff;text-shadow:0 0 24px rgba(92,232,255,0.7);';
    t2.textContent = 'TO BE CONTINUED...';
    const t3 = document.createElement('div');
    t3.className = 'title-sub';
    t3.textContent = 'Mission: Starlight 5 — warn the Earth, then the journey where time bends';
    const btn = document.createElement('button');
    btn.className = 'big-btn';
    btn.textContent = '🌟 You saved a world!';
    btn.onclick = () => { sfx.fanfare?.(); screen.remove(); resolve(); };
    wrap.append(t1, t2, t3, btn);
    screen.appendChild(wrap);
    document.getElementById('ui').appendChild(screen);
  });
}

export const CHAPTER_SCRIPTS = [
  chapterWelcome,
  chapterRivers,
  chapterDeath,
  chapterCaves,
  chapterKeystone,
  chapterDawn
];
