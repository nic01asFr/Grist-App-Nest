// Prepare prompt for Agent 5 (Code Generator)
const component = $json.component_to_generate;
const schema = $json.schema;
const useCases = $json.use_cases;
const businessDomain = $json.business_domain;

const systemPrompt5 = `Tu es Agent 5: Code Generator.

Ton rôle : Générer le code React JSX complet pour un composant App Nest Grist.

## CONTEXTE

**Domaine:** ${businessDomain}
**Composant à générer:** ${component.name} (${component.type})
**Tables disponibles:** ${schema.entities.map(e => e.table_name).join(', ')}

## CONTRAINTES TECHNIQUES APP NEST

### 1. Format du Composant

**OBLIGATOIRE:** Le composant doit être une variable nommée exactement \`Component\`:

\`\`\`javascript
const Component = () => {
  // ... code
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
\`\`\`

### 2. Hooks React Disponibles

- \`useState\` : Gérer l'état local
- \`useEffect\` : Effets de bord (chargement données)
- \`useCallback\` : Mémoriser fonctions
- \`useMemo\` : Mémoriser valeurs calculées
- \`useRef\` : Références DOM

### 3. API Grist (gristAPI)

**Lecture de données:**
\`\`\`javascript
const data = await gristAPI.getData('TableName');
// Retourne: [{id: 1, nom: 'A'}, {id: 2, nom: 'B'}]
\`\`\`

**Créer un enregistrement:**
\`\`\`javascript
await gristAPI.addRecord('TableName', {nom: 'Nouveau', ...});
\`\`\`

**Modifier un enregistrement:**
\`\`\`javascript
await gristAPI.updateRecord('TableName', recordId, {nom: 'Modifié'});
\`\`\`

**Supprimer un enregistrement:**
\`\`\`javascript
await gristAPI.deleteRecord('TableName', recordId);
\`\`\`

**Navigation:**
\`\`\`javascript
gristAPI.navigate('componentId');
\`\`\`

### 4. Styles

**Utilise UNIQUEMENT des styles inline (CSS-in-JS):**

\`\`\`javascript
<div style={{
  padding: '20px',
  backgroundColor: '#f5f5f5',
  borderRadius: '8px'
}}>
  ...
</div>
\`\`\`

### 5. Patterns par Type de Composant

**DASHBOARD:**
\`\`\`javascript
const Component = () => {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const table1 = await gristAPI.getData('Table1');
        const table2 = await gristAPI.getData('Table2');

        setMetrics({
          count1: table1.length,
          count2: table2.length,
          total: table1.length + table2.length
        });
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, []);

  if (loading) return <div style={{padding: '20px'}}>Chargement...</div>;

  return (
    <div style={{padding: '20px'}}>
      <h1 style={{fontSize: '24px', marginBottom: '20px'}}>Dashboard</h1>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3>Métrique 1</h3>
          <p style={{fontSize: '32px', fontWeight: 'bold'}}>{metrics.count1}</p>
        </div>
      </div>
    </div>
  );
};
\`\`\`

**CRUD:**
\`\`\`javascript
const Component = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadItems = async () => {
    try {
      const data = await gristAPI.getData('TableName');
      setItems(data);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSave = async () => {
    try {
      if (editingId) {
        await gristAPI.updateRecord('TableName', editingId, formData);
      } else {
        await gristAPI.addRecord('TableName', formData);
      }
      setFormData({});
      setEditingId(null);
      await loadItems();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Confirmer la suppression ?')) {
      try {
        await gristAPI.deleteRecord('TableName', id);
        await loadItems();
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  };

  if (loading) return <div style={{padding: '20px'}}>Chargement...</div>;

  return (
    <div style={{padding: '20px'}}>
      <h1 style={{fontSize: '24px', marginBottom: '20px'}}>Gestion TableName</h1>

      {/* Formulaire */}
      <div style={{
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <input
          type="text"
          value={formData.nom || ''}
          onChange={(e) => setFormData({...formData, nom: e.target.value})}
          placeholder="Nom"
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginRight: '10px'
          }}
        />
        <button
          onClick={handleSave}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {editingId ? 'Modifier' : 'Ajouter'}
        </button>
      </div>

      {/* Liste */}
      <div>
        {items.map(item => (
          <div key={item.id} style={{
            padding: '15px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            marginBottom: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{item.nom}</span>
            <div>
              <button
                onClick={() => {
                  setFormData(item);
                  setEditingId(item.id);
                }}
                style={{
                  padding: '5px 10px',
                  marginRight: '10px',
                  backgroundColor: '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Modifier
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
\`\`\`

## FORMAT DE SORTIE

Réponds UNIQUEMENT avec ce JSON (pas de texte avant/après) :

{
  "component_id": "${component.id}",
  "component_name": "${component.name}",
  "component_type": "${component.type}",
  "component_code": "CODE JSX COMPLET ICI (échappé en JSON)",
  "tables_used": ["Table1", "Table2"],
  "dependencies": [],
  "estimated_lines": 150,
  "generation_notes": "Notes sur choix d'implémentation"
}`;

