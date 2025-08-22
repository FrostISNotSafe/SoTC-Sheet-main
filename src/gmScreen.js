import { CharacterManager } from './character.js';
import { ref, get } from 'firebase/database';
import { database } from './firebase.js';
import { ChatSystem } from './chatSystem.js';

export class GMScreen {
  constructor() {
    this.allCharacters = [];
    this.currentTheme = 'gold';
    this.chatSystem = new ChatSystem('gm-user', 'Game Master', 'gm');
    this.init();
  }

  async init() {
    await this.loadAllCharacters();
    this.render();
    this.attachEventListeners();
    this.initializeChat();
  }

  async loadAllCharacters() {
    try {
      const charactersRef = ref(database, 'characters');
      const snapshot = await get(charactersRef);
      
      if (snapshot.exists()) {
        const allUserCharacters = snapshot.val();
        this.allCharacters = [];
        
        // Coleta todos os personagens de todos os usuários
        Object.keys(allUserCharacters).forEach(userId => {
          const userCharacters = allUserCharacters[userId];
          Object.keys(userCharacters).forEach(characterId => {
            const character = {
              id: characterId,
              userId: userId,
              ...userCharacters[characterId]
            };
            this.allCharacters.push(character);
          });
        });
      } else {
        this.allCharacters = [];
      }
    } catch (error) {
      console.error('Error loading characters:', error);
      this.allCharacters = [];
    }
  }

  render() {
    document.body.innerHTML = `
      <div class="scanlines"></div>
      <div class="terminal-container">
        <div class="terminal-header">
          <div class="header-left">
            <div class="communication-tab">GM SCREEN</div>
            <div class="dashboard-tab">CHARACTER OVERVIEW</div>
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
            <button class="btn-logout" id="back-btn">BACK TO SYSTEM</button>
          </div>
        </div>

        <div class="left-panel">
          <div class="panel-section">
            <div class="panel-title">GM CONTROLS</div>
            <button class="btn-primary small-btn" id="refresh-characters-btn">REFRESH</button>
            <button class="btn-secondary small-btn" id="export-data-btn">EXPORT</button>
          </div>
        </div>

        <div class="main-terminal">
          <div class="corner-brackets"></div>

          <div class="gm-screen-content">
            <div class="terminal-title">ACTIVE CHARACTERS</div>
            <div class="terminal-subtitle">Game Master Overview</div>

            <div class="characters-grid">
              ${this.renderCharacterCards()}
            </div>
          </div>
        </div>

        <div class="chat-panel">
          <div class="chat-header">
            <div class="panel-title">🎭 GM TERMINAL</div>
            <button class="btn-secondary small-btn" id="clear-chat-btn">CLEAR</button>
          </div>

          <div class="chat-messages" id="chat-messages">
            <div class="chat-loading"></div>
          </div>

          <div class="chat-input-area">
            <div class="quick-actions">
              <button class="quick-btn" id="roll-d6-btn" title="/d6">/d6</button>
              <button class="quick-btn" id="roll-d20-btn" title="/d20">/d20</button>
              <button class="quick-btn" id="help-btn" title="/help">/help</button>
            </div>
            <div class="chat-input-container">
              <input type="text" id="chat-input" class="chat-input" placeholder="Mensagem ou /comando... (aperte Enter)" maxlength="500">
            </div>
          </div>
        </div>

        <div class="terminal-footer">
          STARS OF THE CITY - GAME MASTER SCREEN
        </div>
      </div>
    `;

    this.setupThemeSelector();
  }

  renderCharacterCards() {
    if (this.allCharacters.length === 0) {
      return `
        <div class="no-characters-gm">
          <div class="no-chars-icon">👥</div>
          <div class="no-chars-title">No Characters Found</div>
          <div class="no-chars-subtitle">Players need to create characters first</div>
        </div>
      `;
    }

    return this.allCharacters.map(character => this.renderCharacterCard(character)).join('');
  }

  renderCharacterCard(character) {
    const archetype = character.archetype || 'Unknown';
    const name = character.name || 'Unnamed';
    const level = character.level || 1;
    const imageUrl = character.imageUrl || '';

    return `
      <div class="character-card-gm" data-character-id="${character.id}" data-user-id="${character.userId}">
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

        <div class="character-stats-overlay">
          <div class="stat-item">
            <span class="stat-label">HP:</span>
            <span class="stat-value">${character.derivativeStats?.hp || 40}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">SR:</span>
            <span class="stat-value">${character.derivativeStats?.staggerResist || 20}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Light:</span>
            <span class="stat-value">${character.derivativeStats?.currentLight || 3}/${character.derivativeStats?.maxLight || 3}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Speed:</span>
            <span class="stat-value">${character.derivativeStats?.speedDieSize || 'd6'}</span>
          </div>
        </div>
      </div>
    `;
  }

