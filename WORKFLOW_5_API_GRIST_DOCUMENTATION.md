# 🔧 Workflow 5 - Assemblage Final avec API Grist

## 📋 Vue d'Ensemble

Le **Workflow 5** crée automatiquement les tables et insère les composants dans Grist via l'API REST Grist. Plus besoin de créer manuellement les tables ou d'importer des CSV - tout est automatisé.

---

## 🏗️ Architecture

```
W2 Output → W5 Extract Input → Config Grist API
                                       ↓
                              Create Templates Table
                                       ↓
                         Loop: Create Business Tables
                                       ↓
                      Conditional: Add Reference Columns
                                       ↓
                       Loop: Insert Components Records
                                       ↓
                             Return Grist Doc URL
```

---

## 🔄 Flux de Données Détaillé

### 1️⃣ **Extract Input** (Trigger)
- **Source**: Workflow 2 (Orchestrateur)
- **Données reçues**:
  ```json
  {
    "conversation_id": "conv_...",
    "business_domain": "gestion_stock",
    "schema": {
      "entities": [...],
      "total_tables": 4,
      ...
    },
    "use_cases": {...},
    "generated_components": [
      {
        "component_id": "dashboard",
        "component_code": "const Component = () => {...}",
        "validation_result": {...}
      },
      ...
    ]
  }
  ```

### 2️⃣ **Prepare Grist Config**
- Configure l'URL de base Grist
- Définit le `doc_id` (nouveau document ou existant)
- Prépare les credentials API

**⚠️ Configuration Requise:**
```javascript
grist_config: {
  base_url: 'https://grist.numerique.gouv.fr',
  doc_id: 'NEW_DOC', // ou ID d'un document existant
  doc_name: 'AppNest_gestion_stock_1731576000000'
}
```

### 3️⃣ **Create Templates Table**
- **Endpoint**: `POST /api/docs/{docId}/tables`
- **Body**:
  ```json
  {
    "tables": [{
      "id": "Templates",
      "columns": [
        {"id": "template_id", "label": "template_id", "type": "Text"},
        {"id": "template_name", "label": "template_name", "type": "Text"},
        {"id": "component_type", "label": "component_type", "type": "Text"},
        {"id": "component_code", "label": "component_code", "type": "Text"}
      ]
    }]
  }
  ```

### 4️⃣ **Loop: Create Business Tables**

#### Split Out Entities
Transforme:
```json
{
  "schema": {
    "entities": [
      {"table_name": "Produits", ...},
      {"table_name": "Fournisseurs", ...}
    ]
  }
}
```

En items individuels:
```json
{"entities": {"table_name": "Produits", ...}}
{"entities": {"table_name": "Fournisseurs", ...}}
```

#### Split In Batches
Traite chaque entité une par une.

#### Prepare Entity Table
Pour chaque entité:
1. **Sépare** colonnes simples vs colonnes de référence
2. **Crée** la table avec colonnes simples uniquement
3. **Stocke** les colonnes de référence pour plus tard

**Logique:**
```javascript
const simpleColumns = [];
const referenceColumns = [];

entity.columns.forEach(col => {
  if (col.is_reference) {
    referenceColumns.push({
      id: col.column_name,
      type: `Ref:${col.reference_table}` // ✅ Format API Grist
    });
  } else {
    simpleColumns.push({
      id: col.column_name,
      type: col.column_type
    });
  }
});
```

#### HTTP: Create Business Table
- **Endpoint**: `POST /api/docs/{docId}/tables`
- **Body**: `{"tables": [{"id": "Produits", "columns": [...]}]}`

### 5️⃣ **Conditional: Add Reference Columns**

#### IF: Has Reference Columns
Vérifie si `all_reference_columns.length > 0`.

#### Loop: Add References (si oui)
Pour chaque colonne de référence:
- **Endpoint**: `POST /api/docs/{docId}/tables/{tableId}/columns`
- **Body**:
  ```json
  {
    "columns": [{
      "id": "fournisseur_id",
      "label": "Fournisseur",
      "type": "Ref:Fournisseurs"
    }]
  }
  ```

**⚠️ Ordre Important:**
1. Créer TOUTES les tables d'abord
2. Puis ajouter les colonnes de référence
3. Sinon: erreur "Table cible n'existe pas"

