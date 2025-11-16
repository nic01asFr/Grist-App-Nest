# 🗄️ Schéma Relationnel Grist - App Nest v6.1

> **Schéma relationnel complet avec relations Ref appropriées**

---

## 📊 Vue d'Ensemble des Tables

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Pages     │────────<│ PageTemplates    │>────────│  Templates  │
│             │  1:N    │ (table liaison)  │  N:1    │             │
└─────────────┘         └──────────────────┘         └─────────────┘

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Clients   │<────────│   Ventes    │────────>│  Produits   │
│             │  1:N    │             │  N:1    │             │
└─────────────┘         └─────────────┘         └─────────────┘

┌─────────────┐
│   Config    │
│ (singleton) │
└─────────────┘
```

---

## 🏗️ Tables Structurelles (Architecture App)

### 1. Table `Pages` (Composants Niveau 2)

**Rôle** : Définit les pages/vues de l'application affichées dans la navbar

```
Pages
├─ id (Integer, auto-increment, PK) [HIDDEN]
├─ page_id (Text, unique) [PRIMARY KEY LOGIQUE]
├─ page_name (Text)
├─ icon (Text)
├─ order (Integer)
├─ component_code (Text, long)
└─ created_at (DateTime, auto)
```

**Colonnes détaillées** :
- `id` : Clé primaire technique Grist (auto, hidden)
- `page_id` : Identifiant unique logique (ex: "home", "clients", "products")
- `page_name` : Nom affiché dans navbar (ex: "Accueil", "Clients")
- `icon` : Emoji/icône pour navbar (ex: "🏠", "👥")
- `order` : Ordre d'affichage dans navbar (1, 2, 3...)
- `component_code` : Code JSX du composant Page (long text)
- `created_at` : Date de création (metadata)

**Index** :
- Unique sur `page_id`
- Index sur `order` pour tri rapide

---

### 2. Table `Templates` (Composants Niveau 3)

**Rôle** : Définit les composants de base réutilisables

```
Templates
├─ id (Integer, auto-increment, PK) [HIDDEN]
├─ template_id (Text, unique) [PRIMARY KEY LOGIQUE]
├─ template_name (Text)
├─ category (Choice: display, data, charts, forms, ui)
├─ description (Text)
├─ component_code (Text, long)
├─ props_schema (Text, JSON)
└─ created_at (DateTime, auto)
```

**Colonnes détaillées** :
- `id` : Clé primaire technique Grist (auto, hidden)
- `template_id` : Identifiant unique (ex: "stats_card", "data_table")
- `template_name` : Nom du template (ex: "StatsCard", "DataTable")
- `category` : Catégorie (Choice: display, data, charts, forms, ui)
- `description` : Description du template et usage
- `component_code` : Code JSX du composant (long text)
- `props_schema` : JSON décrivant les props attendues
- `created_at` : Date de création

**Index** :
- Unique sur `template_id`
- Index sur `category` pour filtrage

---

### 3. Table `PageTemplates` (Table de Liaison - Relation Many-to-Many)

**Rôle** : Déclare quels templates sont utilisés par quelles pages

```
PageTemplates
├─ id (Integer, auto-increment, PK)
├─ page_id (Ref -> Pages.id)
├─ template_id (Ref -> Templates.id)
├─ order (Integer)
└─ config (Text, JSON optionnel)
```

**Colonnes détaillées** :
- `id` : Clé primaire
- `page_id` : **Référence vers Pages** (type: `Ref:Pages`)
- `template_id` : **Référence vers Templates** (type: `Ref:Templates`)
- `order` : Ordre d'utilisation dans la page (optionnel)
- `config` : Configuration spécifique du template pour cette page (JSON)

**Relations** :
- `page_id` → `Pages.id` (N:1)
- `template_id` → `Templates.id` (N:1)

**Index** :
- Composite unique sur (`page_id`, `template_id`)

---

### 4. Table `Config` (Configuration Globale)

**Rôle** : Configuration de l'application (settings globaux)

```
Config
├─ id (Integer, auto-increment, PK)
├─ config_key (Text, unique)
├─ config_value (Text)
├─ config_type (Choice: text, number, boolean, json)
├─ description (Text)
└─ updated_at (DateTime, auto)
```

**Colonnes détaillées** :
- `id` : Clé primaire
- `config_key` : Clé de configuration unique (ex: "app_name", "pages_order")
- `config_value` : Valeur (peut contenir JSON)
- `config_type` : Type de valeur (Choice: text, number, boolean, json)
- `description` : Description de la config
- `updated_at` : Date dernière modification

**Index** :
- Unique sur `config_key`

**Données par défaut** :
```json
[
  { "config_key": "app_name", "config_value": "Mon Application", "config_type": "text" },
  { "config_key": "app_logo", "config_value": "🪺", "config_type": "text" },
  { "config_key": "default_page", "config_value": "home", "config_type": "text" },
  { "config_key": "pages_order", "config_value": "[\"home\",\"clients\",\"products\",\"sales\"]", "config_type": "json" }
]
```

---

## 📦 Tables de Données (Business Data)

### 5. Table `Clients`

**Rôle** : Stocke les informations clients

```
Clients
├─ id (Integer, auto-increment, PK)
├─ nom (Text, required)
├─ email (Text, required, unique)
├─ entreprise (Text)
├─ statut (Choice: Actif, Inactif)
├─ created_at (DateTime, auto)
└─ updated_at (DateTime, auto)
```

**Colonnes détaillées** :
- `id` : Clé primaire
- `nom` : Nom du client (required)
- `email` : Email unique (required, unique)
- `entreprise` : Nom de l'entreprise
- `statut` : Statut (Choice: "Actif", "Inactif")
- `created_at` : Date création
- `updated_at` : Date dernière modification

**Index** :
- Unique sur `email`
- Index sur `statut` pour filtrage

---

### 6. Table `Produits`

**Rôle** : Catalogue de produits

```
Produits
├─ id (Integer, auto-increment, PK)
├─ nom (Text, required)
├─ prix (Numeric, required)
├─ stock (Integer, required)
├─ categorie (Choice: Informatique, Accessoires, Audio)
├─ description (Text)
├─ created_at (DateTime, auto)
└─ updated_at (DateTime, auto)
```

**Colonnes détaillées** :
- `id` : Clé primaire
- `nom` : Nom du produit (required)
- `prix` : Prix unitaire (Numeric, 2 décimales)
- `stock` : Quantité en stock (Integer)
- `categorie` : Catégorie (Choice: "Informatique", "Accessoires", "Audio")
- `description` : Description du produit
- `created_at` : Date création
- `updated_at` : Date dernière modification

**Index** :
- Index sur `categorie` pour filtrage
- Index sur `stock` pour alertes stock bas

---

### 7. Table `Ventes`

**Rôle** : Historique des ventes (transactions)

```
Ventes
├─ id (Integer, auto-increment, PK)
├─ client_id (Ref -> Clients.id) [RELATION]
├─ produit_id (Ref -> Produits.id) [RELATION]
├─ quantite (Integer, default: 1)
├─ prix_unitaire (Numeric)
├─ montant_total (Numeric, computed)
├─ date (Date, required)
├─ created_at (DateTime, auto)
└─ notes (Text)
```

**Colonnes détaillées** :
- `id` : Clé primaire
- `client_id` : **Référence vers Clients** (type: `Ref:Clients`)
- `produit_id` : **Référence vers Produits** (type: `Ref:Produits`)
- `quantite` : Quantité vendue (Integer, default 1)
- `prix_unitaire` : Prix au moment de la vente (Numeric)
- `montant_total` : Quantité × Prix (Formula: `$quantite * $prix_unitaire`)
- `date` : Date de la vente (Date, required)
- `created_at` : Date création record
- `notes` : Notes additionnelles

**Relations** :
- `client_id` → `Clients.id` (N:1)
- `produit_id` → `Produits.id` (N:1)

**Formules** :
- `montant_total` : `$quantite * $prix_unitaire`

**Index** :
- Index sur `client_id` (FK)
- Index sur `produit_id` (FK)
- Index sur `date` pour tri chronologique

---

## 🔧 Création des Tables (Ordre Correct)

### Étape 1 : Créer toutes les tables vides

```javascript
// Ordre de création (tables sans dépendances d'abord)
const tablesToCreate = [
    'Config',      // Pas de dépendances
    'Pages',       // Pas de dépendances
    'Templates',   // Pas de dépendances
    'Clients',     // Pas de dépendances
    'Produits',    // Pas de dépendances
    'PageTemplates', // Dépend de Pages et Templates (mais pas encore de colonnes Ref)
    'Ventes'       // Dépend de Clients et Produits (mais pas encore de colonnes Ref)
];

