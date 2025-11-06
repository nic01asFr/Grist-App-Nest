# Architecture Modulaire des Workflows N8N

## Problématique : Limites de Contexte

**Modèle Albert-code** : Qwen/Qwen2.5-Coder-32B-Instruct
**Limite de contexte** : 128K tokens

### Calcul de tokens pour génération complète :
- Schéma complet (8 tables, 67 colonnes) : ~15K tokens
- Instructions Agent 10 : ~5K tokens
- Exemples de code par composant : ~8K tokens
- **Génération de 6 composants en une fois** : ~60K tokens
- Marge de sécurité : **Risque de dépassement**

## Solution : Workflows Modulaires

Fragmenter en **4 workflows distincts** qui s'appellent entre eux :

```
┌─────────────────────────────────────────────────────────────┐
│  WORKFLOW 1: ANALYSE & SCHÉMA                               │
│  (Main Workflow)                                             │
│                                                              │
│  User Input → A1 → A2 → A3 → A4                             │
│  Output: Schéma complet, Use cases, Entités                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
                  (Appelle Workflow 2)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  WORKFLOW 2: ORCHESTRATEUR COMPOSANTS                       │
│                                                              │
│  Input: Schéma + Use cases                                  │
│  Détermine composants à créer → Boucle sur chaque composant │
│                                                              │
│  Pour chaque composant:                                     │
│    → Appelle Workflow 3 (Génération)                        │
│    → Appelle Workflow 4 (Validation)                        │
│    → Stocke résultat                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
                  (Tous composants prêts)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  WORKFLOW 5: ASSEMBLAGE FINAL                               │
│                                                              │
│  Input: Tous composants validés                             │
│  → A13: App Assembler                                       │
│  → Création document Grist                                  │
│  → Injection composants                                     │
│  Output: Application complète prête                         │
└─────────────────────────────────────────────────────────────┘
```

### Détail des Workflows

---

## WORKFLOW 1: ANALYSE & SCHÉMA
**Fichier** : `workflow_1_analyse_schema.json`
**Déclencheur** : Webhook POST

### Agents
- **Agent 1** : Conversation Manager
- **Agent 2** : Intent Analyzer
- **Agent 3** : Validation Coordinator
- **Agent 4** : Entity Classifier

### Code Nodes (Contextual Formatting)
- **Code A1→A2** : Formate domaine + entités pour Agent 2
- **Code A2→A3** : Formate intentions + use cases pour Agent 3
- **Code A3→A4** : Formate spécifications validées pour Agent 4
- **Code A4→Output** : Prépare données pour Workflow 2

### Output
```json
{
  "conversation_id": "conv_xxx",
  "business_domain": "gestion_stocks",
  "entities": [...],
  "use_cases": [...],
  "schema": {
    "entities": [
      {
        "table_name": "Produits",
        "columns": [...],
        "relationships": [...]
      }
    ],
    "total_tables": 5,
    "total_columns": 42
  },
  "components_to_generate": [
    {"id": "dashboard", "name": "Tableau de bord", "priority": 1},
    {"id": "gestion_produits", "name": "Gestion Produits", "priority": 2},
    {"id": "gestion_fournisseurs", "name": "Gestion Fournisseurs", "priority": 3}
  ]
}
```

### Node Final : Execute Workflow
```json
{
  "parameters": {
    "workflowId": "workflow_2_orchestrateur_composants",
    "options": {
      "waitForCompletion": true
    },
    "fieldsToSend": {
      "fields": [
        {
          "fieldName": "schema",
          "fieldValue": "={{ $json.schema }}"
        },
        {
          "fieldName": "use_cases",
          "fieldValue": "={{ $json.use_cases }}"
        },
        {
          "fieldName": "components_to_generate",
          "fieldValue": "={{ $json.components_to_generate }}"
        }
      ]
    }
  }
}
```

---

