# Workflows N8N App Nest Creator - Guide d'Utilisation

## Vue d'ensemble

Système modulaire de 5 workflows N8N pour générer automatiquement des applications App Nest complètes à partir d'une simple description utilisateur.

### Architecture

```
┌───────────────────────────────────────────────────────────────┐
│  Workflow 1: ANALYSE & SCHÉMA                                 │
│  Input: User request → Output: Schema + Use cases            │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│  Workflow 2: ORCHESTRATEUR COMPOSANTS                         │
│  Loop sur chaque composant                                    │
│    ├─ Appelle Workflow 3 (génération)                        │
│    └─ Appelle Workflow 4 (validation)                        │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│  Workflow 5: ASSEMBLAGE FINAL                                 │
│  Input: All components → Output: Complete application         │
└───────────────────────────────────────────────────────────────┘
```

## Pourquoi 5 Workflows ?

### Problème : Limite de Contexte Albert-code

- **Modèle** : Qwen/Qwen2.5-Coder-32B-Instruct
- **Limite** : 128K tokens de contexte
- **Risque** : Générer 6+ composants en une fois = dépassement

### Solution : Architecture Modulaire

Chaque workflow reste sous 30K tokens en générant/validant **UN composant à la fois**.

## Installation

### 1. Importer les Workflows

Dans N8N, importer les 5 fichiers JSON dans cet ordre :

```bash
1. workflow_1_analyse_schema.json
2. workflow_3_generation_composant.json
3. workflow_4_validation_composant.json
4. workflow_5_assemblage_final.json
5. workflow_2_orchestrateur_composants.json
```

**Important** : Importer dans cet ordre car Workflow 2 référence les workflows 3, 4, 5.

### 2. Configurer les Credentials

Créer les credentials suivants dans N8N :

#### Credential: "Header Albert API"

- Type: `HTTP Header Auth`
- Name: `Header Albert API`
- Header Name: `Authorization`
- Header Value: `Bearer YOUR_ALBERT_API_KEY`

**Appliquer à** :
- Tous les nodes "Albert API - Agent X" dans les 5 workflows

### 3. Activer les Workflows

Activer les 5 workflows dans N8N :

- ✅ Workflow 1 : ACTIF (webhook)
- ✅ Workflow 2 : ACTIF
- ✅ Workflow 3 : ACTIF
- ✅ Workflow 4 : ACTIF
- ✅ Workflow 5 : ACTIF

## Utilisation

### Test Simple

**Requête POST** vers le webhook de Workflow 1 :

```bash
curl -X POST https://your-n8n-instance/webhook/appnest-analyse \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "Je veux une application de gestion de stock avec produits, fournisseurs et commandes"
  }'
```

### Réponse Workflow 1 (Phase 1 uniquement)

```json
{
  "conversation_id": "conv_20250106120000",
  "business_domain": "gestion_stocks",
  "schema": {
    "entities": [
      {
        "table_name": "Produits",
        "columns": [...]
      },
      {
        "table_name": "Fournisseurs",
        "columns": [...]
      },
      {
        "table_name": "Commandes",
        "columns": [...]
      }
    ],
    "total_tables": 3,
    "total_columns": 27
  },
  "use_cases": [...],
  "components_to_generate": [
    {"id": "dashboard", "name": "Tableau de bord"},
    {"id": "gestion_produits", "name": "Gestion Produits"},
    {"id": "gestion_fournisseurs", "name": "Gestion Fournisseurs"},
    {"id": "gestion_commandes", "name": "Gestion Commandes"}
  ],
  "summary": {
    "entities": 3,
    "columns": 27,
    "components": 4,
    "use_cases": 5
  }
}
```

### Appeler manuellement Workflow 2 (pour test)

Si vous voulez tester la génération complète :

1. Copier l'output du Workflow 1
2. Dans N8N, aller dans Workflow 2
3. Cliquer sur "Execute Workflow" manuellement
4. Coller l'output de Workflow 1 en input

Le Workflow 2 va :
- Boucler sur les 4 composants
- Générer chaque composant (Workflow 3)
- Valider chaque composant (Workflow 4)
- Assembler l'application complète (Workflow 5)

### Réponse Finale (Workflow 5)

```json
{
  "success": true,
  "conversation_id": "conv_20250106120000",
  "message": "Application gestion_stocks créée avec succès !",
  "application": {
    "templates_table": [
      {
        "template_id": "dashboard",
        "template_name": "Tableau de bord",
        "component_type": "functional",
        "component_code": "const Component = () => { ... };"
      },
      ...
    ],
    "navigation": {
      "default_component": "dashboard",
      "menu_structure": [...]
    },
    "grist_document_structure": {
      "tables": ["Produits", "Fournisseurs", "Commandes"],
      "widget_configuration": {
        "url": "https://raw.githubusercontent.com/nic01asFr/grist-dynamic-dashboard/main/Grist_App_Nest_v5_2.html",
        "access_level": "full"
      }
    }
  },
  "metadata": {
    "domain": "gestion_stocks",
    "total_components": 4,
    "total_tables": 3,
    "total_columns": 27,
    "generated_at": "2025-01-06T12:00:00.000Z"
  },
  "next_steps": [
    "1. Créer un nouveau document Grist",
    "2. Créer la table 'Templates' avec les colonnes: template_id, template_name, component_type, component_code",
    "3. Importer les 4 composants dans la table Templates",
    "4. Créer les 3 tables métier selon le schéma fourni",
    "5. Ajouter un Custom Widget avec l'URL: https://raw.githubusercontent.com/...",
    "6. Définir Access Level du widget: full",
    "7. L'application se chargera automatiquement"
  ],
  "widget_url": "https://raw.githubusercontent.com/nic01asFr/grist-dynamic-dashboard/main/Grist_App_Nest_v5_2.html"
}
```

