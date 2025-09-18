/**
 * Stars of the City - Skill Creation System (Skills only)
 * Implements the complete skill creation process for regular skills
 */

import { skillBasesManager } from './skillBases.js';
import { skillModulesManager } from './skillModules.js';

export class SkillCreator {
  constructor(character) {
    this.character = character;
    this.currentSkill = null;
    this.currentStep = 'selectBase'; // selectBase, configureDice, addModules, finalize
    this.availableSpareModules = this.calculateAvailableSpareModules();
  }

  // Calculate how many spare modules the character has available
  calculateAvailableSpareModules() {
    const character = this.character;
    if (!character || !character.stats) {
      return { rank1: 0, rank2: 0, rank3: 0 };
    }

    const intellect = character.stats.intellect || 1;
    const level = character.level || 1;

    // Base modules from intellect
    let rank1Modules = intellect;
    let rank2Modules = 0;
    let rank3Modules = 0;

    // Simplified progression
    if (level >= 3) rank1Modules += Math.floor((level - 1) / 2);
    if (level >= 5) rank2Modules += Math.floor((level - 3) / 3);
    if (level >= 7) rank3Modules += Math.floor((level - 5) / 4);

    // Subtract modules already used in existing skills
    const usedModules = this.calculateUsedSpareModules();

    return {
      rank1: Math.max(0, rank1Modules - usedModules.rank1),
      rank2: Math.max(0, rank2Modules - usedModules.rank2),
      rank3: Math.max(0, rank3Modules - usedModules.rank3)
    };
  }

  // Calculate spare modules already used (excluding innate modules)
  calculateUsedSpareModules() {
    const skills = this.character.skills || [];
    let usedModules = { rank1: 0, rank2: 0, rank3: 0 };

    skills.forEach(skill => {
      if (skill.modules) {
        // Each skill has 3 innate rank1 + 1 innate rank2; extras are spare
        const rank1Count = skill.modules.filter(m => m.rank === 1).length;
        const rank2Count = skill.modules.filter(m => m.rank === 2).length;
        const rank3Count = skill.modules.filter(m => m.rank === 3).length;

        usedModules.rank1 += Math.max(0, rank1Count - 3);
        usedModules.rank2 += Math.max(0, rank2Count - 1);
        usedModules.rank3 += rank3Count;
      }
    });

    return usedModules;
  }

  // Start creating a new skill
  startSkillCreation() {
    this.currentSkill = {
      id: 'temp_' + Date.now(),
      name: '',
      baseName: '',
      baseId: '',
      cost: 0,
      dice: [],
      modules: [],
      tags: [],
      effects: [],
      description: ''
    };
    this.currentStep = 'selectBase';
    return this.currentSkill;
  }

  // Create unique skill directly (skips module selection)
  createUniqueSkill(baseId, skillName = null) {
    const base = skillBasesManager.getBaseById(baseId);
    if (!base || !base.isUnique) {
      return { success: false, error: 'Not a valid unique skill base' };
    }

    const processEffects = (effects) => {
      if (!effects || !Array.isArray(effects)) return [];
      return effects.map(effect => {
        if (typeof effect === 'string') {
          const [tag, ...rest] = effect.split(' ');
          return { tag, effect: rest.join(' ') };
        }
        return effect;
      });
    };

    const finalSkill = {
      id: 'skill_' + Date.now(),
      name: skillName || base.name,
      baseName: base.name,
      baseId: baseId,
      cost: base.cost,
      dice: base.dice.map((die, index) => ({
        id: `die_${index}`,
        tag: die.tag,
        notation: die.notation,
        type: die.type,
        dieSize: die.dieSize,
        bonus: die.bonus || 0,
        effects: processEffects(die.effects)
      })),
      modules: base.modules || [],
      tags: [],
      effects: processEffects(base.prebuiltEffects || []),
      description: base.description,
      isUnique: true,
      type: 'unique'
    };

    return { success: true, skill: finalSkill };
  }

