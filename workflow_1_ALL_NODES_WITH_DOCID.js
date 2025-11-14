// 🔧 WORKFLOW 1 - Tous les nodes corrigés pour propager doc_id

// ════════════════════════════════════════════════════════════════
// NODE 1: Extract Input (premier node après webhook trigger)
// ════════════════════════════════════════════════════════════════
function extractInput() {
    const input = $input.first().json;
    const data = input.body || input;

    // Support multiple formats
    const userInput = data.user_input || data.message || '';
    const conversationId = data.conversation_id || data.messageId || `conv_${Date.now()}`;

    // ✅ EXTRACTION doc_id et grist_base_url
    const docId = data.documentId || data.doc_id;
    const gristBaseUrl = data.gristBaseUrl || data.grist_base_url || 'https://grist.numerique.gouv.fr';

    if (!docId) {
        console.warn('⚠️ Aucun doc_id reçu du widget ! Vérifier que le widget envoie documentId.');
    }

    return {
        user_input: userInput,
        conversation_id: conversationId,
        doc_id: docId,  // ✅ AJOUTÉ
        grist_base_url: gristBaseUrl,  // ✅ AJOUTÉ
        received_at: new Date().toISOString()
    };
}

// ════════════════════════════════════════════════════════════════
// NODE 2: Code: Format Agent 1 Prompt (Analyse)
// ════════════════════════════════════════════════════════════════
function formatAgent1Prompt() {
    const userInput = $json.user_input;
    const conversationId = $json.conversation_id;

    const prompt = `Analyse le besoin métier suivant et identifie les entités principales...`;

    return {
        conversation_id: conversationId,
        user_input: userInput,
        agent_1_prompt: prompt,
        doc_id: $json.doc_id,  // ✅ PROPAGER
        grist_base_url: $json.grist_base_url  // ✅ PROPAGER
    };
}

// ════════════════════════════════════════════════════════════════
// NODE 3: Edit Fields A1 (après Agent 1)
// ════════════════════════════════════════════════════════════════
// Configuration Edit Fields Node:
// - Field: agent_1_output
// - Value: ={{ $json.output }}
// - Keep existing fields: YES

// Ensuite, node Code pour extraire:
function extractAgent1Output() {
    const output = $('Edit Fields A1').first().json.agent_1_output;

    return {
        conversation_id: $json.conversation_id,
        user_input: $json.user_input,
        agent_1_output: output,
        doc_id: $json.doc_id,  // ✅ PROPAGER
        grist_base_url: $json.grist_base_url  // ✅ PROPAGER
    };
}

// ════════════════════════════════════════════════════════════════
// NODE 4: Code: Format Agent 2 Prompt (Schéma)
// ════════════════════════════════════════════════════════════════
function formatAgent2Prompt() {
    const agent1Output = $json.agent_1_output;

    const prompt = `À partir de cette analyse : ${agent1Output}\n\nCrée un schéma de tables Grist...`;

    return {
        conversation_id: $json.conversation_id,
        user_input: $json.user_input,
        agent_1_output: agent1Output,
        agent_2_prompt: prompt,
        doc_id: $json.doc_id,  // ✅ PROPAGER
        grist_base_url: $json.grist_base_url  // ✅ PROPAGER
    };
}

// ════════════════════════════════════════════════════════════════
// NODE 5: Edit Fields A2 (après Agent 2)
// ════════════════════════════════════════════════════════════════
function extractAgent2Output() {
    const output = $('Edit Fields A2').first().json.agent_2_output;

    // Parser le JSON du schema
    let schema;
    try {
        schema = JSON.parse(output);
    } catch (e) {
        console.error('Erreur parsing schema:', e);
        schema = { entities: [], total_tables: 0 };
    }

    return {
        conversation_id: $json.conversation_id,
        user_input: $json.user_input,
        agent_1_output: $json.agent_1_output,
        agent_2_output: output,
        schema: schema,
        doc_id: $json.doc_id,  // ✅ PROPAGER
        grist_base_url: $json.grist_base_url  // ✅ PROPAGER
    };
}

// ════════════════════════════════════════════════════════════════
// NODE 6: Code: Format Agent 3 Prompt (Use Cases)
// ════════════════════════════════════════════════════════════════
function formatAgent3Prompt() {
    const schema = $json.schema;
    const businessDomain = schema.business_domain || 'application métier';

    const prompt = `Pour ce schéma : ${JSON.stringify(schema)}\n\nIdentifie 10-15 cas d'usage...`;

    return {
        conversation_id: $json.conversation_id,
        user_input: $json.user_input,
        agent_1_output: $json.agent_1_output,
        agent_2_output: $json.agent_2_output,
        schema: schema,
        agent_3_prompt: prompt,
        doc_id: $json.doc_id,  // ✅ PROPAGER
        grist_base_url: $json.grist_base_url  // ✅ PROPAGER
    };
}

