/**
 * Stars of the City - Base E.G.O. Passives
 * Contains all available Base E.G.O. passive abilities that can be selected at Level 2
 */

export const baseEgoPassives = [
  {
    id: 'inflictor',
    name: 'Inflictor',
    description: 'Once per skill, when inflicting {Chosen Ailment} inflict 1 more.',
    requiresChoice: true,
    choiceType: 'ailment',
    choices: ['Burn', 'Tremor', 'Sinking', 'Bleed']
  },
  {
    id: 'confrontational',
    name: 'Confrontational',
    description: 'All non-counter Offensive Dice gain +1 Power in a Clash, but lose 1 Power when unopposed.'
  },
  {
    id: 'survivor',
    name: 'Survivor',
    description: 'At the start of each scene, if you are at or below one-fourth of your Max HP, regain 1 Light.'
  },
  {
    id: 'immunity',
    name: 'Immunity',
    description: 'At the start of each scene, Gain 1 Safeguard, or 2 if you are level 8 or higher.'
  },
  {
    id: 'retaliate',
    name: 'Retaliate',
    description: 'When hit, inflict 1 {Chosen Ailment} on the attacker. This passive can inflict a maximum of 3 {Chosen Ailment} per scene.',
    requiresChoice: true,
    choiceType: 'ailment',
    choices: ['Burn', 'Tremor', 'Sinking']
  },
  {
    id: 'critical_edge',
    name: 'Critical Edge',
    description: 'When an offensive die Crits (Rolls max value and hits the target), deal an additional 3 points of damage (not stagger)'
  },
  {
    id: 'invincible',
    name: 'Invincible',
    description: 'Add -2 to your damage affinity for {Chosen Damage type}',
    requiresChoice: true,
    choiceType: 'damageType',
    choices: ['Blunt', 'Pierce', 'Slash']
  },
  {
    id: 'unyielding',
    name: 'Unyielding',
    description: 'Add -2 to your stagger affinity for {Chosen Stagger type}',
    requiresChoice: true,
    choiceType: 'staggerType',
    choices: ['Blunt', 'Pierce', 'Slash']
  },
  {
    id: 'bloodfeast',
    name: 'Bloodfeast',
    description: 'On hit, if the target has Bleed(before being hit and/or reducing Bleed) regain 1 HP.'
  },
  {
    id: 'reverb',
    name: 'Reverb',
    description: 'When Triggering Tremor Burst against an already staggered enemy or an enemy without a stagger resist stat, they take damage = half their Tremor'
  },
  {
    id: 'ignition',
    name: 'Ignition',
    description: 'When inflicting Burn on a target without Burn, inflict twice as much. Does not count effects that set values directly.'
  },
  {
    id: 'slothful',
    name: 'Slothful',
    description: 'On hit, if target has Sinking, you may reduce target\'s Sinking by 2 to inflict 1 Bind.'
  },
  {
    id: 'bulwark',
    name: 'Bulwark',
    description: 'On Clash Win with a Block Die, increase the Stagger dealt equal to your Protection'
  },
  {
    id: 'thorn_barrier',
    name: 'Thorn Barrier',
    description: 'The first 2 times each scene that you gain Thorns, you gain 1 Protection.'
  },
  {
    id: 'patient_strike',
    name: 'Patient Strike',
    description: 'Skills made up of only a single non-counter Offensive Die gain +1 Power and yield an additional emotion point in a clash.'
  },
  {
    id: 'spiked_wall',
    name: 'Spiked Wall',
    description: 'When you win a clash with a Block Die, deal damage to the attacker equal to your Thorns (Max 5).'
  },
  {
    id: 'great_blaze',
    name: 'Great Blaze',
    description: 'On Crit with a Die that triggers Blaze, trigger Blaze an additional time.'
  },
  {
    id: 'cover',
    name: 'Cover',
    description: 'When an enemy targets you with a skill that has multiple Attack Weight, they must use 2 of their Attack Weight to do so. This also applies when you intercept an attack, and the attacker gets to choose which other creature is no longer targeted.'
  },
  {
    id: 'steady_pace',
    name: 'Steady Pace',
    description: 'At the start of each scene, your Speed Dice have their size reduced by 1 stage (d8 to d6, ect.), but gain +2 to their final value.'
  },
  {
    id: 'charge_blitz',
    name: 'Charge Blitz',
    description: 'When Spending Charge for skill effects, Gain 1 Haste and regain Stagger Resist = the Charge spent.'
  },
  {
    id: 'dual_use_capacitors',
    name: 'Dual-Use Capacitors',
    description: 'When spending 5+ Charge for an [On Use] effect, roll all dice on that skill twice and take the higher result. If the skill had only one die, roll that die three times instead and take the highest result.'
  },
  {
    id: 'multi_inflictor',
    name: 'Multi-Inflictor',
    description: 'When inflicting Burn,Tremor, Sinkingor Bleed inflict 1 more if you have not inflicted that ailment on any target this scene. If you inflict all 4 in a scene, gain 1 emotion point.'
  },
  {
    id: 'gardening',
    name: 'Gardening',
    description: 'At the beginning of each Scene, Gain 1 Thorns, plus 1 more for every non-object character defeated this combat (Max 4 Thorns).'
  }
];

