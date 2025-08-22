// Local authentication system integrated with Firebase Realtime Database
import { ref, set, get } from 'firebase/database';
import { database } from './firebase.js';

export class AuthManager {
  constructor() {
    this.currentUser = null;
    this.users = JSON.parse(localStorage.getItem('sotc-users') || '{}');
    this.currentSession = JSON.parse(localStorage.getItem('sotc-current-session') || 'null');
    // Restore session if exists
    if (this.currentSession) {
      this.currentUser = this.currentSession;
      // Não faz redirecionamento automático!
    }
  }

  async register(username, password, displayName) {
    try {
      // Check if username already exists in Realtime Database
      const userRef = ref(database, `users/${username}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        return { success: false, error: 'Nome de usuário já existe' };
      }
      // Validate inputs
      if (!username || !password) {
        return { success: false, error: 'Username e senha são obrigatórios' };
      }
      if (username.length < 3) {
        return { success: false, error: 'Username deve ter pelo menos 3 caracteres' };
      }
      if (password.length < 6) {
        return { success: false, error: 'Senha deve ter pelo menos 6 caracteres' };
      }
      // Create user
      const user = {
        uid: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        username: username,
        displayName: displayName,
        role: 'player',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        password: password // In production, this should be hashed
      };
      // Save user in Realtime Database
      await set(userRef, user);
      // Save user locally
      this.users[username] = { ...user };
      localStorage.setItem('sotc-users', JSON.stringify(this.users));
      return { success: true, user };
    } catch (error) {
      return { success: false, error: 'Erro ao criar conta: ' + error.message };
    }
  }

  async login(username, password) {
    try {
      // Try local first
      // Sempre busca do banco para garantir papel atualizado
      const userRef = ref(database, `users/${username}`);
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        return { success: false, error: 'Usuário não encontrado' };
      }
      let user = snapshot.val();
      // Sync to localStorage
      this.users[username] = user;
      localStorage.setItem('sotc-users', JSON.stringify(this.users));
      // Check for empty fields
      if (!username || !password) {
        return { success: false, error: 'Username e senha são obrigatórios' };
      }
      // Check password
      if (!user.password || user.password !== password) {
        return { success: false, error: 'Senha incorreta' };
      }
      // Update last login in Realtime Database
      user.lastLogin = new Date().toISOString();
      await set(userRef, user);
      // Update local
      this.users[username] = user;
      localStorage.setItem('sotc-users', JSON.stringify(this.users));
      // Create session
      this.currentUser = {
        uid: user.uid,
        username: user.username,
        displayName: user.displayName,
        role: user.role
      };
      localStorage.setItem('sotc-current-session', JSON.stringify(this.currentUser));
      return { success: true, user: this.currentUser };
    } catch (error) {
      return { success: false, error: 'Erro ao fazer login: ' + error.message };
    }
  }

  checkUserRole(uid) {
    // Find user by uid
    const username = Object.keys(this.users).find(key => this.users[key].uid === uid);
    if (!username) return 'player';
    const role = this.users[username].role || 'player';
    // Redirect based on role
    if (role === 'gm') {
      this.redirectToGMScreen();
    } else {
      this.redirectToCharacterSheet();
    }
    return role;
  }

  async signOut() {
    try {
      this.currentUser = null;
      localStorage.removeItem('sotc-current-session');
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao fazer logout' };
    }
  }

  // Method to promote user to GM (for manual promotion)
  promoteToGM(username) {
    if (this.users[username]) {
      this.users[username].role = 'gm';
      localStorage.setItem('sotc-users', JSON.stringify(this.users));
      // Opcional: atualizar no banco
      const userRef = ref(database, `users/${username}`);
      set(userRef, this.users[username]);
      return true;
    }
    return false;
  }

  // Get current user ID for database operations
  getCurrentUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  }

  redirectToGMScreen() {
    // Clear the current page first
    document.body.innerHTML = '<div id="loading" style="display: flex; justify-content: center; align-items: center; height: 100vh; color: var(--text-primary);">Loading GM Screen...</div>';
    // Import and initialize GM screen
    import('./gmScreen.js').then(module => {
      const GMScreen = module.GMScreen;
      new GMScreen();
    });
  }

  redirectToCharacterSheet() {
    // Clear the current page first
    document.body.innerHTML = '<div id="loading" style="display: flex; justify-content: center; align-items: center; height: 100vh; color: var(--text-primary);">Loading Character Sheet...</div>';
    // Import and initialize character sheet
    import('./characterSheet.js').then(module => {
      const CharacterSheet = module.CharacterSheet;
      new CharacterSheet(this.currentUser.uid);
    });
  }

  getErrorMessage(errorCode) {
    // Simple error messages for local auth
    return errorCode || 'Erro desconhecido';
  }
}
