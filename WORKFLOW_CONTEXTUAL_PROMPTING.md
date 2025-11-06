# Architecture de Prompting Contextuel pour Workflow N8N

## Concept Général

Chaque agent reçoit des **exemples concrets** basés sur les données réelles produites par les agents précédents, au lieu d'exemples statiques/génériques.

### Architecture Standard par Agent

```
┌─────────────────────────────────────────────────────────────┐
│  Agent N-1                                                   │
│  ├─ System Prompt (statique)                                │
│  ├─ User Prompt (dynamique avec exemples de N-2)            │
│  └─ Output JSON (structuré pour être formaté)               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Node Code: Format Output (N-1 → N)                         │
│  ├─ Extraire données clés de Agent N-1                      │
│  ├─ Formater en prompt lisible avec exemples                │
│  ├─ Stocker dans variables N8N                              │
│  └─ Préparer contexte pour Agent N                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Agent N                                                     │
│  ├─ System Prompt (statique) ← Variable N8N                 │
│  ├─ User Prompt (dynamique) ← Variable N8N formatée         │
│  └─ Output JSON (structuré pour Agent N+1)                  │
└─────────────────────────────────────────────────────────────┘
```

## Chaîne Complète du Workflow

```
User Input
    ↓
Agent 1: Conversation Manager
    ↓
[Code Node: Format A1→A2]
    ↓
Agent 2: Intent Analyzer (avec exemples du domaine identifié par A1)
    ↓
[Code Node: Format A2→A3]
    ↓
Agent 3: Validation Coordinator (avec contraintes basées sur entités A2)
    ↓
[Code Node: Format A3→A4]
    ↓
Agent 4: Entity Classifier (avec schéma basé sur entités validées A3)
    ↓
[Code Node: Format A4→A10]
    ↓
Agent 10: Code Generator (avec schéma réel et entités précises A4)
    ↓
[Code Node: Format A10→A11]
    ↓
Agent 11: Syntax Validator (avec code réel généré par A10)
    ↓
[Code Node: Format A11→A13]
    ↓
Agent 13: App Assembler (avec composants validés par A11)
    ↓
Output Final
```

## Détail par Agent

### Agent 1: Conversation Manager

**System Prompt (statique)** :
```
Tu es Agent 1: Conversation Manager.
Ton rôle : Analyser toute demande utilisateur et extraire les entités métier,
besoins fonctionnels et exigences.
```

