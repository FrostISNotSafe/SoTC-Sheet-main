import { skillBasesManager } from '../skillBases.js';
import { skillModulesManager } from '../skillModules.js';
import { baseEgoPassiveManager } from '../baseEgoPassives.js';
import { SkillCreator } from '../skillCreator.js';

// New Base E.G.O. creator component redesigned to follow Skill Creator UX
export class BaseEGOCreator {
  constructor(character, onSave, onCancel) {
    this.character = character;
    this.onSave = onSave;
    this.onCancel = onCancel;

    this.currentStep = 'selectBase'; // selectBase, configureDice, addModules, chooseBenefit, selectPassive, finalize

    this.baseEgo = {
      name: '',
      baseId: '',
      baseName: '',
      cost: 0,
      dice: [],
      modules: { rank1: [], rank2: [], rank3: [] },
      powerBenefit: '',
      passiveId: '',
      passiveChoice: '',
      emotionCost: 6,
      rating: 'ZAYIN'
    };

    this.availableBases = [];
    this.availableModules = { rank1: [], rank2: [], rank3: [] };
    this.availablePassives = [];

    this.init();
  }

  init() {
    // load bases and modules
    this.availableBases = skillBasesManager.getEgoBases();
    this.availableModules.rank1 = skillModulesManager.getModulesByRank(1).filter(m => !m.tags || !m.tags.includes('[Limit]'));
    this.availableModules.rank2 = skillModulesManager.getModulesByRank(2).filter(m => !m.tags || !m.tags.includes('[Limit]'));
    this.availableModules.rank3 = skillModulesManager.getModulesByRank(3).filter(m => !m.tags || !m.tags.includes('[Limit]'));
    this.availablePassives = baseEgoPassiveManager.getAllPassives();
  }

  // Helper to copy base dice into the ego structure
  applyBase(baseId) {
    const base = skillBasesManager.getBaseById(baseId);
    if (!base) return false;
    this.baseEgo.baseId = base.id;
    this.baseEgo.baseName = base.name;
    this.baseEgo.cost = base.cost;
    this.baseEgo.dice = base.dice.map((d, i) => ({ id: `d${i}`, originalTag: d.tag, tag: d.tag, notation: d.notation, dieSize: d.dieSize, bonus: d.bonus || 0, chosenType: null }));
    return true;
  }

  render() {
    return `
      <div class="base-ego-creator skill-creation-content">
        <div class="modal-header"><h3>Create Base E.G.O.</h3></div>
        <div class="modal-body">
          ${this.renderStepIndicator()}
          <div class="step-panel">${this.renderCurrentStep()}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" id="cancel-ego-btn">Cancel</button>
          ${this.currentStep === 'finalize' ? `<button class="btn-primary" id="create-ego-btn">Create E.G.O.</button>` : `<button class="btn-primary" id="next-step-btn">Next</button>`}
        </div>
      </div>
    `;
  }

