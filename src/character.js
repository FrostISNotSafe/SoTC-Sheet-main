import { ref, set, get, update, push } from 'firebase/database';
import { database } from './firebase.js';
import { skillBasesManager } from './skillBases.js';
import { skillModulesManager } from './skillModules.js';

export class CharacterManager {
  constructor(userId) {
    this.userId = userId;
    this.currentCharacter = null;
    this.levelProgression = this.initializeLevelProgression();
    this.maxLevel = 17;
  }

  // Initialize the level progression table
  initializeLevelProgression() {
    return {
      1: { stats: 'base', modules: 'base', skills: 4, improvements: null, ego: null, hpBonus: 0, egoBonus: null },
      2: { stats: { increase: 1, max: 3 }, modules: { rank1: 1 }, skills: 4, improvements: null, ego: 'create_base', hpBonus: 0, egoBonus: null },
      3: { stats: { increase: 1 }, modules: { rank2: 1 }, skills: 5, improvements: 'minor', ego: null, hpBonus: 0, egoBonus: null },
      4: { stats: null, modules: null, skills: 5, improvements: 'major', ego: null, hpBonus: 0, egoBonus: null },
      5: { stats: { increase: 1 }, modules: { rank2: 1 }, skills: 5, improvements: 'minor', ego: null, hpBonus: 0, egoBonus: null },
      6: { stats: { increase: 1, max: 3 }, modules: { rank3: 1 }, skills: 6, improvements: null, ego: { rank1: 1 }, hpBonus: 10, egoBonus: null },
      7: { stats: { increase: 1 }, modules: { rank1: 1 }, skills: 6, improvements: 'minor', ego: null, hpBonus: 0, egoBonus: null },
      8: { stats: null, modules: null, skills: 6, improvements: 'major', ego: null, hpBonus: 0, egoBonus: null },
      9: { stats: { increase: 1 }, modules: { rank3: 1 }, skills: 7, improvements: null, ego: { rank2: 1 }, hpBonus: 10, egoBonus: null },
      10: { stats: { increase: 1, max: 5 }, modules: null, skills: 7, improvements: 'minor', ego: null, hpBonus: 0, egoBonus: null },
      11: { stats: { increase: 1 }, modules: { rank2: 1 }, skills: 7, improvements: null, ego: null, hpBonus: 0, egoBonus: null },
      12: { stats: null, modules: null, skills: 7, improvements: 'major', ego: null, hpBonus: 0, egoBonus: null },
      13: { stats: { increase: 1 }, modules: { rank3: 1 }, skills: 8, improvements: null, ego: { rank3: 1 }, hpBonus: 10, egoBonus: null },
      14: { stats: { increase: 1, max: 5 }, modules: { rank2: 1 }, skills: 8, improvements: 'minor', ego: null, hpBonus: 0, egoBonus: null },
      15: { stats: { increase: 1 }, modules: null, skills: 8, improvements: 'major', ego: null, hpBonus: 0, egoBonus: null },
      16: { stats: null, modules: { rank3: 1 }, skills: 9, improvements: 'minor', ego: null, hpBonus: 0, egoBonus: null },
      17: { stats: { increase: 1 }, modules: { rank3: 1 }, skills: 9, improvements: 'minor', ego: null, hpBonus: 0, egoBonus: null }
    };
  }

  // Get available minor improvements
  getMinorImprovements() {
    return [
      { id: 'max_light', name: 'Increase Max Light', description: 'Increase Max Light by 1', repeatable: true },
      { id: 'affinities', name: 'Improve Affinities', description: 'Add -1 to one damage affinity and -1 to one stagger affinity', repeatable: true },
      { id: 'hp_stagger', name: 'Increase Survivability', description: 'Increase your HP by 10 and Stagger Resist by 5', repeatable: true },
      { id: 'story_ability', name: 'New Story Ability', description: 'Gain a new Story Ability from another Archetype', repeatable: true }
    ];
  }

  // Get available major improvements
  getMajorImprovements() {
    return [
      { id: 'max_light_scene', name: 'Enhanced Light Recovery', description: 'Increase Max Light by 1, regain 1 additional Light at the start of each Scene', repeatable: false },
      { id: 'speed_die', name: 'Additional Speed Die', description: 'Gain an additional Speed Die every scene', repeatable: false },
      { id: 'battle_ability', name: 'New Battle Ability', description: 'Gain a new Battle Ability from another Archetype', repeatable: false },
      { id: 'stat_boost', name: 'Major Stat Increase', description: 'Increase 2 different stats by 1, and another stat by 2', repeatable: false }
    ];
  }

