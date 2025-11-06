# Workflows N8N App Nest - Guide Complet

**Version:** 1.0-final
**Date:** 2025-01-06
**Widget:** Grist_App_Nest_v5_2.html
**Albert API:** albert-code (Qwen/Qwen2.5-Coder-32B-Instruct, 128K tokens)

---

## 📋 Vue d'Ensemble

Ce système de 5 workflows N8N génère automatiquement des applications App Nest complètes à partir d'une simple description en langage naturel.

### Architecture Modulaire

```
┌─────────────────────────────────────────────────────────────────┐
│                     WORKFLOW 1: Analyse Schéma                  │
│  Webhook → Agent 1 → Agent 2 → Agent 3 → Agent 4 → Response    │
│   (Conversation)  (Intent)  (Validation)  (Entity)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                WORKFLOW 2: Orchestrateur Composants             │
│  Webhook → Prepare List → Loop ──┐                             │
│                             │     │                              │
│                             ▼     │                              │
│                      ┌──────────┐ │                              │
│                      │ Workflow 3│◄┘ (pour chaque composant)    │
│                      └──────────┘                                │
│                             │                                     │
│                             ▼                                     │
│                      Aggregate → Response                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              WORKFLOW 3: Génération Composant (×N)              │
│  Extract Input → Format Prompt → Agent 5 → Return Component    │
│                                 (Code Generator)                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              WORKFLOW 4: Validation Composant (Optionnel)       │
│  Extract Input → Validate Code → Return Validation             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                WORKFLOW 5: Assemblage Final                     │
│  Extract Input → Schema → CSV → Instructions → Package         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Installation

### Prérequis

1. **N8N installé** (https://n8n.colaig.fr)
2. **Credentials Albert API** configurés :
   - Nom: "Header Albert API"
   - Type: OpenAI compatible
   - Model: albert-code
   - Base URL: https://albert.api.etalab.gouv.fr/v1

### Import des Workflows

1. **Workflow 1: Analyse Schéma** (Point d'entrée)
   ```bash
   # Importer workflow_1_final.json dans N8N
   # Trigger: Webhook
   # Webhook URL: https://n8n.colaig.fr/webhook/appnest-analyse
   ```

2. **Workflow 2: Orchestrateur** (Appelé par W1)
   ```bash
   # Importer workflow_2_orchestrateur_final.json
   # Trigger: "When Executed by Another Workflow"
   # Appelé automatiquement par le Workflow 1
   ```

3. **Workflow 3: Génération Composant** (Appelé par W2 en boucle)
   ```bash
   # Importer workflow_3_generation_composant_final.json
   # Trigger: "When Executed by Another Workflow"
   # Appelé automatiquement par le Workflow 2 pour chaque composant
   ```

4. **Workflow 4: Validation** (Optionnel - Standalone)
   ```bash
   # Importer workflow_4_validation_composant_final.json
   # Trigger: Webhook
   # Webhook URL: https://n8n.colaig.fr/webhook/appnest-validate-component
   # Utilisable indépendamment pour valider un composant
   ```

5. **Workflow 5: Assemblage Final** (Appelé par W2)
   ```bash
   # Importer workflow_5_assemblage_final.json
   # Trigger: "When Executed by Another Workflow"
   # Appelé automatiquement par le Workflow 2 après génération
   ```

### Configuration

Pour chaque workflow, vérifier :
- ✅ Credentials "Header Albert API" sont bien configurés sur tous les nodes LLM
- ✅ Les webhooks sont activés (mode "Production")
- ✅ Le workflow est activé (toggle ON)

---

## 🚀 Utilisation

> **⚡ Important :** Les workflows s'enchaînent automatiquement !
> - **Workflow 1** (webhook) → appelle automatiquement → **Workflow 2** (Execute Workflow)
> - **Workflow 2** → boucle sur → **Workflow 3** (Execute Workflow, ×N composants)
> - **Workflow 2** → appelle automatiquement → **Workflow 5** (Execute Workflow)
>
> **Vous n'avez qu'à appeler le Workflow 1** et tout le reste s'exécute automatiquement !

### Scénario 1 : Génération Complète Automatique

**Objectif :** Générer une application complète de A à Z en un seul appel

```bash
# UN SEUL APPEL suffit - Le Workflow 1 orchestre tout le reste
curl -X POST https://n8n.colaig.fr/webhook/appnest-analyse \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "Je veux créer une application de gestion de stock avec des produits, fournisseurs, commandes et catégories. Les gestionnaires doivent pouvoir suivre les niveaux de stock et recevoir des alertes de réapprovisionnement."
  }'