**User Prompt (minimal, reçoit juste l'input utilisateur)** :
```
Demande utilisateur : {{ $json.user_input }}

Analyse cette demande et identifie :
1. Le domaine métier
2. Les entités métier mentionnées
3. Les besoins fonctionnels
4. Les exigences non-fonctionnelles
```

**Output structuré pour formatage** :
```json
{
  "conversation_id": "conv_xxx",
  "business_domain": "gestion_stocks",
  "business_domain_description": "Gestion d'inventaire et de commandes fournisseurs",
  "extracted_entities": [
    {"name": "Produits", "description": "Articles en stock"},
    {"name": "Fournisseurs", "description": "Entreprises fournissant les produits"},
    {"name": "Commandes", "description": "Commandes passées aux fournisseurs"}
  ],
  "functional_requirements": [
    "CRUD complet sur produits",
    "Suivi des commandes fournisseurs",
    "Alertes stock bas"
  ],
  "formatting_hints": {
    "domain_example": "gestion_stocks",
    "entity_count": 3,
    "primary_entity": "Produits"
  }
}
```

---

### Node Code: Format A1→A2

**Objectif** : Transformer l'output d'Agent 1 en prompt contextualisé pour Agent 2

```javascript
// Récupérer output Agent 1
const a1 = $input.first().json.output;

// Stocker données brutes
$vars.set('agent1_raw', JSON.stringify(a1));

// Construire System Prompt Agent 2 (statique)
const systemPrompt2 = `Tu es Agent 2: Intent Analyzer.
Ton rôle : Identifier les intentions métier (consultation, gestion, workflow, reporting)
et définir les personas utilisateurs.`;

// Construire User Prompt Agent 2 (dynamique avec exemples réels)
const userPrompt2 = `## CONTEXTE DU BESOIN UTILISATEUR

**Domaine métier identifié** : ${a1.business_domain}
Description : ${a1.business_domain_description}

**Entités métier extraites** (${a1.extracted_entities.length} entités) :
${a1.extracted_entities.map((e, i) => `${i+1}. **${e.name}** : ${e.description}`).join('\n')}

**Besoins fonctionnels identifiés** :
${a1.functional_requirements.map((r, i) => `- ${r}`).join('\n')}

---

## TA MISSION

À partir de ce contexte **${a1.business_domain}**, identifie :

1. **Intentions principales** pour ce domaine spécifique
   Exemple : Pour "${a1.business_domain}", les intentions typiques sont :
   - Consultation des ${a1.extracted_entities[0].name}
   - Gestion CRUD des ${a1.extracted_entities[1]?.name || 'entités'}
   - Suivi des processus (workflow)

2. **Personas utilisateurs** pour "${a1.business_domain}"
   Exemple :
   - Gestionnaire de stock
   - Responsable achats
   - Magasinier

3. **Use cases détaillés** avec les entités identifiées : ${a1.extracted_entities.map(e => e.name).join(', ')}

## FORMAT DE SORTIE

Réponds UNIQUEMENT avec un JSON contenant :
- primary_intent
- secondary_intents
- user_personas (avec nom, rôle, besoins, fréquence)
- use_cases (avec uc_id, actor, action, description, priority, data_required)
- business_domain: "${a1.business_domain}"
- complexity_level
`;

// Stocker dans variables N8N
$vars.set('agent2_system_prompt', systemPrompt2);
$vars.set('agent2_user_prompt', userPrompt2);

// Retourner pour passage à Agent 2
return {
  system_prompt: systemPrompt2,
  user_prompt: userPrompt2,
  context_summary: `Prepared context for Intent Analysis of ${a1.business_domain}`,
  entity_count: a1.extracted_entities.length
};
```

---

### Agent 2: Intent Analyzer (restructuré)

**Configuration Node Agent 2** :

```json
{
  "parameters": {
    "agent": "conversationalAgent",
    "promptType": "define",
    "text": "={{ $json.system_prompt }}\n\n{{ $json.user_prompt }}",
    "options": {}
  }
}
```

**Output structuré pour formatage** :
```json
{
  "primary_intent": "gestion_stocks",
  "secondary_intents": ["suivi_commandes", "reporting"],
  "user_personas": [
    {
      "name": "gestionnaire_stock",
      "role": "Gestionnaire de stock",
      "needs": ["consulter stock", "passer commandes"],
      "frequency": "quotidienne"
    }
  ],
  "use_cases": [
    {
      "uc_id": "UC001",
      "actor": "gestionnaire_stock",
      "action": "consulter_produits",
      "description": "Visualiser liste produits avec stock actuel",
      "priority": "haute",
      "data_required": ["Produits"]
    }
  ],
  "business_domain": "gestion_stocks",
  "complexity_level": "medium",
  "formatting_hints": {
    "use_case_count": 5,
    "primary_persona": "gestionnaire_stock"
  }
}
```

---

### Node Code: Format A2→A3

```javascript
// Récupérer outputs précédents
const a1 = JSON.parse($vars.get('agent1_raw'));
const a2 = $input.first().json.output;

$vars.set('agent2_raw', JSON.stringify(a2));

// System Prompt Agent 3 (statique)
const systemPrompt3 = `Tu es Agent 3: Validation Coordinator.
Ton rôle : Valider la faisabilité technique avec les contraintes App Nest.`;

// User Prompt Agent 3 (dynamique)
const userPrompt3 = `## CONTEXTE DU PROJET

**Domaine** : ${a2.business_domain}

**Entités métier identifiées** : ${a1.extracted_entities.map(e => e.name).join(', ')}
Total : ${a1.extracted_entities.length} tables principales

**Intentions métier** :
- Intent principal : ${a2.primary_intent}
- Intents secondaires : ${a2.secondary_intents.join(', ')}

**Use cases identifiés** : ${a2.use_cases.length} use cases
${a2.use_cases.slice(0, 3).map(uc => `- ${uc.uc_id}: ${uc.description}`).join('\n')}

**Niveau de complexité** : ${a2.complexity_level}

---

## TA MISSION : VALIDATION TECHNIQUE

Valide la faisabilité de cette application "${a2.business_domain}" avec les contraintes App Nest :

### Contraintes à vérifier :
1. **Nombre de tables** : ${a1.extracted_entities.length} tables < 10 ? ✅/❌
2. **Complexité workflow** : Level ${a2.complexity_level} faisable ? ✅/❌
3. **Volumétrie estimée** : Pour chaque entité (${a1.extracted_entities.map(e => e.name).join(', ')})
4. **Performances** : ${a2.use_cases.length} use cases réalisables ?

### Exemples de validation pour "${a2.business_domain}" :
- Si ${a1.extracted_entities.length} tables : ${a1.extracted_entities.length <= 10 ? 'OK (<10)' : 'RISQUE (>10)'}
- Si complexity ${a2.complexity_level} : ${a2.complexity_level === 'high' ? 'ATTENTION' : 'OK'}

## FORMAT DE SORTIE

Réponds avec JSON contenant :
- is_feasible (boolean)
- technical_validation (4 checks)
- constraints_identified (liste)
- risks (liste avec mitigation)
- approved_specifications (entities, patterns, use_cases)
- validation_status: "APPROVED" ou "REJECTED"
`;

$vars.set('agent3_system_prompt', systemPrompt3);
$vars.set('agent3_user_prompt', userPrompt3);

return {
  system_prompt: systemPrompt3,
  user_prompt: userPrompt3,
  context_summary: `Validation for ${a1.extracted_entities.length} tables, ${a2.use_cases.length} use cases`
};
```

---

### Node Code: Format A3→A4

```javascript
// Récupérer outputs précédents
const a1 = JSON.parse($vars.get('agent1_raw'));
const a2 = JSON.parse($vars.get('agent2_raw'));
const a3 = $input.first().json.output;

$vars.set('agent3_raw', JSON.stringify(a3));

// System Prompt Agent 4
const systemPrompt4 = `Tu es Agent 4: Entity Classifier.
Ton rôle : Créer le schéma complet de chaque entité avec tous ses attributs.`;

// User Prompt Agent 4 (avec exemples concrets du domaine)
const userPrompt4 = `## CONTEXTE PROJET VALIDÉ

**Domaine** : ${a2.business_domain}
**Validation** : ${a3.validation_status} ✅

**Entités à structurer** (${a1.extracted_entities.length} entités) :
${a1.extracted_entities.map((e, i) => `${i+1}. **${e.name}** : ${e.description}`).join('\n')}

**Use cases nécessitant ces entités** :
${a2.use_cases.map(uc => `- ${uc.description} → Utilise: ${uc.data_required.join(', ')}`).join('\n')}

---

## TA MISSION : CLASSIFICATION ET STRUCTURATION

Pour chaque entité du domaine "${a2.business_domain}", crée sa structure complète.

### Exemple concret pour "${a1.extracted_entities[0].name}" :

Type d'entité : ${a1.extracted_entities[0].name.includes('Commande') || a1.extracted_entities[0].name.includes('Intervention') ? 'dossier (processus)' : 'ressource (entité principale)'}

Attributs attendus pour "${a1.extracted_entities[0].name}" :
- ${a1.extracted_entities[0].name.toLowerCase()}_id (Text, primary)
- nom ou désignation (Text, required)
- ${a1.extracted_entities[1] ? `${a1.extracted_entities[1].name.toLowerCase()}_id (Reference:${a1.extracted_entities[1].name})` : 'relations vers autres entités'}
- date_creation (DateTime)
- statut (Choice) si processus workflow
- autres attributs métier spécifiques à "${a2.business_domain}"

### Structure à créer pour TOUTES les entités :
${a1.extracted_entities.map(e => `- ${e.name}`).join('\n')}

## FORMAT DE SORTIE

Réponds avec JSON contenant :
- entities (array avec pour chaque entité : entity_name, entity_type, table_name, columns, relationships)
- total_tables: ${a1.extracted_entities.length}
- total_columns: (calculé)
- constraints_check (vérifier < 50 colonnes/table)
`;

$vars.set('agent4_system_prompt', systemPrompt4);
$vars.set('agent4_user_prompt', userPrompt4);

return {
  system_prompt: systemPrompt4,
  user_prompt: userPrompt4,
  context_summary: `Schema creation for ${a1.extracted_entities.length} entities`
};
```

---

### Node Code: Format A4→A10

```javascript
// Récupérer outputs précédents
const a1 = JSON.parse($vars.get('agent1_raw'));
const a2 = JSON.parse($vars.get('agent2_raw'));
const a4 = $input.first().json.output;

$vars.set('agent4_raw', JSON.stringify(a4));

// System Prompt Agent 10
const systemPrompt10 = `Tu es Agent 10: Code Generator.
Ton rôle : Générer le code JSX React pour chaque composant de l'application.
IMPORTANT : Respecter STRICTEMENT les contraintes App Nest.`;

// User Prompt Agent 10 (avec schéma réel et composants à créer)
const userPrompt10 = `## CONTEXTE APPLICATION

**Domaine** : ${a2.business_domain}
**Tables créées** : ${a4.total_tables} tables, ${a4.total_columns} colonnes

### SCHÉMA COMPLET DES TABLES

${a4.entities.map(entity => `
**Table: ${entity.table_name}**
Type: ${entity.entity_type}
Colonnes:
${entity.columns.map(col => `  - ${col.column_name} (${col.column_type})${col.is_required ? ' *required*' : ''}`).join('\n')}
`).join('\n')}

### USE CASES À IMPLÉMENTER

${a2.use_cases.map(uc => `
**${uc.uc_id}** : ${uc.description}
- Actor: ${uc.actor}
- Priority: ${uc.priority}
- Data: ${uc.data_required.join(', ')}
`).join('\n')}

---

## TA MISSION : GÉNÉRATION CODE REACT

Génère les composants React pour l'application "${a2.business_domain}".

### Composants à créer (basés sur use cases réels) :

1. **Dashboard** :
   - Afficher métriques : ${a4.entities.map(e => `nombre de ${e.table_name}`).join(', ')}
   - Utiliser gristAPI.getData() pour : ${a4.entities.slice(0, 3).map(e => `'${e.table_name}'`).join(', ')}

2. **Gestion ${a4.entities[0].table_name}** :
   - CRUD complet sur table "${a4.entities[0].table_name}"
   - Colonnes à afficher : ${a4.entities[0].columns.slice(0, 5).map(c => c.column_name).join(', ')}

${a4.entities.slice(1, 4).map(entity => `
3. **Gestion ${entity.table_name}** :
   - CRUD sur "${entity.table_name}"
   - Relations : ${entity.relationships?.map(r => `${r.type} vers ${r.target}`).join(', ') || 'aucune'}
`).join('\n')}

### CONTRAINTES APP NEST STRICTES

✅ **Nom composant** : const Component = () => {}
❌ PAS : const Dashboard = () => {}

✅ **API Grist** disponible :
- gristAPI.getData('${a4.entities[0].table_name}')
- gristAPI.addRecord('${a4.entities[0].table_name}', data)
- gristAPI.updateRecord('${a4.entities[0].table_name}', id, data)
- gristAPI.deleteRecord('${a4.entities[0].table_name}', id)

✅ **Validation Array** : TOUJOURS vérifier Array.isArray()

## EXEMPLE DE CODE pour Dashboard "${a2.business_domain}" :

\`\`\`javascript
const Component = () => {
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    const loadMetrics = async () => {
      const ${a4.entities[0].table_name.toLowerCase()} = await gristAPI.getData('${a4.entities[0].table_name}');
      ${a4.entities[1] ? `const ${a4.entities[1].table_name.toLowerCase()} = await gristAPI.getData('${a4.entities[1].table_name}');` : ''}

      if (Array.isArray(${a4.entities[0].table_name.toLowerCase()})) {
        setMetrics({
          ${a4.entities[0].table_name.toLowerCase()}: ${a4.entities[0].table_name.toLowerCase()}.length,
          ${a4.entities[1] ? `${a4.entities[1].table_name.toLowerCase()}: ${a4.entities[1].table_name.toLowerCase()}.length` : ''}
        });
      }
    };
    loadMetrics();
  }, []);

  return (
    <div style={{padding: '20px', fontFamily: 'Marianne, sans-serif'}}>
      <h1>${a2.business_domain} - Tableau de bord</h1>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px'}}>
        <div style={{backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
          <h3>Total ${a4.entities[0].table_name}</h3>
          <p style={{fontSize: '2rem', fontWeight: 'bold'}}>{metrics.${a4.entities[0].table_name.toLowerCase()} || 0}</p>
        </div>
      </div>
    </div>
  );
};
\`\`\`

## FORMAT DE SORTIE

Réponds avec JSON :
\`\`\`json
{
  "components": [
    {
      "component_id": "dashboard",
      "template_name": "Tableau de bord",
      "component_type": "functional",
      "component_code": "const Component = () => { ... };"
    }
  ]
}
\`\`\`

Génère ${Math.min(a2.use_cases.length + 1, 6)} composants basés sur les use cases réels.
`;

$vars.set('agent10_system_prompt', systemPrompt10);
$vars.set('agent10_user_prompt', userPrompt10);

return {
  system_prompt: systemPrompt10,
  user_prompt: userPrompt10,
  context_summary: `Code generation for ${a4.total_tables} tables, ${a2.use_cases.length} use cases`
};
```

---

## Avantages de cette Architecture

### 1. **Cohérence contextuelle**
Chaque agent travaille avec les données réelles produites précédemment, pas des exemples génériques.

### 2. **Meilleure précision**
Les agents voient exactement ce qu'ils doivent produire basé sur le contexte réel :
- Agent 2 voit les entités exactes d'Agent 1
- Agent 4 voit les use cases exacts d'Agent 2
- Agent 10 voit le schéma exact d'Agent 4

### 3. **Flexibilité totale**
Le système s'adapte à N'IMPORTE QUEL domaine car les exemples sont construits dynamiquement.

### 4. **Debuggabilité**
Les variables N8N stockent tous les contextes intermédiaires :
- `agent1_raw`, `agent2_raw`, etc.
- `agent2_system_prompt`, `agent2_user_prompt`, etc.

### 5. **Standardisation**
Structure uniforme pour tous les agents :
- System Prompt : Rôle général
- User Prompt : Contexte + exemples réels + format attendu

## Variables N8N Utilisées

```
agent1_raw                 → Output brut Agent 1
agent2_system_prompt       → System prompt Agent 2
agent2_user_prompt         → User prompt Agent 2 (avec exemples de A1)
agent2_raw                 → Output brut Agent 2
agent3_system_prompt       → System prompt Agent 3
agent3_user_prompt         → User prompt Agent 3 (avec exemples de A1+A2)
agent3_raw                 → Output brut Agent 3
agent4_system_prompt       → System prompt Agent 4
agent4_user_prompt         → User prompt Agent 4 (avec exemples de A1+A2+A3)
agent4_raw                 → Output brut Agent 4 (schéma complet)
agent10_system_prompt      → System prompt Agent 10
agent10_user_prompt        → User prompt Agent 10 (avec schéma A4 + use cases A2)
agent10_raw                → Output brut Agent 10 (composants)
```

## Exemple Concret : Gestion Immobilière

### Input Utilisateur
```
"Je veux une application de gestion patrimoniale immobilière pour gérer mes bâtiments,
planifier les interventions de maintenance et suivre le budget."
```

### Agent 1 Output
```json
{
  "business_domain": "gestion_patrimoniale_immobiliere",
  "extracted_entities": [
    {"name": "Sites", "description": "Emplacements géographiques"},
    {"name": "Bâtiments", "description": "Patrimoine bâti"},
    {"name": "Interventions", "description": "Maintenance et travaux"}
  ]
}
```

### Code Node A1→A2 produit pour Agent 2
```
Domaine métier identifié : gestion_patrimoniale_immobiliere

Entités métier extraites (3 entités) :
1. **Sites** : Emplacements géographiques
2. **Bâtiments** : Patrimoine bâti
3. **Interventions** : Maintenance et travaux

Pour "gestion_patrimoniale_immobiliere", les intentions typiques sont :
- Consultation des Sites
- Gestion CRUD des Bâtiments
- Suivi des processus (workflow) pour Interventions
```

→ Agent 2 reçoit des exemples CONCRETS basés sur le domaine réel identifié par Agent 1.

### Agent 4 reçoit de Agent 3
```
Entités à structurer (3 entités) :
1. **Sites** : Emplacements géographiques
2. **Bâtiments** : Patrimoine bâti
3. **Interventions** : Maintenance et travaux

Exemple concret pour "Sites" :
Type d'entité : ressource (entité principale)
Attributs attendus pour "Sites" :
- sites_id (Text, primary)
- nom (Text, required)
- adresse (Text)
- ...
```

### Agent 10 reçoit de Agent 4
```
SCHÉMA COMPLET DES TABLES

**Table: Sites**
Colonnes:
  - site_id (Text) *required*
  - nom (Text) *required*
  - adresse (Text)

**Table: Bâtiments**
Colonnes:
  - batiment_id (Text) *required*
  - site_id (Reference:Sites) *required*
  - nom (Text) *required*

Génère Dashboard pour "gestion_patrimoniale_immobiliere" avec :
- gristAPI.getData('Sites')
- gristAPI.getData('Bâtiments')
- gristAPI.getData('Interventions')
```

## Implémentation dans N8N

### Structure des Nodes

```
1. Webhook Trigger
2. Extract User Input (Set node)
3. Agent 1: Conversation Manager
4. Albert API - Agent 1 (LLM connection)
5. [CODE] Format A1→A2
6. Agent 2: Intent Analyzer
7. Albert API - Agent 2
8. [CODE] Format A2→A3
9. Agent 3: Validation Coordinator
10. Albert API - Agent 3
11. IF Feasible?
12. [CODE] Format A3→A4
13. Agent 4: Entity Classifier
14. Albert API - Agent 4
15. [CODE] Format A4→A10
16. Agent 10: Code Generator
17. Albert API - Agent 10
18. [CODE] Format A10→A11
19. Agent 11: Syntax Validator
20. Albert API - Agent 11
21. IF Valid?
22. [CODE] Format A11→A13
23. Agent 13: App Assembler
24. Albert API - Agent 13
25. Success Response
```

### Configuration d'un Node Agent (exemple Agent 2)

```json
{
  "parameters": {
    "agent": "conversationalAgent",
    "promptType": "define",
    "text": "={{ $json.system_prompt }}\n\n{{ $json.user_prompt }}",
    "options": {}
  },
  "name": "Agent 2: Intent Analyzer",
  "type": "@n8n/n8n-nodes-langchain.agent"
}
```

Le prompt est construit dynamiquement par le Code Node précédent !

## Conclusion

Cette architecture permet de créer un workflow **véritablement générique** où :
- ✅ Chaque agent reçoit des exemples concrets du domaine réel
- ✅ Le contexte se propage de manière cohérente
- ✅ Les agents comprennent mieux ce qu'ils doivent produire
- ✅ Le système s'adapte automatiquement à tout domaine métier
- ✅ Facilite le debugging via variables N8N
- ✅ Structure standardisée et maintenable