## Détail des Workflows

### Workflow 1: Analyse & Schéma

**Rôle** : Analyser la demande utilisateur et créer le schéma complet.

**Agents** :
- Agent 1 : Conversation Manager
- Agent 2 : Intent Analyzer
- Agent 3 : Validation Coordinator
- Agent 4 : Entity Classifier

**Code Nodes (Contextual Prompting)** :
- Code A1→A2 : Formate les entités identifiées pour Agent 2
- Code A2→A3 : Formate les intentions + use cases pour Agent 3
- Code A3→A4 : Formate les spécifications validées pour Agent 4
- Code Prepare Workflow 2 : Détermine les composants à générer

**Output** : Schéma complet + liste composants à générer

### Workflow 2: Orchestrateur Composants

**Rôle** : Boucler sur chaque composant et orchestrer génération + validation.

**Structure** :
1. Initialize : Prépare variables globales
2. Loop Each Component (SplitInBatches) : Boucle sur composants
3. Prepare Component Context : Contexte spécifique au composant
4. Execute Workflow 3 : Génération du composant
5. Execute Workflow 4 : Validation du composant
6. IF Valid? : Test si composant valide
7. Store Valid Component : Stocke dans array
8. All Components Done : Fin de boucle
9. Execute Workflow 5 : Assemblage final

**Variables N8N utilisées** :
- `schema_full` : Schéma complet
- `use_cases_full` : Tous use cases
- `business_domain` : Domaine métier
- `validated_components` : Array JSON des composants validés
- `total_components_expected` : Nombre attendu

### Workflow 3: Génération Composant (Single)

**Rôle** : Générer **UN SEUL** composant à la fois.

**Agents** :
- Agent 10 : Code Generator (single component)

**Code Nodes** :
- Format Prompt A10 : Construit prompt avec contexte réduit pour CE composant uniquement
  - Schéma des tables nécessaires (pas toutes)
  - Use cases liés
  - Exemple de code adapté au type de composant
- Extract Component : Extrait le code généré

**Estimation tokens** : ~20-25K tokens ✅

### Workflow 4: Validation Composant (Single)

**Rôle** : Valider **UN SEUL** composant.

**Agents** :
- Agent 11 : Syntax Validator

**Code Nodes** :
- Format Prompt A11 : Construit prompt de validation avec le code du composant
- Store Component : Stocke composant en validation
- Component Valid : Si valide, retourne avec metadata
- Component Invalid : Si invalide, retourne avec erreurs

**Tests effectués** :
1. ✅ Nom composant : `const Component =`
2. ✅ Pas d'imports
3. ✅ Styles inline
4. ✅ Hooks autorisés uniquement
5. ✅ Validation Array avec `Array.isArray()`
6. ✅ Syntaxe JSX valide

**Estimation tokens** : ~5-12K tokens ✅

### Workflow 5: Assemblage Final

**Rôle** : Assembler tous les composants validés en application complète.

**Agents** :
- Agent 13 : App Assembler

**Code Nodes** :
- Format Prompt A13 : Liste tous composants + schéma pour assemblage
- Prepare Final Response : Formate réponse finale avec instructions

**Output** : Application complète prête à déployer

## Architecture de Prompting Contextuel

### Concept Clé

Chaque agent reçoit des **exemples concrets** basés sur les données réelles des agents précédents.

### Exemple : Agent 1 → Agent 2

**Agent 1** identifie :
```json
{
  "business_domain": "gestion_stocks",
  "extracted_entities": [
    {"name": "Produits", "description": "Articles en stock"},
    {"name": "Fournisseurs", "description": "Entreprises fournissant les produits"}
  ]
}
```

**Code Node A1→A2** crée pour Agent 2 :
```
Domaine métier identifié : gestion_stocks

Entités métier extraites (2 entités) :
1. **Produits** : Articles en stock
2. **Fournisseurs** : Entreprises fournissant les produits

Pour "gestion_stocks", les intentions typiques sont :
- Consultation des Produits
- Gestion CRUD des Fournisseurs
...
```

→ Agent 2 reçoit des exemples **CONCRETS** basés sur le domaine réel identifié !

### Avantages

✅ **Cohérence** : Tous les agents travaillent sur les mêmes concepts
✅ **Précision** : Exemples concrets au lieu de génériques
✅ **Flexibilité** : S'adapte automatiquement à tout domaine
✅ **Debuggabilité** : Variables N8N stockent tous les contextes

## Debugging

