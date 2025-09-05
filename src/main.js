import './style.css';
import './progression-styles.css';
import './skillCreator.css';
import { AuthManager } from './auth.js';
import './admin.js'; // Load admin utilities
import { getBrandProfile, brandProfiles, themeHues, themeBrandMap, getThemeForBrand } from './themes/index.js';
import { ref, onValue } from 'firebase/database';
import { database } from './firebase.js';
// import './testCharacters.js'; // Load test characters utilities
// import './demoData.js'; // Load demo characters

class TerminalApp {
  constructor() {
    this.authManager = new AuthManager();
    this.currentTime = new Date();
    this.isLoginMode = true;
    const storedTheme = localStorage.getItem('sotc-theme-key');
    const storedBrand = localStorage.getItem('sotc-brand-key');
    let initTheme = storedTheme || (storedBrand ? (getThemeForBrand(storedBrand) || null) : null) || 'gold';
    this.currentTheme = initTheme;
    this.changeTheme(this.currentTheme);
    const mappedBrand = themeBrandMap[this.currentTheme] || storedBrand || 'default';
    this.brandKey = mappedBrand;
    this.brand = getBrandProfile(this.brandKey);
    this.initializeSystemData();
    this.init();
    this.startClock();
    this.newsItems = [];
    this.startNewsListener();
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
    if (themeName in themeHues) {
      this.currentTheme = themeName;
      const hue = themeHues[themeName];
      document.documentElement.style.setProperty('--base-hue', hue);
    }
  }

  render() {
    const hasVisitorsOverride = this.brand.systemOverrides && Object.prototype.hasOwnProperty.call(this.brand.systemOverrides, 'visitors');
    const sd = { ...this.systemData, ...(this.brand.systemOverrides || {}) };
    if (!hasVisitorsOverride) {
      sd.visitors = Math.floor(Math.random() * 100) + 50;
    }
    const defaultInstructions = '• Use the forms to login or register<br>• Change theme colors using the selector above<br>• All data is encrypted and secure<br>• GM access requires manual promotion';
    const labels = Object.assign({
      systemStatus: 'System Status',
      instructions: 'Instructions',
      generalInfo: 'General Information',
      liveData: 'Live Data Transmission',
      systemControl: 'System Control',
      status: 'Status',
      security: 'Security',
      accessLevel: 'Access Level',
      time: 'Time',
      location: 'Location',
      ipAddress: 'IP Address',
      device: 'Client Device',
      visitors: 'Connected Users',
      dataFileSecurity: 'Data File Security',
      connectionStatus: 'Connection Status',
      netConnection: 'NetConnection Seed',
      powerControl: 'Power Distribution',
      cpuTemp: 'CPU Temperature',
      encryptionMethod: 'Encryption Method',
      alarmStatus: 'Alarm Status'
    }, this.brand.fieldLabels || {});
    const leftPanel = Object.assign({
      status: 'ONLINE',
      security: 'SECURE',
      accessLevel: 'GUEST',
      instructionsHtml: this.brand.instructionsHtml || defaultInstructions
    }, (this.brand.leftPanel || {}));
    document.querySelector('#app').innerHTML = `
      <div class="scanlines"></div>
      <div class="terminal-container">
        <div class="terminal-header">
          <div class="header-left">
            <div class="communication-tab">COMMUNICATION</div>
            <div class="dashboard-tab">${this.brand.brand} DASHBOARD</div>
          </div>
          <div class="header-right">
            <div class="theme-selector">
              <label>Theme:</label>
              <select id="theme-select"></select>
            </div>
            <span>General Information</span>
          </div>
        </div>

        <div class="left-panel">
          <div class="panel-section">
            <div class="panel-title">${labels.systemStatus}</div>
            <div class="panel-item">
              <span class="panel-label">${labels.status}:</span>
              <span class="panel-value success">${leftPanel.status}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">${labels.security}:</span>
              <span class="panel-value success">${leftPanel.security}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">${labels.accessLevel}:</span>
              <span class="panel-value warning">${leftPanel.accessLevel}</span>
            </div>
          </div>

          <div class="panel-section">
            <div class="panel-title">${labels.instructions}</div>
            <div class="instructions-text">${leftPanel.instructionsHtml}</div>
          </div>
        </div>

        <div class="main-terminal">
          <div class="corner-brackets"></div>
          
          <div class="terminal-content">
            <div class="terminal-title">${this.brand.title1}</div>
            <div class="terminal-title">${this.brand.title2}</div>
            <div class="terminal-subtitle">${this.brand.subtitle}</div>



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
                  <input type="text" class="form-input" id="login-username" placeholder="${this.brand.placeholders.username}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">PASSWORD</label>
                  <input type="password" class="form-input" id="login-password" placeholder="${this.brand.placeholders.password}" required>
                </div>
                <button type="submit" class="btn-primary" id="login-btn">
                  ACCESS SYSTEM
                </button>
              </form>

              <form class="auth-form ${!this.isLoginMode ? 'active' : ''}" id="register-form">
                <div class="form-group">
                  <label class="form-label">USERNAME</label>
                  <input type="text" class="form-input" id="register-username" placeholder="${this.brand.placeholders.username}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">PASSWORD</label>
                  <input type="password" class="form-input" id="register-password" placeholder="${this.brand.placeholders.password}" required>
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
            <div class="panel-title">${labels.generalInfo}</div>
            <div class="panel-item">
              <span class="panel-label">${labels.time}:</span>
              <span class="panel-value system-time" id="system-time">${this.currentTime.toTimeString().split(' ')[0]}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">${labels.location}:</span>
              <span class="panel-value">${sd.location}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">${labels.ipAddress}:</span>
              <span class="panel-value error">${sd.ipAddress}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">${labels.device}:</span>
              <span class="panel-value">${sd.device}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">${labels.visitors}:</span>
              <span class="panel-value">${sd.visitors}</span>
            </div>
          </div>

          <div class="panel-section">
            <div class="panel-title">${labels.liveData}</div>
            <div class="panel-item">
              <span class="panel-label">${labels.dataFileSecurity}:</span>
              <span class="panel-value success">${sd.security}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">${labels.connectionStatus}:</span>
              <span class="panel-value success">${sd.connectionStatus}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">${labels.netConnection}:</span>
              <span class="panel-value" style="font-size: 0.7rem;">${sd.netConnection}</span>
            </div>
          </div>

          <div class="panel-section">
            <div class="panel-title">${labels.systemControl}</div>
            <div class="panel-item">
              <span class="panel-label">${labels.powerControl}:</span>
              <span class="panel-value success">${sd.powerControl}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">${labels.cpuTemp}:</span>
              <span class="panel-value">${sd.cpuTemp}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">${labels.encryptionMethod}:</span>
              <span class="panel-value">${sd.encryptionMethod}</span>
            </div>
            <div class="panel-item">
              <span class="panel-label">${labels.alarmStatus}:</span>
              <span class="panel-value success">${sd.alarmStatus}</span>
            </div>
          </div>
        </div>

        <div class="terminal-footer">
          <div id="footer-brand-text">${this.brand.brand} DASHBOARD - LOCAL AUTH + FIREBASE DATABASE</div>
          <div class="news-ticker" id="news-ticker" style="display:none;">
            <div class="news-track" id="news-track"></div>
          </div>
        </div>
      </div>
    `;
    setTimeout(() => this.updateNewsTicker(), 0);
  }

