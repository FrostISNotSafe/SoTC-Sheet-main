/**
 * Base E.G.O. Integration Test
 * Tests the Base E.G.O. creation system to ensure all components work together
 */

import { CharacterManager } from './character.js';
import { BaseEGOCreator } from './components/BaseEGOCreator.js';
import { baseEgoPassiveManager } from './baseEgoPassives.js';
import { skillBasesManager } from './skillBases.js';
import { skillModulesManager } from './skillModules.js';

// Test Base E.G.O. creation workflow
export function testBaseEgoCreation() {
  console.log('Testing Base E.G.O. Creation System...');

  // Test 1: Base E.G.O. Passives Manager
  console.log('\n1. Testing Base E.G.O. Passives Manager:');
  const allPassives = baseEgoPassiveManager.getAllPassives();
  console.log(`Found ${allPassives.length} Base E.G.O. passives`);
  
  // Test passive with choice
  const inflictor = baseEgoPassiveManager.getPassiveById('inflictor');
  if (inflictor) {
    console.log(`Inflictor passive: ${inflictor.name}`);
    console.log(`Requires choice: ${inflictor.requiresChoice}`);
    console.log(`Choices: ${inflictor.choices?.join(', ')}`);
    
    const resolvedDescription = baseEgoPassiveManager.resolvePassiveDescription('inflictor', 'Burn');
    console.log(`Resolved description: ${resolvedDescription}`);
  }

  // Test 2: Character Manager Base E.G.O. functionality
  console.log('\n2. Testing Character Manager:');
  const characterManager = new CharacterManager('test-user');
  const testCharacter = characterManager.createNewCharacter();
  testCharacter.level = 2; // Ensure level 2 for Base E.G.O.
  
  console.log(`Created test character at level ${testCharacter.level}`);
  console.log(`Base E.G.O. created: ${testCharacter.progression?.baseEgoCreated || false}`);

  // Test 3: Skill Bases for E.G.O.
  console.log('\n3. Testing E.G.O. Skill Bases:');
  const egoBases = skillBasesManager.getEgoBases();
  console.log(`Found ${egoBases.length} suitable bases for E.G.O. (cost >= 2)`);
  egoBases.slice(0, 3).forEach(base => {
    console.log(`- ${base.name}: Cost ${base.cost}, ${base.dice.length} dice`);
  });

  // Test 4: Skill Modules for E.G.O.
  console.log('\n4. Testing E.G.O. Skill Modules:');
  const rank1Modules = skillModulesManager.getModulesByRank(1);
  const rank2Modules = skillModulesManager.getModulesByRank(2);
  const rank3Modules = skillModulesManager.getModulesByRank(3);
  
  // Filter out [Limit] modules
  const eligibleRank1 = rank1Modules.filter(m => !m.tags || !m.tags.includes('[Limit]'));
  const eligibleRank2 = rank2Modules.filter(m => !m.tags || !m.tags.includes('[Limit]'));
  const eligibleRank3 = rank3Modules.filter(m => !m.tags || !m.tags.includes('[Limit]'));
  
  console.log(`Eligible modules: R1: ${eligibleRank1.length}, R2: ${eligibleRank2.length}, R3: ${eligibleRank3.length}`);

  // Test 5: Base E.G.O. Creation
  console.log('\n5. Testing Base E.G.O. Creation:');
  const sampleEgoData = {
    name: 'Test Base E.G.O.',
    baseId: egoBases[0]?.id,
    baseName: egoBases[0]?.name,
    baseCost: egoBases[0]?.cost,
    dice: egoBases[0]?.dice || [],
    modules: {
      rank1: eligibleRank1.slice(0, 3).map(m => ({ id: m.id, name: m.name, effect: m.effect, rank: 1 })),
      rank2: eligibleRank2.slice(0, 1).map(m => ({ id: m.id, name: m.name, effect: m.effect, rank: 2 })),
      rank3: eligibleRank3.slice(0, 1).map(m => ({ id: m.id, name: m.name, effect: m.effect, rank: 3 }))
    },
    powerBenefit: 'dice_power',
    passiveId: 'confrontational',
    passiveChoice: '',
    passive: baseEgoPassiveManager.formatPassiveForDisplay('confrontational'),
    description: 'Test Base E.G.O. for validation'
  };

  const validation = characterManager.validateBaseEgoData(sampleEgoData);
  console.log(`Base E.G.O. validation: ${validation.valid ? 'PASSED' : 'FAILED'}`);
  if (!validation.valid) {
    console.log(`Validation error: ${validation.error}`);
  }

  if (validation.valid) {
    const createResult = characterManager.createBaseEgo(testCharacter, sampleEgoData);
    console.log(`Base E.G.O. creation: ${createResult.success ? 'SUCCESS' : 'FAILED'}`);
    if (createResult.success) {
      console.log(`Created Base E.G.O.: ${testCharacter.ego.base.name}`);
      console.log(`E.G.O. Rating: ${testCharacter.ego.base.rating}`);
      console.log(`E.G.O. Cost: ${testCharacter.ego.base.emotionCost} EP`);
      console.log(`E.G.O. Passive: ${testCharacter.ego.base.passive?.name}`);
    }
  }

  console.log('\nBase E.G.O. Integration Test Complete!');
  return {
    passivesCount: allPassives.length,
    egoBasesCount: egoBases.length,
    validationPassed: validation.valid,
    testCharacter: testCharacter
  };
}