## WORKFLOW 2: ORCHESTRATEUR COMPOSANTS
**Fichier** : `workflow_2_orchestrateur_composants.json`
**Déclencheur** : Execute Workflow Trigger

### Structure
```
Input (from Workflow 1)
    ↓
[Code] Préparer liste composants
    ↓
[Loop] Pour chaque composant:
    ├─ [Execute Workflow 3] Génération composant
    ├─ [Execute Workflow 4] Validation composant
    └─ [Code] Stocker composant validé dans array
    ↓
[Code] Vérifier tous composants OK
    ↓
[Execute Workflow 5] Assemblage final
```

### Node Loop (SplitInBatches)
```json
{
  "parameters": {
    "batchSize": 1,
    "options": {}
  },
  "name": "Loop Each Component",
  "type": "n8n-nodes-base.splitInBatches"
}
```

### Code Node : Préparer Context Composant
```javascript
// Pour chaque itération de boucle
const schema = JSON.parse($vars.get('schema_full'));
const useCases = JSON.parse($vars.get('use_cases_full'));
const currentComponent = $input.first().json;

// Construire contexte spécifique pour CE composant
const componentContext = {
  component_id: currentComponent.id,
  component_name: currentComponent.name,
  component_priority: currentComponent.priority,

  // Schéma complet (toutes les tables)
  schema: schema,

  // Use cases liés à CE composant
  related_use_cases: useCases.filter(uc =>
    uc.description.toLowerCase().includes(currentComponent.id.toLowerCase())
  ),

  // Tables nécessaires pour CE composant
  required_tables: determineRequiredTables(currentComponent.id, schema, useCases)
};

function determineRequiredTables(componentId, schema, useCases) {
  if (componentId === 'dashboard') {
    return schema.entities.slice(0, 5).map(e => e.table_name);
  }

  if (componentId.startsWith('gestion_')) {
    const tableName = componentId.replace('gestion_', '');
    return [tableName.charAt(0).toUpperCase() + tableName.slice(1)];
  }

  // Déterminer depuis use cases
  const relatedUC = useCases.filter(uc =>
    uc.description.toLowerCase().includes(componentId.toLowerCase())
  );

  return [...new Set(relatedUC.flatMap(uc => uc.data_required))];
}

return componentContext;
```

### Node Execute Workflow 3 (Génération)
```json
{
  "parameters": {
    "workflowId": "workflow_3_generation_composant",
    "options": {
      "waitForCompletion": true
    },
    "fieldsToSend": {
      "fields": [
        {
          "fieldName": "component_context",
          "fieldValue": "={{ $json }}"
        }
      ]
    }
  }
}
```

### Node Code : Stocker Composant Validé
```javascript
// Récupérer array des composants (ou initialiser)
let validatedComponents = [];
try {
  validatedComponents = JSON.parse($vars.get('validated_components') || '[]');
} catch(e) {
  validatedComponents = [];
}

// Ajouter le nouveau composant validé
const newComponent = $input.first().json;
validatedComponents.push({
  component_id: newComponent.component_id,
  component_name: newComponent.template_name,
  component_code: newComponent.component_code,
  validation_status: newComponent.validation_status,
  generated_at: new Date().toISOString()
});

// Sauvegarder
$vars.set('validated_components', JSON.stringify(validatedComponents));

return {
  total_components: validatedComponents.length,
  latest_component: newComponent.component_id,
  all_components: validatedComponents
};
```

---

## WORKFLOW 3: GÉNÉRATION COMPOSANT
**Fichier** : `workflow_3_generation_composant.json`
**Déclencheur** : Execute Workflow Trigger

### Structure
```
Input (component_context from Workflow 2)
    ↓
[Code] Format Prompt Agent 10 (contexte spécifique composant)
    ↓
[Agent 10] Code Generator (génère UN SEUL composant)
    ↓
[Albert API] Model: albert-code (Qwen/Qwen2.5-Coder-32B-Instruct)
    ↓
[Code] Extract Component Code
    ↓
Output: Composant généré
```