  startNewsListener() {
    const newsRef = ref(database, 'newsTicker');
    onValue(newsRef, (snapshot) => {
      if (snapshot.exists()) {
        const obj = snapshot.val();
        this.newsItems = Object.values(obj).map(n => (typeof n.text === 'string' ? n.text : '')).filter(Boolean);
      } else {
        this.newsItems = [];
      }
      this.updateNewsTicker();
    });
  }

  updateNewsTicker() {
    const ticker = document.getElementById('news-ticker');
    const track = document.getElementById('news-track');
    const brandTextEl = document.getElementById('footer-brand-text');
    if (!ticker || !track) return;
    if (!this.newsItems.length) {
      ticker.style.display = 'none';
      if (brandTextEl) brandTextEl.style.display = 'block';
      return;
    }
    if (brandTextEl) brandTextEl.style.display = 'none';
    ticker.style.display = 'block';
    const text = this.newsItems[Math.floor(Math.random() * this.newsItems.length)];
    track.textContent = text;
    // Restart animation
    track.style.animation = 'none';
    void track.offsetWidth;
    track.style.animation = '';
    track.classList.remove('animate');
    void track.offsetWidth;
    track.classList.add('animate');
  }

  attachEventListeners() {
    // Theme/Brand selector pairs
    const themeSelect = document.getElementById('theme-select');
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
        this.brand = getBrandProfile(brandKey);
        this.brandKey = brandKey;
      }
      localStorage.setItem('sotc-theme-key', theme);
      localStorage.setItem('sotc-brand-key', this.brandKey);
      this.render();
      this.attachEventListeners();
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
