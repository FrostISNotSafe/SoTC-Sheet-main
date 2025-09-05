/**
 * Stars of the City - Skill Bases System
 * Manages all available skill bases that can be used to create custom skills and E.G.O
 */

export class SkillBasesManager {
  constructor() {
    this.skillBases = this.initializeSkillBases();
  }

  // ===================================== BASE SKILLS =====================================
  // Initialize all skill bases from the SOTC system
  initializeSkillBases() {
    return [
      {
        id: 'single_strike',
        name: 'Single Strike',
        cost: 1,
        dice: [
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd8',
            bonus: 3,
            notation: '1d8+3'
          }
        ],
        description: 'A straightforward offensive attack',
        category: 'basic_offensive'
      },
      {
        id: 'cheap_blow',
        name: 'Cheap Blow',
        cost: 0,
        dice: [
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          }
        ],
        description: 'A low-cost basic attack',
        category: 'basic_offensive'
      },
      {
        id: 'strong_strike',
        name: 'Strong Strike',
        cost: 2,
        dice: [
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd10',
            bonus: 5,
            notation: '1d10+5'
          }
        ],
        description: 'A powerful single attack',
        category: 'basic_offensive'
      },
      {
        id: 'panic_defense',
        name: 'Panic Defense',
        cost: 0,
        dice: [
          {
            type: 'defensive',
            tag: '[Block or Evade]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          }
        ],
        description: 'A desperate defensive maneuver',
        category: 'basic_defensive'
      },
      {
        id: 'massive_strike',
        name: 'Massive Strike',
        cost: 3,
        dice: [
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd12',
            bonus: 8,
            notation: '1d12+8'
          }
        ],
        description: 'An incredibly powerful but costly attack',
        category: 'basic_offensive'
      },
      {
        id: 'heavy_guard',
        name: 'Heavy Guard',
        cost: 1,
        dice: [
          {
            type: 'defensive',
            tag: '[Block]',
            dieSize: 'd8',
            bonus: 3,
            notation: '1d8+3'
          }
        ],
        description: 'A solid defensive stance',
        category: 'basic_defensive'
      },
      {
        id: 'dual_strike',
        name: 'Dual Strike',
        cost: 1,
        dice: [
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          },
          {
            type: 'offensive',
            tag: '[Any Other Offensive]',
            dieSize: 'd4',
            bonus: 0,
            notation: '1d4'
          }
        ],
        description: 'Two quick strikes with different damage types',
        category: 'multi_dice'
      },
      {
        id: 'parry',
        name: 'Parry',
        cost: 1,
        dice: [
          {
            type: 'defensive',
            tag: '[Block or Evade]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          },
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          }
        ],
        description: 'Defensive action followed by a counterattack',
        category: 'counter'
      },
      {
        id: 'double_attack',
        name: 'Double Attack',
        cost: 2,
        dice: [
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd8',
            bonus: 0,
            notation: '1d8'
          },
          {
            type: 'offensive',
            tag: '[Any Other Offensive]',
            dieSize: 'd8',
            bonus: 0,
            notation: '1d8'
          }
        ],
        description: 'Two powerful attacks with different damage types',
        category: 'multi_dice'
      },
      {
        id: 'riposte',
        name: 'Riposte',
        cost: 1,
        dice: [
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          },
          {
            type: 'defensive',
            tag: '[Block or Evade]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          }
        ],
        description: 'Quick strike followed by defensive positioning',
        category: 'counter'
      },
      {
        id: 'fake_out',
        name: 'Fake Out',
        cost: 2,
        dice: [
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd4',
            bonus: 1,
            notation: '1d4+1'
          },
          {
            type: 'offensive',
            tag: '[Any Other Offensive]',
            dieSize: 'd8',
            bonus: 1,
            notation: '1d8+1'
          }
        ],
        description: 'Feint attack followed by a stronger strike',
        category: 'multi_dice'
      },
      {
        id: 'mixed_defense',
        name: 'Mixed Defense',
        cost: 1,
        dice: [
          {
            type: 'defensive',
            tag: '[Block or Evade]',
            dieSize: 'd8',
            bonus: 0,
            notation: '1d8'
          },
          {
            type: 'defensive',
            tag: '[Block or Evade]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          }
        ],
        description: 'Multiple defensive options',
        category: 'basic_defensive'
      },
      {
        id: 'delayed_strike',
        name: 'Delayed Strike',
        cost: 2,
        dice: [
          {
            type: 'defensive',
            tag: '[Block]',
            dieSize: 'd6',
            bonus: 1,
            notation: '1d6+1'
          },
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd8',
            bonus: 1,
            notation: '1d8+1'
          }
        ],
        description: 'Defensive setup followed by a delayed attack',
        category: 'counter'
      },
      {
        id: 'walled_off',
        name: 'Walled Off',
        cost: 2,
        dice: [
          {
            type: 'defensive',
            tag: '[Block]',
            dieSize: 'd8',
            bonus: 0,
            notation: '1d8'
          },
          {
            type: 'defensive',
            tag: '[Block]',
            dieSize: 'd8',
            bonus: 0,
            notation: '1d8'
          },
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          }
        ],
        description: 'Heavy defensive wall with a counterattack',
        category: 'advanced_defensive'
      },
      {
        id: 'quick_jabs',
        name: 'Quick Jabs',
        cost: 2,
        dice: [
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          },
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd4',
            bonus: 0,
            notation: '1d4'
          },
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd4',
            bonus: 0,
            notation: '1d4'
          }
        ],
        description: 'Multiple rapid attacks',
        category: 'advanced_offensive',
        special: 'No more than two dice can be the same damage type'
      },
      {
        id: 'triple_threat',
        name: 'Triple Threat',
        cost: 2,
        dice: [
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          },
          {
            type: 'defensive',
            tag: '[Block or Evade]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          },
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          }
        ],
        description: 'Balanced mix of offense and defense - can be configured with different damage types',
        category: 'advanced_mixed',
        example: 'Burning Blade: [Slash] 1d6 [Hit] Inflict 3 Burn, [Block] 1d6+1, [Slash] 1d6 [Hit] Inflict 3 Burn'
      },
      {
        id: 'lunge',
        name: 'Lunge',
        cost: 2,
        dice: [
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd8',
            bonus: 1,
            notation: '1d8+1'
          },
          {
            type: 'defensive',
            tag: '[Evade]',
            dieSize: 'd6',
            bonus: 1,
            notation: '1d6+1'
          }
        ],
        description: 'Aggressive attack with evasive movement',
        category: 'advanced_mixed'
      },
      {
        id: 'full_assault',
        name: 'Full Assault',
        cost: 3,
        dice: [
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd8',
            bonus: 0,
            notation: '1d8'
          },
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd8',
            bonus: 0,
            notation: '1d8'
          },
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          }
        ],
        description: 'All-out offensive barrage',
        category: 'advanced_offensive',
        special: 'No more than two dice can be the same damage type'
      },
      {
        id: 'old_reliable',
        name: 'Old Reliable',
        cost: 3,
        dice: [
          {
            type: 'defensive',
            tag: '[Block]',
            dieSize: 'd8',
            bonus: 1,
            notation: '1d8+1'
          },
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd10',
            bonus: 3,
            notation: '1d10+3'
          },
          {
            type: 'defensive',
            tag: '[Block]',
            dieSize: 'd8',
            bonus: 1,
            notation: '1d8+1'
          }
        ],
        description: 'Tried and true defensive setup with powerful counterattack',
        category: 'advanced_mixed'
      },
      {
        id: 'press_on',
        name: 'Press On',
        cost: 3,
        dice: [
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd10',
            bonus: 0,
            notation: '1d10'
          },
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd8',
            bonus: 0,
            notation: '1d8'
          },
          {
            type: 'defensive',
            tag: '[Block or Evade]',
            dieSize: 'd8',
            bonus: 0,
            notation: '1d8'
          }
        ],
        description: 'Relentless advance with defensive backup',
        category: 'advanced_mixed'
      },
      {
        id: 'ready_for_anything',
        name: 'Ready for Anything',
        cost: 3,
        dice: [
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd8',
            bonus: 0,
            notation: '1d8'
          },
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          },
          {
            type: 'defensive',
            tag: '[Block]',
            dieSize: 'd8',
            bonus: 0,
            notation: '1d8'
          },
          {
            type: 'defensive',
            tag: '[Block or Evade]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          }
        ],
        description: 'Versatile skill with multiple options',
        category: 'advanced_mixed'
      },
      {
        id: 'dodge_and_weave',
        name: 'Dodge and Weave',
        cost: 3,
        dice: [
          {
            type: 'defensive',
            tag: '[Evade]',
            dieSize: 'd8',
            bonus: 0,
            notation: '1d8'
          },
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd8',
            bonus: 0,
            notation: '1d8'
          },
          {
            type: 'defensive',
            tag: '[Evade]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          },
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          }
        ],
        description: 'Mobile combat style emphasizing evasion',
        category: 'advanced_evasive'
      },
      {
        id: 'oldest_trick',
        name: 'Oldest Trick',
        cost: 3,
        dice: [
          {
            type: 'defensive',
            tag: '[Evade]',
            dieSize: 'd8',
            bonus: 1,
            notation: '1d8+1'
          },
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd10',
            bonus: 3,
            notation: '1d10+3'
          }
        ],
        description: 'Classic dodge and strike maneuver',
        category: 'advanced_evasive',
        contributor: 'Community Contribution: Tsuchigumo'
      },
      {
        id: 'counter_combo',
        name: 'Counter Combo',
        cost: 3,
        dice: [
          {
            type: 'defensive',
            tag: '[Block]',
            dieSize: 'd8',
            bonus: 1,
            notation: '1d8+1'
          },
          {
            type: 'offensive',
            tag: '[Any Offensive]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6'
          },
          {
            type: 'offensive',
            tag: '[Any Other Offensive]',
            dieSize: 'd8',
            bonus: 1,
            notation: '1d8+1'
          }
        ],
        description: 'Defensive counter followed by combination attacks',
        category: 'advanced_counter',
        contributor: 'Community Contribution: Tsuchigumo'
      },
      // ===================================== UNIQUE SKILLS =====================================
      {
        id: 'sharpened_blade',
        name: 'Sharpened Blade',
        cost: 2,
        dice: [
          {
            type: 'offensive',
            tag: '[Slash]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6',
            effects: []
          },
          {
            type: 'offensive',
            tag: '[Slash]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6',
            effects: ['[Hit] Inflict 3 Burn']
          }
        ],
        modules: [],
        prebuiltEffects: ['[Limit: 5 Uses]'],
        description: '[Slash] 1d6 [Slash] 1d6 [Hit] Inflict 3 Burn',
        category: 'unique',
        isUnique: true
      },
      {
        id: 'ice_shard_unique',
        name: 'Ice Shard',
        cost: 1,
        dice: [
          {
            type: 'offensive',
            tag: '[Pierce]',
            dieSize: 'd8',
            bonus: 3,
            notation: '1d8+3',
            effects: ['[Hit] Inflict 2 Fragile']
          }
        ],
        modules: [
          { id: 'stronger', rank: 1, targetDie: 0 },
          { id: 'stronger', rank: 1, targetDie: 0 },
          { id: 'fragile', rank: 1, targetDie: 0 },
          { id: 'penetration', rank: 2 }
        ],
        prebuiltEffects: [],
        description: '[Pierce] 1d8+3 [Hit] Inflict 2 Fragile [Penetration]\n\nModules: T1: Stronger x2, Fragile | T2: Penetration',
        category: 'unique',
        isUnique: true
      },
      {
        id: 'shadow_step_unique',
        name: 'Shadow Step',
        cost: 2,
        dice: [
          {
            type: 'defensive',
            tag: '[Evade]',
            dieSize: 'd8',
            bonus: 1,
            notation: '1d8+1',
            effects: []
          },
          {
            type: 'offensive',
            tag: '[Slash]',
            dieSize: 'd8',
            bonus: 1,
            notation: '1d8+1',
            effects: ['[Hit] Gain +1 Power next turn']
          }
        ],
        modules: [
          { id: 'stronger', rank: 1, targetDie: 0 },
          { id: 'stronger', rank: 1, targetDie: 1 },
          { id: 'range', rank: 1 },
          { id: 'charge', rank: 2 }
        ],
        prebuiltEffects: ['[Range] This skill can target at range'],
        description: '[Range] This skill can target at range\n\n[Evade] 1d8+1\n[Slash] 1d8+1 [Hit] Gain +1 Power next turn [Charge]\n\nModules: T1: Stronger x2, Range | T2: Charge',
        category: 'unique',
        isUnique: true
      },
      {
        id: 'overwhelming_force_unique',
        name: 'Overwhelming Force',
        cost: 3,
        dice: [
          {
            type: 'offensive',
            tag: '[Blunt]',
            dieSize: 'd10',
            bonus: 5,
            notation: '1d10+5',
            effects: []
          },
          {
            type: 'offensive',
            tag: '[Blunt]',
            dieSize: 'd8',
            bonus: 0,
            notation: '1d8',
            effects: []
          }
        ],
        modules: [
          { id: 'power_up_2', rank: 2, targetDie: 0 },
          { id: 'power_up_3', rank: 3, targetDie: 0 },
          { id: 'overwhelm', rank: 2 },
          { id: 'finisher', rank: 3 }
        ],
        prebuiltEffects: ['[Overwhelm] Ignore enemy defensive dice if power difference is 5+', '[Finisher] +5 Power if target is below 50% HP'],
        description: '[Overwhelm] Ignore enemy defensive dice if power difference is 5+\n[Finisher] +5 Power if target is below 50% HP\n\n[Blunt] 1d10+5\n[Blunt] 1d8\n\nModules: T2: Power Up II | T3: Power Up III, Finisher',
        category: 'unique',
        isUnique: true
      },
      {
        id: 'healing_light_unique',
        name: 'Healing Light',
        cost: 1,
        dice: [
          {
            type: 'defensive',
            tag: '[Block]',
            dieSize: 'd6',
            bonus: 0,
            notation: '1d6',
            effects: []
          }
        ],
        modules: [
          { id: 'stronger', rank: 1, targetDie: 0 },
          { id: 'stronger', rank: 1, targetDie: 0 },
          { id: 'clash_win', rank: 1 },
          { id: 'curative', rank: 2 }
        ],
        prebuiltEffects: ['[On Use] Reduce 1 Ailment on self by 3', '[Clash Win] Recover 5 HP'],
        description: '[On Use] Reduce 1 Ailment on self by 3\n[Clash Win] Recover 5 HP\n\n[Block] 1d6\n\nModules: T1: Stronger x2, Clash Win | T2: Curative',
        category: 'unique',
        isUnique: true
      }
    ];
  }

  // Get all skill bases
  getAllBases() {
    return this.skillBases;
  }

  // Get bases by cost
  getBasesByCost(cost) {
    return this.skillBases.filter(base => base.cost === cost);
  }

  // Get bases by category
  getBasesByCategory(category) {
    return this.skillBases.filter(base => base.category === category);
  }

  // Get base by ID
  getBaseById(id) {
    return this.skillBases.find(base => base.id === id);
  }

  // Get bases that have offensive dice
  getOffensiveBases() {
    return this.skillBases.filter(base => 
      base.dice.some(die => die.type === 'offensive')
    );
  }

  // Get bases that have defensive dice
  getDefensiveBases() {
    return this.skillBases.filter(base => 
      base.dice.some(die => die.type === 'defensive')
    );
  }

  // Get bases suitable for E.G.O (cost 2 or higher)
  getEgoBases() {
    return this.skillBases.filter(base => base.cost >= 2);
  }

  // Get unique skills (complete pre-built skills)
  getUniqueSkills() {
    return this.skillBases.filter(base => base.isUnique === true);
  }

  // Get regular bases (non-unique)
  getRegularBases() {
    return this.skillBases.filter(base => !base.isUnique);
  }

  // Check if a base is a unique skill
  isUniqueSkill(baseId) {
    const base = this.getBaseById(baseId);
    return base ? base.isUnique === true : false;
  }

  // Get all categories
  getCategories() {
    const categories = [...new Set(this.skillBases.map(base => base.category))];
    return categories.sort();
  }

  // Get cost range
  getCostRange() {
    const costs = this.skillBases.map(base => base.cost);
    return {
      min: Math.min(...costs),
      max: Math.max(...costs)
    };
  }

  // Calculate total dice count for a base
  getTotalDiceCount(baseId) {
    const base = this.getBaseById(baseId);
    return base ? base.dice.length : 0;
  }

  // Get power level estimation (rough calculation based on dice and bonuses)
  getBasePowerLevel(baseId) {
    const base = this.getBaseById(baseId);
    if (!base) return 0;

    let powerLevel = 0;
    base.dice.forEach(die => {
      // Rough power calculation: die size average + bonus
      const dieValue = parseInt(die.dieSize.replace('d', ''));
      const averageRoll = (dieValue + 1) / 2;
      powerLevel += averageRoll + (die.bonus || 0);
    });

    return Math.round(powerLevel);
  }

  // Validate base for skill creation
  validateBase(baseId) {
    const base = this.getBaseById(baseId);
    if (!base) return { valid: false, error: 'Base not found' };

    const errors = [];
    
    // Check if base has at least one die
    if (!base.dice || base.dice.length === 0) {
      errors.push('Base must have at least one die');
    }

    // Check die structure
    base.dice.forEach((die, index) => {
      if (!die.type || !die.tag || !die.dieSize) {
        errors.push(`Die ${index + 1} is missing required properties`);
      }
    });

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Format base for display
  formatBaseForDisplay(baseId) {
    const base = this.getBaseById(baseId);
    if (!base) return null;

    return {
      name: base.name,
      cost: base.cost,
      diceDisplay: base.dice.map(die => `${die.tag} ${die.notation}`).join(', '),
      description: base.description,
      category: base.category,
      powerLevel: this.getBasePowerLevel(baseId),
      special: base.special || null,
      contributor: base.contributor || null
    };
  }

  // Search bases by name or description
  searchBases(query) {
    const searchTerm = query.toLowerCase();
    return this.skillBases.filter(base => 
      base.name.toLowerCase().includes(searchTerm) ||
      base.description.toLowerCase().includes(searchTerm) ||
      base.category.toLowerCase().includes(searchTerm)
    );
  }
}

// Export singleton instance
export const skillBasesManager = new SkillBasesManager();