  // Step 1: Select a skill base
  selectBase(baseId) {
    const base = skillBasesManager.getBaseById(baseId);
    if (!base) {
      return { success: false, error: 'Base not found' };
    }

    this.currentSkill.baseName = base.name;
    this.currentSkill.baseId = baseId;
    this.currentSkill.cost = base.cost;
    this.currentSkill.name = base.name;

    // Copy dice from base, converting them to skill dice format
    this.currentSkill.dice = base.dice.map((die, index) => ({
      id: `die_${index}`,
      type: die.type,
      originalTag: die.tag,
      tag: die.tag,
      dieSize: die.dieSize,
      bonus: die.bonus || 0,
      notation: die.notation,
      chosenType: null,
      effects: die.effects ? [...die.effects] : [],
      modules: []
    }));

    if (base.isUnique) {
      this.currentStep = 'finalize';
      if (base.prebuiltEffects && base.prebuiltEffects.length > 0) {
        this.currentSkill.effects = [...(this.currentSkill.effects || []), ...base.prebuiltEffects];
      }
      if (base.modules && base.modules.length > 0) {
        base.modules.forEach(moduleDef => {
          const die = this.currentSkill.dice[moduleDef.targetDie || 0];
          if (die) {
            this.addModule(moduleDef.id, moduleDef.rank, die.id, false);
          }
        });
      }
      this.updateSkillDescription();
    } else {
      this.currentStep = 'configureDice';
    }

    return { success: true, skill: this.currentSkill };
  }

  // Step 2: Configure dice types for choices like "[Any Offensive]"
  configureDieType(dieId, damageType) {
    const die = this.currentSkill.dice.find(d => d.id === dieId);
    if (!die) return { success: false, error: 'Die not found' };

    if (die.originalTag === '[Any Offensive]' || die.originalTag === '[Any Other Offensive]') {
      const validTypes = ['Slash', 'Pierce', 'Blunt'];
      if (!validTypes.includes(damageType)) return { success: false, error: 'Invalid damage type' };
      die.tag = `[${damageType}]`;
      die.chosenType = damageType;
      this.updateSkillNotation();
      return { success: true };
    } else if (die.originalTag === '[Block or Evade]') {
      const validTypes = ['Block', 'Evade'];
      if (!validTypes.includes(damageType)) return { success: false, error: 'Invalid defense type' };
      die.tag = `[${damageType}]`;
      die.chosenType = damageType;
      this.updateSkillNotation();
      return { success: true };
    }

    return { success: false, error: 'This die type cannot be configured' };
  }

  // Check if all configurable dice have been configured
  isConfigurationComplete() {
    if (!this.currentSkill) return false;
    const base = skillBasesManager.getBaseById(this.currentSkill.baseId);
    if (base && base.isUnique) return true;

    return this.currentSkill.dice.every(die => {
      if (die.originalTag === '[Any Offensive]' || die.originalTag === '[Block or Evade]' || die.originalTag === '[Any Other Offensive]') {
        return die.chosenType !== null;
      }
      return true;
    });
  }

  // Step 3: Add modules (innate + spare)
  addInnateModules() {
    const innateSlots = [
      { rank: 1, type: 'innate', filled: false },
      { rank: 1, type: 'innate', filled: false },
      { rank: 1, type: 'innate', filled: false },
      { rank: 2, type: 'innate', filled: false }
    ];

    this.currentSkill.innateSlots = innateSlots;
    this.currentStep = 'addModules';
    this.availableSpareModules = this.calculateAvailableSpareModules();

    return { success: true };
  }

  // Add a module to the skill (supports option-based and multi-die modules)
  addModule(moduleId, moduleRank, targetDieId = null, isSpare = false, option = null) {
    const module = skillModulesManager.getModuleById(moduleId, moduleRank);
    if (!module) return { success: false, error: 'Module not found' };

    if (isSpare) {
      const available = this.availableSpareModules[`rank${moduleRank}`];
      const used = this.currentSkill.modules.filter(m => m.rank === moduleRank && m.isSpare).length;
      if (used >= available) return { success: false, error: `Not enough spare Rank ${moduleRank} modules` };
    }

    // Allow passing multiple target dice via option.targetDieIds
    const targetDieIds = Array.isArray(option?.targetDieIds) ? option.targetDieIds : (targetDieId ? [targetDieId] : []);

    if (module.target === 'die' && targetDieIds.length === 0) {
      const availableDice = this.getAvailableTargetDice(module);
      if (availableDice.length === 1) {
        targetDieIds.push(availableDice[0].id);
      } else if (availableDice.length === 0) {
        return { success: false, error: 'No suitable dice available for this module' };
      } else {
        return { success: false, error: 'Multiple dice available - please select target die', requiresTargetSelection: true, availableDice };
      }
    }

    const validation = this.validateModuleAddition(module, targetDieIds);
    if (!validation.valid) return { success: false, error: validation.error };

    const skillModule = {
      id: moduleId,
      rank: moduleRank,
      name: module.name,
      effect: module.effect,
      tag: module.tag,
      target: module.target,
      targetDieId: targetDieIds[0] || null,
      targetDieIds: targetDieIds.length > 1 ? targetDieIds : null,
      isSpare: isSpare,
      description: module.description,
      selectedOptionId: option?.optionId || null
    };

    this.currentSkill.modules.push(skillModule);
    this.applyModuleEffects(skillModule);

    return { success: true };
  }

