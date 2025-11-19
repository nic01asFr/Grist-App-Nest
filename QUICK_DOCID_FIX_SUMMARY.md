# ✅ RÉSUMÉ ACTIONNABLE - Flux docId pour Création Tables

## 🎯 Objectif
Les tables doivent être créées dans le **document Grist actuel** (celui du widget), pas dans un nouveau document.

## 🔴 Problème Actuel

```
Widget (dans doc "abc123")
    ↓ webhook
W1 (ne reçoit PAS de docId)
    ↓
W2 (n'a PAS de docId)
    ↓
W5 (utilise docId = "NEW_DOC" ❌)
    ↓
HTTP Request: POST /api/docs/NEW_DOC/tables ❌ FAUX
```

## ✅ Solution

```
Widget (dans doc "abc123")
    ↓ webhook avec {documentId: "abc123"}
W1 (extrait doc_id: "abc123")
    ↓
W2 (propage doc_id: "abc123")
    ↓
W5 (utilise doc_id: "abc123" ✅)
    ↓
HTTP Request: POST /api/docs/abc123/tables ✅ BON
```

---

## 🔧 4 Corrections à Appliquer

### 1️⃣ WIDGET (Priorité 1)
**Fichier**: `Grist_App_Nest_v5_2.html`
**Ligne**: ~1401
**Fonction**: `sendAIToAlbert()`

**Chercher**:
```javascript
const webhookData = {
    messageId: ...,
    message: context.message,
    mode: context.mode,
```

**Ajouter 2 lignes**:
```javascript
const webhookData = {
    messageId: ...,
    message: context.message,
    mode: context.mode,
    documentId: this.documentId,  // ← AJOUTER
    gristBaseUrl: window.location.origin || 'https://grist.numerique.gouv.fr',  // ← AJOUTER
```

**Fichier de référence**: `widget_patch_send_docid.js`

---

### 2️⃣ WORKFLOW 1 (Priorité 1)
**Workflow**: Workflow 1 (Analyse)
**Nodes à modifier**: 11 nodes Code

**Premier node "Extract Input"** - Chercher:
```javascript
return {
    user_input: data.user_input,
    conversation_id: data.conversation_id || `conv_${Date.now()}`,
```

**Ajouter 2 lignes**:
```javascript
return {
    user_input: data.user_input || data.message,
    conversation_id: data.conversation_id || data.messageId || `conv_${Date.now()}`,
    doc_id: data.documentId,  // ← AJOUTER
    grist_base_url: data.gristBaseUrl || 'https://grist.numerique.gouv.fr',  // ← AJOUTER
```

**Tous les autres nodes** - Ajouter dans chaque `return`:
```javascript
return {
    // ... données existantes ...
    doc_id: $json.doc_id,  // ← AJOUTER
    grist_base_url: $json.grist_base_url  // ← AJOUTER
};
```

**Fichier de référence**: `workflow_1_ALL_NODES_WITH_DOCID.js`

---

### 3️⃣ WORKFLOW 2 (Priorité 1)
**Workflow**: Workflow 2 (Orchestrateur)
**Nodes à modifier**: 10 nodes Code

**Premier node "Extract Input"**:
```javascript
return {
    conversation_id: data.conversation_id,
    business_domain: data.business_domain,
    schema: data.schema,
    use_cases: data.use_cases,
    validation: data.validation,
    doc_id: data.doc_id,  // ← AJOUTER
    grist_base_url: data.grist_base_url  // ← AJOUTER
};
```

**Node "Code: Aggregate Results"** (CRITIQUE):
```javascript
const inputData = $('Split In Batches').first().json;

return {
    success: true,
    conversation_id: inputData.conversation_id || `conv_${Date.now()}`,
    business_domain: inputData.business_domain,
    workflow: 'workflow_2_orchestrateur',

    schema: inputData.schema,  // ← AJOUTER (était manquant)
    use_cases: inputData.use_cases,  // ← AJOUTER (était manquant)

    generated_components: generatedComponents,

    doc_id: inputData.doc_id,  // ← AJOUTER
    grist_base_url: inputData.grist_base_url,  // ← AJOUTER

    summary: {...},
    next_steps: {...}
};
```

**Tous les autres nodes** - Ajouter dans chaque `return`:
```javascript
doc_id: $json.doc_id,
grist_base_url: $json.grist_base_url
```

**Fichier de référence**: `workflow_2_ALL_NODES_WITH_DOCID.js`

---

