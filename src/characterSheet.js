// Example skill template for use in character objects:
// const burningBladeSkill = {
//   id: 'burning_blade',
//   name: 'Burning Blade',
//   baseName: 'Triple Threat',
//   cost: 2,
//   dice: [
//     { tag: '[Slash]', notation: '1d6', type: 'offensive', effects: ['[Hit] Inflict 3 Burn'] },
//     { tag: '[Block]', notation: '1d6+1', type: 'defensive', effects: [] },
//     { tag: '[Slash]', notation: '1d6', type: 'offensive', effects: ['[Hit] Inflict 3 Burn'] }
//   ],
//   modules: [
//     { id: 'power_up', rank: 1 },
//     { id: 'burn', rank: 1 },
//     { id: 'burn', rank: 1 },
//     { id: 'heal', rank: 2 }
//   ],
//   tags: ['[Slash]', '[Block]', '[Hit]', '[Burn]'],
//   description: `[On Use] Reduce 1 Ailment on self by 4\n\n[Slash] 1d6 [Hit] Inflict 3 Burn\n[Block] 1d6+1\n[Slash] 1d6 [Hit] Inflict 3 Burn\n\nModules: T1: Stronger, Burning x2 | T2: Curative`
// };
import { CharacterManager } from './character.js';
import { ChatSystem } from './chatSystem.js';
import { arquetipos } from './arquetipos.js';
import SkillCreator from './skillCreator.js';
import { skillBasesManager } from './skillBases.js';
import { skillModulesManager } from './skillModules.js';
import { BaseEGOCreator } from './components/BaseEGOCreator.js';
import { themeHues, themeBrandMap, brandProfiles, getBrandProfile } from './themes/index.js';
import { RATINGS, getEgosByRating } from './prebuiltEgos.js';

export class CharacterSheet {
  constructor(userId, initialCharacterId = null) {
    this.userId = userId;
    this.initialCharacterId = initialCharacterId;
    this.characterManager = new CharacterManager(userId);
    this.characters = [];
    this.currentCharacter = null;
    this.editMode = false;
    this.currentTab = 'overview';
    this.skillCreator = null;
    this.showingSkillCreator = false;
    this.baseEgoCreator = null;
    this.showingBaseEgoCreator = false;
    const storedTheme = localStorage.getItem('sotc-theme-key');
    const storedBrand = localStorage.getItem('sotc-brand-key');
    this.currentTheme = storedTheme || 'gold';
    this.brandKey = storedBrand || (themeBrandMap[this.currentTheme] || 'default');
    this.changeTheme(this.currentTheme);
    // Recupera role e nome do usuário da sessão
    const session = JSON.parse(localStorage.getItem('sotc-current-session') || 'null');
    const userRole = session && session.role ? session.role : 'player';
    const userName = session && session.displayName ? session.displayName : 'Player';
    this.isGM = userRole === 'gm';
    this.chatSystem = new ChatSystem(userId, userName, userRole);
    this.init();
  }

  async init() {
    await this.loadCharacters();
    this.render();
    this.attachEventListeners();
    this.initializeChat();
  }

  async loadCharacters() {
    const result = await this.characterManager.loadCharacters();
    if (result.success) {
      this.characters = result.characters;

      // Ensure all characters have proper ego structure
      this.characters.forEach(char => {
        if (!char.ego) {
          char.ego = { base: null, additional: [], slots: { ZAYIN: null, TETH: null, HE: null, WAW: null, ALEPH: null } };
        } else {
          if (!char.ego.additional) {
            char.ego.additional = [];
          }
          if (!char.ego.slots) {
            char.ego.slots = { ZAYIN: null, TETH: null, HE: null, WAW: null, ALEPH: null };
          }
        }
        // Keep base and ZAYIN slot in sync
        if (char.ego.base && !char.ego.slots.ZAYIN) {
          char.ego.slots.ZAYIN = char.ego.base;
        }
        if (!char.ego.base && char.ego.slots.ZAYIN) {
          char.ego.base = char.ego.slots.ZAYIN;
        }
      });

      if (this.characters.length > 0) {
        if (this.initialCharacterId) {
          const found = this.characters.find(c => c.id === this.initialCharacterId);
          this.currentCharacter = found || this.characters[0];
        } else {
          this.currentCharacter = this.characters[0];
        }
      }
    }
  }

  render() {
    document.body.innerHTML = `
      <div class="scanlines"></div>
      <div class="terminal-container">
        <div class="terminal-header">
          <div class="header-left">
            <div class="communication-tab">CHARACTER SHEET</div>
            <div class="dashboard-tab">SOTC DATABASE</div>
          </div>
          <div class="header-right">
            <div class="theme-selector">
              <label>Theme:</label>
              <select id="theme-select"></select>
            </div>
            <button class="btn-logout" id="logout-btn">LOGOUT</button>
          </div>
        </div>

        <div class="left-panel">
          <div class="panel-section">
            <div class="panel-title">Characters</div>
            <div id="character-list">
              ${this.renderCharacterList()}
            </div>
            ${this.characters.length === 0 ? `<button class="btn-primary small-btn" id="new-character-btn">CREATE NEW</button>` : ''}
          </div>

          <div class="panel-section">
            <div class="panel-title">Navigation</div>
            <div class="nav-menu">
              <button class="nav-btn ${this.currentTab === 'overview' ? 'active' : ''}" data-tab="overview">
                Overview
              </button>
              <button class="nav-btn ${this.currentTab === 'stats' ? 'active' : ''}" data-tab="stats">
                Stats
              </button>
              <button class="nav-btn ${this.currentTab === 'skills' ? 'active' : ''}" data-tab="skills">
                Skills
              </button>
              <button class="nav-btn ${this.currentTab === 'affinities' ? 'active' : ''}" data-tab="affinities">
                Affinities
              </button>
              <button class="nav-btn ${this.currentTab === 'ego' ? 'active' : ''}" data-tab="ego">
                E.G.O
              </button>
              <button class="nav-btn ${this.currentTab === 'progression' ? 'active' : ''}" data-tab="progression">
                Progression
              </button>
            </div>
          </div>
        </div>

        <div class="main-terminal">
          <div class="corner-brackets"></div>
          
          <div class="terminal-content">
            ${this.renderMainContent()}
          </div>
        </div>

        <div class="right-panel">
          ${this.renderRightPanel()}
        </div>

        </div>
    `;

    this.setupThemeSelector();

    // Força atualização do chat após render
    setTimeout(() => {
      this.updateChatDisplay(this.chatSystem.messages);
    }, 0);

    // Garantir que os event listeners sejam aplicados após o DOM estar pronto
    setTimeout(() => {
      this.attachEventListeners();
    }, 10);
  }