### Voir les Variables N8N

Dans N8N, aller dans l'exécution d'un workflow :
1. Cliquer sur "Variables"
2. Voir toutes les variables stockées :
   - `agent1_raw`, `agent2_raw`, etc.
   - `schema_full`, `use_cases_full`
   - `validated_components`

### Logs Console

Les Code Nodes utilisent `console.log()` et `console.error()` :
- ✅ Composant validé et stocké
- ❌ Composant invalide
- Informations de progression

Voir les logs dans N8N : Executions → Click sur execution → Logs

## Exemples d'Utilisation

### Exemple 1: Gestion Immobilière

**Input** :
```json
{
  "user_input": "Application de gestion patrimoniale immobilière pour gérer mes sites, bâtiments et interventions de maintenance"
}
```

**Output** :
- 8 tables : Sites, Bâtiments, Locaux, Équipements, Interventions, Prestataires, Documents, Budget_Patrimoine
- 6 composants : Dashboard, Gestion Sites, Gestion Bâtiments, Gestion Interventions, Suivi Budget, Documents

### Exemple 2: CRM Simple

**Input** :
```json
{
  "user_input": "Je veux un CRM simple avec clients, contacts et opportunités commerciales"
}
```

**Output** :
- 3 tables : Clients, Contacts, Opportunités
- 4 composants : Dashboard, Gestion Clients, Gestion Contacts, Pipeline Opportunités

### Exemple 3: RH

**Input** :
```json
{
  "user_input": "Application RH pour gérer employés, contrats, congés et évaluations"
}
```

**Output** :
- 4 tables : Employés, Contrats, Congés, Évaluations
- 5 composants : Dashboard RH, Gestion Employés, Gestion Congés, Suivi Évaluations, Contrats

## Performance

### Temps d'Exécution Estimé

Pour une application avec 5 composants :

1. **Workflow 1** (Analyse + Schéma) : ~30-45 secondes
2. **Workflow 2** (Orchestration) :
   - Boucle sur 5 composants
   - Chaque composant : Génération (20-30s) + Validation (5-10s)
   - **Total** : ~2-3 minutes
3. **Workflow 5** (Assemblage) : ~15-20 secondes

**Total estimé** : ~3-4 minutes pour application complète

### Limites de Contexte

Chaque workflow reste largement sous 128K tokens :
- Workflow 1 : ~20-25K tokens ✅
- Workflow 3 (par composant) : ~20-25K tokens ✅
- Workflow 4 (par composant) : ~5-12K tokens ✅
- Workflow 5 : ~25-50K tokens ✅

## Troubleshooting

### Erreur: "workflow not found"

**Cause** : Workflow 2 ne trouve pas les workflows 3, 4 ou 5.

**Solution** : Vérifier que les workflows sont importés et actifs. Dans les nodes "Execute Workflow", vérifier que les IDs correspondent aux noms exacts :
- `workflow_3_generation_composant`
- `workflow_4_validation_composant`
- `workflow_5_assemblage_final`

### Erreur: "Albert API credentials not found"

**Cause** : Credentials "Header Albert API" non configurées.

**Solution** : Créer les credentials dans N8N et les appliquer à tous les nodes "Albert API - Agent X".

### Erreur: "Component validation failed"

**Cause** : Un ou plusieurs composants ne respectent pas les contraintes App Nest.

**Solution** :
1. Voir les logs du Workflow 4 pour détails d'erreur
2. Ajuster les prompts d'Agent 10 si nécessaire
3. Option : Implémenter retry automatique dans Workflow 2

### Erreur: "Variable not found"

**Cause** : Variables N8N non initialisées.

**Solution** : S'assurer que Workflow 1 s'est exécuté avant Workflow 2. Les variables sont créées par Workflow 1 et réutilisées par Workflow 2.

## Extensions Possibles

### 1. Retry Automatique

Dans Workflow 2, ajouter logique de retry si composant invalide :
- Max 2 retries par composant
- Ajuster prompt avec feedback d'erreur

### 2. Génération Parallèle

Modifier Workflow 2 pour générer plusieurs composants en parallèle :
- Risque : Consommation API Albert
- Bénéfice : Vitesse x2-3

### 3. Preview Composants

Ajouter node HTTP pour générer preview HTML de chaque composant après génération.

### 4. Export Direct vers Grist

Ajouter nodes HTTP pour créer automatiquement le document Grist et injecter les composants via API Grist.

### 5. Interface Utilisateur

Créer une interface web (React + N8N webhook) pour saisir les besoins et visualiser l'avancement en temps réel.

## Support

Pour toute question ou problème :
1. Vérifier les logs N8N
2. Vérifier les variables N8N
3. Consulter la documentation App Nest (`CLAUDE.md`)
4. Consulter l'architecture modulaire (`WORKFLOW_MODULAR_ARCHITECTURE.md`)
5. Consulter l'architecture de prompting (`WORKFLOW_CONTEXTUAL_PROMPTING.md`)

## Licence

Ce projet utilise :
- N8N (Fair Code Distribution License)
- Albert API (Conditions d'utilisation Albert)
- Grist (Apache 2.0)
- App Nest (Projet open source)
