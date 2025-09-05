/**
 * Stars of the City - Base E.G.O. Creator Component
 * Handles the creation of Base E.G.O. at Level 2 following specific rules
 */

import { skillBasesManager } from '../skillBases.js';
import { skillModulesManager } from '../skillModules.js';
import { baseEgoPassiveManager } from '../baseEgoPassives.js';

export class BaseEGOCreator {
  constructor(character, onSave, onCancel) {
    this.character = character;
    this.onSave = onSave;
    this.onCancel = onCancel;
    this.currentStep = 'selectBase';
    this.baseEgo = {
      name: '',
      baseId: '',
      baseName: '',
      cost: 0,
      dice: [],
      modules: {
        rank1: [],
        rank2: [],
        rank3: []
      },
      powerBenefit: '', // 'dice_power' or 'cost_bonus'
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

  // Initialize the creator
  init() {
    // Get bases with cost 2 or higher for E.G.O.
    this.availableBases = skillBasesManager.getEgoBases();
    
    // Get available modules (excluding those with [Limit] tag)
    this.availableModules.rank1 = skillModulesManager.getModulesByRank(1)
      .filter(module => !module.tags || !module.tags.includes('[Limit]'));
    this.availableModules.rank2 = skillModulesManager.getModulesByRank(2)
      .filter(module => !module.tags || !module.tags.includes('[Limit]'));
    this.availableModules.rank3 = skillModulesManager.getModulesByRank(3)
      .filter(module => !module.tags || !module.tags.includes('[Limit]'));
    
    // Get available Base E.G.O. passives
    this.availablePassives = baseEgoPassiveManager.getAllPassives();
  }

  // Render the creator interface
  render() {
    return `
      <div class="base-ego-creator">
        <div class="creator-header">
          <h2>Create Base E.G.O.</h2>
          <p>At Level 2, you must create your Base E.G.O. representing a budding seed of Light.</p>
        </div>

        <div class="creator-steps">
          ${this.renderStepIndicator()}
          ${this.renderCurrentStep()}
        </div>

        <div class="creator-actions">
          ${this.renderNavigationButtons()}
        </div>
      </div>
    `;
  }

  // Render step indicator
  renderStepIndicator() {
    const steps = [
      { id: 'selectBase', name: 'Select Base', completed: this.baseEgo.baseId !== '' },
      { id: 'addModules', name: 'Add Modules', completed: this.isModulesComplete() },
      { id: 'chooseBenefit', name: 'Choose Benefit', completed: this.baseEgo.powerBenefit !== '' },
      { id: 'selectPassive', name: 'Select Passive', completed: this.baseEgo.passiveId !== '' },
      { id: 'finalize', name: 'Finalize', completed: false }
    ];

    return `
      <div class="step-indicator">
        ${steps.map((step, index) => `
          <div class="step ${this.currentStep === step.id ? 'active' : ''} ${step.completed ? 'completed' : ''}">
            <div class="step-number">${index + 1}</div>
            <div class="step-name">${step.name}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Render current step content
  renderCurrentStep() {
    switch (this.currentStep) {
      case 'selectBase':
        return this.renderBaseSelection();
      case 'addModules':
        return this.renderModuleSelection();
      case 'chooseBenefit':
        return this.renderBenefitSelection();
      case 'selectPassive':
        return this.renderPassiveSelection();
      case 'finalize':
        return this.renderFinalization();
      default:
        return '<div>Unknown step</div>';
    }
  }

  // Render base selection step
  renderBaseSelection() {
    return `
      <div class="step-content">
        <h3>Step 1: Choose a Base for the Skill</h3>
        <p>The base must have a Cost of 2 or higher.</p>
        
        <div class="base-grid">
          ${this.availableBases.map(base => `
            <div class="base-card ${this.baseEgo.baseId === base.id ? 'selected' : ''}" 
                 data-base-id="${base.id}">
              <div class="base-header">
                <h4>${base.name}</h4>
                <span class="base-cost">Cost: ${base.cost}</span>
              </div>
              <div class="base-dice">
                ${base.dice.map(die => `<span class="die-notation">${die.tag} ${die.notation}</span>`).join('')}
              </div>
              <div class="base-description">${base.description}</div>
            </div>
          `).join('')}
        </div>

        ${this.baseEgo.baseId ? `
          <div class="selected-base-preview">
            <h4>Selected Base: ${this.baseEgo.baseName}</h4>
            <p>Cost: ${this.baseEgo.cost}</p>
            <p>Dice: ${this.baseEgo.dice.length} dice</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Render module selection step
  renderModuleSelection() {
    return `
      <div class="step-content">
        <h3>Step 2: Add Skill Modules</h3>
        <p>Add exactly: <strong>3 Rank 1</strong>, <strong>1 Rank 2</strong>, and <strong>1 Rank 3</strong> modules.</p>
        <p><em>You cannot add Spare Modules to this E.G.O, and it cannot be modified mid-mission.</em></p>

        <div class="module-requirements">
          <div class="requirement-item">
            <span>Rank 1 Modules:</span>
            <span class="count">${this.baseEgo.modules.rank1.length}/3</span>
          </div>
          <div class="requirement-item">
            <span>Rank 2 Modules:</span>
            <span class="count">${this.baseEgo.modules.rank2.length}/1</span>
          </div>
          <div class="requirement-item">
            <span>Rank 3 Modules:</span>
            <span class="count">${this.baseEgo.modules.rank3.length}/1</span>
          </div>
        </div>

        <div class="module-selection">
          ${this.renderModuleRankSelection(1)}
          ${this.renderModuleRankSelection(2)}
          ${this.renderModuleRankSelection(3)}
        </div>

        <div class="selected-modules">
          <h4>Selected Modules</h4>
          ${this.renderSelectedModules()}
        </div>
      </div>
    `;
  }

  // Render module rank selection
  renderModuleRankSelection(rank) {
    const currentCount = this.baseEgo.modules[`rank${rank}`].length;
    const maxCount = rank === 1 ? 3 : 1;
    const canAddMore = currentCount < maxCount;

    return `
      <div class="module-rank-section">
        <h4>Rank ${rank} Modules (${currentCount}/${maxCount})</h4>
        <div class="module-grid ${!canAddMore ? 'disabled' : ''}">
          ${this.availableModules[`rank${rank}`].map(module => {
            const isSelected = this.baseEgo.modules[`rank${rank}`].some(m => m.id === module.id);
            const canSelect = canAddMore && (!isSelected || module.repeating);
            return `
              <div class="module-card ${!canSelect ? 'disabled' : ''} ${isSelected ? 'selected' : ''}"
                   data-module-id="${module.id}" data-module-rank="${rank}">
                <div class="module-header">
                  <h5>${module.name}</h5>
                  ${module.repeating ? '<span class="repeating-badge">Repeating</span>' : ''}
                </div>
                <div class="module-effect">${module.effect}</div>
                <div class="module-description">${module.description}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Render selected modules
  renderSelectedModules() {
    const allSelected = [
      ...this.baseEgo.modules.rank1.map(m => ({ ...m, rank: 1 })),
      ...this.baseEgo.modules.rank2.map(m => ({ ...m, rank: 2 })),
      ...this.baseEgo.modules.rank3.map(m => ({ ...m, rank: 3 }))
    ];

    if (allSelected.length === 0) {
      return '<p>No modules selected yet.</p>';
    }

    return `
      <div class="selected-modules-list">
        ${allSelected.map((module, index) => `
          <div class="selected-module">
            <span class="module-info">
              <strong>${module.name}</strong> (Rank ${module.rank}): ${module.effect}
            </span>
            <button class="remove-module-btn" data-module-index="${index}" data-module-rank="${module.rank}">×</button>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Render benefit selection step
  renderBenefitSelection() {
    const diceCount = this.baseEgo.dice.length;
    let benefitDescription = '';
    
    if (diceCount === 1) {
      benefitDescription = 'Single Die: +3 Power';
    } else if (diceCount === 2) {
      benefitDescription = '2 Dice: +2 Power each';
    } else if (diceCount >= 3) {
      benefitDescription = '3+ Dice: +1 Power each';
    }

    return `
      <div class="step-content">
        <h3>Step 3: Choose Benefit</h3>
        <p>Choose 1 of the following benefits:</p>

        <div class="benefit-options">
          <div class="benefit-option ${this.baseEgo.powerBenefit === 'dice_power' ? 'selected' : ''}"
               data-benefit="dice_power">
            <h4>Dice Power Bonus</h4>
            <p><strong>${benefitDescription}</strong></p>
            <p>Enhances the raw power of your E.G.O.'s dice based on the number of dice.</p>
          </div>

          <div class="benefit-option ${this.baseEgo.powerBenefit === 'cost_bonus' ? 'selected' : ''}"
               data-benefit="cost_bonus">
            <h4>Cost Enhancement</h4>
            <p><strong>Any skill module with a {Cost} effect treats {Cost} as being 1 higher.</strong></p>
            <p>Increases the effectiveness of cost-based effects in your E.G.O.</p>
          </div>
        </div>
      </div>
    `;
  }

  // Render passive selection step
  renderPassiveSelection() {
    return `
      <div class="step-content">
        <h3>Step 4: Pick a Passive from the Base Passives List</h3>
        <p>Select one passive ability that will be active while your Base E.G.O. is equipped.</p>

        <div class="passive-grid">
          ${this.availablePassives.map(passive => `
            <div class="passive-card ${this.baseEgo.passiveId === passive.id ? 'selected' : ''}"
                 data-passive-id="${passive.id}">
              <div class="passive-header">
                <h4>${passive.name}</h4>
                ${passive.requiresChoice ? '<span class="choice-badge">Requires Choice</span>' : ''}
              </div>
              <div class="passive-description">${passive.description}</div>
            </div>
          `).join('')}
        </div>

        ${this.renderPassiveChoice()}
      </div>
    `;
  }

  // Render passive choice if needed
  renderPassiveChoice() {
    if (!this.baseEgo.passiveId) return '';

    const passive = baseEgoPassiveManager.getPassiveById(this.baseEgo.passiveId);
    if (!passive || !passive.requiresChoice) return '';

    return `
      <div class="passive-choice-section">
        <h4>Choose ${passive.choiceType}:</h4>
        <div class="choice-options">
          ${passive.choices.map(choice => `
            <button class="choice-btn ${this.baseEgo.passiveChoice === choice ? 'selected' : ''}"
                    data-choice="${choice}">
              ${choice}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Render finalization step
  renderFinalization() {
    return `
      <div class="step-content">
        <h3>Step 5: Finalize Your Base E.G.O.</h3>
        
        <div class="ego-name-section">
          <label for="ego-name">Nome do E.G.O.:</label>
          <input type="text" id="ego-name" value="${this.baseEgo.name}"
                 placeholder="Digite o nome do seu E.G.O.">
        </div>

        <div class="ego-preview">
          <h4>Base E.G.O. Preview</h4>
          ${this.renderEgoPreview()}
        </div>

        <div class="finalization-requirements">
          <h4>Requirements Summary</h4>
          <ul>
            <li>✓ Base Cost: ${this.baseEgo.cost} (≥ 2)</li>
            <li>✓ Modules: ${this.baseEgo.modules.rank1.length} Rank 1, ${this.baseEgo.modules.rank2.length} Rank 2, ${this.baseEgo.modules.rank3.length} Rank 3</li>
            <li>✓ Power Benefit: ${this.baseEgo.powerBenefit === 'dice_power' ? 'Dice Power Bonus' : 'Cost Enhancement'}</li>
            <li>✓ Passive: ${baseEgoPassiveManager.getPassiveById(this.baseEgo.passiveId)?.name || 'None'}</li>
            <li>✓ Emotion Point Cost: ${this.baseEgo.emotionCost}</li>
            <li>✓ Rating: ${this.baseEgo.rating}</li>
          </ul>
        </div>
      </div>
    `;
  }

  // Render E.G.O. preview
  renderEgoPreview() {
    const passive = baseEgoPassiveManager.getPassiveById(this.baseEgo.passiveId);
    const passiveDescription = passive ? 
      baseEgoPassiveManager.resolvePassiveDescription(this.baseEgo.passiveId, this.baseEgo.passiveChoice) :
      'No passive selected';

    return `
      <div class="ego-preview-card">
        <div class="ego-header">
          <h4>${this.baseEgo.name || 'Unnamed E.G.O.'}</h4>
          <span class="ego-rating">${this.baseEgo.rating}</span>
        </div>
        
        <div class="ego-stats">
          <div>Cost: ${this.baseEgo.emotionCost} Emotion Points</div>
          <div>Base: ${this.baseEgo.baseName} (Cost ${this.baseEgo.cost})</div>
        </div>

        <div class="ego-dice">
          ${this.baseEgo.dice.map(die => `
            <div class="die-preview">${die.tag} ${die.notation}</div>
          `).join('')}
        </div>

        <div class="ego-benefit">
          <strong>Benefit:</strong> ${this.baseEgo.powerBenefit === 'dice_power' ? 
            this.getDicePowerDescription() : 
            'Cost effects treat {Cost} as 1 higher'}
        </div>

        <div class="ego-passive">
          <strong>E.G.O. Passive:</strong> ${passive ? passive.name : 'None'}
          <div class="passive-description">${passiveDescription}</div>
          <em>Remains active even when the EGO isn't usable.</em>
        </div>

        <div class="ego-modules">
          <strong>Modules:</strong>
          <ul>
            ${this.baseEgo.modules.rank1.map(m => `<li>T1: ${m.name}</li>`).join('')}
            ${this.baseEgo.modules.rank2.map(m => `<li>T2: ${m.name}</li>`).join('')}
            ${this.baseEgo.modules.rank3.map(m => `<li>T3: ${m.name}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  // Get dice power benefit description
  getDicePowerDescription() {
    const diceCount = this.baseEgo.dice.length;
    if (diceCount === 1) return '+3 Power to single die';
    if (diceCount === 2) return '+2 Power to each die';
    if (diceCount >= 3) return '+1 Power to each die';
    return 'No dice power bonus';
  }

  // Render navigation buttons
  renderNavigationButtons() {
    const canProceed = this.canProceedToNextStep();
    const canGoBack = this.currentStep !== 'selectBase';

    return `
      <div class="navigation-buttons">
        <button class="btn-secondary" id="cancel-ego-btn">Cancel</button>
        ${canGoBack ? '<button class="btn-secondary" id="back-step-btn">Back</button>' : ''}
        ${canProceed ? `
          <button class="btn-primary" id="next-step-btn">
            ${this.currentStep === 'finalize' ? 'Create E.G.O.' : 'Next'}
          </button>
        ` : ''}
      </div>
    `;
  }

  // Check if can proceed to next step
  canProceedToNextStep() {
    switch (this.currentStep) {
      case 'selectBase':
        return this.baseEgo.baseId !== '';
      case 'addModules':
        return this.isModulesComplete();
      case 'chooseBenefit':
        return this.baseEgo.powerBenefit !== '';
      case 'selectPassive':
        return this.isPassiveComplete();
      case 'finalize':
        return this.baseEgo.name.trim() !== '';
      default:
        return false;
    }
  }

  // Check if modules are complete
  isModulesComplete() {
    return this.baseEgo.modules.rank1.length === 3 &&
           this.baseEgo.modules.rank2.length === 1 &&
           this.baseEgo.modules.rank3.length === 1;
  }

  // Check if passive selection is complete
  isPassiveComplete() {
    if (!this.baseEgo.passiveId) return false;
    
    const passive = baseEgoPassiveManager.getPassiveById(this.baseEgo.passiveId);
    if (!passive) return false;
    
    if (passive.requiresChoice) {
      return this.baseEgo.passiveChoice !== '';
    }
    
    return true;
  }

  // Handle base selection
  selectBase(baseId) {
    const base = skillBasesManager.getBaseById(baseId);
    if (!base || base.cost < 2) return;

    this.baseEgo.baseId = baseId;
    this.baseEgo.baseName = base.name;
    this.baseEgo.cost = base.cost;
    this.baseEgo.dice = base.dice.map(die => ({ ...die }));
  }

  // Handle module selection
  selectModule(moduleId, rank) {
    const rankKey = `rank${rank}`;
    const maxCount = rank === 1 ? 3 : 1;
    
    if (this.baseEgo.modules[rankKey].length >= maxCount) return;

    const module = skillModulesManager.getModuleById(moduleId, rank);
    if (!module) return;

    // Check if already selected (unless repeating)
    const isSelected = this.baseEgo.modules[rankKey].some(m => m.id === moduleId);
    if (isSelected && !module.repeating) return;

    this.baseEgo.modules[rankKey].push({
      id: moduleId,
      name: module.name,
      effect: module.effect,
      rank: rank
    });
  }

  // Handle module removal
  removeModule(moduleId, rank) {
    const rankKey = `rank${rank}`;
    this.baseEgo.modules[rankKey] = this.baseEgo.modules[rankKey]
      .filter(m => m.id !== moduleId);
  }

  // Handle benefit selection
  selectBenefit(benefit) {
    this.baseEgo.powerBenefit = benefit;
  }

  // Handle passive selection
  selectPassive(passiveId) {
    this.baseEgo.passiveId = passiveId;
    this.baseEgo.passiveChoice = ''; // Reset choice when changing passive
  }

  // Handle passive choice
  selectPassiveChoice(choice) {
    this.baseEgo.passiveChoice = choice;
  }

  // Handle step navigation
  nextStep() {
    const steps = ['selectBase', 'addModules', 'chooseBenefit', 'selectPassive', 'finalize'];
    const currentIndex = steps.indexOf(this.currentStep);
    
    if (currentIndex < steps.length - 1) {
      this.currentStep = steps[currentIndex + 1];
    } else if (this.currentStep === 'finalize') {
      this.finalizeEgo();
    }
  }

  // Handle back navigation
  previousStep() {
    const steps = ['selectBase', 'addModules', 'chooseBenefit', 'selectPassive', 'finalize'];
    const currentIndex = steps.indexOf(this.currentStep);
    
    if (currentIndex > 0) {
      this.currentStep = steps[currentIndex - 1];
    }
  }

  // Finalize and create the E.G.O.
  finalizeEgo() {
    const finalEgo = {
      id: 'base_ego',
      name: this.baseEgo.name,
      rating: this.baseEgo.rating,
      emotionCost: this.baseEgo.emotionCost,
      baseId: this.baseEgo.baseId,
      baseName: this.baseEgo.baseName,
      baseCost: this.baseEgo.cost,
      dice: this.baseEgo.dice.map(die => ({ ...die })),
      modules: { ...this.baseEgo.modules },
      powerBenefit: this.baseEgo.powerBenefit,
      passiveId: this.baseEgo.passiveId,
      passiveChoice: this.baseEgo.passiveChoice,
      passive: baseEgoPassiveManager.formatPassiveForDisplay(
        this.baseEgo.passiveId, 
        this.baseEgo.passiveChoice
      ),
      createdAt: new Date().toISOString()
    };

    this.onSave(finalEgo);
  }

  // Set E.G.O. name
  setEgoName(name) {
    this.baseEgo.name = name;
  }

  // Cancel creation
  cancel() {
    this.onCancel();
  }
}