  renderCharacterList() {
    if (this.characters.length === 0) {
      return '<div class="no-characters">No characters created</div>';
    }

    // Só permite um personagem
    return this.characters.slice(0, 1).map(char => {
      const archetype = char.archetype || 'Unknown';
      const name = char.name || 'Unnamed';
      const level = char.level || 1;
      const imageUrl = char.imageUrl || '';
      return `
        <div class="character-card-gm character-item ${this.currentCharacter?.id === char.id ? 'active' : ''}" data-character-id="${char.id}" style="cursor:pointer;">
          <div class="character-card-header">
            <div class="archetype-label">${archetype.toUpperCase()}</div>
          </div>
          <div class="character-image-container">
            ${imageUrl ?
              `<img src="${imageUrl}" alt="${name}" class="character-portrait" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
               <div class="character-placeholder" style="display: none;">
                 <span class="placeholder-icon">👤</span>
               </div>` :
              `<div class="character-placeholder">
                 <span class="placeholder-icon">��</span>
               </div>`
            }
          </div>
          <div class="character-card-footer">
            <div class="character-name">${name}</div>
            <div class="character-level">Level ${level}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderMainContent() {
    if (!this.currentCharacter) {
      return `
        <div class="terminal-title">NO CHARACTER SELECTED</div>
        <div class="terminal-subtitle">Create or select a character to begin</div>
        <div class="welcome-message">
          Welcome to the Stars of the City character database.<br>
          Create your first character to get started.
        </div>
      `;
    }

    switch (this.currentTab) {
      case 'overview':
        return this.renderOverviewTab();
      case 'stats':
        return this.renderStatsTab();
      case 'skills':
        return this.renderSkillsTab();
      case 'affinities':
        return this.renderAffinitiesTab();
      case 'ego':
        return this.renderEgoTab();
      case 'progression':
        return this.renderProgressionTab();
      default:
        return this.renderOverviewTab();
    }
  }

  renderOverviewTab() {
    const char = this.currentCharacter;
    if (!char) return '<div class="no-character">No character selected</div>';

    const isEditing = this.editMode;

    // Import and check archetype properly
    const selectedArchetype = char.archetype ? arquetipos.find(a => a.nome === char.archetype) : null;

    return `
      <div class="terminal-title">
        ${char.imageUrl ? `<img src="${char.imageUrl}" alt="Character Image" class="character-image" style="max-width:120px;max-height:120px;border-radius:8px;display:block;margin:0 auto 10px auto;">` : ''}
        ${char.name || 'UNNAMED CHARACTER'}
      </div>
      <div class="terminal-subtitle">Level ${char.level} ${char.archetype || 'No Archetype'}</div>

      <div class="character-overview">
        <!-- T-Formation Top Row: Basic Info + Derivative Stats -->
        <div class="overview-top-row">
          <div class="overview-section basic-info-section">
            <div class="section-header">
              <h3>Basic Information</h3>
              <button class="btn-edit" id="edit-basic-btn">${isEditing ? 'SAVE' : 'EDIT'}</button>
            </div>
            <div class="info-grid">
              ${isEditing ? `
              <div class="info-item">
                <label>Character Image:</label>
                <div class="image-upload-container">
                  <div class="image-upload-options">
                    <input type="file" id="char-image-file" accept="image/*" class="form-input-file" style="display: none;">
                    <button type="button" class="btn-secondary" id="upload-image-btn">Upload Image</button>
                    <span class="upload-separator">OR</span>
                    <input type="text" id="char-image-url" value="${char.imageUrl || ''}" class="form-input image-url-input" placeholder="Cole o link da imagem">
                  </div>
                  <canvas id="image-crop-canvas" class="image-crop-canvas" style="display: none;"></canvas>
                  <div class="crop-controls" id="crop-controls" style="display: none;">
                    <button type="button" class="btn-primary" id="confirm-crop-btn">Confirmar Recorte</button>
                    <button type="button" class="btn-secondary" id="cancel-crop-btn">Cancelar</button>
                  </div>
                </div>
              </div>
              ` : ''}
              <div class="info-item">
                <label>Name:</label>
                ${isEditing ?
                  `<input type="text" id="char-name" value="${char.name || ''}" class="form-input">` :
                  `<span>${char.name || 'Unnamed'}</span>`
                }
              </div>
              <div class="info-item">
                <label>Archetype:</label>
                ${isEditing ?
                  `<select id="char-archetype" class="form-input">
                    <option value="">Selecione um arquétipo</option>
                    ${arquetipos.map(arch =>
                      `<option value="${arch.nome}" ${char.archetype === arch.nome ? 'selected' : ''}>${arch.nome}</option>`
                    ).join('')}
                  </select>` :
                  `<span>${char.archetype || 'None'}</span>`
                }
              </div>
              <div class="info-item">
                <label>Level:</label>
                <span>${char.level}</span>
              </div>
              <div class="info-item">
                <label>Experience:</label>
                <span>${char.experience}/100</span>
              </div>
            </div>
          </div>

          <div class="overview-section derivative-stats-section">
            <h3>Derivative Stats</h3>
            <div class="derivative-stats-container">
              <!-- HP with progress bar -->
              <div class="stat-with-bar">
                <div class="stat-header">
                  <label class="stat-label">HP</label>
                  <div class="stat-controls">
                    <button class="stat-btn minus" data-stat="currentHp" data-change="-1">−</button>
                    <span class="stat-display">${char.derivativeStats.currentHp || char.derivativeStats.hp}/${char.derivativeStats.hp}</span>
                    <button class="stat-btn plus" data-stat="currentHp" data-change="1">+</button>
                  </div>
                </div>
                <div class="stat-progress-bar">
                  <div class="stat-progress-fill" style="width: ${((char.derivativeStats.currentHp || char.derivativeStats.hp) / char.derivativeStats.hp * 100).toFixed(1)}%"></div>
                </div>
              </div>

              <!-- Stagger Resist with progress bar -->
              <div class="stat-with-bar">
                <div class="stat-header">
                  <label class="stat-label">Stagger Resist</label>
                  <div class="stat-controls">
                    <button class="stat-btn minus" data-stat="currentStaggerResist" data-change="-1">−</button>
                    <span class="stat-display">${char.derivativeStats.currentStaggerResist || char.derivativeStats.staggerResist}/${char.derivativeStats.staggerResist}</span>
                    <button class="stat-btn plus" data-stat="currentStaggerResist" data-change="1">+</button>
                  </div>
                </div>
                <div class="stat-progress-bar">
                  <div class="stat-progress-fill" style="width: ${((char.derivativeStats.currentStaggerResist || char.derivativeStats.staggerResist) / char.derivativeStats.staggerResist * 100).toFixed(1)}%"></div>
                </div>
              </div>

              <!-- Light with progress bar -->
              <div class="stat-with-bar">
                <div class="stat-header">
                  <label class="stat-label">Light</label>
                  <div class="stat-controls">
                    <button class="stat-btn minus" data-stat="currentLight" data-change="-1">−</button>
                    <span class="stat-display">${char.derivativeStats.currentLight}/${char.derivativeStats.maxLight}</span>
                    <button class="stat-btn plus" data-stat="currentLight" data-change="1">+</button>
                  </div>
                </div>
                <div class="stat-progress-bar">
                  <div class="stat-progress-fill" style="width: ${(char.derivativeStats.currentLight / char.derivativeStats.maxLight * 100).toFixed(1)}%"></div>
                </div>
              </div>

              <!-- Emotion Points with progress bar -->
              <div class="stat-with-bar">
                <div class="stat-header">
                  <label class="stat-label">Emotion Points</label>
                  <div class="stat-controls">
                    <button class="stat-btn minus" data-stat="currentEmotionPoints" data-change="-1">−</button>
                    <span class="stat-display">${char.derivativeStats.currentEmotionPoints || char.derivativeStats.emotionPoints}/${char.derivativeStats.emotionPoints}</span>
                    <button class="stat-btn plus" data-stat="currentEmotionPoints" data-change="1">+</button>
                  </div>
                </div>
                <div class="stat-progress-bar">
                  <div class="stat-progress-fill" style="width: ${((char.derivativeStats.currentEmotionPoints || char.derivativeStats.emotionPoints) / char.derivativeStats.emotionPoints * 100).toFixed(1)}%"></div>
                </div>
              </div>
                            <!-- Speed Die (no controls, just display) -->
              <div class="stat-box">
                <div class="stat-label">Speed Die</div>
                <div class="stat-value">${char.derivativeStats.speedDieSize}</div>
              </div>
            </div>
          </div>
        </div>
        

        <!-- T-Formation Bottom: Character Details + Archetype Info (Full Width) -->
        <div class="overview-bottom-row">
          <div class="overview-section character-details-section">
            <h3>Character Details</h3>
            <div class="details-grid">
              <div class="detail-item">
                <label>Appearance:</label>
                ${isEditing ?
                  `<textarea id="char-appearance" class="form-textarea">${char.details.appearance || ''}</textarea>` :
                  `<div class="detail-text">${char.details.appearance || 'No description'}</div>`
                }
              </div>
              <div class="detail-item">
                <label>Backstory:</label>
                ${isEditing ?
                  `<textarea id="char-backstory" class="form-textarea">${char.details.backstory || ''}</textarea>` :
                  `<div class="detail-text">${char.details.backstory || 'No backstory'}</div>`
                }
              </div>
            </div>
          </div>

          ${selectedArchetype ? `
          <div class="overview-section archetype-details-section">
            <h3>Archetype: ${selectedArchetype.nome}</h3>
            <div class="archetype-details-panel">
              <div class="archetype-description">${selectedArchetype.descricao}</div>
              <div class="archetype-section">
                <strong>Tragic Flaw:</strong> ${selectedArchetype.tragicFlaw.nome} - ${selectedArchetype.tragicFlaw.descricao}
              </div>
              <div class="archetype-section">
                <strong>Story Abilities:</strong>
                <ul id="archetype-story-abilities-list">
                  ${(() => {
                    // Abilities atreladas ao personagem (iniciais + extras)
                    const existing = char.extraArchetypeAbilities || [];
                    const standard = selectedArchetype.storyAbilities.map(a => a.nome);
                    const allNames = [...standard, ...existing];
                    // Evita duplicatas
                    const uniqNames = [...new Set(allNames)];
                    return uniqNames.map(nome => {
                      const abil = selectedArchetype.storyAbilities.find(sa => sa.nome === nome);
                      if (!abil) return '';
                      const isExtra = existing.includes(nome);
                      return `<li><strong>${abil.nome}:</strong> ${abil.descricao} ${isExtra ? '<span style="color:#cb5">(extra)</span> <button class="remove-extra-ability-btn" data-ability="'+abil.nome+'" style="color:#c44;font-size:0.8em;margin-left:4px;">remover</button>' : ''}</li>`;
                    }).join('');
                  })()}
                </ul>
                <button class="btn-secondary small-btn" id="add-archetype-ability-btn">Adicionar Ability</button>
                <select id="add-archetype-ability-select" style="margin-top:4px;display:none;"></select>
              </div>
              <div class="archetype-section">
                <strong>Battle Ability:</strong>
                <ul id="archetype-battle-abilities-list">
                  ${(() => {
                    // Suporta arrays, fallback para padrão
                    const baseArr = selectedArchetype.battleAbilitys && Array.isArray(selectedArchetype.battleAbilitys)
                      ? selectedArchetype.battleAbilitys
                      : [selectedArchetype.battleAbility];
                    const extras = char.extraBattleAbilities || [];
                    const stdName = baseArr[0]?.nome;
                    const all = [stdName, ...extras].filter(Boolean);
                    return all.map(nome => {
                      let abil = baseArr.find(b=>b.nome===nome);
                      if (!abil && selectedArchetype.battleAbility && selectedArchetype.battleAbility.nome === nome) {
                        abil = selectedArchetype.battleAbility;
                      }
                      if(!abil) return '';
                      const isExtra = extras.includes(nome);
                      return `<li><strong>${abil.nome}:</strong> ${abil.descricao} ${isExtra?'<span style="color:#cb5">(extra)</span> <button class="remove-extra-battle-btn" data-ability="'+abil.nome+'" style="color:#c44;font-size:0.8em;margin-left:4px;">remover</button>':''}</li>`;
                    }).join('');
                  })()}
                </ul>
                <button class="btn-secondary small-btn" id="add-battle-ability-btn">Adicionar Battle</button>
                <select id="add-battle-ability-select" style="margin-top:4px;display:none;"></select>
              </div>
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderStatsTab() {
    const char = this.currentCharacter;
    const isEditing = this.editMode;
    const stats = char.stats || {};
    const milestones = char.milestones || { might: [], vitality: [], agility: [], intellect: [], instinct: [], persona: [] };

    return `
      <div class="terminal-title">CHARACTER STATS</div>
      <div class="terminal-subtitle">Core attributes and derivative values</div>

      <div class="stats-container">
        <div class="stats-section">
          <div class="section-header">
            <h3>Core Stats</h3>
            <button class="btn-edit" id="edit-stats-btn">${isEditing ? 'SAVE' : 'EDIT'}</button>
          </div>
          
          <div class="stats-assignment">
            <div class="assignment-info">
              Assign these values: 4, 3, 3, 2, 2, 1 (Total: 15)
              ${isEditing ? `<div id="stats-validation" class="validation-message"></div>` : ''}
            </div>
          </div>

          <div class="core-stats-grid">
            ${Object.entries(stats).map(([statName, value]) => `
              <div class="stat-card">
                <div class="stat-header">
                  <h4>${statName.toUpperCase()}</h4>
                  ${isEditing ? 
                    `<select class="stat-input" data-stat="${statName}">
                      ${[1,2,3,4,5,6,7,8].map(val => `<option value="${val}" ${value === val ? 'selected' : ''}>${val}</option>`).join('')}
                    </select>` :
                    `<span class="stat-number">${value}</span>`
                  }
                </div>
                <div class="stat-description">${this.getStatDescription(statName)}</div>
                <div class="milestones">
                  <h5>Milestones:</h5>
                  <ul>
                    ${(milestones[statName] || []).map(milestone => `<li>${milestone}</li>`).join('') || '<li>None active</li>'}
                  </ul>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderSkillsTab() {
    const char = this.currentCharacter;

    if (this.showingSkillCreator && this.skillCreator) {
      return this.renderSkillCreator();
    }

    const skills = char.skills || [];
    const spareModules = this.calculateSpareModules(char);
    const levelBenefits = this.characterManager.getLevelBenefits(char.level);
    const maxSkills = levelBenefits?.totalSkills || 4;

    return `
      <div class="terminal-title">SKILLS</div>
      <div class="terminal-subtitle">Character abilities and techniques</div>

      <div class="skills-container">
        <div class="skills-header">
          <div class="skill-count">Skills: ${skills.length}/${maxSkills} (Level ${char.level})</div>
          <div class="skill-buttons">
            <button class="btn-primary ${skills.length >= maxSkills ? 'disabled' : ''}"
                    id="add-skill-btn"
                    ${skills.length >= maxSkills ? 'disabled' : ''}>
              CREATE SKILL
            </button>
          </div>
        </div>

        <div class="skills-grid">
          ${skills.length === 0 ?
            '<div class="no-skills">No skills created. Use "Create Skill" to build your first custom skill.</div>' :
            skills.map((skill, index) => this.renderSkillCard(skill, index)).join('')
          }
        </div>

        <div class="spare-modules">
          <h3>Spare Skill Modules</h3>
          <div class="modules-grid">
            <div class="module-item">
              <span>Rank 1:</span>
              <span class="module-count">${spareModules.rank1}</span>
            </div>
            <div class="module-item">
              <span>Rank 2:</span>
              <span class="module-count">${spareModules.rank2}</span>
            </div>
            <div class="module-item">
              <span>Rank 3:</span>
              <span class="module-count">${spareModules.rank3}</span>
            </div>
          </div>
          <div class="modules-info">
            <p>You start with Spare Rank 1 modules equal to your Intellect (${char.stats.intellect}), and accumulate more as you level up.</p>
            <p>Each skill has 3 Tier 1 and 1 Tier 2 Innate Modules that cannot be moved between skills.</p>
          </div>
        </div>
      </div>
    `;
  }

  renderAffinitiesTab() {
    const char = this.currentCharacter;
    const isEditing = this.editMode;

    return `
      <div class="terminal-title">AFFINITIES</div>
      <div class="terminal-subtitle">Damage and stagger resistances/weaknesses</div>
      
      <div class="affinities-container">
        <div class="affinities-section">
          <div class="section-header">
            <h3>Damage & Stagger Affinities</h3>
            <button class="btn-edit" id="edit-affinities-btn">${isEditing ? 'SAVE' : 'EDIT'}</button>
          </div>

          <div class="affinities-grid">
            <div class="affinity-type">
              <h4>Damage Types</h4>
              <div class="affinity-items">
                ${Object.entries(char.affinities.damage).map(([type, value]) => `
                  <div class="affinity-item">
                    <label>${type.toUpperCase()}:</label>
                    ${isEditing ? 
                      `<select class="affinity-select" data-type="damage" data-subtype="${type}">
                        ${[-3,-2,-1,0,1,2].map(val => `<option value="${val}" ${value === val ? 'selected' : ''}>${val >= 0 ? '+' : ''}${val}</option>`).join('')}
                      </select>` :
                      `<span class="affinity-value ${value > 0 ? 'weakness' : value < 0 ? 'resistance' : 'neutral'}">${value >= 0 ? '+' : ''}${value}</span>`
                    }
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="affinity-type">
              <h4>Stagger Types</h4>
              <div class="affinity-items">
                ${Object.entries(char.affinities.stagger).map(([type, value]) => `
                  <div class="affinity-item">
                    <label>${type.toUpperCase()}:</label>
                    ${isEditing ? 
                      `<select class="affinity-select" data-type="stagger" data-subtype="${type}">
                        ${[-3,-2,-1,0,1,2].map(val => `<option value="${val}" ${value === val ? 'selected' : ''}>${val >= 0 ? '+' : ''}${val}</option>`).join('')}
                      </select>` :
                      `<span class="affinity-value ${value > 0 ? 'weakness' : value < 0 ? 'resistance' : 'neutral'}">${value >= 0 ? '+' : ''}${value}</span>`
                    }
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="weakness-section">
            <h4>Weakness: ${char.affinities.weakness || 'Not set'}</h4>
            <p>Choose one damage or stagger type as your weakness during character creation.</p>
          </div>
        </div>
      </div>
    `;
  }

  renderEgoTab() {
    const char = this.currentCharacter;

    // Check if we should show the Base E.G.O creator
    if (this.showingBaseEgoCreator && this.baseEgoCreator) {
      return this.renderBaseEgoCreator();
    }

    // Ensure ego object exists
    if (!char.ego) {
      char.ego = { base: null, additional: [], slots: { ZAYIN: null, TETH: null, HE: null, WAW: null, ALEPH: null } };
    } else if (!char.ego.slots) {
      char.ego.slots = { ZAYIN: null, TETH: null, HE: null, WAW: null, ALEPH: null };
    }

    return `
      <div class="terminal-title">E.G.O</div>
      <div class="terminal-subtitle">Embodiment of the soul's manifestation</div>

      <div class="ego-container">
        ${char.level < 2 ? `
          <div class="ego-locked">
            <h3>E.G.O Locked</h3>
            <p>E.G.O abilities are unlocked at Level 2.</p>
            <p>Continue your character's journey to awaken their true potential.</p>
          </div>
        ` : `
          <div class="ego-section">
            <h3>E.G.O Slots</h3>
            <div class="ego-slots-grid">
              ${RATINGS.map(r => this.renderEgoSlot(r, char.ego.slots?.[r], char.level, this.currentCharacter?.imageUrl)).join('')}
            </div>
          </div>

        `}
      </div>
    `;
  }

  renderEgoSlot(rating, ego, level, fallbackImage) {
    if (!ego) {
      const canCreateBase = rating === 'ZAYIN' && level >= 2;
      const bg = fallbackImage ? `style=\"background-image:url('${fallbackImage}')\"` : '';
      return `
        <div class="ego-slot-card" data-rating="${rating}">
          <div class="ego-avatar ${fallbackImage ? 'has-image' : ''}" ${bg}></div>
          <div class="ego-slot-header">
            <h4>${rating}</h4>
          </div>
          <div class="ego-slot-body">
            <div class="slot-empty">Empty slot</div>
          </div>
          <div class="ego-slot-actions">
            ${canCreateBase ? `<button class="btn-primary" id="create-base-ego-btn-slot">CREATE BASE E.G.O</button>` : ''}
            <button class="btn-primary add-prebuilt-btn" data-rating="${rating}">ADD PREBUILT</button>
          </div>
        </div>
      `;
    }

    const diceDisplay = (ego.dice || []).map(d => `${d.tag} ${d.notation}`).join('<br>');
    const img = ego.imageUrl || fallbackImage || '';
    const bg = img ? `style=\"background-image:url('${img}')\"` : '';
    return `
      <div class="ego-slot-card" data-rating="${rating}">
        <div class="ego-avatar ${img ? 'has-image' : ''}" ${bg}></div>
        <div class="ego-slot-header">
          <h4>${rating}</h4>
          <span class="ego-slot-name">${ego.name}</span>
        </div>
        <div class="ego-slot-body">
          <div class="ego-slot-desc">${ego.description || ''}</div>
          <div class="ego-slot-dice">${diceDisplay}</div>
          ${ego.passive ? `<div class="ego-slot-passive"><strong>Passive:</strong> ${ego.passive.name} — ${ego.passive.description}</div>` : ''}
        </div>
        <div class="ego-slot-actions">
          <button class="btn-secondary edit-ego-btn" data-rating="${rating}">EDIT</button>
          <button class="btn-secondary remove-ego-btn" data-rating="${rating}">REMOVE</button>
        </div>
      </div>
    `;
  }

  renderProgressionTab() {
    const char = this.currentCharacter;
    const pendingLevelUps = char.progression?.pendingLevelUps || [];
    const availableStatIncreases = char.progression?.availableStatIncreases || 0;
    const statIncreases = char.progression?.statIncreases || [];
    const levelUpHistory = char.progression?.levelUpHistory || [];

    return `
      <div class="terminal-title">CHARACTER PROGRESSION</div>
      <div class="terminal-subtitle">Level advancement and improvements</div>

      <div class="progression-container">
        <!-- Current Level Status -->
        <div class="progression-section current-level-section">
          <div class="section-header">
            <h3>Current Status</h3>
            <div class="level-controls">
              <span class="current-level">Level ${char.level}</span>
              <button class="btn-primary ${this.characterManager.canLevelUp(char).canLevel ? '' : 'disabled'}"
                      id="level-up-btn"
                      ${this.characterManager.canLevelUp(char).canLevel ? '' : 'disabled'}>
                LEVEL UP
              </button>
            </div>
          </div>

          <div class="level-benefits-preview">
            ${this.renderCurrentLevelBenefits(char)}
          </div>
        </div>

        <!-- Pending Level Ups -->
        ${pendingLevelUps.length > 0 ? `
          <div class="progression-section pending-section">
            <h3>Pending Level Benefits</h3>
            <div class="pending-levels">
              ${pendingLevelUps.map(level => this.renderPendingLevel(char, level)).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Available Stat Increases -->
        ${availableStatIncreases > 0 || statIncreases.some(s => !s.applied) ? `
          <div class="progression-section stat-increases-section">
            <h3>Available Stat Increases</h3>
            <div class="stat-increases">
              ${statIncreases.filter(s => !s.applied).map(increase => this.renderStatIncrease(char, increase)).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Improvements Section -->
        ${this.renderImprovementsSection(char)}

        <!-- Level Up History -->
        <div class="progression-section history-section">
          <h3>Level History</h3>
          <div class="level-history">
            ${levelUpHistory.length === 0 ?
              '<div class="no-history">No level ups yet.</div>' :
              levelUpHistory.map(entry => this.renderLevelHistoryEntry(entry)).join('')
            }
          </div>
        </div>

        <!-- Level Progression Table -->
        <div class="progression-section table-section">
          <h3>Level Progression Table</h3>
          <div class="progression-table">
            ${this.renderProgressionTable(char)}
          </div>
        </div>
      </div>
    `;
  }

  renderCurrentLevelBenefits(char) {
    const currentBenefits = this.characterManager.getLevelBenefits(char.level);
    const missingRequirements = this.characterManager.getMissingRequirements(char);
    const canLevelUp = this.characterManager.canLevelUp(char);

    if (!currentBenefits) return '<div class="no-benefits">No benefits data available.</div>';

    return `
      <div class="current-benefits">
        <div class="benefit-item">
          <span class="benefit-label">Total Skills:</span>
          <span class="benefit-value">${currentBenefits.totalSkills}</span>
        </div>
        ${currentBenefits.statIncrease ? `
          <div class="benefit-item">
            <span class="benefit-label">Stat Increase:</span>
            <span class="benefit-value">+${currentBenefits.statIncrease.increase}${currentBenefits.statIncrease.max ? ` (max ${currentBenefits.statIncrease.max})` : ''}</span>
          </div>
        ` : ''}
        ${currentBenefits.skillModules ? `
          <div class="benefit-item">
            <span class="benefit-label">Skill Modules:</span>
            <span class="benefit-value">${Object.entries(currentBenefits.skillModules).map(([rank, amount]) => `${amount} ${rank}`).join(', ')}</span>
          </div>
        ` : ''}
        ${currentBenefits.improvement ? `
          <div class="benefit-item">
            <span class="benefit-label">Improvement:</span>
            <span class="benefit-value">${currentBenefits.improvement}</span>
          </div>
        ` : ''}
        ${currentBenefits.hpBonus > 0 ? `
          <div class="benefit-item">
            <span class="benefit-label">HP Bonus:</span>
            <span class="benefit-value">+${currentBenefits.hpBonus}</span>
          </div>
        ` : ''}
        ${currentBenefits.ego ? `
          <div class="benefit-item">
            <span class="benefit-label">E.G.O:</span>
            <span class="benefit-value">${typeof currentBenefits.ego === 'string' ? currentBenefits.ego : Object.entries(currentBenefits.ego).map(([rank, amount]) => `${amount} ${rank}`).join(', ')}</span>
          </div>
        ` : ''}
      </div>

      ${missingRequirements.length > 0 ? `
        <div class="missing-requirements">
          <h4>Requirements Before Next Level:</h4>
          <ul class="requirements-list">
            ${missingRequirements.map(req => `
              <li class="requirement-item ${req.type}">
                <span class="requirement-icon">⚠️</span>
                <span class="requirement-text">${req.description}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      ${!canLevelUp.canLevel ? `
        <div class="level-up-blocked">
          <span class="blocked-icon">🚫</span>
          <span class="blocked-reason">${canLevelUp.reason}</span>
        </div>
      ` : ''}
    `;
  }

  renderPendingLevel(char, level) {
    const benefits = this.characterManager.getLevelBenefits(level);
    if (!benefits) return '';

    return `
      <div class="pending-level-card">
        <div class="pending-level-header">
          <h4>Level ${level}</h4>
          <button class="btn-secondary" onclick="this.applyLevelBenefits(${level})">APPLY BENEFITS</button>
        </div>
        <div class="pending-benefits">
          ${benefits.statIncrease ? `<div class="pending-benefit">Stat +${benefits.statIncrease.increase}${benefits.statIncrease.max ? ` (max ${benefits.statIncrease.max})` : ''}</div>` : ''}
          ${benefits.skillModules ? `<div class="pending-benefit">Modules: ${Object.entries(benefits.skillModules).map(([rank, amount]) => `${amount} ${rank}`).join(', ')}</div>` : ''}
          ${benefits.improvement ? `<div class="pending-benefit">Improvement: ${benefits.improvement}</div>` : ''}
          ${benefits.hpBonus > 0 ? `<div class="pending-benefit">HP +${benefits.hpBonus}</div>` : ''}
          ${benefits.ego ? `<div class="pending-benefit">E.G.O: ${typeof benefits.ego === 'string' ? benefits.ego : Object.entries(benefits.ego).map(([rank, amount]) => `${amount} ${rank}`).join(', ')}</div>` : ''}
        </div>
      </div>
    `;
  }

  renderStatIncrease(char, increase) {
    if (increase.applied) return '';

    return `
      <div class="stat-increase-card">
        <div class="stat-increase-header">
          <h4>Stat Increase (Level ${increase.level})</h4>
          ${increase.maxLimit ? `<div class="stat-limit">Max ${increase.maxLimit}</div>` : ''}
        </div>
        <div class="stat-selection">
          ${Object.entries(char.stats).map(([statName, value]) => {
            const canIncrease = !increase.maxLimit || value < increase.maxLimit;
            return `
              <button class="stat-increase-btn ${canIncrease ? '' : 'disabled'}"
                      data-stat="${statName}"
                      data-increase-level="${increase.level}"
                      ${canIncrease ? '' : 'disabled'}>
                ${statName.toUpperCase()}: ${value} ${canIncrease ? '→ ' + (value + 1) : '(Max reached)'}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  renderImprovementsSection(char) {
    const minorImprovements = char.progression?.improvements?.minor || [];
    const majorImprovements = char.progression?.improvements?.major || [];
    const majorUsed = char.progression?.majorImprovementsUsed || [];

    // Check if we need to show improvement selection
    const pendingImprovements = this.getPendingImprovements(char);

    return `
      <div class="progression-section improvements-section">
        <h3>Improvements</h3>

        ${pendingImprovements.length > 0 ? `
          <div class="pending-improvements">
            <h4>Available Improvements</h4>
            ${pendingImprovements.map(improvement => this.renderPendingImprovement(improvement)).join('')}
          </div>
        ` : ''}

        <div class="improvements-history">
          <div class="minor-improvements">
            <h4>Minor Improvements (${minorImprovements.length})</h4>
            ${minorImprovements.length === 0 ?
              '<div class="no-improvements">No minor improvements yet.</div>' :
              minorImprovements.map(imp => this.renderImprovementHistory(imp)).join('')
            }
          </div>

          <div class="major-improvements">
            <h4>Major Improvements (${majorImprovements.length})</h4>
            ${majorImprovements.length === 0 ?
              '<div class="no-improvements">No major improvements yet.</div>' :
              majorImprovements.map(imp => this.renderImprovementHistory(imp)).join('')
            }
          </div>
        </div>
      </div>
    `;
  }

  renderLevelHistoryEntry(entry) {
    return `
      <div class="history-entry ${entry.applied ? 'applied' : 'pending'}">
        <div class="history-header">
          <span class="history-level">Level ${entry.level}</span>
          <span class="history-date">${new Date(entry.timestamp).toLocaleDateString()}</span>
          <span class="history-status">${entry.applied ? 'Applied' : 'Pending'}</span>
        </div>
        ${entry.benefits ? `
          <div class="history-benefits">
            ${Object.entries(entry.benefits).filter(([key, value]) => value).map(([key, value]) =>
              `<span class="history-benefit">${key}: ${value}</span>`
            ).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderProgressionTable(char) {
    const levels = Object.keys(this.characterManager.levelProgression).map(Number).sort((a, b) => a - b);

    return `
      <table class="progression-table-grid">
        <thead>
          <tr>
            <th>LVL</th>
            <th>Stat+</th>
            <th>Spare Skill Modules+</th>
            <th>Total Skills</th>
            <th>Improvements</th>
            <th>Base E.G.O</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${levels.map(level => {
            const data = this.characterManager.levelProgression[level];
            const isCurrentLevel = level === char.level;
            const isPastLevel = level < char.level;
            const isFutureLevel = level > char.level;

            return `
              <tr class="${isCurrentLevel ? 'current-level' : ''} ${isPastLevel ? 'past-level' : ''} ${isFutureLevel ? 'future-level' : ''}">
                <td class="level-number">${level}</td>
                <td>${data.stats === 'base' ? 'Base' : data.stats ? `+${data.stats.increase}${data.stats.max ? ` (max ${data.stats.max})` : ''}` : '-'}</td>
                <td>${data.modules === 'base' ? 'Base' : data.modules ? Object.entries(data.modules).map(([rank, amount]) => `+${amount} ${rank}`).join(', ') : '-'}</td>
                <td>${data.skills}</td>
                <td>${data.improvements || '-'}</td>
                <td>${typeof data.ego === 'string' ? data.ego : data.ego ? Object.entries(data.ego).map(([rank, amount]) => `+${amount} ${rank}`).join(', ') : '-'}</td>
                <td class="level-status">
                  ${isPastLevel ? '✓' : isCurrentLevel ? '●' : '○'}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  renderRightPanel() {
    return `
      <div class="chat-panel">
        <div class="chat-header">
          <div class="panel-title">⚔️ PLAYER TERMINAL</div>
          ${this.isGM ? '<button class="btn-secondary small-btn" id="gm-screen-btn">GM</button>' : ''}
        </div>

        <div class="chat-messages" id="chat-messages">
          <div class="chat-loading"></div>
        </div>

        <div class="chat-input-area">
          <div class="quick-actions">
            <button class="quick-btn" id="roll-d6-btn" title="/d6">/d6</button>
            <button class="quick-btn" id="roll-d20-btn" title="/d20">/d20</button>
          </div>
          <div class="chat-input-container">
            <input type="text" id="chat-input" class="chat-input" placeholder="Mensagem ou /comando... (aperte Enter)" maxlength="500">
          </div>
        </div>
      </div>
    `;
  }

  getStatDescription(statName) {
    const descriptions = {
      might: 'Physical power. Each point increases HP by 10 times its value.',
      vitality: 'How much of a beating you can take. Each point increases Stagger Resist by 5 times its value. Every point past the 1st allows you to add -1 to one of your Damage or Stagger Affinities.',
      agility: 'Speed and Skill. Determines Speed Die size: 1-2 d6, 3-4 d8, 5-6 d10, 7-8 d12.',
      intellect: 'Knowledge and education. Each point grants an additional Spare Tier 1 Skill Module.',
      instinct: 'Understanding and observation. 3rd, 5th, and 7th Points increase max Light by 1.',
      persona: 'Personality and force of will. Each point gives 1 starting Emotion Point per battle.'
    };
    return descriptions[statName] || '';
  }

  setupThemeSelector() {
    const themeSelect = document.getElementById('theme-select');
    if (!themeSelect) return;
    themeSelect.innerHTML = '';
    Object.entries(themeBrandMap).forEach(([themeKey, brandKey]) => {
      const opt = document.createElement('option');
      opt.value = themeKey;
      const themeLabel = themeKey.charAt(0).toUpperCase() + themeKey.slice(1);
      const brandLabel = (brandProfiles[brandKey] && brandProfiles[brandKey].brand) || brandKey;
      opt.textContent = `${themeLabel} - ${brandLabel}`;
      themeSelect.appendChild(opt);
    });
    themeSelect.value = this.currentTheme;
    themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      this.changeTheme(theme);
      const brandKey = themeBrandMap[theme];
      if (brandKey) {
        this.brandKey = brandKey;
        const brand = getBrandProfile(brandKey);
        // Could be used to brand parts of character sheet later
      }
      localStorage.setItem('sotc-theme-key', theme);
      localStorage.setItem('sotc-brand-key', this.brandKey);
    });
  }

  changeTheme(themeName) {
    const hue = themeHues[themeName];
    if (typeof hue === 'number') {
      document.documentElement.style.setProperty('--base-hue', hue);
      this.currentTheme = themeName;
    }
  }

  attachEventListeners() {
    // Remove event delegation anterior se existir
    if (this.navDelegateHandler) {
      document.removeEventListener('click', this.navDelegateHandler);
    }

    // Navigation usando event delegation para maior robustez
    this.navDelegateHandler = (e) => {
      const target = e.target.closest('.nav-btn');
      if (target && target.dataset.tab) {
        e.preventDefault();
        e.stopPropagation();

        console.log('Nav button clicked:', target.dataset.tab);

        const newTab = target.dataset.tab;
        if (newTab && newTab !== this.currentTab) {
          this.currentTab = newTab;
          this.editMode = false;
          this.render();
        }
      }
    };

    document.addEventListener('click', this.navDelegateHandler);

    // Backup: event listeners diretos também
    const navButtons = document.querySelectorAll('.nav-btn');

    navButtons.forEach((btn, index) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const newTab = e.target.dataset.tab;
        if (newTab && newTab !== this.currentTab) {
          this.currentTab = newTab;
          this.editMode = false;
          this.render();
        }
      });
    });

    // Character selection
    document.querySelectorAll('.character-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        const characterId = e.currentTarget.dataset.characterId;
        const result = await this.characterManager.loadCharacter(characterId);
        if (result.success) {
          this.currentCharacter = result.character;

          // Ensure character has proper ego structure
          if (!this.currentCharacter.ego) {
            this.currentCharacter.ego = { base: null, additional: [] };
          } else if (!this.currentCharacter.ego.additional) {
            this.currentCharacter.ego.additional = [];
          }

          this.editMode = false;
          this.currentTab = 'overview';
          this.render();
          this.attachEventListeners();
        }
      });
    });

    // New character
    const newCharBtn = document.getElementById('new-character-btn');
    if (newCharBtn) {
      newCharBtn.addEventListener('click', () => {
        this.createNewCharacter();
      });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        location.reload();
      });
    }

    // Save character
    const saveBtn = document.getElementById('save-character-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveCurrentCharacter();
      });
    }

    // Delete character
    const deleteBtn = document.getElementById('delete-character-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.deleteCurrentCharacter();
      });
    }

    // GM Screen button
    const gmScreenBtn = document.getElementById('gm-screen-btn');
    if (gmScreenBtn) {
      gmScreenBtn.addEventListener('click', () => {
        this.openGMScreen();
      });
    }


    // Edit buttons
    this.attachEditListeners();

    // STORY ABILITY (add/remove)
    const addStoryBtn = document.getElementById('add-archetype-ability-btn');
    const addStorySelect = document.getElementById('add-archetype-ability-select');
    if (addStoryBtn && addStorySelect && this.currentCharacter && this.currentCharacter.archetype) {
      const arch = arquetipos.find(a => a.nome === this.currentCharacter.archetype);
      const currentExtras = this.currentCharacter.extraArchetypeAbilities || [];
      const standardNames = arch.storyAbilities.map(a => a.nome);
      const todas = [...standardNames, ...currentExtras];
      const disponiveis = arch.storyAbilities.filter(st => !todas.includes(st.nome));
      addStoryBtn.disabled = disponiveis.length === 0;
      addStoryBtn.onclick = () => {
        addStorySelect.innerHTML = disponiveis.map(st => `<option value="${st.nome}">${st.nome}</option>`).join('');
        addStorySelect.style.display = disponiveis.length ? '' : 'none';
        addStorySelect.value = '';
        addStorySelect.focus();
      };
      addStorySelect.onchange = (e) => {
        const value = e.target.value;
        if(!value) return;
        this.currentCharacter.extraArchetypeAbilities = currentExtras.concat(value);
        addStorySelect.style.display = 'none';
        this.saveCurrentCharacter();
      };
    }
    document.querySelectorAll('.remove-extra-ability-btn').forEach(btn => {
      btn.onclick = (e) => {
        const nome = btn.getAttribute('data-ability');
        if(!nome) return;
        const arr = this.currentCharacter.extraArchetypeAbilities || [];
        this.currentCharacter.extraArchetypeAbilities = arr.filter(n=>n!==nome);
        this.saveCurrentCharacter();
      };
    });

    // BATTLE ABILITY (extra)
    const arch = this.currentCharacter && this.currentCharacter.archetype ? arquetipos.find(a => a.nome === this.currentCharacter.archetype) : null;
    {
      // Agora sempre mostra os controles de adicionar, mesmo sem array explícito
      const addBattleBtn = document.getElementById('add-battle-ability-btn');
      const addBattleSelect = document.getElementById('add-battle-ability-select');
      if(addBattleBtn && addBattleSelect) {
        let baseArr = arch && arch.battleAbilitys && Array.isArray(arch.battleAbilitys)
          ? arch.battleAbilitys
          : (arch?.battleAbility ? [arch.battleAbility] : []);
        const extras = this.currentCharacter.extraBattleAbilities || [];
        const stdName = baseArr[0]?.nome;
        const allNames = [stdName, ...extras].filter(Boolean);
        // Só mostra opções não-escolhidas
        const disponiveis = baseArr.filter(b=>!allNames.includes(b.nome));
        addBattleBtn.disabled = disponiveis.length === 0;
        addBattleBtn.onclick = () => {
          addBattleSelect.innerHTML = disponiveis.map(b=>`<option value="${b.nome}">${b.nome}</option>`).join('');
          addBattleSelect.style.display = disponiveis.length ? '' : 'none';
          addBattleSelect.value = '';
          addBattleSelect.focus();
        };
        addBattleSelect.onchange = (e) => {
          const v = e.target.value;
          if(!v) return;
          this.currentCharacter.extraBattleAbilities = extras.concat(v);
          addBattleSelect.style.display = 'none';
          this.saveCurrentCharacter();
        };
      }
      document.querySelectorAll('.remove-extra-battle-btn').forEach(btn => {
        btn.onclick = (e) => {
          const nome = btn.getAttribute('data-ability');
          if(!nome) return;
          const arr = this.currentCharacter.extraBattleAbilities || [];
          this.currentCharacter.extraBattleAbilities = arr.filter(n=>n!==nome);
          this.saveCurrentCharacter();
        };
      });
    }

    // Image upload and cropping
    this.setupImageUpload();

    // Setup chat event listeners
    this.setupChatEventListeners();

    // Setup derivative stats controls
    this.setupDerivativeStatsControls();

    // Setup skill controls
    this.setupSkillControls();

    // Setup skill creator controls
    this.setupSkillCreatorControls();

    // Setup progression controls
    this.setupProgressionControls();

    // Setup Base E.G.O. controls
    this.setupBaseEgoControls();

    // Setup E.G.O slots controls
    this.setupEgoSlotControls();
  }

