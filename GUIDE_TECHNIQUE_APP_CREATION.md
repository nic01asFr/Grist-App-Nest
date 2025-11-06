# 📘 Guide Technique Exhaustif - Création d'Applications Grist App Nest

## 🎯 Table des Matières

1. [Architecture Technique Complète](#architecture-technique)
2. [Système de Gestion des Données Columnar](#données-columnar)
3. [API gristAPI - Référence Complète](#api-gristapi)
4. [Système de Rendu React/Babel](#rendu-react)
5. [Contraintes Techniques Obligatoires](#contraintes)
6. [Guide Complet de Création d'Applications](#création-app)
7. [Patterns et Best Practices](#patterns)
8. [Debugging et Résolution de Problèmes](#debugging)

---

## 🏗️ Architecture Technique Complète {#architecture-technique}

### 1.1 Vue d'Ensemble du Système

Le système Grist App Nest repose sur une architecture en 3 couches :

```
┌─────────────────────────────────────────────────────────┐
│                    COUCHE 1: STOCKAGE                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Tables Grist (Base de Données)            │  │
│  │  • Templates (composants JSX)                    │  │
│  │  • Business Data (Clients, Ventes, etc.)         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ⬇️
┌─────────────────────────────────────────────────────────┐
│                 COUCHE 2: WIDGET HTML                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │   OptimalGristDashboard Class                    │  │
│  │   • Chargement des composants                    │  │
│  │   • Conversion format columnar                   │  │
│  │   • API gristAPI unifiée                         │  │
│  │   • Système de navigation                        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ⬇️
┌─────────────────────────────────────────────────────────┐
│                COUCHE 3: RENDU REACT                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Babel Transformation + React Rendering         │  │
│  │   • JSX → JavaScript                             │  │
│  │   • Composants dans iframes isolées              │  │
│  │   • Gestion du cycle de vie React                │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Classe OptimalGristDashboard - Structure Interne

```javascript
class OptimalGristDashboard {
    constructor() {
        // État interne du système
        this.components = new Map();      // Stockage des composants chargés
        this.currentComponent = null;     // Composant actuellement affiché
        this.isReady = false;            // État d'initialisation
        this.gristAPI = null;            // Instance API pour composants
    }

    // Cycle d'initialisation
    async init() {
        1. Initialiser Grist Plugin API
        2. Créer l'instance gristAPI
        3. Charger les composants depuis Grist
        4. Configurer la navigation
        5. Charger le composant par défaut
        6. Marquer comme prêt
    }
}
```

### 1.3 Flux de Données Complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER ACTION                                              │
│    • Navigation vers composant                              │
│    • CRUD operation                                         │
└────────────────────┬────────────────────────────────────────┘
                     ⬇️
┌─────────────────────────────────────────────────────────────┐
│ 2. GRIST PLUGIN API                                         │
│    grist.docApi.fetchTable('Templates')                     │
│    ➜ Format columnar natif Grist                            │
└────────────────────┬────────────────────────────────────────┘
                     ⬇️
┌─────────────────────────────────────────────────────────────┐
│ 3. CONVERSION COLUMNAR                                      │
│    {id: [1,2], name: ['a','b']}                            │
│    ➜ [{id: 1, name: 'a'}, {id: 2, name: 'b'}]            │
└────────────────────┬────────────────────────────────────────┘
                     ⬇️
┌─────────────────────────────────────────────────────────────┐
│ 4. BABEL TRANSFORMATION                                     │
│    JSX Code ➜ JavaScript                                    │
│    <div>Hello</div> ➜ React.createElement('div', ...)      │
└────────────────────┬────────────────────────────────────────┘
                     ⬇️
┌─────────────────────────────────────────────────────────────┐
│ 5. REACT RENDERING                                          │
│    ReactDOM.render(Component, container)                    │
│    ➜ DOM réel dans le navigateur                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Système de Gestion des Données Columnar {#données-columnar}

### 2.1 Comprendre le Format Columnar de Grist

Grist stocke les données en **format columnar** pour optimiser les performances. Voici pourquoi :

**Avantages du format columnar :**
- Compression optimale des données similaires
- Accès rapide à une colonne entière
- Performance sur grandes quantités de données

**Format retourné par Grist :**
```javascript
{
  id: [1, 2, 3, 4, 5],
  name: ['Alice', 'Bob', 'Charlie', 'David', 'Emma'],
  email: ['alice@test.com', 'bob@test.com', 'charlie@test.com', 'david@test.com', 'emma@test.com'],
  status: ['active', 'prospect', 'active', 'inactive', 'active'],
  created_at: [1620000000, 1620086400, 1620172800, 1620259200, 1620345600]
}
```

### 2.2 Algorithme de Conversion Détaillé

```javascript
function convertColumnarToRows(columnarData) {
    // Étape 1: Identifier les colonnes
    const columns = Object.keys(columnarData);
    console.log('📋 Colonnes détectées:', columns);

    // Étape 2: Vérifier le format columnar
    // (au moins une colonne doit être un array)
    const isColumnar = columns.some(col => Array.isArray(columnarData[col]));

    if (!isColumnar) {
        console.warn('⚠️ Format non-columnar détecté');
        return [];
    }

    // Étape 3: Trouver la première colonne array pour déterminer le nombre de lignes
    const firstArrayCol = columns.find(col => Array.isArray(columnarData[col]));
    const rowCount = columnarData[firstArrayCol]?.length || 0;

    console.log(`🔢 Nombre de lignes à créer: ${rowCount}`);

    // Étape 4: Construire les lignes
    const rows = [];

    for (let i = 0; i < rowCount; i++) {
        const row = {};

        // Pour chaque colonne, extraire la valeur à l'index i
        columns.forEach(col => {
            if (Array.isArray(columnarData[col])) {
                // Colonne array: prendre la valeur à l'index i
                row[col] = columnarData[col][i];
            } else {
                // Colonne scalaire: utiliser la valeur telle quelle
                row[col] = columnarData[col];
            }
        });

        rows.push(row);
    }

    console.log(`✅ ${rows.length} lignes converties`);
    return rows;
}
```

### 2.3 Cas Particuliers et Edge Cases

#### Cas 1: Colonnes de longueurs différentes
```javascript
// ⚠️ Problème potentiel
{
  id: [1, 2, 3],
  name: ['Alice', 'Bob']  // ⚠️ Longueur différente !
}

// ✅ Solution: Utiliser la première colonne array comme référence
// Résultat: 2 lignes (basé sur 'name' si c'est la première colonne array)
```

#### Cas 2: Mélange de colonnes scalaires et arrays
```javascript
// Format mixte (valide)
{
  id: [1, 2, 3],
  name: ['Alice', 'Bob', 'Charlie'],
  version: 'v1.0'  // ✅ Scalaire: même valeur pour toutes les lignes
}

// Résultat converti:
[
  { id: 1, name: 'Alice', version: 'v1.0' },
  { id: 2, name: 'Bob', version: 'v1.0' },
  { id: 3, name: 'Charlie', version: 'v1.0' }
]
```

#### Cas 3: Données vides
```javascript
// Table vide
{
  id: [],
  name: []
}

// Résultat: []
```

### 2.4 Performance de la Conversion

| Nombre de lignes | Temps de conversion | Mémoire utilisée |
|-----------------|---------------------|------------------|
| 10              | < 1ms               | Négligeable      |
| 100             | < 5ms               | < 1KB            |
| 1,000           | < 50ms              | < 100KB          |
| 10,000          | < 500ms             | < 1MB            |
| 100,000         | < 5s                | < 10MB           |

**⚠️ Recommandation:** Pour plus de 10,000 lignes, considérer la pagination côté Grist.

---

## 🔌 API gristAPI - Référence Complète {#api-gristapi}

### 3.1 Vue d'Ensemble de l'API

L'API `gristAPI` est injectée dans chaque composant et fournit une interface unifiée pour interagir avec Grist.

```javascript
// API disponible dans TOUS les composants
const gristAPI = {
    // Données
    getData(tableName),
    addRecord(tableName, record),
    updateRecord(tableName, recordId, updates),
    deleteRecord(tableName, recordId),

    // Navigation
    navigate(componentId),

    // Composants enfants (v3.4+)
    getChildComponent(templateId),
    createChildComponent(template)
};
```

### 3.2 getData() - Récupération des Données

**Signature:**
```javascript
async getData(tableName: string): Promise<Array<Object>>
```

**Comportement détaillé:**
```javascript
const data = await gristAPI.getData('Clients');

// Étapes internes:
// 1. Appel Grist API: grist.docApi.fetchTable('Clients')
// 2. Réception format columnar
// 3. Détection automatique du format
// 4. Conversion vers array d'objets
// 5. Logs de debug
// 6. Retour des données converties
```

**Logs de debug générés:**
```
🔍 Données brutes pour Clients: {id: [1,2,3], name: ['Alice','Bob','Charlie']}
🔧 Analyse format Clients: {columns: ['id','name'], isColumnar: true}
🔧 Conversion columnar Clients: {rowCount: 3, firstArrayCol: 'id'}
✅ Données converties pour Clients: [{id: 1, name: 'Alice'}, ...]
```

**Gestion des erreurs:**
```javascript
try {
    const data = await gristAPI.getData('TableInexistante');
    // data === [] (array vide si table n'existe pas)
} catch (error) {
    // Erreur loggée mais ne crash pas
    console.warn('❌ Table TableInexistante non trouvée');
}
```

**Exemple complet:**
```javascript
const Component = () => {
    const [clients, setClients] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            const data = await gristAPI.getData('Clients');
            console.log('Clients chargés:', data);

            // Validation supplémentaire
            if (Array.isArray(data)) {
                setClients(data);
            } else {
                console.error('Format inattendu:', data);
                setClients([]);
            }
        };

        loadData();
    }, []);

    return (
        <div>
            {clients.map(client => (
                <div key={client.id}>{client.name}</div>
            ))}
        </div>
    );
};
```

### 3.3 addRecord() - Ajout d'Enregistrement

**Signature:**
```javascript
async addRecord(tableName: string, record: Object): Promise<number>
```

**Comportement:**
```javascript
const newId = await gristAPI.addRecord('Clients', {
    name: 'Nouveau Client',
    email: 'client@example.com',
    status: 'prospect'
});

console.log('ID créé:', newId);
// Retourne l'ID du nouvel enregistrement
```

**Structure record:**
```javascript
// ✅ Correct
{
    colonne1: 'valeur1',
    colonne2: 'valeur2'
}

// ❌ Incorrect (pas d'ID dans l'ajout)
{
    id: 123,  // ❌ ID géré automatiquement par Grist
    name: 'Test'
}
```

**Appel Grist sous-jacent:**
```javascript
await grist.docApi.applyUserActions([
    ['AddRecord', 'Clients', null, {
        name: 'Nouveau Client',
        email: 'client@example.com'
    }]
]);
```

### 3.4 updateRecord() - Modification d'Enregistrement

**Signature:**
```javascript
async updateRecord(tableName: string, recordId: number, updates: Object): Promise<boolean>
```

**Exemple:**
```javascript
// Modifier le statut d'un client
await gristAPI.updateRecord('Clients', 42, {
    status: 'active',
    updated_at: Date.now()
});

// ✅ Retourne true si succès
// ❌ Throw error si échec
```

**Mise à jour partielle:**
```javascript
// ✅ Seuls les champs spécifiés sont modifiés
await gristAPI.updateRecord('Clients', 42, {
    status: 'active'
    // Les autres champs (name, email, etc.) restent inchangés
});
```

### 3.5 deleteRecord() - Suppression d'Enregistrement

**Signature:**
```javascript
async deleteRecord(tableName: string, recordId: number): Promise<boolean>
```

**Exemple avec confirmation:**
```javascript
const deleteClient = async (clientId) => {
    const confirmed = confirm('Supprimer ce client ?');

    if (confirmed) {
        try {
            await gristAPI.deleteRecord('Clients', clientId);
            console.log('Client supprimé');
            // Recharger les données
            await loadClients();
        } catch (error) {
            alert('Erreur suppression: ' + error.message);
        }
    }
};
```

### 3.6 navigate() - Navigation entre Composants

**Signature:**
```javascript
navigate(componentId: string): void
```

**Exemple:**
```javascript
const DashboardMenu = () => {
    return (
        <div>
            <button onClick={() => gristAPI.navigate('clients')}>
                👥 Voir Clients
            </button>
            <button onClick={() => gristAPI.navigate('ventes')}>
                💰 Voir Ventes
            </button>
            <button onClick={() => gristAPI.navigate('dashboard')}>
                📊 Dashboard
            </button>
        </div>
    );
};
```

**Comportement interne:**
```javascript
navigate: (componentId) => {
    // 1. Rechercher le composant
    const component = this.components.get(componentId);

    // 2. Charger le composant
    this.loadComponent(componentId);

    // 3. Mettre à jour la navigation (bouton actif)
    // 4. Stocker dans l'historique
    // 5. Optionnel: Mettre à jour l'URL (hash)
}
```

### 3.7 getChildComponent() - Composants Enfants (v3.4+)

**Signature:**
```javascript
async getChildComponent(templateId: string): Promise<ReactComponent | null>
```

**Utilisation:**
```javascript
const Component = () => {
    const [ChildComponent, setChildComponent] = useState(null);

    useEffect(() => {
        const loadChild = async () => {
            const child = await gristAPI.getChildComponent('client_card');
            setChildComponent(() => child);
        };

        loadChild();
    }, []);

    return (
        <div>
            <h1>Parent Component</h1>
            {ChildComponent && <ChildComponent />}
        </div>
    );
};
```

**Cas d'usage:**
- Composants réutilisables (cartes, boutons, formulaires)
- Composition d'interfaces complexes
- Bibliothèque de composants partagés

---

## ⚛️ Système de Rendu React/Babel {#rendu-react}

### 4.1 Processus de Transformation JSX

**Étape 1: Code JSX Original**
```javascript
const Component = () => {
    const [count, setCount] = useState(0);

    return (
        <div>
            <h1>Compteur: {count}</h1>
            <button onClick={() => setCount(count + 1)}>
                Incrémenter
            </button>
        </div>
    );
};
```

**Étape 2: Transformation Babel**
```javascript
// Configuration Babel
const transformedCode = Babel.transform(jsxCode, {
    presets: ['react'],
    plugins: ['proposal-class-properties']
}).code;

// Résultat:
const Component = () => {
    const [count, setCount] = useState(0);

    return React.createElement(
        'div',
        null,
        React.createElement('h1', null, 'Compteur: ', count),
        React.createElement(
            'button',
            { onClick: () => setCount(count + 1) },
            'Incrémenter'
        )
    );
};
```

**Étape 3: Création de la Fonction Composant**
```javascript
const componentFunction = new Function(
    'React',           // React library
    'ReactDOM',        // ReactDOM library
    'gristAPI',        // API Grist
    'container',       // DOM container
    `
    // Destructuration des hooks
    const { useState, useEffect, useCallback } = React;
    const { render } = ReactDOM;

    // Code transformé par Babel
    ${transformedCode}

    // Rendu du composant
    if (typeof Component !== 'undefined') {
        render(React.createElement(Component), container);
    } else {
        throw new Error('Composant non défini');
    }
    `
);
```

**Étape 4: Exécution**
```javascript
componentFunction(
    React,                  // React 18
    ReactDOM,              // ReactDOM 18
    this.gristAPI,         // Instance API
    reactContainer         // DOM element
);
```

### 4.2 Contexte d'Exécution Sécurisé

**Variables disponibles dans le composant:**
```javascript
// ✅ Automatiquement disponibles
const { useState, useEffect, useCallback, useMemo, useRef } = React;
const gristAPI = { ... };  // API complète

// ❌ Non disponibles
// - require()
// - import/export
// - fetch() direct (utiliser gristAPI)
// - localStorage, sessionStorage (accès limité)
// - window.location (navigation via gristAPI.navigate)
```

### 4.3 Gestion des Erreurs de Rendu

**Système d'Error Boundary automatique:**
```javascript
try {
    componentFunction(React, ReactDOM, this.gristAPI, container);
} catch (error) {
    console.error('Erreur rendu composant:', error);

    // Affichage d'une erreur user-friendly
    container.innerHTML = `
        <div class="error-container">
            <h3>🚨 Erreur Composant</h3>
            <p><strong>Message:</strong> ${error.message}</p>
            <pre>${error.stack}</pre>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>Vérifiez la syntaxe JSX</li>
                <li>Variable 'Component' définie ?</li>
                <li>Imports React corrects ?</li>
            </ul>
        </div>
    `;
}
```

**Erreurs courantes et solutions:**

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Component is not defined` | Variable mal nommée | Nommer `const Component = ...` |
| `useState is not defined` | Hook non disponible | Vérifier la destructuration React |
| `Unexpected token '<'` | JSX non transformé | Vérifier Babel |
| `Cannot read property 'map' of undefined` | Data non array | Valider avec `Array.isArray()` |

---

## ⚙️ Contraintes Techniques Obligatoires {#contraintes}

### 5.1 Contraintes sur le Nom du Composant

**❌ INCORRECT:**
```javascript
// Ne fonctionnera PAS
const MyDashboard = () => {
    return <div>Dashboard</div>;
};

const App = () => {
    return <div>App</div>;
};

function ClientList() {
    return <div>Clients</div>;
}
```

**✅ CORRECT:**
```javascript
// Doit TOUJOURS être nommé "Component"
const Component = () => {
    return <div>Dashboard</div>;
};
```

**Raison technique:**
```javascript
// Le système cherche spécifiquement "Component"
if (typeof Component !== 'undefined') {
    render(React.createElement(Component), container);
} else {
    throw new Error('Composant non défini');
}
```

### 5.2 Contraintes sur les Hooks React

**✅ Hooks disponibles:**
```javascript
const Component = () => {
    // ✅ useState
    const [state, setState] = useState(initialValue);

    // ✅ useEffect
    useEffect(() => {
        // effect
    }, [dependencies]);

    // ✅ useCallback
    const memoizedCallback = useCallback(() => {
        // callback
    }, [dependencies]);

    // ✅ useMemo
    const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

    // ✅ useRef
    const ref = useRef(initialValue);

    return <div>Component</div>;
};
```

**❌ Hooks NON disponibles:**
```javascript
// ❌ useContext (pas de Context Provider dans ce système)
const value = useContext(MyContext);

// ❌ useReducer (pas implémenté)
const [state, dispatch] = useReducer(reducer, initialState);

// ❌ Custom hooks (possibles mais complexes)
```

### 5.3 Contraintes sur les Styles

**✅ MÉTHODE 1: Styles inline (Recommandé)**
```javascript
const Component = () => {
    return (
        <div style={{
            padding: '20px',
            background: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
            Contenu stylé
        </div>
    );
};
```

**✅ MÉTHODE 2: Objet de styles**
```javascript
const Component = () => {
    const styles = {
        container: {
            padding: '20px',
            background: '#ffffff'
        },
        title: {
            fontSize: '2rem',
            color: '#1f2937'
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Titre</h1>
        </div>
    );
};
```

**⚠️ MÉTHODE 3: CSS-in-JS (Avancé)**
```javascript
const Component = () => {
    return (
        <div>
            <style jsx>{`
                .container {
                    padding: 20px;
                    background: white;
                }
                .title {
                    font-size: 2rem;
                }
            `}</style>
            <div className="container">
                <h1 className="title">Titre</h1>
            </div>
        </div>
    );
};
```

**❌ INCORRECT:**
```javascript
// ❌ Import CSS externe
import './styles.css';  // Ne fonctionne pas

// ❌ Référence à classe CSS globale (non définie)
<div className="ma-classe-externe">...</div>
```

### 5.4 Contraintes sur les Imports/Exports

**❌ Imports NON supportés:**
```javascript
// ❌ Import ES6
import React from 'react';
import { useState } from 'react';

// ❌ Import CommonJS
const React = require('react');

// ❌ Import de bibliothèques externes
import axios from 'axios';
import lodash from 'lodash';
```

**✅ Alternative - Tout est déjà disponible:**
```javascript
const Component = () => {
    // React et hooks déjà disponibles
    const [state, setState] = useState(0);

    // gristAPI déjà injecté
    const data = await gristAPI.getData('Table');

    return <div>Component</div>;
};
```

### 5.5 Contraintes sur les Données

**✅ Format attendu:**
```javascript
// Toujours un array d'objets après conversion
const data = await gristAPI.getData('Clients');
// data = [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}]

// ✅ Validation recommandée
if (Array.isArray(data)) {
    data.map(item => ...)
}
```

**❌ Formats NON supportés directement:**
```javascript
// Grist retourne du columnar, pas ces formats
// (mais la conversion est automatique)
const data = {
    id: [1, 2, 3],
    name: ['a', 'b', 'c']
};  // ❌ Ne pas utiliser directement
```

---

## 🎨 Guide Complet de Création d'Applications {#création-app}

### 6.1 Structure de Base d'une Application

**Template minimum viable:**
```javascript
const Component = () => {
    // 1. État local
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 2. Chargement des données
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await gristAPI.getData('MaTable');
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 3. Gestion des états
    if (loading) return <div>Chargement...</div>;
    if (error) return <div>Erreur: {error}</div>;

    // 4. Rendu principal
    return (
        <div style={{ padding: '20px' }}>
            <h1>Mon Application</h1>
            {data.map(item => (
                <div key={item.id}>{item.name}</div>
            ))}
        </div>
    );
};
```

### 6.2 Pattern: Dashboard avec Métriques

**Application complète:**
```javascript
const Component = () => {
    const [metrics, setMetrics] = useState({
        clients: 0,
        ventes: 0,
        ca: 0,
        prospect: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        try {
            // Chargement parallèle pour performance
            const [clients, ventes] = await Promise.all([
                gristAPI.getData('Clients'),
                gristAPI.getData('Ventes')
            ]);

            // Calculs
            const ca = ventes.reduce((sum, v) => sum + (v.montant || 0), 0);
            const prospects = clients.filter(c => c.status === 'prospect').length;

            setMetrics({
                clients: clients.length,
                ventes: ventes.length,
                ca: ca,
                prospect: prospects
            });
        } catch (error) {
            console.error('Erreur chargement métriques:', error);
        } finally {
            setLoading(false);
        }
    };

    // Composant carte métrique réutilisable
    const MetricCard = ({ title, value, icon, color }) => (
        <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            textAlign: 'center'
        }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>
                {icon}
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: color }}>
                {value}
            </div>
            <div style={{ color: '#6b7280', marginTop: '5px' }}>
                {title}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                Chargement des métriques...
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '30px',
                borderRadius: '12px',
                marginBottom: '30px',
                textAlign: 'center'
            }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
                    📊 Dashboard Entreprise
                </h1>
                <p style={{ fontSize: '1.2rem', opacity: '0.9' }}>
                    Vue d'ensemble des activités
                </p>
            </div>

            {/* Grille de métriques */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px'
            }}>
                <MetricCard
                    title="Total Clients"
                    value={metrics.clients}
                    icon="👥"
                    color="#10b981"
                />
                <MetricCard
                    title="Prospects"
                    value={metrics.prospect}
                    icon="🎯"
                    color="#f59e0b"
                />
                <MetricCard
                    title="Ventes"
                    value={metrics.ventes}
                    icon="💰"
                    color="#3b82f6"
                />
                <MetricCard
                    title="Chiffre d'Affaires"
                    value={`${metrics.ca.toLocaleString()}€`}
                    icon="📈"
                    color="#8b5cf6"
                />
            </div>

            {/* Bouton rafraîchir */}
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button
                    onClick={loadMetrics}
                    style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        fontSize: '16px',
                        cursor: 'pointer'
                    }}
                >
                    🔄 Actualiser
                </button>
            </div>
        </div>
    );
};
```

### 6.3 Pattern: Liste avec CRUD Complet

```javascript
const Component = () => {
    const [items, setItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        try {
            setLoading(true);
            const data = await gristAPI.getData('Clients');
            setItems(data);
        } catch (error) {
            console.error('Erreur chargement:', error);
        } finally {
            setLoading(false);
        }
    };

    // CREATE
    const addItem = async () => {
        try {
            await gristAPI.addRecord('Clients', formData);
            setFormData({});
            await loadItems();
        } catch (error) {
            alert('Erreur ajout: ' + error.message);
        }
    };

    // UPDATE
    const updateItem = async () => {
        try {
            await gristAPI.updateRecord('Clients', editingItem.id, formData);
            setEditingItem(null);
            setFormData({});
            await loadItems();
        } catch (error) {
            alert('Erreur modification: ' + error.message);
        }
    };

    // DELETE
    const deleteItem = async (itemId) => {
        if (confirm('Confirmer la suppression ?')) {
            try {
                await gristAPI.deleteRecord('Clients', itemId);
                await loadItems();
            } catch (error) {
                alert('Erreur suppression: ' + error.message);
            }
        }
    };

    // Démarrer l'édition
    const startEdit = (item) => {
        setEditingItem(item);
        setFormData({ ...item });
    };

    // Annuler l'édition
    const cancelEdit = () => {
        setEditingItem(null);
        setFormData({});
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px'
            }}>
                <h1 style={{ fontSize: '2rem', color: '#1f2937' }}>
                    👥 Gestion des Clients
                </h1>
                <button
                    onClick={() => setEditingItem({})}
                    style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        fontSize: '16px',
                        cursor: 'pointer'
                    }}
                >
                    ➕ Nouveau Client
                </button>
            </div>

            {/* Formulaire (si édition ou nouveau) */}
            {(editingItem !== null) && (
                <div style={{
                    background: 'white',
                    padding: '25px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    marginBottom: '20px'
                }}>
                    <h2 style={{ marginBottom: '20px' }}>
                        {editingItem.id ? '✏️ Modifier' : '➕ Nouveau'} Client
                    </h2>

                    <div style={{ display: 'grid', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                Nom:
                            </label>
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                Email:
                            </label>
                            <input
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button
                                onClick={editingItem.id ? updateItem : addItem}
                                style={{
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                💾 Enregistrer
                            </button>
                            <button
                                onClick={cancelEdit}
                                style={{
                                    background: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                ❌ Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Liste des items */}
            <div style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                {items.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                        Aucun client trouvé. Cliquez sur "Nouveau Client" pour commencer.
                    </div>
                ) : (
                    <div>
                        {items.map((item, index) => (
                            <div
                                key={item.id || index}
                                style={{
                                    padding: '15px 20px',
                                    borderBottom: index < items.length - 1 ? '1px solid #e5e7eb' : 'none',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: '500', fontSize: '1.1rem', marginBottom: '5px' }}>
                                        {item.name}
                                    </div>
                                    <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                                        {item.email}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => startEdit(item)}
                                        style={{
                                            background: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        ✏️ Modifier
                                    </button>
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        style={{
                                            background: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        🗑️ Supprimer
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
```

### 6.4 Pattern: Formulaire Complexe avec Validation

```javascript
const Component = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        phone: '',
        status: 'prospect'
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Validation
    const validate = () => {
        const newErrors = {};

        if (!formData.name || formData.name.trim() === '') {
            newErrors.name = 'Le nom est requis';
        }

        if (!formData.email) {
            newErrors.email = 'L\'email est requis';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email invalide';
        }

        if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Téléphone invalide (10 chiffres)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Soumission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            alert('Veuillez corriger les erreurs');
            return;
        }

        try {
            setSubmitting(true);
            await gristAPI.addRecord('Clients', formData);

            // Réinitialiser
            setFormData({
                name: '',
                email: '',
                company: '',
                phone: '',
                status: 'prospect'
            });

            alert('Client ajouté avec succès !');
        } catch (error) {
            alert('Erreur: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Composant champ de formulaire
    const FormField = ({ label, name, type = 'text', required = false }) => (
        <div style={{ marginBottom: '20px' }}>
            <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#374151'
            }}>
                {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>

            {type === 'select' ? (
                <select
                    value={formData[name] || ''}
                    onChange={(e) => setFormData({...formData, [name]: e.target.value})}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: errors[name] ? '1px solid #ef4444' : '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                    }}
                >
                    <option value="prospect">Prospect</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                </select>
            ) : (
                <input
                    type={type}
                    value={formData[name] || ''}
                    onChange={(e) => setFormData({...formData, [name]: e.target.value})}
                    onBlur={validate}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: errors[name] ? '1px solid #ef4444' : '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                    }}
                />
            )}

            {errors[name] && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px' }}>
                    {errors[name]}
                </div>
            )}
        </div>
    );

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '30px', color: '#1f2937' }}>
                    ➕ Nouveau Client
                </h1>

                <form onSubmit={handleSubmit}>
                    <FormField label="Nom" name="name" required />
                    <FormField label="Email" name="email" type="email" required />
                    <FormField label="Société" name="company" />
                    <FormField label="Téléphone" name="phone" type="tel" />
                    <FormField label="Statut" name="status" type="select" required />

                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            width: '100%',
                            background: submitting ? '#d1d5db' : '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '6px',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: submitting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {submitting ? '⏳ Enregistrement...' : '💾 Enregistrer'}
                    </button>
                </form>
            </div>
        </div>
    );
};
```

### 6.5 Sauvegarde dans la Table Templates

Pour enregistrer votre composant dans Grist :

**1. Créer la table Templates (si pas déjà existante):**
```
Colonnes requises:
- template_id (Text)
- template_name (Text)
- component_type (Text)
- component_code (Text)
```

**2. Ajouter un enregistrement:**
```
template_id: "mon_dashboard"
template_name: "📊 Mon Dashboard"
component_type: "functional"
component_code: [coller le code complet du composant]
```

**3. Recharger le widget:**
Le nouveau composant apparaît automatiquement dans la navigation.

---

## 🎯 Patterns et Best Practices {#patterns}

### 7.1 Pattern: Chargement Optimisé avec Promise.all

```javascript
const Component = () => {
    const [data, setData] = useState({});

    useEffect(() => {
        const loadAllData = async () => {
            // ✅ Chargement parallèle (rapide)
            const [clients, ventes, produits] = await Promise.all([
                gristAPI.getData('Clients'),
                gristAPI.getData('Ventes'),
                gristAPI.getData('Produits')
            ]);

            setData({ clients, ventes, produits });
        };

        loadAllData();
    }, []);

    return <div>...</div>;
};
```

### 7.2 Pattern: Debounce pour Recherche

```javascript
const Component = () => {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [allData, setAllData] = useState([]);

    useEffect(() => {
        // Charger toutes les données une fois
        const loadData = async () => {
            const data = await gristAPI.getData('Clients');
            setAllData(data);
            setResults(data);
        };
        loadData();
    }, []);

    useEffect(() => {
        // Debounce la recherche
        const timeoutId = setTimeout(() => {
            if (search === '') {
                setResults(allData);
            } else {
                const filtered = allData.filter(item =>
                    item.name.toLowerCase().includes(search.toLowerCase())
                );
                setResults(filtered);
            }
        }, 300);  // 300ms de délai

        return () => clearTimeout(timeoutId);
    }, [search, allData]);

    return (
        <div>
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
            />
            {results.map(item => (
                <div key={item.id}>{item.name}</div>
            ))}
        </div>
    );
};
```

### 7.3 Pattern: Pagination

```javascript
const Component = () => {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const loadData = async () => {
            const result = await gristAPI.getData('Clients');
            setData(result);
        };
        loadData();
    }, []);

    // Calcul pagination
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = data.slice(startIndex, endIndex);

    return (
        <div>
            {/* Liste paginée */}
            {currentData.map(item => (
                <div key={item.id}>{item.name}</div>
            ))}

            {/* Contrôles pagination */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    ⬅️ Précédent
                </button>

                <span>Page {page} / {totalPages}</span>

                <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                >
                    Suivant ➡️
                </button>
            </div>
        </div>
    );
};
```

### 7.4 Pattern: Modal Réutilisable

```javascript
const Component = () => {
    const [showModal, setShowModal] = useState(false);

    const Modal = ({ isOpen, onClose, title, children }) => {
        if (!isOpen) return null;

        return (
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'white',
                        padding: '30px',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        paddingBottom: '15px',
                        borderBottom: '1px solid #e5e7eb'
                    }}>
                        <h2 style={{ margin: 0 }}>{title}</h2>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                cursor: 'pointer'
                            }}
                        >
                            ×
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        );
    };

    return (
        <div>
            <button onClick={() => setShowModal(true)}>
                Ouvrir Modal
            </button>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Titre du Modal"
            >
                <div>Contenu du modal ici</div>
                <button onClick={() => setShowModal(false)}>
                    Fermer
                </button>
            </Modal>
        </div>
    );
};
```

---

## 🐛 Debugging et Résolution de Problèmes {#debugging}

### 8.1 Activer les Logs de Debug

Le système génère automatiquement des logs détaillés. Ouvrez la console du navigateur (F12) pour les voir :

```
🚀 Initialisation système optimal v3.4
🔍 Données brutes pour Clients: {id: [1,2,3], name: ['Alice','Bob','Charlie']}
🔧 Analyse format Clients: {columns: ['id','name'], isColumnar: true}
✅ Données converties pour Clients: [{id: 1, name: 'Alice'}, ...]
🔄 Chargement composant: dashboard
```

### 8.2 Problèmes Courants et Solutions

**Problème 1: "Component is not defined"**
```javascript
// ❌ Erreur
const MyComponent = () => { ... };

// ✅ Solution
const Component = () => { ... };
```

**Problème 2: "map is not a function"**
```javascript
// ❌ Erreur
data.map(item => ...)  // data n'est pas un array

// ✅ Solution
if (Array.isArray(data)) {
    data.map(item => ...)
}
```

**Problème 3: "useState is not defined"**
```javascript
// ✅ useState est déjà disponible, pas besoin d'import
const Component = () => {
    const [state, setState] = useState(0);  // ✅ Fonctionne
};
```

**Problème 4: Données vides malgré table remplie**
```javascript
// Debug:
const data = await gristAPI.getData('Clients');
console.log('Data received:', data);
console.log('Is array:', Array.isArray(data));
console.log('Length:', data?.length);

// Vérifier que:
// - Table existe dans Grist
// - Nom de table correct (sensible à la casse)
// - Widget a accès "Read table"
```

### 8.3 Checklist de Debug

- [ ] Console ouverte (F12)
- [ ] Logs de chargement visibles
- [ ] Format columnar converti correctement
- [ ] Composant nommé "Component"
- [ ] Hooks React disponibles
- [ ] Table existe dans Grist
- [ ] Nom de table correct
- [ ] Widget a les permissions
- [ ] JSX valide (pas d'erreur Babel)
- [ ] Pas d'import/export ES6

---

## 📝 Conclusion

Ce guide technique exhaustif couvre tous les aspects de la création d'applications avec Grist App Nest :

✅ **Architecture** : Compréhension complète du système
✅ **Données** : Maîtrise du format columnar
✅ **API** : Référence complète de gristAPI
✅ **Rendu** : Fonctionnement React/Babel
✅ **Contraintes** : Toutes les limitations techniques
✅ **Patterns** : Solutions éprouvées et réutilisables
✅ **Debug** : Outils de résolution de problèmes

**🚀 Vous êtes maintenant prêt à créer des applications complètes et fonctionnelles avec Grist App Nest !**