  // Get available dice for targeting by a module
  getAvailableTargetDice(module) {
    if (module.target !== 'die') return [];

    return this.currentSkill.dice.filter(die => {
      if (module.id === 'slash' || module.id === 'pierce' || module.id === 'blunt') {
        return die.type === 'offensive' && (
          die.tag === '[Any Offensive]' ||
          die.tag === '[Any Other Offensive]' ||
          die.originalTag === '[Any Offensive]' ||
          die.originalTag === '[Any Other Offensive]'
        );
      }

      if (module.id.includes('power_up') || module.id === 'stronger') {
        return true;
      }

      // Critical Fragility/Bind cannot be added to dice that already inflict those statuses
      if (module.id === 'critical_fragility') {
        return die.type === 'offensive' && !((die.effects || []).some(e => /Fragile/i.test(e.effect || '')));
      }
      if (module.id === 'critical_bind') {
        return die.type === 'offensive' && !((die.effects || []).some(e => /Bind/i.test(e.effect || '')));
      }

      // Flame Step / Futility / Quick Step only apply to Evade dice
      if (module.id === 'flame_step' || module.id === 'futility' || module.id === 'quick_step') {
        return die.tag === '[Evade]';
      }

      // Heroic only applies to Block dice
      if (module.id === 'heroic') {
        return die.tag === '[Block]';
      }

      return die.type === 'offensive' || die.type === 'defensive';
    });
  }

  // Validate if a module can be added
  validateModuleAddition(module, target) {
    // Cost restriction for Kinetic Absorption / Frightening
    if (module.id === 'kinetic_absorption' && (this.currentSkill?.cost ?? 0) < 2) {
      return { valid: false, error: 'Kinetic Absorption requires skill cost of 2 or higher' };
    }
    if (module.id === 'frightening' && (this.currentSkill?.cost ?? 0) < 2) {
      return { valid: false, error: 'Frightening requires skill cost of 2 or higher' };
    }
    if (module.id === 'limited_strength') {
      const hasLimit = (this.currentSkill.tags || []).includes('[Limit X Uses]') || (this.currentSkill.effects || []).some(e => e.tag === '[Limit X Uses]');
      if (!hasLimit) return { valid: false, error: 'Limited Strength requires the skill to have a [Limit]' };
    }

    if (module.tag) {
      // Only block duplicates on the same die; allow across different dice
      const targetIds = Array.isArray(target) ? target : (target ? [target] : []);
      if (targetIds.length > 0) {
        for (const id of targetIds) {
          const die = this.currentSkill.dice.find(d => d.id === id);
          if (!die) return { valid: false, error: 'Target die not found' };
          if (die.effects.some(e => e.tag === module.tag)) {
            return { valid: false, error: `Die already has tag ${module.tag}` };
          }
          if ((module.id === 'flame_step' || module.id === 'futility' || module.id === 'quick_step') && die.tag !== '[Evade]') {
            return { valid: false, error: 'This module can only be applied to Evade dice' };
          }
          if (module.id === 'heroic' && die.tag !== '[Block]') {
            return { valid: false, error: 'This module can only be applied to Block dice' };
          }
        }
      } else {
        // For skill-level tags, prevent duplicates at the skill level
        const hasSkillTag = (this.currentSkill.effects || []).some(e => e.tag === module.tag);
        if (hasSkillTag) return { valid: false, error: `Tag ${module.tag} already present` };
      }
    }

    if (!module.repeating) {
      const hasModule = this.currentSkill.modules.some(m => m.id === module.id);
      if (hasModule) return { valid: false, error: 'Module already present and not repeating' };
    }

    if (module.target === 'die' && (Array.isArray(target) ? target.length === 0 : !target)) {
      return { valid: false, error: 'This module requires a target die' };
    }

    return { valid: true };
  }

