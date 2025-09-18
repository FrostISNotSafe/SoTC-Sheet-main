/**
 * Stars of the City - Skill Modules System
 * Manages all available skill modules that can be added to skill bases
 */

// Tags reference for module effects used across the system
export const moduleTagsReference = [
  { tag: '[Clash Win]', description: 'Triggers effects when this die wins a clash. For Evade Dice, don’t trigger against offensive Dice.' },
  { tag: '[Clash Lose]', description: 'Triggers effects when this die loses a clash.' },
  { tag: '[Hit]', description: 'Applies when an offensive Die damages an enemy. Ignore for non-offensive Dice.' },
  { tag: '[Crit]', description: 'Applies when an offensive Die damages an enemy and rolls its maximum value. Ignore for non-offensive Dice.' },
  { tag: '[On Use]', description: 'Applies immediately when the skill is chosen, before any Dice.' },
  { tag: '[After Use]', description: 'Applies after all Dice have been used (regardless of any defensive dice remaining).' },
  { tag: '[Check]', description: 'A condition to increase Die Power or similar effects when the die is rolled.' },
  { tag: '[On Kill]', description: 'Applies when a skill reduces an enemy to 0 HP. Triggers even if the target dies to effects like Bleed, as long as the skill is ongoing.' },
  { tag: '[On Kill or Stagger]', description: 'Applies when a skill reduces an enemy to 0 HP or 0 Stagger. Considered both an [On Kill] and [On Stagger] tag.' },
  { tag: '[On Evade]', description: 'Triggers when an Evade Die wins or ties a Clash with an Offensive Die.' },
  { tag: '[On Stagger]', description: 'Applies when a skill reduces an enemy to 0 Stagger Resist. Triggers even if the target is staggered by effects like Tremor Burst, as long as the skill is ongoing.' },
  { tag: '[Limit X Uses]', description: 'This skill can be used X times before it needs to be recharged. Limit persists through multiple combats and recharges at mission end or on certain Rests. A [Limit] skill is “Exhausted” at 0 uses remaining, with at least 1 max use.' },
  { tag: '[Exhaust]', description: 'Triggers when the final use of a [Limit] skill is spent (at the same time as [On Use]). Spending from other skills is a “natural activation”; any source that doesn’t spend the final use is an “unnatural activation”.' }
];

export class SkillModulesManager {
  constructor() {
    this.skillModules = this.initializeSkillModules();
    // Sanitize effect strings to remove repetitive framing like 'One Die gains "[Tag] ..."'
    this.sanitizeModuleEffects();
  }

