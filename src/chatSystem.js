import { ref, push, onValue, serverTimestamp, off, remove, onDisconnect, set } from 'firebase/database';
import { database } from './firebase.js';
import { rollDiceV1 } from './diceParser.js';

export class ChatSystem {
  constructor(userId, userName, userRole) {
    this.userId = userId;
    this.userName = userName;
    this.userRole = userRole;
    this.chatRef = ref(database, 'gameChat');
    this.onlineRef = ref(database, `onlineUsers/${this.userId}`);
    this.messagesListener = null;
    this.messages = [];
  }

  async goOnline() {
    try {
      // Seta o status online e agende remoção ao desconectar
      await set(this.onlineRef, {
        userName: this.userName,
        userRole: this.userRole,
        lastActive: Date.now()
      });
      onDisconnect(this.onlineRef).remove();

      // Atualiza o lastActive a cada 30 segundos para manter presença
      this.presenceInterval = setInterval(() => {
        set(this.onlineRef, {
          userName: this.userName,
          userRole: this.userRole,
          lastActive: Date.now()
        });
      }, 30000);

      return true;
    } catch (err) {
      console.error('Failed to set online presence', err);
      return false;
    }
  }

  async goOffline() {
    clearInterval(this.presenceInterval);
    try {
      await remove(this.onlineRef);
    } catch (err) {
      console.error('Failed to remove online presence', err);
    }
  }

  startListeningOnlineUsers(callback) {
    this.onlineUsersListener = onValue(ref(database, 'onlineUsers'), snapshot => {
      if (snapshot.exists()) {
        const users = snapshot.val();
        callback(users);
      } else {
        callback({});
      }
    });
  }
  stopListeningOnlineUsers() {
      if (this.onlineUsersListener) {
        off(ref(database, 'onlineUsers'), 'value', this.onlineUsersListener);
        this.onlineUsersListener = null;
      }
    }




  async clearChat() {
  if (this.userRole !== 'gm') {
    return { success: false, error: 'Only GMs can clear chat.' };
  }

  try {
    await remove(this.chatRef);
    return { success: true, result: 'Chat cleared by GM.' };
  } catch (error) {
    console.error('Error clearing chat:', error);
    return { success: false, error: error.message };
  }
}

  // Send a message to the shared chat
  async sendMessage(text, messageType = 'message') {
    if (!text.trim()) return;

    // Check if it's a command
    if (text.startsWith('/')) {
      return await this.executeCommand(text);
    }

    const message = {
      id: Date.now().toString(),
      userId: this.userId,
      userName: this.userName,
      userRole: this.userRole,
      text: text.trim(),
      type: messageType, // 'message', 'system', 'roll', 'action', 'command'
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    };

    try {
      await push(this.chatRef, message);
      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  // Listen for new messages
  startListening(callback) {
    this.messagesListener = onValue(this.chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const messagesObj = snapshot.val();
        this.messages = Object.keys(messagesObj)
          .map(key => ({ ...messagesObj[key], firebaseKey: key }))
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .slice(-50); // Keep only last 50 messages
      } else {
        this.messages = [];
      }
      callback(this.messages);
    });
  }

  // Stop listening for messages
  stopListening() {
    if (this.messagesListener) {
      off(this.chatRef, 'value', this.messagesListener);
      this.messagesListener = null;
    }
  }

  // Send a dice roll message
  async sendDiceRoll(dice, result, description = '') {
    const text = `🎲 ${description} Rolled ${dice}: **${result}**`;
    return await this.sendMessage(text, 'roll');
  }

  // Send a system message (only GMs can do this)
  async sendSystemMessage(text) {
    if (this.userRole !== 'gm') return { success: false, error: 'Only GMs can send system messages' };
    return await this.sendMessage(text, 'system');
  }

  // Format message for display (terminal style)
  formatMessage(message) {
    const time = new Date(message.createdAt).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const rolePrefix = message.userRole === 'gm' ? 'GM' : 'PLR';
    let messageClass = 'terminal-message';
    let prompt = `[${time}] ${rolePrefix}@SOTC:~$`;

    if (message.type === 'system') {
      messageClass += ' system-message';
      prompt = `[${time}] SYSTEM:~#`;
    } else if (message.type === 'roll') {
      messageClass += ' roll-message';
      prompt = `[${time}] DICE:~$`;
    } else if (message.type === 'command') {
      messageClass += ' command-message';
      prompt = `[${time}] CMD:~$`;
    }

    return {
      html: `
        <div class="${messageClass}" data-message-id="${message.id}">
          <span class="terminal-line">${prompt} ${this.parseMessageContent(message.text)}</span>
        </div>
      `,
      message
    };
  }