// ════════════════════════════════════════════════════════════════
// NODE 7: Edit Fields A3 (après Agent 3)
// ════════════════════════════════════════════════════════════════
function extractAgent3Output() {
    const output = $('Edit Fields A3').first().json.agent_3_output;

    // Parser le JSON des use cases
    let useCases;
    try {
        useCases = JSON.parse(output);
    } catch (e) {
        console.error('Erreur parsing use cases:', e);
        useCases = { all_use_cases: [], total_count: 0 };
    }

    return {
        conversation_id: $json.conversation_id,
        user_input: $json.user_input,
        agent_1_output: $json.agent_1_output,
        agent_2_output: $json.agent_2_output,
        agent_3_output: output,
        schema: $json.schema,
        use_cases: useCases,
        doc_id: $json.doc_id,  // ✅ PROPAGER
        grist_base_url: $json.grist_base_url  // ✅ PROPAGER
    };
}

// ════════════════════════════════════════════════════════════════
// NODE 8: Code: Format Agent 4 Prompt (Validation)
// ════════════════════════════════════════════════════════════════
function formatAgent4Prompt() {
    const schema = $json.schema;
    const useCases = $json.use_cases;

    const prompt = `Schéma : ${JSON.stringify(schema)}\nUse cases : ${JSON.stringify(useCases)}\n\nCrée le plan de composants...`;

    return {
        conversation_id: $json.conversation_id,
        user_input: $json.user_input,
        agent_1_output: $json.agent_1_output,
        agent_2_output: $json.agent_2_output,
        agent_3_output: $json.agent_3_output,
        schema: schema,
        use_cases: useCases,
        agent_4_prompt: prompt,
        doc_id: $json.doc_id,  // ✅ PROPAGER
        grist_base_url: $json.grist_base_url  // ✅ PROPAGER
    };
}

// ════════════════════════════════════════════════════════════════
// NODE 9: Edit Fields A4 (après Agent 4)
// ════════════════════════════════════════════════════════════════
function extractAgent4Output() {
    const output = $('Edit Fields A4').first().json.agent_4_output;

    // Parser le JSON de validation
    let validation;
    try {
        validation = JSON.parse(output);
    } catch (e) {
        console.error('Erreur parsing validation:', e);
        validation = { component_roadmap: [], total_components_planned: 0 };
    }

    return {
        conversation_id: $json.conversation_id,
        user_input: $json.user_input,
        agent_1_output: $json.agent_1_output,
        agent_2_output: $json.agent_2_output,
        agent_3_output: $json.agent_3_output,
        agent_4_output: output,
        schema: $json.schema,
        use_cases: $json.use_cases,
        validation: validation,
        doc_id: $json.doc_id,  // ✅ PROPAGER
        grist_base_url: $json.grist_base_url  // ✅ PROPAGER
    };
}

// ════════════════════════════════════════════════════════════════
// NODE 10: Code: Prepare Final Output (avant Execute Workflow 2)
// ════════════════════════════════════════════════════════════════
function prepareFinalOutput() {
    const schema = $json.schema;

    // Extraire business_domain depuis le schema ou l'analyse
    let businessDomain = schema.business_domain || 'application_metier';

    // Nettoyer le nom (pas d'espaces, lowercase)
    businessDomain = businessDomain
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

    return {
        success: true,
        conversation_id: $json.conversation_id,
        workflow: 'workflow_1_analyse',

        // Outputs principaux
        business_domain: businessDomain,
        schema: schema,
        use_cases: $json.use_cases,
        validation: $json.validation,

        // ✅ DOC_ID et GRIST_BASE_URL pour W2
        doc_id: $json.doc_id,
        grist_base_url: $json.grist_base_url,

        // Métadonnées
        analysis: {
            user_input: $json.user_input,
            agent_outputs: {
                agent_1: $json.agent_1_output,
                agent_2: $json.agent_2_output,
                agent_3: $json.agent_3_output,
                agent_4: $json.agent_4_output
            }
        },

        summary: {
            total_entities: schema.total_tables || schema.entities?.length || 0,
            total_use_cases: $json.use_cases?.total_count || 0,
            total_components_planned: $json.validation?.total_components_planned || 0
        },

        completed_at: new Date().toISOString(),

        next_steps: {
            workflow: 'workflow_2_orchestrateur',
            action: 'Générer les composants React'
        }
    };
}

// ════════════════════════════════════════════════════════════════
// NODE 11: Execute Workflow 2 (dernier node)
// ════════════════════════════════════════════════════════════════
// Configuration du node Execute Workflow:
// - Workflow: Workflow 2 (sélectionner dans la liste)
// - Wait for completion: YES
// - Pass data: YES (toutes les données du node précédent sont passées)

// Le node passe automatiquement TOUTES les données incluant:
// - doc_id
// - grist_base_url
// - schema
// - use_cases
// - validation
// - business_domain

// ════════════════════════════════════════════════════════════════
// 📝 RÉSUMÉ DES MODIFICATIONS
// ════════════════════════════════════════════════════════════════
/*
✅ Node 1: Extract Input
   - Extrait documentId et gristBaseUrl du webhook
   - Les stocke dans doc_id et grist_base_url

✅ Nodes 2-9: Agents et extraction
   - TOUS propagent doc_id et grist_base_url dans leur return

✅ Node 10: Prepare Final Output
   - Inclut doc_id et grist_base_url dans l'output vers W2

✅ Node 11: Execute Workflow 2
   - Passe automatiquement toutes les données (incluant doc_id)

VÉRIFICATION:
1. Activer le debug dans N8N (⚙️ Executions → Show)
2. Lancer le workflow
3. Vérifier que TOUS les nodes ont doc_id dans leur output
4. Vérifier que Execute Workflow 2 reçoit bien doc_id
*/