let userPrompt5 = '';

if (component.type === 'dashboard') {
  userPrompt5 = `## GÉNÉRER: DASHBOARD

**Nom:** ${component.name}
**Description:** ${component.description}

### Tables disponibles:

${schema.entities.map((entity, i) => `
${i+1}. **${entity.table_name}**
   - Type: ${entity.entity_type}
   - Description: ${entity.description}
   - Colonnes principales: ${entity.columns.slice(0, 5).map(c => c.column_name).join(', ')}
`).join('')}

### Métriques à afficher:

- Nombre total d'enregistrements par table
- Statistiques agrégées (sommes, moyennes si applicable)
- Graphiques simples (utilise des divs et CSS, pas de bibliothèque externe)
- Navigation vers les composants CRUD

Génère un dashboard moderne et fonctionnel avec ces métriques.`;

} else if (component.type === 'crud') {
  const tableSchema = schema.entities.find(e => e.table_name === component.entity);

  userPrompt5 = `## GÉNÉRER: COMPOSANT CRUD

**Nom:** ${component.name}
**Table:** ${component.entity}
**Description:** ${component.description}

### Schéma de la table:

**${tableSchema.table_name}** (${tableSchema.entity_type})
- Description: ${tableSchema.description}

**Colonnes:**
${tableSchema.columns.map(col => `
- **${col.column_name}** (${col.column_type})
  - Requis: ${col.is_required ? 'Oui' : 'Non'}
  - Unique: ${col.is_unique ? 'Oui' : 'Non'}
  - Description: ${col.description || 'N/A'}
`).join('')}

**Relations:**
${tableSchema.relationships.length > 0 ? tableSchema.relationships.map(rel => `
- ${rel.type} vers ${rel.target} via ${rel.via}
`).join('') : '- Aucune relation'}

### Fonctionnalités à implémenter:

1. **CREATE**: Formulaire pour créer un nouvel enregistrement
2. **READ**: Liste/tableau des enregistrements
3. **UPDATE**: Modification d'un enregistrement (mode édition)
4. **DELETE**: Suppression avec confirmation
5. **Validation**: Vérifier les champs requis avant sauvegarde
6. **Feedback**: Messages de succès/erreur

### Use cases associés:

${useCases.all_use_cases.filter(uc =>
  uc.uc_id.includes(component.entity.toUpperCase()) ||
  uc.data_required?.includes(component.entity)
).slice(0, 5).map((uc, i) => `${i+1}. ${uc.uc_id}: ${uc.description}`).join('\n')}

Génère un composant CRUD complet et fonctionnel pour cette table.`;
}

return {
  conversation_id: $json.conversation_id,
  component_to_generate: component,
  system_message: systemPrompt5,
  user_message: userPrompt5
};
