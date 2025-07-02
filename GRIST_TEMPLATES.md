# 🎨 Templates Grist - Guide Complet

## 🎯 Concept : Code Stocké dans Grist, Chargé Dynamiquement

Le système peut charger le code HTML, CSS et JavaScript directement depuis les enregistrements Grist ! Voici comment ça fonctionne :

## 🔄 Logique de Chargement

### 1. **Priorité Grist** (Recommandé)
Le système essaie d'abord de charger depuis la table `Templates` :
```javascript
// 1. Tentative de chargement depuis Grist
const gristTemplates = await grist.docApi.fetchTable('Templates');
if (gristTemplates && gristTemplates.length > 0) {
    // ✅ Templates Grist trouvés et utilisés
    this.templatesSource = 'grist';
}
```

### 2. **Fallback Intégré**
Si aucun template Grist, utilise les templates intégrés :
```javascript
// 2. Si aucun template Grist
if (this.templates.size === 0) {
    // 🔄 Utilise les templates intégrés comme fallback
    this.templatesSource = 'integrated';
}
```

## 📊 Structure Table Templates

### Colonnes Requises
| Colonne | Type | Description | Exemple |
|---------|------|-------------|---------|
| `template_id` | Text | ID unique du template | `dashboard_main` |
| `template_name` | Text | Nom affiché dans la navigation | `📊 Dashboard` |
| `type` | Choice | Type de template | `dashboard`, `list`, `form` |
| `table_source` | Text | Table Grist source des données | `Clients` |
| `html` | Text | Code HTML complet | `<div>Mon HTML</div>` |
| `css` | Text | Styles CSS | `.ma-classe { color: blue; }` |
| `js` | Text | Code JavaScript | `console.log('Hello');` |

## 🎨 Exemples de Templates

### 📊 Dashboard Personnalisé

```html
<!-- HTML -->
<div class="mon-dashboard" style="padding: 20px;">
    <div class="banner" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
        <h1>🎮 Template Chargé depuis Grist !</h1>
        <p>Ce template est stocké dans les enregistrements et chargé dynamiquement</p>
    </div>
    
    <div class="metrics" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
        <div class="metric-card" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div id="total-clients" style="font-size: 2rem; font-weight: bold;">0</div>
            <div style="color: #6b7280;">Total Clients</div>
        </div>
    </div>
</div>
```

```css
/* CSS */
.mon-dashboard .metric-card:hover {
    transform: translateY(-2px);
    transition: transform 0.2s;
}
```

```javascript
// JavaScript
class MonDashboard {
    async init() {
        console.log('🎨 Template personnalisé chargé depuis Grist !');
        const clients = await gristAPI.getData('Clients') || [];
        
        document.getElementById('total-clients').textContent = clients.length;
    }
}

const dashboard = new MonDashboard();
document.addEventListener('DOMContentLoaded', () => {
    dashboard.init();
});
```

### 👥 Liste Avancée

```html
<!-- HTML -->
<div class="ma-liste" style="padding: 20px; max-width: 1200px; margin: 0 auto;">
    <div class="header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h1>👥 Mes Clients Personnalisés</h1>
        <button onclick="ajouterClient()" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 6px;">
            ➕ Ajouter
        </button>
    </div>
    
    <div id="liste-clients">
        <!-- Généré dynamiquement -->
    </div>
</div>
```

```javascript
// JavaScript
class MaListe {
    async init() {
        const clients = await gristAPI.getData('Clients') || [];
        this.afficherClients(clients);
    }
    
    afficherClients(clients) {
        const html = clients.map(client => `
            <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <strong>${client.name}</strong> - ${client.company || 'N/A'}
                <span style="float: right;">
                    <button onclick="modifierClient(${client.id})">✏️</button>
                    <button onclick="supprimerClient(${client.id})">🗑️</button>
                </span>
            </div>
        `).join('');
        
        document.getElementById('liste-clients').innerHTML = html;
    }
}

async function ajouterClient() {
    const nom = prompt('Nom du client:');
    if (nom) {
        await gristAPI.addRecord('Clients', { name: nom });
        location.reload();
    }
}

const liste = new MaListe();
document.addEventListener('DOMContentLoaded', () => liste.init());
```

## 🔧 API Grist Disponible