  // Apply module effects to the skill
  applyModuleEffects(skillModule) {
    const module = skillModulesManager.getModuleById(skillModule.id, skillModule.rank);

    const normalizeTaggedText = (tag, raw) => {
      let txt = this.processEffectText(raw || '');
      txt = txt.replace(/^\s*This\s+skill\s+gains:?\s*/i, '');
      const tagName = String(tag || '').replace(/\[|\]/g, '').replace(/[.*+?^${}()|[\]\\]/g, r => `\\${r}`);
      const tagRe = new RegExp(`^\s*\[${tagName}\]\s*:?[\s\"]*`, 'i');
      txt = txt.replace(tagRe, '').replace(/^"|"$/g, '').trim();
      return txt;
    };

    if (module.id === 'comeback') {
      const chosen = skillModule.selectedOptionId || (module.options && module.options[0]?.id) || null;
      const option = (module.options || []).find(o => o.id === chosen) || module.options?.[0];
      if (option) {
        // Only add effects on dice; do not add a top-level skill effect
        if (option.selection?.type === 'die') {
          const ids = skillModule.targetDieIds && skillModule.targetDieIds.length ? skillModule.targetDieIds : (skillModule.targetDieId ? [skillModule.targetDieId] : []);
          ids.forEach(id => {
            const die = this.currentSkill.dice.find(d => d.id === id);
            if (die) die.effects.push({ tag: module.tag, effect: 'Boost the power of the final Die by 2.', source: module.name });
          });
        } else if (option.selection?.type === 'dice_group' && option.selection.group === 'non_final') {
          const nonFinal = this.currentSkill.dice.slice(0, Math.max(0, this.currentSkill.dice.length - 1));
          nonFinal.forEach(die => die.effects.push({ tag: module.tag, effect: 'Boost the power of the final Die by 1.', source: module.name }));
        }
      }
      this.updateSkillDescription();
      return;
    }

    if (module.id === 'counterplay') {
      const chosen = skillModule.selectedOptionId || '';
      const map = {
        'counterplay_slash': 'Slash',
        'counterplay_pierce': 'Pierce',
        'counterplay_blunt': 'Blunt',
        'counterplay_block': 'Block',
        'counterplay_evade': 'Evade'
      };
      const chosenType = map[chosen] || 'Slash';
      const ids = skillModule.targetDieIds && skillModule.targetDieIds.length ? skillModule.targetDieIds : (skillModule.targetDieId ? [skillModule.targetDieId] : []);
      ids.forEach(id => {
        const die = this.currentSkill.dice.find(d => d.id === id);
        if (die) die.effects.push({ tag: module.tag, effect: `When clashing against a ${chosenType} Die, gain {Cost+1} power.`, source: module.name });
      });
      this.updateSkillDescription();
      return;
    }

    if (module.id === 'limited_strength') {
      const ids = skillModule.targetDieIds && skillModule.targetDieIds.length ? skillModule.targetDieIds : (skillModule.targetDieId ? [skillModule.targetDieId] : []);
      const isDouble = skillModule.selectedOptionId === 'limited_strength_double';
      ids.forEach(id => {
        const die = this.currentSkill.dice.find(d => d.id === id);
        if (!die) return;
        const inc = isDouble ? 1 : 2;
        die.bonus += inc;
        die.notation = this.updateDieNotation(die);
        die.effects.push({ tag: '[Power]', effect: `+${inc} Power from Limited Strength`, source: module.name });
      });
      this.updateSkillDescription();
      return;
    }

    if (module.target === 'die' && (skillModule.targetDieId || (skillModule.targetDieIds && skillModule.targetDieIds.length))) {
      const ids = skillModule.targetDieIds && skillModule.targetDieIds.length ? skillModule.targetDieIds : [skillModule.targetDieId];
      ids.forEach(targetId => {
        const die = this.currentSkill.dice.find(d => d.id === targetId);
        if (!die) return;
        if (module.id.includes('stronger') || module.id.includes('power_up')) {
          const powerIncrease = parseInt(module.effect.match(/\+(\d+)/)[1]);
          die.bonus += powerIncrease;
          die.notation = this.updateDieNotation(die);
        } else if (module.id === 'potential') {
          const currentSize = die.dieSize;
          const sizeMap = { 'd6': 'd8', 'd8': 'd10', 'd10': 'd12' };
          if (sizeMap[currentSize]) {
            die.dieSize = sizeMap[currentSize];
            die.notation = this.updateDieNotation(die);
            die.effects.push({
              tag: `[Size: ${die.dieSize}]`,
              effect: `Die size increased to ${die.dieSize}`,
              source: 'Potential'
            });
          } else if (currentSize === 'd12') {
            die.effects.push({ tag: '[Max Size]', effect: 'Die is already at maximum size (d12)', source: 'Potential' });
          }
        }

        if (module.tag) {
          if (module.id === 'critical_fragility' || module.id === 'critical_bind') {
            const isD10Plus = die.dieSize === 'd10' || die.dieSize === 'd12';
            const amount = isD10Plus ? 2 : 1;
            const status = module.id === 'critical_fragility' ? 'Fragile' : 'Bind';
            const rendered = `Inflict ${amount} ${status}`;
            const exists = die.effects.some(e => e.tag === module.tag && this.processEffectText(e.effect || '') === rendered);
            if (!exists) die.effects.push({ tag: module.tag, effect: rendered, source: module.name });
          } else {
            const clean = normalizeTaggedText(module.tag, module.effect);
            const exists = die.effects.some(e => e.tag === module.tag && this.processEffectText(e.effect || '') === clean);
            if (!exists) die.effects.push({ tag: module.tag, effect: clean, source: module.name });
          }
        }

        if (module.id === 'burning') {
          // Ensure we don't duplicate the [Hit] tag if it's present in module.effect
          const clean = normalizeTaggedText('[Hit]', module.effect);
          const exists = die.effects.some(e => e.tag === '[Hit]' && this.processEffectText(e.effect || '') === clean);
          if (!exists) die.effects.push({ tag: '[Hit]', effect: clean, source: module.name });
        }

        if (['slash', 'pierce', 'blunt'].includes(module.id)) {
          die.tag = `[${module.name}]`;
        }
      });
    } else {
      const availableDie = this.currentSkill.dice.find(d => !d.effects.some(e => e.source === module.name));
      if (availableDie && module.target === 'die') {
        skillModule.targetDieId = availableDie.id;
        return this.applyModuleEffects(skillModule);
      } else if (module.target === 'skill') {
        const clean = normalizeTaggedText(module.tag, module.effect);
        const existsSkill = this.currentSkill.effects.some(e => e.tag === module.tag && this.processEffectText(e.effect || '') === clean);
        if (!existsSkill) {
          this.currentSkill.effects.push({ tag: module.tag, effect: clean, source: module.name });
        }
        if (module.tag && !this.currentSkill.tags.includes(module.tag)) this.currentSkill.tags.push(module.tag);
      }
    }

    this.updateSkillDescription();
  }

