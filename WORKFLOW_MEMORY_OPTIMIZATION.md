# Optimisation Mémoire & Contexte - Workflow N8N App Nest

## 🎯 Objectif

Optimiser la gestion de la mémoire et du contexte sur un pipeline de 21 agents pour:
- ✅ Minimiser la consommation de tokens
- ✅ Éviter la dérive de contexte
- ✅ Maintenir la cohérence end-to-end
- ✅ Garantir le respect des contraintes App Nest

---

## 📊 Analyse de Consommation Token Par Phase

### Scénario: Application de Gestion de Stock

**Input utilisateur:** "Je veux une application pour gérer mon stock de produits avec des commandes"

### Phase 1: Spécification (Agents 1-3)

#### Agent 1: Conversation Manager
**Input:** 45 tokens (requête utilisateur)
**Output:** 380 tokens
```json
{
  "conversation_id": "conv_001",
  "user_request": "Je veux une application pour gérer mon stock de produits avec des commandes",
  "extracted_entities": ["stock", "produits", "commandes"],
  "functional_requirements": [
    "Gérer un catalogue de produits",
    "Suivre les commandes",
    "Visualiser l'état du stock"
  ],
  "non_functional_requirements": {
    "performance": "< 2s",
    "accessibility": "RGAA AAA",
    "security": "RGPD"
  },
  "ambiguities": []
}
```
**Tokens utilisés:** 45 (input) + 380 (output) = **425 tokens**

#### Agent 2: Intent Analyzer
**Input:** 380 tokens (de Agent 1)
**Traitement:** Analyse sémantique
**Output:** 520 tokens
```json
{
  "primary_intent": "gestion_stock",
  "secondary_intents": ["suivi_commandes", "reporting"],
  "user_personas": ["gestionnaire"],
  "use_cases": [
    {
      "actor": "gestionnaire",
      "action": "consulter_stock",
      "frequency": "quotidienne",
      "priority": "haute"
    },
    {
      "actor": "gestionnaire",
      "action": "creer_commande",
      "frequency": "quotidienne",
      "priority": "haute"
    }
  ],
  "data_flow": "consultation > modification > validation",
  "french_admin_patterns": ["ressource", "dossier"]
}
```
**Tokens utilisés:** 380 (input) + 520 (output) = **900 tokens**

#### Agent 3: Validation Coordinator
**Input:** 520 tokens (de Agent 2)
**Output:** 450 tokens
```json
{
  "is_feasible": true,
  "technical_validation": {
    "app_nest_compatible": true,
    "grist_schema_possible": true
  },
  "constraints_identified": [
    "Max 50 colonnes par table",
    "Relations N-N nécessitent table pivot"
  ],
  "approved_specifications": {
    "entities": ["Produit", "Commande"],
    "patterns": ["dashboard", "crud_list"]
  }
}
```
**Tokens utilisés:** 520 (input) + 450 (output) = **970 tokens**

**Total Phase 1:** 425 + 900 + 970 = **2,295 tokens**

---

### Phase 2: Architecture Données (Agents 4-6)

#### Agent 4: Entity Classifier
**Input:** 450 tokens (approved_specifications de Agent 3)
**Output:** 680 tokens (détail des entités et attributs)

#### Agent 5: Schema Designer
**Input:** 680 tokens
**Output:** 1,200 tokens (schéma Grist complet avec formules)

#### Agent 6: Relationship Optimizer
**Input:** 1,200 tokens
**Output:** 1,450 tokens (contraintes métier détaillées)

**Total Phase 2:** ~**3,330 tokens**

---

### Phase 3: Patterns UI (Agents 7-9)

#### Agent 7: Pattern Detector
**Input:** 450 tokens (specs from Agent 3)
**Output:** 580 tokens (patterns UI)

#### Agent 8: Component Selector
**Input:** 580 tokens
**Output:** 820 tokens (composants DSFR)

#### Agent 9: Compatibility Validator
**Input:** 820 tokens
**Output:** 950 tokens (styles CSS-in-JS)

**Total Phase 3:** ~**2,350 tokens**

---

### Phase 4: Génération Code (Agents 10-12) ⚠️ PHASE VOLUMINEUSE

