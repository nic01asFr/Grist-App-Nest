# 🚀 Grist Dynamic Dashboard System

Un système révolutionnaire qui transforme Grist en plateforme de création d'applications dynamiques !

## 🎯 Qu'est-ce que c'est ?

Ce système permet de créer des dashboards interactifs dans Grist avec :
- **Navigation dynamique** entre pages
- **Templates intégrés** (Dashboard, Liste, Graphiques)
- **Interaction temps réel** avec les données Grist
- **Interface moderne** et responsive

## 🚀 Installation Rapide

### 1. Configuration du Widget Grist

1. **Créer un nouveau document Grist**
2. **Ajouter un Custom Widget** :
   - Cliquez sur "Add New" → "Add Widget" → "Custom"
   - **URL du widget** : `https://raw.githubusercontent.com/nic01asFr/grist-dynamic-dashboard/main/index.html`
   - **Accès requis** : "Read table"

### 2. Tables Recommandées (Optionnelles)

Le système fonctionne avec des tables par défaut, mais vous pouvez créer vos propres tables :

#### Table `Clients`
```
name (Text) - Nom du client
company (Text) - Entreprise
email (Text) - Email
status (Choice) - actif, inactif, prospect
created_at (DateTime) - Date de création
```

#### Table `Ventes`
```
client_id (Numeric) - ID du client
produit (Text) - Nom du produit
montant (Numeric) - Montant de la vente
date (Date) - Date de la vente
```

### 3. Configuration Avancée (Optionnelle)

Pour personnaliser davantage, créez ces tables :

#### Table `Apps`
```
id (Text) - Identifiant de l'app (ex: "app_crm")
name (Text) - Nom affiché
page (Text) - Page par défaut
config (Text) - Configuration JSON
```

#### Table `Templates`
```
id (Text) - ID du template
name (Text) - Nom affiché
type (Choice) - dashboard, list, chart
table_source (Text) - Table source des données
html (Text) - Code HTML
css (Text) - Code CSS
js (Text) - Code JavaScript
```

## 🎨 Fonctionnalités

### 📊 Dashboard Principal
- **Métriques en temps réel** : Total clients, CA, ventes récentes
- **Graphiques interactifs** : Répartition des statuts, évolution des ventes
- **Actions rapides** : Navigation, ajout de clients

### 👥 Gestion des Clients
- **Liste complète** avec recherche et filtres
- **Actions CRUD** : Ajouter, modifier, supprimer
- **Statistiques** : Compteurs par statut

### 📈 Analyses des Ventes
- **Graphiques avancés** : Évolution du CA, répartition produits
- **Filtres temporels** : 7 jours, 30 jours, 3 mois, 12 mois
- **Métriques clés** : CA total, panier moyen, croissance

## 💡 Utilisation

### Navigation
- Utilisez les **boutons de navigation** en haut pour changer de page
- Le système charge dynamiquement les contenus dans des iframes

### Interaction avec les Données
- **Ajout** : Utilisez les boutons "+" pour ajouter des enregistrements
- **Modification** : Cliquez sur "Éditer" dans les listes
- **Suppression** : Bouton "Suppr." avec confirmation

### Templates Intégrés
Le système inclut 3 templates pré-configurés :
1. **Dashboard Main** - Vue d'ensemble avec métriques
2. **List Clients** - Gestion des clients avec CRUD
3. **Chart Ventes** - Analyses graphiques des ventes

## 🔧 Architecture Technique

### Structure du Code
```
index.html
├── CSS intégré (styles modernes)
├── JavaScript (logique métier)
└── Templates intégrés
    ├── dashboard_main (tableau de bord)
    ├── list_clients (gestion clients)
    └── chart_ventes (analyses)
```

### API Grist Simplifiée
```javascript
// Chargement des données
const data = await gristAPI.getData('TableName');

// Ajout d'un enregistrement
await gristAPI.addRecord('TableName', { field: 'value' });

// Modification
await gristAPI.updateRecord('TableName', recordId, { field: 'newValue' });

// Suppression
await gristAPI.deleteRecord('TableName', recordId);

// Navigation
gristAPI.navigate('template_id');
```

## 🎨 Personnalisation

### Modifier les Templates
1. **Fork** ce repository
2. **Modifier** les templates dans `INTEGRATED_TEMPLATES`
3. **Changer l'URL** du widget dans Grist

### Ajouter de Nouveaux Templates
```javascript
new_template: {
    id: 'new_template',
    name: '🆕 Nouveau',
    type: 'custom',
    html: `<div>Votre HTML</div>`,
    css: `/* Votre CSS */`,
    js: `/* Votre JavaScript */`
}
```

## 🚀 Avantages

✅ **Installation en 2 minutes** - Copy-paste l'URL et c'est prêt !  
✅ **Templates intégrés** - Pas besoin de configuration  
✅ **Données temps réel** - Synchronisation automatique avec Grist  
✅ **Interface moderne** - Design responsive et professionnel  
✅ **Extensible** - Ajoutez vos propres templates facilement  
✅ **Sécurisé** - Isolation des iframes et API contrôlée  

## 🐛 Dépannage

### Le widget ne se charge pas
- Vérifiez l'URL : `https://raw.githubusercontent.com/nic01asFr/grist-dynamic-dashboard/main/index.html`
- Assurez-vous que l'accès "Read table" est activé

### Erreur "Table not found"
- Le système fonctionne sans tables spécifiques
- Créez les tables `Clients` et `Ventes` pour plus de fonctionnalités

### Les graphiques sont vides
- Ajoutez des données dans les tables `Clients` et `Ventes`
- Vérifiez les formats des dates et montants

## 🎯 Exemples de Données

### Clients d'exemple
```
Jean Dupont | Acme Corp | jean@acme.com | actif
Marie Martin | Tech Solutions | marie@tech.com | prospect
Pierre Durand | Innovation SARL | pierre@innov.com | actif
```

### Ventes d'exemple
```
Client ID: 1 | Produit: Logiciel Pro | Montant: 1200 | Date: 2024-06-01
Client ID: 1 | Produit: Support Premium | Montant: 300 | Date: 2024-06-15
Client ID: 3 | Produit: Logiciel Standard | Montant: 800 | Date: 2024-06-20
```

## 📞 Support

Pour toute question ou amélioration :
1. **Issues GitHub** : Créez une issue sur ce repository
2. **Fork & PR** : Contribuez avec vos améliorations
3. **Documentation Grist** : [docs.getgrist.com](https://docs.getgrist.com)

## 🎉 Résultat

Vous obtenez une **application complète** dans Grist avec :
- Dashboard temps réel
- Gestion des clients
- Analyses graphiques
- Navigation fluide
- Interface professionnelle

**Transformez Grist en plateforme applicative en quelques minutes !** 🚀