  // Update die notation after modifications
  updateDieNotation(die) {
    let notation = die.dieSize;
    if (die.bonus > 0) notation += `+${die.bonus}`;
    else if (die.bonus < 0) notation += die.bonus;
    return `1${notation}`;
  }

  // Update complete skill notation
  updateSkillNotation() {
    this.currentSkill.dice.forEach(die => {
      die.notation = this.updateDieNotation(die);
    });
  }

  // Generate skill description based on modules and effects
  updateSkillDescription() {
    let description = '';
    const base = skillBasesManager.getBaseById(this.currentSkill.baseId);
    const isUnique = base && base.isUnique;

    const skillEffects = [
      ...(this.currentSkill.effects || []),
      ...(isUnique && base.prebuiltEffects ? base.prebuiltEffects.map(effect => ({
        tag: effect.split(' ')[0],
        effect: effect.split(' ').slice(1).join(' ')
      })) : [])
    ].filter(e => e && e.tag);

    // Helper to render an effect ensuring the tag isn't duplicated in the effect text
    const renderEffectForDisplay = (e) => {
      const raw = typeof e.effect === 'string' ? e.effect : (e.effect || '');
      let eff = this.processEffectText(raw);
      const tag = e.tag || '';
      if (tag) {
        const tagEsc = tag.replace(/[[\]]/g, '\\$&');
        eff = eff.replace(new RegExp(`^\\s*${tagEsc}\\s*:?\\s*`, 'i'), '').trim();
      }
      return `${tag} ${eff}`.trim();
    };

    if (skillEffects.length > 0) {
      skillEffects.forEach(effect => {
        if (typeof effect === 'string') description += `${effect}\n`;
        else description += `${renderEffectForDisplay(effect)}\n`;
      });
      description += '\n';
    }

    this.currentSkill.dice.forEach((die, index) => {
      let dieDesc = `${die.tag} ${die.notation}`;
      const baseDie = isUnique && base.dice && base.dice[index];
      // Merge die effects with base die effects and deduplicate by rendered text
      const rawDieEffects = [
        ...(die.effects || []),
        ...(baseDie && baseDie.effects ? baseDie.effects.map(effect => ({
          tag: effect.split(' ')[0],
          effect: effect.split(' ').slice(1).join(' '),
          source: 'base'
        })) : [])
      ].filter(e => e && e.tag && e.tag !== die.tag);

      // Deduplicate by the final rendered string to avoid repeating same tag+text
      const seen = new Set();
      const deduped = [];
      rawDieEffects.forEach(e => {
        const rendered = renderEffectForDisplay(e);
        if (!seen.has(rendered)) {
          seen.add(rendered);
          deduped.push(e);
        }
      });

      if (deduped.length > 0) {
        dieDesc += ' ' + deduped.map(e => renderEffectForDisplay(e)).join(' ');
      }

      description += dieDesc + '\n';
    });

    if (!isUnique) {
      description += '\n';
      const allModules = this.currentSkill.modules || [];
      if (allModules.length > 0) {
        const tier1 = allModules.filter(m => m.rank === 1);
        const tier2 = allModules.filter(m => m.rank === 2);
        const tier3 = allModules.filter(m => m.rank === 3);

        let modulesText = 'Modules ';

        if (tier1.length > 0) {
          const tier1Names = tier1.map(m => m.name);
          const tier1Counts = {};
          tier1Names.forEach(name => { tier1Counts[name] = (tier1Counts[name] || 0) + 1; });
          const tier1Display = Object.entries(tier1Counts).map(([name, count]) => count > 1 ? `${name} x${count}` : name).join(', ');
          modulesText += `T1: ${tier1Display}`;
        }

        if (tier2.length > 0) {
          const tier2Names = tier2.map(m => m.name);
          const tier2Counts = {};
          tier2Names.forEach(name => { tier2Counts[name] = (tier2Counts[name] || 0) + 1; });
          const tier2Display = Object.entries(tier2Counts).map(([name, count]) => count > 1 ? `${name} x${count}` : name).join(', ');
          modulesText += `${tier1.length > 0 ? ' | ' : ''}T2: ${tier2Display}`;
        }

        if (tier3.length > 0) {
          const tier3Names = tier3.map(m => m.name);
          const tier3Counts = {};
          tier3Names.forEach(name => { tier3Counts[name] = (tier3Counts[name] || 0) + 1; });
          const tier3Display = Object.entries(tier3Counts).map(([name, count]) => count > 1 ? `${name} x${count}` : name).join(', ');
          modulesText += `${(tier1.length > 0 || tier2.length > 0) ? ' | ' : ''}T3: ${tier3Display}`;
        }

        description += modulesText;
      }
    }

    this.currentSkill.description = description;
  }

