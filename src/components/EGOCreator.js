import React, { useState, useEffect } from 'react';
import { skillCreator } from '../skillCreator';
import { egoPassiveManager } from '../egoPassives';

const EGOCreator = ({ character, onSave, onCancel }) => {
  const [state, setState] = useState({
    currentStep: 'selectBase',
    currentSkill: null,
    availableBases: [],
    availableEgoPassives: [],
    selectedPassive: null,
    passiveChoice: null,
    error: null
  });

  // Initialize EGO creation
  useEffect(() => {
    const skill = skillCreator.startSkillCreation(true); // true for EGO
    const newState = skillCreator.getCurrentState();
    setState(prev => ({
      ...prev,
      currentSkill: skill,
      availableBases: newState.availableBases,
      availableEgoPassives: newState.availableEgoPassives
    }));
  }, []);

  // Handle base selection
  const handleSelectBase = (baseId) => {
    const result = skillCreator.selectBase(baseId);
    if (result.success) {
      const newState = skillCreator.getCurrentState();
      setState(prev => ({
        ...prev,
        currentSkill: newState.currentSkill,
        currentStep: newState.currentStep
      }));
    } else {
      setState(prev => ({ ...prev, error: result.error }));
    }
  };

  // Handle module selection
  const handleAddModule = (moduleId, rank, dieId) => {
    skillCreator.addModule(moduleId, rank, dieId);
    const newState = skillCreator.getCurrentState();
    setState(prev => ({
      ...prev,
      currentSkill: newState.currentSkill,
      error: null
    }));
  };

  // Handle passive selection
  const handleSelectPassive = (passiveId) => {
    const passive = egoPassiveManager.getPassiveById(passiveId);
    setState(prev => ({
      ...prev,
      selectedPassive: passive,
      passiveChoice: passive.requiresChoice ? '' : null
    }));
  };

  // Handle passive choice (for passives that require additional input)
  const handlePassiveChoice = (choice) => {
    setState(prev => ({
      ...prev,
      passiveChoice: choice
    }));
  };

  // Confirm passive selection
  const confirmPassive = () => {
    if (state.selectedPassive) {
      skillCreator.egoPassiveChoice = state.selectedPassive.id;
      skillCreator.egoPassiveChoiceValue = state.passiveChoice;
      
      const result = skillCreator.finalizeSkill();
      if (result.success) {
        onSave(result.skill);
      } else {
        setState(prev => ({ ...prev, error: result.error }));
      }
    }
  };

  // Render base selection step
  const renderBaseSelection = () => (
    <div className="base-selection">
      <h3>Select a Base for your E.G.O. (Cost 2 or higher)</h3>
      <div className="base-grid">
        {state.availableBases.map(base => (
          <div 
            key={base.id} 
            className="base-card"
            onClick={() => handleSelectBase(base.id)}
          >
            <h4>{base.name}</h4>
            <p>Cost: {base.cost}</p>
            <p>{base.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // Render module selection step
  const renderModuleSelection = () => {
    const availableRank1 = skillCreator.getAvailableModules(1);
    const availableRank2 = skillCreator.getAvailableModules(2);
    const availableRank3 = skillCreator.getAvailableModules(3);

    return (
      <div className="module-selection">
        <h3>Select Modules for your E.G.O.</h3>
        <p>Required: 3x Rank 1, 1x Rank 2, 1x Rank 3</p>
        
        <div className="rank-section">
          <h4>Rank 1 Modules (Select 3)</h4>
          <div className="module-grid">
            {availableRank1.map(module => (
              <div 
                key={module.id} 
                className="module-card"
                onClick={() => handleAddModule(module.id, 1, null)}
              >
                <h5>{module.name}</h5>
                <p>{module.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rank-section">
          <h4>Rank 2 Modules (Select 1)</h4>
          <div className="module-grid">
            {availableRank2.map(module => (
              <div 
                key={module.id} 
                className="module-card"
                onClick={() => handleAddModule(module.id, 2, null)}
              >
                <h5>{module.name}</h5>
                <p>{module.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rank-section">
          <h4>Rank 3 Modules (Select 1)</h4>
          <div className="module-grid">
            {availableRank3.map(module => (
              <div 
                key={module.id} 
                className="module-card"
                onClick={() => handleAddModule(module.id, 3, null)}
              >
                <h5>{module.name}</h5>
                <p>{module.description}</p>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setState(prev => ({ ...prev, currentStep: 'selectPassive' }))}
          disabled={!skillCreator.isConfigurationComplete()}
        >
          Continue to Select Passive
        </button>
      </div>
    );
  };

  // Render passive selection step
  const renderPassiveSelection = () => (
    <div className="passive-selection">
      <h3>Select an E.G.O. Passive</h3>
      
      <div className="passive-grid">
        {state.availableEgoPassives.map(passive => (
          <div 
            key={passive.id}
            className={`passive-card ${state.selectedPassive?.id === passive.id ? 'selected' : ''}`}
            onClick={() => handleSelectPassive(passive.id)}
          >
            <h4>{passive.name}</h4>
            <p>{passive.description}</p>
          </div>
        ))}
      </div>

      {state.selectedPassive?.requiresChoice && (
        <div className="passive-choice">
          <h4>Choose {state.selectedPassive.choiceType}:</h4>
          <div className="choice-options">
            {state.selectedPassive.choices.map(choice => (
              <button 
                key={choice}
                className={state.passiveChoice === choice ? 'active' : ''}
                onClick={() => handlePassiveChoice(choice)}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="button-group">
        <button onClick={() => setState(prev => ({ ...prev, currentStep: 'addModules' }))}>
          Back to Modules
        </button>
        <button 
          onClick={confirmPassive}
          disabled={!state.selectedPassive || (state.selectedPassive.requiresChoice && !state.passiveChoice)}
        >
          Finalize E.G.O.
        </button>
      </div>
    </div>
  );

  // Render skill preview
  const renderSkillPreview = () => {
    if (!state.currentSkill) return null;
    
    return (
      <div className="skill-preview">
        <h3>E.G.O. Preview</h3>
        <h4>{state.currentSkill.name || 'Unnamed E.G.O.'}</h4>
        <p>Cost: {state.currentSkill.cost}</p>
        
        {state.currentSkill.effects && state.currentSkill.effects.length > 0 && (
          <div className="effects">
            {state.currentSkill.effects.map((effect, i) => (
              <p key={i}>{effect}</p>
            ))}
          </div>
        )}

        {state.currentSkill.dice.map((die, i) => (
          <div key={i} className="die-preview">
            <p>{die.notation} {die.effects?.map(e => e.tag).join(' ')}</p>
          </div>
        ))}

        {state.currentSkill.egoPassive && (
          <div className="ego-passive">
            <h4>E.G.O. Passive: {state.currentSkill.egoPassive.name}</h4>
            <p>{state.currentSkill.egoPassive.description}</p>
          </div>
        )}

        {state.currentSkill.egoBonus && (
          <div className="ego-bonus">
            <p><strong>E.G.O. Bonus:</strong> {state.currentSkill.egoBonus}</p>
          </div>
        )}
      </div>
    );
  };

  // Main render
  return (
    <div className="ego-creator">
      <h2>Create New E.G.O.</h2>
      
      {state.error && (
        <div className="error-message">
          {state.error}
        </div>
      )}

      <div className="creator-container">
        <div className="creator-steps">
          {state.currentStep === 'selectBase' && renderBaseSelection()}
          {state.currentStep === 'addModules' && renderModuleSelection()}
          {state.currentStep === 'selectPassive' && renderPassiveSelection()}
        </div>
        
        <div className="preview-panel">
          {renderSkillPreview()}
        </div>
      </div>

      <div className="button-group">
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default EGOCreator;