### Code Node : Format Prompt A10 (Contexte Réduit)
```javascript
const context = $input.first().json.component_context;

// System Prompt (statique)
const systemPrompt = `Tu es Agent 10: Code Generator.
Ton rôle : Générer le code JSX React pour UN SEUL composant App Nest.
IMPORTANT : Respecter STRICTEMENT les contraintes App Nest.`;

// User Prompt (contexte minimal pour CE composant uniquement)
const userPrompt = `## COMPOSANT À GÉNÉRER

**ID** : ${context.component_id}
**Nom** : ${context.component_name}
**Priorité** : ${context.component_priority}

---

## SCHÉMA DES TABLES NÉCESSAIRES

${context.required_tables.map(tableName => {
  const entity = context.schema.entities.find(e => e.table_name === tableName);
  if (!entity) return '';

  return `**Table: ${entity.table_name}**
Type: ${entity.entity_type}
Colonnes:
${entity.columns.slice(0, 10).map(col => `  - ${col.column_name} (${col.column_type})`).join('\n')}
${entity.columns.length > 10 ? `  ... ${entity.columns.length - 10} autres colonnes` : ''}
`;
}).join('\n')}

---

## USE CASES LIÉS

${context.related_use_cases.slice(0, 3).map(uc => `
**${uc.uc_id}** : ${uc.description}
- Actor: ${uc.actor}
- Priority: ${uc.priority}
- Data: ${uc.data_required.join(', ')}
`).join('\n')}

---

## CONTRAINTES APP NEST (STRICT)

✅ **Nom composant** : const Component = () => {}
❌ PAS : const ${context.component_name.replace(/\s/g, '')} = () => {}

✅ **API Grist disponible** :
${context.required_tables.map(t => `- gristAPI.getData('${t}')`).join('\n')}
${context.required_tables.map(t => `- gristAPI.addRecord('${t}', data)`).join('\n')}
${context.required_tables.map(t => `- gristAPI.updateRecord('${t}', id, data)`).join('\n')}

✅ **Validation Array OBLIGATOIRE** :
\`\`\`javascript
const data = await gristAPI.getData('${context.required_tables[0]}');
if (Array.isArray(data)) {
  // traiter data
}
\`\`\`

✅ **Pas d'imports** : AUCUN import/require
✅ **Styles inline** : style={{...}} uniquement
✅ **Hooks autorisés** : useState, useEffect, useCallback, useMemo, useRef

---

## EXEMPLE DE CODE pour "${context.component_id}"

${generateComponentExample(context)}

---

## FORMAT DE SORTIE

Réponds UNIQUEMENT avec ce JSON (pas de texte avant/après) :

\`\`\`json
{
  "component_id": "${context.component_id}",
  "template_name": "${context.component_name}",
  "component_type": "functional",
  "component_code": "const Component = () => { ... };"
}
\`\`\`

Génère le code complet pour CE composant uniquement.
`;

