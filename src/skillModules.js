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
          effect: 'One Die gains "[Clash Win] Target loses 2 Stagger Resist". If the Skill’s cost is 3 or higher, apply this to 2 Dice instead.',
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
        }
      ],
      
      // Rank 2 Modules
      rank2: [
        {
          id: 'power_up_2',
          name: 'Power Up II',
          rank: 2,
          target: 'die',
          effect: '+2 Power to target die',
          tag: null,
          repeating: true,
          description: 'Increases the power of a single die by 2',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'critical',
          name: 'Critical',
          rank: 2,
          target: 'die',
          effect: 'This die deals critical damage on max roll',
          tag: '[Crit]',
          repeating: false,
          description: 'Doubles damage when rolling maximum on the die',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'overwhelm',
          name: 'Overwhelm',
          rank: 2,
          target: 'skill',
          effect: 'Ignore enemy defensive dice if power difference is 5+',
          tag: '[Overwhelm]',
          repeating: false,
          description: 'Bypasses defense with sufficient power advantage'
        },
        {
          id: 'paralysis',
          name: 'Paralysis',
          rank: 2,
          target: 'die',
          effect: 'Target gains Paralysis on hit',
          tag: '[Paralysis]',
          repeating: false,
          description: 'Prevents target from taking actions',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'charge',
          name: 'Charge',
          rank: 2,
          target: 'skill',
          effect: 'Gain +2 Power for each turn this skill was not used',
          tag: '[Charge]',
          repeating: false,
          description: 'Builds up power when not used immediately'
        },
        {
          id: 'area_attack',
          name: 'Area Attack',
          rank: 2,
          target: 'skill',
          effect: 'This skill targets all enemies in range',
          tag: '[Area]',
          repeating: false,
          description: 'Hits multiple targets simultaneously'
        },
        {
          id: 'curative',
          name: 'Curative',
          rank: 2,
          target: 'skill',
          effect: 'Reduce 1 Ailment on self by {Cost+2}',
          tag: '[On Use]',
          repeating: false,
          description: 'Removes negative effects when the skill is used'
        },
        {
          id: 'stagger_heal',
          name: 'Stagger Heal',
          rank: 2,
          target: 'skill',
          effect: 'Recover Stagger Resist equal to damage dealt',
          tag: '[Stagger Heal]',
          repeating: false,
          description: 'Restores mental stability based on damage'
        },
        {
          id: 'penetration',
          name: 'Penetration',
          rank: 2,
          target: 'die',
          effect: 'Ignore 2 points of damage resistance',
          tag: '[Penetration]',
          repeating: false,
          description: 'Bypasses enemy damage reduction',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'multi_hit',
          name: 'Multi-Hit',
          rank: 2,
          target: 'die',
          effect: 'This die hits twice if it wins clash',
          tag: '[Multi-Hit]',
          repeating: false,
          description: 'Strikes multiple times on successful clash',
          selection: { type: 'die', count: 1 }
        }
      ],
      
      // Rank 3 Modules
      rank3: [
        {
          id: 'power_up_3',
          name: 'Power Up III',
          rank: 3,
          target: 'die',
          effect: '+3 Power to target die',
          tag: null,
          repeating: true,
          description: 'Increases the power of a single die by 3',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'execute',
          name: 'Execute',
          rank: 3,
          target: 'skill',
          effect: 'Instantly defeat enemies below 25% HP',
          tag: '[Execute]',
          repeating: false,
          description: 'Eliminates severely wounded enemies instantly'
        },
        {
          id: 'devastate',
          name: 'Devastate',
          rank: 3,
          target: 'skill',
          effect: 'Deal double damage to Staggered enemies',
          tag: '[Devastate]',
          repeating: false,
          description: 'Exploits mentally broken enemies for massive damage'
        },
        {
          id: 'absolute_pierce',
          name: 'Absolute Pierce',
          rank: 3,
          target: 'die',
          effect: 'Ignore all damage resistance and armor',
          tag: '[Absolute Pierce]',
          repeating: false,
          description: 'Completely bypasses all defensive measures',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'chain_reaction',
          name: 'Chain Reaction',
          rank: 3,
          target: 'skill',
          effect: 'On kill, this skill activates again targeting another enemy',
          tag: '[Chain]',
          repeating: false,
          description: 'Continues to activate after eliminating targets'
        },
        {
          id: 'finisher',
          name: 'Finisher',
          rank: 3,
          target: 'skill',
          effect: '+5 Power if target is below 50% HP',
          tag: '[Finisher]',
          repeating: false,
          description: 'Becomes more powerful against wounded enemies'
        },
        {
          id: 'rampage',
          name: 'Rampage',
          rank: 3,
          target: 'skill',
          effect: '+1 Power for each enemy defeated this combat',
          tag: '[Rampage]',
          repeating: false,
          description: 'Grows stronger with each kill'
        },
        {
          id: 'overwhelming_force',
          name: 'Overwhelming Force',
          rank: 3,
          target: 'skill',
          effect: 'This skill cannot be blocked or evaded',
          tag: '[Overwhelming]',
          repeating: false,
          description: 'Impossible to defend against'
        },
        {
          id: 'true_damage',
          name: 'True Damage',
          rank: 3,
          target: 'die',
          effect: 'This die deals true damage (ignores all defenses)',
          tag: '[True Damage]',
          repeating: false,
          description: 'Damage that cannot be reduced or prevented',
          selection: { type: 'die', count: 1 }
        },
        {
          id: 'nightmare',
          name: 'Nightmare',
          rank: 3,
          target: 'skill',
          effect: 'Target gains all negative status effects on hit',
          tag: '[Nightmare]',
          repeating: false,
          description: 'Inflicts multiple debilitating conditions'
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
