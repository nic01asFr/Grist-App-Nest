// 🔧 WORKFLOW 5 - Node "Code: Prepare Grist Config" CORRIGÉ

// ════════════════════════════════════════════════════════════════
// NODE: Code: Prepare Grist Config
// Position: Après "Extract Input"
// ════════════════════════════════════════════════════════════════

// ❌ CODE ACTUEL (FAUX - utilise NEW_DOC)
/*
function prepareGristConfig() {
    const businessDomain = $json.business_domain;
    const timestamp = Date.now();

    const gristDocId = 'NEW_DOC';  // ❌ HARDCODÉ

    return {
        conversation_id: $json.conversation_id,
        business_domain: businessDomain,
        schema: $json.schema,
        use_cases: $json.use_cases,
        generated_components: $json.generated_components,
        summary: $json.summary,

        grist_config: {
            base_url: 'https://grist.numerique.gouv.fr',
            doc_id: gristDocId,  // ❌ FAUX
            doc_name: `AppNest_${businessDomain}_${timestamp}`
        },

        started_at: new Date().toISOString()
    };
}
*/

// ✅ CODE CORRIGÉ (BON - utilise doc_id reçu)
function prepareGristConfig() {
    const businessDomain = $json.business_domain;
    const timestamp = Date.now();

    // ✅ UTILISER le doc_id reçu depuis le widget (via W1 → W2 → W5)
    const docId = $json.doc_id;
    const baseUrl = $json.grist_base_url || 'https://grist.numerique.gouv.fr';

    // ✅ VALIDATION CRITIQUE
    if (!docId) {
        throw new Error('❌ ERREUR CRITIQUE: doc_id manquant!\n\n' +
            'Le document Grist actuel (doc_id) doit être passé par le widget.\n' +
            'Vérifiez que:\n' +
            '1. Le widget envoie documentId dans le webhook\n' +
            '2. Le W1 extrait et propage doc_id\n' +
            '3. Le W2 propage doc_id au W5\n\n' +
            'Doc reçu: ' + JSON.stringify($json, null, 2));
    }

    console.log('✅ Configuration Grist API pour document ACTUEL:', {
        doc_id: docId,
        base_url: baseUrl,
        business_domain: businessDomain
    });

    return {
        conversation_id: $json.conversation_id,
        business_domain: businessDomain,
        schema: $json.schema,
        use_cases: $json.use_cases,
        generated_components: $json.generated_components,
        summary: $json.summary,

        // ✅ Configuration API Grist avec doc_id ACTUEL (pas NEW_DOC)
        grist_config: {
            base_url: baseUrl,
            doc_id: docId,  // ✅ Document Grist actuel du widget
            doc_name: `AppNest_${businessDomain}_${timestamp}`,
            operation: 'create_tables_in_current_document'  // Pour clarté
        },

        started_at: new Date().toISOString(),

        debug_info: {
            received_doc_id: docId,
            received_base_url: baseUrl,
            will_create_tables_in: `${baseUrl}/doc/${docId}`
        }
    };
}

// ════════════════════════════════════════════════════════════════
// NODE: Code: Prepare Final Response (dernier node du W5)
// ════════════════════════════════════════════════════════════════