### 6️⃣ **Loop: Insert Components into Templates**

#### Split Out Components
Transforme le tableau `generated_components` en items individuels.

#### Split In Batches
Traite chaque composant un par un.

#### Format Component Record
Prépare le record pour Grist:
```javascript
{
  template_id: "dashboard",
  template_name: "Tableau de bord",
  component_type: "functional",
  component_code: "const Component = () => {...}"
}
```

**Nettoyage du code:**
- Si `component_code` est un objet JSON, le stringify
- Si wrapped dans `"{...}"`, le parser

#### HTTP: Insert Component
- **Endpoint**: `POST /api/docs/{docId}/tables/Templates/records`
- **Body**:
  ```json
  {
    "records": [{
      "fields": {
        "template_id": "dashboard",
        "template_name": "Tableau de bord",
        "component_type": "functional",
        "component_code": "const Component = () => {...}"
      }
    }]
  }
  ```

### 7️⃣ **Prepare Final Response**
Retourne:
```json
{
  "success": true,
  "grist_document": {
    "doc_id": "abc123",
    "doc_url": "https://grist.numerique.gouv.fr/doc/abc123",
    "doc_name": "AppNest_gestion_stock_1731576000000"
  },
  "summary": {
    "components_inserted": 3
  },
  "widget_configuration": {
    "widget_url": "https://raw.githubusercontent.com/nic01asFr/grist-dynamic-dashboard/main/Grist_App_Nest_v5_2.html",
    "access_level": "read table",
    "table_to_select": "Templates"
  },
  "next_steps": [
    "1. Ouvrir le document: https://...",
    "2. Ajouter une page Custom Widget",
    "3. Configurer le widget avec l'URL ci-dessus",
    "4. Sélectionner la table Templates",
    "5. Tester l'application"
  ]
}
```

---

## ⚙️ Configuration Requise

### 1. Credentials Grist API

Dans N8N, créer des credentials de type **"Grist API"**:

- **Nom**: `Grist API`
- **Type**: HTTP Header Auth ou API Key
- **Header**: `Authorization`
- **Value**: `Bearer YOUR_GRIST_API_KEY`

**Obtenir une clé API Grist:**
1. Se connecter à Grist
2. Menu utilisateur → **Profile Settings**
3. Section **API** → **Create API Key**
4. Copier la clé générée

### 2. Document Grist

**Option A: Nouveau document automatique**
```javascript
grist_config: {
  doc_id: 'NEW_DOC' // Sera créé automatiquement
}
```

**Option B: Document existant**
```javascript
grist_config: {
  doc_id: 'abc123def456' // ID d'un document vide
}
```

**Obtenir un doc_id:**
- Ouvrir un document Grist
- L'URL contient: `https://grist.../doc/[DOC_ID]`

### 3. URL de Base Grist

Modifier dans le node "Code: Prepare Grist Config":
```javascript
base_url: 'https://grist.numerique.gouv.fr'
// ou
base_url: 'https://docs.getgrist.com'
```

---

## 🔧 Modifications Nécessaires au Schema (W1)

Pour que le W5 fonctionne correctement, le **Workflow 1** doit générer un schema avec des flags de référence dans les colonnes.

### Format Actuel (W1)
```json
{
  "entities": [{
    "table_name": "Produits",
    "columns": [
      {"column_name": "id", "column_type": "Int"},
      {"column_name": "fournisseur_id", "column_type": "Int"}
    ],
    "relationships": [
      {
        "type": "many_to_one",
        "target": "Fournisseurs",
        "via": "fournisseur_id"
      }
    ]
  }]
}
```

### Format Requis (pour W5)
```json
{
  "entities": [{
    "table_name": "Produits",
    "columns": [
      {"column_name": "id", "column_type": "Int"},
      {
        "column_name": "fournisseur_id",
        "column_type": "Int",
        "is_reference": true,
        "reference_table": "Fournisseurs"
      }
    ]
  }]
}
```

**⚠️ Solution:**
Le node "Code: Prepare Entity Table" du W5 doit être modifié pour extraire les références du champ `relationships` et les mapper aux colonnes correspondantes.

---

## 🐛 Problèmes Connus et Solutions

### Problème 1: "Table cible n'existe pas"
**Cause**: Colonnes de référence ajoutées avant que la table cible soit créée.
**Solution**: Le workflow crée d'abord TOUTES les tables, puis ajoute les colonnes de référence.

