// Story content for Mission: Starlight 3 — "Race the Dying Star".
// Based on the "Stars That Kill" episode: rescue the Solari of ocean-world
// Veyra from the Pinwheel, a Wolf-Rayet star about to fire a gamma-ray burst.
// Sets up game 4 (relocate the survivors to Mars) and woven hints that the
// same danger could one day point at Earth (game 5).

export const CHAPTERS = [
  { id: 0, key: 'veyra',       name: 'Arrival at Veyra',     sub: 'A world under two suns',          world: 'veyra',       arrival: 'fade' },
  { id: 1, key: 'observatory', name: 'The Sky-Watchers',     sub: "Reading a star's fate",           world: 'observatory', arrival: 'jump' },
  { id: 2, key: 'pinwheel',    name: 'The Pinwheel',         sub: 'Face to face with a killer star', world: 'pinwheel',    arrival: 'jump' },
  { id: 3, key: 'spaceport',   name: 'The Great Evacuation', sub: 'Every family aboard',             world: 'spaceport',   arrival: 'jump' },
  { id: 4, key: 'race',        name: 'Race the Beam',        sub: 'Outrun the dying light',          world: 'race',        arrival: 'self' },
  { id: 5, key: 'harbor',      name: 'Safe Harbor',          sub: 'A new dawn — and a far warning',  world: 'harbor',      arrival: 'fade' }
];

export const CLUES = {
  ks1: { id: 'ks1', icon: '🌟', title: 'A World Under Two Suns', text: 'Veyra has a gentle little sun of its own — but a second, dazzling star hangs in its sky: the Pinwheel. Bolt says it is a Wolf-Rayet star, the biggest and hottest kind, near the end of its life. (Bolt stamps this REAL SCIENCE.)' },
  ks2: { id: 'ks2', icon: '🌀', title: 'The Spinning Star', text: 'The sky-watchers showed us the Pinwheel is spinning fast and flinging out spiral dust. When a star like this dies, its spin can fire a GAMMA-RAY BURST — a narrow beam of killing light. (REAL SCIENCE.)' },
  ks3: { id: 'ks3', icon: '🧭', title: 'Where the Beam Points', text: 'Up close, Bolt charted the beam\'s aim. It does NOT point at Veyra — it points past it, off toward a tiny faraway blue world. Strange... Bolt quietly logged the coordinates "for later."' },
  ks4: { id: 'ks4', icon: '🚀', title: 'The Ark Plan', text: 'You cannot move a whole world in time. The plan instead: build ark-ships and lift every Solari family to safety before the Pinwheel dies.' },
  ks5: { id: 'ks5', icon: '⚡', title: 'The Burst', text: 'The Pinwheel died — and fired its beam exactly where Bolt predicted. The deflector split it around the fleet and everyone made it out. A dying star is fierce, but even its light still takes TIME to travel.' },
  ks6: { id: 'ks6', icon: '🔵', title: 'A Message for Home', text: 'The beam runs on across the galaxy toward that small blue world — our own Earth, far in the future. Someday someone will have to send a warning home. For now the Solari are safe, setting course for a little red planet to begin again.' }
};

export const CARDS = [
  { id: 'bolt',     face: '🤖', name: 'Bolt',          desc: 'Your robot co-pilot and fact-checker. Stamps every fact REAL or STORY MAGIC.' },
  { id: 'luma',     face: '🌟', name: 'Luma',          desc: 'The little star you once carried home — now your ship\'s glowing navigator.' },
  { id: 'sola',     face: '👽', name: 'Elder Sola',    desc: 'Wise leader of the Solari. She has watched the Pinwheel her whole long life.' },
  { id: 'pip',      face: '🐚', name: 'Pip',           desc: 'A curious young Solari who shows you around Veyra\'s coral cities.' },
  { id: 'astra',    face: '🔭', name: 'Astra',         desc: 'Keeper of the sky-watch tower. She reads the future in starlight.' },
  { id: 'vega',     face: '🚀', name: 'Captain Vega',  desc: 'Commander of the Solari ark-fleet. She never leaves anyone behind.' },
  { id: 'pinwheel', face: '🌀', name: 'The Pinwheel',  desc: 'A Wolf-Rayet star spinning toward its death — beautiful, and deadly.' },
  { id: 'veyra',    face: '🌊', name: 'Veyra',         desc: 'An ocean world of coral cities, home of the gentle Solari.' }
];

export const BADGES = [
  { id: 'jump3',     icon: '🌀', name: 'River Rider',       test: (s) => s.jumps >= 3 },
  { id: 'beacons3',  icon: '🛡️', name: 'Shield Bearer',     test: (s) => s.beacons >= 3 },
  { id: 'journal10', icon: '📔', name: 'Star Scholar',      test: (s) => (s.factsLearned.length + s.journal.length) >= 10 },
  { id: 'pinwheel',  icon: '⚡', name: 'Star Tamer',        test: (s) => s.clues.includes('ks5') },
  { id: 'finish',    icon: '🌟', name: 'Star Rescuer',      test: (s) => s.chapter >= 6 },
  { id: 'hero2',     icon: '🏅', name: 'Hero of the Heart', test: (s) => !!s.game1Hero }
];
