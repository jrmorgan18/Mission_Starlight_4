// The six chapters of Mission: Starlight 4 — "Waking the Red Planet". Each is an
// async storybook script: build the diorama, talk, explore, sneak in the
// learning. Dialogue lines can carry stamp:'real'|'magic' — Bolt's fact-checker
// marks REAL SCIENCE vs STORY MAGIC.
import * as THREE from 'three';
import { WorldScene } from './worldScene.js';
import { collectParts, boulderHunt, tapAny, programRover, windBlock, animate } from './minigames.js';
import { keystoneJigsaw } from './jigsaw.js';
import { CaveScene } from '../cave/caveScene.js';
import { TerraformScene, makeSolarWind } from '../mars/showpieces.js';
import { makeAlien, makeLuma, makeRover, makeRock, makeCrystal, makeShip, makeGlowSprite, makePlanet, makeTree, makeGrassField, makeSkyDome, makeShootingStar } from '../world/builders.js';
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
  dressMars(scene, key);
  game.setScene(scene);
  await ui.fade(false);
  return scene;
}

/** Set-dress the dead-Mars sites so each feels like a real, distinct place:
 *  a small far Sun, Phobos & Deimos drifting overhead (real science!), distant
 *  landforms ringing the horizon, and the occasional shooting star. */
