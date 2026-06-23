// The conductor: render pipeline, scene switching, story progression, badges.
import * as THREE from 'three';
import { loadSave, save, resetSave, loadGame1Save } from './save.js';
import { CHAPTERS, BADGES } from './content.js';
import { CHAPTER_SCRIPTS } from './systems/chapters.js';
import { HyperspaceScene } from './hyperspace/hyperspace.js';
import { makeStarfield, makePlanet, makeNebulaCloud, makeGlowSprite } from './world/builders.js';
import { makeKillerStar } from './killerstar/killerstar.js';
import { runKillerStarSlice } from './systems/sliceScene.js';
import { runCaveSlice } from './cave/caveScene.js';
import { Pipeline } from './fx/post.js';
import * as ui from './ui/ui.js';
import { pickMath } from './edu/engine.js';
import { openParentZone } from './ui/parent.js';
import { sfx } from './audio.js';
import { collectSagaPiece } from './saga.js';

// jump-calculation skill per destination chapter (only 'jump'-arrival chapters use it)
const JUMP_SKILLS = [null, 'addition', 'subtraction', 'multiplication', null, null];

class TitleBackdrop {
  constructor(game) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2000);
    this.camera.position.set(0, 2, 26);
    this.scene.add(makeStarfield(game.lowDetail ? 500 : 1400));
    this.scene.add(new THREE.HemisphereLight(0x8899ff, 0x110a22, 2.2));
    const sun = new THREE.DirectionalLight(0xfff2dd, 3.2);
    sun.position.set(30, 20, 10);
    this.scene.add(sun);

    // the poster shot: the Pinwheel killer star looming over ocean-world Veyra
    this.star = makeKillerStar(30);
    this.star.position.set(16, 7, -64);
    this.star.userData.setCharge(0.25);
    this.scene.add(this.star);

    const cloud = makeNebulaCloud(0x4a7ab0, 10, 50);
    cloud.position.set(0, 8, -82);
    this.scene.add(cloud);

    this.planets = [];
    const layout = [['veyra', 3.0, -12, 2, -46], ['harbor', 1.7, 18, -7, -40]];
    for (const [key, r, x, y, z] of layout) {
      const p = makePlanet(key, r);
      p.position.set(x, y, z);
      this.scene.add(p);
      this.planets.push(p);
    }
  }
  update(dt, t) {
    for (const p of this.planets) p.rotation.y += dt * 0.12;
    this.star.userData.update(dt, t);
    this.star.userData.face(this.camera);
    this.camera.position.x = Math.sin(t * 0.08) * 4;
    this.camera.lookAt(0, 0, -30);
  }
  dispose() {}
}

export class Game {
  constructor() {
    this.pipeline = new Pipeline(document.getElementById('scene'));
    this.activeScene = null;
    this.clock = new THREE.Clock();

    addEventListener('resize', () => {
      this.pipeline.resize();
      if (this.activeScene?.camera) {
        this.activeScene.camera.aspect = innerWidth / innerHeight;
        this.activeScene.camera.updateProjectionMatrix();
      }
    });

    const loop = () => {
      requestAnimationFrame(loop);
      const dt = Math.min(this.clock.getDelta(), 0.1);
      const t = this.clock.elapsedTime;
      if (this.activeScene) {
        this.activeScene.update?.(dt, t);
        this.pipeline.render(dt);
      }
    };
    loop();
  }

  /** Compatibility with the proven scene code from game 1. */
  get renderer() { return this.pipeline.renderer; }
  get lowDetail() { return this.pipeline.quality === 'low'; }

  setScene(sceneObj) {
    this.activeScene = sceneObj;
    if (sceneObj?.camera) {
      sceneObj.camera.aspect = innerWidth / innerHeight;
      sceneObj.camera.updateProjectionMatrix();
      this.pipeline.attach(sceneObj.scene, sceneObj.camera);
      // scene-appropriate bloom: hyperspace and the title burn brighter
      if (sceneObj instanceof HyperspaceScene) this.pipeline.setBloom(0.85, 0.55, 0.8);
      else if (sceneObj instanceof TitleBackdrop) this.pipeline.setBloom(1.0, 0.65, 0.75);
      else this.pipeline.setBloom(0.8, 0.55, 0.85);
    }
  }

