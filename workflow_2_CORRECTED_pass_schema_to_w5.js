// ⚠️ CORRECTION CRITIQUE WORKFLOW 2 - Node "Code: Aggregate Results"
// Ce code doit remplacer le node existant pour passer le schema au W5

// Aggregate all generated components
const allItems = $input.all();

const generatedComponents = allItems.map(item => ({
  component_id: item.json.component_id,
  component_code: item.json.component_code,
  validation_result: item.json.validation_result,
  generated_at: item.json.generated_at
}));

// Get original data from first item
const firstItem = $input.first().json;

// 🚨 CORRECTION: Récupérer le schema depuis les données d'entrée
// Le schema vient du W1 et doit être transmis au W5
const inputData = $('Split In Batches').first().json;

return {
  success: true,
  conversation_id: firstItem.conversation_id || `conv_${Date.now()}`,
  business_domain: firstItem.business_domain,
  workflow: 'workflow_2_orchestrateur',

  // 🚨 AJOUT CRITIQUE: Passer le schema au W5
  schema: inputData.schema || firstItem.schema,
  use_cases: inputData.use_cases || firstItem.use_cases,

  generated_components: generatedComponents,

  summary: {
    total_components_generated: generatedComponents.length,
    all_validated: generatedComponents.every(c => c.validation_result?.is_valid),
    generation_completed_at: new Date().toISOString()
  },

  next_steps: {
    workflow: 'workflow_5_assemblage_final',
    action: 'Créer les tables Grist et insérer les composants'
  }
};