  renderStepIndicator() {
    const steps = [
      { id: 'selectBase', name: 'Base' },
      { id: 'configureDice', name: 'Dice' },
      { id: 'addModules', name: 'Modules' },
      { id: 'chooseBenefit', name: 'Benefit' },
      { id: 'selectPassive', name: 'Passive' },
      { id: 'finalize', name: 'Finalize' }
    ];

    return `
      <div class="step-indicator">
        ${steps.map(s => `
          <div class="step ${this.currentStep === s.id ? 'active' : ''}" data-step="${s.id}">
            <div class="step-number">${steps.indexOf(s) + 1}</div>
            <div class="step-name">${s.name}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderCurrentStep() {
    switch (this.currentStep) {
      case 'selectBase': return this.renderBaseSelection();
      case 'configureDice': return this.renderDiceConfiguration();
      case 'addModules': return this.renderModuleSelection();
      case 'chooseBenefit': return this.renderBenefitSelection();
      case 'selectPassive': return this.renderPassiveSelection();
      case 'finalize': return this.renderFinalization();
      default: return '<div>Unknown step</div>';
    }
  }

  renderBaseSelection() {
    return `
      <div class="base-list">
        ${this.availableBases.map(b => `
          <div class="base-card ${this.baseEgo.baseId === b.id ? 'selected' : ''}" data-base-id="${b.id}">
            <div class="base-header"><h4>${b.name}</h4><span class="base-cost">Cost: ${b.cost}</span></div>
            <div class="base-dice">${b.dice.map(d => `<span class="die-notation">${d.tag} ${d.notation}</span>`).join('')}</div>
            <div class="base-description">${b.description || ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderDiceConfiguration() {
    return `
      <div class="dice-config">
        <h4>Configure Dice</h4>
        <div class="dice-grid">
          ${this.baseEgo.dice.map(die => `
            <div class="die-item" data-die-id="${die.id}">
              <div class="die-tag">${die.tag}</div>
              <div class="die-notation">${die.notation}</div>
              ${['[Any Offensive]','[Any Other Offensive]','[Block or Evade]'].includes(die.originalTag) ? `
                <select class="die-type-select" data-die-id="${die.id}">
                  <option value="">Select</option>
                  ${die.originalTag === '[Block or Evade]' ? `
                    <option value="Block" ${die.chosenType==='Block'?'selected':''}>Block</option>
                    <option value="Evade" ${die.chosenType==='Evade'?'selected':''}>Evade</option>
                  ` : `
                    <option value="Slash" ${die.chosenType==='Slash'?'selected':''}>Slash</option>
                    <option value="Pierce" ${die.chosenType==='Pierce'?'selected':''}>Pierce</option>
                    <option value="Blunt" ${die.chosenType==='Blunt'?'selected':''}>Blunt</option>
                  `}
                </select>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderModuleRankSelection(rank) {
    const currentCount = this.baseEgo.modules[`rank${rank}`].length;
    const max = rank === 1 ? 3 : 1;
    // Cross-disable: if a higher rank is full, disable lower ranks (example: rank3 full -> disable rank1/2)
    const rankMax = {1:3, 2:1, 3:1};
    const higherFull = (rankToCheck) => {
      for (let r = rankToCheck+1; r <= 3; r++) {
        if ((this.baseEgo.modules[`rank${r}`] || []).length >= rankMax[r]) return true;
      }
      return false;
    };

    const crossDisabled = higherFull(rank);

    return `
      <div class="module-rank-section ${crossDisabled ? 'cross-disabled' : ''}">
        <h5>Rank ${rank} (${currentCount}/${max})</h5>
        <div class="module-grid ${crossDisabled ? 'disabled' : ''}">
          ${this.availableModules[`rank${rank}`].map(m => {
            const isSel = this.baseEgo.modules[`rank${rank}`].some(s => s.id === m.id && (!s.optionId || s.optionId === null));
            const disabled = !m.repeating && isSel;
            return `
              <div class="module-card ${disabled ? 'disabled' : ''}" data-module-id="${m.id}" data-module-rank="${rank}">
                <div class="module-header"><h5>${m.name}</h5>${m.repeating?'<span class="repeating-badge">Repeating</span>':''}</div>
                <div class="module-effect">${m.effect}</div>
                <div class="module-description">${m.description || ''}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  renderModuleSelection() {
    return `
      <div class="modules-panel">
        <h4>Select Modules</h4>
        ${this.renderModuleRankSelection(1)}
        ${this.renderModuleRankSelection(2)}
        ${this.renderModuleRankSelection(3)}
        <div class="selected-modules">
          <h5>Selected Modules</h5>
          ${this.renderSelectedModules()}
        </div>
      </div>
    `;
  }

  renderSelectedModules() {
    const all = [
      ...this.baseEgo.modules.rank1.map(m => ({...m, rank:1})),
      ...this.baseEgo.modules.rank2.map(m => ({...m, rank:2})),
      ...this.baseEgo.modules.rank3.map(m => ({...m, rank:3}))
    ];
    if (all.length === 0) return '<div class="no-modules">No modules selected</div>';
    return `
      <div class="selected-list">
        ${all.map((m, idx) => `
          <div class="selected-item">
            <div>
              <strong>${m.name}</strong> ${m.optionId ? `— ${m.optionId}` : ''}
              ${m.targetDieId ? `<div class="module-target">Applied to: ${this.baseEgo.dice.find(d=>d.id===m.targetDieId)?.tag || m.targetDieId} ${this.baseEgo.dice.find(d=>d.id===m.targetDieId)?.notation || ''}</div>` : ''}
            </div>
            <div class="effect-preview">${m.effect}</div>
            <button class="remove-module-btn" data-module-id="${m.id}" data-module-rank="${m.rank}">Remove</button>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderBenefitSelection() {
    return `
      <div class="benefit-panel">
        <h4>Choose Benefit</h4>
        <div class="benefit-options">
          <div class="benefit-option ${this.baseEgo.powerBenefit === 'dice_power' ? 'selected' : ''}" data-benefit="dice_power">Dice Power Bonus<br/><small>${this.getDicePowerDesc()}</small></div>
          <div class="benefit-option ${this.baseEgo.powerBenefit === 'cost_bonus' ? 'selected' : ''}" data-benefit="cost_bonus">Cost Enhancement<br/><small>Treat {Cost} as +1</small></div>
        </div>
      </div>
    `;
  }

  renderPassiveSelection() {
    return `
      <div class="passive-panel">
        <h4>Select Passive</h4>
        <div class="passive-grid">
          ${this.availablePassives.map(p => `
            <div class="passive-card ${this.baseEgo.passiveId === p.id ? 'selected' : ''}" data-passive-id="${p.id}">
              <h5>${p.name}</h5>
              <div class="passive-description">${p.description}</div>
            </div>
          `).join('')}
        </div>
        ${this.baseEgo.passiveId ? `<div class="passive-choice">${baseEgoPassiveManager.resolvePassiveDescription(this.baseEgo.passiveId, this.baseEgo.passiveChoice)}</div>` : ''}
      </div>
    `;
  }

  renderFinalization() {
    return `
      <div class="finalize-panel">
        <h4>Finalize Base E.G.O.</h4>
        <div class="form-group">
          <label>Name</label>
          <input id="ego-name" type="text" value="${this.baseEgo.name || ''}" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="ego-desc">${this.baseEgo.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Image</label>
          <input id="ego-image-input" type="file" accept="image/*" />
        </div>
        <div class="ego-preview">${this.renderEgoPreview()}</div>
      </div>
    `;
  }

  renderEgoPreview() {
    const imageHtml = this.baseEgo.image ? `<img src="${this.baseEgo.image}" alt="E.G.O. image" class="ego-image-preview"/>` : `<div class="ego-image-placeholder">No image</div>`;

    return `
      <div class="ego-card-preview old-style">
        <div class="ego-row">
          <div class="ego-image-wrap">${imageHtml}</div>
          <div class="ego-main">
            <h2 class="ego-name">${this.baseEgo.name || 'Unnamed E.G.O.'}</h2>
            ${this.baseEgo.description ? `<p class="ego-description">${this.baseEgo.description}</p>` : ''}

            <div class="ego-meta">
              <div><strong>Base:</strong> ${this.baseEgo.baseName || '—'}</div>
              <div><strong>Base Cost:</strong> ${this.baseEgo.cost || '—'}</div>
              <div><strong>Emotion Cost:</strong> ${this.baseEgo.emotionCost} EP</div>
            </div>

            <div class="ego-modules">
              <strong>Modules</strong>
              <div class="modules-list">
                ${this.baseEgo.modules.rank1.map(m => `<div class="module-line">T1: ${m.name}${m.targetDieId?` (on ${this.baseEgo.dice.find(d=>d.id===m.targetDieId)?.tag||m.targetDieId})`:''}</div>`).join('')}
                ${this.baseEgo.modules.rank2.map(m => `<div class="module-line">T2: ${m.name}${m.targetDieId?` (on ${this.baseEgo.dice.find(d=>d.id===m.targetDieId)?.tag||m.targetDieId})`:''}</div>`).join('')}
                ${this.baseEgo.modules.rank3.map(m => `<div class="module-line">T3: ${m.name}${m.targetDieId?` (on ${this.baseEgo.dice.find(d=>d.id===m.targetDieId)?.tag||m.targetDieId})`:''}</div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getDicePowerDesc() {
    const c = this.baseEgo.dice.length;
    if (c === 1) return '+3 Power to single die';
    if (c === 2) return '+2 Power to each die';
    if (c >= 3) return '+1 Power to each die';
    return '';
  }

  // Public handlers used by characterSheet delegation
  selectBase(baseId) {
    if (this.applyBase(baseId)) {
      this.currentStep = 'configureDice';
    }
  }

  // optionId and targetDieId are optional. If module.target === 'die', targetDieId indicates which die it applies to.
  selectModule(moduleId, rank, optionId = null, targetDieId = null) {
    const rankKey = `rank${rank}`;
    const max = rank === 1 ? 3 : 1;
    if (this.baseEgo.modules[rankKey].length >= max) return { success: false, error: 'Module slots full' };
    const module = skillModulesManager.getModuleById(moduleId, rank);
    if (!module) return { success: false, error: 'Module not found' };

    const already = this.baseEgo.modules[rankKey].some(m => m.id === moduleId && (!m.optionId || m.optionId === optionId) && m.targetDieId === targetDieId);
    if (already && !module.repeating) return { success: false, error: 'Module already selected' };

    // Build a temporary SkillCreator to reuse validation logic so E.G.O. follows skill rules
    const tempSkill = new SkillCreator(this.character);
    // Build a skill-like object from baseEgo
    const skillLike = {
      id: 'temp',
      name: this.baseEgo.baseName || 'EGO_TEMP',
      baseId: this.baseEgo.baseId,
      cost: this.baseEgo.cost || 0,
      dice: (this.baseEgo.dice || []).map(d => ({ id: d.id, tag: d.tag, type: d.tag && d.tag.includes('Evade') ? 'defensive' : 'offensive', dieSize: d.dieSize, bonus: d.bonus || 0, effects: [] })),
      modules: [],
      effects: []
    };

    // Populate existing module effects into skillLike for validation
    ['rank1','rank2','rank3'].forEach(rk => {
      (this.baseEgo.modules[rk] || []).forEach(m => {
        if (m.targetDieId) {
          const die = skillLike.dice.find(dd => dd.id === m.targetDieId);
          if (die) die.effects.push({ tag: m.tag || '', effect: m.effect || '' });
        } else {
          skillLike.effects.push({ tag: m.tag || '', effect: m.effect || '' });
        }
      });
    });

    tempSkill.currentSkill = skillLike;

    // Validate via SkillCreator rules
    const targetParam = module.target === 'die' && targetDieId ? targetDieId : null;
    const validation = tempSkill.validateModuleAddition(module, targetParam);
    if (!validation.valid) return { success: false, error: validation.error };

    // If validation passed, proceed to add
    const effect = optionId && module.options ? (module.options.find(o => o.id === optionId)?.description || module.effect) : module.effect;
    const toPush = { id: moduleId, name: module.name, effect, rank, optionId: optionId || null, tag: module.tag || null };
    if (module.target === 'die') toPush.targetDieId = targetDieId || null;

    this.baseEgo.modules[rankKey].push(toPush);
    return { success: true };
  }

  removeModule(moduleId, rank) {
    const rankKey = `rank${rank}`;
    this.baseEgo.modules[rankKey] = this.baseEgo.modules[rankKey].filter(m => m.id !== moduleId);
  }

  selectBenefit(benefit) { this.baseEgo.powerBenefit = benefit; }
  selectPassive(passiveId) { this.baseEgo.passiveId = passiveId; this.baseEgo.passiveChoice = ''; }
  selectPassiveChoice(choice) { this.baseEgo.passiveChoice = choice; }

  nextStep() {
    const order = ['selectBase','configureDice','addModules','chooseBenefit','selectPassive','finalize'];
    const idx = order.indexOf(this.currentStep);
    if (idx < order.length - 1) this.currentStep = order[idx + 1];
  }
  previousStep() {
    const order = ['selectBase','configureDice','addModules','chooseBenefit','selectPassive','finalize'];
    const idx = order.indexOf(this.currentStep);
    if (idx > 0) this.currentStep = order[idx - 1];
  }

  setEgoName(name) { this.baseEgo.name = name; }
  setEgoDescription(desc) { this.baseEgo.description = desc; }
  async setEgoImage(file) {
    if (!file) { this.baseEgo.image = null; return; }
    // Convert to data URL for preview/storage
    const reader = new FileReader();
    const p = new Promise((resolve) => {
      reader.onload = () => { this.baseEgo.image = reader.result; resolve(true); };
      reader.readAsDataURL(file);
    });
    return p;
  }

  cancel() { if (typeof this.onCancel === 'function') this.onCancel(); }

  finalizeEgo() {
    // Validate required fields
    const missing = [];
    if (!this.baseEgo.baseId) missing.push('Base');
    if (!this.baseEgo.name || this.baseEgo.name.trim() === '') missing.push('Name');
    if ((this.baseEgo.modules.rank1 || []).length !== 3) missing.push('3x Rank 1 modules');
    if ((this.baseEgo.modules.rank2 || []).length !== 1) missing.push('1x Rank 2 module');
    if ((this.baseEgo.modules.rank3 || []).length !== 1) missing.push('1x Rank 3 module');

    if (missing.length > 0) {
      return { success: false, error: 'Missing or invalid fields: ' + missing.join(', ') };
    }

    const finalEgo = {
      id: 'base_ego_' + Date.now(),
      name: this.baseEgo.name,
      rating: this.baseEgo.rating,
      emotionCost: this.baseEgo.emotionCost,
      baseId: this.baseEgo.baseId,
      baseName: this.baseEgo.baseName,
      baseCost: this.baseEgo.cost,
      dice: this.baseEgo.dice.map(d => ({ ...d })),
      modules: { ...this.baseEgo.modules },
      powerBenefit: this.baseEgo.powerBenefit,
      passiveId: this.baseEgo.passiveId,
      passiveChoice: this.baseEgo.passiveChoice,
      passive: baseEgoPassiveManager.formatPassiveForDisplay(this.baseEgo.passiveId, this.baseEgo.passiveChoice),
      createdAt: new Date().toISOString(),
      image: this.baseEgo.image || null,
      description: this.baseEgo.description || ''
    };
    if (typeof this.onSave === 'function') this.onSave(finalEgo);
    return { success: true, ego: finalEgo };
  }
}
