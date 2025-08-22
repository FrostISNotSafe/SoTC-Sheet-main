import './style.css';
import './progression-styles.css';
import { AuthManager } from './auth.js';
import './admin.js'; // Load admin utilities
// import './testCharacters.js'; // Load test characters utilities
// import './demoData.js'; // Load demo characters

class TerminalApp {
  constructor() {
    this.authManager = new AuthManager();
    this.currentTime = new Date();
    this.isLoginMode = true;
    this.currentTheme = 'gold';
    this.themes = {
      gold: 51,      // Gold (original)
      blue: 220,     // Blue
      green: 120,    // Green
      red: 0,        // Red
      purple: 265,   // Purple
      cyan: 180,     // Cyan
      orange: 30,    // Orange
      pink: 320      // Pink
    };
    this.initializeSystemData();
    this.init();
    this.startClock();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  startClock() {
    setInterval(() => {
      this.currentTime = new Date();
      this.updateClock();
    }, 1000);
  }

  updateClock() {
    const timeElement = document.getElementById('system-time');
    if (timeElement) {
      timeElement.textContent = this.currentTime.toTimeString().split(' ')[0];
    }
  }

  initializeSystemData() {
    this.systemData = {
      location: 'Nest L Corp Branch',
      ipAddress: '192.168.1.███',
      device: 'LCORPNET Terminal',
      visitors: Math.floor(Math.random() * 100) + 50,
      netConnection: 'lcb89d7f92d4c205a03',
      security: 'ENCRYPTED',
      connectionStatus: '100.2 MB/s',
      powerControl: 'Normal (100% usage)',
      cpuTemp: '42°C',
      encryptionMethod: 'AES-256',
      alarmStatus: 'Normal'
    };
  }

  changeTheme(themeName) {
    this.currentTheme = themeName;
    const hue = this.themes[themeName];
    document.documentElement.style.setProperty('--base-hue', hue);
  }

  render() {
    document.querySelector('#app').innerHTML = `
      <div class="scanlines"></div>
      <div class="terminal-container">
        <div class="terminal-header">
          <div class="header-left">
            <div class="communication-tab">COMMUNICATION</div>
            <div class="dashboard-tab">LCORPNET DASHBOARD</div>
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
            <span>General Information</span>
          </div>
        </div>

        <div class="left-panel">
          <div class="panel-section">
            <div class="panel-title">System Status</div>
            <div class="panel-item">
              <span class="panel-label">Status:</span>
              <span class="panel-value success">ONLINE</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">Security:</span>
              <span class="panel-value success">SECURE</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">Access Level:</span>
              <span class="panel-value warning">GUEST</span>
            </div>
          </div>

          <div class="panel-section">
            <div class="panel-title">Instructions</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6;">
              • Use the forms to login or register<br>
              ��� Change theme colors using the selector above<br>
              • All data is encrypted and secure<br>
              • GM access requires manual promotion
            </div>
          </div>
        </div>

        <div class="main-terminal">
          <div class="corner-brackets"></div>
          
          <div class="terminal-content">
            <div class="terminal-title">LCORPNET DIRECT</div>
            <div class="terminal-title">ACCESS TERMINAL</div>
            <div class="terminal-subtitle">PROJECT MOON NETWORK</div>



            <div class="auth-form-container">
              <div class="form-toggle-buttons">
                <button class="form-toggle-btn ${this.isLoginMode ? 'active' : ''}" id="login-tab">
                  LOGIN
                </button>
                <button class="form-toggle-btn ${!this.isLoginMode ? 'active' : ''}" id="register-tab">
                  REGISTER
                </button>
              </div>

              <div id="message-container" class="message-container"></div>

              <form class="auth-form ${this.isLoginMode ? 'active' : ''}" id="login-form">
                <div class="form-group">
                  <label class="form-label">USERNAME</label>
                  <input type="text" class="form-input" id="login-username" placeholder="Enter your username" required>
                </div>
                <div class="form-group">
                  <label class="form-label">PASSWORD</label>
                  <input type="password" class="form-input" id="login-password" placeholder="Enter your password" required>
                </div>
                <button type="submit" class="btn-primary" id="login-btn">
                  ACCESS SYSTEM
                </button>
              </form>

              <form class="auth-form ${!this.isLoginMode ? 'active' : ''}" id="register-form">
                <div class="form-group">
                  <label class="form-label">USERNAME</label>
                  <input type="text" class="form-input" id="register-username" placeholder="Choose a username" required>
                </div>
                <div class="form-group">
                  <label class="form-label">PASSWORD</label>
                  <input type="password" class="form-input" id="register-password" placeholder="Create a password" required>
                </div>
                <button type="submit" class="btn-primary" id="register-btn">
                  CREATE ACCOUNT
                </button>
              </form>
            </div>
          </div>
        </div>

        <div class="right-panel">
          <div class="panel-section">
            <div class="panel-title">General Information</div>
            <div class="panel-item">
              <span class="panel-label">Time:</span>
              <span class="panel-value system-time" id="system-time">${this.currentTime.toTimeString().split(' ')[0]}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">Location:</span>
              <span class="panel-value">${this.systemData.location}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">IP Address:</span>
              <span class="panel-value error">${this.systemData.ipAddress}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">Client Device:</span>
              <span class="panel-value">${this.systemData.device}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">Connected Users:</span>
              <span class="panel-value">${this.systemData.visitors}</span>
            </div>
          </div>

          <div class="panel-section">
            <div class="panel-title">Live Data Transmission</div>
            <div class="panel-item">
              <span class="panel-label">Data File Security:</span>
              <span class="panel-value success">${this.systemData.security}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">Connection Status:</span>
              <span class="panel-value success">${this.systemData.connectionStatus}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">NetConnection Seed:</span>
              <span class="panel-value" style="font-size: 0.7rem;">${this.systemData.netConnection}</span>
            </div>
          </div>

          <div class="panel-section">
            <div class="panel-title">System Control</div>
            <div class="panel-item">
              <span class="panel-label">Power Distribution:</span>
              <span class="panel-value success">${this.systemData.powerControl}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">CPU Temperature:</span>
              <span class="panel-value">${this.systemData.cpuTemp}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">Encryption Method:</span>
              <span class="panel-value">${this.systemData.encryptionMethod}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">Alarm Status:</span>
              <span class="panel-value success">${this.systemData.alarmStatus}</span>
            </div>
          </div>
        </div>

        <div class="terminal-footer">
          LCORPNET DASHBOARD - LOCAL AUTH + FIREBASE DATABASE
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Theme selector
    const themeSelect = document.getElementById('theme-select');
    themeSelect.value = this.currentTheme;
    themeSelect.addEventListener('change', (e) => {
      this.changeTheme(e.target.value);
    });

    // Form toggle buttons
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    
    loginTab.addEventListener('click', () => this.switchToLogin());
    registerTab.addEventListener('click', () => this.switchToRegister());

    // Form submissions
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    registerForm.addEventListener('submit', (e) => this.handleRegister(e));
  }

  switchToLogin() {
    this.isLoginMode = true;
    this.clearMessages();
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('register-tab').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
    document.getElementById('register-form').classList.remove('active');
  }

  switchToRegister() {
    this.isLoginMode = false;
    this.clearMessages();
    document.getElementById('register-tab').classList.add('active');
    document.getElementById('login-tab').classList.remove('active');
    document.getElementById('register-form').classList.add('active');
    document.getElementById('login-form').classList.remove('active');
  }

  async handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-btn');

    if (!username || !password) {
      this.showError('All fields are required');
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="loading">AUTHENTICATING</span>';
    submitBtn.disabled = true;
    
    this.clearMessages();

    try {
      const result = await this.authManager.login(username, password);
      if (result.success) {
        console.log('User after login:', result.user);
        this.showSuccess('Authentication successful! Redirecting...');

        // Small delay to show success message, then redirect
        setTimeout(() => {
          const role = result.user.role || 'player';
          if (role === 'gm') {
            this.authManager.redirectToGMScreen();
          } else {
            this.authManager.redirectToCharacterSheet();
          }
        }, 1000);
        return;
      } else {
        this.showError(result.error);
      }
    } catch (error) {
      this.showError('Network error during authentication');
    }

    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }

  async handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const submitBtn = document.getElementById('register-btn');

    if (!username || !password) {
      this.showError('All fields are required');
      return;
    }

    if (password.length < 6) {
      this.showError('Password must be at least 6 characters');
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="loading">CREATING ACCOUNT</span>';
    submitBtn.disabled = true;
    
    this.clearMessages();

    try {
      const result = await this.authManager.register(username, password, username);
      if (result.success) {
        this.showSuccess('Account created successfully! You can now login.');
        setTimeout(() => this.switchToLogin(), 2000);
      } else {
        this.showError(result.error);
      }
    } catch (error) {
      this.showError('Network error during registration');
    }

    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }

  showError(message) {
    const container = document.getElementById('message-container');
    container.innerHTML = `<div class="error-message">${message}</div>`;
  }

  showSuccess(message) {
    const container = document.getElementById('message-container');
    container.innerHTML = `<div class="success-message">${message}</div>`;
  }

  clearMessages() {
    const container = document.getElementById('message-container');
    if (container) {
      container.innerHTML = '';
    }
  }


}

// Initialize the terminal app
new TerminalApp();