  openParentZone() {
    openParentZone(this, () => location.reload());
  }

  checkBadges() {
    const s = loadSave();
    for (const badge of BADGES) {
      const earned = badge.test(s);
      if (earned && !s.badges.includes(badge.id)) {
        s.badges.push(badge.id);
        save();
        const prize = s.parent.prizes.find((p) => p.milestone === badge.id);
        ui.rewardBurst(badge.icon, `Badge earned: ${badge.name}!`,
          prize ? `Show a grown-up — this badge is worth a real prize: "${prize.reward}" 🎁` : 'You\'re becoming a legend of the spaceways!');
      }
      if (badge.id === 'finish' && earned) collectSagaPiece('game3');
    }
  }

  /** If the screen is still black from a scene change, fade back in over the starry backdrop. */
  async toBackdrop() {
    if (!this.backdrop) this.backdrop = new TitleBackdrop(this);
    this.setScene(this.backdrop);
    if (ui.isFaded()) await ui.fade(false);
  }

  /** Jump calculations (math gate) + ride the light-river to a destination. */
  async jump(chapterIdx, destName) {
    if (ui.isFaded()) await this.toBackdrop();
    await ui.dialogue([
      { who: 'luma', text: `Course locked on ${destName}! The light-river is humming...` },
      { who: 'bolt', text: 'But a jump needs JUMP CALCULATIONS — true numbers to plot the way. Ready, Cadet?' }
    ]);
    const skill = JUMP_SKILLS[chapterIdx] || 'addition';
    for (let i = 0; i < 2; i++) {
      await ui.askQuestion(pickMath(skill), {
        contextLabel: `JUMP CALCULATION ${i + 1} OF 2`,
        icon: '🌀',
        gauge: { current: i, total: 2, icon: '🌀' }
      });
    }
    await ui.dialogue([
      { who: 'bolt', text: 'Gate is OPEN! Steer with the joystick, hold LIGHTSPEED to zoom, catch ⭐ photons, and dodge those purple gravity ripples!' }
    ]);

    await ui.fade(true);
    const ride = new HyperspaceScene(this, destName);
    this.setScene(ride);
    await ui.fade(false);
    await ride.run();      // resolves faded-to-black after arrival
    ride.dispose();
    ui.countJump();
  }