  setupBaseEgoControls() {
    // Create Base E.G.O button
    const createBaseEgoBtn = document.getElementById('create-base-ego-btn');
    console.log('Looking for create-base-ego-btn:', createBaseEgoBtn);

    if (createBaseEgoBtn) {
      console.log('Found create-base-ego-btn, adding event listener');
      createBaseEgoBtn.addEventListener('click', (e) => {
        console.log('CREATE BASE EGO button clicked!');
        e.preventDefault();
        e.stopPropagation();
        this.startBaseEgoCreation();
      });
    } else {
      console.log('create-base-ego-btn not found in DOM');
    }

    // Base E.G.O creator controls if showing
    if (this.showingBaseEgoCreator && this.baseEgoCreator) {
      this.setupBaseEgoCreatorEventListeners();
    }
  }

  startBaseEgoCreation() {
    console.log('startBaseEgoCreation called');
    console.log('Current character:', this.currentCharacter);
    console.log('Character level:', this.currentCharacter?.level);

    if (!this.currentCharacter || this.currentCharacter.level < 2) {
      console.log('Character level too low or no character');
      this.showMessage('Character must be Level 2 or higher to create Base E.G.O', 'error');
      return;
    }

    console.log('Trying to create BaseEGOCreator...');

    try {
      // Initialize Base E.G.O. creator
      this.baseEgoCreator = new BaseEGOCreator(
        this.currentCharacter,
        (ego) => this.saveBaseEgo(ego),
        () => this.cancelBaseEgoCreation()
      );

      console.log('BaseEGOCreator created successfully:', this.baseEgoCreator);

      this.showingBaseEgoCreator = true;
      console.log('Setting showingBaseEgoCreator to true, re-rendering...');
      this.render();
    } catch (error) {
      console.error('Error creating BaseEGOCreator:', error);
      this.showMessage('Error creating Base E.G.O. creator: ' + error.message, 'error');
    }
  }