### Problème 2: "Column already exists"
**Cause**: La colonne de référence a déjà été créée avec les colonnes simples.
**Solution**: Séparer les colonnes simples et de référence dans "Prepare Entity Table".

### Problème 3: Schema manquant dans W5
**Cause**: Le W2 ne passe pas le schema au W5.
**Solution**: Corriger "Code: Aggregate Results" du W2 (voir `workflow_2_CORRECTED_pass_schema_to_w5.js`).

### Problème 4: Code composant mal formaté
**Cause**: Le component_code est wrapped dans `"{...}"` ou est un objet JSON.
**Solution**: Le node "Code: Format Component Record" nettoie automatiquement le format.

---

## 🎯 Différences avec l'Ancien W5

| Aspect | Ancien W5 | Nouveau W5 |
|--------|-----------|-----------|
| **Création tables** | Manuel (utilisateur) | ✅ Automatique via API |
| **Import composants** | CSV manuel | ✅ API records insert |
| **Relations** | Manuel (colonnes Ref) | ✅ Automatique (colonnes Ref:Table) |
| **Output** | JSON + CSV + MD files | ✅ Document Grist prêt |
| **Temps setup** | 15-20 minutes | ✅ < 1 minute |
| **Erreurs possibles** | Import CSV, typos | ✅ Validation API |

---

## 📊 Performance Estimée

Pour une application de gestion de stock (4 tables, 3 composants):

| Étape | Temps | Requêtes API |
|-------|-------|--------------|
| Create Templates | 0.5s | 1 |
| Create 4 tables | 2s | 4 |
| Add 3 références | 1.5s | 3 |
| Insert 3 composants | 1.5s | 3 |
| **TOTAL** | **~5.5s** | **11** |

**Limites:**
- API Grist: ~10 requêtes/seconde
- Pour 10+ tables: ~10-15 secondes
- Pour 20+ composants: ajouter batch insert (futur)

---

## 🚀 Prochaines Étapes

### Immédiat
1. ✅ Corriger W2 pour passer le schema au W5
2. ✅ Adapter "Prepare Entity Table" pour extraire relations
3. ⏳ Tester avec exemple réel (gestion_stock)

### Court Terme
- Gérer création de nouveau document (POST /api/orgs/{orgId}/workspaces/{wsId}/docs)
- Batch insert pour composants (au lieu de boucle)
- Gestion erreurs API (retry, fallback)

### Moyen Terme
- Support des formules Grist (colonnes calculées)
- Support des vues (dashboard, cards, calendar)
- Migration de données existantes

---

## 📝 Notes Techniques

### Types de Colonnes Grist

| Type Schema | Type API Grist | Notes |
|-------------|----------------|-------|
| `Text` | `Text` | Texte libre |
| `Int` | `Int` | Entier |
| `Numeric` | `Numeric` | Décimal |
| `Date` | `Date` | Format YYYY-MM-DD |
| `DateTime` | `DateTime` | ISO 8601 |
| `Bool` | `Bool` | true/false |
| `Ref:TableName` | `Ref:TableName` | **Référence FK** |
| `RefList:TableName` | `RefList:TableName` | **Liste de références** |

### Ordre de Création

1. ✅ Table Templates (indépendante)
2. ✅ Tables métier (sans références)
3. ✅ Colonnes de référence (nécessitent tables cibles)
4. ✅ Records (nécessitent colonnes)

### Gestion des Erreurs API

Codes retour Grist:
- `200`: Success
- `400`: Bad request (schema invalide)
- `401`: Unauthorized (API key invalide)
- `404`: Document not found
- `409`: Conflict (table/colonne existe déjà)

**Recommandation**: Ajouter des nodes "IF Error" pour gérer ces cas.

---

## 📚 Ressources

- [Grist REST API Reference](https://support.getgrist.com/api/)
- [Reference Columns Guide](https://support.getgrist.com/col-refs/)
- [Grist Plugin API](https://support.getgrist.com/code/modules/grist_plugin_api/)
- [App Nest Documentation](./TECHNICAL.md)

---

**Version**: 5.0 (API-based)
**Date**: 2025-11-14
**Auteur**: Système de génération automatique N8N