function generateComponentExample(context) {
  if (context.component_id === 'dashboard') {
    return `\`\`\`javascript
const Component = () => {
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    const loadMetrics = async () => {
      ${context.required_tables.slice(0, 3).map(table =>
        `const ${table.toLowerCase()} = await gristAPI.getData('${table}');`
      ).join('\n      ')}

      setMetrics({
        ${context.required_tables.slice(0, 3).map(table =>
          `${table.toLowerCase()}: Array.isArray(${table.toLowerCase()}) ? ${table.toLowerCase()}.length : 0`
        ).join(',\n        ')}
      });
    };
    loadMetrics();
  }, []);

  return (
    <div style={{padding: '20px', fontFamily: 'Marianne, sans-serif'}}>
      <h1>Tableau de bord</h1>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px'}}>
        ${context.required_tables.slice(0, 3).map(table => `
        <div style={{backgroundColor: '#fff', padding: '20px', borderRadius: '8px'}}>
          <h3>${table}</h3>
          <p style={{fontSize: '2rem'}}>{metrics.${table.toLowerCase()} || 0}</p>
        </div>`).join('')}
      </div>
    </div>
  );
};
\`\`\``;}

  // Exemple CRUD pour composants gestion_*
  if (context.component_id.startsWith('gestion_')) {
    const tableName = context.required_tables[0];
    const entity = context.schema.entities.find(e => e.table_name === tableName);

    return `\`\`\`javascript
const Component = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({});

  const loadItems = async () => {
    const data = await gristAPI.getData('${tableName}');
    if (Array.isArray(data)) {
      setItems(data);
    }
  };

  const saveItem = async () => {
    await gristAPI.addRecord('${tableName}', formData);
    setFormData({});
    await loadItems();
  };

  useEffect(() => { loadItems(); }, []);

  return (
    <div style={{padding: '20px'}}>
      <h1>Gestion ${tableName}</h1>

      {/* Formulaire */}
      <div style={{marginBottom: '20px'}}>
        ${entity.columns.slice(1, 4).map(col => `
        <input
          placeholder="${col.column_name}"
          value={formData.${col.column_name} || ''}
          onChange={(e) => setFormData({...formData, ${col.column_name}: e.target.value})}
        />`).join('')}
        <button onClick={saveItem}>Enregistrer</button>
      </div>

      {/* Liste */}
      <div>
        {items.map(item => (
          <div key={item.id} style={{padding: '10px', borderBottom: '1px solid #ddd'}}>
            {item.${entity.columns[1].column_name}}
          </div>
        ))}
      </div>
    </div>
  );
};
\`\`\``;
  }

  return '// Exemple spécifique au composant...';
}

return {
  system_prompt: systemPrompt,
  user_prompt: userPrompt,
  component_id: context.component_id,
  context_size_estimate: `${Math.round((systemPrompt.length + userPrompt.length) / 4)} tokens`
};
```

### Agent 10 : Code Generator
```json
{
  "parameters": {
    "agent": "conversationalAgent",
    "promptType": "define",
    "text": "={{ $json.system_prompt }}\n\n{{ $json.user_prompt }}",
    "options": {}
  },
  "name": "Agent 10: Code Generator (Single Component)",
  "type": "@n8n/n8n-nodes-langchain.agent"
}
```

### Albert API Connection
```json
{
  "parameters": {
    "model": "albert-code",
    "options": {
      "temperature": 0.3,
      "maxTokens": 4096
    }
  },
  "credentials": {
    "openAiApi": {
      "id": "albert-api-header",
      "name": "Header Albert API"
    }
  }
}
```

---

## WORKFLOW 4: VALIDATION COMPOSANT
**Fichier** : `workflow_4_validation_composant.json`
**Déclencheur** : Execute Workflow Trigger

### Structure
```
Input (composant généré from Workflow 3)
    ↓
[Code] Format Prompt Agent 11
    ↓
[Agent 11] Syntax Validator
    ↓
[Albert API] Model: albert-code
    ↓
[IF] Valid?
    ├─ OUI → Return composant validé
    └─ NON → Return erreur (retry dans Workflow 2)
```

### Code Node : Format Prompt A11
```javascript
const component = $input.first().json;

const systemPrompt = `Tu es Agent 11: Syntax Validator.
Ton rôle : Valider qu'UN composant respecte les contraintes App Nest.`;