```

**🔄 Ce qui se passe en arrière-plan :**

1. ✅ **Workflow 1** analyse la demande (4 agents)
2. ✅ **Workflow 2** est automatiquement appelé (via Execute Workflow)
3. ✅ **Workflow 3** génère chaque composant un par un (boucle)
4. ✅ **Workflow 5** assemble le package final (automatique)
5. ✅ Vous recevez le résultat complet avec tous les fichiers

**Réponse Finale (après exécution de W1 → W2 → W3 → W5) :**
```json
{
  "success": true,
  "package": {
    "grist_schema": {...},
    "templates_csv": "template_id,template_name,component_type,component_code\n...",
    "installation_guide": "# Installation Guide\n..."
  },
  "files_generated": [
    {"filename": "grist_schema.json", "size_bytes": 12345},
    {"filename": "templates.csv", "rows": 6},
    {"filename": "INSTALLATION.md", "size_bytes": 5678}
  ],
  "widget_url": "https://raw.githubusercontent.com/nic01asFr/grist-dynamic-dashboard/main/Grist_App_Nest_v5_2.html"
}
```

---

### Scénario 2 : Test d'un Seul Composant

**Objectif :** Tester la génération d'un composant isolé

```bash
# Appeler directement le Workflow 3
curl -X POST https://n8n.colaig.fr/webhook/appnest-generate-component \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "test_001",
    "business_domain": "gestion_stock",
    "schema": {
      "entities": [
        {
          "table_name": "Produits",
          "entity_type": "master",
          "description": "Articles en stock",
          "columns": [
            {"column_name": "id", "column_type": "Int", "is_primary": true},
            {"column_name": "nom", "column_type": "Text", "is_required": true},
            {"column_name": "stock_actuel", "column_type": "Int"}
          ],
          "relationships": []
        }
      ]
    },
    "use_cases": {
      "all_use_cases": [
        {
          "uc_id": "UC_CREATE_PRODUITS",
          "description": "Créer un nouveau produit",
          "type": "crud"
        }
      ]
    },
    "component_to_generate": {
      "id": "gestion_produits",
      "name": "Gestion Produits",
      "type": "crud",
      "entity": "Produits",
      "description": "Interface CRUD pour gérer les produits"
    }
  }'
```

---

### Scénario 3 : Validation d'un Composant

```bash
# Valider un composant généré
curl -X POST https://n8n.colaig.fr/webhook/appnest-validate-component \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "test_001",
    "component_id": "dashboard",
    "component_name": "Tableau de bord",
    "component_type": "dashboard",
    "component_code": "const Component = () => { return (<div>Test</div>); };"
  }'
