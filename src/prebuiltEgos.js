// Prebuilt E.G.O definitions by rating
// Minimal, consistent structure for quick assignment to character.ego.slots

export const RATINGS = ['ZAYIN', 'TETH', 'HE', 'WAW', 'ALEPH'];

export const prebuiltEgos = [
  {
    id: 'zayin_blade_of_dawn',
    name: 'Blade of Dawn',
    rating: 'ZAYIN',
    emotionCost: 6,
    baseName: 'Single Strike',
    description: 'A nascent glimmer of Light forged into a blade.',
    dice: [
      { tag: '[Slash]', notation: '1d8+3', type: 'offensive', effects: ['[Hit] Inflict 2 Burn'] }
    ],
    passive: { name: 'Faint Resolve', description: 'At battle start, gain +1 Power on the first clash.' }
  },
  {
    id: 'zayin_shield_of_glow',
    name: 'Shield of Glow',
    rating: 'ZAYIN',
    emotionCost: 6,
    baseName: 'Panic Defense',
    description: 'A timid barrier reflecting the first stirrings of courage.',
    dice: [
      { tag: '[Block]', notation: '1d6+1', type: 'defensive', effects: ['[On Use] Gain 1 Guard'] }
    ],
    passive: { name: 'Gentle Guard', description: 'When you Block, recover 1 HP.' }
  },
  {
    id: 'teth_starlit_edge',
    name: 'Starlit Edge',
    rating: 'TETH',
    emotionCost: 6,
    baseName: 'Strong Strike',
    description: 'Light condenses into a keen edge that seeks resolve.',
    dice: [
      { tag: '[Slash]', notation: '1d10+5', type: 'offensive', effects: ['[Hit] Inflict 1 Fragile'] }
    ],
    passive: { name: 'Steady Purpose', description: 'On win, next offensive die gains +1 Power.' }
  },
  {
    id: 'he_murmur_of_flame',
    name: 'Murmur of Flame',
    rating: 'HE',
    emotionCost: 6,
    baseName: 'Double Attack',
    description: 'A quiet whisper that smolders into action.',
    dice: [
      { tag: '[Slash]', notation: '1d8', type: 'offensive', effects: ['[Hit] Inflict 2 Burn'] },
      { tag: '[Pierce]', notation: '1d8', type: 'offensive', effects: [] }
    ],
    passive: { name: 'Kindling', description: 'When applying Burn, apply +1 additional Burn.' }
  },
  {
    id: 'waw_crushing_meteor',
    name: 'Crushing Meteor',
    rating: 'WAW',
    emotionCost: 6,
    baseName: 'Overwhelming Blow',
    description: 'The will descends like a star, inexorable and heavy.',
    dice: [
      { tag: '[Blunt]', notation: '1d12+6', type: 'offensive', effects: ['[On Use] If target is staggered, +2 Power'] }
    ],
    passive: { name: 'Gravitic Pull', description: 'Enemies with Stagger < 50% suffer -1 Power vs you.' }
  },
  {
    id: 'aleph_wings_of_determination',
    name: 'Wings of Determination',
    rating: 'ALEPH',
    emotionCost: 6,
    baseName: 'Full Assault',
    description: 'Light blossoms fully; wings spread to eclipse doubt.',
    dice: [
      { tag: '[Slash]', notation: '1d8', type: 'offensive', effects: [] },
      { tag: '[Slash]', notation: '1d8', type: 'offensive', effects: ['[Hit] +2 Power on next die'] },
      { tag: '[Slash]', notation: '1d6', type: 'offensive', effects: [] }
    ],
    passive: { name: 'Ascendant', description: 'At 3+ dice E.G.O, each die gains +1 Power.' }
  }
];

export function getEgosByRating(rating) {
  return prebuiltEgos.filter(e => e.rating === rating);
}
