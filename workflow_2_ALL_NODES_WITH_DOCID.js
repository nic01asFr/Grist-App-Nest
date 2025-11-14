// 🔧 WORKFLOW 2 - Tous les nodes corrigés pour propager doc_id

// ════════════════════════════════════════════════════════════════
// NODE 1: Extract Input (après executeWorkflowTrigger)
// ════════════════════════════════════════════════════════════════
function extractInput() {
    const input = $input.first().json;
    const data = input.body || input;

    return {
        conversation_id: data.conversation_id,
        business_domain: data.business_domain,
        schema: data.schema,
        use_cases: data.use_cases,
        validation: data.validation,
        analysis: data.analysis,
        doc_id: data.doc_id,  // ✅ EXTRAIT du W1
        grist_base_url: data.grist_base_url  // ✅ EXTRAIT du W1
    };
}

// ════════════════════════════════════════════════════════════════
// NODE 2: Code: Prepare Components List
// ════════════════════════════════════════════════════════════════
function prepareComponentsList() {
    const schema = $json.schema;
    const useCases = $json.use_cases;
    const validation = $json.validation;
    const businessDomain = $json.business_domain;

    const componentsToGenerate = [
        {
            id: 'dashboard',
            name: 'Tableau de bord',
            priority: 1,
            type: 'dashboard',
            description: `Dashboard principal pour ${businessDomain}`
        }
    ];

    // Add CRUD component for each entity (max 5 to stay under token limit)
    const entitiesToGenerate = schema.entities.slice(0, 5);

    entitiesToGenerate.forEach((entity, i) => {
        componentsToGenerate.push({
            id: `gestion_${entity.table_name.toLowerCase()}`,
            name: `Gestion ${entity.table_name}`,
            priority: i + 2,
            type: 'crud',
            entity: entity.table_name,
            description: `Interface CRUD pour gérer les ${entity.table_name}`,
            table_schema: entity
        });
    });

    return {
        conversation_id: $json.conversation_id,
        business_domain: businessDomain,
        schema: schema,
        use_cases: useCases,
        validation: validation,
        components_to_generate: componentsToGenerate,
        doc_id: $json.doc_id,  // ✅ PROPAGER
        grist_base_url: $json.grist_base_url,  // ✅ PROPAGER
        summary: {
            total_entities: schema.total_tables,
            entities_with_components: entitiesToGenerate.length,
            total_components: componentsToGenerate.length,
            dashboard_count: 1,
            crud_count: entitiesToGenerate.length
        }
    };
}

// ════════════════════════════════════════════════════════════════
// NODE 3: Split Out (fieldToSplitOut: components_to_generate)
// ════════════════════════════════════════════════════════════════
// Configuration Split Out Node:
// - Field to split out: components_to_generate
// - Include: All other fields
// - Options: Default

// Split Out passe automatiquement TOUS les autres champs (incluant doc_id)

// ════════════════════════════════════════════════════════════════
// NODE 4: Split In Batches (loop processing)
// ════════════════════════════════════════════════════════════════
// Configuration Split In Batches Node:
// - Batch size: 1
// - Options: Default

// Split In Batches passe automatiquement TOUS les champs (incluant doc_id)

// ════════════════════════════════════════════════════════════════
// NODE 5: Code: Prepare Workflow 3 Input
// ════════════════════════════════════════════════════════════════
function prepareWorkflow3Input() {
    // Récupérer les données complètes depuis Split In Batches
    const fullData = $input.first().json;

    // Le composant actuel est déjà extrait par Split Out
    const component = fullData.components_to_generate;

    return {
        conversation_id: fullData.conversation_id,
        business_domain: fullData.business_domain,
        schema: fullData.schema,
        use_cases: fullData.use_cases,
        component_to_generate: component,  // ✅ Le composant spécifique (pas entities[0] !)
        component_index: fullData.batchIndex,
        total_components: fullData.summary?.total_components || 0,
        doc_id: fullData.doc_id,  // ✅ PROPAGER au W3
        grist_base_url: fullData.grist_base_url  // ✅ PROPAGER au W3
    };
}

// ════════════════════════════════════════════════════════════════
// NODE 6: Execute Workflow 3 (génération composant)
// ════════════════════════════════════════════════════════════════
// Configuration Execute Workflow Node:
// - Workflow: Workflow 3 (sélectionner dans la liste)
// - Wait for completion: YES
// - Pass data: YES

// Le W3 reçoit automatiquement toutes les données incluant:
// - component_to_generate (PAS entities[0] !)
// - doc_id
// - grist_base_url