// ✅ CORRECTION: Response finale avec info sur le document actuel
function prepareFinalResponse() {
    const allItems = $input.all();
    const firstItem = $input.first().json;

    const insertedComponents = allItems.map(item => ({
        component_id: item.json.record_to_insert?.template_id,
        inserted: true
    }));

    const gristConfig = firstItem.grist_config;
    const docUrl = `${gristConfig.base_url}/doc/${gristConfig.doc_id}`;

    return {
        success: true,
        conversation_id: firstItem.conversation_id,
        workflow: 'workflow_5_assemblage_final',
        business_domain: firstItem.business_domain,

        grist_document: {
            doc_id: gristConfig.doc_id,
            doc_url: docUrl,
            doc_name: gristConfig.doc_name,
            operation: 'Tables créées dans le document ACTUEL (pas un nouveau document)'  // ✅ IMPORTANT
        },

        summary: {
            components_inserted: insertedComponents.length,
            all_components_inserted: true,
            tables_created: true,
            references_added: true
        },

        widget_configuration: {
            widget_url: 'https://raw.githubusercontent.com/nic01asFr/grist-dynamic-dashboard/main/Grist_App_Nest_v5_2.html',
            access_level: 'read table',
            table_to_select: 'Templates',
            status: 'Widget already installed in this document'
        },

        // ✅ Instructions claires pour l'utilisateur
        next_steps: [
            '✅ Tables créées dans VOTRE document actuel',
            '✅ Composants insérés dans la table Templates',
            '🔄 RECHARGEZ le widget (F5 ou recharger la page)',
            '✅ Les nouveaux composants apparaîtront dans la navigation',
            `📄 Document: ${docUrl}`
        ],

        completed_at: new Date().toISOString(),

        // Debug info
        debug: {
            doc_id_used: gristConfig.doc_id,
            base_url_used: gristConfig.base_url,
            components_count: insertedComponents.length
        }
    };
}

// ════════════════════════════════════════════════════════════════
// 📝 INSTRUCTIONS D'APPLICATION
// ════════════════════════════════════════════════════════════════
/*
1. Ouvrir Workflow 5 dans N8N
2. Trouver le node "Code: Prepare Grist Config"
3. Remplacer TOUT le code par la fonction prepareGristConfig() ci-dessus
4. Trouver le node "Code: Prepare Final Response" (dernier node)
5. Remplacer TOUT le code par la fonction prepareFinalResponse() ci-dessus
6. Sauvegarder le workflow

VÉRIFICATION:
1. Debug N8N: Activer les executions logs
2. Lancer le workflow complet depuis le widget
3. Dans le node "Code: Prepare Grist Config", vérifier:
   - doc_id doit être l'ID du document actuel (pas "NEW_DOC")
   - base_url doit être l'URL Grist correcte
4. Si erreur "doc_id manquant", remonter la chaîne:
   - Vérifier le widget envoie documentId
   - Vérifier W1 extrait doc_id
   - Vérifier W2 propage doc_id
*/

// ════════════════════════════════════════════════════════════════
// 🔍 DEBUGGING
// ════════════════════════════════════════════════════════════════
/*
Si le doc_id est manquant, ajouter ce code de debug au début du W5:

function debugDocId() {
    console.log('🔍 DEBUG W5 Input:');
    console.log('Full $json:', JSON.stringify($json, null, 2));
    console.log('doc_id:', $json.doc_id);
    console.log('grist_base_url:', $json.grist_base_url);

    return $json;
}

Ça permet de voir EXACTEMENT ce que le W5 reçoit du W2.
*/

// ════════════════════════════════════════════════════════════════
// ⚠️ ERREURS FRÉQUENTES
// ════════════════════════════════════════════════════════════════
/*
ERREUR 1: "doc_id manquant"
→ Remonter la chaîne: Widget → W1 → W2 → W5
→ Vérifier que CHAQUE étape propage doc_id

ERREUR 2: "Table already exists"
→ Normal si le workflow est relancé dans le même document
→ Solution: Utiliser IF node pour vérifier si la table existe

ERREUR 3: "403 Forbidden" sur API Grist
→ Vérifier les credentials Grist API
→ Vérifier que l'API key a les droits sur ce document

ERREUR 4: "Document not found"
→ Le doc_id reçu n'existe pas
→ Vérifier que le widget détecte correctement le documentId
*/

// ════════════════════════════════════════════════════════════════
// ✅ AVANTAGES DE CETTE APPROCHE
// ════════════════════════════════════════════════════════════════
/*
✅ Pas de création de nouveau document
✅ Tables créées directement dans le document actuel
✅ Widget déjà installé, pas besoin de reconfigurer
✅ User juste besoin de recharger pour voir les nouveaux composants
✅ Expérience utilisateur fluide
✅ Moins d'étapes manuelles
*/