for (const tableName of tablesToCreate) {
    await grist.docApi.applyUserActions([
        ['AddTable', tableName, []]
    ]);
}
```

---

### Étape 2 : Ajouter colonnes pour chaque table

#### Config
```javascript
await grist.docApi.applyUserActions([
    ['AddColumn', 'Config', 'config_key', { type: 'Text' }],
    ['AddColumn', 'Config', 'config_value', { type: 'Text' }],
    ['AddColumn', 'Config', 'config_type', {
        type: 'Choice',
        widgetOptions: JSON.stringify({
            choices: ['text', 'number', 'boolean', 'json']
        })
    }],
    ['AddColumn', 'Config', 'description', { type: 'Text' }],
    ['AddColumn', 'Config', 'updated_at', { type: 'DateTime' }]
]);
```

#### Pages
```javascript
await grist.docApi.applyUserActions([
    ['AddColumn', 'Pages', 'page_id', { type: 'Text' }],
    ['AddColumn', 'Pages', 'page_name', { type: 'Text' }],
    ['AddColumn', 'Pages', 'icon', { type: 'Text' }],
    ['AddColumn', 'Pages', 'order', { type: 'Int' }],
    ['AddColumn', 'Pages', 'component_code', { type: 'Text' }],
    ['AddColumn', 'Pages', 'created_at', { type: 'DateTime' }]
]);
```

#### Templates
```javascript
await grist.docApi.applyUserActions([
    ['AddColumn', 'Templates', 'template_id', { type: 'Text' }],
    ['AddColumn', 'Templates', 'template_name', { type: 'Text' }],
    ['AddColumn', 'Templates', 'category', {
        type: 'Choice',
        widgetOptions: JSON.stringify({
            choices: ['display', 'data', 'charts', 'forms', 'ui']
        })
    }],
    ['AddColumn', 'Templates', 'description', { type: 'Text' }],
    ['AddColumn', 'Templates', 'component_code', { type: 'Text' }],
    ['AddColumn', 'Templates', 'props_schema', { type: 'Text' }],
    ['AddColumn', 'Templates', 'created_at', { type: 'DateTime' }]
]);
```

#### Clients
```javascript
await grist.docApi.applyUserActions([
    ['AddColumn', 'Clients', 'nom', { type: 'Text' }],
    ['AddColumn', 'Clients', 'email', { type: 'Text' }],
    ['AddColumn', 'Clients', 'entreprise', { type: 'Text' }],
    ['AddColumn', 'Clients', 'statut', {
        type: 'Choice',
        widgetOptions: JSON.stringify({
            choices: ['Actif', 'Inactif']
        })
    }],
    ['AddColumn', 'Clients', 'created_at', { type: 'DateTime' }],
    ['AddColumn', 'Clients', 'updated_at', { type: 'DateTime' }]
]);
```

#### Produits
```javascript
await grist.docApi.applyUserActions([
    ['AddColumn', 'Produits', 'nom', { type: 'Text' }],
    ['AddColumn', 'Produits', 'prix', { type: 'Numeric' }],
    ['AddColumn', 'Produits', 'stock', { type: 'Int' }],
    ['AddColumn', 'Produits', 'categorie', {
        type: 'Choice',
        widgetOptions: JSON.stringify({
            choices: ['Informatique', 'Accessoires', 'Audio']
        })
    }],
    ['AddColumn', 'Produits', 'description', { type: 'Text' }],
    ['AddColumn', 'Produits', 'created_at', { type: 'DateTime' }],
    ['AddColumn', 'Produits', 'updated_at', { type: 'DateTime' }]
]);
```

---

### Étape 3 : Ajouter colonnes avec relations Ref

#### PageTemplates (table de liaison)
```javascript
await grist.docApi.applyUserActions([
    ['AddColumn', 'PageTemplates', 'page_id', {
        type: 'Ref:Pages',  // RELATION vers Pages
        visibleCol: 'page_name'
    }],
    ['AddColumn', 'PageTemplates', 'template_id', {
        type: 'Ref:Templates',  // RELATION vers Templates
        visibleCol: 'template_name'
    }],
    ['AddColumn', 'PageTemplates', 'order', { type: 'Int' }],
    ['AddColumn', 'PageTemplates', 'config', { type: 'Text' }]
]);
```

#### Ventes (avec relations)
```javascript
await grist.docApi.applyUserActions([
    ['AddColumn', 'Ventes', 'client_id', {
        type: 'Ref:Clients',  // RELATION vers Clients
        visibleCol: 'nom'
    }],
    ['AddColumn', 'Ventes', 'produit_id', {
        type: 'Ref:Produits',  // RELATION vers Produits
        visibleCol: 'nom'
    }],
    ['AddColumn', 'Ventes', 'quantite', { type: 'Int' }],
    ['AddColumn', 'Ventes', 'prix_unitaire', { type: 'Numeric' }],
    ['AddColumn', 'Ventes', 'montant_total', {
        type: 'Numeric',
        formula: '$quantite * $prix_unitaire'  // Formule calculée
    }],
    ['AddColumn', 'Ventes', 'date', { type: 'Date' }],
    ['AddColumn', 'Ventes', 'created_at', { type: 'DateTime' }],
    ['AddColumn', 'Ventes', 'notes', { type: 'Text' }]
]);
```

---

## 📋 Ajout des Données (avec Relations)

### Ordre d'ajout (respect des contraintes FK)

1. **Config** (pas de dépendances)
2. **Pages** (pas de dépendances)
3. **Templates** (pas de dépendances)
4. **Clients** (pas de dépendances)
5. **Produits** (pas de dépendances)
6. **PageTemplates** (dépend de Pages et Templates)
7. **Ventes** (dépend de Clients et Produits)

### Exemple : Ventes avec relations

```javascript
// D'abord, récupérer les IDs des clients et produits
const clients = await gristAPI.getData('Clients');
const produits = await gristAPI.getData('Produits');

