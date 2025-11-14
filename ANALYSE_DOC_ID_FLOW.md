# 🚨 Analyse Complète - Flux docId Widget → W1 → W2 → W3 → W5

## 📊 État Actuel

### ✅ Ce qui fonctionne
Le widget **détecte correctement** le `documentId` :
```javascript
// Grist_App_Nest_v5_2.html ligne 646-724
this.documentId = '';
await this.autoDetectDocumentId();
// → this.documentId = "abc123def456"
```

### ❌ Ce qui ne fonctionne PAS

#### 1. Widget : documentId non envoyé au webhook
**Fichier**: `Grist_App_Nest_v5_2.html`
**Ligne**: ~1401-1424
**Fonction**: `sendAIToAlbert()`

**Code Actuel (INCOMPLET):**
```javascript
const webhookData = {
    messageId: `ai_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    message: context.message,
    mode: context.mode,
    // ❌ documentId MANQUANT
};
```

**Code Corrigé (COMPLET):**
```javascript
const webhookData = {
    messageId: `ai_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    message: context.message,
    mode: context.mode,
    documentId: this.documentId,  // ✅ AJOUTÉ
    gristBaseUrl: 'https://grist.numerique.gouv.fr'  // ✅ AJOUTÉ
};
```

#### 2. Workflow 1 : documentId non extrait
**Fichier**: Workflow 1 (analyse)
**Node**: "Extract Input" ou premier code node

**Code Actuel (INCOMPLET):**
```javascript
const input = $input.first().json;
const data = input.body || input;

return {
    user_input: data.user_input,
    conversation_id: data.conversation_id || `conv_${Date.now()}`
    // ❌ documentId MANQUANT
};
```

**Code Corrigé (COMPLET):**
```javascript
const input = $input.first().json;
const data = input.body || input;

return {
    user_input: data.user_input || data.message,  // Support message ou user_input
    conversation_id: data.conversation_id || data.messageId || `conv_${Date.now()}`,
    doc_id: data.documentId,  // ✅ AJOUTÉ
    grist_base_url: data.gristBaseUrl || 'https://grist.numerique.gouv.fr'  // ✅ AJOUTÉ
};
```

#### 3. Workflow 1 : documentId non passé au W2
**Node**: "Execute Workflow 2" (dernier node du W1)

Le W1 doit passer le `doc_id` dans toutes ses sorties vers le W2.

#### 4. Workflow 2 : documentId non propagé
**Nodes affectés:**
- "Extract Input" (début)
- "Code: Prepare Components List"
- "Code: Prepare Workflow 3 Input"
- "Code: Aggregate Results" (vers W5)

#### 5. Workflow 3 : documentId non propagé
Doit recevoir et retourner `doc_id` (même s'il ne l'utilise pas).

#### 6. Workflow 5 : documentId hardcodé 'NEW_DOC'
**Node**: "Code: Prepare Grist Config"

**Code Actuel (FAUX):**
```javascript
grist_config: {
    base_url: 'https://grist.numerique.gouv.fr',
    doc_id: 'NEW_DOC'  // ❌ HARDCODÉ
}
```

**Code Corrigé (BON):**
```javascript
grist_config: {
    base_url: $json.grist_base_url || 'https://grist.numerique.gouv.fr',
    doc_id: $json.doc_id  // ✅ DEPUIS INPUT
}
```

---

## 🔄 Flux Complet Corrigé

```
┌─────────────────────────────────────────────────────────┐
│ Widget Grist (Grist_App_Nest_v5_2.html)                 │
│                                                          │
│ 1. Détecte docId via autoDetectDocumentId()              │
│    → this.documentId = "abc123def456"                    │
│                                                          │
│ 2. User saisit: "app gestion stock"                      │
│                                                          │
│ 3. sendAIToAlbert() envoie webhook:                      │
│    POST https://n8n.../webhook/appnest-analyse           │
│    {                                                     │
│      "message": "app gestion stock",                     │
│      "messageId": "ai_1731576000_123",                   │
│      "mode": "code",                                     │
│      "documentId": "abc123def456",      ← ✅ AJOUTÉ      │
│      "gristBaseUrl": "https://grist.numerique.gouv.fr"  │
│    }                                                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ Workflow 1: Analyse & Schéma                             │
│                                                          │
│ Node: Extract Input                                      │
│   return {                                               │
│     user_input: "app gestion stock",                     │
│     conversation_id: "ai_1731576000_123",                │
│     doc_id: "abc123def456",            ← ✅ EXTRAIT      │
│     grist_base_url: "https://grist.numerique.gouv.fr"   │
│   }                                                      │
│                                                          │
│ ... (Agent 1, 2, 3, 4 - génération schema) ...          │
│                                                          │
│ Node: Code: Prepare Final Output                        │
│   return {                                               │
│     conversation_id: ...,                                │
│     business_domain: "gestion_stock",                    │
│     schema: {...},                                       │
│     use_cases: {...},                                    │
│     validation: {...},                                   │
│     doc_id: $json.doc_id,              ← ✅ PROPAGÉ     │
│     grist_base_url: $json.grist_base_url                │
│   }                                                      │
│                                                          │
│ Node: Execute Workflow 2                                 │
│   Passe toutes les données (incluant doc_id)            │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ Workflow 2: Orchestrateur Composants                     │
│                                                          │
│ Node: Extract Input                                      │
│   return {                                               │
│     conversation_id: ...,                                │
│     business_domain: ...,                                │
│     schema: {...},                                       │
│     use_cases: {...},                                    │
│     doc_id: data.doc_id,               ← ✅ EXTRAIT     │
│     grist_base_url: data.grist_base_url                 │
│   }                                                      │
│                                                          │
│ Node: Code: Prepare Components List                      │
│   return {                                               │
│     ...,                                                 │
│     doc_id: $json.doc_id,              ← ✅ PROPAGÉ     │
│     grist_base_url: $json.grist_base_url                │
│   }                                                      │
│                                                          │
│ Loop: Split In Batches                                   │
│   Pour chaque composant:                                 │
│                                                          │
│   Node: Code: Prepare Workflow 3 Input                   │
│     return {                                             │
│       conversation_id: ...,                              │
│       business_domain: ...,                              │
│       schema: {...},                                     │
│       use_cases: {...},                                  │
│       component_to_generate: {...},                      │
│       doc_id: $json.doc_id,            ← ✅ PROPAGÉ     │
│       grist_base_url: $json.grist_base_url              │
│     }                                                    │
│                                                          │
│   Node: Execute Workflow 3                               │
│     → Génère 1 composant                                 │
│     ← Retourne composant + doc_id                        │
│                                                          │
│ Node: Code: Aggregate Results                            │
│   return {                                               │
│     success: true,                                       │
│     conversation_id: ...,                                │
│     business_domain: ...,                                │
│     schema: {...},                                       │
│     use_cases: {...},                                    │
│     generated_components: [...],                         │
│     doc_id: firstItem.doc_id,          ← ✅ PROPAGÉ     │
│     grist_base_url: firstItem.grist_base_url            │
│   }                                                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ Workflow 3: Génération Composant (loop)                  │
│                                                          │
│ Node: Extract Input                                      │
│   return {                                               │
│     ...,                                                 │
│     component_to_generate: {...},                        │
│     doc_id: data.doc_id,               ← ✅ EXTRAIT     │
│     grist_base_url: data.grist_base_url                 │
│   }                                                      │
│                                                          │
│ ... (génération du code composant) ...                  │
│                                                          │
│ Node: Code: Prepare Final Response                       │
│   return {                                               │
│     success: true,                                       │
│     component_id: ...,                                   │
│     component_code: ...,                                 │
│     validation_result: {...},                            │
│     doc_id: $json.doc_id,              ← ✅ PROPAGÉ     │
│     grist_base_url: $json.grist_base_url                │
│   }                                                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ Workflow 5: Assemblage Final + API Grist                 │
│                                                          │
│ Node: Extract Input                                      │
│   return {                                               │
│     conversation_id: ...,                                │
│     business_domain: ...,                                │
│     schema: {...},                                       │
│     use_cases: {...},                                    │
│     generated_components: [...],                         │
│     doc_id: data.doc_id,               ← ✅ EXTRAIT     │
│     grist_base_url: data.grist_base_url                 │
│   }                                                      │
│                                                          │
│ Node: Code: Prepare Grist Config                         │
│   grist_config: {                                        │
│     base_url: $json.grist_base_url,    ← ✅ DEPUIS INPUT│
│     doc_id: $json.doc_id               ← ✅ DEPUIS INPUT│
│   }                                                      │
│                                                          │
│ Node: HTTP: Create Templates Table                       │
│   POST {base_url}/api/docs/{doc_id}/tables              │
│        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^                      │
│        Doc courant du widget !                           │
│                                                          │
│ Loop: Create Business Tables                             │
│   POST {base_url}/api/docs/{doc_id}/tables              │
│   (Produits, Fournisseurs, etc.)                         │
│                                                          │
│ Loop: Add Reference Columns                              │
│   POST {base_url}/api/docs/{doc_id}/tables/{table}/cols │
│   (fournisseur_id Ref:Fournisseurs)                      │
│                                                          │
│ Loop: Insert Components into Templates                   │
│   POST {base_url}/api/docs/{doc_id}/tables/Templates/rec│
│                                                          │
│ Node: Code: Prepare Final Response                       │
│   return {                                               │
│     success: true,                                       │
│     grist_document: {                                    │
│       doc_id: gristConfig.doc_id,                        │
│       doc_url: `{base_url}/doc/{doc_id}`,               │
│       message: "Tables créées dans le document actuel"   │
│     },                                                   │
│     widget_ready: true,                                  │
│     next_steps: [                                        │
│       "Recharger le widget dans Grist",                  │
│       "Les composants sont déjà dans ce document",       │
│       "Tester l'application"                             │
│     ]                                                    │
│   }                                                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ Widget Grist (reçoit la réponse)                         │
│                                                          │
│ Affiche:                                                 │
│ ✅ Application créée dans ce document!                   │
│ ✅ Tables créées: Templates, Produits, Fournisseurs      │
│ ✅ 3 composants installés                                │
│ 💡 Rechargez le widget pour voir les nouveaux composants│
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Corrections Requises

### 1️⃣ Widget (PRIORITÉ 1)

**Fichier**: `Grist_App_Nest_v5_2.html`
**Fonction**: `sendAIToAlbert()` (ligne ~1393-1450)

**Rechercher** (ligne ~1401):
```javascript
const webhookData = {
    messageId: `ai_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    message: context.message,
    mode: context.mode,
```

**Remplacer par**:
```javascript
const webhookData = {
    messageId: `ai_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    message: context.message,
    mode: context.mode,
    documentId: this.documentId,  // ✅ AJOUTÉ
    gristBaseUrl: window.location.origin || 'https://grist.numerique.gouv.fr',  // ✅ AJOUTÉ
```

### 2️⃣ Workflow 1 (PRIORITÉ 1)

**Tous les nodes qui manipulent les données doivent propager `doc_id`**

#### Node "Extract Input" ou premier code node:
```javascript
const input = $input.first().json;
const data = input.body || input;

return {
    user_input: data.user_input || data.message,
    conversation_id: data.conversation_id || data.messageId || `conv_${Date.now()}`,
    doc_id: data.documentId,  // ✅ AJOUTÉ
    grist_base_url: data.gristBaseUrl || 'https://grist.numerique.gouv.fr'  // ✅ AJOUTÉ
};
```

#### Tous les autres nodes du W1:
Ajouter dans le `return`:
```javascript
return {
    // ... données existantes ...
    doc_id: $json.doc_id,  // ✅ PROPAGER
    grist_base_url: $json.grist_base_url  // ✅ PROPAGER
};
```

### 3️⃣ Workflow 2 (PRIORITÉ 1)

#### Node "Extract Input":
```javascript
const input = $input.first().json;
const data = input.body || input;

return {
    conversation_id: data.conversation_id,
    business_domain: data.business_domain,
    schema: data.schema,
    use_cases: data.use_cases,
    validation: data.validation,
    doc_id: data.doc_id,  // ✅ AJOUTÉ
    grist_base_url: data.grist_base_url  // ✅ AJOUTÉ
};
```

#### Node "Code: Prepare Components List":
```javascript
return {
    // ... données existantes ...
    doc_id: $json.doc_id,  // ✅ PROPAGER
    grist_base_url: $json.grist_base_url  // ✅ PROPAGER
};
```

#### Node "Code: Prepare Workflow 3 Input":
```javascript
return {
    conversation_id: $json.conversation_id,
    business_domain: $json.business_domain,
    schema: $json.schema,
    use_cases: $json.use_cases,
    component_to_generate: component,
    component_index: $json.batchIndex,
    total_components: $json.components_to_generate.length,
    doc_id: $json.doc_id,  // ✅ PROPAGER
    grist_base_url: $json.grist_base_url  // ✅ PROPAGER
};
```

#### Node "Code: Aggregate Results":
```javascript
const inputData = $('Split In Batches').first().json;

return {
    success: true,
    conversation_id: firstItem.conversation_id || `conv_${Date.now()}`,
    business_domain: firstItem.business_domain,
    workflow: 'workflow_2_orchestrateur',

    schema: inputData.schema || firstItem.schema,
    use_cases: inputData.use_cases || firstItem.use_cases,

    generated_components: generatedComponents,

    doc_id: inputData.doc_id || firstItem.doc_id,  // ✅ AJOUTÉ
    grist_base_url: inputData.grist_base_url || firstItem.grist_base_url,  // ✅ AJOUTÉ

    summary: {...},
    next_steps: {...}
};
```

### 4️⃣ Workflow 3 (PRIORITÉ 2)

Propager `doc_id` et `grist_base_url` dans tous les nodes (même si non utilisé).

### 5️⃣ Workflow 5 (PRIORITÉ 1)

#### Node "Code: Prepare Grist Config":
```javascript
const businessDomain = $json.business_domain;
const timestamp = Date.now();

// ✅ UTILISER le doc_id reçu (document actuel)
const docId = $json.doc_id;
const baseUrl = $json.grist_base_url || 'https://grist.numerique.gouv.fr';

if (!docId) {
    throw new Error('❌ doc_id manquant ! Le widget doit passer documentId.');
}

return {
    conversation_id: $json.conversation_id,
    business_domain: businessDomain,
    schema: $json.schema,
    use_cases: $json.use_cases,
    generated_components: $json.generated_components,
    summary: $json.summary,

    // Configuration API Grist avec doc_id ACTUEL
    grist_config: {
        base_url: baseUrl,
        doc_id: docId,  // ✅ DEPUIS INPUT (document actuel)
        doc_name: `AppNest_${businessDomain}_${timestamp}`
    },

    started_at: new Date().toISOString()
};
```

---

## ✅ Résultat Attendu

Après corrections:

1. **User ouvre un document Grist** (`doc_id = "abc123"`)
2. **Widget détecte** `documentId = "abc123"`
3. **User demande** "app gestion stock"
4. **Widget envoie webhook** avec `documentId: "abc123"`
5. **W1 → W2 → W3** propagent `doc_id: "abc123"`
6. **W5 crée les tables** dans `doc_id: "abc123"` (document actuel)
7. **Widget recharge** et affiche les nouveaux composants

**Plus besoin de créer un nouveau document !** Tout se passe dans le document actuel du widget.

---

## 📝 Fichiers à Créer

1. `Grist_App_Nest_v5_2_WITH_DOCID.html` - Widget corrigé
2. `workflow_1_pass_docid.js` - Code nodes W1
3. `workflow_2_pass_docid.js` - Code nodes W2
4. `workflow_5_use_docid.js` - Node "Prepare Grist Config" corrigé

---

**Prochaine étape**: Créer les fichiers de correction ?