function dressMars(scene, key) {
  if (!['marsred', 'marscanyon', 'marspolar'].includes(key)) return;
  const S = scene.scene;
  const flat = new THREE.MeshStandardMaterial({ color: 0x6a3018, roughness: 1, flatShading: true });

  // the Sun, small and far (Mars gets less sunlight than Earth)
  const sun = makeGlowSprite(0xffe8c0, 12);
  sun.position.set(20, 22, -60);
  S.add(sun);

  // Phobos & Deimos, Mars's two little potato moons, drifting across the sky
  for (const [size, y, speed, phase] of [[1.0, 26, 0.05, 0], [0.6, 31, 0.075, 2.6]]) {
    const moon = new THREE.Mesh(
      new THREE.IcosahedronGeometry(size, 0),
      new THREE.MeshStandardMaterial({ color: 0x9a8878, roughness: 1, flatShading: true })
    );
    moon.userData.update = (dt, t) => {
      const a = t * speed + phase;
      moon.position.set(Math.cos(a) * 46, y + Math.sin(a * 1.7) * 2, -42 + Math.sin(a) * 12);
      moon.rotation.y += dt * 0.3;
    };
    S.add(moon);
  }

  // shooting stars — rare, magical, worth pointing at
  S.add(makeShootingStar());
  S.add(makeShootingStar());

  if (key === 'marsred') {
    // flat-topped mesas ringing the horizon + soft dunes
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.35;
      if (Math.abs(Math.sin(a)) < 0.25 && Math.cos(a) > 0) continue;   // keep the camera lane open
      const h = 7 + Math.random() * 7, r = 5 + Math.random() * 4;
      const mesa = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, h, 7), flat.clone());
      mesa.material.color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.06);
      mesa.position.set(Math.cos(a) * 48, h / 2 - 2, Math.sin(a) * 44 - 6);
      S.add(mesa);
    }
    for (let i = 0; i < 5; i++) {
      const dune = new THREE.Mesh(new THREE.SphereGeometry(6 + Math.random() * 4, 10, 6), new THREE.MeshStandardMaterial({ color: 0xb06438, roughness: 1 }));
      dune.scale.y = 0.22;
      const a = Math.random() * Math.PI * 2;
      dune.position.set(Math.cos(a) * 34, -1.4, Math.sin(a) * 30 - 8);
      S.add(dune);
    }
  } else if (key === 'marscanyon') {
    // layered canyon walls closing in on two sides, like standing in Valles Marineris
    for (let i = 0; i < 9; i++) {
      const side = i % 2 ? 1 : -1;
      const h = 10 + Math.random() * 8, w = 10 + Math.random() * 6;
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 4), new THREE.MeshStandardMaterial({
        color: i % 3 === 0 ? 0x8a4a28 : (i % 3 === 1 ? 0xa05830 : 0x74381e), roughness: 1, flatShading: true
      }));
      wall.position.set(side * (26 + Math.random() * 10), h / 2 - 2, -14 - i * 4.5);
      wall.rotation.y = side * (0.3 + Math.random() * 0.3);
      S.add(wall);
    }
    // a wind-carved rock arch on the horizon
    const arch = new THREE.Group();
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2, 9, 6), flat.clone());
    const legR = legL.clone(); legL.position.x = -4; legR.position.x = 4;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 11, 6), flat.clone());
    top.rotation.z = Math.PI / 2; top.position.y = 4.5;
    arch.add(legL, legR, top);
    arch.position.set(-6, 2.5, -40);
    S.add(arch);
  } else if (key === 'marspolar') {
    // glittering ice spires + frost mounds around the polar site
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.6;
      if (Math.abs(Math.sin(a)) < 0.22 && Math.cos(a) > 0) continue;
      const h = 5 + Math.random() * 6;
      const spire = new THREE.Mesh(new THREE.ConeGeometry(1.2 + Math.random(), h, 5), new THREE.MeshStandardMaterial({
        color: 0xdfeaff, roughness: 0.25, metalness: 0.1, emissive: 0x4a5a8a, emissiveIntensity: 0.25, flatShading: true
      }));
      spire.position.set(Math.cos(a) * (30 + Math.random() * 12), h / 2 - 1.5, Math.sin(a) * 28 - 8);
      spire.rotation.y = Math.random() * Math.PI;
      S.add(spire);
    }
    for (let i = 0; i < 6; i++) {
      const mound = new THREE.Mesh(new THREE.SphereGeometry(3 + Math.random() * 3, 10, 6), new THREE.MeshStandardMaterial({ color: 0xe8f0ff, roughness: 0.6 }));
      mound.scale.y = 0.3;
      const a = Math.random() * Math.PI * 2;
      mound.position.set(Math.cos(a) * 26, -0.7, Math.sin(a) * 24 - 6);
      S.add(mound);
    }
  }
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

  // Rusty's wheels are stiff — program him a route (a first taste of coding)
  await ui.dialogue([
    { who: 'rusty', text: 'Oh! But my old wheels only follow PROGRAMS now. Tap the arrows to write my route, then press RUN — I\'ll show you my favorite shiny stone!' }
  ]);
  await programRover();
  await ui.dialogue([
    { who: 'rusty', text: 'Wheee! A perfect program! You drive better than mission control ever did. Beep beep!' }
  ]);

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
    { who: 'bolt', text: 'Generator charged! But it needs a minute to warm up — and the wind never stops. Block those gusts by HAND while we wait, Cadet!' }
  ]);
  await windBlock(game.lowDetail ? 6 : 8);
  await ui.dialogue([
    { who: 'rusty', text: 'Phew — nice blocking! Now you FEEL how hard the wind pushes, day after day, for a billion years. Generator\'s ready. Do the honors!' }
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
    { who: 'rusty', text: 'The pieces are scattered everywhere! Drag each one into the frame — make the carved runes line up so they fit together.' }
  ]);
  await keystoneJigsaw({ cols: 4, rows: 2 });
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

  // --- surface finale: a lush, living Mars landscape ---
  const scene = await openScene(game, 'marsalive');
  // daytime sky: hide the space starfield, brighten the air, add a gradient dome
  scene.scene.traverse((o) => { if (o.isPoints) o.visible = false; });
  scene.scene.background = new THREE.Color(0x9fcfe8);
  if (scene.scene.fog) { scene.scene.fog.color.set(0xbfe2f0); scene.scene.fog.near = 36; scene.scene.fog.far = 120; }
  scene.scene.add(new THREE.HemisphereLight(0xbfe6ff, 0x3f7a44, 1.2));   // sky/grass bounce
  const sky = makeSkyDome(0x4f9fe0, 0xd6effa, 220);
  scene.scene.add(sky);

  addLuma(scene, 7, 4.5, 2);

  // a reflective lake with gently rippling water
  const lakeGeo = new THREE.PlaneGeometry(30, 22, 28, 20);
  const lake = new THREE.Mesh(lakeGeo, new THREE.MeshStandardMaterial({
    color: 0x2f86c0, emissive: 0x1d5e92, emissiveIntensity: 0.35, roughness: 0.08, metalness: 0.5, transparent: true, opacity: 0.92
  }));
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(-3, 0.06, -20);
  const base = lakeGeo.attributes.position.array.slice();
  lake.userData.update = (dt, t) => {
    const p = lakeGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const ox = base[i * 3], oy = base[i * 3 + 1];
      p.setZ(i, Math.sin(ox * 0.5 + t * 1.6) * 0.12 + Math.cos(oy * 0.6 + t * 1.2) * 0.12);
    }
    p.needsUpdate = true;
  };
  scene.scene.add(lake);

  // dense grass + trees + distant mountains
  scene.scene.add(makeGrassField(game.lowDetail ? 220 : 520, 5, 28));
  for (let i = 0; i < (game.lowDetail ? 7 : 12); i++) {
    const a = Math.random() * Math.PI * 2, d = 10 + Math.random() * 14;
    const tree = makeTree(0.8 + Math.random() * 0.7);
    tree.position.set(Math.cos(a) * d, 0, Math.sin(a) * d * 0.7 - 2);
    if (Math.hypot(tree.position.x + 3, tree.position.z + 20) > 11) scene.scene.add(tree);   // keep the lake clear
  }
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(
      new THREE.ConeGeometry(10 + Math.random() * 6, 12 + Math.random() * 8, 5),
      new THREE.MeshStandardMaterial({ color: 0x7a4a3a, roughness: 1, flatShading: true })
    );
    m.position.set((i - 3) * 22 + 6, 3, -70 - Math.random() * 10);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(4.5, 5, 5), new THREE.MeshStandardMaterial({ color: 0xeef6ff, roughness: 0.8, flatShading: true }));
    cap.position.set(m.position.x, m.position.y + 6, m.position.z);
    scene.scene.add(m, cap);
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

  // --- plant the first garden: a joyful, no-fail celebration ---
  await ui.dialogue([
    { who: 'sola', text: 'On Veyra, the first family in a new home plants the first garden. Cadet... will you plant ours with us?' }
  ]);
  const seedIds = [];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group();
    const seed = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x8a6a3a, emissive: 0xffd95c, emissiveIntensity: 0.9, roughness: 0.6 })
    );
    seed.position.y = 0.3;
    g.add(seed);
    const a = (i / 5) * Math.PI * 2 + 0.5;
    const id = `seed${i}`;
    scene.place(g, Math.cos(a) * 6.5, Math.sin(a) * 4.5 - 1, { id });
    seedIds.push(id);
  }
  ui.setObjective('🌱 Tap each glowing spot to plant the first garden!');
  let remainingSeeds = [...seedIds];
  let planted = 0;
  while (remainingSeeds.length) {
    const id = await tapAny(scene, remainingSeeds);
    remainingSeeds = remainingSeeds.filter((x) => x !== id);
    const item = scene.interactives.get(id);
    scene.clearMarker(id);
    scene.interactives.delete(id);
    const spot = item.obj.position.clone();
    scene.scene.remove(item.obj);
    sfx.collect?.();
    // sprout! a tree or flower bush bursts up with a sparkle
    planted++;
    const sprout = planted % 2 ? makeTree(0.55 + Math.random() * 0.4) : makeFlowerPatch();
    sprout.position.set(spot.x, 0, spot.z);
    sprout.scale.setScalar(0.01);
    scene.scene.add(sprout);
    const spark = makeGlowSprite(0xaef2b0, 3);
    spark.position.set(spot.x, 1.2, spot.z);
    scene.scene.add(spark);
    await animate(500, (k) => { sprout.scale.setScalar(0.01 + k * 0.99); spark.material.opacity = 1 - k; });
    scene.scene.remove(spark);
  }
  ui.setObjective('');
  sfx.fanfare?.();
  ui.toast('🌸 The first garden of new Mars is planted!', true);

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

/** A little flowering bush for the first-garden celebration. */
function makeFlowerPatch() {
  const g = new THREE.Group();
  const bush = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), new THREE.MeshStandardMaterial({ color: 0x3f8a46, roughness: 1 }));
  bush.position.y = 0.4;
  bush.scale.y = 0.75;
  g.add(bush);
  const cols = [0xffe45c, 0xff8ad0, 0xffffff, 0x9ad0ff];
  for (let i = 0; i < 6; i++) {
    const f = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 5),
      new THREE.MeshStandardMaterial({ color: cols[i % 4], emissive: cols[i % 4], emissiveIntensity: 0.35 })
    );
    const a = Math.random() * Math.PI * 2;
    f.position.set(Math.cos(a) * 0.4, 0.62 + Math.random() * 0.25, Math.sin(a) * 0.4);
    g.add(f);
  }
  return g;
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