  saveBaseEgo(ego) {
    if (this.currentCharacter) {
      if (!this.currentCharacter.ego) {
        this.currentCharacter.ego = { base: null, additional: [], slots: { ZAYIN: null, TETH: null, HE: null, WAW: null, ALEPH: null } };
      } else if (!this.currentCharacter.ego.slots) {
        this.currentCharacter.ego.slots = { ZAYIN: null, TETH: null, HE: null, WAW: null, ALEPH: null };
      }

      this.currentCharacter.ego.base = ego;
      this.currentCharacter.ego.slots.ZAYIN = ego;
      this.saveCurrentCharacter();
      this.showMessage('Base E.G.O created successfully!', 'success');
    }

    this.showingBaseEgoCreator = false;
    this.baseEgoCreator = null;
    this.render();
  }

  cancelBaseEgoCreation() {
    this.showingBaseEgoCreator = false;
    this.baseEgoCreator = null;
    this.render();
  }

  setupBaseEgoCreatorEvents() {
    // This would handle events within the Base E.G.O creator interface
    // Implementation depends on the BaseEGOCreator component structure
  }

  setupEgoSlotControls() {
    const container = document.querySelector('.ego-slots-grid');
    if (!container || !this.currentCharacter) return;

    container.addEventListener('click', async (e) => {
      const addBtn = e.target.closest('.add-prebuilt-btn');
      if (addBtn) {
        const rating = addBtn.dataset.rating;
        this.openPrebuiltEgoModal(rating);
        return;
      }
      const editBtn = e.target.closest('.edit-ego-btn');
      if (editBtn) {
        const rating = editBtn.dataset.rating;
        this.openEditEgoModal(rating);
        return;
      }
      const removeBtn = e.target.closest('.remove-ego-btn');
      if (removeBtn) {
        const ratingRaw = removeBtn.dataset.rating || '';
        const rating = ratingRaw.toUpperCase().trim();
        await this.removeEgoFromSlot(rating);
        return;
      }
      const createBase = e.target.closest('#create-base-ego-btn-slot');
      if (createBase) {
        e.preventDefault();
        e.stopPropagation();
        this.startBaseEgoCreation();
      }
    });
  }

  async removeEgoFromSlot(rating) {
    if (!rating) {
      console.warn('[EGO][REMOVE] Missing rating');
      return;
    }
    if (!this.currentCharacter?.ego) {
      console.warn('[EGO][REMOVE] No ego object on character');
      return;
    }
    if (!this.currentCharacter.ego.slots) {
      this.currentCharacter.ego.slots = { ZAYIN: null, TETH: null, HE: null, WAW: null, ALEPH: null };
    }
    const normalized = String(rating).toUpperCase().trim();
    const before = { ...this.currentCharacter.ego.slots };
    console.log('[EGO][REMOVE] Request', { rating: normalized, before });

    // Proceed without blocking confirm to avoid iframe/pop-up issues
    if (normalized === 'ZAYIN') this.currentCharacter.ego.base = null;

    const slots = this.currentCharacter.ego.slots || {};
    if (!(normalized in slots)) {
      console.warn('[EGO][REMOVE] Rating not in slots map', { normalized, slots });
    }
    const newSlots = { ZAYIN: slots.ZAYIN ?? null, TETH: slots.TETH ?? null, HE: slots.HE ?? null, WAW: slots.WAW ?? null, ALEPH: slots.ALEPH ?? null, [normalized]: null };
    this.currentCharacter.ego.slots = newSlots;

    console.log('[EGO][REMOVE] Writing & saving...', { newSlots });
    await this.saveCurrentCharacter();
    console.log('[EGO][REMOVE] Saved', { after: { ...this.currentCharacter.ego.slots } });
    this.showMessage(`Removed E.G.O from ${normalized}`, 'success');
    this.render();
    this.attachEventListeners();
  }