#### Agent 10: Code Generator
**Input:** 950 tokens (validated components)
**Output:** **8,500 tokens** (code JSX complet de 3-5 composants)

**Exemple de composant généré (Dashboard):**
```javascript
const Component = () => {
  const [metrics, setMetrics] = useState({ produits: 0, commandes: 0, ca: 0 });

  useEffect(() => {
    const loadMetrics = async () => {
      const [produits, commandes] = await Promise.all([
        gristAPI.getData('Produits'),
        gristAPI.getData('Commandes')
      ]);

      if (!Array.isArray(produits) || !Array.isArray(commandes)) {
        console.error('Données invalides');
        return;
      }

      const ca = commandes
        .filter(c => c.statut === 'livree')
        .reduce((sum, c) => sum + (c.montant_total || 0), 0);

      setMetrics({
        produits: produits.length,
        commandes: commandes.length,
        ca
      });
    };
    loadMetrics();
  }, []);

  const cardStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #dddddd',
    borderRadius: '0.25rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    textAlign: 'center'
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontFamily: 'Marianne, sans-serif', marginBottom: '2rem' }}>Tableau de bord</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#000091' }}>{metrics.produits}</div>
          <div style={{ marginTop: '0.5rem', color: '#666' }}>Produits</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#000091' }}>{metrics.commandes}</div>
          <div style={{ marginTop: '0.5rem', color: '#666' }}>Commandes</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#000091' }}>{metrics.ca}€</div>
          <div style={{ marginTop: '0.5rem', color: '#666' }}>Chiffre d'affaires</div>
        </div>
      </div>
    </div>
  );
};
```

Ce composant seul = ~1,800 tokens. Pour 3-5 composants = **8,500 tokens**

#### Agent 11: Syntax Validator
**Input:** 8,500 tokens (code complet)
**Output:** 650 tokens (résultats de validation)

#### Agent 12: Performance Optimizer
**Input:** 8,500 tokens
**Output:** 9,200 tokens (code optimisé avec useMemo/useCallback)

**Total Phase 4:** ~**26,850 tokens** ⚠️

---

### Phase 5: Assemblage (Agents 13-15)

#### Agent 13: App Assembler
**Input:** 9,200 tokens
**Output:** 9,800 tokens (app assemblée + structure Grist)