  // Replace placeholders like {Cost}
  processEffectText(effectText) {
    return effectText.replace(/{Cost}/g, this.currentSkill.cost)
      .replace(/{Cost\+(\d+)}/g, (match, num) => this.currentSkill.cost + parseInt(num))
      .replace(/{Cost-(\d+)}/g, (match, num) => this.currentSkill.cost - parseInt(num));
  }

  // Remove a module from the skill
  removeModule(moduleIndex) {
    if (moduleIndex < 0 || moduleIndex >= this.currentSkill.modules.length) {
      return { success: false, error: 'Invalid module index' };
    }

    const removedModule = this.currentSkill.modules.splice(moduleIndex, 1)[0];
    this.removeModuleEffects(removedModule);
    return { success: true, removedModule };
  }

  // Remove module effects from skill
  removeModuleEffects(skillModule) {
    if (skillModule.targetDieId) {
      const die = this.currentSkill.dice.find(d => d.id === skillModule.targetDieId);
      if (die) {
        const module = skillModulesManager.getModuleById(skillModule.id, skillModule.rank);
        if (module.id.includes('power_up')) {
          const powerIncrease = parseInt(module.effect.match(/\+(\d+)/)[1]);
          die.bonus -= powerIncrease;
          die.notation = this.updateDieNotation(die);
        }
        die.effects = die.effects.filter(e => e.source !== skillModule.name);
      }
    } else {
      this.currentSkill.effects = this.currentSkill.effects.filter(e => e.source !== skillModule.name);
      this.currentSkill.tags = this.currentSkill.tags.filter(tag => tag !== skillModule.tag);
    }

    this.updateSkillDescription();
  }

