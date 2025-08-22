// Admin utilities for SOTC system (agora usando Firebase Realtime Database)
import { ref, get, set, remove } from 'firebase/database';
import { database } from './firebase.js';

class AdminUtils {
  constructor() {}

  // List all users from Firebase
  async listUsers() {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    console.group('%c👥 REGISTERED USERS (Firebase)', 'color: #FFD700; font-weight: bold;');
    if (!snapshot.exists()) {
      console.log('%cNo users registered yet', 'color: #888;');
    } else {
      const users = snapshot.val();
      Object.keys(users).forEach(username => {
        const user = users[username];
        console.log(`%c${username}`, 'color: #4ECDC4; font-weight: bold;');
        console.log(`  Role: %c${user.role}`, user.role === 'gm' ? 'color: #FF6B6B; font-weight: bold;' : 'color: #888;');
        console.log(`  UID: ${user.uid}`);
        console.log(`  Created: ${new Date(user.createdAt).toLocaleDateString()}`);
        console.log(`  Last Login: ${new Date(user.lastLogin).toLocaleDateString()}`);
        console.log('');
      });
    }
    console.groupEnd();
  }

  // Promote user to GM in Firebase
  async promoteToGM(username) {
    const userRef = ref(database, `users/${username}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      console.error(`%cUser "${username}" not found`, 'color: #FF6B6B;');
      return false;
    }
    const user = snapshot.val();
    user.role = 'gm';
    await set(userRef, user);
    console.log(`%c✅ User "${username}" promoted to Game Master`, 'color: #4ECDC4; font-weight: bold;');
    return true;
  }

  // Demote GM to player in Firebase
  async demoteToPlayer(username) {
    const userRef = ref(database, `users/${username}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      console.error(`%cUser "${username}" not found`, 'color: #FF6B6B;');
      return false;
    }
    const user = snapshot.val();
    user.role = 'player';
    await set(userRef, user);
    console.log(`%c✅ User "${username}" demoted to Player`, 'color: #4ECDC4; font-weight: bold;');
    return true;
  }

  // Delete user in Firebase
  async deleteUser(username) {
    const userRef = ref(database, `users/${username}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      console.error(`%cUser "${username}" not found`, 'color: #FF6B6B;');
      return false;
    }
    if (confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
      await remove(userRef);
      console.log(`%c✅ User "${username}" deleted`, 'color: #4ECDC4; font-weight: bold;');
      return true;
    }
    return false;
  }

  // Clear all users in Firebase (nuclear option)
  async clearAllData() {
    if (confirm('⚠️ This will delete ALL users and characters in the database. Are you sure?')) {
      if (confirm('🚨 FINAL WARNING: This action cannot be undone!')) {
        const usersRef = ref(database, 'users');
        await set(usersRef, null);
        // Opcional: limpar outros dados, como personagens
        console.log('%c💥 All users in Firebase cleared', 'color: #FF6B6B; font-weight: bold;');
        return true;
      }
    }
    return false;
  }

  // Open GM Screen directly (for demo)
  openGMScreen() {
    import('./gmScreen.js').then(module => {
      const GMScreen = module.GMScreen;
      new GMScreen();
      console.log('%c🎮 GM Screen opened!', 'color: #4ECDC4; font-weight: bold;');
    });
  }

  // Show help
  help() {
    console.group('%c🛠️ ADMIN COMMANDS', 'color: #FFD700; font-weight: bold;');
    console.log('%cawait admin.listUsers()', 'color: #4ECDC4;', '- List all registered users (Firebase)');
    console.log('%cawait admin.promoteToGM("username")', 'color: #4ECDC4;', '- Promote user to GM');
    console.log('%cawait admin.demoteToPlayer("username")', 'color: #4ECDC4;', '- Demote GM to player');
    console.log('%cawait admin.deleteUser("username")', 'color: #4ECDC4;', '- Delete a user (careful!)');
    console.log('%cawait admin.clearAllData()', 'color: #4ECDC4;', '- Clear all users (nuclear option)');
    console.log('%cadmin.openGMScreen()', 'color: #4ECDC4;', '- Open GM Screen directly (demo)');
    console.log('%cadmin.help()', 'color: #4ECDC4;', '- Show this help message');
    console.groupEnd();
  }
}

// Make admin utils available globally
const admin = new AdminUtils();
if (typeof window !== 'undefined') {
  window.admin = admin;
  console.log('%c🔧 ADMIN UTILS LOADED (Firebase)', 'color: #FFD700; font-weight: bold;');
  console.log('%cType "admin.help()" for available commands', 'color: #4ECDC4;');
}

export default admin;
