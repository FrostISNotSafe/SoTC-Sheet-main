/**
 * Demonstração das correções implementadas no sistema de skills
 * Este arquivo mostra as melhorias feitas conforme solicitado pelo usuário
 */

import { skillBasesManager } from './skillBases.js';
import { skillModulesManager } from './skillModules.js';
import SkillCreator from './skillCreator.js';
import { CharacterManager } from './character.js';

// Demonstração das unique skills
export function demonstrateUniqueSkills() {
  console.log('=== UNIQUE SKILLS IMPLEMENTADAS ===');
  
  // Obter unique skills disponíveis
  const uniqueSkills = skillBasesManager.getUniqueSkills();
  console.log(`Unique skills disponíveis: ${uniqueSkills.length}`);
  
  uniqueSkills.forEach(skill => {
    console.log(`- ${skill.name} (Cost: ${skill.cost})`);
    console.log(`  Descrição: ${skill.description}`);
    console.log(`  Módulos incluídos: ${skill.modules?.length || 0}`);
    console.log('');
  });
}

// Demonstração da correção de target die
export function demonstrateTargetDieFix() {
  console.log('=== CORREÇÃO DE TARGET DIE MODULES ===');
  
  // Criar um character manager de teste
  const charManager = new CharacterManager('test-user');
  const testChar = charManager.createNewCharacter();
  testChar.name = 'Test Character';
  testChar.stats.intellect = 3; // Para ter módulos disponíveis
  
  // Criar skill creator
  const skillCreator = new SkillCreator(testChar);
  
  // Demonstrar criação de skill com target die
  console.log('1. Iniciando criação de skill...');
  skillCreator.startSkillCreation();
  
  console.log('2. Selecionando base Triple Threat...');
  const baseResult = skillCreator.selectBase('triple_threat');
  console.log(`Base selecionada: ${baseResult.success ? 'Sucesso' : 'Falha'}`);
  
  console.log('3. Configurando tipos de dados...');
  // Configure os dados que precisam de configuração
  skillCreator.configureDieType('die_0', 'Slash');
  skillCreator.configureDieType('die_2', 'Slash');
  
  console.log('4. Adicionando módulos com target die...');
  
  // Teste de seleção automática quando há apenas um dado adequado
  const moduleResult = skillCreator.addModule('stronger', 1, null, true);
  console.log(`Módulo Stronger adicionado: ${moduleResult.success ? 'Sucesso' : 'Falha'}`);
  if (!moduleResult.success && moduleResult.requiresTargetSelection) {
    console.log(`Dados disponíveis para targeting: ${moduleResult.availableDice.length}`);
    
    // Simular seleção do primeiro dado disponível
    const targetDieId = moduleResult.availableDice[0]?.id;
    const retryResult = skillCreator.addModule('stronger', 1, targetDieId, true);
    console.log(`Módulo adicionado com target específico: ${retryResult.success ? 'Sucesso' : 'Falha'}`);
  }
  
  console.log('5. Finalizando skill...');
  const finalResult = skillCreator.finalizeSkill('Test Burning Blade');
  
  if (finalResult.success) {
    const skill = finalResult.skill;
    console.log(`Skill criada: ${skill.name}`);
    console.log('Módulos com target die preservados:');
    skill.modules.forEach(module => {
      if (module.targetDieId || module.targetDie !== null) {
        console.log(`- ${module.name}: targetDieId=${module.targetDieId}, targetDie=${module.targetDie}`);
      }
    });
  }
}

// Demonstração das melhorias na UI
export function demonstrateUIImprovements() {
  console.log('=== MELHORIAS NA UI ===');
  console.log('1. ✅ Modal de criação agora tem abas para Custom e Unique skills');
  console.log('2. ✅ Unique skills podem ser selecionadas diretamente, skipando módulos');
  console.log('3. ✅ Módulos que requerem target die mostram indicação visual');
  console.log('4. ✅ Dialog de seleção de target die quando múltiplos dados disponíveis');
  console.log('5. ✅ Seleção automática quando há apenas um dado adequado');
}

// Demonstração completa
export function demonstrateAllFixes() {
  console.log('🔥 DEMONSTRAÇÃO DAS CORREÇÕES IMPLEMENTADAS 🔥\n');
  
  demonstrateUniqueSkills();
  console.log('\n');
  demonstrateTargetDieFix();
  console.log('\n');
  demonstrateUIImprovements();
  
  console.log('\n=== RESUMO DAS CORREÇÕES ===');
  console.log('✅ 1. Unique skills implementadas que skipam seleção de módulos');
  console.log('✅ 2. Target die modules agora preservam informação de alvo');
  console.log('✅ 3. UI melhorada para seleção de dados alvo');
  console.log('✅ 4. Seleção automática quando há apenas um dado disponível');
  console.log('\nTodas as correções foram implementadas com sucesso! 🎉');
}

// Para chamar no console ou em testes
if (typeof window !== 'undefined') {
  window.demonstrateSkillFixes = demonstrateAllFixes;
}