### Chargement des Données
```javascript
// Récupérer tous les enregistrements d'une table
const clients = await gristAPI.getData('Clients');
const ventes = await gristAPI.getData('Ventes');
```

### Modification des Données
```javascript
// Ajouter un enregistrement
const result = await gristAPI.addRecord('Clients', {
    name: 'Nouveau Client',
    email: 'client@example.com',
    status: 'prospect'
});

// Modifier un enregistrement
await gristAPI.updateRecord('Clients', recordId, {
    status: 'actif'
});

// Supprimer un enregistrement
await gristAPI.deleteRecord('Clients', recordId);
```

### Navigation
```javascript
// Naviguer vers un autre template
gristAPI.navigate('autre_template_id');
```

## 🎯 Bonnes Pratiques

### 1. **Structure HTML Cohérente**
```html
<div class="template-container" style="padding: 20px; max-width: 1200px; margin: 0 auto;">
    <div class="template-header">
        <h1>Titre du Template</h1>
    </div>
    <div class="template-content">
        <!-- Contenu principal -->
    </div>
</div>
```

### 2. **CSS Scopé**
```css
/* Préfixer les classes pour éviter les conflits */
.mon-template .ma-classe {
    /* Styles spécifiques */
}
```

### 3. **JavaScript Modulaire**
```javascript
class MonTemplate {
    constructor() {
        this.data = [];
    }
    
    async init() {
        this.data = await gristAPI.getData('MaTable');
        this.render();
    }
    
    render() {
        // Logique de rendu
    }
}

// Instance unique
const monTemplate = new MonTemplate();
document.addEventListener('DOMContentLoaded', () => {
    monTemplate.init();
});
```

## 📝 Processus de Création

### Étape 1 : Créer l'Enregistrement
1. Ouvrir la table `Templates` dans Grist
2. Ajouter un nouvel enregistrement
3. Remplir les colonnes requises

### Étape 2 : Développer le Code
```sql
INSERT INTO Templates VALUES (
    'mon_template',                    -- template_id
    '🎨 Mon Template',                -- template_name  
    'custom',                         -- type
    'MaTable',                        -- table_source
    '<div>Mon HTML</div>',            -- html
    '.ma-classe { color: blue; }',    -- css
    'console.log("Hello");'           -- js
);
```

### Étape 3 : Tester
1. Recharger le widget dashboard
2. Le template apparaît dans la navigation
3. Cliquer pour tester le fonctionnement

## 🔄 Avantages du Système

### ✅ **Flexibilité Totale**
- Code modifiable directement dans Grist
- Pas besoin de redéployer le widget
- Personnalisation en temps réel

### ✅ **Versioning**
- Historique des modifications dans Grist
- Possibilité de créer plusieurs versions
- Rollback facile en cas de problème

### ✅ **Collaboration**
- Plusieurs développeurs peuvent créer des templates
- Partage facile via export/import Grist
- Gestion des permissions Grist

### ✅ **Performance**
- Templates mis en cache
- Chargement à la demande
- Optimisation automatique

## 🎮 Exemples Avancés

### Template avec Graphiques
```javascript
class TemplateGraphique {
    async init() {
        const data = await gristAPI.getData('Ventes');
        this.dessinerGraphique(data);
    }
    
    dessinerGraphique(data) {
        const canvas = document.getElementById('mon-canvas');
        const ctx = canvas.getContext('2d');
        
        // Logique de dessin personnalisée
    }
}
```

### Template avec Formulaire
```javascript
class TemplateFormulaire {
    async init() {
        this.configurerFormulaire();
    }
    
    configurerFormulaire() {
        document.getElementById('mon-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            await gristAPI.addRecord('MaTable', {
                nom: formData.get('nom'),
                email: formData.get('email')
            });
            
            alert('Enregistrement ajouté !');
        });
    }
}
```

## 🚀 Résultat

**Vous pouvez maintenant créer des interfaces complètes stockées directement dans Grist !**

- 🎨 **Code dans Grist** : HTML, CSS, JS dans les enregistrements
- 🔄 **Chargement dynamique** : Templates compilés et injectés en temps réel  
- 📊 **Données temps réel** : Accès direct aux tables Grist
- 🎮 **Interface riche** : Navigation, CRUD, graphiques personnalisés

**La combinaison parfaite : simplicité de Grist + puissance des applications web !** 🎉