  getUniquePlayerCount() {
    const uniqueUsers = new Set(this.allCharacters.map(char => char.userId));
    return uniqueUsers.size;
  }

  getAverageLevel() {
    if (this.allCharacters.length === 0) return '0';
    const totalLevel = this.allCharacters.reduce((sum, char) => sum + (char.level || 1), 0);
    return Math.round(totalLevel / this.allCharacters.length);
  }

  renderArchetypeDistribution() {
    const distribution = {};
    this.allCharacters.forEach(char => {
      const archetype = char.archetype || 'Unknown';
      distribution[archetype] = (distribution[archetype] || 0) + 1;
    });

    return Object.entries(distribution)
      .sort(([,a], [,b]) => b - a)
      .map(([archetype, count]) => `
        <div class="panel-item">
          <span class="panel-label">${archetype}:</span>
          <span class="panel-value">${count}</span>
        </div>
      `).join('');
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
    this.currentTheme = themeName;
  }

  attachEventListeners() {
    // Character card clicks
    document.querySelectorAll('.character-card-gm').forEach(card => {
      card.addEventListener('click', (e) => {
        const characterId = e.currentTarget.dataset.characterId;
        const userId = e.currentTarget.dataset.userId;
        this.showCharacterDetails(characterId, userId);
      });
    });

    // Back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        location.reload();
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-characters-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        await this.loadAllCharacters();
        this.render();
        this.attachEventListeners();
      });
    }

    // Export button
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportCharacterData();
      });
    }

    // Setup chat event listeners
    this.setupChatEventListeners();
  }

  showCharacterDetails(characterId, userId) {
    const character = this.allCharacters.find(char => char.id === characterId && char.userId === userId);
    if (!character) return;

    const details = `
      Character: ${character.name || 'Unnamed'}
      Level: ${character.level || 1}
      Archetype: ${character.archetype || 'Unknown'}
      
      Stats:
      - Might: ${character.stats?.might || 1}
      - Vitality: ${character.stats?.vitality || 1} 
      - Agility: ${character.stats?.agility || 1}
      - Intellect: ${character.stats?.intellect || 1}
      - Instinct: ${character.stats?.instinct || 1}
      - Persona: ${character.stats?.persona || 1}
      
      Derivative Stats:
      - HP: ${character.derivativeStats?.hp || 40}
      - Stagger Resist: ${character.derivativeStats?.staggerResist || 20}
      - Speed Die: ${character.derivativeStats?.speedDieSize || 'd6'}
      - Max Light: ${character.derivativeStats?.maxLight || 3}
      
      Skills: ${(character.skills || []).length} skills
    `;
    
    alert(details);
  }

  exportCharacterData() {
    const data = this.allCharacters.map(char => ({
      name: char.name,
      level: char.level,
      archetype: char.archetype,
      stats: char.stats,
      derivativeStats: char.derivativeStats
    }));

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'sotc-characters.json';
    link.click();

    URL.revokeObjectURL(url);
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
      chatContainer.innerHTML = '<div class="chat-empty">Nenhuma mensagem ainda. Comece a conversa!</div>';
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

    // Help button
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => this.sendHelpCommand());
    }

    // Clear chat
    const clearBtn = document.getElementById('clear-chat-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearChat());
    }
  }

  async sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;

    const result = await this.chatSystem.sendMessage(input.value);
    if (result.success) {
      input.value = '';
    }
  }

  async rollDice(sides) {
    const result = this.chatSystem.rollDice(sides);
    await this.chatSystem.sendDiceRoll(`d${sides}`, result, 'GM rolled');
  }

  async sendHelpCommand() {
    await this.chatSystem.sendMessage('/help');
  }

  async sendSystemMessage() {
    const message = prompt('Sistema mensagem:');
    if (message && message.trim()) {
      await this.chatSystem.sendSystemMessage(`📢 ${message}`);
    }
  }

  async clearChat() {
    if (confirm('Limpar todo o chat? Esta ação não pode ser desfeita.')) {
      // Note: In a real implementation, you'd want to clear the database
      console.log('Chat clearing would be implemented here');
    }
  }
}