  // Parse message content for special formatting
  parseMessageContent(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/`(.*?)`/g, '<code>$1</code>') // Code
      .replace(/🎲/g, '<span class="dice-icon">🎲</span>') // Dice icon
      .replace(/\n/g, '<br>'); // Quebra de linha
  }

  // Generate random dice roll
  rollDice(sides = 6) {
    return Math.floor(Math.random() * sides) + 1;
  }

  // Roll multiple dice
  rollMultipleDice(count, sides) {
    const results = [];
    let total = 0;
    for (let i = 0; i < count; i++) {
      const roll = this.rollDice(sides);
      results.push(roll);
      total += roll;
    }
    return { results, total };
  }

  // Execute slash commands
  async executeCommand(commandText) {
    const parts = commandText.slice(1).split(' '); // Remove the '/' and split
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    let result = '';
    let messageType = 'command';

    try {
      switch (command) {
        case 'help':
          result = this.getHelpText();
          break;

        case 'roll':
        case 'r':
          result = this.handleRollCommand(args);
          messageType = 'roll';
          break;

        case 'clear':
          if (this.userRole === 'gm') {
            const clearResult = await this.clearChat();
            result = clearResult.success ? clearResult.result : `ERROR: ${clearResult.error}`;
          } else {
            result = 'ERROR: Permission denied. Only GM can clear chat.';
          }
          break;


        case 'time':
          result = `Current time: ${new Date().toLocaleString('pt-BR')}`;
          break;

        case 'who':
          result = `You are: ${this.userName} (${this.userRole.toUpperCase()})`;
          break;

        case 'dice':
        case 'd':
          result = this.handleQuickDice(args);
          messageType = 'roll';
          break;

        case 'whisper':
        case 'w':
          result = 'WHISPER: Feature not implemented yet';
          break;

        case 'status':
          result = `ONLINE | User: ${this.userName}`;
          break;

        case 'news':
          if (this.userRole !== 'gm') {
            result = 'ERROR: Permission denied. Only GM can manage news.';
            break;
          }
          result = await this.handleNewsCommand(args);
          messageType = 'system';
          break;

        default:
          result = `ERROR: Unknown command '${command}'. Type /help for available commands.`;
          break;
      }

      // Send the command result
      const message = {
        id: Date.now().toString(),
        userId: this.userId,
        userName: this.userName,
        userRole: this.userRole,
        text: `/${command} ${args.join(' ')} → ${result}`,
        type: messageType,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      };

      await push(this.chatRef, message);
      return { success: true, result };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleNewsCommand(args) {
    if (args.length === 0) return 'Usage: /news add <text> | /news clear | /news list';
    const sub = args[0].toLowerCase();
    const newsRef = ref(database, 'newsTicker');
    if (sub === 'add') {
      const text = args.slice(1).join(' ').trim();
      if (!text) return 'Usage: /news add <text>';
      await push(newsRef, { text, createdAt: new Date().toISOString() });
      return 'News added.';
    }
    if (sub === 'clear') {
      await remove(newsRef);
      return 'All news cleared.';
    }
    if (sub === 'list') {
      return 'Listing not supported in chat output.';
    }
    return `Unknown subcommand '${sub}'.`;
  }

  getHelpText() {
    const commonCommands = [
      '/help - Show this help',
      '/roll [dice] - Roll dice (e.g., /roll 2d6, /roll d20)',
      '/d6, /d20 - Quick dice rolls',
      '/time - Show current time',
      '/who - Show your user info',
      '/status - Show connection status'
    ];

    const gmCommands = this.userRole === 'gm' ? [
      '/clear - Clear chat (GM only)',
      '/news add <text> - Add a login news item',
      '/news clear - Clear all login news',
      '/whisper [user] [msg] - Private message (GM only)'
    ] : [];

    return [...commonCommands, ...gmCommands].join('\n');
  }

  handleRollCommand(args) {
    if (args.length === 0) {
      return 'Usage: /roll [dice] (e.g., /roll 2d6, /roll d20, /roll 4d6!+2, /roll 10d6>>4, etc)';
    }
    const diceExpr = args.join('');
    const result = rollDiceV1(diceExpr);
    if (Array.isArray(result)) {
      // Bulk roll (X#A)
      return result.map((r, i) => `Roll ${i+1}: [${r.rolls.join(', ')}] = ${r.total}`).join('<br>');
    }
    if (result.error) {
      return `ERROR: ${result.error} (${result.expr})`;
    }
    return `🎲 ${diceExpr}: [${result.rolls.join(', ')}] = ${result.total}`;
  }

  handleQuickDice(args) {
    const sides = args[0] ? parseInt(args[0]) : 6;
    if (isNaN(sides) || sides < 2 || sides > 100) {
      return 'Invalid dice sides. Use 2-100.';
    }

    const result = this.rollDice(sides);
    return `🎲 d${sides}: ${result}`;
  }
}