const userPrompt = `## COMPOSANT À VALIDER

**ID** : ${component.component_id}
**Nom** : ${component.template_name}

**Code** :
\`\`\`javascript
${component.component_code}
\`\`\`

---

## 6 TESTS OBLIGATOIRES

1. **Nom Composant** : Doit contenir "const Component ="
   Regex: \`const\\s+Component\\s*=\\s*\\(\`

2. **Pas d'Imports** : Aucun "import" ou "require"
   Vérifier absence de: import, require

3. **Styles Inline** : Pas de "className"
   Vérifier absence de: className

4. **Hooks Autorisés** : Uniquement useState, useEffect, useCallback, useMemo, useRef
   Vérifier absence de: useReducer, useImperativeHandle

5. **Validation Array** : Si gristAPI.getData présent → Array.isArray présent
   Pattern: \`gristAPI\\.getData\` → doit avoir \`Array\\.isArray\`

6. **Syntaxe JSX** : Code doit être transformable par Babel

---

## FORMAT DE SORTIE

Réponds UNIQUEMENT avec ce JSON :

\`\`\`json
{
  "component_id": "${component.component_id}",
  "valid": true,
  "errors": [],
  "warnings": [],
  "constraints_checklist": {
    "component_naming": "✅ OK",
    "no_imports": "✅ OK",
    "inline_styles": "✅ OK",
    "allowed_hooks": "✅ OK",
    "array_validation": "✅ OK",
    "jsx_syntax": "✅ OK"
  },
  "validation_status": "VALID"
}
\`\`\`

Si erreur, mettre valid: false et décrire dans errors[].
`;

return {
  system_prompt: systemPrompt,
  user_prompt: userPrompt,
  component_id: component.component_id,
  component_to_validate: component
};
```

---

## WORKFLOW 5: ASSEMBLAGE FINAL
**Fichier** : `workflow_5_assemblage_final.json`
**Déclencheur** : Execute Workflow Trigger

### Structure
```
Input (all validated components from Workflow 2)
    ↓
[Code] Format Prompt Agent 13
    ↓
[Agent 13] App Assembler
    ↓
[Albert API] Model: albert-code
    ↓
[Code] Prepare Grist Document Structure
    ↓
[HTTP] Create Grist Document (optionnel)
    ↓
Output: Application complète avec instructions
```

### Code Node : Format Prompt A13
```javascript
const validatedComponents = $input.first().json.validated_components;
const schema = JSON.parse($vars.get('schema_full'));
const businessDomain = $vars.get('business_domain');

const systemPrompt = `Tu es Agent 13: App Assembler.
Ton rôle : Assembler tous les composants validés en application complète.`;

const userPrompt = `## APPLICATION À ASSEMBLER

**Domaine** : ${businessDomain}
**Tables** : ${schema.total_tables} tables
**Composants validés** : ${validatedComponents.length} composants

---

## COMPOSANTS DISPONIBLES

${validatedComponents.map((comp, i) => `
${i+1}. **${comp.component_id}** : ${comp.component_name}
   - Type: ${comp.component_type}
   - Status: ${comp.validation_status}
   - Taille: ${Math.round(comp.component_code.length / 4)} tokens
`).join('\n')}

---

## SCHÉMA DES TABLES

${schema.entities.map(entity => `
**${entity.table_name}** (${entity.entity_type})
- ${entity.columns.length} colonnes
- Relations: ${entity.relationships?.length || 0}
`).join('\n')}

---

## TA MISSION

Assemble l'application complète avec :

1. **Table Templates** (structure Grist) avec ces ${validatedComponents.length} composants
2. **Navigation** : Menu avec ordre logique
3. **Configuration widget** : URL widget Grist_App_Nest_v5_2.html

---

## FORMAT DE SORTIE

Réponds UNIQUEMENT avec ce JSON :

\`\`\`json
{
  "assembled_app": {
    "templates_table": [
      {
        "template_id": "dashboard",
        "template_name": "Tableau de bord",
        "component_type": "functional",
        "component_code": "const Component = () => { ... };"
      }
    ],
    "navigation": {
      "default_component": "dashboard",
      "menu_structure": [
        {"id": "dashboard", "label": "Tableau de bord", "order": 1}
      ]
    },
    "grist_document_structure": {
      "tables": [${schema.entities.map(e => `"${e.table_name}"`).join(', ')}],
      "widget_configuration": {
        "url": "https://raw.githubusercontent.com/nic01asFr/grist-dynamic-dashboard/main/Grist_App_Nest_v5_2.html",
        "access_level": "full"
      }
    }
  }
}
\`\`\`
`;