// Test the power benefit calculations
export function testPowerBenefitCalculations() {
  console.log('\nTesting Power Benefit Calculations:');
  
  const testCases = [
    { diceCount: 1, expected: '+3 Power to single die' },
    { diceCount: 2, expected: '+2 Power to each die' },
    { diceCount: 3, expected: '+1 Power to each die' },
    { diceCount: 4, expected: '+1 Power to each die' }
  ];

  testCases.forEach(testCase => {
    const ego = { dice: new Array(testCase.diceCount).fill({ tag: '[Test]', notation: '1d6' }) };
    const description = getEgoPowerBenefitDescription(ego);
    const passed = description === testCase.expected;
    console.log(`${testCase.diceCount} dice: ${description} - ${passed ? 'PASS' : 'FAIL'}`);
  });
}

// Helper function to test power benefit (mirrors the one in CharacterSheet)
function getEgoPowerBenefitDescription(ego) {
  if (!ego.dice) return 'No dice information';
  
  const diceCount = ego.dice.length;
  if (diceCount === 1) return '+3 Power to single die';
  if (diceCount === 2) return '+2 Power to each die';
  if (diceCount >= 3) return '+1 Power to each die';
  return 'No dice power bonus';
}

// Test passive choice validation
export function testPassiveChoiceValidation() {
  console.log('\nTesting Passive Choice Validation:');
  
  const testCases = [
    { passiveId: 'inflictor', choice: 'Burn', shouldPass: true },
    { passiveId: 'inflictor', choice: 'Invalid', shouldPass: false },
    { passiveId: 'confrontational', choice: null, shouldPass: true }, // No choice needed
    { passiveId: 'retaliate', choice: 'Tremor', shouldPass: true },
    { passiveId: 'invincible', choice: 'Slash', shouldPass: true }
  ];

  testCases.forEach(testCase => {
    const validation = baseEgoPassiveManager.validateChoice(testCase.passiveId, testCase.choice);
    const passed = validation.valid === testCase.shouldPass;
    console.log(`${testCase.passiveId} with choice '${testCase.choice}': ${validation.valid ? 'VALID' : 'INVALID'} - ${passed ? 'PASS' : 'FAIL'}`);
    if (!validation.valid && validation.error) {
      console.log(`  Error: ${validation.error}`);
    }
  });
}

// Run all tests
export function runAllBaseEgoTests() {
  console.log('='.repeat(50));
  console.log('BASE E.G.O. SYSTEM INTEGRATION TESTS');
  console.log('='.repeat(50));
  
  const mainTestResult = testBaseEgoCreation();
  testPowerBenefitCalculations();
  testPassiveChoiceValidation();
  
  console.log('='.repeat(50));
  console.log('TESTS COMPLETED');
  console.log('='.repeat(50));
  
  return mainTestResult;
}

// Auto-run tests if this module is loaded directly
if (typeof window !== 'undefined') {
  window.testBaseEgo = runAllBaseEgoTests;
  console.log('Base E.G.O. tests loaded. Run window.testBaseEgo() to execute tests.');
}
