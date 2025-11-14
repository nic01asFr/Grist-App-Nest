// 🔧 WORKFLOW 5 - Node "Code: Prepare Entity Table" CORRIGÉ
// Ce code remplace le node existant pour gérer correctement les relations

// Prepare business table creation
const entity = $json.entities;
const gristConfig = $json.grist_config;

// Séparer les colonnes simples des colonnes de référence
const simpleColumns = [];
const referenceColumns = [];

// Créer un map des colonnes de référence depuis relationships
const referenceColumnsMap = new Map();
if (entity.relationships && Array.isArray(entity.relationships)) {
  entity.relationships.forEach(rel => {
    // rel.via = nom de la colonne (ex: "fournisseur_id")
    // rel.target = table cible (ex: "Fournisseurs")
    referenceColumnsMap.set(rel.via, {
      target_table: rel.target,
      relationship_type: rel.type
    });
  });
}

// Traiter chaque colonne
entity.columns.forEach(col => {
  const columnId = col.column_name.toLowerCase().replace(/\s+/g, '_');
  const columnLabel = col.column_name;

  // Vérifier si cette colonne est une référence
  const isReference = referenceColumnsMap.has(col.column_name);

  if (isReference) {
    const refInfo = referenceColumnsMap.get(col.column_name);

    // Colonne de référence - sera ajoutée après création de toutes les tables
    referenceColumns.push({
      id: columnId,
      label: columnLabel,
      type: `Ref:${refInfo.target_table}`, // Format API Grist: "Ref:TableName"
      original_type: col.column_type,
      relationship_type: refInfo.relationship_type
    });
  } else {
    // Colonne simple - ajoutée maintenant
    simpleColumns.push({
      id: columnId,
      label: columnLabel,
      type: col.column_type,
      is_required: col.is_required || false,
      is_unique: col.is_unique || false,
      is_primary: col.is_primary || false
    });
  }
});

return {
  conversation_id: $json.conversation_id,
  business_domain: $json.business_domain,
  grist_config: gristConfig,
  generated_components: $json.generated_components,

  // Table actuelle à créer
  current_entity: entity,
  table_to_create: {
    id: entity.table_name,
    columns: simpleColumns
  },
  reference_columns_to_add: referenceColumns,

  batch_index: $json.batchIndex,

  // Debug info
  debug: {
    entity_name: entity.table_name,
    total_columns: entity.columns.length,
    simple_columns: simpleColumns.length,
    reference_columns: referenceColumns.length,
    relationships_found: entity.relationships?.length || 0
  }
};