return {
  system_prompt: systemPrompt,
  user_prompt: userPrompt,
  components_count: validatedComponents.length,
  tables_count: schema.total_tables
};
```

---

## Avantages de l'Architecture Modulaire

### 1. Gestion du Contexte (128K tokens)
- ✅ **Workflow 3** génère UN composant à la fois : ~20-30K tokens max
- ✅ Pas de risque de dépassement
- ✅ Contexte optimisé pour chaque composant

### 2. Parallélisation Possible
- Workflow 2 peut appeler Workflow 3 en parallèle pour plusieurs composants
- Accélère la génération

### 3. Robustesse
- Si un composant échoue, les autres continuent
- Retry possible par composant

### 4. Debuggabilité
- Logs séparés par workflow
- Variables N8N claires
- Facile à tester composant par composant

### 5. Maintenabilité
- Chaque workflow a un rôle clair
- Modifications isolées
- Réutilisable pour d'autres projets

---

## Variables N8N Globales

Ces variables sont partagées entre workflows :

```
schema_full                 → Schéma complet (toutes tables)
use_cases_full             → Tous use cases
business_domain            → Domaine métier
conversation_id            → ID conversation
validated_components       → Array des composants validés (JSON)
total_components_expected  → Nombre total à générer
current_component_index    → Index actuel dans boucle
```

---

## Estimation des Tokens par Workflow

### Workflow 1 (Analyse & Schéma)
- Input utilisateur : 0.5-2K tokens
- Agent 1 : 3K tokens
- Agent 2 : 5K tokens
- Agent 3 : 4K tokens
- Agent 4 : 8K tokens
- **Total : ~20-25K tokens** ✅

### Workflow 3 (Génération 1 Composant)
- Schéma réduit (3-5 tables) : 5K tokens
- Use cases liés : 2K tokens
- Instructions : 3K tokens
- Exemple code : 5K tokens
- Génération output : 8K tokens
- **Total : ~20-25K tokens** ✅

### Workflow 4 (Validation 1 Composant)
- Code à valider : 2-8K tokens
- Instructions validation : 2K tokens
- Output : 1K tokens
- **Total : ~5-12K tokens** ✅

### Workflow 5 (Assemblage)
- Tous composants : 15-40K tokens (dépend du nombre)
- Schéma : 8K tokens
- Instructions : 3K tokens
- **Total : ~25-50K tokens** ✅

**Conclusion** : Tous les workflows restent largement sous 128K tokens.

---

## Exemple de Flux Complet

### Input Utilisateur
```
"Je veux une application de gestion de stock avec produits, fournisseurs et commandes"
```

### Workflow 1 Output
```json
{
  "business_domain": "gestion_stocks",
  "entities": ["Produits", "Fournisseurs", "Commandes"],
  "components_to_generate": [
    {"id": "dashboard", "name": "Tableau de bord"},
    {"id": "gestion_produits", "name": "Gestion Produits"},
    {"id": "gestion_fournisseurs", "name": "Gestion Fournisseurs"},
    {"id": "gestion_commandes", "name": "Gestion Commandes"}
  ]
}
```

### Workflow 2 Loop
```
Itération 1: Génère "dashboard" → Valide → OK ✅
Itération 2: Génère "gestion_produits" → Valide → OK ✅
Itération 3: Génère "gestion_fournisseurs" → Valide → OK ✅
Itération 4: Génère "gestion_commandes" → Valide → OK ✅
```

### Workflow 5 Assemblage
```
4 composants validés → Assemble → Crée structure Grist
→ Output: Application complète prête
```

---

## Implémentation

Je vais maintenant créer les 5 fichiers JSON de workflows avec cette architecture.
