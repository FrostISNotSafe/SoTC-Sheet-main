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

export class CharacterSheet {
  constructor(userId) {
    this.userId = userId;
    this.characterManager = new CharacterManager(userId);
    this.characters = [];
    this.currentCharacter = null;
    this.editMode = false;
    this.currentTab = 'overview';
    // Recupera role e nome do usuário da sessão
    const session = JSON.parse(localStorage.getItem('sotc-current-session') || 'null');
    const userRole = session && session.role ? session.role : 'player';
    const userName = session && session.displayName ? session.displayName : 'Player';
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
      if (this.characters.length > 0) {
        this.currentCharacter = this.characters[0];
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
              <select id="theme-select">
                <option value="gold">Gold</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="red">Red</option>
                <option value="purple">Purple</option>
                <option value="cyan">Cyan</option>
                <option value="orange">Orange</option>
                <option value="pink">Pink</option>
              </select>
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
                 <span class="placeholder-icon">👤</span>
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
    const skills = char.skills || [];
    const spareModules = char.spareModules || { rank1: 0, rank2: 0, rank3: 0 };
    const levelBenefits = this.characterManager.getLevelBenefits(char.level);
    const maxSkills = levelBenefits?.totalSkills || 4;

    return `
      <div class="terminal-title">SKILLS</div>
      <div class="terminal-subtitle">Character abilities and techniques</div>

      <div class="skills-container">
        <div class="skills-header">
          <div class="skill-count">Skills: ${skills.length}/${maxSkills} (Level ${char.level})</div>
          <button class="btn-primary ${skills.length >= maxSkills ? 'disabled' : ''}"
                  id="add-skill-btn"
                  ${skills.length >= maxSkills ? 'disabled' : ''}>
            CREATE SKILL
          </button>
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
            <p>Modules are used to customize your skills with additional effects and power.</p>
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
            <h3>Base E.G.O</h3>
            ${char.ego.base ?
              this.renderEgoCard(char.ego.base) :
              `<div class="no-ego">
                <p>No Base E.G.O created.</p>
                <button class="btn-primary" id="create-base-ego-btn">CREATE BASE E.G.O</button>
              </div>`
            }
          </div>

          <div class="ego-section">
            <h3>Additional E.G.O</h3>
            ${char.ego.additional.length === 0 ?
              '<div class="no-additional-ego">No additional E.G.O abilities.</div>' :
              char.ego.additional.map(ego => this.renderEgoCard(ego)).join('')
            }
          </div>
        `}
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
          <button class="btn-secondary small-btn" id="gm-screen-btn">GM</button>
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
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        this.changeTheme(e.target.value);
      });
    }
  }

  changeTheme(themeName) {
    const themes = {
      gold: 51, blue: 240, green: 120, red: 0,
      purple: 280, cyan: 180, orange: 30, pink: 320
    };
    const hue = themes[themeName];
    document.documentElement.style.setProperty('--base-hue', hue);
  }

  attachEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Permite trocar de aba mesmo em modo de edição
        this.currentTab = e.target.dataset.tab;
        this.editMode = false;
        this.render();
        this.attachEventListeners();
      });
    });

    // Character selection
    document.querySelectorAll('.character-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        const characterId = e.currentTarget.dataset.characterId;
        const result = await this.characterManager.loadCharacter(characterId);
        if (result.success) {
          this.currentCharacter = result.character;
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

    // Setup progression controls
    this.setupProgressionControls();
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
    // Simple message system - could be enhanced
    console.log(`${type.toUpperCase()}: ${text}`);
  }

  renderSkillCard(skill, index) {
    const diceDisplay = skill.dice ? skill.dice.map(die => die.notation).join(', ') : 'Unknown';
    const tagsDisplay = skill.tags ? skill.tags.join(', ') : 'None';
    const modulesCount = skill.modules ? skill.modules.length : 0;

    return `
      <div class="skill-card">
        <div class="skill-header">
          <h4>${skill.name}</h4>
          <div class="skill-actions">
            <button class="btn-secondary small-btn" data-skill-index="${index}" id="view-skill-${index}">VIEW</button>
            <button class="btn-warning small-btn" data-skill-index="${index}" id="delete-skill-${index}">DELETE</button>
          </div>
        </div>

        <div class="skill-details">
          <div class="skill-info-row">
            <span class="skill-label">Cost:</span>
            <span class="skill-value">${skill.cost}</span>
          </div>
          <div class="skill-info-row">
            <span class="skill-label">Dice:</span>
            <span class="skill-value">${diceDisplay}</span>
          </div>
          <div class="skill-info-row">
            <span class="skill-label">Base:</span>
            <span class="skill-value">${skill.baseName || 'Custom'}</span>
          </div>
          <div class="skill-info-row">
            <span class="skill-label">Modules:</span>
            <span class="skill-value">${modulesCount}</span>
          </div>
          ${skill.tags && skill.tags.length > 0 ? `
            <div class="skill-info-row">
              <span class="skill-label">Tags:</span>
              <span class="skill-value skill-tags">${tagsDisplay}</span>
            </div>
          ` : ''}
        </div>

        ${skill.description ? `
          <div class="skill-description">
            ${skill.description}
          </div>
        ` : ''}
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
    if (createEgoBtn) {
      createEgoBtn.addEventListener('click', () => {
        this.showCreateBaseEgoDialog();
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
    const spareModules = this.currentCharacter.spareModules;

    return new Promise((resolve) => {
      const modalHtml = `
        <div class="modal-overlay" id="skill-creation-modal">
          <div class="modal-content skill-creation-content">
            <div class="modal-header">
              <h3>Create Custom Skill</h3>
              <button class="modal-close" onclick="window.closeSkillCreationModal(false)">×</button>
            </div>
            <div class="modal-body">
              <div class="skill-creation-info">
                <p><strong>Skill Creation Process:</strong></p>
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
                    ${skillBases.map(base => {
                      const diceDisplay = base.dice.map(die => die.notation).join(', ');
                      return `<option value="${base.id}">${base.name} (Cost: ${base.cost}) - ${diceDisplay}</option>`;
                    }).join('')}
                  </select>
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

    // Base selection handler
    const baseSelect = document.getElementById('skill-base-select');
    baseSelect.addEventListener('change', () => {
      const baseId = baseSelect.value;
      selectedBase = baseId ? this.characterManager.getSkillBasesManager().getBaseById(baseId) : null;
      this.updateBasePreview(selectedBase);
    });

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