  // Finalize skill creation
  finalizeSkill(skillName = null) {
    if (!this.isConfigurationComplete()) {
      return { success: false, error: 'Configuration not complete' };
    }

    const base = skillBasesManager.getBaseById(this.currentSkill.baseId);

    if (!base || !base.isUnique) {
      const innateModules = this.currentSkill.modules.filter(m => !m.isSpare);
      const rank1Innate = innateModules.filter(m => m.rank === 1).length;
      const rank2Innate = innateModules.filter(m => m.rank === 2).length;

      if (rank1Innate < 3) return { success: false, error: 'Must have 3 Tier 1 innate modules' };
      if (rank2Innate < 1) return { success: false, error: 'Must have 1 Tier 2 innate module' };
    }

    if (skillName) this.currentSkill.name = skillName;
    this.updateSkillDescription();

    const finalSkill = {
      id: 'skill_' + Date.now(),
      name: this.currentSkill.name,
      baseName: this.currentSkill.baseName,
      baseId: this.currentSkill.baseId,
      cost: this.currentSkill.cost,
      dice: this.currentSkill.dice.map(die => ({
        tag: die.tag,
        notation: die.notation,
        type: die.type,
        effects: die.effects.map(e => e.tag + ' ' + this.processEffectText(e.effect))
      })),
      modules: this.currentSkill.modules.map(m => {
        const targetDieId = m.targetDieId || null;
        const targetDieIndex = targetDieId ? this.currentSkill.dice.findIndex(d => d.id === targetDieId) : (m.targetDieIndex !== undefined ? m.targetDieIndex : null);
        return { id: m.id, rank: m.rank, name: m.name, isSpare: m.isSpare, targetDieId: targetDieId, targetDie: targetDieIndex >= 0 ? targetDieIndex : null };
      }),
      tags: [...new Set(this.currentSkill.tags)],
      effects: this.currentSkill.effects,
      description: this.currentSkill.description
    };

    this.currentSkill = null;
    this.currentStep = 'complete';

    return { success: true, skill: finalSkill };
  }

  // Get available modules for current skill (skills only)
  getAvailableModules(rank) {
    const modules = skillModulesManager.getModulesByRank(rank) || [];
    const uniqueModules = [];
    const moduleIds = new Set();
    modules.forEach(module => {
      if (!moduleIds.has(module.id)) {
        moduleIds.add(module.id);
        uniqueModules.push(module);
      }
    });
    return uniqueModules;
  }

  // Get current skill creation state
  getCurrentState() {
    return {
      currentStep: this.currentStep,
      currentSkill: this.currentSkill,
      availableBases: skillBasesManager.getAllBases(),
      configurationComplete: this.currentSkill ? this.isConfigurationComplete() : false,
      availableSpareModules: this.availableSpareModules
    };
  }

  // Reset skill creation
  reset() {
    this.currentSkill = null;
    this.currentStep = 'selectBase';
    this.availableSpareModules = this.calculateAvailableSpareModules();
  }
}

export default SkillCreator;