  // Remove framing text from module.effect to keep effects succinct for display and processing
  sanitizeModuleEffects() {
    const sanitize = (s) => {
      if (!s || typeof s !== 'string') return s;
      // common prefixes to remove (case-insensitive)
      s = s.replace(/^\s*(One\s+non-evade\s+Die\s+gains:?)\s*"?/i, '');
      s = s.replace(/^\s*(One\s+non-evade\s+Die\s+gains\s)\s*"?/i, '');
      s = s.replace(/^\s*(One\s+Evade\s+Die\s+gains:?)\s*"?/i, '');
      s = s.replace(/^\s*(One\s+Evade\s+Die\s+gains\s)\s*"?/i, '');
      s = s.replace(/^\s*(One\s+Die\s+gains:?)\s*"?/i, '');
      s = s.replace(/^\s*(One\s+die\s+gains:?)\s*"?/i, '');
      s = s.replace(/^\s*(One\s+Die\s+gains\s)\s*"?/i, '');
      s = s.replace(/^\s*(One\s+die\s+gains\s)\s*"?/i, '');
      s = s.replace(/^\s*(This\s+skill\s+gains:?\s*)"?/i, '');
      s = s.replace(/^\s*(Choose\s+one:\s*)One\s+Die\s+gains:?\s*"?/i, 'Choose one: ');
      // remove stray double quotes
      s = s.replace(/"/g, '');
      // trim trailing spaces and periods left from removal
      return s.trim();
    };

    ['rank1', 'rank2', 'rank3', 'special'].forEach(rankKey => {
      const arr = this.skillModules[rankKey] || [];
      arr.forEach(mod => {
        if (mod && mod.effect) mod.effect = sanitize(mod.effect);
        if (mod && mod.options && Array.isArray(mod.options)) {
          mod.options.forEach(opt => { if (opt && opt.description) opt.description = sanitize(opt.description); });
        }
      });
    });
  }

  // Initialize all skill modules based on SOTC system
  initializeSkillModules() {
    return {
      // Rank 1 Modules
      rank1: [
        {
          id: 'stronger',
          name: 'Stronger',
          rank: 1,
          target: 'die',
          effect: 'One Die gains +1 Power',
          tag: null,
          repeating: true,
          description: 'Increases the power of a single die by 1',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'potential',
          name: 'Potential',
          rank: 1,
          target: 'die',
          effect: 'One Die has its size increased by 1 stage (max of d12).',
          tag: null,
          repeating: true,
          description: 'Increase a die size by one step up to d12',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'comeback',
          name: 'Comeback',
          rank: 1,
          target: 'skill',
          effect: 'Choose one: (A) One Die besides the final gains "Clash Lose Boost the power of the final Die by 2"; or (B) All Dice besides the final gain "Clash Lose Boost the power of the final Die by 1".',
          tag: '[Clash Lose]',
          repeating: false,
          description: 'Adds Clash Lose boosts to non-final dice to empower the final die',
          requiresOption: true,
          options: [
            { id: 'comeback_single', description: 'One non-final die gains [Clash Lose] Boost the power of the final die by 2.', selection: { type: 'die', count: 1, excludeFinal: true } },
            { id: 'comeback_all', description: 'All non-final dice gain [Clash Lose] Boost the power of the final die by 1.', selection: { type: 'dice_group', group: 'non_final', applyToAll: true } }
          ]
        },
        {
          id: 'forceful',
          name: 'Forceful',
          rank: 1,
          target: 'die',
          effect: 'Target loses 2 Stagger Resist". If the Skill’s cost is 3 or higher, apply this to 2 Dice instead.',
          tag: '[Clash Win]',
          repeating: false,
          description: 'On clash win, reduce enemy Stagger Resist; scales with high-cost skills',
          selection: { type: 'die', count: 1, conditionalCounts: [{ condition: 'skill.cost>=3', count: 2 }] }
        },
        {
          id: 'finisher_light',
          name: 'Finisher',
          rank: 1,
          target: 'skill',
          effect: 'This skill gains "[On Kill] Regain 1 Light." If the Cost is 3 or higher, this regains 2 Light instead.',
          tag: '[On Kill]',
          repeating: false,
          description: 'Regain Light on kill; more Light if the skill cost is 3+'
        },
        {
          id: 'preventative_measures',
          name: 'Preventative Measures',
          rank: 1,
          target: 'skill',
          effect: 'This skill gains: "[On Use] gain {Cost} Safeguard". If Cost is 0, this grants 1 instead.',
          tag: '[On Use]',
          repeating: false,
          description: 'Gain Safeguard on use equal to Cost (minimum 1)'
        },
        {
          id: 'poised',
          name: 'Poised',
          rank: 1,
          target: 'skill',
          effect: 'This skill gains "[On Use] gain {Cost} Poise". If Cost is 0, this grants 1 instead.',
          tag: '[On Use]',
          repeating: false,
          description: 'Gain Poise on use equal to Cost (minimum 1)'
        },
        {
          id: 'lethal_precision',
          name: 'Lethal Precision',
          rank: 1,
          target: 'skill',
          effect: 'This skill gains: "[On Kill] Gain 6 Poise"',
          tag: '[On Kill]',
          repeating: false,
          description: 'Gain Poise on kill'
        },
        {
          id: 'kinetic_absorption',
          name: 'Kinetic Absorption',
          rank: 1,
          target: 'die',
          effect: 'gain 1 Charge". If that die is a Block Die, this grants 2 Charge instead. (Requires skill Cost ≥ 2)',
          tag: '[Clash Win]',
          repeating: false,
          description: 'Gain Charge on clash win; more if the die is Block. Only for skills with Cost 2+.',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'counterplay',
          name: 'Counterplay',
          rank: 1,
          target: 'die',
          effect: 'One Die gains "[Check] When clashing against a {chosen type} Die, gain {Cost+1} power."',
          tag: '[Check]',
          repeating: true,
          description: 'Choose a type (Blunt/Pierce/Slash/Block/Evade); gain extra power when clashing that type',
          requiresOption: true,
          options: [
            { id: 'counterplay_slash', description: 'Against Slash dice', selection: { type: 'die', count: 1 } },
            { id: 'counterplay_pierce', description: 'Against Pierce dice', selection: { type: 'die', count: 1 } },
            { id: 'counterplay_blunt', description: 'Against Blunt dice', selection: { type: 'die', count: 1 } },
            { id: 'counterplay_block', description: 'Against Block dice', selection: { type: 'die', count: 1 } },
            { id: 'counterplay_evade', description: 'Against Evade dice', selection: { type: 'die', count: 1 } }
          ]
        },
        {
          id: 'flame_step',
          name: 'Flame Step',
          rank: 1,
          target: 'die',
          effect: 'One Evade Die gains: "[On Evade] Inflict 1 Burn on the attacker."',
          tag: '[On Evade]',
          repeating: true,
          description: 'Evade die inflicts Burn on attacker',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'futility',
          name: 'Futility',
          rank: 1,
          target: 'die',
          effect: 'One Evade Die gains: "[On Evade] Inflict 1 Sinking on the attacker."',
          tag: '[On Evade]',
          repeating: true,
          description: 'Evade die inflicts Sinking on attacker',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'biofuel',
          name: 'Biofuel',
          rank: 1,
          target: 'skill',
          effect: 'This skill gains: "[On Kill] Gain 5 Charge"',
          tag: '[On Kill]',
          repeating: false,
          description: 'Gain Charge on kill'
        },
        {
          id: 'shields_up',
          name: 'Shields Up',
          rank: 1,
          target: 'skill',
          effect: 'This skill gains: "[On Use] Gain {Cost} Protection". If Cost is 0, this grants 1 instead.',
          tag: '[On Use]',
          repeating: false,
          description: 'Gain Protection on use equal to Cost (minimum 1)'
        },
        {
          id: 'aggravate',
          name: 'Aggravate',
          rank: 1,
          target: 'skill',
          effect: 'This skill gains "[After Use] Gain {Cost+1} Aggro".',
          tag: '[After Use]',
          repeating: false,
          description: 'Generates Aggro after using the skill based on its cost'
        },
        {
          id: 'cut_through',
          name: 'Cut Through',
          rank: 1,
          target: 'die',
          effect: 'One Die gains "[Hit] Remove 1 Protection, 1 Thorns, and 1 Aggro from the target."',
          tag: '[Hit]',
          repeating: true,
          description: 'On hit, strips defensive stacks and aggro from the target',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'protective',
          name: 'Protective',
          rank: 1,
          target: 'skill',
          effect: 'This skill gains: "[On Use] Grant 1 Protection to {Cost} allies." (Can include self) If Cost is 0, this grants to 1 ally instead.',
          tag: '[On Use]',
          repeating: false,
          description: 'Grants Protection to allies on use based on skill cost'
        },
        {
          id: 'fast_on_use',
          name: 'Fast (On Use)',
          rank: 1,
          target: 'skill',
          effect: 'This Skill gains: "[On Use] Gain 1 Haste." If the Cost of this skill is 3 or higher, this gives 2 instead.',
          tag: '[On Use]',
          repeating: false,
          description: 'Gain Haste on use; gives 2 if cost is 3+'
        },
        {
          id: 'fast_after_use',
          name: 'Fast (After Use)',
          rank: 1,
          target: 'skill',
          effect: 'This Skill gains: "[After Use] Gain 1 Haste." If the Cost of this skill is 3 or higher, this gives 2 instead.',
          tag: '[After Use]',
          repeating: false,
          description: 'Gain Haste after using the skill; gives 2 if cost is 3+'
        },
        {
          id: 'burning_die_hit',
          name: 'Burning (Die, Hit)',
          rank: 1,
          target: 'die',
          effect: 'One Die gains "[Hit] Inflict {Cost+1} Burn".',
          tag: '[Hit]',
          repeating: true,
          description: 'On hit, inflicts Burn increased by skill cost',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'burning_die_clashwin',
          name: 'Burning (Die, Clash Win)',
          rank: 1,
          target: 'die',
          effect: 'Inflict {Cost+1} Burn".',
          tag: '[Clash Win]',
          repeating: true,
          description: 'On clash win, inflicts Burn increased by skill cost',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'burning_all_hit',
          name: 'Burning (All, Hit)',
          rank: 1,
          target: 'skill',
          effect: 'All Dice gain "[Hit] Inflict 1 Burn".',
          tag: '[Hit]',
          repeating: true,
          description: 'All dice inflict 1 Burn on hit'
        },
        {
          id: 'burning_all_clashwin',
          name: 'Burning (All, Clash Win)',
          rank: 1,
          target: 'skill',
          effect: 'All Dice gain "[Clash Win] Inflict 1 Burn".',
          tag: '[Clash Win]',
          repeating: true,
          description: 'All dice inflict 1 Burn on clash win'
        },
        {
          id: 'tremoring_die_hit',
          name: 'Tremoring (Die, Hit)',
          rank: 1,
          target: 'die',
          effect: 'One Die gains "[Hit] Inflict {Cost} Tremor".',
          tag: '[Hit]',
          repeating: true,
          description: 'On hit, inflicts Tremor equal to skill cost',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'tremoring_die_clashwin',
          name: 'Tremoring (Die, Clash Win)',
          rank: 1,
          target: 'die',
          effect: 'Inflict {Cost} Tremor".',
          tag: '[Clash Win]',
          repeating: true,
          description: 'On clash win, inflicts Tremor equal to skill cost',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'tremoring_all_hit',
          name: 'Tremoring (All, Hit)',
          rank: 1,
          target: 'skill',
          effect: 'All Dice gain "[Hit] Inflict 1 Tremor".',
          tag: '[Hit]',
          repeating: true,
          description: 'All dice inflict 1 Tremor on hit'
        },
        {
          id: 'tremoring_all_clashwin',
          name: 'Tremoring (All, Clash Win)',
          rank: 1,
          target: 'skill',
          effect: 'All Dice gain "[Clash Win] Inflict 1 Tremor".',
          tag: '[Clash Win]',
          repeating: true,
          description: 'All dice inflict 1 Tremor on clash win'
        },
        {
          id: 'bleeding_die_hit',
          name: 'Bleeding (Die, Hit)',
          rank: 1,
          target: 'die',
          effect: 'One Die gains "[Hit] Inflict {Cost} Bleed".',
          tag: '[Hit]',
          repeating: true,
          description: 'On hit, inflicts Bleed equal to skill cost',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'bleeding_die_clashwin',
          name: 'Bleeding (Die, Clash Win)',
          rank: 1,
          target: 'die',
          effect: 'Inflict {Cost} Bleed".',
          tag: '[Clash Win]',
          repeating: true,
          description: 'On clash win, inflicts Bleed equal to skill cost',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'bleeding_all_hit',
          name: 'Bleeding (All, Hit)',
          rank: 1,
          target: 'skill',
          effect: 'All Dice gain "[Hit] Inflict 1 Bleed".',
          tag: '[Hit]',
          repeating: true,
          description: 'All dice inflict 1 Bleed on hit'
        },
        {
          id: 'bleeding_all_clashwin',
          name: 'Bleeding (All, Clash Win)',
          rank: 1,
          target: 'skill',
          effect: 'All Dice gain "[Clash Win] Inflict 1 Bleed".',
          tag: '[Clash Win]',
          repeating: true,
          description: 'All dice inflict 1 Bleed on clash win'
        },
        {
          id: 'sinking_die_hit',
          name: 'Sinking (Die, Hit)',
          rank: 1,
          target: 'die',
          effect: 'One Die gains "[Hit] Inflict {Cost+1} Sinking".',
          tag: '[Hit]',
          repeating: true,
          description: 'On hit, inflicts Sinking increased by skill cost',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'sinking_die_clashwin',
          name: 'Sinking (Die, Clash Win)',
          rank: 1,
          target: 'die',
          effect: 'Inflict {Cost+1} Sinking".',
          tag: '[Clash Win]',
          repeating: true,
          description: 'On clash win, inflicts Sinking increased by skill cost',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'sinking_all_hit',
          name: 'Sinking (All, Hit)',
          rank: 1,
          target: 'skill',
          effect: 'All Dice gain "[Hit] Inflict 1 Sinking".',
          tag: '[Hit]',
          repeating: true,
          description: 'All dice inflict 1 Sinking on hit'
        },
        {
          id: 'sinking_all_clashwin',
          name: 'Sinking (All, Clash Win)',
          rank: 1,
          target: 'skill',
          effect: 'All Dice gain "[Clash Win] Inflict 1 Sinking".',
          tag: '[Clash Win]',
          repeating: true,
          description: 'All dice inflict 1 Sinking on clash win'
        },
        {
          id: 'thorny',
          name: 'Thorny',
          rank: 1,
          target: 'die',
          effect: '{Cost} Dice gain "[Clash Lose] Gain 1 Thorns." If Cost is 0, apply to 1 Die instead. If Cost exceeds the number of dice, excess may stack on a single die (not enforced by UI).',
          tag: '[Clash Lose]',
          repeating: false,
          description: 'Grant Thorns on clash lose to a number of dice equal to Cost',
          selection: { type: 'die', count: 1, countFromCost: true }
        },
        {
          id: 'endless_battle',
          name: 'Endless Battle',
          rank: 1,
          target: 'skill',
          effect: 'If any dice on this skill clash, give all Defensive, non-counter dice on this skill +1 Power, but lose 5 HP.',
          tag: null,
          repeating: false,
          description: 'Trade HP for defensive power when clashing'
        },
        {
          id: 'bonus_doubler',
          name: 'Bonus Doubler',
          rank: 1,
          target: 'skill',
          effect: 'If this skill has only a single non-counter Offensive die, it gains: "Double the bonus from Strength".',
          tag: null,
          repeating: false,
          description: 'Doubles Strength bonus for single-die offensive skills'
        },
        {
          id: 'blazing_die_hit',
          name: 'Blazing (Die, Hit)',
          rank: 1,
          target: 'die',
          effect: 'One Die gains "[Hit] Trigger Blaze on target".',
          tag: '[Hit]',
          repeating: true,
          description: 'On hit, trigger Blaze on target',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'blazing_die_clashwin',
          name: 'Blazing (Die, Clash Win)',
          rank: 1,
          target: 'die',
          effect: 'Trigger Blaze on target".',
          tag: '[Clash Win]',
          repeating: true,
          description: 'On clash win, trigger Blaze on target',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'frightening',
          name: 'Frightening',
          rank: 1,
          target: 'skill',
          effect: 'If the user of an opposing skill has 6+ Sinking, reduce the power of all Dice on the opposing skill by 1 (requires Cost ≥ 2).',
          tag: null,
          repeating: false,
          description: 'Debuff opposing skill if they have high Sinking; requires cost 2+'
        },
        {
          id: 'heroic',
          name: 'Heroic',
          rank: 1,
          target: 'die',
          effect: 'One Block Die gains "[Check] Power +2 if this skill intercepted the opposing attack."',
          tag: '[Check]',
          repeating: false,
          description: 'Block die gains conditional power when intercepting',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'open_wounds',
          name: 'Open Wounds',
          rank: 1,
          target: 'die',
          effect: 'One Die gains "[Hit] Deal additional damage = Bleed on target".',
          tag: '[Hit]',
          repeating: false,
          description: 'Deals extra damage equal to target Bleed',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'cover_me',
          name: 'Cover Me',
          rank: 1,
          target: 'skill',
          effect: 'This skill gains "[On Use] Give an ally {Cost} Aggro". If Cost is 0, this grants 1 instead.',
          tag: '[On Use]',
          repeating: false,
          description: 'Redirect attention to an ally based on Cost'
        },
        {
          id: 'quick_step',
          name: 'Quick Step',
          rank: 1,
          target: 'die',
          effect: 'One Evade Die gains: "[On Evade] Gain 1 Haste (max 2 per scene)".',
          tag: '[On Evade]',
          repeating: true,
          description: 'Evade die gains Haste on evade (capped)',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'charging',
          name: 'Charging',
          rank: 1,
          target: 'skill',
          effect: 'Choose one: [On Use] gain {Cost} Charge OR [After Use] gain {Cost} Charge. If Cost is 0, this grants 1 instead.',
          tag: null,
          repeating: false,
          description: 'Gain Charge on use or after use based on choice',
          requiresOption: true,
          options: [
            { id: 'charging_on_use', description: 'This skill gains "[On Use] gain {Cost} Charge"', selection: { type: 'skill' } },
            { id: 'charging_after_use', description: 'This skill gains "[After Use] gain {Cost} Charge"', selection: { type: 'skill' } }
          ]
        },
        {
          id: 'recharge',
          name: 'Recharge',
          rank: 1,
          target: 'skill',
          effect: 'This skill gains "[After Use] You may spend 5 Charge to regain 1 Light."',
          tag: '[After Use]',
          repeating: false,
          description: 'Spend Charge after use to regain Light'
        },
        {
          id: 'unstable_burst_hit',
          name: 'Unstable Burst (Hit)',
          rank: 1,
          target: 'die',
          effect: 'One Die gains "[Hit] Trigger Tremor Burst, then reduce target’s Tremor by 4".',
          tag: '[Hit]',
          repeating: true,
          description: 'On hit, trigger Tremor Burst and reduce Tremor',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'unstable_burst_clashwin',
          name: 'Unstable Burst (Clash Win, non-Evade)',
          rank: 1,
          target: 'die',
          effect: 'One non-evade Die gains "[Clash Win] Trigger Tremor Burst, then reduce target’s Tremor by 4".',
          tag: '[Clash Win]',
          repeating: true,
          description: 'On clash win, trigger Tremor Burst and reduce Tremor; cannot target Evade dice',
          selection: { type: 'die', count: 1, excludeTypes: ['evade'] }
        },
        {
          id: 'critical_fragility',
          name: 'Critical Fragility',
          rank: 1,
          target: 'die',
          effect: 'One Die gains "[Crit] Inflict 1 Fragile". If the die’s size is 1d10 or higher, inflict 2 instead. This cannot be added to a Die that can already inflict Fragile in any way.',
          tag: '[Crit]',
          repeating: true,
          description: 'On critical, inflicts Fragile (2 if d10+); cannot be added to dice that already inflict Fragile',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'critical_bind',
          name: 'Critical Bind',
          rank: 1,
          target: 'die',
          effect: 'One Die gains "[Crit] Inflict 1 Bind". If the die’s size is 1d10 or higher, inflict 2 instead. This cannot be added to a Die that can already inflict Bind in any way.',
          tag: '[Crit]',
          repeating: true,
          description: 'On critical, inflicts Bind (2 if d10+); cannot be added to dice that already inflict Bind',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'backup_power',
          name: 'Backup Power',
          rank: 1,
          target: 'skill',
          effect: 'This skill gains: "[Exhaust] Trigger all \"Spend Charge\" effects on this skill without actually spending charge"',
          tag: '[Exhaust]',
          repeating: false,
          description: 'On Exhaust, triggers all Spend Charge effects without spending'
        },
        {
          id: 'desperation',
          name: 'Desperation',
          rank: 1,
          target: 'die',
          effect: 'One die gains "[Check] gain Power = your Exhausted Skills."',
          tag: '[Check]',
          repeating: true,
          description: 'Die gains power equal to your exhausted skills',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'limited_strength',
          name: 'Limited Strength',
          rank: 1,
          target: 'die',
          effect: 'Can only be applied to skills with a [Limit]. Choose one: One die gains +2 Power; or 2 Dice gain +1 Power.',
          tag: null,
          repeating: false,
          description: 'Buff one die (+2) or two dice (+1) but only on Limited skills',
          requiresOption: true,
          options: [
            { id: 'limited_strength_single', description: 'One die gains +2 Power', selection: { type: 'die', count: 1 } },
            { id: 'limited_strength_double', description: 'Two dice gain +1 Power', selection: { type: 'die', count: 2 } }
          ]
        },
        {
          id: 'sudden_growth',
          name: 'Sudden Growth',
          rank: 1,
          target: 'skill',
          effect: 'This skill gains: "[Exhaust] Gain 3 Thorns and 1 Protection"',
          tag: '[Exhaust]',
          repeating: false,
          description: 'On Exhaust, gain Thorns and Protection'
        },
        {
          id: 'quaking_fear',
          name: 'Quaking Fear',
          rank: 1,
          target: 'skill',
          effect: 'This skill gains: "[On Kill] Inflict 5 Tremor on all remaining enemies"',
          tag: '[On Kill]',
          repeating: false,
          description: 'On kill, inflict Tremor to all remaining enemies'
        },
        {
          id: 'recursive_crit',
          name: 'Recursive Crit',
          rank: 1,
          target: 'die',
          effect: 'One die gains "[Crit] Gain 1 Poise"',
          tag: '[Crit]',
          repeating: true,
          description: 'On crit, gain Poise',
          selection: { type: 'die', count: 1 }
        }
      ],
      
      // Rank 2 Modules
      rank2: [
        {
          id: 'revitalizer',
          name: 'Revitalizer',
          rank: 2,
          target: 'skill',
          effect: 'This skill gains "[Limit: 5 Uses]" and "[After Use] Regain 1 Light"',
          tag: null,
          tags: ['[Limit]', '[After Use]'],
          repeating: false,
          description: 'Adds a 5-use limit and restores 1 Light after use'
        },
        {
          id: 'shattering',
          name: 'Shattering',
          rank: 2,
          target: 'die',
          effect: 'One Die gains "[Hit] Inflict 1 Fragile"',
          tag: '[Hit]',
          repeating: true,
          description: 'If cost is 3 or higher, you may apply this to 2 dice instead. If the skill has a single offensive die, inflict 2 Fragile instead.',
          selection: { type: 'die', count: 1, conditionalCounts: [{ condition: 'skill.cost>=3', count: 2 }] }
        },
        {
          id: 'burn_exploit',
          name: 'Burn Exploit',
          rank: 2,
          target: 'die',
          effect: 'One Die gains: "[Check] Power + {Cost+1} If target has 6+ Burn"',
          tag: '[Check]',
          repeating: true,
          description: 'Conditional power boost against targets with high Burn',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'tremor_exploit',
          name: 'Tremor Exploit',
          rank: 2,
          target: 'die',
          effect: 'One Die gains: "[Check] Power + {Cost+1} If target has 8+ Tremor"',
          tag: '[Check]',
          repeating: true,
          description: 'Conditional power boost against targets with high Tremor',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'emotionally_charged',
          name: 'Emotionally Charged',
          rank: 2,
          target: 'skill',
          effect: 'This skill gains: "[On Use] Gain 1 Emotion Point." If the Skill’s cost is 3 or higher, gain 2 instead.',
          tag: '[On Use]',
          repeating: false,
          description: 'Gain 1 Emotion Point on use (2 if cost is 3 or higher)'
        },
        {
          id: 'reliable',
          name: 'Reliable',
          rank: 2,
          target: 'die',
          effect: 'One Die of size d6 or higher has its die size reduced by 1 step and gains +2 Power. Also gains "[Check] If this die rolled minimum value, you may re-roll it once"',
          tag: null,
          repeating: true,
          description: 'Shrink the die one size for +2 Power; also allows a single re-roll on minimum result',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'health_hauler',
          name: 'Health Hauler',
          rank: 2,
          target: 'die',
          effect: 'One Die gains: "[Clash Win] Regain {Cost+1} HP."',
          tag: '[Clash Win]',
          repeating: true,
          description: 'Regain HP on clash win based on skill cost',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'stamina_hauler',
          name: 'Stamina Hauler',
          rank: 2,
          target: 'die',
          effect: 'One Die gains: "[Clash Win] Regain {Cost+2} Stagger Resistance."',
          tag: '[Clash Win]',
          repeating: true,
          description: 'Regain Stagger Resistance on clash win based on skill cost',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'resonant',
          name: 'Resonant',
          rank: 2,
          target: 'die',
          effect: 'One Die gains "[Check] Gain Power = The highest total number of E.G.O passives active on one combatant."',
          tag: '[Check]',
          repeating: true,
          description: 'Gain power equal to the highest total E.G.O passives on any combatant',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'struggle',
          name: 'Struggle',
          rank: 2,
          target: 'die',
          effect: 'One Die gains "[Check] Power + {Cost+1} if user is at or below half HP."',
          tag: '[Check]',
          repeating: true,
          description: 'Die gains extra power when user is at or below half HP',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'burst',
          name: 'Burst',
          rank: 2,
          target: 'die',
          effect: 'Choose one: One Die gains "[Hit] Trigger Tremor Burst, then reduce target’s Tremor by 2" OR One non-evade Die gains "[Clash Win] Trigger Tremor Burst, then reduce target’s Tremor by 2"',
          tag: null,
          repeating: true,
          requiresOption: true,
          description: 'Add Tremor Burst trigger to one die on Hit or to a non-evade die on Clash Win (reduces Tremor by 2 after)',
          options: [
            { id: 'burst_hit', description: 'One Die gains "[Hit] Trigger Tremor Burst, then reduce target’s Tremor by 2"', selection: { type: 'die', count: 1 } },
            { id: 'burst_clashwin', description: 'One non-evade Die gains "[Clash Win] Trigger Tremor Burst, then reduce target’s Tremor by 2"', selection: { type: 'die', count: 1, excludeTypes: ['evade'] } }
          ]
        },
        {
          id: 'kinetic_burn',
          name: 'Kinetic Burn',
          rank: 2,
          target: 'die',
          effect: 'If this skill’s speed die is a higher value than the opposing skill’s, inflict Burn = the difference (Max 10, deployed dice are at 0 Speed)."',
          tag: '[Clash Win]',
          repeating: false,
          description: 'Cannot be applied to 0-cost skills. On clash win with higher speed die, inflict Burn equal to the difference (max 10).',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'berserker',
          name: 'Berserker',
          rank: 2,
          target: 'skill',
          effect: 'This skill gains: "[On Use] Gain 1 Strength and 2 Fragile"',
          tag: '[On Use]',
          repeating: false,
          description: 'Can only be applied to skills of Cost 2 or higher. Grants Strength and Fragile on use.'
        },
        {
          id: 'bunker',
          name: 'Bunker',
          rank: 2,
          target: 'skill',
          effect: 'This skill gains: "[On Use] Gain 1 Endurance and 2 Bind"',
          tag: '[On Use]',
          repeating: false,
          description: 'Can only be applied to skills of Cost 2 or higher. Grants Endurance and Bind on use.'
        },
        {
          id: 'binding',
          name: 'Binding',
          rank: 2,
          target: 'die',
          effect: 'Choose One: One Die gains "[Hit] Inflict 1 Bind" OR Inflict 1 Bind". If the Skill’s cost is 3 or higher, Inflict 2 instead.',
          tag: null,
          repeating: true,
          requiresOption: true,
          description: 'Apply Bind on Hit or on Clash Win. If skill cost is 3 or higher, inflict 2 instead.',
          options: [
            { id: 'binding_hit', description: 'One Die gains "[Hit] Inflict 1 Bind"', selection: { type: 'die', count: 1 } },
            { id: 'binding_clashwin', description: 'Inflict 1 Bind"', selection: { type: 'die', count: 1 } }
          ]
        },
        {
          id: 'curative',
          name: 'Curative',
          rank: 2,
          target: 'skill',
          effect: 'Choose One: This skill gains "[On Use] Reduce 1 Ailment on self by {Cost+2}" OR "[After Use] Reduce 1 Ailment on self by {Cost+2}"',
          tag: null,
          repeating: false,
          requiresOption: true,
          description: 'Reduce one of your ailments by Cost+2 either on use or after use.',
          options: [
            { id: 'curative_on_use', description: 'This skill gains: "[On Use] Reduce 1 Ailment on self by {Cost+2}"' },
            { id: 'curative_after_use', description: 'This skill gains: "[After Use] Reduce 1 Ailment on self by {Cost+2}"' }
          ]
        },
        {
          id: 'brambles',
          name: 'Brambles',
          rank: 2,
          target: 'skill',
          effect: 'This skill gains "[On Use] Gain {Cost} Thorns". If Cost is 0, this grants 1 instead.',
          tag: '[On Use]',
          repeating: false,
          description: 'Gain Thorns on use equal to Cost (minimum 1)'
        },
        {
          id: 'sinking_deluge',
          name: 'Sinking Deluge',
          rank: 2,
          target: 'die',
          effect: 'One Die gains "[Hit] You may spend 3 Emotion Points to Trigger Sinking Deluge"',
          tag: '[Hit]',
          repeating: true,
          description: 'On hit, may spend 3 Emotion Points to trigger Sinking Deluge (see Status Effects for details).',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'bleed_exploit',
          name: 'Bleed Exploit',
          rank: 2,
          target: 'die',
          effect: 'One Die gains: "[Check] Power + {Cost+1} If target has 3+ Bleed"',
          tag: '[Check]',
          repeating: true,
          description: 'Conditional power boost if target has 3 or more Bleed',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'incinerate',
          name: 'Incinerate',
          rank: 2,
          target: 'die',
          effect: 'One Die gains "[Hit] You may spend 4 Burn on the target to inflict 2 Fragile"',
          tag: '[Hit]',
          repeating: false,
          description: 'On hit, you may spend 4 Burn on the target to inflict 2 Fragile',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'refined_technique',
          name: 'Refined Technique',
          rank: 2,
          target: 'die',
          effect: 'Up to {Cost} dice gain "[Clash Win] Gain 1 Poise". If cost is 0, this applies to 1 die instead.',
          tag: '[Clash Win]',
          repeating: true,
          description: 'Grant Poise on clash win to up to Cost dice (minimum 1).',
          selection: { type: 'die', count: 1, countFromCost: true }
        },
        {
          id: 'paralyzer',
          name: 'Paralyzer',
          rank: 2,
          target: 'die',
          effect: 'One Die gains "[Crit] Inflict 1 Paralyze"',
          tag: '[Crit]',
          repeating: true,
          description: 'On critical, inflict 1 Paralyze',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'hp_ampule',
          name: 'HP Ampule',
          rank: 2,
          target: 'skill',
          effect: 'This skill gains "[Limit: 5 Uses]" and "[After Use] Regain 10 HP". At level 6, regain 15 HP instead; at level 11, regain 20 HP.',
          tag: null,
          repeating: false,
          description: 'Limited-use heal after use that scales with level'
        },
        {
          id: 'bypass',
          name: 'Bypass',
          rank: 2,
          target: 'skill',
          effect: 'This skill gains "You may announce this skill immediately instead of waiting for target to respond; if you do, this attack cannot be Intercepted"',
          tag: null,
          repeating: false,
          description: 'Allows immediate announcement; cannot be intercepted when used this way'
        },
        {
          id: 'velocity',
          name: 'Velocity',
          rank: 2,
          target: 'die',
          effect: 'One Die gains: "[Check] Power + {Cost+1} when used at 8+ Speed."',
          tag: '[Check]',
          repeating: true,
          description: 'Gains extra power if used at 8+ Speed',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'controlled_breathing',
          name: 'Controlled Breathing',
          rank: 2,
          target: 'die',
          effect: 'One Evade Die gains "[On Evade] Gain 1 Poise"',
          tag: '[On Evade]',
          repeating: true,
          description: 'Evade die gains 1 Poise on evade',
          selection: { type: 'die', count: 1, includeTypes: ['evade'] }
        },
        {
          id: 'inferno',
          name: 'Inferno',
          rank: 2,
          target: 'die',
          effect: 'One Die gains "[Hit] Trigger Blaze on target, then inflict 2 Burn"',
          tag: '[Hit]',
          repeating: true,
          description: 'On hit, trigger Blaze then inflict 2 Burn',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'speed_order',
          name: 'Speed Order',
          rank: 2,
          target: 'skill',
          effect: 'This Skill gains "[On Use] Give an ally 1 Haste." If the Cost of this skill is 3 or higher, this gives 2 instead.',
          tag: '[On Use]',
          repeating: false,
          description: 'Give an ally Haste on use (2 if cost is 3 or higher).'
        },
        {
          id: 'deep_cuts',
          name: 'Deep Cuts',
          rank: 2,
          target: 'die',
          effect: 'One Die gains "[Hit] Deal 1 additional damage, plus 1 more for every 10 HP you are missing."',
          tag: '[Hit]',
          repeating: true,
          description: 'On hit, deals extra damage scaling with missing HP',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'keep_trucking',
          name: 'Keep Trucking',
          rank: 2,
          target: 'skill',
          effect: 'This skill gains "[On Use] Regain 1 Stagger Resist, plus 1 more for every 10 HP you are missing."',
          tag: '[On Use]',
          repeating: false,
          description: 'Regain Stagger Resist on use scaling with missing HP'
        },
        {
          id: 'charge_support',
          name: 'Charge Support',
          rank: 2,
          target: 'skill',
          effect: 'This skill gains "[On Use] Give an ally {Cost} Charge". If Cost is 0, this grants 1 instead.',
          tag: '[On Use]',
          repeating: false,
          description: 'Give an ally Charge on use based on skill Cost (minimum 1)'
        },
        {
          id: 'charge_ripper',
          name: 'Charge Ripper',
          rank: 2,
          target: 'skill',
          effect: 'This skill gains: "[On Use] Spend 5 Charge to give all Dice on this skill +2 Power." If the skill has only one die, gives +4 Power instead.',
          tag: '[On Use]',
          repeating: false,
          description: 'Spend 5 Charge on use to empower all dice (+2, or +4 if only one die)'
        },
        {
          id: 'sinking_exploit',
          name: 'Sinking Exploit',
          rank: 2,
          target: 'die',
          effect: 'One Die gains: "[Check] Power + {Cost+1} If target has 6+ Sinking"',
          tag: '[Check]',
          repeating: true,
          description: 'Conditional power boost if target has 6 or more Sinking',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'boost_infliction',
          name: 'Boost Infliction',
          rank: 2,
          target: 'skill',
          effect: 'This skill gains: "[On Use] Spend 5 Charge to increase Ailments, Bind, and Fragile inflicted by this skill by 1."',
          tag: '[On Use]',
          repeating: false,
          description: 'Spend 5 Charge to increase all debuffs this skill inflicts by 1'
        },
        {
          id: 'tremor_chain',
          name: 'Tremor: Chain',
          rank: 2,
          target: 'die',
          effect: 'One Die gains "[Hit] If target has 10+ Tremor, inflict 1 Feeble (2 if Tremor is 25+); then reduce target Tremor by 3 for every Feeble inflicted this way."',
          tag: '[Hit]',
          repeating: true,
          description: 'Inflict Feeble when target has high Tremor and reduce Tremor per Feeble inflicted',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'toughened',
          name: 'Toughened',
          rank: 2,
          target: 'skill',
          effect: 'This skill gains "[On Use] Gain {Cost} Aggro and X Protection". X = 1 if Cost <= 1, otherwise 2 if Cost >= 2.',
          tag: '[On Use]',
          repeating: false,
          description: 'Gain Aggro equal to Cost and grant 1 or 2 Protection depending on Cost'
        },
        {
          id: 'tremor_fracture',
          name: 'Tremor: Fracture',
          rank: 2,
          target: 'die',
          effect: 'One Die gains "[Hit] If target has 10+ Tremor, inflict 1 Disarm (2 if Tremor is 25+); then reduce target Tremor by 3 for every Disarm inflicted this way."',
          tag: '[Hit]',
          repeating: true,
          description: 'Inflict Disarm when target has high Tremor and reduce Tremor per Disarm inflicted',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'ongoing_struggle',
          name: 'Ongoing Struggle',
          rank: 2,
          target: 'die',
          effect: 'One Die gains "[Check] +1 Power for every scene concluded this combat (Max {Cost+2})"',
          tag: '[Check]',
          repeating: true,
          description: 'Die scales with number of concluded scenes in the combat, up to Cost+2',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'blumenwand',
          name: 'Blumenwand',
          rank: 2,
          target: 'skill',
          effect: 'This skill gains "[After Use] You and up to {Cost} allies gain 1 Thorns. If Cost >= 2, you may gain 1 additional Thorns (does not apply to chosen allies)."',
          tag: '[After Use]',
          repeating: false,
          description: 'Grant Thorns to self and allies after use; extra Thorns for user if Cost 2+'
        },
        {
          id: 'hemorrhage',
          name: 'Hemorrhage',
          rank: 2,
          target: 'die',
          effect: 'One Die (min size d8) gains "[Crit] Inflict Bleed equal to target\'s Bleed cap."',
          tag: '[Crit]',
          repeating: false,
          description: 'Critical hits inflict Bleed equal to the target\'s Bleed cap. (Requires skill Cost >= 2 and chosen die of at least d8)',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'explosive_canister',
          name: 'Explosive Canister',
          rank: 2,
          target: 'skill',
          effect: 'This skill gains "[Exhaust] Inflict 4 Burn on self and all enemies. Until the end of the skill, trigger Blaze on each hit."',
          tag: '[Exhaust]',
          repeating: false,
          description: 'Exhaust to deal Burn to all and enable Blaze triggers on hits for the remainder of the skill'
        },
        {
          id: 'unstable_tapping',
          name: 'Unstable Tapping',
          rank: 2,
          target: 'skill',
          effect: 'This skill gains "[On Use] You may spend 2 uses of a [Limit] skill to activate its [Exhaust] effect as if it were on this skill."',
          tag: '[On Use]',
          repeating: false,
          description: 'Spend uses of another limited skill to trigger its Exhaust effect on this skill (unnatural activation unless final use spent)'
        },
        {
          id: 'last_push',
          name: 'Last Push',
          rank: 2,
          target: 'skill',
          effect: 'This skill gains "[Exhaust] Roll an additional Speed Die and add it to the scene; if this effect did not trigger naturally, gain 2 Haste instead."',
          tag: '[Exhaust]',
          repeating: false,
          description: 'On Exhaust, add an extra Speed Die or gain Haste if the extra die would not have triggered naturally.'
        },
        {
          id: 'cheating',
          name: 'Cheating',
          rank: 2,
          target: 'skill',
          effect: 'This skill gains "[Limit: 5 Uses]" and "Gain a free Rank 3 module on this skill (does not count against the normal limit of 2 Rank 3 modules)."',
          tag: '[Limit]',
          repeating: false,
          description: 'Provides a 5-use limit and grants a free Rank 3 module slot for this skill.'
        }
      ],

      // Rank 3 Modules
      rank3: [
        {
          id: 'universal_exploit',
          name: 'Universal Exploit',
          rank: 3,
          target: 'die',
          effect: 'One Die gains "[Check] Power +1 for every unique Ailment and Debuff on target; Ailments at 10+ give +2 instead."',
          tag: '[Check]',
          repeating: true,
          description: 'Scale power with the number of unique ailments/debuffs on the target',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'fervor',
          name: 'Fervor',
          rank: 3,
          target: 'skill',
          effect: 'This skill gains: "Cost reduced by 1 while at least 3 E.G.O passives are active on self."',
          tag: null,
          repeating: false,
          description: 'Reduces skill cost while multiple E.G.O passives are active on self'
        },
        {
          id: 'mighty',
          name: 'Mighty',
          rank: 3,
          target: 'skill',
          effect: 'This skill gains: "[On Use] Gain 1 Strength"',
          tag: '[On Use]',
          repeating: false,
          minCost: 2,
          description: 'Can only be applied to skills of Cost 2 or higher. Grants Strength on use.'
        },
        {
          id: 'sturdy',
          name: 'Sturdy',
          rank: 3,
          target: 'skill',
          effect: 'This skill gains: "[On Use] Gain 1 Endurance"',
          tag: '[On Use]',
          repeating: false,
          minCost: 2,
          description: 'Can only be applied to skills of Cost 2 or higher. Grants Endurance on use.'
        },
        {
          id: 'crumble',
          name: 'Crumble',
          rank: 3,
          target: 'die',
          effect: 'One Die of size d6 or higher gains "[Clash Win] Destroy the target\'s next Die" but this die\'s size is reduced by 1 stage.',
          tag: '[Clash Win]',
          repeating: false,
          description: 'Destroy the target\'s next die on clash win; the granting die is reduced by one size',
          selection: { type: 'die', count: 1, minDieSize: 'd6' }
        },
        {
          id: 'panacea',
          name: 'Panacea',
          rank: 3,
          target: 'skill',
          effect: 'This skill gains: "[After Use] Remove all of 1 Ailment or debuff on self"',
          tag: '[After Use]',
          repeating: false,
          minCost: 2,
          description: 'Removes one ailment or debuff from self after use (skills of Cost 2+ only)'
        },
        {
          id: 'wildfire',
          name: 'Wildfire',
          rank: 3,
          target: 'die',
          effect: 'One Die gains "[Hit] Set target\'s Burn equal to the highest Burn among combatants"',
          tag: '[Hit]',
          repeating: false,
          minCost: 1,
          description: 'On hit, set the target\'s Burn to the highest Burn value currently among combatants',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'stable_burst',
          name: 'Stable Burst',
          rank: 3,
          target: 'die',
          effect: 'Choose one: One Die gains "[Hit] Trigger Tremor Burst" OR One non-evade Die gains "[Clash Win] Trigger Tremor Burst"',
          tag: null,
          repeating: true,
          requiresOption: true,
          description: 'Trigger Tremor Burst on hit or on clash win (non-evade).',
          options: [
            { id: 'stable_burst_hit', description: 'One Die gains "[Hit] Trigger Tremor Burst"', selection: { type: 'die', count: 1 } },
            { id: 'stable_burst_clashwin', description: 'One non-evade Die gains "[Clash Win] Trigger Tremor Burst"', selection: { type: 'die', count: 1, excludeTypes: ['evade'] } }
          ]
        },
        {
          id: 'extra_die',
          name: 'Extra Die',
          rank: 3,
          target: 'skill',
          effect: 'Add an additional non-counter Die to the skill. Die size is based on Cost: 0→1d4, 1→1d6, 2→1d8, 3+→1d10. Die may be placed before, after, or between existing dice and counts as if always present.',
          tag: null,
          repeating: false,
          description: 'Adds an extra die to the skill which integrates with all-dice effects; prevents single-die bonuses.'
        },
        {
          id: 'counter',
          name: 'Counter',
          rank: 3,
          target: 'skill',
          effect: 'This skill gains: "[After Use] Gain the following Counter Die: {X}" where size depends on Cost (1→1d4, 2→1d6, 3+→1d8). Modules can be added to the Counter Die but combined module ranks on it cannot exceed 3.',
          tag: '[After Use]',
          repeating: false,
          minCost: 1,
          description: 'Grants a Counter Die after use; counter die may accept modules up to combined rank 3.'
        },
        {
          id: 'extreme_critical',
          name: 'Extreme Critical',
          rank: 3,
          target: 'die',
          effect: 'One Die gains "[Crit] Deal additional damage and stagger equal to the die\'s maximum value."',
          tag: '[Crit]',
          repeating: true,
          description: 'On crit, deal additional damage/stagger equal to the die\'s max value',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'sapper',
          name: 'Sapper',
          rank: 3,
          target: 'die',
          effect: 'One non-counter Die of size d6 or higher gains "[Hit] Target loses 1 Light" but this die\'s size is reduced by 1 stage.',
          tag: '[Hit]',
          repeating: false,
          minCost: 3,
          description: 'Drains target Light on hit; granting die is reduced by one size',
          selection: { type: 'die', count: 1, excludeTypes: ['counter'], minDieSize: 'd6' }
        },
        {
          id: 'enfeebling',
          name: 'Enfeebling',
          rank: 3,
          target: 'die',
          effect: 'One Die gains "[Hit] Inflict 1 Feeble"',
          tag: '[Hit]',
          repeating: true,
          description: 'On hit, inflict Feeble',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'disarming',
          name: 'Disarming',
          rank: 3,
          target: 'die',
          effect: 'One Die gains "[Hit] Inflict 1 Disarm"',
          tag: '[Hit]',
          repeating: true,
          description: 'On hit, inflict Disarm',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'offense_formation',
          name: 'Offense Formation',
          rank: 3,
          target: 'skill',
          effect: 'Can only be applied to skills of Cost 3 or higher. Choose one: "[On Use] Give another ally 1 Strength" OR "[After Use] Give another ally 1 Strength"',
          tag: null,
          repeating: false,
          minCost: 3,
          requiresOption: true,
          options: [
            { id: 'offense_on_use', description: 'This skill gains "[On Use] Give another ally 1 Strength"' },
            { id: 'offense_after_use', description: 'This skill gains "[After Use] Give another ally 1 Strength"' }
          ],
          description: 'Provides Strength to an ally on use or after use'
        },
        {
          id: 'defense_formation',
          name: 'Defense Formation',
          rank: 3,
          target: 'skill',
          effect: 'Can only be applied to skills of Cost 3 or higher. Choose one: "[On Use] Give another ally 1 Endurance" OR "[After Use] Give another ally 1 Endurance"',
          tag: null,
          repeating: false,
          minCost: 3,
          requiresOption: true,
          options: [
            { id: 'defense_on_use', description: 'This skill gains "[On Use] Give another ally 1 Endurance"' },
            { id: 'defense_after_use', description: 'This skill gains "[After Use] Give another ally 1 Endurance"' }
          ],
          description: 'Provides Endurance to an ally on use or after use'
        },
        {
          id: 'assist_attack',
          name: 'Assist Attack',
          rank: 3,
          target: 'skill',
          effect: 'Can only be applied to skills of Cost 3 or higher. This skill gains "[After Use] If at least 1 Offensive Die on this skill hits, an ally may use a skill with a cost of 1 or lower against the same target without using a Speed Die."',
          tag: '[After Use]',
          repeating: false,
          minCost: 3,
          description: 'Allows an ally to make a free low-cost attack against the same target if this skill had an offensive hit'
        },
        {
          id: 'nullify',
          name: 'Nullify',
          rank: 3,
          target: 'skill',
          effect: 'This skill and the opposing skill both ignore Buffs, Debuffs, [Check] Tags, and any other on-skill effects which modify power.',
          tag: null,
          repeating: false,
          description: 'Both skills ignore on-skill modifiers and checks for the duration of the clash'
        },
        {
          id: 'proliferate',
          name: 'Proliferate',
          rank: 3,
          target: 'die',
          effect: 'One Die gains "[Hit] Increase the value of all Ailments, as well as Fragile and Bind, on foe by 1". If this skill\'s cost is 2 or higher, you may also give it "[Crit] Increase by an additional 1".',
          tag: '[Hit]',
          repeating: true,
          description: 'Amplify existing ailments and debuffs on hit; scales with skill cost',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'tremor_decay',
          name: 'Tremor: Decay',
          rank: 3,
          target: 'die',
          effect: 'One Die gains "[Hit] Inflict 1 Fragile, plus one more for every 10 Tremor on target, then reduce target\'s Tremor by 2 for every Fragile inflicted this way."',
          tag: '[Hit]',
          repeating: true,
          description: 'Inflict Fragile based on target Tremor then reduce Tremor accordingly',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'crippling_blow',
          name: 'Crippling Blow',
          rank: 3,
          target: 'die',
          effect: 'One Die gains "[Crit] Inflict 1 Feeble and 1 Disarm"',
          tag: '[Crit]',
          repeating: true,
          description: 'On crit, inflict Feeble and Disarm',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'neurotoxin',
          name: 'Neurotoxin',
          rank: 3,
          target: 'die',
          effect: 'One Die gains "[Hit] Inflict 1 Paralyze"; if the skill\'s Cost is 3 or higher, also give the die +1 Power.',
          tag: '[Hit]',
          repeating: true,
          description: 'Inflict Paralyze on hit; gain +1 Power on high-cost skills',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'fatal_fury',
          name: 'Fatal Fury',
          rank: 3,
          target: 'skill',
          effect: 'This skill gains "[Exhaust] Lose 20 HP and gain 3 Strength, or 2 Strength if this effect did not trigger naturally"',
          tag: '[Exhaust]',
          repeating: false,
          description: 'Exhaust to trade HP for Strength; reduced Strength if effect was an unnatural activation'
        }
      ],
      
      // Special Modules (for unique skills or E.G.O)
      special: [
        {
          id: 'ego_amplify',
          name: 'E.G.O Amplify',
          rank: 'special',
          target: 'skill',
          effect: 'Increase all dice power by character Persona value',
          tag: '[E.G.O]',
          repeating: false,
          description: 'Scales with the character\'s force of will'
        },
        {
          id: 'light_consumption',
          name: 'Light Consumption',
          rank: 'special',
          target: 'skill',
          effect: 'Consume 1 Light for +3 Power to all dice',
          tag: '[Light Cost]',
          repeating: false,
          description: 'Burns inner light for tremendous power'
        },
        {
          id: 'emotion_surge',
          name: 'Emotion Surge',
          rank: 'special',
          target: 'skill',
          effect: 'Each Emotion Point spent adds +2 Power',
          tag: '[Emotion]',
          repeating: false,
          description: 'Channels raw emotion into power'
        }
      ]
    };
  }

  // Documentation helper: returns tags and modules grouped by rank for UI/reference
  getDocumentation() {
    const mapModule = (m) => ({ id: m.id, name: m.name, rank: m.rank, target: m.target, effect: m.effect, tag: m.tag, repeating: m.repeating, description: m.description });
    return {
      tags: moduleTagsReference,
      modules: {
        rank1: this.skillModules.rank1.map(mapModule),
        rank2: this.skillModules.rank2.map(mapModule),
        rank3: this.skillModules.rank3.map(mapModule),
        special: this.skillModules.special.map(mapModule)
      }
    };
  }

  // Get all modules
  getAllModules() {
    return this.skillModules;
  }

  // Get modules by rank
  getModulesByRank(rank) {
    if (rank === 'special') return this.skillModules.special;
    return this.skillModules[`rank${rank}`] || [];
  }

  // Get module by ID and rank
  getModuleById(id, rank = null) {
    if (rank) {
      const modules = this.getModulesByRank(rank);
      return modules.find(module => module.id === id);
    }
    
    // Search all ranks if no rank specified
    for (const rankKey of ['rank1', 'rank2', 'rank3', 'special']) {
      const modules = this.skillModules[rankKey];
      const found = modules.find(module => module.id === id);
      if (found) return found;
    }
    
    return null;
  }

  // Get modules by target type
  getModulesByTarget(target) {
    const allModules = [
      ...this.skillModules.rank1,
      ...this.skillModules.rank2,
      ...this.skillModules.rank3,
      ...this.skillModules.special
    ];
    
    return allModules.filter(module => module.target === target);
  }

  // Selection schema for modules (handles options and die targeting)
  getModuleSelectionSchema(moduleId, rank, context = {}) {
    const module = this.getModuleById(moduleId, rank);
    if (!module) return null;

    const clone = (obj) => (obj ? JSON.parse(JSON.stringify(obj)) : null);

    // If module has options, return option-based schema
    if (module.requiresOption && Array.isArray(module.options)) {
      return {
        type: 'options',
        options: module.options.map(opt => ({ id: opt.id, description: opt.description, selection: clone(opt.selection) || null }))
      };
    }

    // Base selection from module or default by target type
    let base = clone(module.selection) || (module.target === 'die' ? { type: 'die', count: 1 } : null);

    // Handle conditional counts (e.g., Forceful cost >= 3 -> 2 dice)
    if (base && Array.isArray(base.conditionalCounts) && context && context.skill && typeof context.skill.cost === 'number') {
      for (const rule of base.conditionalCounts) {
        if (this.evaluateCondition(rule.condition, context)) {
          base.count = rule.count;
        }
      }
    }

    return base;
  }

  // Simple evaluator for conditions like "skill.cost>=3"
  evaluateCondition(condition, context) {
    const m = String(condition).match(/^skill\.cost\s*([<>]=?)\s*(\d+)$/);
    if (!m) return false;
    const op = m[1];
    const val = Number(m[2]);
    const cur = Number(context?.skill?.cost ?? 0);
    if (op === '>=') return cur >= val;
    if (op === '>') return cur > val;
    if (op === '<=') return cur <= val;
    if (op === '<') return cur < val;
    if (op === '==') return cur === val;
    return false;
  }

  // Get modules that add specific tags
  getModulesByTag(tag) {
    const allModules = [
      ...this.skillModules.rank1,
      ...this.skillModules.rank2,
      ...this.skillModules.rank3,
      ...this.skillModules.special
    ];
    
    return allModules.filter(module => module.tag === tag);
  }

  // Get repeating modules
  getRepeatingModules() {
    const allModules = [
      ...this.skillModules.rank1,
      ...this.skillModules.rank2,
      ...this.skillModules.rank3,
      ...this.skillModules.special
    ];
    
    return allModules.filter(module => module.repeating);
  }

  // Check if a module can be added to a skill
  canAddModule(skillModules, newModuleId, newModuleRank) {
    const newModule = this.getModuleById(newModuleId, newModuleRank);
    if (!newModule) return { canAdd: false, reason: 'Module not found' };

    // Check if module is already present (unless repeating)
    const hasModule = skillModules.some(mod => mod.id === newModuleId);
    if (hasModule && !newModule.repeating) {
      return { canAdd: false, reason: 'Module already present and not repeating' };
    }

    // Check for tag conflicts
    if (newModule.tag) {
      const hasTag = skillModules.some(mod => {
        const existingModule = this.getModuleById(mod.id, mod.rank);
        return existingModule && existingModule.tag === newModule.tag;
      });
      
      if (hasTag) {
        return { canAdd: false, reason: `Tag ${newModule.tag} already present` };
      }
    }

    return { canAdd: true };
  }

  // Validate a complete skill build
  validateSkillBuild(baseId, modules) {
    const errors = [];
    const usedTags = new Set();
    const moduleIds = new Set();

    // Check each module
    modules.forEach((module, index) => {
      const moduleData = this.getModuleById(module.id, module.rank);
      if (!moduleData) {
        errors.push(`Module ${index + 1}: Module not found`);
        return;
      }

      // Check for duplicate non-repeating modules
      if (moduleIds.has(module.id) && !moduleData.repeating) {
        errors.push(`Module ${index + 1}: Duplicate non-repeating module`);
      }
      moduleIds.add(module.id);

      // Check for tag conflicts
      if (moduleData.tag) {
        if (usedTags.has(moduleData.tag)) {
          errors.push(`Module ${index + 1}: Tag ${moduleData.tag} already used`);
        }
        usedTags.add(moduleData.tag);
      }
    });

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Calculate total module cost for available modules
  calculateModuleCost(modules, availableModules) {
    let totalCost = { rank1: 0, rank2: 0, rank3: 0 };
    
    modules.forEach(module => {
      if (module.rank === 1 || module.rank === 'rank1') totalCost.rank1++;
      else if (module.rank === 2 || module.rank === 'rank2') totalCost.rank2++;
      else if (module.rank === 3 || module.rank === 'rank3') totalCost.rank3++;
    });

    return {
      cost: totalCost,
      canAfford: {
        rank1: totalCost.rank1 <= availableModules.rank1,
        rank2: totalCost.rank2 <= availableModules.rank2,
        rank3: totalCost.rank3 <= availableModules.rank3
      },
      remaining: {
        rank1: Math.max(0, availableModules.rank1 - totalCost.rank1),
        rank2: Math.max(0, availableModules.rank2 - totalCost.rank2),
        rank3: Math.max(0, availableModules.rank3 - totalCost.rank3)
      }
    };
  }

  // Get recommended modules for a specific skill type
  getRecommendedModules(skillType, rank = null) {
    const recommendations = {
      offensive: {
        rank1: ['stronger', 'potential', 'forceful', 'cut_through', 'aggravate', 'finisher_light'],
        rank2: ['critical', 'overwhelm', 'penetration', 'multi_hit'],
        rank3: ['execute', 'devastate', 'finisher', 'rampage']
      },
      defensive: {
        rank1: ['preventative_measures', 'comeback', 'stronger'],
        rank2: ['stagger_heal', 'charge', 'curative'],
        rank3: ['overwhelming_force']
      },
      utility: {
        rank1: ['potential', 'aggravate'],
        rank2: ['area_attack', 'charge'],
        rank3: ['chain_reaction']
      }
    };

    if (rank) {
      return recommendations[skillType]?.[`rank${rank}`] || [];
    }

    return recommendations[skillType] || {};
  }

  // Search modules by name or effect
  searchModules(query) {
    const searchTerm = query.toLowerCase();
    const allModules = [
      ...this.skillModules.rank1,
      ...this.skillModules.rank2,
      ...this.skillModules.rank3,
      ...this.skillModules.special
    ];

    return allModules.filter(module => 
      module.name.toLowerCase().includes(searchTerm) ||
      module.effect.toLowerCase().includes(searchTerm) ||
      module.description.toLowerCase().includes(searchTerm)
    );
  }

  // Format module for display
  formatModuleForDisplay(moduleId, rank) {
    const module = this.getModuleById(moduleId, rank);
    if (!module) return null;

    return {
      name: module.name,
      rank: module.rank,
      target: module.target,
      effect: module.effect,
      tag: module.tag,
      repeating: module.repeating,
      description: module.description,
      displayText: `${module.name} (Rank ${module.rank}): ${module.effect}`
    };
  }
}

// Export singleton instance
export const skillModulesManager = new SkillModulesManager();