// Trouver les IDs
const jeanId = clients.find(c => c.nom === 'Jean Dupont').id;
const laptopId = produits.find(p => p.nom === 'Ordinateur Portable Pro').id;

// Créer la vente avec les relations
await gristAPI.addRecord('Ventes', {
    client_id: jeanId,      // Ref vers Clients.id
    produit_id: laptopId,   // Ref vers Produits.id
    quantite: 1,
    prix_unitaire: 1299,
    // montant_total calculé automatiquement par formule
    date: '2025-11-10'
});
```

---

## 🔍 Requêtes avec Relations

### Récupérer ventes avec détails client et produit

```javascript
const ventes = await gristAPI.getData('Ventes');

// Grist retourne automatiquement les données des références
ventes.forEach(vente => {
    console.log(`
        Client: ${vente.client_id.nom} (${vente.client_id.email})
        Produit: ${vente.produit_id.nom} - ${vente.produit_id.prix}€
        Quantité: ${vente.quantite}
        Total: ${vente.montant_total}€
    `);
});
```

### Récupérer pages avec leurs templates

```javascript
const pageId = pages.find(p => p.page_id === 'clients').id;

const pageTemplates = await gristAPI.getData('PageTemplates');
const templatesForPage = pageTemplates.filter(pt => pt.page_id === pageId);