export class BaseEgoPassiveManager {
  constructor() {
    this.passives = baseEgoPassives;
  }

  // Get all Base E.G.O. passives
  getAllPassives() {
    return this.passives;
  }

  // Get passive by ID
  getPassiveById(id) {
    return this.passives.find(p => p.id === id);
  }

  // Get passives that require a specific choice type
  getPassivesByChoiceType(choiceType) {
    return this.passives.filter(p => p.choiceType === choiceType);
  }

  // Get passives that require choices
  getChoicePassives() {
    return this.passives.filter(p => p.requiresChoice);
  }

  // Get passives that don't require choices
  getSimplePassives() {
    return this.passives.filter(p => !p.requiresChoice);
  }

  // Resolve passive description with chosen value
  resolvePassiveDescription(passiveId, chosenValue = null) {
    const passive = this.getPassiveById(passiveId);
    if (!passive) return null;

    if (!passive.requiresChoice) {
      return passive.description;
    }

    if (!chosenValue) {
      return passive.description; // Return template description
    }

    // Replace placeholder with chosen value
    let description = passive.description;
    if (passive.choiceType === 'ailment') {
      description = description.replace('{Chosen Ailment}', chosenValue);
    } else if (passive.choiceType === 'damageType') {
      description = description.replace('{Chosen Damage type}', chosenValue);
    } else if (passive.choiceType === 'staggerType') {
      description = description.replace('{Chosen Stagger type}', chosenValue);
    }

    return description;
  }

  // Validate choice for a passive
  validateChoice(passiveId, choice) {
    const passive = this.getPassiveById(passiveId);
    if (!passive) return { valid: false, error: 'Passive not found' };

    if (!passive.requiresChoice) {
      return { valid: true }; // No choice needed
    }

    if (!choice) {
      return { valid: false, error: 'Choice required but not provided' };
    }

    if (!passive.choices.includes(choice)) {
      return { valid: false, error: `Invalid choice. Must be one of: ${passive.choices.join(', ')}` };
    }

    return { valid: true };
  }

  // Get formatted passive for display
  formatPassiveForDisplay(passiveId, chosenValue = null) {
    const passive = this.getPassiveById(passiveId);
    if (!passive) return null;

    return {
      id: passive.id,
      name: passive.name,
      description: this.resolvePassiveDescription(passiveId, chosenValue),
      requiresChoice: passive.requiresChoice || false,
      choiceType: passive.choiceType || null,
      choices: passive.choices || [],
      chosenValue: chosenValue
    };
  }
}

// Export singleton instance
export const baseEgoPassiveManager = new BaseEgoPassiveManager();