  openPrebuiltEgoModal(rating) {
    const list = getEgosByRating(rating);
    const modalHtml = `
      <div class="modal-overlay" id="prebuilt-ego-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Select Prebuilt E.G.O — ${rating}</h3>
            <button class="modal-close" onclick="document.getElementById('prebuilt-ego-modal').remove()">×</button>
          </div>
          <div class="modal-body">
            <div class="prebuilt-ego-list">
              ${list.map(item => `
                <div class="prebuilt-ego-card" data-ego-id="${item.id}">
                  <div class="prebuilt-ego-header">
                    <h4>${item.name}</h4>
                    <span class="rating">${item.rating}</span>
                  </div>
                  <div class="prebuilt-ego-desc">${item.description}</div>
                  <div class="prebuilt-ego-dice">${(item.dice||[]).map(d=>`${d.tag} ${d.notation}`).join('<br>')}</div>
                  ${item.passive ? `<div class="prebuilt-ego-passive"><strong>Passive:</strong> ${item.passive.name} — ${item.passive.description}</div>` : ''}
                  <button class="btn-primary select-prebuilt-btn" data-ego-id="${item.id}" data-rating="${rating}">SELECT</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.querySelectorAll('.select-prebuilt-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const egoId = btn.dataset.egoId;
        const chosen = getEgosByRating(rating).find(e => e.id === egoId);
        if (!chosen) return;
        // Assign a deep-ish copy
        this.currentCharacter.ego.slots[rating] = JSON.parse(JSON.stringify(chosen));
        await this.saveCurrentCharacter();
        const modal = document.getElementById('prebuilt-ego-modal');
        if (modal) modal.remove();
        this.render();
        this.attachEventListeners();
      });
    });
  }

  openEditEgoModal(rating) {
    const ego = this.currentCharacter?.ego?.slots?.[rating];
    if (!ego) return;

    const modalHtml = `
      <div class="modal-overlay" id="edit-ego-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Edit E.G.O — ${rating}</h3>
            <button class="modal-close" onclick="document.getElementById('edit-ego-modal').remove()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="edit-ego-name">Nome do E.G.O.</label>
              <input type="text" id="edit-ego-name" class="form-input" value="${ego.name || ''}" placeholder="Digite o nome do seu E.G.O.">
            </div>
            <div class="form-group">
              <label for="edit-ego-desc">Descrição</label>
              <textarea id="edit-ego-desc" class="form-textarea" placeholder="Descrição opcional">${ego.description || ''}</textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" id="cancel-edit-ego">Cancel</button>
            <button class="btn-primary" id="save-edit-ego">Save</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('edit-ego-modal');
    const cancelBtn = document.getElementById('cancel-edit-ego');
    const saveBtn = document.getElementById('save-edit-ego');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (modalEl && modalEl.parentNode) modalEl.remove();
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const nameInput = document.getElementById('edit-ego-name');
        const descInput = document.getElementById('edit-ego-desc');
        const name = nameInput ? nameInput.value.trim() : '';
        const desc = descInput ? descInput.value.trim() : '';
        if (this.currentCharacter?.ego?.slots && rating in this.currentCharacter.ego.slots) {
          this.currentCharacter.ego.slots[rating].name = name || ego.name;
          this.currentCharacter.ego.slots[rating].description = desc;
        }
        await this.saveCurrentCharacter();
        if (modalEl && modalEl.parentNode) modalEl.remove();
        this.render();
        this.attachEventListeners();
      });
    }
  }

  renderBaseEgoCreator() {
    console.log('renderBaseEgoCreator called');
    console.log('baseEgoCreator instance:', this.baseEgoCreator);

    if (!this.baseEgoCreator) {
      console.log('baseEgoCreator is null/undefined');
      return '<div class="error">Base E.G.O. creator not initialized</div>';
    }

    console.log('Trying to render baseEgoCreator...');

    try {
      const renderedContent = this.baseEgoCreator.render();
      console.log('BaseEgoCreator render result:', renderedContent);

      return `
        <div class="terminal-title">CREATE BASE E.G.O.</div>
        <div class="terminal-subtitle">Craft your soul's manifestation</div>

        <div class="base-ego-creator-container">
          ${renderedContent}
        </div>
      `;
    } catch (error) {
      console.error('Error rendering BaseEgoCreator:', error);
      return `<div class="error">Error rendering Base E.G.O. creator: ${error.message}</div>`;
    }
  }

  attachEditListeners() {
    // Basic info edit
    const editBasicBtn = document.getElementById('edit-basic-btn');
    if (editBasicBtn) {
      editBasicBtn.addEventListener('click', () => {
        if (this.editMode) {
          this.saveBasicInfo();
        } else {
          this.editMode = true;
          this.render();
          this.attachEventListeners();
        }
      });
    }

    // Stats edit
    const editStatsBtn = document.getElementById('edit-stats-btn');
    if (editStatsBtn) {
      editStatsBtn.addEventListener('click', () => {
        if (this.editMode) {
          this.saveStats();
        } else {
          this.editMode = true;
          this.render();
          this.attachEventListeners();
        }
      });
    }

    // Stats validation
    document.querySelectorAll('.stat-input').forEach(input => {
      input.addEventListener('change', () => {
        this.validateStatsDistribution();
        this.autoSaveStats();
      });
      input.addEventListener('blur', () => {
        this.autoSaveStats();
      });
    });

    // Auto save for basic info fields
    const basicFields = ['#char-name', '#char-image-url', '#char-archetype', '#char-appearance', '#char-backstory'];
    basicFields.forEach(selector => {
      const el = document.querySelector(selector);
      if (el) {
        el.addEventListener('blur', () => this.autoSaveBasicInfo());
        el.addEventListener('change', () => this.autoSaveBasicInfo());
      }
    });
  }

  async autoSaveBasicInfo() {
    // Atualiza apenas os campos, sem sair do modo de edição
    const name = document.getElementById('char-name')?.value;
    const imageUrl = document.getElementById('char-image-url')?.value;
    const archetype = document.getElementById('char-archetype')?.value;
    const appearance = document.getElementById('char-appearance')?.value;
    const backstory = document.getElementById('char-backstory')?.value;

    if (this.currentCharacter) {
      this.currentCharacter.name = name;
      this.currentCharacter.imageUrl = imageUrl;
      this.currentCharacter.archetype = archetype;
      this.currentCharacter.details.appearance = appearance;
      this.currentCharacter.details.backstory = backstory;
      await this.characterManager.saveCharacter(this.currentCharacter);
      this.showMessage('Auto-saved!', 'success');
    }
  }

  async autoSaveStats() {
    // Atualiza apenas os stats, sem sair do modo de edição
    const stats = {};
    document.querySelectorAll('.stat-input').forEach(input => {
      stats[input.dataset.stat] = parseInt(input.value);
    });
    if (this.characterManager.validateStatDistribution(stats)) {
      this.currentCharacter.stats = stats;
      this.currentCharacter = this.characterManager.calculateDerivativeStats(this.currentCharacter);
      this.currentCharacter = this.characterManager.calculateMilestones(this.currentCharacter);
      await this.characterManager.saveCharacter(this.currentCharacter);
      this.showMessage('Auto-saved!', 'success');
    }
  }

  createNewCharacter() {
    this.currentCharacter = this.characterManager.createNewCharacter();
    this.editMode = true;
    this.currentTab = 'overview';
    this.render();
    this.attachEventListeners();
  }

  async saveCurrentCharacter() {
    if (this.currentCharacter) {
      const result = await this.characterManager.saveCharacter(this.currentCharacter);
      if (result.success) {
        await this.loadCharacters();
        this.showMessage('Character saved successfully!', 'success');
        this.render();
        this.attachEventListeners();
      } else {
        this.showMessage('Error saving character: ' + result.error, 'error');
      }
    }
  }

  async deleteCurrentCharacter() {
    if (this.currentCharacter && confirm('Are you sure you want to delete this character?')) {
      const result = await this.characterManager.deleteCharacter(this.currentCharacter.id);
      if (result.success) {
        await this.loadCharacters();
        this.currentCharacter = this.characters.length > 0 ? this.characters[0] : null;
        this.editMode = false;
        this.render();
        this.attachEventListeners();
      }
    }
  }

  saveBasicInfo() {
    const name = document.getElementById('char-name')?.value;
    const imageUrl = document.getElementById('char-image-url')?.value;
    const archetype = document.getElementById('char-archetype')?.value;
    const appearance = document.getElementById('char-appearance')?.value;
    const backstory = document.getElementById('char-backstory')?.value;

    if (this.currentCharacter) {
      this.currentCharacter.name = name;
      this.currentCharacter.imageUrl = imageUrl;
      this.currentCharacter.archetype = archetype;
      this.currentCharacter.details.appearance = appearance;
      this.currentCharacter.details.backstory = backstory;
    }

    this.editMode = false;
    this.render();
    this.attachEventListeners();
  }

  saveStats() {
    const stats = {};
    document.querySelectorAll('.stat-input').forEach(input => {
      stats[input.dataset.stat] = parseInt(input.value);
    });

    if (this.characterManager.validateStatDistribution(stats)) {
      this.currentCharacter.stats = stats;
      this.currentCharacter = this.characterManager.calculateDerivativeStats(this.currentCharacter);
      this.currentCharacter = this.characterManager.calculateMilestones(this.currentCharacter);
      this.editMode = false;
      this.render();
      this.attachEventListeners();
    } else {
      this.showMessage('Invalid stat distribution. Must total 15 with values 4,3,3,2,2,1', 'error');
    }
  }

  validateStatsDistribution() {
    const stats = {};
    document.querySelectorAll('.stat-input').forEach(input => {
      stats[input.dataset.stat] = parseInt(input.value);
    });

    const validation = document.getElementById('stats-validation');
    if (validation) {
      if (this.characterManager.validateStatDistribution(stats)) {
        validation.textContent = '✓ Valid distribution';
        validation.className = 'validation-message success';
      } else {
        validation.textContent = '✗ Invalid distribution';
        validation.className = 'validation-message error';
      }
    }
  }

  showMessage(text, type) {
    // Show message both in console and on screen
    console.log(`${type.toUpperCase()}: ${text}`);

    // Create visual notification
    const notification = document.createElement('div');
    notification.className = `message-notification ${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-weight: bold;
      z-index: 10000;
      max-width: 300px;
      word-wrap: break-word;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      ${type === 'success' ? 'background-color: #4CAF50;' : ''}
      ${type === 'error' ? 'background-color: #f44336;' : ''}
      ${type === 'warning' ? 'background-color: #ff9800;' : ''}
      ${type === 'info' ? 'background-color: #2196F3;' : ''}
    `;
    notification.textContent = text;

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  renderSkillCard(skill, index) {
    const format = (text) => {
      if (!text) return '';
      const escapeHtml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const replaceTags = (str) => str
        .replace(/\[([^\]]+)\]/g, (m, tag) => `<span class="skill-tag tag--${tag.toLowerCase().replace(/\s+/g, '-')}">${tag}</span>`)
        .replace(/(\b\d+d\d+(?:[+-]\d+)?\b)/gi, '<span class="dice-notation">$1</span>');
      const lines = text.split('\n').filter(l => l.trim() !== '');
      let html = '';
      lines.forEach(line => {
        if (/^Modules\b/i.test(line)) {
          const rest = line.replace(/^Modules\s*/i, '').trim();
          html += `<div class="skill-modules-title">Modules</div>`;
          if (rest) html += `<div class="skill-modules-list">${replaceTags(escapeHtml(rest))}</div>`;
        } else {
          html += `<div class="skill-line">${replaceTags(escapeHtml(line))}</div>`;
        }
      });
      return html;
    };

    return `
      <div class="skill-card">
        <div class="skill-header">
          <h4>${skill.name}</h4>
          <div class="skill-actions">
            <button class="btn-secondary small-btn" data-skill-index="${index}" id="view-skill-${index}">VIEW</button>
            <button class="btn-warning small-btn" data-skill-index="${index}" id="delete-skill-${index}">DELETE</button>
          </div>
        </div>
        <div class="skill-body">
          <div class="skill-cost-line">Cost: ${skill.cost}</div>
          <div class="skill-text">${format(skill.description || '')}</div>
        </div>
      </div>
    `;
  }

  renderEgoCard(ego) {
    const selectedBase = ego.skillBase ? this.characterManager.getSkillBases().find(base => base.name === ego.skillBase) : null;

    return `
      <div class="ego-card">
        <div class="ego-header">
          <h4>${ego.name}</h4>
          <div class="ego-rating">${ego.rating}</div>
        </div>
        <div class="ego-details">
          <div class="ego-cost">Cost: ${ego.emotionCost} EP</div>
          ${selectedBase ? `
            <div class="ego-base">Base: ${selectedBase.name} (${selectedBase.dice}x${selectedBase.size})</div>
          ` : ''}
          ${ego.modules ? `
            <div class="ego-modules">
              Modules: ${ego.modules.rank1}x Rank 1, ${ego.modules.rank2}x Rank 2, ${ego.modules.rank3}x Rank 3
            </div>
          ` : ''}
          ${ego.powerBenefit ? `
            <div class="ego-benefit">
              Benefit: ${ego.powerBenefit === 'dice_power' ? 'Dice Power Bonus' : 'Cost Enhancement'}
            </div>
          ` : ''}
          ${ego.passive ? `
            <div class="ego-passive">
              Passive: ${this.characterManager.getBaseEgoPassives().find(p => p.id === ego.passive)?.name || ego.passive}
            </div>
          ` : ''}
          ${ego.description ? `
            <div class="ego-description">${ego.description}</div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderBaseEgoCard(ego) {
    return `
      <div class="base-ego-card">
        <div class="ego-header">
          <h4>${ego.name}</h4>
          <div class="ego-rating">${ego.rating}</div>
        </div>
        <div class="ego-details">
          <div class="ego-cost">Cost: ${ego.emotionCost} Emotion Points</div>
          <div class="ego-base">Base: ${ego.baseName} (Cost ${ego.baseCost})</div>

          ${ego.dice && ego.dice.length > 0 ? `
            <div class="ego-dice">
              <strong>Dice:</strong>
              ${ego.dice.map(die => `<span class="die-notation">${die.tag} ${die.notation}</span>`).join(', ')}
            </div>
          ` : ''}

          <div class="ego-modules">
            <strong>Modules:</strong>
            <ul>
              ${ego.modules.rank1?.map(m => `<li>T1: ${m.name}</li>`).join('') || ''}
              ${ego.modules.rank2?.map(m => `<li>T2: ${m.name}</li>`).join('') || ''}
              ${ego.modules.rank3?.map(m => `<li>T3: ${m.name}</li>`).join('') || ''}
            </ul>
          </div>

          <div class="ego-benefit">
            <strong>Benefit:</strong> ${ego.powerBenefit === 'dice_power' ?
              this.getEgoPowerBenefitDescription(ego) :
              'Cost effects treat {Cost} as 1 higher'}
          </div>

          ${ego.passive ? `
            <div class="ego-passive">
              <strong>E.G.O. Passive:</strong> ${ego.passive.name}
              <div class="passive-description">${ego.passive.description}</div>
              <em>Remains active even when the EGO isn't usable.</em>
            </div>
          ` : ''}

          ${ego.description ? `
            <div class="ego-description">${ego.description}</div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Get E.G.O. power benefit description
  getEgoPowerBenefitDescription(ego) {
    if (!ego.dice) return 'No dice information';

    const diceCount = ego.dice.length;
    if (diceCount === 1) return '+3 Power to single die';
    if (diceCount === 2) return '+2 Power to each die';
    if (diceCount >= 3) return '+1 Power to each die';
    return 'No dice power bonus';
  }

  openGMScreen() {
    import('./gmScreen.js').then(module => {
      const GMScreen = module.GMScreen;
      new GMScreen();
    });
  }

  initializeChat() {
    this.chatSystem.startListening((messages) => {
      this.updateChatDisplay(messages);
    });
  }

  updateChatDisplay(messages) {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;

    if (messages.length === 0) {
      chatContainer.innerHTML = '<div class="chat-empty">Nenhuma mensagem ainda. Aguardando o GM...</div>';
      return;
    }

    const messagesHtml = messages.map(msg => this.chatSystem.formatMessage(msg).html).join('');
    chatContainer.innerHTML = messagesHtml;
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  setupChatEventListeners() {
    // Send message on Enter
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendChatMessage();
        }
      });
    }

    // (Botão SEND removido)

    // Quick dice rolls
    const rollD6Btn = document.getElementById('roll-d6-btn');
    if (rollD6Btn) {
      rollD6Btn.addEventListener('click', () => this.rollDice(6));
    }

    const rollD20Btn = document.getElementById('roll-d20-btn');
    if (rollD20Btn) {
      rollD20Btn.addEventListener('click', () => this.rollDice(20));
    }
  }

  async sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;

    const playerName = this.currentCharacter?.name || 'Player';
    this.chatSystem.userName = playerName;

    const result = await this.chatSystem.sendMessage(input.value);
    if (result.success) {
      input.value = '';
    }
  }

  async rollDice(sides) {
    const result = this.chatSystem.rollDice(sides);
    const playerName = this.currentCharacter?.name || 'Player';
    await this.chatSystem.sendDiceRoll(`d${sides}`, result, `${playerName} rolled`);
  }

  setupImageUpload() {
    const uploadBtn = document.getElementById('upload-image-btn');
    const fileInput = document.getElementById('char-image-file');
    const confirmCropBtn = document.getElementById('confirm-crop-btn');
    const cancelCropBtn = document.getElementById('cancel-crop-btn');

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
          this.loadImageForCropping(file);
        }
      });
    }

    if (confirmCropBtn) {
      confirmCropBtn.addEventListener('click', () => {
        this.confirmCrop();
      });
    }

    if (cancelCropBtn) {
      cancelCropBtn.addEventListener('click', () => {
        this.cancelCrop();
      });
    }
  }

  loadImageForCropping(file) {
    const canvas = document.getElementById('image-crop-canvas');
    const cropControls = document.getElementById('crop-controls');

    if (!canvas || !cropControls) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate aspect ratio and size to maintain proportions
      const aspectRatio = img.width / img.height;
      let canvasWidth, canvasHeight;

      // Set max canvas dimensions
      const maxSize = 300;

      if (aspectRatio > 1) {
        // Landscape orientation
        canvasWidth = Math.min(maxSize, img.width);
        canvasHeight = canvasWidth / aspectRatio;
      } else {
        // Portrait or square orientation
        canvasHeight = Math.min(maxSize, img.height);
        canvasWidth = canvasHeight * aspectRatio;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Draw the entire image maintaining aspect ratio
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

      // Show canvas and controls
      canvas.style.display = 'block';
      cropControls.style.display = 'flex';

      // Store original image for re-cropping if needed
      this.currentCropImage = img;
    };

    img.src = URL.createObjectURL(file);
  }

  confirmCrop() {
    const canvas = document.getElementById('image-crop-canvas');
    if (!canvas) return;

    // Convert canvas to base64 data URL
    const dataURL = canvas.toDataURL('image/png');

    // Update the image URL field
    const imageUrlInput = document.getElementById('char-image-url');
    if (imageUrlInput) {
      imageUrlInput.value = dataURL;
    }

    this.cancelCrop();
  }

  cancelCrop() {
    const canvas = document.getElementById('image-crop-canvas');
    const cropControls = document.getElementById('crop-controls');
    const fileInput = document.getElementById('char-image-file');

    if (canvas) canvas.style.display = 'none';
    if (cropControls) cropControls.style.display = 'none';
    if (fileInput) fileInput.value = '';

    this.currentCropImage = null;
  }

  setupDerivativeStatsControls() {
    // Add event listeners for +/- buttons on derivative stats
    document.querySelectorAll('.stat-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const statName = btn.dataset.stat;
        const change = parseInt(btn.dataset.change);
        this.modifyDerivativeStat(statName, change);
      });
    });
  }

  modifyDerivativeStat(statName, change) {
    if (!this.currentCharacter) return;

    const derivativeStats = this.currentCharacter.derivativeStats;
    const currentValue = derivativeStats[statName] || 0;
    const newValue = Math.max(0, currentValue + change);

    // Set maximum limits based on stat type
    let maxValue;
    switch (statName) {
      case 'currentHp':
        maxValue = derivativeStats.hp;
        break;
      case 'currentStaggerResist':
        maxValue = derivativeStats.staggerResist;
        break;
      case 'currentLight':
        maxValue = derivativeStats.maxLight;
        break;
      case 'currentEmotionPoints':
        maxValue = derivativeStats.emotionPoints;
        break;
      default:
        maxValue = Infinity;
    }

    // Apply the change within bounds
    derivativeStats[statName] = Math.min(maxValue, newValue);

    // Auto-save the character
    this.autoSaveCurrentCharacter();

    // Re-render to update the display
    this.render();
    this.attachEventListeners();
  }

  async autoSaveCurrentCharacter() {
    if (this.currentCharacter) {
      await this.characterManager.saveCharacter(this.currentCharacter);
      this.showMessage('Auto-saved!', 'success');
    }
  }

  // Get pending improvements that need player selection (delegate to CharacterManager)
  getPendingImprovements(char) {
    return this.characterManager.getPendingImprovements(char);
  }

  // Check if character has selected improvement for a specific level (delegate to CharacterManager)
  hasImprovementForLevel(char, level, improvementType) {
    return this.characterManager.hasImprovementForLevel(char, level, improvementType);
  }

  // Render pending improvement selection
  renderPendingImprovement(pendingImprovement) {
    const { level, type } = pendingImprovement;
    const availableOptions = type === 'minor' ?
      this.characterManager.getMinorImprovements() :
      this.characterManager.getMajorImprovements().filter(maj =>
        !this.currentCharacter.progression?.majorImprovementsUsed?.includes(maj.id)
      );

    return `
      <div class="pending-improvement-card">
        <div class="pending-improvement-header">
          <h4>Level ${level} - ${type.charAt(0).toUpperCase() + type.slice(1)} Improvement</h4>
        </div>
        <div class="improvement-options">
          ${availableOptions.map(option => `
            <button class="improvement-option-btn"
                    data-level="${level}"
                    data-type="${type}"
                    data-id="${option.id}">
              <div class="option-name">${option.name}</div>
              <div class="option-description">${option.description}</div>
              ${!option.repeatable && type === 'major' ? '<div class="option-note">(One-time only)</div>' : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Render improvement history
  renderImprovementHistory(improvement) {
    return `
      <div class="improvement-history-item">
        <div class="improvement-header">
          <span class="improvement-name">${improvement.id}</span>
          <span class="improvement-date">${new Date(improvement.timestamp).toLocaleDateString()}</span>
        </div>
        ${improvement.details ? `
          <div class="improvement-details">
            ${Object.entries(improvement.details).map(([key, value]) =>
              `<span class="detail-item">${key}: ${value}</span>`
            ).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  // Setup progression-related event listeners
  // Calculate available spare modules for character
  calculateSpareModules(char) {
    const intellect = char.stats.intellect || 1;
    const level = char.level || 1;

    // Base modules from intellect
    let rank1Modules = intellect;
    let rank2Modules = 0;
    let rank3Modules = 0;

    // Add modules from level progression (simplified)
    if (level >= 3) rank1Modules += Math.floor((level - 1) / 2);
    if (level >= 5) rank2Modules += Math.floor((level - 3) / 3);
    if (level >= 7) rank3Modules += Math.floor((level - 5) / 4);

    // Subtract modules already used in existing skills
    const skills = char.skills || [];
    let usedModules = { rank1: 0, rank2: 0, rank3: 0 };

    skills.forEach(skill => {
      if (skill.modules) {
        const rank1Count = skill.modules.filter(m => m.rank === 1).length;
        const rank2Count = skill.modules.filter(m => m.rank === 2).length;
        const rank3Count = skill.modules.filter(m => m.rank === 3).length;

        usedModules.rank1 += Math.max(0, rank1Count - 3); // 3 innate rank1
        usedModules.rank2 += Math.max(0, rank2Count - 1); // 1 innate rank2
        usedModules.rank3 += rank3Count; // All rank3 are spare
      }
    });

    return {
      rank1: Math.max(0, rank1Modules - usedModules.rank1),
      rank2: Math.max(0, rank2Modules - usedModules.rank2),
      rank3: Math.max(0, rank3Modules - usedModules.rank3)
    };
  }

  // Render the skill creator interface
  renderSkillCreator() {
    const state = this.skillCreator.getCurrentState();

    return `
      <div class="terminal-title">SKILL CREATOR</div>
      <div class="terminal-subtitle">Build your custom skill</div>

      <div class="skill-creator-container">
        <div class="creator-header">
          <div class="creator-steps">
            <div class="step ${state.currentStep === 'selectBase' ? 'active' : state.currentStep === 'configureDice' || state.currentStep === 'addModules' || state.currentStep === 'finalize' ? 'completed' : ''}">
              1. Select Base
            </div>
            <div class="step ${state.currentStep === 'configureDice' ? 'active' : state.currentStep === 'addModules' || state.currentStep === 'finalize' ? 'completed' : ''}">
              2. Configure Dice
            </div>
            <div class="step ${state.currentStep === 'addModules' ? 'active' : state.currentStep === 'finalize' ? 'completed' : ''}">
              3. Add Modules
            </div>
            <div class="step ${state.currentStep === 'finalize' ? 'active' : ''}">
              4. Finalize
            </div>
          </div>
          <button class="btn-secondary" id="cancel-skill-creation">CANCEL</button>
        </div>

        ${this.renderSkillCreatorStep(state)}

        ${state.currentSkill ? this.renderSkillPreview(state.currentSkill) : ''}
      </div>
    `;
  }

  // Render specific step of skill creation
  renderSkillCreatorStep(state) {
    switch (state.currentStep) {
      case 'selectBase':
        return this.renderBaseSelection();
      case 'configureDice':
        return this.renderDiceConfiguration(state.currentSkill);
      case 'addModules':
        return this.renderModuleSelection(state.currentSkill, state.availableSpareModules);
      case 'finalize':
        return this.renderSkillFinalization(state.currentSkill);
      default:
        return '<div class="step-content">Unknown step: ' + state.currentStep + '</div>';
    }
  }

  // Render base selection step
  renderBaseSelection() {
    const bases = skillBasesManager.getAllBases();
    const categories = skillBasesManager.getCategories();

    return `
      <div class="step-content">
        <h3>Step 1: Choose a Skill Base</h3>
        <p>The base determines the Cost of the skill, as well as the number, type, and power of its dice.</p>

        <div class="base-selection">
          ${categories.map(category => `
            <div class="base-category">
              <h4>${category.replace('_', ' ').toUpperCase()}</h4>
              <div class="bases-grid">
                ${bases.filter(base => base.category === category).map(base => `
                  <div class="base-card" data-base-id="${base.id}">
                    <div class="base-header">
                      <h5>${base.name}</h5>
                      <span class="base-cost">Cost: ${base.cost}</span>
                    </div>
                    <div class="base-dice">
                      ${base.dice.map(die => `<div class="die-preview">${die.tag} ${die.notation}</div>`).join('')}
                    </div>
                    <div class="base-description">${base.description}</div>
                    ${base.special ? `<div class="base-special">Special: ${base.special}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Render dice configuration step
  renderDiceConfiguration(skill) {
    const configurationComplete = this.skillCreator.isConfigurationComplete();

    return `
      <div class="step-content">
        <h3>Step 2: Configure Dice Types</h3>
        <p>Choose specific damage or defense types for configurable dice.</p>

        <div class="dice-configuration">
          ${skill.dice.map((die, index) => `
            <div class="die-config">
              <div class="die-info">
                <span class="die-tag">${die.originalTag}</span>
                <span class="die-notation">${die.notation}</span>
              </div>

              ${this.needsConfiguration(die) ? `
                <div class="die-options">
                  <label>Choose Type:</label>
                  <select class="die-type-select" data-die-id="${die.id}">
                    <option value="">Select...</option>
                    ${this.getDieTypeOptions(die.originalTag).map(option => `
                      <option value="${option}" ${die.chosenType === option ? 'selected' : ''}>${option}</option>
                    `).join('')}
                  </select>
                  ${die.chosenType ? `<span class="chosen-type">→ [${die.chosenType}]</span>` : ''}
                </div>
              ` : `
                <div class="die-fixed">
                  <span class="fixed-type">Fixed: ${die.tag}</span>
                </div>
              `}
            </div>
          `).join('')}
        </div>

        <div class="step-actions">
          <button class="btn-primary ${configurationComplete ? '' : 'disabled'}"
                  id="proceed-to-modules"
                  ${configurationComplete ? '' : 'disabled'}>
            PROCEED TO MODULES
          </button>
        </div>
      </div>
    `;
  }

  // Render module selection step
  renderModuleSelection(skill, availableSpareModules) {
    // Safety check for availableSpareModules
    if (!availableSpareModules) {
      console.error('availableSpareModules is undefined, using fallback');
      availableSpareModules = { rank1: 0, rank2: 0, rank3: 0 };
    }

    const innateSlots = { rank1: 3, rank2: 1 };
    const currentInnate = skill.modules.filter(m => !m.isSpare);
    const currentSpare = skill.modules.filter(m => m.isSpare);

    return `
      <div class="step-content">
        <h3>Step 3: Add Modules</h3>
        <p>Each skill has 3 Tier 1 and 1 Tier 2 Innate Modules, plus optional Spare Modules.</p>

        <div class="modules-section">
          <div class="innate-modules">
            <h4>Innate Modules (Required)</h4>
            <div class="module-requirements">
              <div class="requirement">
                Tier 1: ${currentInnate.filter(m => m.rank === 1).length}/3
              </div>
              <div class="requirement">
                Tier 2: ${currentInnate.filter(m => m.rank === 2).length}/1
              </div>
            </div>

            <div class="module-selection-grid">
              ${[1, 2].map(rank => `
                <div class="rank-section">
                  <h5>Tier ${rank} Modules</h5>
                  <div class="available-modules">
                    ${skillModulesManager.getModulesByRank(rank).map(module => `
                      <div class="module-option ${this.canAddModule(skill, module) ? '' : 'disabled'}"
                           data-module-id="${module.id}"
                           data-module-rank="${rank}"
                           data-is-spare="false">
                        <div class="module-name">${module.name}</div>
                        <div class="module-effect">${module.effect}</div>
                        ${module.target === 'die' ? '<div class="requires-target">Requires target die</div>' : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="spare-modules">
            <h4>Spare Modules (Optional)</h4>
            <div class="spare-counts">
              <div>Available: Tier 1: ${availableSpareModules.rank1}, Tier 2: ${availableSpareModules.rank2}, Tier 3: ${availableSpareModules.rank3}</div>
              <div>Used: Tier 1: ${currentSpare.filter(m => m.rank === 1).length}, Tier 2: ${currentSpare.filter(m => m.rank === 2).length}, Tier 3: ${currentSpare.filter(m => m.rank === 3).length}</div>
            </div>

            <div class="module-selection-grid">
              ${[1, 2, 3].map(rank => `
                <div class="rank-section">
                  <h5>Tier ${rank} Spare Modules</h5>
                  <div class="available-modules">
                    ${skillModulesManager.getModulesByRank(rank).map(module => `
                      <div class="module-option ${this.canAddSpareModule(skill, module, rank, availableSpareModules) ? '' : 'disabled'}"
                           data-module-id="${module.id}"
                           data-module-rank="${rank}"
                           data-is-spare="true">
                        <div class="module-name">${module.name}</div>
                        <div class="module-effect">${module.effect}</div>
                        ${module.target === 'die' ? '<div class="requires-target">Requires target die</div>' : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="current-modules">
            <h4>Current Modules</h4>
            <div class="modules-list">
              ${skill.modules.map((module, index) => `
                <div class="current-module">
                  <span class="module-info">${module.name} (T${module.rank}${module.isSpare ? ' - Spare' : ' - Innate'})</span>
                  <button class="btn-remove" data-module-index="${index}">REMOVE</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="step-actions">
          <button class="btn-primary ${this.hasRequiredModules(skill) ? '' : 'disabled'}"
                  id="proceed-to-finalize"
                  ${this.hasRequiredModules(skill) ? '' : 'disabled'}>
            PROCEED TO FINALIZE
          </button>
        </div>
      </div>
    `;
  }

  // Render skill finalization step
  renderSkillFinalization(skill) {
    return `
      <div class="step-content">
        <h3>Step 4: Finalize Skill</h3>
        <p>Give your skill a name and review the final configuration.</p>

        <div class="finalization-form">
          <div class="skill-name-input">
            <label>Skill Name:</label>
            <input type="text" id="final-skill-name" value="${skill.name}" class="form-input" placeholder="Enter skill name">
          </div>

          <div class="skill-summary">
            <h4>Skill Summary</h4>
            <div class="summary-details">
              <div><strong>Base:</strong> ${skill.baseName}</div>
              <div><strong>Cost:</strong> ${skill.cost}</div>
              <div><strong>Dice:</strong> ${skill.dice.length}</div>
              <div><strong>Modules:</strong> ${skill.modules.length} (${skill.modules.filter(m => !m.isSpare).length} innate, ${skill.modules.filter(m => m.isSpare).length} spare)</div>
            </div>
          </div>
        </div>

        <div class="step-actions">
          <button class="btn-primary" id="create-skill-final">CREATE SKILL</button>
          <button class="btn-secondary" id="back-to-modules">BACK TO MODULES</button>
        </div>
      </div>
    `;
  }

  // Render skill preview
  renderSkillPreview(skill) {
    const format = (text) => {
      if (!text) return '';
      const escapeHtml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const replaceTags = (str) => str
        .replace(/\[([^\]]+)\]/g, (m, tag) => `<span class=\"skill-tag tag--${tag.toLowerCase().replace(/\s+/g, '-') }\">${tag}</span>`)
        .replace(/(\b\d+d\d+(?:[+-]\d+)?\b)/gi, '<span class=\"dice-notation\">$1</span>');
      const lines = text.split('\n').filter(l => l.trim() !== '');
      let html = '';
      lines.forEach(line => {
        if (/^Modules\b/i.test(line)) {
          const rest = line.replace(/^Modules\s*/i, '').trim();
          html += `<div class=\"skill-modules-title\">Modules</div>`;
          if (rest) html += `<div class=\"skill-modules-list\">${replaceTags(escapeHtml(rest))}</div>`;
        } else {
          html += `<div class=\"skill-line\">${replaceTags(escapeHtml(line))}</div>`;
        }
      });
      return html;
    };

    return `
      <div class="skill-preview">
        <div class="skill-card">
          <div class="skill-header"><h4>${skill.name}</h4></div>
          <div class="skill-body">
            <div class="skill-cost-line">Cost: ${skill.cost}</div>
            <div class="skill-text">${format(skill.description || '')}</div>
          </div>
        </div>
      </div>
    `;
  }

  // Helper methods for skill creation
  needsConfiguration(die) {
    return ['[Any Offensive]', '[Block or Evade]', '[Any Other Offensive]'].includes(die.originalTag);
  }

  getDieTypeOptions(originalTag) {
    if (originalTag === '[Any Offensive]' || originalTag === '[Any Other Offensive]') {
      return ['Slash', 'Pierce', 'Blunt'];
    } else if (originalTag === '[Block or Evade]') {
      return ['Block', 'Evade'];
    }
    return [];
  }

  canAddModule(skill, module) {
    // For modules that require a target die, check if any dice are available
    if (module.target === 'die') {
      const availableDice = this.skillCreator.getAvailableTargetDice(module);
      if (availableDice.length === 0) {
        return false;
      }
      // If there are available dice, we can add the module (target selection will happen later)
      return true;
    }

    // For other modules, use the regular validation
    return this.skillCreator.validateModuleAddition(module).valid;
  }

  canAddSpareModule(skill, module, rank, availableSpareModules) {
    const usedSpare = skill.modules.filter(m => m.isSpare && m.rank === rank).length;
    const available = availableSpareModules[`rank${rank}`];
    return usedSpare < available && this.canAddModule(skill, module);
  }

  hasRequiredModules(skill) {
    const innateModules = skill.modules.filter(m => !m.isSpare);
    const rank1Count = innateModules.filter(m => m.rank === 1).length;
    const rank2Count = innateModules.filter(m => m.rank === 2).length;
    return rank1Count >= 3 && rank2Count >= 1;
  }

  setupSkillCreatorControls() {
    // Create skill button
    const addSkillBtn = document.getElementById('add-skill-btn');
    console.log('Looking for add-skill-btn:', addSkillBtn);
    console.log('Button disabled:', addSkillBtn?.disabled);

    if (addSkillBtn && !addSkillBtn.disabled) {
      console.log('Adding event listener to add-skill-btn');
      addSkillBtn.addEventListener('click', () => {
        console.log('CREATE SKILL button clicked!');
        this.startSkillCreation();
      });
    }


    // Cancel skill creation
    const cancelBtn = document.getElementById('cancel-skill-creation');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.cancelSkillCreation();
      });
    }

    // Base selection (scope to skill creator only)
    document.querySelectorAll('.skill-creator-container .base-card').forEach(card => {
      card.addEventListener('click', () => {
        const baseId = card.dataset.baseId;
        this.selectSkillBase(baseId);
      });
    });

    // Die type configuration (scope to skill creator only)
    document.querySelectorAll('.skill-creator-container .die-type-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const dieId = e.target.dataset.dieId;
        const damageType = e.target.value;
        this.configureDieType(dieId, damageType);
      });
    });

    // Module selection (scope to skill creator only)
    document.querySelectorAll('.skill-creator-container .module-option:not(.disabled)').forEach(option => {
      option.addEventListener('click', () => {
        const moduleId = option.dataset.moduleId;
        const moduleRank = parseInt(option.dataset.moduleRank);
        const isSpare = option.dataset.isSpare === 'true';
        this.addModuleToSkill(moduleId, moduleRank, isSpare);
      });
    });

    // Module removal (scope to skill creator only)
    document.querySelectorAll('.skill-creator-container .btn-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const moduleIndex = parseInt(btn.dataset.moduleIndex);
        this.removeModuleFromSkill(moduleIndex);
      });
    });

    // Step navigation
    const proceedToModulesBtn = document.getElementById('proceed-to-modules');

    if (proceedToModulesBtn && !proceedToModulesBtn.disabled) {
      proceedToModulesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.proceedToModules();
      });
    }

    const proceedToFinalizeBtn = document.getElementById('proceed-to-finalize');
    if (proceedToFinalizeBtn && !proceedToFinalizeBtn.disabled) {
      proceedToFinalizeBtn.addEventListener('click', () => {
        this.proceedToFinalize();
      });
    }

    const createSkillFinalBtn = document.getElementById('create-skill-final');
    if (createSkillFinalBtn) {
      createSkillFinalBtn.addEventListener('click', () => {
        this.finalizeSkillCreation();
      });
    }

    const backToModulesBtn = document.getElementById('back-to-modules');
    if (backToModulesBtn) {
      backToModulesBtn.addEventListener('click', () => {
        this.backToModules();
      });
    }
  }

  // Skill creation methods
  startSkillCreation() {
    console.log('startSkillCreation called');
    console.log('Current character:', this.currentCharacter);

    try {
      this.skillCreator = new SkillCreator(this.currentCharacter);
      console.log('SkillCreator created:', this.skillCreator);

      this.skillCreator.startSkillCreation();
      console.log('SkillCreator initialized');

      this.showingSkillCreator = true;
      console.log('Set showingSkillCreator to true, re-rendering...');
      this.render();
      this.attachEventListeners();
    } catch (error) {
      console.error('Error creating SkillCreator:', error);
      this.showMessage('Error creating skill creator: ' + error.message, 'error');
    }
  }


  cancelSkillCreation() {
    this.skillCreator = null;
    this.showingSkillCreator = false;
    this.render();
    this.attachEventListeners();
  }

  selectSkillBase(baseId) {
    if (!this.skillCreator) {
      this.showMessage('Skill Creator is not initialized. Please try restarting skill creation.', 'error');
      console.error('[selectSkillBase] skillCreator is null!');
      return;
    }
    const result = this.skillCreator.selectBase(baseId);
    if (result.success) {
      this.render();
      this.attachEventListeners();
    } else {
      this.showMessage(result.error, 'error');
    }
  }

  configureDieType(dieId, damageType) {
    const result = this.skillCreator.configureDieType(dieId, damageType);
    if (result.success) {
      this.render();
      this.attachEventListeners();
    } else {
      this.showMessage(result.error, 'error');
    }
  }

  async addModuleToSkill(moduleId, moduleRank, isSpare) {
    const module = skillModulesManager.getModuleById(moduleId, moduleRank);

    // If module requires target die, handle target selection
    if (module && module.target === 'die') {
      const availableDice = this.skillCreator.getAvailableTargetDice(module);

      if (availableDice.length === 0) {
        this.showMessage('No suitable dice available for this module', 'error');
        return;
      } else if (availableDice.length === 1) {
        // Auto-select if only one die is available
        const result = this.skillCreator.addModule(moduleId, moduleRank, availableDice[0].id, isSpare);
        if (result.success) {
          this.render();
          this.attachEventListeners();
        } else {
          this.showMessage(result.error, 'error');
        }
      } else {
        // Show target die selection dialog
        const selectedDieId = await this.showTargetDieSelectionDialog(availableDice, module.name);

        if (selectedDieId) {
          const result = this.skillCreator.addModule(moduleId, moduleRank, selectedDieId, isSpare);
          if (result.success) {
            this.render();
            this.attachEventListeners();
          } else {
            this.showMessage(result.error, 'error');
          }
        }
        // If user cancelled (selectedDieId is null), do nothing
      }
    } else {
      // Regular module that doesn't require target die
      const result = this.skillCreator.addModule(moduleId, moduleRank, null, isSpare);
      if (result.success) {
        this.render();
        this.attachEventListeners();
      } else {
        this.showMessage(result.error, 'error');
      }
    }
  }

  removeModuleFromSkill(moduleIndex) {
    const result = this.skillCreator.removeModule(moduleIndex);
    if (result.success) {
      this.render();
      this.attachEventListeners();
    } else {
      this.showMessage(result.error, 'error');
    }
  }

  proceedToModules() {
    const result = this.skillCreator.addInnateModules();

    if (result && result.success) {
      this.render();
      this.attachEventListeners();
    } else {
      console.error('Failed to add innate modules:', result);
      this.showMessage('Failed to proceed to modules step', 'error');
    }
  }

  proceedToFinalize() {
    this.skillCreator.currentStep = 'finalize';
    this.render();
    this.attachEventListeners();
  }

  backToModules() {
    this.skillCreator.currentStep = 'addModules';
    this.render();
    this.attachEventListeners();
  }

  async finalizeSkillCreation() {
    if (!this.skillCreator || !this.skillCreator.currentSkill) {
      this.showMessage('Não há skill em criação. Selecione uma base e configure sua skill antes de finalizar.', 'error');
      return;
    }
    const skillName = document.getElementById('final-skill-name')?.value || this.skillCreator.currentSkill.name;
    const result = this.skillCreator.finalizeSkill(skillName);

    if (result.success) {
      // Add skill to character
      if (!this.currentCharacter.skills) {
        this.currentCharacter.skills = [];
      }
      this.currentCharacter.skills.push(result.skill);

      // Save character
      await this.saveCurrentCharacter();

      // Exit skill creator
      this.skillCreator = null;
      this.showingSkillCreator = false;

      this.showMessage('Skill created successfully!', 'success');
      this.render();
      this.attachEventListeners();
    } else {
      this.showMessage(result.error, 'error');
    }
  }

  setupProgressionControls() {
    // Level up button
    const levelUpBtn = document.getElementById('level-up-btn');
    if (levelUpBtn) {
      levelUpBtn.addEventListener('click', () => {
        this.showLevelUpDialog();
      });
    }

    // Stat increase buttons
    document.querySelectorAll('.stat-increase-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const statName = btn.dataset.stat;
        const increaseLevel = parseInt(btn.dataset.increaseLevel);
        this.applyStatIncrease(statName, increaseLevel);
      });
    });

    // Improvement option buttons
    document.querySelectorAll('.improvement-option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const level = parseInt(btn.dataset.level);
        const type = btn.dataset.type;
        const id = btn.dataset.id;
        this.selectImprovement(level, type, id);
      });
    });

    // Create Base E.G.O button
    const createEgoBtn = document.getElementById('create-base-ego-btn');
    if (createEgoBtn && !createEgoBtn.disabled) {
      createEgoBtn.addEventListener('click', () => {
        this.showBaseEgoCreator();
      });
    }
  }

  // Show level up dialog
  async showLevelUpDialog() {
    // Check if character can level up
    const canLevel = this.characterManager.canLevelUp(this.currentCharacter);
    if (!canLevel.canLevel) {
      this.showMessage(`Cannot level up: ${canLevel.reason}`, 'error');
      return;
    }

    const result = await this.characterManager.levelUpCharacter(this.currentCharacter);
    if (result.success) {
      this.currentCharacter = result.character;

      // Automatically apply level benefits for the new level
      const newLevel = this.currentCharacter.level;
      const applyResult = await this.characterManager.applyLevelBenefits(this.currentCharacter, newLevel);

      if (applyResult.success) {
        this.currentCharacter = applyResult.character;
        await this.saveCurrentCharacter();
        this.showMessage(`Leveled up to ${newLevel}! Check the Progression tab for new benefits.`, 'success');

        // Re-render to update the UI
        this.render();
        this.attachEventListeners();
      } else {
        this.showMessage(`Level up successful, but error applying benefits: ${applyResult.error}`, 'warning');
      }
    } else {
      this.showMessage(`Error leveling up: ${result.error}`, 'error');
    }
  }

  // Apply level benefits
  async applyLevelBenefits(level) {
    const result = await this.characterManager.applyLevelBenefits(this.currentCharacter, level);
    if (result.success) {
      this.currentCharacter = result.character;
      await this.saveCurrentCharacter();
      this.showMessage(`Applied benefits for level ${level}!`, 'success');
    } else {
      this.showMessage(`Error applying benefits: ${result.error}`, 'error');
    }
  }

  // Apply stat increase
  async applyStatIncrease(statName, increaseLevel) {
    const statIncrease = this.currentCharacter.progression.statIncreases.find(
      s => s.level === increaseLevel && !s.applied
    );

    if (!statIncrease) {
      this.showMessage('Stat increase not found', 'error');
      return;
    }

    const result = await this.characterManager.applyStatIncrease(this.currentCharacter, statName, statIncrease);
    if (result.success) {
      this.currentCharacter = result.character;
      await this.saveCurrentCharacter();
      this.showMessage(`Increased ${statName} by 1!`, 'success');
    } else {
      this.showMessage(`Error applying stat increase: ${result.error}`, 'error');
    }
  }

  // Select improvement
  async selectImprovement(level, type, improvementId) {
    // Handle special cases that require additional input
    let details = { level: level };

    if (improvementId === 'affinities') {
      const affinityDetails = await this.showAffinitySelectionDialog();
      if (!affinityDetails) return; // User cancelled
      details = { ...details, ...affinityDetails };
    } else if (improvementId === 'story_ability' || improvementId === 'battle_ability') {
      const abilityDetails = await this.showAbilitySelectionDialog(improvementId);
      if (!abilityDetails) return; // User cancelled
      details = { ...details, ...abilityDetails };
    } else if (improvementId === 'stat_boost') {
      const statDetails = await this.showStatBoostDialog();
      if (!statDetails) return; // User cancelled
      details = { ...details, ...statDetails };
    }

    const result = await this.characterManager.applyImprovement(this.currentCharacter, type, improvementId, details);
    if (result.success) {
      this.currentCharacter = result.character;
      await this.saveCurrentCharacter();
      this.showMessage(`Applied ${type} improvement: ${improvementId}!`, 'success');

      // Re-render to update the UI
      this.render();
      this.attachEventListeners();
    } else {
      this.showMessage(`Error applying improvement: ${result.error}`, 'error');
    }
  }

  // Show affinity selection dialog
  async showAffinitySelectionDialog() {
    return new Promise((resolve) => {
      const modalHtml = `
        <div class="modal-overlay" id="affinity-modal">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Select Affinities to Improve</h3>
              <button class="modal-close" onclick="this.closeAffinityModal(false)">×</button>
            </div>
            <div class="modal-body">
              <p>Add -1 to one damage affinity and -1 to one stagger affinity</p>

              <div class="affinity-selection">
                <div class="affinity-group">
                  <h4>Damage Affinity</h4>
                  <select id="damage-affinity-select" class="form-input">
                    <option value="slash">Slash</option>
                    <option value="pierce">Pierce</option>
                    <option value="blunt">Blunt</option>
                  </select>
                </div>

                <div class="affinity-group">
                  <h4>Stagger Affinity</h4>
                  <select id="stagger-affinity-select" class="form-input">
                    <option value="slash">Slash</option>
                    <option value="pierce">Pierce</option>
                    <option value="blunt">Blunt</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" onclick="this.closeAffinityModal(false)">Cancel</button>
              <button class="btn-primary" onclick="this.closeAffinityModal(true)">Confirm</button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);

      window.closeAffinityModal = (confirm) => {
        if (confirm) {
          const damageAffinity = document.getElementById('damage-affinity-select').value;
          const staggerAffinity = document.getElementById('stagger-affinity-select').value;

          // Apply the improvement immediately
          if (this.currentCharacter.affinities.damage[damageAffinity] > -3) {
            this.currentCharacter.affinities.damage[damageAffinity]--;
          }
          if (this.currentCharacter.affinities.stagger[staggerAffinity] > -3) {
            this.currentCharacter.affinities.stagger[staggerAffinity]--;
          }

          resolve({
            damageAffinity: damageAffinity,
            staggerAffinity: staggerAffinity
          });
        } else {
          resolve(null);
        }

        document.getElementById('affinity-modal').remove();
        delete window.closeAffinityModal;
      };
    });
  }

  // Show ability selection dialog
  async showAbilitySelectionDialog(abilityType) {
    return new Promise((resolve) => {
      const availableArchetypes = this.characterManager.getArchetypes().filter(arch =>
        arch !== this.currentCharacter.archetype && arch !== 'Custom'
      );

      const modalHtml = `
        <div class="modal-overlay" id="ability-modal">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Select ${abilityType === 'story_ability' ? 'Story' : 'Battle'} Ability</h3>
              <button class="modal-close" onclick="this.closeAbilityModal(false)">×</button>
            </div>
            <div class="modal-body">
              <p>Gain a new ${abilityType === 'story_ability' ? 'Story' : 'Battle'} ability from another Archetype</p>

              <div class="ability-selection">
                <div class="archetype-group">
                  <h4>Source Archetype</h4>
                  <select id="archetype-select" class="form-input">
                    ${availableArchetypes.map(arch =>
                      `<option value="${arch}">${arch}</option>`
                    ).join('')}
                  </select>
                </div>

                <div class="ability-group">
                  <h4>Ability Name</h4>
                  <input type="text" id="ability-name-input" class="form-input" placeholder="Enter ability name">
                </div>

                <div class="ability-group">
                  <h4>Ability Description</h4>
                  <textarea id="ability-description-input" class="form-textarea" placeholder="Enter ability description"></textarea>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" onclick="this.closeAbilityModal(false)">Cancel</button>
              <button class="btn-primary" onclick="this.closeAbilityModal(true)">Confirm</button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);

      window.closeAbilityModal = (confirm) => {
        if (confirm) {
          const archetype = document.getElementById('archetype-select').value;
          const abilityName = document.getElementById('ability-name-input').value;
          const abilityDescription = document.getElementById('ability-description-input').value;

          if (!abilityName.trim()) {
            alert('Please enter an ability name');
            return;
          }

          resolve({
            archetypeSource: archetype,
            abilityName: abilityName,
            abilityDescription: abilityDescription
          });
        } else {
          resolve(null);
        }

        document.getElementById('ability-modal').remove();
        delete window.closeAbilityModal;
      };
    });
  }

  // Show stat boost dialog
  async showStatBoostDialog() {
    return new Promise((resolve) => {
      const stats = Object.entries(this.currentCharacter.stats);

      const modalHtml = `
        <div class="modal-overlay" id="stat-boost-modal">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Major Stat Increase</h3>
              <button class="modal-close" onclick="this.closeStatBoostModal(false)">×</button>
            </div>
            <div class="modal-body">
              <p>Increase 2 different stats by 1, and another stat by 2</p>

              <div class="stat-boost-selection">
                <div class="stat-group">
                  <h4>First Stat (+1)</h4>
                  <select id="stat1-select" class="form-input">
                    ${stats.map(([name, value]) =>
                      `<option value="${name}">${name.toUpperCase()}: ${value}</option>`
                    ).join('')}
                  </select>
                </div>

                <div class="stat-group">
                  <h4>Second Stat (+1)</h4>
                  <select id="stat2-select" class="form-input">
                    ${stats.map(([name, value]) =>
                      `<option value="${name}">${name.toUpperCase()}: ${value}</option>`
                    ).join('')}
                  </select>
                </div>

                <div class="stat-group">
                  <h4>Major Stat (+2)</h4>
                  <select id="major-stat-select" class="form-input">
                    ${stats.map(([name, value]) =>
                      `<option value="${name}">${name.toUpperCase()}: ${value}</option>`
                    ).join('')}
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" onclick="this.closeStatBoostModal(false)">Cancel</button>
              <button class="btn-primary" onclick="this.closeStatBoostModal(true)">Confirm</button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);

      window.closeStatBoostModal = (confirm) => {
        if (confirm) {
          const stat1 = document.getElementById('stat1-select').value;
          const stat2 = document.getElementById('stat2-select').value;
          const majorStat = document.getElementById('major-stat-select').value;

          if (stat1 === stat2) {
            alert('First and second stats must be different');
            return;
          }

          // Apply the stat increases immediately
          this.currentCharacter.stats[stat1]++;
          if (stat2 !== majorStat) {
            this.currentCharacter.stats[stat2]++;
          }
          this.currentCharacter.stats[majorStat] += (majorStat === stat2 ? 3 : 2);

          // Recalculate derivative stats
          this.currentCharacter = this.characterManager.calculateDerivativeStats(this.currentCharacter);
          this.currentCharacter = this.characterManager.calculateMilestones(this.currentCharacter);

          resolve({
            primaryStats: [stat1, stat2],
            majorStat: majorStat
          });
        } else {
          resolve(null);
        }

        document.getElementById('stat-boost-modal').remove();
        delete window.closeStatBoostModal;
      };
    });
  }

  // Show create base E.G.O dialog
  async showCreateBaseEgoDialog() {
    if (this.currentCharacter.level < 2) {
      this.showMessage('Base E.G.O requires level 2', 'error');
      return;
    }

    if (this.currentCharacter.progression?.baseEgoCreated) {
      this.showMessage('Base E.G.O already created', 'error');
      return;
    }

    return new Promise((resolve) => {
      const skillBases = this.characterManager.getSkillBases().filter(base => base.cost >= 2);
      const passives = this.characterManager.getBaseEgoPassives();

      const modalHtml = `
        <div class="modal-overlay" id="ego-creation-modal">
          <div class="modal-content ego-creation-content">
            <div class="modal-header">
              <h3>Create Base E.G.O</h3>
              <button class="modal-close" onclick="this.closeEgoCreationModal(false)">×</button>
            </div>
            <div class="modal-body">
              <div class="ego-creation-info">
                <p><strong>Creating Your Base E.G.O:</strong></p>
                <ul>
                  <li>Choose a Base for the Skill (Cost of 2 or higher)</li>
                  <li>Add 3 Rank 1, 1 Rank 2, and 1 Rank 3 Skill Modules</li>
                  <li>Choose a Power Benefit</li>
                  <li>Pick a Passive from the Base Passives list</li>
                  <li>Emotion Point Cost is set to 6</li>
                  <li>E.G.O Rating is ZAYIN</li>
                </ul>
              </div>

              <div class="ego-creation-form">
                <div class="form-group">
                  <label for="ego-name">E.G.O Name:</label>
                  <input type="text" id="ego-name" class="form-input" placeholder="Enter E.G.O name">
                </div>

                <div class="form-group">
                  <label for="ego-description">Description:</label>
                  <textarea id="ego-description" class="form-textarea" placeholder="Describe your E.G.O's appearance and manifestation"></textarea>
                </div>

                <div class="form-group">
                  <label for="skill-base-select">Skill Base (Cost 2+):</label>
                  <select id="skill-base-select" class="form-input">
                    ${skillBases.map(base =>
                      `<option value="${base.name}">${base.name} (Cost: ${base.cost}, Dice: ${base.dice}x${base.size}, Type: ${base.type})</option>`
                    ).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label>Skill Modules (Fixed):</label>
                  <div class="skill-modules-display">
                    <span class="module-item">3x Rank 1 Modules</span>
                    <span class="module-item">1x Rank 2 Module</span>
                    <span class="module-item">1x Rank 3 Module</span>
                  </div>
                </div>

                <div class="form-group">
                  <label for="power-benefit-select">Power Benefit:</label>
                  <select id="power-benefit-select" class="form-input">
                    <option value="dice_power">Dice Power: Single Die +3, 2 Dice +2 each, 3+ Dice +1 each</option>
                    <option value="cost_bonus">Cost Bonus: Skill modules with {Cost} effect treat {Cost} as 1 higher</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="passive-select">Base Passive:</label>
                  <select id="passive-select" class="form-input">
                    ${passives.map(passive =>
                      `<option value="${passive.id}">${passive.name}: ${passive.description}</option>`
                    ).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label>E.G.O Properties (Fixed):</label>
                  <div class="ego-properties-display">
                    <span class="property-item">Emotion Cost: 6</span>
                    <span class="property-item">Rating: ZAYIN</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" onclick="this.closeEgoCreationModal(false)">Cancel</button>
              <button class="btn-primary" onclick="this.closeEgoCreationModal(true)">Create E.G.O</button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);

      window.closeEgoCreationModal = async (confirm) => {
        if (confirm) {
          const name = document.getElementById('ego-name').value;
          const description = document.getElementById('ego-description').value;
          const skillBase = document.getElementById('skill-base-select').value;
          const powerBenefit = document.getElementById('power-benefit-select').value;
          const passive = document.getElementById('passive-select').value;

          if (!name.trim()) {
            alert('Please enter an E.G.O name');
            return;
          }

          const egoData = {
            name: name,
            description: description,
            skillBase: skillBase,
            powerBenefit: powerBenefit,
            passive: passive
          };

          const result = await this.characterManager.createBaseEgo(this.currentCharacter, egoData);
          if (result.success) {
            this.currentCharacter = result.character;
            await this.saveCurrentCharacter();
            this.showMessage('Base E.G.O created successfully!', 'success');

            // Re-render to update the UI
            this.render();
            this.attachEventListeners();
          } else {
            this.showMessage(`Error creating Base E.G.O: ${result.error}`, 'error');
          }

          resolve(true);
        } else {
          resolve(false);
        }

        document.getElementById('ego-creation-modal').remove();
        delete window.closeEgoCreationModal;
      };
    });
  }

  // Show Base E.G.O. Creator
  showBaseEgoCreator() {
    if (this.currentCharacter.level < 2) {
      this.showMessage('Base E.G.O. requires Level 2', 'error');
      return;
    }

    if (this.currentCharacter.progression.baseEgoCreated) {
      this.showMessage('Base E.G.O. already created', 'error');
      return;
    }

    this.baseEgoCreator = new BaseEGOCreator(
      this.currentCharacter,
      (egoData) => this.onBaseEgoSaved(egoData),
      () => this.onBaseEgoCancel()
    );
    this.showingBaseEgoCreator = true;
    this.render();
    this.attachEventListeners();
    this.setupBaseEgoCreatorEventListeners();
  }

  // Render Base E.G.O. Creator
  renderBaseEgoCreator() {
    return this.baseEgoCreator.render();
  }

  // Handle Base E.G.O. save
  async onBaseEgoSaved(egoData) {
    const result = await this.characterManager.createBaseEgo(this.currentCharacter, egoData);
    if (result.success) {
      this.currentCharacter = result.character;
      await this.saveCurrentCharacter();
      this.showMessage('Base E.G.O. created successfully!', 'success');
      this.showingBaseEgoCreator = false;
      this.baseEgoCreator = null;
      this.render();
      this.attachEventListeners();
    } else {
      this.showMessage('Error creating Base E.G.O.: ' + result.error, 'error');
    }
  }

  // Handle Base E.G.O. cancel
  onBaseEgoCancel() {
    this.showingBaseEgoCreator = false;
    this.baseEgoCreator = null;
    this.render();
    this.attachEventListeners();
  }

  // Setup Base E.G.O. Creator event listeners
  setupBaseEgoCreatorEventListeners() {
    if (!this.baseEgoCreator) return;

    // Base selection
    document.querySelectorAll('.base-card').forEach(card => {
      card.addEventListener('click', () => {
        const baseId = card.dataset.baseId;
        this.baseEgoCreator.selectBase(baseId);
        this.updateBaseEgoCreatorDisplay();
      });
    });

    // Module selection
    document.querySelectorAll('.module-card:not(.disabled)').forEach(card => {
      card.addEventListener('click', () => {
        const moduleId = card.dataset.moduleId;
        const moduleRank = parseInt(card.dataset.moduleRank);
        this.baseEgoCreator.selectModule(moduleId, moduleRank);
        this.updateBaseEgoCreatorDisplay();
      });
    });

    // Benefit selection
    document.querySelectorAll('.benefit-option').forEach(option => {
      option.addEventListener('click', () => {
        const benefit = option.dataset.benefit;
        this.baseEgoCreator.selectBenefit(benefit);
        this.updateBaseEgoCreatorDisplay();
      });
    });

    // Passive selection
    document.querySelectorAll('.passive-card').forEach(card => {
      card.addEventListener('click', () => {
        const passiveId = card.dataset.passiveId;
        this.baseEgoCreator.selectPassive(passiveId);
        this.updateBaseEgoCreatorDisplay();
      });
    });

    // Passive choice
    document.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = btn.dataset.choice;
        this.baseEgoCreator.selectPassiveChoice(choice);
        this.updateBaseEgoCreatorDisplay();
      });
    });

    // E.G.O. name input
    const egoNameInput = document.getElementById('ego-name');
    if (egoNameInput) {
      egoNameInput.addEventListener('input', (e) => {
        this.baseEgoCreator.setEgoName(e.target.value);
        this.updateBaseEgoCreatorDisplay();
      });
    }

    // Navigation buttons
    const nextBtn = document.getElementById('next-step-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.baseEgoCreator.nextStep();
        this.updateBaseEgoCreatorDisplay();
      });
    }

    const backBtn = document.getElementById('back-step-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.baseEgoCreator.previousStep();
        this.updateBaseEgoCreatorDisplay();
      });
    }

    const cancelBtn = document.getElementById('cancel-ego-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.baseEgoCreator.cancel();
      });
    }
  }

  // Update Base E.G.O. Creator display
  updateBaseEgoCreatorDisplay() {
    const container = document.querySelector('.terminal-content');
    if (container && this.baseEgoCreator) {
      container.innerHTML = this.baseEgoCreator.render();
      this.setupBaseEgoCreatorEventListeners();
    }
  }

  // Setup skill-related event listeners
  setupSkillControls() {
    // Add skill button
    const addSkillBtn = document.getElementById('add-skill-btn');
    if (addSkillBtn) {
      addSkillBtn.addEventListener('click', () => {
        this.showSkillCreationDialog();
      });
    }

    // View skill details
    document.querySelectorAll('[id^="view-skill-"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = btn.dataset.skillIndex;
        this.showSkillDetails(index);
      });
    });

    // Delete skill
    document.querySelectorAll('[id^="delete-skill-"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = btn.dataset.skillIndex;
        this.deleteSkill(index);
      });
    });
  }

  // Show skill creation dialog
  async showSkillCreationDialog() {
    if (!this.currentCharacter) return;

    const levelBenefits = this.characterManager.getLevelBenefits(this.currentCharacter.level);
    const maxSkills = levelBenefits?.totalSkills || 4;
    const currentSkills = this.currentCharacter.skills?.length || 0;

    if (currentSkills >= maxSkills) {
      this.showMessage('Maximum skills reached for this level', 'error');
      return;
    }

    const skillBases = this.characterManager.getSkillBases();
    const regularBases = skillBasesManager.getRegularBases();
    const uniqueSkills = skillBasesManager.getUniqueSkills();
    const spareModules = this.currentCharacter.spareModules;

    return new Promise((resolve) => {
      const modalHtml = `
        <div class="modal-overlay" id="skill-creation-modal">
          <div class="modal-content skill-creation-content">
            <div class="modal-header">
              <h3>Create Skill</h3>
              <button class="modal-close" onclick="window.closeSkillCreationModal(false)">��</button>
            </div>
            <div class="modal-body">
              <div class="skill-creation-tabs">
                <button class="skill-tab active" data-tab="custom">Custom Skills</button>
                <button class="skill-tab" data-tab="unique">Unique Skills</button>
              </div>

              <div class="skill-tab-content" id="custom-tab">
                <div class="skill-creation-info">
                  <p><strong>Custom Skill Creation:</strong></p>
                  <ul>
                    <li>Choose a Base for your skill from the available options</li>
                    <li>Add Skill Modules to customize effects and power</li>
                    <li>Each Module can only be taken once unless marked (Repeating)</li>
                    <li>Each skill can only have one of each tag type</li>
                    <li>Give your skill a unique name</li>
                  </ul>
                </div>

                <div class="skill-creation-form">
                  <div class="form-group">
                    <label for="skill-name">Skill Name:</label>
                    <input type="text" id="skill-name" class="form-input" placeholder="Enter custom skill name">
                  </div>

                  <div class="form-group">
                    <label for="skill-description">Description:</label>
                    <textarea id="skill-description" class="form-textarea" placeholder="Describe your skill (optional)"></textarea>
                  </div>

                  <div class="form-group">
                    <label for="skill-base-select">Skill Base:</label>
                    <select id="skill-base-select" class="form-input">
                      <option value="">Select a base...</option>
                      ${regularBases.map(base => {
                        const diceDisplay = base.dice.map(die => die.notation).join(', ');
                        return `<option value="${base.id}">${base.name} (Cost: ${base.cost}) - ${diceDisplay}</option>`;
                      }).join('')}
                    </select>
                  </div>
                </div>
              </div>

              <div class="skill-tab-content" id="unique-tab" style="display: none;">
                <div class="skill-creation-info">
                  <p><strong>Unique Skills:</strong></p>
                  <ul>
                    <li>Pre-built skills with complete effects and modules</li>
                    <li>No module selection required - they're ready to use</li>
                    <li>Don't consume spare modules</li>
                    <li>Perfect for quick skill selection</li>
                  </ul>
                </div>

                <div class="unique-skills-list">
                  ${uniqueSkills.map(unique => `
                    <div class="unique-skill-card" data-unique-id="${unique.id}">
                      <div class="unique-skill-header">
                        <h4>${unique.name}</h4>
                        <span class="unique-skill-cost">Cost: ${unique.cost}</span>
                      </div>
                      <div class="unique-skill-description">
                        ${unique.description}
                      </div>
                      <button class="btn-primary select-unique-btn" data-unique-id="${unique.id}">
                        SELECT SKILL
                      </button>
                    </div>
                  `).join('')}
                </div>
              </div>

                <div id="base-preview" class="base-preview" style="display: none;"></div>

                <div class="form-group">
                  <label>Available Modules:</label>
                  <div class="available-modules">
                    <div class="module-count-display">
                      <span>Rank 1: ${spareModules.rank1}</span>
                      <span>Rank 2: ${spareModules.rank2}</span>
                      <span>Rank 3: ${spareModules.rank3}</span>
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label>Selected Modules:</label>
                  <div id="selected-modules" class="selected-modules">
                    <div class="no-modules-selected">No modules selected yet</div>
                  </div>
                  <div class="module-selection-area">
                    <div class="module-rank-tabs">
                      <button type="button" class="module-tab active" data-rank="1">Rank 1</button>
                      <button type="button" class="module-tab" data-rank="2">Rank 2</button>
                      <button type="button" class="module-tab" data-rank="3">Rank 3</button>
                    </div>
                    <div id="module-options" class="module-options">
                      <!-- Module options will be populated here -->
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" onclick="window.closeSkillCreationModal(false)">Cancel</button>
              <button class="btn-primary" onclick="window.closeSkillCreationModal(true)" id="create-skill-btn">Create Skill</button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);

      // Initialize skill creation modal functionality
      this.initializeSkillCreationModal(resolve);
    });
  }

  // Initialize skill creation modal
  initializeSkillCreationModal(resolve) {
    let selectedBase = null;
    let selectedModules = [];
    let currentRank = 1;

    // Tab switching handlers
    document.querySelectorAll('.skill-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        // Update active tab
        document.querySelectorAll('.skill-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show/hide content
        const tabName = tab.dataset.tab;
        document.querySelectorAll('.skill-tab-content').forEach(content => {
          content.style.display = 'none';
        });
        document.getElementById(`${tabName}-tab`).style.display = 'block';
      });
    });

    // Unique skill selection handlers
    document.querySelectorAll('.select-unique-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uniqueId = btn.dataset.uniqueId;
        const skillName = prompt('Enter a name for this skill (or leave blank to use default):');

        if (skillName !== null) { // User didn't cancel
          const result = await this.characterManager.addSkillToCharacter(this.currentCharacter, {
            baseId: uniqueId,
            name: skillName || null,
            modules: [] // Unique skills don't need modules
          });

          if (result.success) {
            this.showMessage('Unique skill added successfully!', 'success');
            await this.saveCurrentCharacter();
            resolve(true);
          } else {
            this.showMessage('Error: ' + result.error, 'error');
          }
        }
      });
    });

    // Base selection handler
    const baseSelect = document.getElementById('skill-base-select');
    if (baseSelect) {
      baseSelect.addEventListener('change', () => {
        const baseId = baseSelect.value;
        selectedBase = baseId ? this.characterManager.getSkillBasesManager().getBaseById(baseId) : null;
        this.updateBasePreview(selectedBase);
      });
    }

    // Module rank tab handlers
    document.querySelectorAll('.module-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        currentRank = parseInt(tab.dataset.rank);
        document.querySelectorAll('.module-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.updateModuleOptions(currentRank, selectedModules);
      });
    });

    // Initialize with rank 1 modules
    this.updateModuleOptions(currentRank, selectedModules);

    // Close modal handler
    window.closeSkillCreationModal = async (confirm) => {
      if (confirm) {
        const name = document.getElementById('skill-name').value;
        const description = document.getElementById('skill-description').value;

        if (!name.trim()) {
          alert('Please enter a skill name');
          return;
        }

        if (!selectedBase) {
          alert('Please select a skill base');
          return;
        }

        const skillData = {
          name: name,
          description: description,
          baseId: selectedBase.id,
          modules: selectedModules
        };

        const result = this.characterManager.addSkillToCharacter(this.currentCharacter, skillData);
        if (result.success) {
          this.currentCharacter = result.character;
          await this.saveCurrentCharacter();
          this.showMessage('Skill created successfully!', 'success');

          // Re-render to update the UI
          this.render();
          this.attachEventListeners();
        } else {
          this.showMessage(`Error creating skill: ${result.error}`, 'error');
          return;
        }

        resolve(true);
      } else {
        resolve(false);
      }

      document.getElementById('skill-creation-modal').remove();
      delete window.closeSkillCreationModal;
    };
  }

  // Update base preview
  updateBasePreview(base) {
    const preview = document.getElementById('base-preview');
    if (!base) {
      preview.style.display = 'none';
      return;
    }

    const diceDisplay = base.dice.map(die => `${die.tag} ${die.notation}`).join('<br>');
    preview.innerHTML = `
      <h4>${base.name}</h4>
      <div class="base-details">
        <div>Cost: ${base.cost}</div>
        <div>Category: ${base.category}</div>
        <div class="dice-list">${diceDisplay}</div>
        <div class="base-description">${base.description}</div>
      </div>
    `;
    preview.style.display = 'block';
  }

  // Update module options
  updateModuleOptions(rank, selectedModules) {
    const modules = this.characterManager.getSkillModulesByRank(rank);
    const spareModules = this.currentCharacter.spareModules;
    const availableCount = spareModules[`rank${rank}`];
    const usedCount = selectedModules.filter(m => m.rank === rank).length;

    const optionsContainer = document.getElementById('module-options');

    if (modules.length === 0) {
      optionsContainer.innerHTML = '<div class="no-modules">No modules available for this rank</div>';
      return;
    }

    optionsContainer.innerHTML = `
      <div class="module-availability">Available: ${availableCount - usedCount}/${availableCount}</div>
      <div class="module-list">
        ${modules.map(module => {
          const isSelected = selectedModules.some(m => m.id === module.id);
          const canSelect = !isSelected && (usedCount < availableCount);

          return `
            <div class="module-option ${isSelected ? 'selected' : ''} ${canSelect ? '' : 'disabled'}"
                 data-module-id="${module.id}" data-rank="${rank}">
              <div class="module-name">${module.name}</div>
              <div class="module-effect">${module.effect}</div>
              <div class="module-meta">
                ${module.tag ? `<span class="module-tag">${module.tag}</span>` : ''}
                ${module.repeating ? '<span class="module-repeating">(Repeating)</span>' : ''}
                ${module.target === 'die' ? '<span class="module-target">Requires target die</span>' : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Add click handlers for module selection
    document.querySelectorAll('.module-option').forEach(option => {
      option.addEventListener('click', () => {
        const moduleId = option.dataset.moduleId;
        const moduleRank = parseInt(option.dataset.rank);

        if (option.classList.contains('selected')) {
          // Remove module
          selectedModules = selectedModules.filter(m => m.id !== moduleId);
        } else if (!option.classList.contains('disabled')) {
          // Add module
          selectedModules.push({ id: moduleId, rank: moduleRank });
        }

        this.updateSelectedModulesDisplay(selectedModules);
        this.updateModuleOptions(rank, selectedModules);
      });
    });
  }

  // Update selected modules display
  updateSelectedModulesDisplay(selectedModules) {
    const container = document.getElementById('selected-modules');

    if (selectedModules.length === 0) {
      container.innerHTML = '<div class="no-modules-selected">No modules selected yet</div>';
      return;
    }

    const modulesHtml = selectedModules.map(moduleRef => {
      const module = this.characterManager.getSkillModulesManager().getModuleById(moduleRef.id, moduleRef.rank);
      return `
        <div class="selected-module">
          <span class="module-name">${module.name} (Rank ${module.rank})</span>
          <span class="module-effect">${module.effect}</span>
        </div>
      `;
    }).join('');

    container.innerHTML = modulesHtml;
  }

  // Show target die selection dialog
  async showTargetDieSelectionDialog(availableDice, moduleName) {
    return new Promise((resolve) => {
      const dialogHtml = `
        <div class="modal-overlay" id="target-die-modal">
          <div class="modal-content target-die-content">
            <div class="modal-header">
              <h3>Select Target Die</h3>
              <button class="modal-close" onclick="window.closeTargetDieModal(null)">×</button>
            </div>
            <div class="modal-body">
              <p>The module <strong>${moduleName}</strong> requires a target die. Please select which die to apply this effect to:</p>
              <div class="target-dice-list">
                ${availableDice.map((die, index) => `
                  <div class="target-die-option" data-die-id="${die.id}">
                    <div class="die-info">
                      <span class="die-tag">${die.tag}</span>
                      <span class="die-notation">${die.notation}</span>
                      <span class="die-type">(${die.type})</span>
                    </div>
                    <button class="btn-primary select-die-btn" data-die-id="${die.id}">
                      SELECT
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" onclick="window.closeTargetDieModal(null)">Cancel</button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', dialogHtml);

      // Event listeners for die selection
      document.querySelectorAll('.select-die-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const dieId = btn.dataset.dieId;
          window.closeTargetDieModal(dieId);
        });
      });

      // Close modal handler
      window.closeTargetDieModal = (selectedDieId) => {
        document.getElementById('target-die-modal').remove();
        delete window.closeTargetDieModal;
        resolve(selectedDieId);
      };
    });
  }

  // Show skill details
  showSkillDetails(index) {
    const skill = this.currentCharacter.skills[index];
    if (!skill) return;

    const modulesDisplay = skill.modules && skill.modules.length > 0 ?
      skill.modules.map(moduleRef => {
        const module = this.characterManager.getSkillModulesManager().getModuleById(moduleRef.id, moduleRef.rank);
        return module ? `${module.name} (Rank ${module.rank}): ${module.effect}` : 'Unknown Module';
      }).join('<br>') : 'No modules';

    const diceDisplay = skill.dice && skill.dice.length > 0 ?
      skill.dice.map(die => `${die.tag} ${die.notation}`).join('<br>') : 'No dice data';

    const modalHtml = `
      <div class="modal-overlay" id="skill-details-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>${skill.name}</h3>
            <button class="modal-close" onclick="document.getElementById('skill-details-modal').remove()">×</button>
          </div>
          <div class="modal-body">
            <div class="skill-detail-info">
              <div class="detail-row"><strong>Base:</strong> ${skill.baseName || 'Unknown'}</div>
              <div class="detail-row"><strong>Cost:</strong> ${skill.cost}</div>
              <div class="detail-row"><strong>Type:</strong> ${skill.type || 'Custom'}</div>
              ${skill.description ? `<div class="detail-row"><strong>Description:</strong> ${skill.description}</div>` : ''}
            </div>
            <div class="skill-dice-section">
              <h4>Dice:</h4>
              <div class="dice-display">${diceDisplay}</div>
            </div>
            ${skill.modules && skill.modules.length > 0 ? `
              <div class="skill-modules-section">
                <h4>Modules:</h4>
                <div class="modules-display">${modulesDisplay}</div>
              </div>
            ` : ''}
            ${skill.tags && skill.tags.length > 0 ? `
              <div class="skill-tags-section">
                <h4>Tags:</h4>
                <div class="tags-display">${skill.tags.join(', ')}</div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  // Delete skill
  async deleteSkill(index) {
    const skill = this.currentCharacter.skills[index];
    if (!skill) return;

    if (!confirm(`Are you sure you want to delete the skill "${skill.name}"?`)) {
      return;
    }

    const result = this.characterManager.removeSkillFromCharacter(this.currentCharacter, skill.id);
    if (result.success) {
      this.currentCharacter = result.character;
      await this.saveCurrentCharacter();
      this.showMessage('Skill deleted successfully!', 'success');

      // Re-render to update the UI
      this.render();
      this.attachEventListeners();
    } else {
      this.showMessage(`Error deleting skill: ${result.error}`, 'error');
    }
  }
}