templatesForPage.forEach(pt => {
    console.log(`Template utilisé: ${pt.template_id.template_name}`);
});
```

---

## ✅ Avantages du Schéma Relationnel

### 1. Intégrité Référentielle
✅ Impossible d'ajouter une vente avec un client_id inexistant
✅ Impossible de supprimer un client avec des ventes liées
✅ Grist affiche automatiquement les valeurs des références

### 2. Requêtes Simplifiées
✅ Accès direct aux données liées : `vente.client_id.nom`
✅ Pas besoin de jointures manuelles
✅ Grist gère automatiquement les relations

### 3. Interface Utilisateur
✅ Dropdowns automatiques pour sélection (ex: choisir un client)
✅ Affichage des noms au lieu des IDs
✅ Navigation entre tables liées dans l'UI Grist

### 4. Maintenance
✅ Schéma clair et documenté
✅ Facilite l'ajout de nouvelles tables
✅ Évite les duplications de données

---

## 📊 Diagramme Relationnel Complet

```
┌─────────────────────────────────────────────────────────────────┐
│                      ARCHITECTURE APP                            │
└─────────────────────────────────────────────────────────────────┘

   ┌─────────────┐                                 ┌─────────────┐
   │   Config    │                                 │   Pages     │
   │─────────────│                                 │─────────────│
   │ id (PK)     │                                 │ id (PK)     │
   │ config_key  │                                 │ page_id     │
   │ config_value│                                 │ page_name   │
   │ config_type │                                 │ icon        │
   └─────────────┘                                 │ order       │
                                                   │ component_  │
                                                   │   code      │
                                                   └──────┬──────┘
                                                          │ 1
                                                          │
                                                          │ N
                                            ┌─────────────┴─────────────┐
                                            │    PageTemplates          │
                                            │    (table liaison)        │
                                            │───────────────────────────│
                                            │ id (PK)                   │
                                            │ page_id (FK -> Pages)     │
                                            │ template_id (FK -> Templ) │
                                            │ order                     │
                                            └─────────────┬─────────────┘
                                                          │ N
                                                          │
                                                          │ 1
                                                   ┌──────┴──────┐
                                                   │  Templates  │
                                                   │─────────────│
                                                   │ id (PK)     │
                                                   │ template_id │
                                                   │ template_   │
                                                   │   name      │
                                                   │ category    │
                                                   │ component_  │
                                                   │   code      │
                                                   └─────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      BUSINESS DATA                               │