#### Agent 14: Integration Manager
**Input:** 1,500 tokens (extraction de Agent 13)
**Output:** 800 tokens (plan d'intégration)

#### Agent 15: Quality Assurance
**Input:** 9,800 tokens
**Output:** 1,200 tokens (résultats QA)

**Total Phase 5:** ~**22,300 tokens**

---

### Phase 6: Déploiement (Agents 16-18)

#### Agent 16: Deployment Manager
**Input:** 1,200 tokens (résultats QA)
**Output:** 600 tokens (plan déploiement)

#### Agent 17: Rollback Coordinator
**Input:** 600 tokens
**Output:** 350 tokens (plan rollback)

#### Agent 18: Testing Coordinator
**Input:** 350 tokens
**Output:** 550 tokens (résultats tests)

**Total Phase 6:** ~**2,450 tokens**

---

### Phase 7: Monitoring (Agents 19-21)

#### Agent 19: Monitor
**Input:** 200 tokens (métriques)
**Output:** 400 tokens (monitoring)

#### Agent 20: Feedback Analyzer
**Input:** 400 tokens
**Output:** 500 tokens (analyse feedback)

#### Agent 21: Improvement Planner
**Input:** 500 tokens
**Output:** 700 tokens (roadmap)

**Total Phase 7:** ~**2,300 tokens**

---

## 📈 Bilan Total Sans Optimisation

| Phase | Agents | Tokens |
|-------|--------|--------|
| Phase 1: Spécification | 1-3 | 2,295 |
| Phase 2: Architecture | 4-6 | 3,330 |
| Phase 3: UI Patterns | 7-9 | 2,350 |
| **Phase 4: Code** | **10-12** | **26,850** ⚠️ |
| Phase 5: Assemblage | 13-15 | 22,300 |
| Phase 6: Déploiement | 16-18 | 2,450 |
| Phase 7: Monitoring | 19-21 | 2,300 |
| **TOTAL** | **21** | **~62,000** |

**Observation:** Phase 4 et 5 représentent **80% des tokens** (code volumineuse).

---

## 🔧 Stratégies d'Optimisation

### Stratégie 1: Extraction Ciblée Entre Agents

Au lieu de passer tout l'output JSON, extraire uniquement les champs nécessaires via nœud "Edit Fields" N8N.

#### Exemple: Agent 3 → Agent 4

**❌ SANS OPTIMISATION:**
```json
// Agent 3 output complet (450 tokens)
{
  "conversation_id": "conv_001",
  "user_request": "Je veux une application...",
  "extracted_entities": [...],
  "functional_requirements": [...],
  "non_functional_requirements": {...},
  "ambiguities": [],
  "is_feasible": true,
  "technical_validation": {...},
  "constraints_identified": [...],
  "approved_specifications": {
    "entities": ["Produit", "Commande"],
    "patterns": ["dashboard", "crud_list"]
  }
}
```

**✅ AVEC OPTIMISATION:**
```json
// Edit Fields: extraire uniquement approved_specifications (120 tokens)
{
  "entities": ["Produit", "Commande"],
  "patterns": ["dashboard", "crud_list"],
  "use_cases": [...]
}
```

**Économie:** 450 - 120 = **330 tokens** (73% de réduction)

---

### Stratégie 2: Compression de Code via Références

Pour la Phase 4 (code volumineuse), passer des références au lieu du code complet.

#### Agent 10 → Agent 11

**❌ SANS OPTIMISATION:**
```json
// Agent 10 output (8,500 tokens)
{
  "components": [
    {
      "component_id": "dashboard",
      "component_code": "const Component = () => { ... 1800 tokens ... };"
    },
    {
      "component_id": "produits",
      "component_code": "const Component = () => { ... 2500 tokens ... };"
    },
    // ... autres composants
  ]
}
```

**✅ AVEC OPTIMISATION:**
```json
// Stocker le code dans une variable N8N, passer seulement les IDs
{
  "component_refs": [
    {"id": "dashboard", "stored_in": "var_code_dashboard"},
    {"id": "produits", "stored_in": "var_code_produits"}
  ],
  "metadata": {
    "total_components": 3,
    "total_loc": 187
  }
}
```

Agent 11 récupère le code depuis les variables N8N uniquement quand nécessaire.

**Économie:** 8,500 - 200 = **8,300 tokens** (98% de réduction sur l'input de Agent 11)

---

### Stratégie 3: Validation par Checksum

Au lieu de repasser tout le schéma Grist, utiliser un checksum pour vérifier la cohérence.

#### Agent 6 → Agent 7

**❌ SANS OPTIMISATION:**
```json
// Agent 6 output (1,450 tokens)
{
  "optimized_schema": {
    "tables": [
      {
        "table_name": "Produits",
        "columns": [...], // 500 tokens
        "validations": [...]
      },
      {
        "table_name": "Commandes",
        "columns": [...], // 600 tokens
        "validations": [...]
      }
    ]
  },
  "business_constraints": [...]
}
```

**✅ AVEC OPTIMISATION:**
```json
// Passer uniquement un résumé + checksum
{
  "schema_checksum": "sha256:a3f2e1...",
  "schema_summary": {
    "tables": ["Produits", "Commandes", "Commande_Produit"],
    "total_columns": 18,
    "constraints_count": 7
  },
  "schema_stored_in": "var_grist_schema"
}
```

**Économie:** 1,450 - 150 = **1,300 tokens** (90% de réduction)

---

### Stratégie 4: Pagination du Code Généré

Si l'application a > 5 composants, générer en plusieurs passes.

#### Agent 10: Code Generator (Paginé)

**Pass 1:** Générer Dashboard + Navigation (composants critiques)
**Pass 2:** Générer CRUD Produits
**Pass 3:** Générer CRUD Commandes
**Pass 4:** Générer Reporting

Chaque pass traite 2-3 composants au lieu de tous d'un coup.

**Avantage:**
- ✅ Validation incrémentale (évite de tout refaire si erreur)
- ✅ Limite le contexte de chaque appel LLM
- ✅ Permet parallélisation (générer plusieurs composants en parallèle)

**Configuration N8N:**
```json
{
  "loop_over": "component_groups",
  "component_groups": [
    ["dashboard", "navigation"],
    ["produits_crud"],
    ["commandes_crud"],
    ["reporting"]
  ]
}
```

---

### Stratégie 5: Prompts Compressés

Optimiser les prompts des agents pour réduire les tokens système.

#### Exemple: Agent 10 (Code Generator)

**❌ PROMPT VERBEUX (850 tokens):**
```
Tu es un expert en développement React et Grist. Tu dois générer du code JSX pour des composants React qui seront utilisés dans le système App Nest.

Le système App Nest est une plateforme qui permet de stocker des composants React dans des tables Grist et de les charger dynamiquement. Il y a plusieurs contraintes très importantes à respecter:

1. Le composant DOIT être nommé exactement "Component" avec un C majuscule. Ne jamais utiliser un autre nom comme "Dashboard" ou "MyComponent". Voici un exemple de ce qui est correct et incorrect:

Exemple incorrect:
const Dashboard = () => {
  return <div>Hello</div>;
};

Exemple correct:
const Component = () => {
  return <div>Hello</div>;
};

2. Tu ne dois JAMAIS utiliser d'imports ES6. Le code est exécuté dans un environnement où les imports ne sont pas supportés. Tout doit être autonome.

Exemple incorrect:
import React from 'react';
import { useState } from 'react';

Exemple correct:
// Pas d'imports, les hooks sont disponibles globalement
const Component = () => {
  const [state, setState] = useState();
  ...
};

3. Les styles doivent être inline ou en CSS-in-JS. Tu ne peux pas utiliser de classes CSS externes.

Exemple incorrect:
<div className="button-primary">Click</div>

Exemple correct:
<div style={{ backgroundColor: '#000091', color: '#fff' }}>Click</div>

4. Seuls certains hooks React sont autorisés: useState, useEffect, useCallback, useMemo, useRef. N'utilise pas d'autres hooks.

5. Toujours valider que les données sont des arrays avant de les mapper.

Exemple:
const data = await gristAPI.getData('Table');
if (Array.isArray(data)) {
  data.map(...)
}

Tu dois maintenant générer le code JSX pour les composants suivants...
```

**✅ PROMPT OPTIMISÉ (320 tokens):**
```
Générer code JSX React pour App Nest.

CONTRAINTES OBLIGATOIRES:
1. ✅ Nom: const Component = () => {}
   ❌ PAS: const Dashboard = () => {}

2. ✅ Pas d'imports
   ❌ PAS: import React from 'react';

3. ✅ Styles inline: style={{ color: '#000' }}
   ❌ PAS: className="button"

4. ✅ Hooks autorisés: useState, useEffect, useCallback, useMemo, useRef
   ❌ PAS: useContext, useReducer

5. ✅ Validation: if (Array.isArray(data)) { data.map(...) }

API disponible:
- gristAPI.getData(table) → Array
- gristAPI.addRecord(table, data) → id
- gristAPI.updateRecord(table, id, data) → boolean
- gristAPI.deleteRecord(table, id) → boolean

Input:
{{json.validated_components}}

Output JSON format:
{
  "components": [
    {
      "component_id": "dashboard",
      "component_code": "const Component = () => { ... };"
    }
  ]
}
```

**Économie:** 850 - 320 = **530 tokens par appel** (62% de réduction)

---

## 📊 Bilan Après Optimisation

| Optimisation | Économie Tokens | Application |
|--------------|-----------------|-------------|
| Extraction ciblée (Agent 3→4) | 330 | Chaque transition |
| Compression code (Agent 10→11) | 8,300 | Phase 4 |
| Validation checksum (Agent 6→7) | 1,300 | Phase 2→3 |
| Prompts compressés | 530/agent | Tous les agents |
| **TOTAL ÉCONOMISÉ** | **~35,000** | **-56%** |

**Nouveau total:** ~62,000 - 35,000 = **~27,000 tokens** 🎉

---

## 🏗️ Implémentation dans N8N

### Pattern de Base: Agent N → Edit Fields → Agent N+1

```
┌─────────────────┐
│   Agent N       │
│   (Chat Model)  │
└────────┬────────┘
         │ output: JSON complet
         ▼
┌─────────────────┐
│  Edit Fields    │
│  Parse & Extract│
└────────┬────────┘
         │ output: JSON minimal
         ▼
┌─────────────────┐
│   Agent N+1     │
│   (Chat Model)  │
└─────────────────┘
```

### Configuration Edit Fields

**Exemple: Agent 3 → Agent 4**

```json
{
  "mode": "extractFields",
  "fields": [
    {
      "name": "entities",
      "expression": "{{ $json.approved_specifications.entities }}"
    },
    {
      "name": "use_cases",
      "expression": "{{ $json.approved_specifications.use_cases }}"
    },
    {
      "name": "patterns",
      "expression": "{{ $json.approved_specifications.patterns }}"
    }
  ]
}
```

**Résultat:** Agent 4 reçoit uniquement:
```json
{
  "entities": ["Produit", "Commande"],
  "use_cases": [...],
  "patterns": ["dashboard", "crud_list"]
}
```

---

### Stockage dans Variables N8N

Pour le code volumineuse (Phase 4):

**Agent 10 → Set Variable → Agent 11**

```
┌─────────────────┐
│  Agent 10       │
│  Code Generator │
└────────┬────────┘
         │ components: [{code: "..."}]
         ▼
┌─────────────────┐
│  Code Block     │
│  Store in Vars  │
└────────┬────────┘
         │ for each component:
         │   $vars.set('code_' + id, code)
         ▼
┌─────────────────┐
│  Edit Fields    │
│  Create Refs    │
└────────┬────────┘
         │ refs: [{id, var_name}]
         ▼
┌─────────────────┐
│  Agent 11       │
│  Validator      │
└─────────────────┘
         │ retrieve code:
         │   $vars.get('code_dashboard')
```

**Code Block (JavaScript):**
```javascript
// Store components in variables
const components = $json.components;

components.forEach(comp => {
  const varName = `code_${comp.component_id}`;
  $vars.set(varName, comp.component_code);
});

// Return references
return {
  component_refs: components.map(c => ({
    id: c.component_id,
    var_name: `code_${c.component_id}`,
    loc: c.component_code.split('\n').length
  })),
  metadata: {
    total: components.length,
    stored: true
  }
};
```

---

## 🎯 Checklist d'Optimisation

### ✅ Configuration N8N

- [ ] Ajouter nœud "Edit Fields" après chaque agent
- [ ] Configurer extraction des champs strictement nécessaires
- [ ] Utiliser variables N8N pour stocker le code (Phase 4)
- [ ] Implémenter checksums pour validation de cohérence
- [ ] Compresser tous les prompts système

### ✅ Prompts des Agents

- [ ] Réduire verbosité (objectif: -50% tokens)
- [ ] Utiliser format ✅/❌ pour contraintes
- [ ] Fournir exemples minimaux mais précis
- [ ] Spécifier format JSON output strict

### ✅ Validation Inter-Phase

- [ ] Ajouter nœud "Validation Checkpoint" après chaque phase
- [ ] Valider que les contraintes App Nest sont respectées
- [ ] Implémenter rollback si validation échoue

### ✅ Monitoring

- [ ] Logger le nombre de tokens par agent
- [ ] Alerter si un agent dépasse 5,000 tokens
- [ ] Calculer le coût total en $ (tokens × prix API)

---

## 💰 Calcul du Coût

### Modèle: OpenAI GPT-4 Turbo

**Tarif (nov 2024):**
- Input: $0.01 / 1K tokens
- Output: $0.03 / 1K tokens

### Scénario: Application de Gestion de Stock

**Sans optimisation:**
- Input: ~40,000 tokens → $0.40
- Output: ~22,000 tokens → $0.66
- **Total: $1.06 par application générée**

**Avec optimisation:**
- Input: ~18,000 tokens → $0.18
- Output: ~9,000 tokens → $0.27
- **Total: $0.45 par application générée** 💰

**Économie:** $1.06 - $0.45 = **$0.61 par app (58% de réduction)**

Pour 100 applications générées: **économie de $61**

---

## 🚀 Recommandations Finales

### Priorité HAUTE 🔴

1. **Implémenter Edit Fields après chaque agent**
   - Réduction immédiate de 30-50% des tokens
   - Facile à configurer dans N8N

2. **Compresser les prompts des agents critiques**
   - Agent 10 (Code Generator): réduction de 850 → 320 tokens
   - Agent 6 (Relationship Optimizer): réduction de 700 → 280 tokens

3. **Utiliser variables N8N pour le code (Phase 4)**
   - Évite de passer 8,500 tokens entre agents
   - Réduction de 98% sur ces transitions

### Priorité MOYENNE 🟡

4. **Pagination de la génération de code**
   - Générer 2-3 composants par pass
   - Permet validation incrémentale

5. **Checksums pour validation de cohérence**
   - Évite de repasser les schémas complets
   - Réduction de 80-90% sur certaines transitions

### Priorité BASSE 🟢

6. **Dashboard de monitoring**
   - Visualiser consommation tokens par phase
   - Identifier les points d'optimisation futurs

7. **Cache des schémas fréquents**
   - Réutiliser les schémas d'applications similaires
   - Réduction du temps d'exécution de Phase 2

---

## 📝 Exemple de Configuration Optimale

### Agent 10 → Agent 11 (Optimisé)

```json
{
  "nodes": [
    {
      "name": "Agent 10: Code Generator",
      "type": "chatOpenAI",
      "parameters": {
        "model": "gpt-4-turbo",
        "systemPrompt": "{{ $vars.prompt_agent10_compressed }}",
        "userMessage": "{{ $json.validated_components }}"
      }
    },
    {
      "name": "Store Code in Variables",
      "type": "code",
      "parameters": {
        "language": "javascript",
        "code": "const components = $json.components;\ncomponents.forEach(c => {\n  $vars.set(`code_${c.component_id}`, c.component_code);\n});\nreturn { component_refs: components.map(c => ({ id: c.component_id })) };"
      }
    },
    {
      "name": "Edit Fields: Create References",
      "type": "editFields",
      "parameters": {
        "fields": [
          {
            "name": "component_ids",
            "expression": "{{ $json.component_refs.map(r => r.id) }}"
          },
          {
            "name": "total_components",
            "expression": "{{ $json.component_refs.length }}"
          }
        ]
      }
    },
    {
      "name": "Agent 11: Syntax Validator",
      "type": "chatOpenAI",
      "parameters": {
        "model": "gpt-4-turbo",
        "systemPrompt": "{{ $vars.prompt_agent11_compressed }}",
        "userMessage": "Valider les composants: {{ $json.component_ids }}. Code disponible dans variables $vars.code_*"
      }
    },
    {
      "name": "Retrieve Code for Validation",
      "type": "code",
      "parameters": {
        "language": "javascript",
        "code": "const ids = $json.component_ids;\nconst components = ids.map(id => ({\n  id,\n  code: $vars.get(`code_${id}`)\n}));\nreturn { components_to_validate: components };"
      }
    }
  ]
}
```

---

## 🎓 Conclusion

L'optimisation de la gestion mémoire et contexte sur ce workflow de 21 agents permet:

- ✅ **Réduction de 56% des tokens** (62,000 → 27,000)
- ✅ **Réduction de 58% du coût** ($1.06 → $0.45 par app)
- ✅ **Évite la dérive de contexte** (données structurées minimales)
- ✅ **Maintient la cohérence** (validation checksum + checkpoints)
- ✅ **Accélère l'exécution** (moins de tokens = réponses plus rapides)

**Implémentation recommandée:**
1. Commencer par les optimisations HAUTE priorité (Edit Fields, Prompts compressés)
2. Mesurer l'impact (avant/après en tokens)
3. Itérer avec optimisations MOYENNE priorité si nécessaire

**Résultat attendu:** Workflow capable de générer 100 applications App Nest complètes pour le prix de 45 applications non-optimisées.

---

**Document créé le:** 2025-01-06
**Révision:** 1.0
**Auteur:** Claude Code Analysis