// ════════════════════════════════════════════════════════════════
// NODE 7: Code: Collect Component (après W3)
// ════════════════════════════════════════════════════════════════
function collectComponent() {
    const generatedComponent = $input.first().json;

    return {
        component_id: generatedComponent.component_id,
        component_code: generatedComponent.component_code,
        validation_result: generatedComponent.validation_result,
        generated_at: generatedComponent.generated_at,
        doc_id: generatedComponent.doc_id,  // ✅ PROPAGER (vient du W3)
        grist_base_url: generatedComponent.grist_base_url  // ✅ PROPAGER
    };
}

// ════════════════════════════════════════════════════════════════
// NODE 8: Loop Back (NoOp node)
// ════════════════════════════════════════════════════════════════
// Simple NoOp, passe les données vers Split In Batches

// ════════════════════════════════════════════════════════════════
// NODE 9: Code: Aggregate Results (après loop complète)
// ════════════════════════════════════════════════════════════════
function aggregateResults() {
    // Collecter tous les composants générés
    const allItems = $input.all();

    const generatedComponents = allItems.map(item => ({
        component_id: item.json.component_id,
        component_code: item.json.component_code,
        validation_result: item.json.validation_result,
        generated_at: item.json.generated_at
    }));

    // Récupérer les données originales depuis Split In Batches (AVANT le loop)
    const inputData = $('Split In Batches').first().json;

    return {
        success: true,
        conversation_id: inputData.conversation_id || `conv_${Date.now()}`,
        business_domain: inputData.business_domain,
        workflow: 'workflow_2_orchestrateur',

        // ✅ CRITIQUE: Passer le schema au W5 (était manquant)
        schema: inputData.schema,
        use_cases: inputData.use_cases,

        // Composants générés
        generated_components: generatedComponents,

        // ✅ CRITIQUE: Passer doc_id et grist_base_url au W5
        doc_id: inputData.doc_id,
        grist_base_url: inputData.grist_base_url,

        summary: {
            total_components_generated: generatedComponents.length,
            all_validated: generatedComponents.every(c => c.validation_result?.is_valid),
            generation_completed_at: new Date().toISOString()
        },

        next_steps: {
            workflow: 'workflow_5_assemblage_final',
            action: 'Créer les tables dans le document Grist actuel'
        }
    };
}

// ════════════════════════════════════════════════════════════════
// NODE 10: Execute Workflow 5 (optionnel - si auto-call)
// ════════════════════════════════════════════════════════════════
// Si le W1 doit appeler automatiquement le W5 après génération des composants:

// Configuration Execute Workflow Node:
// - Workflow: Workflow 5 (sélectionner dans la liste)
// - Wait for completion: YES
// - Pass data: YES

// Le W5 reçoit automatiquement:
// - schema
// - generated_components
// - doc_id (CRUCIAL)
// - grist_base_url

// ════════════════════════════════════════════════════════════════
// 📝 RÉSUMÉ DES MODIFICATIONS
// ════════════════════════════════════════════════════════════════
/*
✅ Node 1: Extract Input
   - Extrait doc_id et grist_base_url du W1

✅ Node 2: Prepare Components List
   - Propage doc_id et grist_base_url

✅ Node 3-4: Split Out + Split In Batches
   - Passent automatiquement doc_id (pas de modification nécessaire)

✅ Node 5: Prepare Workflow 3 Input
   - Passe component_to_generate (PAS entities[0] !)
   - Passe doc_id et grist_base_url au W3

✅ Node 6: Execute Workflow 3
   - Le W3 reçoit doc_id automatiquement

✅ Node 7: Collect Component
   - Propage doc_id retourné par le W3

✅ Node 8: Loop Back
   - Pas de modification (NoOp)

✅ Node 9: Aggregate Results
   - CRITIQUE: Ajoute schema (était manquant)
   - CRITIQUE: Ajoute doc_id et grist_base_url pour le W5

✅ Node 10: Execute Workflow 5 (optionnel)
   - Passe automatiquement toutes les données au W5

VÉRIFICATION:
1. Debug N8N: Vérifier que TOUS les nodes ont doc_id
2. Vérifier que le W3 reçoit component_to_generate différent à chaque itération
3. Vérifier que "Aggregate Results" inclut schema, doc_id et grist_base_url
4. Si auto-call W5: vérifier que le W5 reçoit doc_id
*/

// ════════════════════════════════════════════════════════════════
// 🔍 DEBUGGING
// ════════════════════════════════════════════════════════════════
/*
Pour débugger, ajouter ce code dans "Code: Prepare Workflow 3 Input":

console.log('🔍 DEBUG W2 → W3:');
console.log('  component_to_generate:', component);
console.log('  doc_id:', fullData.doc_id);
console.log('  batchIndex:', fullData.batchIndex);

Ça permet de vérifier que chaque itération reçoit un composant différent.
*/
