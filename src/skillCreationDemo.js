/**
 * Demonstration of the Skill Creation System
 * Shows how to create the "Burning Blade" skill from the example
 */

import SkillCreator from './skillCreator.js';
import { skillBasesManager } from './skillBases.js';
import { skillModulesManager } from './skillModules.js';

// Example character data
const exampleCharacter = {
  level: 3,
  stats: {
    might: 3,
    vitality: 2,
    agility: 2,
    intellect: 4,
    instinct: 3,
    persona: 1
  },
  skills: [] // Empty skills array
};

// Create a skill creator instance
const skillCreator = new SkillCreator(exampleCharacter);

// Demonstration function
export function demonstrateSkillCreation() {
  console.log('=== SKILL CREATION DEMONSTRATION ===\n');
  
  // Step 1: Start skill creation
  console.log('Step 1: Starting skill creation...');
  skillCreator.startSkillCreation();
  console.log('✓ Skill creation started\n');
  
  // Step 2: Select Triple Threat base
  console.log('Step 2: Selecting Triple Threat base...');
  const selectResult = skillCreator.selectBase('triple_threat');
  if (selectResult.success) {
    console.log('✓ Triple Threat base selected');
    console.log('Base details:', {
      name: selectResult.skill.baseName,
      cost: selectResult.skill.cost,
      dice: selectResult.skill.dice.map(d => `${d.originalTag} ${d.notation}`)
    });
  } else {
    console.error('✗ Base selection failed:', selectResult.error);
    return;
  }
  console.log('');
  
  // Step 3: Configure dice types
  console.log('Step 3: Configuring dice types...');
  
  // Configure first die as Slash
  const die1Result = skillCreator.configureDieType('die_0', 'Slash');
  if (die1Result.success) {
    console.log('✓ Die 1 configured as Slash');
  } else {
    console.error('✗ Die 1 configuration failed:', die1Result.error);
  }
  
  // Configure second die as Block
  const die2Result = skillCreator.configureDieType('die_1', 'Block');
  if (die2Result.success) {
    console.log('✓ Die 2 configured as Block');
  } else {
    console.error('✗ Die 2 configuration failed:', die2Result.error);
  }
  
  // Configure third die as Slash
  const die3Result = skillCreator.configureDieType('die_2', 'Slash');
  if (die3Result.success) {
    console.log('✓ Die 3 configured as Slash');
  } else {
    console.error('✗ Die 3 configuration failed:', die3Result.error);
  }
  
  console.log('Configuration complete:', skillCreator.isConfigurationComplete());
  console.log('');
  
  // Step 4: Add innate modules
  console.log('Step 4: Adding innate modules...');
  skillCreator.addInnateModules();
  
  // Add Stronger module (Tier 1) to die 2 (Block die)
  const strongerResult = skillCreator.addModule('stronger', 1, 'die_1', false);
  if (strongerResult.success) {
    console.log('✓ Stronger module added to Block die');
  } else {
    console.error('✗ Stronger module failed:', strongerResult.error);
  }
  
  // Add Burning module (Tier 1) to die 1 (first Slash die)
  const burning1Result = skillCreator.addModule('burning', 1, 'die_0', false);
  if (burning1Result.success) {
    console.log('✓ First Burning module added to first Slash die');
  } else {
    console.error('✗ First Burning module failed:', burning1Result.error);
  }
  
  // Add another Burning module (Tier 1) to die 3 (second Slash die)
  const burning2Result = skillCreator.addModule('burning', 1, 'die_2', false);
  if (burning2Result.success) {
    console.log('✓ Second Burning module added to second Slash die');
  } else {
    console.error('✗ Second Burning module failed:', burning2Result.error);
  }
  
  // Add Curative module (Tier 2) to skill
  const curativeResult = skillCreator.addModule('curative', 2, null, false);
  if (curativeResult.success) {
    console.log('✓ Curative module added to skill');
  } else {
    console.error('✗ Curative module failed:', curativeResult.error);
  }
  
  console.log('');
  
  // Step 5: Finalize skill
  console.log('Step 5: Finalizing skill...');
  const finalResult = skillCreator.finalizeSkill('Burning Blade');
  if (finalResult.success) {
    console.log('✓ Skill finalized successfully!');
    console.log('\n=== FINAL SKILL ===');
    console.log('Name:', finalResult.skill.name);
    console.log('Cost:', finalResult.skill.cost);
    console.log('Base:', finalResult.skill.baseName);
    console.log('\nDescription:');
    console.log(finalResult.skill.description);
    console.log('\nDice Details:');
    finalResult.skill.dice.forEach((die, index) => {
      console.log(`  ${index + 1}. ${die.tag} ${die.notation}${die.effects.length > 0 ? ' ' + die.effects.join(' ') : ''}`);
    });
    console.log('\nModules:');
    finalResult.skill.modules.forEach(module => {
      console.log(`  - ${module.name} (T${module.rank}${module.isSpare ? ' - Spare' : ' - Innate'})`);
    });
  } else {
    console.error('✗ Skill finalization failed:', finalResult.error);
  }
  
  console.log('\n=== DEMONSTRATION COMPLETE ===');
  
  return finalResult.success ? finalResult.skill : null;
}

// Available skill bases
export function listSkillBases() {
  console.log('=== AVAILABLE SKILL BASES ===\n');
  const bases = skillBasesManager.getAllBases();
  const categories = skillBasesManager.getCategories();
  
  categories.forEach(category => {
    console.log(`\n${category.replace('_', ' ').toUpperCase()}:`);
    const categoryBases = bases.filter(base => base.category === category);
    categoryBases.forEach(base => {
      console.log(`  ${base.name} (Cost ${base.cost})`);
      console.log(`    Dice: ${base.dice.map(d => `${d.tag} ${d.notation}`).join(', ')}`);
      console.log(`    ${base.description}`);
      if (base.special) console.log(`    Special: ${base.special}`);
      console.log('');
    });
  });
}

// Available modules
export function listSkillModules() {
  console.log('=== AVAILABLE SKILL MODULES ===\n');
  
  [1, 2, 3].forEach(rank => {
    console.log(`\nTIER ${rank} MODULES:`);
    const modules = skillModulesManager.getModulesByRank(rank);
    modules.forEach(module => {
      console.log(`  ${module.name}${module.repeating ? ' (Repeating)' : ''}`);
      console.log(`    Target: ${module.target}, Effect: ${module.effect}`);
      if (module.tag) console.log(`    Tag: ${module.tag}`);
      console.log(`    ${module.description}`);
      console.log('');
    });
  });
}

// Example usage when this file is imported
if (typeof window !== 'undefined') {
  // Browser environment - attach to window for console access
  window.skillCreationDemo = {
    demonstrateSkillCreation,
    listSkillBases,
    listSkillModules
  };
}
