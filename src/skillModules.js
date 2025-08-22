/**
 * Stars of the City - Skill Modules System
 * Manages all available skill modules that can be added to skill bases
 */

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
          id: 'power_up',
          name: 'Power Up',
          rank: 1,
          target: 'die',
          effect: '+1 Power to target die',
          tag: null,
          repeating: true,
          description: 'Increases the power of a single die by 1'
        },
        {
          id: 'on_hit',
          name: 'On Hit',
          rank: 1,
          target: 'skill',
          effect: 'Gain effect when this skill hits',
          tag: '[Hit]',
          repeating: false,
          description: 'Triggers an effect when the skill successfully hits'
        },
        {
          id: 'bleed',
          name: 'Bleed',
          rank: 1,
          target: 'die',
          effect: 'Target gains Bleed on hit',
          tag: '[Bleed]',
          repeating: false,
          description: 'Inflicts bleeding damage over time'
        },
        {
          id: 'burn',
          name: 'Burn',
          rank: 1,
          target: 'die',
          effect: 'Target gains Burn on hit',
          tag: '[Burn]',
          repeating: false,
          description: 'Inflicts burning damage over time'
        },
        {
          id: 'tremor',
          name: 'Tremor',
          rank: 1,
          target: 'die',
          effect: 'Target gains Tremor on hit',
          tag: '[Tremor]',
          repeating: false,
          description: 'Causes the target to shake and lose stability'
        },
        {
          id: 'rupture',
          name: 'Rupture',
          rank: 1,
          target: 'die',
          effect: 'Target gains Rupture on hit',
          tag: '[Rupture]',
          repeating: false,
          description: 'Creates weak points that increase damage taken'
        },
        {
          id: 'pierce',
          name: 'Pierce',
          rank: 1,
          target: 'die',
          effect: 'This die inflicts Pierce damage',
          tag: '[Pierce]',
          repeating: false,
          description: 'Changes damage type to Pierce'
        },
        {
          id: 'slash',
          name: 'Slash',
          rank: 1,
          target: 'die',
          effect: 'This die inflicts Slash damage',
          tag: '[Slash]',
          repeating: false,
          description: 'Changes damage type to Slash'
        },
        {
          id: 'blunt',
          name: 'Blunt',
          rank: 1,
          target: 'die',
          effect: 'This die inflicts Blunt damage',
          tag: '[Blunt]',
          repeating: false,
          description: 'Changes damage type to Blunt'
        },
        {
          id: 'clash_win',
          name: 'Clash Win',
          rank: 1,
          target: 'skill',
          effect: 'Gain effect on Clash Win',
          tag: '[Clash Win]',
          repeating: false,
          description: 'Triggers effect when winning a clash'
        },
        {
          id: 'reuse',
          name: 'Reuse',
          rank: 1,
          target: 'skill',
          effect: 'This skill can be used again this turn',
          tag: '[Reuse]',
          repeating: false,
          description: 'Allows the skill to be used multiple times per turn'
        },
        {
          id: 'range',
          name: 'Range',
          rank: 1,
          target: 'skill',
          effect: 'This skill can target at range',
          tag: '[Range]',
          repeating: false,
          description: 'Allows targeting enemies at a distance'
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
          description: 'Increases the power of a single die by 2'
        },
        {
          id: 'critical',
          name: 'Critical',
          rank: 2,
          target: 'die',
          effect: 'This die deals critical damage on max roll',
          tag: '[Critical]',
          repeating: false,
          description: 'Doubles damage when rolling maximum on the die'
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
          description: 'Prevents target from taking actions'
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
          id: 'heal',
          name: 'Heal',
          rank: 2,
          target: 'skill',
          effect: 'Recover HP equal to damage dealt',
          tag: '[Heal]',
          repeating: false,
          description: 'Restores health based on damage inflicted'
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
          description: 'Bypasses enemy damage reduction'
        },
        {
          id: 'multi_hit',
          name: 'Multi-Hit',
          rank: 2,
          target: 'die',
          effect: 'This die hits twice if it wins clash',
          tag: '[Multi-Hit]',
          repeating: false,
          description: 'Strikes multiple times on successful clash'
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
          description: 'Increases the power of a single die by 3'
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
          description: 'Completely bypasses all defensive measures'
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
          description: 'Damage that cannot be reduced or prevented'
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
        rank1: ['power_up', 'slash', 'pierce', 'blunt', 'bleed', 'burn'],
        rank2: ['critical', 'overwhelm', 'penetration', 'multi_hit'],
        rank3: ['execute', 'devastate', 'finisher', 'rampage']
      },
      defensive: {
        rank1: ['power_up', 'on_hit', 'clash_win'],
        rank2: ['heal', 'stagger_heal', 'charge'],
        rank3: ['overwhelming_force']
      },
      utility: {
        rank1: ['range', 'reuse'],
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
