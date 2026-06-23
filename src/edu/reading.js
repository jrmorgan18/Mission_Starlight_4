// Reading comprehension passages for Mission: Starlight 3 — Solari greetings,
// sky-watch logs, evacuation notices, and a postcard home. Written at roughly a
// 2nd-3rd grade level.

function rq(concept, prompt, options, answer, explain) {
  return { kind: 'reading', skill: 'reading', concept, prompt, options, answer, explain };
}

export const READING_BANK = [
  {
    id: 'veyra-welcome', chapter: 'veyra', title: 'A Welcome from Veyra',
    text: 'Welcome, sky-traveler, to Veyra! We are the Solari, and our world is one big shining ocean dotted with coral cities. We have two lights in our sky. One is our own small sun, warm and kind. The other is the Pinwheel — a giant star that spins and glitters far away. For a long time the Pinwheel kept us company. But lately it spins faster and faster, and our elders are afraid. Please, will you help us read its secrets?',
    questions: [
      rq('veyra-welcome-q1', 'What are the Solari\'s cities made of?', ['Coral', 'Ice', 'Glass towers'], 'Coral', 'The welcome says Veyra is "one big shining ocean dotted with coral cities."'),
      rq('veyra-welcome-q2', 'How many lights are in Veyra\'s sky?', ['Two', 'One', 'Seven'], 'Two', 'They have "two lights": their own small sun, and the giant Pinwheel star.'),
      rq('veyra-welcome-q3', 'Why are the elders afraid?', ['The Pinwheel spins faster and faster', 'The ocean is freezing', 'They lost their boats'], 'The Pinwheel spins faster and faster', 'The passage says: "lately it spins faster and faster, and our elders are afraid."')
    ]
  },
  {
    id: 'skywatch-log', chapter: 'observatory', title: "Astra's Sky-Watch Log",
    text: 'Sky-watch log. I am Astra, keeper of the tower. Tonight I turned the great telescope on the Pinwheel again. It is a Wolf-Rayet star — the biggest, hottest kind, almost out of fuel. It is shedding two glowing arms of dust as it spins, like a pinwheel toy. Here is what worries me: a spinning star this big can die in a gamma-ray burst, a beam of deadly light. A beam only burns what it points at. So my most important question is not WHEN it will fire. It is WHERE it will point.',
    questions: [
      rq('skywatch-q1', 'What kind of star is the Pinwheel?', ['A Wolf-Rayet star, almost out of fuel', 'A baby star just forming', 'A small cool star'], 'A Wolf-Rayet star, almost out of fuel', 'Astra says: "It is a Wolf-Rayet star — the biggest, hottest kind, almost out of fuel."'),
      rq('skywatch-q2', 'What can a spinning star this big do when it dies?', ['Fire a gamma-ray burst — a beam of deadly light', 'Turn into a planet', 'Go quietly dark'], 'Fire a gamma-ray burst — a beam of deadly light', 'The log warns it "can die in a gamma-ray burst, a beam of deadly light."'),
      rq('skywatch-q3', 'What is Astra\'s MOST important question?', ['WHERE the beam will point', 'What color the star is', 'How to name the star'], 'WHERE the beam will point', 'Astra says her most important question is "not WHEN it will fire. It is WHERE it will point." A beam only burns what it aims at!')
    ]
  },
  {
    id: 'pinwheel-readout', chapter: 'pinwheel', title: 'The Deflector Readout',
    text: 'DEFLECTOR FIELD MANUAL. When a star throws a flare, do not run — there is no time. Instead, charge the deflector shield. The shield bends and splits the deadly light so it slides around your ship like a stream around a rock. Hold the charge until the flash passes. Remember: the Pinwheel\'s spin means the worst is still coming. This flare is only a warning shot. Use it to practice, then save the real shield for the day the star dies.',
    questions: [
      rq('pinwheel-readout-q1', 'When a star throws a flare, what should you do?', ['Charge the deflector shield', 'Run away', 'Take a photo'], 'Charge the deflector shield', 'The manual says: "do not run — there is no time. Instead, charge the deflector shield."'),
      rq('pinwheel-readout-q2', 'What does the shield do to the deadly light?', ['Bends and splits it around the ship', 'Soaks it up like a sponge', 'Turns it into music'], 'Bends and splits it around the ship', 'The shield "bends and splits the deadly light so it slides around your ship like a stream around a rock."'),
      rq('pinwheel-readout-q3', 'What is this flare, really?', ['Only a warning shot', 'The end of the star', 'A friendly hello'], 'Only a warning shot', 'The manual says: "This flare is only a warning shot... save the real shield for the day the star dies."')
    ]
  },
  {
    id: 'evac-notice', chapter: 'spaceport', title: 'Evacuation Notice',
    text: 'ALL SOLARI: please read. By order of Captain Vega, every family must board an ark-ship before the Pinwheel dies. Bring only what you can carry. Each ark holds many families in cozy pods. Babies and elders board first, then everyone else, pod by pod, in calm and careful lines. Do not be afraid. We are not losing our home for nothing — we are carrying it with us, in every story and song. A new world is waiting.',
    questions: [
      rq('evac-q1', 'Who must board an ark-ship?', ['Every family', 'Only the captains', 'Only the children'], 'Every family', 'The notice says "every family must board an ark-ship before the Pinwheel dies."'),
      rq('evac-q2', 'Who boards the arks FIRST?', ['Babies and elders', 'The strongest workers', 'The captains'], 'Babies and elders', 'The notice says: "Babies and elders board first, then everyone else."'),
      rq('evac-q3', 'What are the Solari carrying with them?', ['Their home — in every story and song', 'Nothing at all', 'The whole ocean'], 'Their home — in every story and song', 'Vega writes: "we are carrying it with us, in every story and song."')
    ]
  },
  {
    id: 'harbor-postcard', chapter: 'harbor', title: 'A Postcard from Safe Harbor',
    text: 'Dear Cadet, we made it. The whole fleet is safe at the harbor, and the Solari are already singing again. Captain Vega has set course for a small red world to begin a new life there. One more thing, and Bolt says it is important: that deadly beam did not stop at the Pinwheel. It flies on across the galaxy, on and on, toward a tiny blue world very far away. It will not arrive for a long, long time. But someday, somebody will need to send that little blue world a warning. We wrote down where it points. For later. — Luma',
    questions: [
      rq('harbor-q1', 'Where has Captain Vega set course?', ['A small red world', 'Back to the Pinwheel', 'The center of the galaxy'], 'A small red world', 'The postcard says Vega "has set course for a small red world to begin a new life there." (That sounds like Mars!)'),
      rq('harbor-q2', 'What did the deadly beam do after the Pinwheel?', ['It flies on toward a tiny blue world far away', 'It stopped and faded', 'It turned around'], 'It flies on toward a tiny blue world far away', 'Bolt notes the beam "flies on across the galaxy... toward a tiny blue world very far away."'),
      rq('harbor-q3', 'Will the beam reach the blue world soon?', ['No — not for a long, long time', 'Yes, tomorrow', 'It already did'], 'No — not for a long, long time', 'The postcard says: "It will not arrive for a long, long time." Light is fast, but space is huge!')
    ]
  }
];