  async start() {
    const s = loadSave();
    ui.buildHUD(this);

    // PHASE-A vertical slice: boot straight to the first-person cave to benchmark
    // the new mechanic on the iPad before building the rest of the game.
    if (new URLSearchParams(location.search).has('slice')) {
      await runCaveSlice(this);
      return;
    }

    this.checkBadges();   // backfills saga progress for already-finished saves
    if (!s.cards.includes('bolt')) { s.cards.push('bolt'); save(); }   // Bolt is always aboard
    await this.toBackdrop();

    // same github.io origin: greet the returning hero of game 2 by name
    const g1 = loadGame1Save();
    let greeting = null;
    if (g1?.name && !s.name) {
      greeting = g1.chapter >= 7
        ? `🏅 Welcome back, Cadet ${g1.name} — Hero of the Heart!`
        : `👋 Good to see you again, Cadet ${g1.name}!`;
    }

    const choice = await ui.titleScreen(!!s.name, greeting);
    if (choice === 'new') {
      resetSave();
      return this.start();
    }

    if (!s.name) {
      const name = await ui.nameEntry(g1?.name || '');
      s.name = name;
      if (g1?.chapter >= 7 && g1?.name?.toLowerCase() === name.toLowerCase()) {
        s.game1Hero = true;   // unlocks the Hero of the Heart badge (finished game 2)
      }
      save();
      this.checkBadges();
    }

    if (!s.seenIntro) {
      s.seenIntro = true;
      save();
      await ui.dialogue([
        { who: 'bolt', text: `Cadet ${s.name}, reporting for duty! Bolt here, fact-checker chip warmed up. Beep!` },
        { who: 'luma', text: 'And me! I\'m flying as your navigator now. Bolt, play them the message we caught...' },
        { who: 'signal', text: '...please... our star is dying... please, help us...' },
        { who: 'bolt', text: 'A whole civilization is calling — the Solari, on an ocean world far across the galaxy. A giant star near them is about to die... and it might take their world with it.', stamp: 'real' },
        { who: 'bolt', text: 'There\'s no time to lose. Plot the jump, Cadet. We\'re going to save them.' }
      ]);
    }

    // story loop
    while (loadSave().chapter < CHAPTERS.length) {
      const i = loadSave().chapter;
      const ch = CHAPTERS[i];
      if (ui.isFaded()) await this.toBackdrop();
      try {
        await ui.chapterCard(i + 1, ch.name, ch.sub);
        if (ch.arrival === 'self') {
          /* the chapter flies itself (the "race the beam" escape) */
        } else if (ch.arrival === 'fade') {
          await ui.fade(true);      // a quiet montage-style arrival
        } else {
          await this.jump(i, ch.name);
        }
        await CHAPTER_SCRIPTS[i](this);
        const st = loadSave();
        st.chapter = i + 1;
        save();
        this.checkBadges();
      } catch (e) {
        if (e instanceof ui.DemotionSignal) { await this.goBackAChapter(i); continue; }
        throw e;
      }
    }

    // story complete: free-play replay menu
    await this.freePlay();
  }

  /** Three cumulative wrong answers: bounce the player back one chapter to practice, then work forward again. */
  async goBackAChapter(fromIndex) {
    const target = Math.max(0, fromIndex - 1);
    const st = loadSave();
    st.chapter = target;
    save();
    // tear down any half-built chapter scene so we return cleanly to the backdrop
    if (this.activeScene && this.activeScene !== this.backdrop && this.activeScene.dispose) {
      try { this.activeScene.dispose(); } catch { /* best effort */ }
    }
    ui.setObjective('');
    if (!ui.isFaded()) await ui.fade(true);
    await this.toBackdrop();
    await ui.dialogue([
      { who: 'bolt', text: `Oops meter's full, Cadet — totally okay! Let's loop back to ${CHAPTERS[target].name} and warm up those brain-thrusters. 🚀` }
    ]);
  }

  async freePlay() {
    for (;;) {
      await this.toBackdrop();
      const pick = await this.replayMenu();
      try {
        const ch = CHAPTERS[pick];
        await ui.chapterCard(pick + 1, ch.name, ch.sub);
        if (ch.arrival === 'self') { /* chapter flies itself */ }
        else if (ch.arrival === 'fade') await ui.fade(true);
        else await this.jump(pick, ch.name);
        await CHAPTER_SCRIPTS[pick](this);
      } catch (e) {
        if (!(e instanceof ui.DemotionSignal)) throw e;   // in free-play, just bow back out to the menu
      }
    }
  }

  replayMenu() {
    return new Promise((resolve) => {
      const screen = document.createElement('div');
      screen.className = 'screen dim';
      const title = document.createElement('div');
      title.className = 'title-sub';
      title.textContent = '🌟 Mission complete! Ride any light-river again:';
      screen.appendChild(title);
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:80vw;';
      CHAPTERS.forEach((ch, i) => {
        const b = document.createElement('button');
        b.className = 'dlg-btn primary';
        b.textContent = `${i + 1}. ${ch.name}`;
        b.onclick = () => { sfx.tap(); screen.remove(); resolve(i); };
        wrap.appendChild(b);
      });
      screen.appendChild(wrap);
      document.getElementById('ui').appendChild(screen);
    });
  }
}
