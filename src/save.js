// Persistent save data (localStorage). One save slot, autosaved on every change.
const KEY = 'mission-starlight4-save-v1';
const GAME1_KEY = 'mission-starlight3-save-v1';   // the previous game's save — same origin, readable here

// How many wrong answers (cumulative, game-wide) send the player back a planet.
// Higher here than game 1 because the sequel's questions are harder. Parent-adjustable.
export const DEFAULT_OOPS_LIMIT = 5;
export const OOPS_LIMIT_RANGE = [3, 4, 5, 6, 7, 8];

const DEFAULT_PRIZES = [
  { milestone: 'jump3', label: 'Make 3 hyperspace jumps', reward: '15 minutes later bedtime on weekend' },
  { milestone: 'beacons3', label: 'Bring 3 deflector shields online', reward: 'Extra treat with dinner' },
  { milestone: 'journal10', label: 'Learn 10 Star Journal facts', reward: '15 minutes extra tablet time' },
  { milestone: 'pinwheel', label: "Survive the Pinwheel's gamma-ray burst", reward: '30 minutes extra Roblox time' },
  { milestone: 'finish', label: 'Save the Solari and reach Safe Harbor', reward: '1 of 5 pieces toward the Grand Prize — see below!' }
];

function defaultSave() {
  return {
    version: 1,
    name: '',
    chapter: 0,          // index of the next chapter to play; 7 = story complete
    beacons: 0,          // pulsar beacons lit (sequel's "shards")
    starBits: 0,
    jumps: 0,            // hyperspace jumps made
    cards: [],           // collected crew/creature card ids
    clues: [],           // mystery clue ids
    badges: [],          // earned milestone ids
    skills: {},          // skillId -> { level, correct, wrong, streak }
    missCount: 0,        // game-wide wrong-answer tally; at 3 we ease a level back, then reset
    journal: [],         // missed-question memory entries
    factsLearned: [],    // science fact ids seen (right OR wrong) for the databank
    parent: { prizes: DEFAULT_PRIZES, soundOn: true, musicOn: true, difficultyOffset: 0, quality: 'auto', oopsLimit: DEFAULT_OOPS_LIMIT },
    minutesPlayed: 0,
    seenIntro: false
  };
}

let state = null;

export function loadSave() {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? Object.assign(defaultSave(), JSON.parse(raw)) : defaultSave();
  } catch {
    state = defaultSave();
  }
  return state;
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full/blocked: play on */ }
}

export function resetSave() {
  state = defaultSave();
  save();
  return state;
}

/** Peek at the original Mission: Starlight save (same origin on github.io and localhost). */
export function loadGame1Save() {
  try {
    const raw = localStorage.getItem(GAME1_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// He's been playing game 1 — start every skill a tier up from its tuned start.
const STARTING_LEVEL = { addition: 3, subtraction: 3, multiplication: 3, wordprob: 3, patterns: 2, comparison: 2, counting: 2 };

export function getSkill(id) {
  const s = loadSave();
  if (!s.skills[id]) s.skills[id] = { level: STARTING_LEVEL[id] || 1, correct: 0, wrong: 0, streak: 0 };
  return s.skills[id];
}

/** Wrong-answer count that triggers a go-back-a-planet (parent-configurable; falls back for old saves). */
export function oopsLimit() {
  return loadSave().parent.oopsLimit || DEFAULT_OOPS_LIMIT;
}

export function setOopsLimit(n) {
  const s = loadSave();
  s.parent.oopsLimit = Math.max(2, Math.min(9, n));
  save();
  return s.parent.oopsLimit;
}