└─────────────────────────────────────────────────────────────────┘

   ┌─────────────┐                                 ┌─────────────┐
   │  Clients    │                                 │  Produits   │
   │─────────────│                                 │─────────────│
   │ id (PK)     │                                 │ id (PK)     │
   │ nom         │                                 │ nom         │
   │ email       │                                 │ prix        │
   │ entreprise  │                                 │ stock       │
   │ statut      │                                 │ categorie   │
   └──────┬──────┘                                 └──────┬──────┘
          │ 1                                             │ 1
          │                                               │
          │ N                                             │ N
          │            ┌─────────────┐                    │
          └───────────>│   Ventes    │<───────────────────┘
                       │─────────────│
                       │ id (PK)     │
                       │ client_id   │ (FK -> Clients)
                       │ produit_id  │ (FK -> Produits)
                       │ quantite    │
                       │ prix_unit.  │
                       │ montant_tot │ (formula)
                       │ date        │
                       └─────────────┘
```

---

## 🎯 Résumé

**7 tables** avec schéma relationnel complet :

### Architecture (4 tables)
1. **Config** - Configuration app (singleton)
2. **Pages** - Pages/vues de l'app
3. **Templates** - Composants réutilisables
4. **PageTemplates** - Liaison Pages ↔ Templates (many-to-many)

### Business Data (3 tables)
5. **Clients** - Informations clients
6. **Produits** - Catalogue produits
7. **Ventes** - Transactions avec relations vers Clients et Produits

**Relations Ref** :
- PageTemplates.page_id → Pages.id
- PageTemplates.template_id → Templates.id
- Ventes.client_id → Clients.id
- Ventes.produit_id → Produits.id

**Types de colonnes utilisés** :
- Text, Int, Numeric, Date, DateTime
- Choice (avec liste de valeurs)
- Ref:TableName (relations)
- Formula (calculs automatiques)

**Schéma professionnel prêt pour production ! 🚀**