### 4️⃣ WORKFLOW 5 (Priorité 1)
**Workflow**: Workflow 5 (Assemblage Final)
**Nodes à modifier**: 2 nodes

**Node "Code: Prepare Grist Config"** - Remplacer TOUT le code:
```javascript
const businessDomain = $json.business_domain;
const timestamp = Date.now();

// ✅ UTILISER le doc_id reçu (document actuel)
const docId = $json.doc_id;
const baseUrl = $json.grist_base_url || 'https://grist.numerique.gouv.fr';

// ✅ VALIDATION CRITIQUE
if (!docId) {
    throw new Error('❌ doc_id manquant! Le widget doit envoyer documentId.');
}

return {
    conversation_id: $json.conversation_id,
    business_domain: businessDomain,
    schema: $json.schema,
    use_cases: $json.use_cases,
    generated_components: $json.generated_components,
    summary: $json.summary,

    // ✅ Configuration avec doc_id ACTUEL (pas NEW_DOC)
    grist_config: {
        base_url: baseUrl,
        doc_id: docId,  // ← DEPUIS INPUT, PAS HARDCODÉ
        doc_name: `AppNest_${businessDomain}_${timestamp}`
    },

    started_at: new Date().toISOString()
};
```

**Node "Code: Prepare Final Response"** - Modifier le message:
```javascript
return {
    success: true,
    // ... autres données ...

    grist_document: {
        doc_id: gristConfig.doc_id,
        doc_url: `${gristConfig.base_url}/doc/${gristConfig.doc_id}`,
        message: 'Tables créées dans le document ACTUEL'  // ← Message clair
    },

    next_steps: [
        '✅ Tables créées dans VOTRE document actuel',
        '🔄 RECHARGEZ le widget (F5)',
        '✅ Les nouveaux composants apparaîtront'
    ],

    // ... reste ...
};
```

**Fichier de référence**: `workflow_5_USE_DOCID_NOT_NEW_DOC.js`

---

## ⚡ Vérification Rapide

### Après Widget
Console navigateur (F12) doit afficher:
```
📤 Envoi au webhook n8n avec docId: {documentId: "abc123", ...}
```

### Après W1
Debug N8N, dernier node doit avoir:
```json
{
  "doc_id": "abc123",
  "schema": {...},
  ...
}
```

### Après W2
Debug N8N, node "Aggregate Results" doit avoir:
```json
{
  "doc_id": "abc123",
  "schema": {...},
  "generated_components": [...]
}
```

### Après W5
Debug N8N, node "Prepare Grist Config" doit afficher:
```javascript
grist_config.doc_id = "abc123"  // PAS "NEW_DOC" !
```

HTTP Request doit appeler:
```
POST https://grist.../api/docs/abc123/tables
                                  ^^^^^^^
                            Doc actuel du widget
```

---

## 🚨 Point Critique

**Sans le widget corrigé, RIEN ne marche.**

Le widget est la SOURCE du `documentId`. Si il ne l'envoie pas, les workflows ne peuvent pas le propager.

**Ordre d'application obligatoire**:
1. Widget (sinon pas de docId envoyé)
2. W1 (sinon pas de docId extrait)
3. W2 (sinon pas de docId propagé au W5)
4. W5 (sinon utilise NEW_DOC)

---

## 📊 Test Final Simple

```bash
# 1. Ouvrir document Grist
#    URL: https://grist.../doc/abc123
#          Notez ce docId: abc123

# 2. Widget envoie message
#    Vérifier console: documentId: "abc123"

# 3. Workflows s'exécutent
#    Vérifier W5 debug: doc_id = "abc123"

# 4. HTTP Request créé table
#    URL doit être: .../api/docs/abc123/tables
#                                    ^^^^^^
#                              Doit correspondre!

# 5. Recharger widget
#    Les composants apparaissent
```

---

## 📁 Fichiers de Référence

Tous les fichiers sont dans le commit précédent:

- `widget_patch_send_docid.js` - Code complet pour le widget
- `workflow_1_ALL_NODES_WITH_DOCID.js` - Tous les nodes du W1
- `workflow_2_ALL_NODES_WITH_DOCID.js` - Tous les nodes du W2
- `workflow_5_USE_DOCID_NOT_NEW_DOC.js` - Nodes critiques du W5
- `CORRECTIONS_DOCID_FLOW_COMPLETE.md` - Guide détaillé complet

---

**Temps d'application estimé**: 1h30 (si fait dans l'ordre)
**Résultat**: Tables créées dans le document actuel, rechargement widget = composants visibles