```

**Réponse :**
```json
{
  "success": true,
  "validation_result": {
    "is_valid": true,
    "error_count": 0,
    "warning_count": 1,
    "errors": [],
    "warnings": ["Le composant n'utilise pas gristAPI"],
    "checks": {
      "has_component_variable": true,
      "has_return": true,
      "uses_gristapi": false,
      "balanced_braces": true
    }
  },
  "recommendation": "Composant validé avec succès"
}
```

---

## 📊 Détails des Workflows

### Workflow 1 : Analyse Schéma

**Agents utilisés :**
1. **Agent 1 : Conversation Manager** - Analyse la demande et identifie le domaine
2. **Agent 2 : Intent Analyzer** - Détermine les use cases métier
3. **Agent 3 : Validation Coordinator** - Valide la faisabilité et crée la roadmap
4. **Agent 4 : Entity Classifier** - Génère le schéma détaillé des tables Grist

**Prompting Contextuel :**
- Chaque agent reçoit les données RÉELLES des agents précédents
- Exemples dynamiques basés sur le domaine identifié (pas d'exemples statiques)

**Output :**
- Domaine métier identifié
- Liste d'entités (tables)
- Use cases (CRUD + spécifiques)
- Schéma complet des tables
- Roadmap de composants

---

### Workflow 2 : Orchestrateur Composants

**Fonctionnement :**
1. Reçoit le schéma du Workflow 1
2. Prépare la liste des composants à générer (1 dashboard + N CRUD)
3. Boucle avec "Split In Batches" (1 composant à la fois)
4. Appelle le Workflow 3 pour chaque composant
5. Agrège tous les résultats

**Limite :** Max 5 composants CRUD pour rester sous 128K tokens

---

### Workflow 3 : Génération Composant

**Agent utilisé :**
- **Agent 5 : Code Generator** - Génère le code React JSX

**Contraintes respectées :**
- Variable nommée `Component`
- Functional React component
- Hooks : useState, useEffect, useCallback, useMemo, useRef
- API : gristAPI.getData(), addRecord(), updateRecord(), deleteRecord()
- Styles inline (CSS-in-JS)

**Patterns implémentés :**
- **Dashboard :** Métriques, graphiques, navigation
- **CRUD :** Liste, formulaire, édition, suppression

---

### Workflow 4 : Validation Composant

**Vérifications :**
- ✅ Présence de `const Component =`
- ✅ Présence de `return (`
- ✅ Utilisation de gristAPI
- ✅ Hooks React (useState, useEffect)
- ✅ Styles inline
- ✅ Équilibre des accolades
- ✅ Type spécifique (CRUD avec opérations CRUD, Dashboard avec getData)

---

### Workflow 5 : Assemblage Final

**Génère :**
1. **grist_schema.json** - Schéma complet des tables
2. **templates.csv** - Composants prêts pour import Grist
3. **INSTALLATION.md** - Guide étape par étape

**Format CSV :**
```csv
template_id,template_name,component_type,component_code
"dashboard","Tableau de bord","functional","const Component = () => { ... }"
"gestion_produits","Gestion Produits","functional","const Component = () => { ... }"
```

---

## 🧪 Tests et Exemples

### Exemples de Domaines Testables

**1. Gestion de Stock**
```json
{
  "user_input": "Application de gestion de stock avec produits, fournisseurs, commandes et alertes de réapprovisionnement"
}
```

**2. CRM (Gestion Clients)**
```json
{
  "user_input": "CRM pour suivre les clients, opportunités, devis et factures avec pipeline de ventes"
}
```

**3. RH (Ressources Humaines)**
```json
{
  "user_input": "Système RH pour gérer employés, congés, évaluations et contrats"
}
```

**4. Gestion Immobilière**
```json
{
  "user_input": "Application de gestion immobilière avec biens, propriétaires, locataires et contrats de location"
}
```

**5. Gestion de Projets**
```json
{
  "user_input": "Outil de gestion de projets avec tâches, équipes, jalons et budgets"
}
```

---

## 🔍 Monitoring et Debugging

### Logs dans N8N

Chaque workflow produit des logs détaillés :
```
🔍 Workflow 1 - Agent 1: Domaine identifié = gestion_stock
✅ Workflow 1 - Agent 4: 4 tables générées
🔄 Workflow 2 - Loop: Composant 1/6 en cours
✅ Workflow 3 - Agent 5: Code généré (150 lignes)
✅ Workflow 5 - Package: 3 fichiers créés
```

### Erreurs Courantes

**1. "$vars.set is not a function"**
- ❌ Cause : Utilisation de variables N8N (obsolète)
- ✅ Solution : Utiliser `$('NodeName').first().json.output`

**2. "Cannot read property 'json' of undefined"**
- ❌ Cause : Node name incorrect ou inexistant
- ✅ Solution : Vérifier le nom exact du node (sensible à la casse)

**3. "Token limit exceeded"**
- ❌ Cause : Trop de composants générés d'un coup
- ✅ Solution : Workflow 2 limite à 5 composants CRUD max

---

## 📝 Patterns N8N Utilisés

### 1. Node Name References
```javascript
// ✅ CORRECT
const a1Output = $('Edit Fields A1').first().json.output;

// ❌ INCORRECT
const a1Output = $vars.get('agent1_output');
```

### 2. AI Agent Configuration
```json
{
  "promptType": "define",
  "text": "={{ $json.user_message }}",
  "options": {
    "systemMessage": "={{ $json.system_message }}"
  }
}
```

### 3. Edit Fields Pattern
```json
{
  "assignments": {
    "assignments": [
      {
        "name": "output",
        "value": "={{ $json.output }}",
        "type": "object"
      }
    ]
  }
}
```

### 4. Split In Batches Loop
```javascript
// Prepare item for current batch
const component = $json.components_to_generate[$json.batchIndex];

// Process component...

// Loop back to Split In Batches until all items processed
```

---

## 🎯 Roadmap

### v1.1 (Prochaine version)
- [ ] Support pour plus de 5 composants (pagination intelligente)
- [ ] Génération de tests unitaires pour les composants
- [ ] Support pour composants custom (pas seulement Dashboard/CRUD)
- [ ] Intégration directe avec Grist API (création automatique des tables)

### v1.2
- [ ] Workflow 6: Déploiement automatique
- [ ] Workflow 7: Documentation auto-générée
- [ ] Support multi-langues (EN, ES, DE)
- [ ] Interface web pour lancer les workflows

---

## 🤝 Support

**Issues :** Reportez les bugs dans le repository GitHub
**Questions :** Consultez CLAUDE.md pour les instructions détaillées
**Documentation :** Voir TECHNICAL.md pour l'architecture App Nest

---

## 📄 Licence

MIT License - Voir LICENSE

---

**Version:** 1.0-final
**Dernière mise à jour:** 2025-01-06
**Auteur:** Nicolas + Claude AI