  // Get Base E.G.O passive options
  getBaseEgoPassives() {
    return [
      { id: 'power_boost', name: 'Power Surge', description: 'When this E.G.O hits, gain +1 Power on all dice for the rest of the scene' },
      { id: 'defensive', name: 'Aegis Protocol', description: 'When this E.G.O is used defensively, reduce incoming damage by 2' },
      { id: 'healing', name: 'Life Essence', description: 'When this E.G.O hits, recover 5 HP' },
      { id: 'stagger_recovery', name: 'Mental Fortitude', description: 'When this E.G.O hits, recover 3 Stagger Resist' },
      { id: 'light_recovery', name: 'Illumination', description: 'Using this E.G.O recovers 1 Light' },
      { id: 'emotion_efficiency', name: 'Emotional Control', description: 'This E.G.O costs 1 less Emotion Point (minimum 1)' }
    ];
  }

  // Create a new character with default values
  createNewCharacter() {
    return {
      // Basic Info
      name: '',
      archetype: '',
      level: 1,
      experience: 0,
      maxLevel: 17,
      
      // Core Stats (assign 4, 3, 3, 2, 2, 1)
      stats: {
        might: 1,
        vitality: 1,
        agility: 1,
        intellect: 1,
        instinct: 1,
        persona: 1
      },
      
      // Derivative Stats (calculated)
      derivativeStats: {
        hp: 40, // 30 + 10x Might
        currentHp: 40, // Track current HP
        staggerResist: 20, // 15 + 5x Vitality
        currentStaggerResist: 20, // Track current Stagger Resist
        speedDieSize: 'd6', // Based on Agility
        maxLight: 3, // Base 3, +1 at Instinct 3,5,7
        currentLight: 3,
        emotionPoints: 1, // Equal to Persona
        currentEmotionPoints: 1 // Track current EP
      },
      
      // Affinities (damage and stagger)
      affinities: {
        damage: {
          slash: 0,
          pierce: 0,
          blunt: 0
        },
        stagger: {
          slash: 0,
          pierce: 0,
          blunt: 0
        },
        weakness: null // Will be set during character creation
      },
      
      // Skills (4 base skills)
      skills: [],
      
      // E.G.O (unlocked at level 2)
      ego: {
        base: null,
        additional: []
      },
      
      // Milestone abilities gained from stats
      milestones: {
        might: [],
        vitality: [],
        agility: [],
        intellect: [],
        instinct: [],
        persona: []
      },
      
      // Spare Skill Modules
      spareModules: {
        rank1: 0, // Equal to Intellect
        rank2: 0,
        rank3: 0
      },
      
      // Character details
      details: {
        appearance: '',
        backstory: '',
        notes: ''
      },
      
      // Progression tracking
      progression: {
        statIncreases: [],
        levelUpHistory: [], // Track what was gained at each level
        improvements: {
          minor: [],
          major: []
        },
        egoRankBonuses: {
          rank1: 0,
          rank2: 0,
          rank3: 0
        },
        availableStatIncreases: 0, // Stat increases pending assignment
        pendingLevelUps: [], // Levels that haven't been fully processed
        majorImprovementsUsed: [], // Track which major improvements have been used
        baseEgoCreated: false // Track if base E.G.O has been created
      },
      
      // Metadata
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
  }

  // Calculate derivative stats based on core stats
  calculateDerivativeStats(character) {
    const stats = character.stats;

    // HP = 30 + 10x Might
    const newMaxHp = 30 + (10 * stats.might);
    character.derivativeStats.hp = newMaxHp;
    // Only update current HP if it's the first time or if max increased
    if (!character.derivativeStats.currentHp || character.derivativeStats.currentHp > newMaxHp) {
      character.derivativeStats.currentHp = newMaxHp;
    }

    // Stagger Resist = 15 + 5x Vitality
    const newMaxStagger = 15 + (5 * stats.vitality);
    character.derivativeStats.staggerResist = newMaxStagger;
    // Only update current if it's the first time or if max increased
    if (!character.derivativeStats.currentStaggerResist || character.derivativeStats.currentStaggerResist > newMaxStagger) {
      character.derivativeStats.currentStaggerResist = newMaxStagger;
    }

    // Speed Die Size based on Agility
    if (stats.agility <= 2) character.derivativeStats.speedDieSize = 'd6';
    else if (stats.agility <= 4) character.derivativeStats.speedDieSize = 'd8';
    else if (stats.agility <= 6) character.derivativeStats.speedDieSize = 'd10';
    else character.derivativeStats.speedDieSize = 'd12';

    // Max Light = 3 + bonuses from Instinct
    let maxLight = 3;
    if (stats.instinct >= 3) maxLight++;
    if (stats.instinct >= 5) maxLight++;
    if (stats.instinct >= 7) maxLight++;
    character.derivativeStats.maxLight = maxLight;
    // Keep current light within bounds
    if (character.derivativeStats.currentLight > maxLight) {
      character.derivativeStats.currentLight = maxLight;
    }

    // Emotion Points = Persona
    const newMaxEP = stats.persona;
    character.derivativeStats.emotionPoints = newMaxEP;
    // Only update current if it's the first time or if max increased
    if (!character.derivativeStats.currentEmotionPoints || character.derivativeStats.currentEmotionPoints > newMaxEP) {
      character.derivativeStats.currentEmotionPoints = newMaxEP;
    }

    // Spare Rank 1 Modules = Intellect
    character.spareModules.rank1 = stats.intellect;

    return character;
  }

  // Calculate milestone abilities based on stats
  calculateMilestones(character) {
    const stats = character.stats;
    const milestones = { might: [], vitality: [], agility: [], intellect: [], instinct: [], persona: [] };
    
    // Might milestones
    if (stats.might >= 4) milestones.might.push('On hit with Offensive Dice, deal an additional 1 point of damage (not Stagger)');
    if (stats.might >= 6) milestones.might.push('Increase the damage bonus of the previous Milestone to 2.');
    if (stats.might >= 8) milestones.might.push('All offensive Dice (Including those on E.G.O) gain +1 Power.');

    // Vitality milestones
    if (stats.vitality >= 4) milestones.vitality.push('On Clash Win with Defensive Dice, deal an additional 1 point of Stagger');
    if (stats.vitality >= 6) milestones.vitality.push('Your Block Dice gain +1 Power (Includes E.G.O Skills).');
    if (stats.vitality >= 8) milestones.vitality.push('Your weakness is now an affinity of 0, it still cannot be increased permanently beyond this. In addition, increase the Stagger bonus of the first milestone to 2.');

    // Agility milestones
    if (stats.agility >= 4) milestones.agility.push('Your Evade Dice have their die size increased by 1 stage (d6 to d8, etc., includes E.G.O Skills)');
    if (stats.agility >= 6) milestones.agility.push('You gain an additional Speed Die starting from the 3rd Scene of combat.');
    if (stats.agility >= 8) milestones.agility.push('The previous Milestone now gives an extra Speed Die on all Scenes.');

    // Intellect milestones
    if (stats.intellect >= 4) milestones.intellect.push('You gain 2 additional Spare Tier 2 Skill Modules.');
    if (stats.intellect >= 5) milestones.intellect.push('You gain 1 additional Spare Tier 2 Skill Module.');
    if (stats.intellect >= 6) milestones.intellect.push('All of your skills gain an additional Rank 1 Innate Module. Your Base E.G.O gains an additional Rank 2 Module.');
    if (stats.intellect >= 7) milestones.intellect.push('You gain 1 additional Spare Tier 2 Skill Module.');
    if (stats.intellect >= 8) milestones.intellect.push('You gain 2 additional Spare Tier 3 Skill Modules.');

    // Instinct milestones
    if (stats.instinct >= 4) milestones.instinct.push('You regain 1 more Light at the start of odd-numbered scenes.');
    if (stats.instinct >= 6) milestones.instinct.push('Your limited-use skills have 2 more maximum uses.');
    if (stats.instinct >= 8) milestones.instinct.push('The first Milestone now applies to all scenes.');

    // Persona milestones
    if (stats.persona >= 4) milestones.persona.push('Increase the power of all Dice on your E.G.O Skills by 1 (This benefit applies to Counter Dice as well). Single-Die E.G.O gain +2 instead.');
    if (stats.persona >= 5) milestones.persona.push('Gain a new Story Ability from another Archetype.');
    if (stats.persona >= 6) milestones.persona.push('Reduce the Emotion Points required to use ZAYIN, TETH, and HE E.G.O skills by 1. Reduce the Emotion Points required to use WAW and ALEPH E.G.O skills by 2.');
    if (stats.persona >= 7) milestones.persona.push('Increase the power of all Dice on your E.G.O Skills by an additional 1 (This benefit applies to Counter Dice as well). Single-Die E.G.O gain +2 instead.');
    if (stats.persona >= 8) milestones.persona.push('Choose a Base E.G.O passive, you gain this passive, and it is always active. If you choose the same Passive as your Base E.G.O, remove it from your Base E.G.O and choose a new Base Passive to replace it with. This counts as an E.G.O passive for all effects that require them.');

    character.milestones = milestones;
    return character;
  }

  // Validate stat distribution (no restriction)
  validateStatDistribution(stats) {
    return true;
  }

  // Save character to Firebase
  async saveCharacter(character) {
    try {
      character.lastModified = new Date().toISOString();
      character = this.calculateDerivativeStats(character);
      character = this.calculateMilestones(character);
      
      let characterRef;
      if (character.id) {
        // Update existing character
        characterRef = ref(database, `characters/${this.userId}/${character.id}`);
        await update(characterRef, character);
      } else {
        // Create new character
        const charactersRef = ref(database, `characters/${this.userId}`);
        characterRef = push(charactersRef);
        character.id = characterRef.key;
        await set(characterRef, character);
      }
      
      this.currentCharacter = character;
      return { success: true, character };
    } catch (error) {
      console.error('Error saving character:', error);
      return { success: false, error: error.message };
    }
  }

  // Load all characters for user
  async loadCharacters() {
    try {
      const charactersRef = ref(database, `characters/${this.userId}`);
      const snapshot = await get(charactersRef);
      
      if (snapshot.exists()) {
        const characters = [];
        snapshot.forEach((childSnapshot) => {
          characters.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return { success: true, characters };
      } else {
        return { success: true, characters: [] };
      }
    } catch (error) {
      console.error('Error loading characters:', error);
      return { success: false, error: error.message };
    }
  }

  // Load specific character
  async loadCharacter(characterId) {
    try {
      const characterRef = ref(database, `characters/${this.userId}/${characterId}`);
      const snapshot = await get(characterRef);
      
      if (snapshot.exists()) {
        const character = { id: characterId, ...snapshot.val() };
        this.currentCharacter = character;
        return { success: true, character };
      } else {
        return { success: false, error: 'Character not found' };
      }
    } catch (error) {
      console.error('Error loading character:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete character
  async deleteCharacter(characterId) {
    try {
      const characterRef = ref(database, `characters/${this.userId}/${characterId}`);
      await set(characterRef, null);
      return { success: true };
    } catch (error) {
      console.error('Error deleting character:', error);
      return { success: false, error: error.message };
    }
  }

  // Get archetype list
  getArchetypes() {
    return [
      'Fixer',
      'Librarian',
      'Abnormality',
      'Distortion',
      'Syndicate Member',
      'Corporation Employee',
      'Custom'
    ];
  }

  // Get skill bases (using new skill bases system)
  getSkillBases() {
    return skillBasesManager.getAllBases();
  }

  // Get skill modules (using new skill modules system)
  getSkillModules() {
    return skillModulesManager.getAllModules();
  }

  // Get skill modules by rank
  getSkillModulesByRank(rank) {
    return skillModulesManager.getModulesByRank(rank);
  }

  // Create custom skill from base and modules
  createCustomSkill(skillData) {
    const { name, baseId, modules, description } = skillData;

    // Get the base skill
    const base = skillBasesManager.getBaseById(baseId);
    if (!base) {
      return { success: false, error: 'Invalid skill base' };
    }

    // Validate modules
    const moduleValidation = skillModulesManager.validateSkillBuild(baseId, modules);
    if (!moduleValidation.valid) {
      return { success: false, error: moduleValidation.errors.join(', ') };
    }

    // Create the skill object
    const skill = {
      id: this.generateSkillId(),
      name: name || base.name,
      description: description || base.description,
      baseId: baseId,
      baseName: base.name,
      cost: base.cost,
      dice: [...base.dice], // Copy base dice
      modules: modules || [],
      tags: [],
      type: 'custom',
      createdAt: new Date().toISOString()
    };

    // Apply modules to the skill
    this.applyModulesToSkill(skill);

    return { success: true, skill };
  }

  // Aplica módulos à skill e monta efeitos já resolvidos e descrição
  applyModulesToSkill(skill) {
    // Adiciona campo effects e description
    skill.effects = [];
    // Deixar todos os dados com .effects
    skill.dice.forEach(die => { die.effects = []; });

    skill.modules.forEach(moduleRef => {
      const module = skillModulesManager.getModuleById(moduleRef.id, moduleRef.rank);
      if (!module) return;

      // Add tag if module has one
      if (module.tag && !skill.tags.includes(module.tag)) {
        skill.tags.push(module.tag);
      }

      // Aplicar efeitos calculados e tags nos dados
      this.applyModuleEffect(skill, module, moduleRef);
    });

    // Gerar descrição final igual ao manual
    skill.description = this.buildSkillDescription(skill);
  }

  // Gera uma descrição formatada da skill, estilo template/manual
  buildSkillDescription(skill) {
    // 1. Efeitos globais (ex: [On Use])
    let lines = [];
    // Procurar efeitos globais ou tags globais como [On Use]
    (skill.effects || []).forEach(eff => {
      if(eff.tag && (eff.tag.includes('[On Use]') || eff.tag.includes('[Clash Win]') || eff.tag.includes('[Clash Lose]')) ) {
        // Exemplo simples para [On Use]
        // Generalização: aqui pode haver cálculo, exemplo: '[On Use] Reduce 1 Ailment on self by {Cost+2}'
        let text = eff.effect.replace('{Cost}', skill.cost).replace('{Cost+2}', skill.cost + 2).replace('{Cost+1}', skill.cost + 1);
        lines.push(`${eff.tag} ${text}`);
      }
    });

    // 2. Cada dado: tag, notação, efeitos
    skill.dice.forEach(die => {
      let parts = [];
      if(die.tag) parts.push(die.tag);
      if(die.notation) parts.push(die.notation);
      if((die.effects||[]).length)
        parts.push(die.effects.map(eff => eff.replace('{Cost+1}', skill.cost+1).replace('{Cost}', skill.cost)).join(' '));
      lines.push(parts.join(' '));
    });

    // 3. Listar módulos usados (por rank)
    let modlist = (skill.modules||[]).map(m => {
      const module = skillModulesManager.getModuleById(m.id, m.rank);
      return module ? `T${m.rank}: ${module.name}` : ''; 
    }).filter(Boolean);
    if(modlist.length)
      lines.push('\nModules: ' + modlist.join(', '));
    return lines.join('\n');
  }

  // Apply specific module effect to skill
  applyModuleEffect(skill, module, moduleRef) {
    switch (module.id) {
      case 'power_up':
      case 'power_up_2':
      case 'power_up_3':
        // Apply power bonus to specified die (or first die if not specified)
        const targetDieIndex = moduleRef.targetDie || 0;
        if (skill.dice[targetDieIndex]) {
          const powerBonus = parseInt(module.effect.match(/\+(\d+)/)[1]);
          skill.dice[targetDieIndex].bonus = (skill.dice[targetDieIndex].bonus || 0) + powerBonus;
          skill.dice[targetDieIndex].notation = this.updateDieNotation(skill.dice[targetDieIndex]);
        }
        break;

      case 'slash':
      case 'pierce':
      case 'blunt':
        // Change damage type
        const targetDie = moduleRef.targetDie || 0;
        if (skill.dice[targetDie] && skill.dice[targetDie].type === 'offensive') {
          skill.dice[targetDie].damageType = module.id;
          skill.dice[targetDie].tag = skill.dice[targetDie].tag.replace('[Any Offensive]', `[${module.id.charAt(0).toUpperCase() + module.id.slice(1)}]`);
        }
        break;

      default:
        // For other modules, just store the effect for later processing
        if (!skill.effects) skill.effects = [];
        skill.effects.push({
          moduleId: module.id,
          effect: module.effect,
          tag: module.tag
        });
        break;
    }
  }

  // Update die notation after modifications
  updateDieNotation(die) {
    const bonus = die.bonus || 0;
    if (bonus > 0) {
      return `1${die.dieSize}+${bonus}`;
    } else if (bonus < 0) {
      return `1${die.dieSize}${bonus}`;
    } else {
      return `1${die.dieSize}`;
    }
  }

  // Generate unique skill ID
  generateSkillId() {
    return 'skill_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Validate skill creation requirements
  validateSkillCreation(character, skillData) {
    const errors = [];

    // Check if character has enough skill slots
    const currentSkills = character.skills?.length || 0;
    const maxSkills = this.getLevelBenefits(character.level)?.totalSkills || 4;

    if (currentSkills >= maxSkills) {
      errors.push(`Maximum skills reached (${maxSkills})`);
    }

    // Check if character has enough modules
    const moduleCost = skillModulesManager.calculateModuleCost(skillData.modules, character.spareModules);

    if (!moduleCost.canAfford.rank1) {
      errors.push(`Not enough Rank 1 modules (need ${moduleCost.cost.rank1}, have ${character.spareModules.rank1})`);
    }
    if (!moduleCost.canAfford.rank2) {
      errors.push(`Not enough Rank 2 modules (need ${moduleCost.cost.rank2}, have ${character.spareModules.rank2})`);
    }
    if (!moduleCost.canAfford.rank3) {
      errors.push(`Not enough Rank 3 modules (need ${moduleCost.cost.rank3}, have ${character.spareModules.rank3})`);
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      moduleCost: moduleCost
    };
  }

  // Add skill to character
  addSkillToCharacter(character, skillData) {
    // Validate skill creation
    const validation = this.validateSkillCreation(character, skillData);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    // Create the skill
    const skillResult = this.createCustomSkill(skillData);
    if (!skillResult.success) {
      return skillResult;
    }

    // Add skill to character
    if (!character.skills) character.skills = [];
    character.skills.push(skillResult.skill);

    // Deduct modules
    const moduleCost = validation.moduleCost.cost;
    character.spareModules.rank1 -= moduleCost.rank1;
    character.spareModules.rank2 -= moduleCost.rank2;
    character.spareModules.rank3 -= moduleCost.rank3;

    return { success: true, skill: skillResult.skill, character };
  }

  // Remove skill from character
  removeSkillFromCharacter(character, skillId) {
    const skillIndex = character.skills?.findIndex(skill => skill.id === skillId);
    if (skillIndex === -1) {
      return { success: false, error: 'Skill not found' };
    }

    const skill = character.skills[skillIndex];

    // Return modules to character
    skill.modules.forEach(moduleRef => {
      if (moduleRef.rank === 1 || moduleRef.rank === 'rank1') {
        character.spareModules.rank1++;
      } else if (moduleRef.rank === 2 || moduleRef.rank === 'rank2') {
        character.spareModules.rank2++;
      } else if (moduleRef.rank === 3 || moduleRef.rank === 'rank3') {
        character.spareModules.rank3++;
      }
    });

    // Remove skill
    character.skills.splice(skillIndex, 1);

    return { success: true, character };
  }

  // Level up character
  async levelUpCharacter(character, targetLevel = null) {
    if (!character) return { success: false, error: 'No character provided' };

    const currentLevel = character.level || 1;
    const newLevel = targetLevel || (currentLevel + 1);

    if (newLevel > 17) {
      return { success: false, error: 'Maximum level is 17' };
    }

    if (newLevel <= currentLevel) {
      return { success: false, error: 'New level must be higher than current level' };
    }

    // Process each level from current+1 to newLevel
    for (let level = currentLevel + 1; level <= newLevel; level++) {
      const levelData = this.levelProgression[level];
      if (!levelData) continue;

      character.level = level;

      // Track level up history
      const levelUpData = {
        level: level,
        timestamp: new Date().toISOString(),
        applied: false
      };

      character.progression.levelUpHistory.push(levelUpData);
      character.progression.pendingLevelUps.push(level);
    }

    return { success: true, character };
  }

  // Apply level benefits
  async applyLevelBenefits(character, level) {
    const levelData = this.levelProgression[level];
    if (!levelData) return { success: false, error: 'Invalid level' };

    const benefits = {
      statsApplied: false,
      modulesApplied: false,
      improvementApplied: false,
      egoApplied: false,
      hpApplied: false
    };

    // Apply stat increases
    if (levelData.stats && levelData.stats !== 'base') {
      if (levelData.stats.increase) {
        character.progression.availableStatIncreases += levelData.stats.increase;
        if (levelData.stats.max) {
          // Store the max limit for this stat increase
          character.progression.statIncreases.push({
            level: level,
            amount: levelData.stats.increase,
            maxLimit: levelData.stats.max,
            applied: false
          });
        } else {
          character.progression.statIncreases.push({
            level: level,
            amount: levelData.stats.increase,
            applied: false
          });
        }
      }
      benefits.statsApplied = true;
    }

    // Apply skill modules
    if (levelData.modules && levelData.modules !== 'base') {
      Object.entries(levelData.modules).forEach(([rank, amount]) => {
        const rankKey = `rank${rank.replace('rank', '')}`;
        character.spareModules[rankKey] = (character.spareModules[rankKey] || 0) + amount;
      });
      benefits.modulesApplied = true;
    }

    // Apply HP bonus
    if (levelData.hpBonus > 0) {
      character.derivativeStats.hp += levelData.hpBonus;
      character.derivativeStats.currentHp += levelData.hpBonus;
      benefits.hpApplied = true;
    }

    // Apply E.G.O bonuses
    if (levelData.ego) {
      if (typeof levelData.ego === 'string' && levelData.ego === 'create_base') {
        // Level 2: Create Base E.G.O
        character.progression.baseEgoCreated = false; // Requires manual creation
      } else if (typeof levelData.ego === 'object') {
        // Add E.G.O rank bonuses
        Object.entries(levelData.ego).forEach(([rank, amount]) => {
          const rankKey = `rank${rank.replace('rank', '')}`;
          character.progression.egoRankBonuses[rankKey] += amount;
        });
      }
      benefits.egoApplied = true;
    }

    // Mark improvement as available
    if (levelData.improvements) {
      // This will be handled by the UI for player choice
      benefits.improvementApplied = false; // Requires manual selection
    }

    // Remove level from pending
    character.progression.pendingLevelUps = character.progression.pendingLevelUps.filter(l => l !== level);

    // Update level up history
    const historyEntry = character.progression.levelUpHistory.find(h => h.level === level);
    if (historyEntry) {
      historyEntry.applied = true;
      historyEntry.benefits = benefits;
    }

    return { success: true, character, benefits };
  }

  // Apply stat increase
  async applyStatIncrease(character, statName, increaseData) {
    if (!character.stats[statName]) {
      return { success: false, error: 'Invalid stat name' };
    }

    // Check max limit if applicable
    if (increaseData.maxLimit && character.stats[statName] >= increaseData.maxLimit) {
      return { success: false, error: `Cannot increase ${statName} above ${increaseData.maxLimit}` };
    }

    character.stats[statName]++;
    character.progression.availableStatIncreases--;
    increaseData.applied = true;
    increaseData.appliedTo = statName;

    // Recalculate derivative stats and milestones
    character = this.calculateDerivativeStats(character);
    character = this.calculateMilestones(character);

    return { success: true, character };
  }

  // Apply improvement
  async applyImprovement(character, improvementType, improvementId, details = {}) {
    // Validate improvement type
    if (improvementType !== 'minor' && improvementType !== 'major') {
      return { success: false, error: 'Invalid improvement type' };
    }

    // For major improvements, check if already used
    if (improvementType === 'major' && character.progression.majorImprovementsUsed.includes(improvementId)) {
      return { success: false, error: 'Major improvement already used' };
    }

    const improvement = {
      type: improvementType,
      id: improvementId,
      timestamp: new Date().toISOString(),
      details: details
    };

    if (improvementType === 'minor') {
      character.progression.improvements.minor.push(improvement);

      // Apply the improvement effect
      switch (improvementId) {
        case 'max_light':
          character.derivativeStats.maxLight++;
          if (character.derivativeStats.currentLight > character.derivativeStats.maxLight) {
            character.derivativeStats.currentLight = character.derivativeStats.maxLight;
          }
          break;
        case 'affinities':
          // Effects are applied during selection dialog
          break;
        case 'hp_stagger':
          character.derivativeStats.hp += 10;
          character.derivativeStats.currentHp += 10;
          character.derivativeStats.staggerResist += 5;
          character.derivativeStats.currentStaggerResist += 5;
          break;
        case 'story_ability':
          // Store the ability gained
          if (details.abilityName) {
            if (!character.extraArchetypeAbilities) character.extraArchetypeAbilities = [];
            character.extraArchetypeAbilities.push(details.abilityName);
          }
          break;
        default:
          return { success: false, error: 'Unknown minor improvement' };
      }
    } else if (improvementType === 'major') {
      character.progression.improvements.major.push(improvement);
      character.progression.majorImprovementsUsed.push(improvementId);

      // Apply the improvement effect
      switch (improvementId) {
        case 'max_light_scene':
          character.derivativeStats.maxLight++;
          if (character.derivativeStats.currentLight > character.derivativeStats.maxLight) {
            character.derivativeStats.currentLight = character.derivativeStats.maxLight;
          }
          // Additional light recovery is tracked as a passive effect
          if (!character.passiveEffects) character.passiveEffects = [];
          character.passiveEffects.push('Enhanced Light Recovery: +1 Light at start of each scene');
          break;
        case 'speed_die':
          // Additional speed die is tracked as a passive effect
          if (!character.passiveEffects) character.passiveEffects = [];
          character.passiveEffects.push('Additional Speed Die: Gain +1 Speed Die every scene');
          break;
        case 'battle_ability':
          // Store the ability gained
          if (details.abilityName) {
            if (!character.extraBattleAbilities) character.extraBattleAbilities = [];
            character.extraBattleAbilities.push(details.abilityName);
          }
          break;
        case 'stat_boost':
          // Effects are applied during selection dialog
          break;
        default:
          return { success: false, error: 'Unknown major improvement' };
      }
    }

    return { success: true, character };
  }

  // Create Base E.G.O
  async createBaseEgo(character, egoData) {
    if (character.level < 2) {
      return { success: false, error: 'Base E.G.O requires level 2' };
    }

    if (character.progression.baseEgoCreated) {
      return { success: false, error: 'Base E.G.O already created' };
    }

    const baseEgo = {
      id: 'base_ego',
      name: egoData.name || 'Base E.G.O',
      rating: 'ZAYIN',
      emotionCost: 6,
      skillBase: egoData.skillBase,
      modules: {
        rank1: 3,
        rank2: 1,
        rank3: 1
      },
      powerBenefit: egoData.powerBenefit, // 'dice_power' or 'cost_bonus'
      passive: egoData.passive,
      description: egoData.description || '',
      createdAt: new Date().toISOString()
    };

    character.ego.base = baseEgo;
    character.progression.baseEgoCreated = true;

    return { success: true, character };
  }

  // Get level benefits summary
  getLevelBenefits(level) {
    const levelData = this.levelProgression[level];
    if (!levelData) return null;

    return {
      level: level,
      statIncrease: levelData.stats && levelData.stats !== 'base' ? levelData.stats : null,
      skillModules: levelData.modules && levelData.modules !== 'base' ? levelData.modules : null,
      totalSkills: levelData.skills,
      improvement: levelData.improvements,
      ego: levelData.ego,
      hpBonus: levelData.hpBonus || 0
    };
  }

  // Validate character can level up
  canLevelUp(character, targetLevel = null) {
    const currentLevel = character.level || 1;
    const newLevel = targetLevel || (currentLevel + 1);

    // Basic validations
    if (newLevel > 17) {
      return { canLevel: false, reason: 'Maximum level is 17' };
    }

    if (newLevel <= currentLevel) {
      return { canLevel: false, reason: 'Target level must be higher than current level' };
    }

    // Check if there are pending level-ups that need to be resolved
    const pendingLevelUps = character.progression?.pendingLevelUps || [];
    if (pendingLevelUps.length > 0) {
      return { canLevel: false, reason: 'Must resolve pending level benefits first' };
    }

    // Check if there are unresolved stat increases
    const pendingStatIncreases = (character.progression?.statIncreases || []).filter(s => !s.applied);
    if (pendingStatIncreases.length > 0) {
      return { canLevel: false, reason: 'Must apply pending stat increases first' };
    }

    // Check if Base E.G.O is required but not created
    if (currentLevel >= 2 && !character.progression?.baseEgoCreated && !character.ego?.base) {
      return { canLevel: false, reason: 'Must create Base E.G.O before leveling beyond 2' };
    }

    return { canLevel: true };
  }

  // Get missing requirements for character
  getMissingRequirements(character) {
    const requirements = [];

    // Check pending level-ups
    const pendingLevelUps = character.progression?.pendingLevelUps || [];
    if (pendingLevelUps.length > 0) {
      requirements.push({
        type: 'pending_levels',
        description: `Apply benefits for levels: ${pendingLevelUps.join(', ')}`,
        count: pendingLevelUps.length
      });
    }

    // Check unresolved stat increases
    const pendingStatIncreases = (character.progression?.statIncreases || []).filter(s => !s.applied);
    if (pendingStatIncreases.length > 0) {
      requirements.push({
        type: 'stat_increases',
        description: `Apply ${pendingStatIncreases.length} pending stat increase(s)`,
        count: pendingStatIncreases.length
      });
    }

    // Check for Base E.G.O requirement
    if (character.level >= 2 && !character.progression?.baseEgoCreated && !character.ego?.base) {
      requirements.push({
        type: 'base_ego',
        description: 'Create your Base E.G.O',
        count: 1
      });
    }

    // Check for pending improvements
    const pendingImprovements = this.getPendingImprovements(character);
    if (pendingImprovements && pendingImprovements.length > 0) {
      requirements.push({
        type: 'improvements',
        description: `Select ${pendingImprovements.length} pending improvement(s)`,
        count: pendingImprovements.length
      });
    }

    return requirements;
  }

  // Helper method to check pending improvements
  getPendingImprovements(character) {
    const pendingImprovements = [];
    const levelHistory = character.progression?.levelUpHistory || [];

    levelHistory.forEach(entry => {
      if (entry.applied) {
        const levelData = this.levelProgression[entry.level];
        if (levelData?.improvements) {
          const hasImprovement = this.hasImprovementForLevel(character, entry.level, levelData.improvements);
          if (!hasImprovement) {
            pendingImprovements.push({
              level: entry.level,
              type: levelData.improvements
            });
          }
        }
      }
    });

    return pendingImprovements;
  }

  // Check if character has improvement for specific level
  hasImprovementForLevel(character, level, improvementType) {
    const improvements = character.progression?.improvements || { minor: [], major: [] };
    const relevantImprovements = improvements[improvementType] || [];

    return relevantImprovements.some(imp => imp.details?.level === level);
  }

  // Get skill bases manager
  getSkillBasesManager() {
    return skillBasesManager;
  }

  // Get skill modules manager
  getSkillModulesManager() {
    return skillModulesManager;
  }
}
