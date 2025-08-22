// Script to create test characters for GM Screen demonstration
import { CharacterManager } from './character.js';

export async function createTestCharacters() {
  const testUsers = [
    'testplayer1',
    'testplayer2', 
    'testplayer3'
  ];

  const testCharacters = [
    {
      name: 'Vi Sang',
      archetype: 'Fixer',
      level: 3,
      imageUrl: 'https://cdn.builder.io/api/v1/image/assets%2Ffa89c288a4ce4cfa8f8fa2d51ef8786f%2F87b9cf40a9664303a609af4e6901162b?format=webp&width=800',
      stats: { might: 4, vitality: 3, agility: 3, intellect: 2, instinct: 2, persona: 1 },
      details: {
        appearance: 'A stoic individual with dark hair and piercing eyes.',
        backstory: 'A former corporation employee turned independent fixer.'
      }
    },
    {
      name: 'Faust',
      archetype: 'Librarian',
      level: 2,
      imageUrl: '',
      stats: { might: 1, vitality: 2, agility: 2, intellect: 4, instinct: 3, persona: 3 },
      details: {
        appearance: 'Blonde hair, sharp intellect, carries ancient knowledge.',
        backstory: 'A researcher seeking forbidden knowledge in the City.'
      }
    },
    {
      name: 'Don Quixote',
      archetype: 'Abnormality',
      level: 4,
      imageUrl: '',
      stats: { might: 3, vitality: 3, agility: 4, intellect: 1, instinct: 2, persona: 2 },
      details: {
        appearance: 'Enthusiastic blonde with an unwavering sense of justice.',
        backstory: 'Dreams of being a hero and fixing the City through justice.'
      }
    }
  ];

  console.log('Creating test characters...');
  
  for (let i = 0; i < testCharacters.length; i++) {
    const userId = `test-user-${i + 1}`;
    const characterManager = new CharacterManager(userId);
    const charData = characterManager.createNewCharacter();
    
    // Apply test data
    Object.assign(charData, testCharacters[i]);
    
    // Calculate derived stats
    const finalChar = characterManager.calculateDerivativeStats(charData);
    const result = await characterManager.saveCharacter(finalChar);
    
    if (result.success) {
      console.log(`✅ Created character: ${testCharacters[i].name}`);
    } else {
      console.error(`❌ Failed to create character: ${testCharacters[i].name}`, result.error);
    }
  }
  
  console.log('Test characters creation complete!');
}

// Make it available globally for console use
if (typeof window !== 'undefined') {
  window.createTestCharacters = createTestCharacters;
  console.log('%c🧪 TEST CHARACTERS LOADED', 'color: #4ECDC4; font-weight: bold;');
  console.log('%cType "createTestCharacters()" to create test characters', 'color: #4ECDC4;');
}
