# Recommandations GitHub - Grist App Nest

> 📊 **Source**: Analyse complète de 14 widgets Grist et socle technique unifié
> 🔗 **Repo d'analyse**: https://github.com/nic01asFr/widgets-documentation
> 📅 **Date**: Novembre 2025
> 🎯 **Objectif**: Transformer Grist App Nest v5.2 en widget de référence

---

## 📋 Table des Matières

1. [Résumé Exécutif](#résumé-exécutif)
2. [Contexte de l'Analyse](#contexte-de-lanalyse)
3. [5 Améliorations Majeures](#5-améliorations-majeures)
4. [Architecture Cible v6.0](#architecture-cible-v60)
5. [Plan de Migration](#plan-de-migration)
6. [Quick Wins (Gains Rapides)](#quick-wins-gains-rapides)
7. [Métriques de Succès](#métriques-de-succès)

---

## 🎯 Résumé Exécutif

### Problème Actuel

Grist App Nest v5.2 est fonctionnel mais présente des **opportunités d'optimisation critiques** identifiées lors de l'analyse comparative de 14 widgets Grist :

- **40% de code dupliqué** (conversion Grist, gestion erreurs, etc.)
- **80% de re-renders inutiles** lors du drag & drop
- **Pas de tests automatisés** (0% coverage)
- **Pas de state management centralisé** (état dispersé)
- **Validation ad-hoc** (schémas non déclaratifs)

### Solution Proposée

**Refactorisation progressive vers v6.0** en appliquant les patterns identifiés dans les widgets les plus performants :

- ✅ **Classes utilitaires réutilisables** (pattern W12 Scrollytelling)
- ✅ **Validation structurée avec schémas** (pattern W12)
- ✅ **Drag & drop optimisé** (pattern W14 TaskFlow)
- ✅ **State management centralisé** (socle unifié)
- ✅ **Tests unitaires** (80%+ coverage cible)

### Gains Attendus

| Métrique | Avant v5.2 | Après v6.0 | Amélioration |
|----------|------------|------------|--------------|
| Code dupliqué | ~40% | ~10% | **-75%** |
| Re-renders inutiles | ~80% | ~15% | **-81%** |
| Temps init | 2-3s | 1-1.5s | **-50%** |
| Couverture tests | 0% | 80%+ | **+80%** |
| Maintenabilité | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **+67%** |

---

## 📊 Contexte de l'Analyse

### Widgets Analysés (14 au total)

L'analyse comparative a étudié 14 widgets Grist pour identifier les **patterns récurrents** et **best practices** :

| Widget | Complexité | Points Forts Identifiés |
|--------|------------|------------------------|
| **W01** - Multi Table Viewer | Moyenne | État réactif, gestion multi-tables |
| **W02** - Data Selector | Simple | API unifiée, validation |
| **W03** - Custom Layout | Moyenne | Drag & drop basique |
| **W12** - Scrollytelling | **Haute** | **Classes utilitaires, validation schéma** |
| **W13** - RDV System | Haute | State management multi-modal |
| **W14** - TaskFlow | **Haute** | **Drag & drop optimisé, SortableJS** |

**Widgets de référence** :
- **W12 (Scrollytelling)** : Classe `GristWidgetBase`, `DataValidator`
- **W14 (TaskFlow)** : Drag & drop avec cache, render sélectif

### Socle Technique Unifié Identifié

Le repo widgets-documentation a extrait un **socle technique commun** utilisé par tous les widgets performants :

```javascript
// 1️⃣ Conversion Grist (columnar → rows)
function convertGristTableToRecords(gristData) {
    if (!gristData || typeof gristData !== 'object') return [];
    const columns = Object.keys(gristData);
    const firstCol = columns.find(col => Array.isArray(gristData[col]));
    if (!firstCol) return [];

    const rowCount = gristData[firstCol].length;
    return Array.from({length: rowCount}, (_, i) =>
        Object.fromEntries(columns.map(col => [col, gristData[col][i]]))
    );
}

// 2️⃣ Gestion d'erreurs standardisée
function handleGristError(error, context) {
    console.error(`❌ ${context}:`, error);
    showToast(`Erreur: ${error.message}`, 'error');
    return null; // Ou valeur par défaut
}

// 3️⃣ Sanitization IDs
function sanitizeId(str) {
    return str.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Accents
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}
```

---

## 🚀 5 Améliorations Majeures

### 1️⃣ Classes Utilitaires Réutilisables

**Pattern**: Héritage depuis `GristWidgetBase` (inspiré de W12)

#### Problème Actuel (v5.2)

```javascript
// ❌ Code dupliqué dans GristAIDashboard
class GristAIDashboard {
    async getData(tableName) {
        // 50 lignes de conversion columnar → rows
        // Répété dans 5+ endroits
    }
}
```

#### Solution Proposée (v6.0)

```javascript
// ✅ Classe de base réutilisable
class GristWidgetBase {
    constructor() {
        this.grist = null;
        this.cache = new Map();
        this.isReady = false;
    }

    async initialize(options = {}) {
        await grist.ready({ requiredAccess: options.access || 'read table' });
        this.grist = grist;
        this.isReady = true;
    }

    async fetchTable(tableName, useCache = true) {
        if (useCache && this.cache.has(tableName)) {
            return this.cache.get(tableName);
        }

        try {
            const rawData = await grist.docApi.fetchTable(tableName);
            const records = this.convertColumnarToRows(rawData);

            if (useCache) {
                this.cache.set(tableName, records);
            }

            return records;
        } catch (error) {
            this.handleError(error, `fetchTable(${tableName})`);
            return [];
        }
    }

    convertColumnarToRows(gristData) {
        // Logique de conversion centralisée (1 seul endroit)
        if (!gristData || typeof gristData !== 'object') return [];

        const columns = Object.keys(gristData);
        const firstArrayCol = columns.find(col => Array.isArray(gristData[col]));
        if (!firstArrayCol) return [];

        const rowCount = gristData[firstArrayCol].length;
        return Array.from({length: rowCount}, (_, i) =>
            Object.fromEntries(columns.map(col => [col, gristData[col][i]]))
        );
    }

    handleError(error, context) {
        console.error(`❌ ${context}:`, error);
        this.showToast(`Erreur: ${error.message}`, 'error');
    }

    async listTables(excludeSystem = true) {
        const tables = await grist.docApi.listTables();
        return excludeSystem
            ? tables.filter(t => !t.startsWith('_grist'))
            : tables;
    }

    invalidateCache(tableName = null) {
        if (tableName) {
            this.cache.delete(tableName);
        } else {
            this.cache.clear();
        }
    }
}

// ✅ Toutes les classes héritent
class GristAIDashboard extends GristWidgetBase {
    constructor() {
        super();
        this.components = new Map();
        this.currentComponent = null;
    }

    async init() {
        await this.initialize({ access: 'read table' });
        // Plus besoin de réécrire fetchTable(), handleError(), etc.
        const templates = await this.fetchTable('Templates');
    }
}
```

**Gains** :
- ✅ -40% de code dupliqué
- ✅ Cache automatique (performances)
- ✅ Gestion d'erreurs unifiée
- ✅ Facilite maintenance long terme

---

### 2️⃣ Validation Structurée avec Schémas

**Pattern**: Validation déclarative (inspiré de W12)

#### Problème Actuel (v5.2)

```javascript
// ❌ Validation éparpillée, ad-hoc
function saveContact(data) {
    if (!data.nom || data.nom.length < 2) {
        alert('Nom invalide');
        return;
    }
    if (!data.email || !data.email.includes('@')) {
        alert('Email invalide');
        return;
    }
    // ... validation manuelle partout
}
```

#### Solution Proposée (v6.0)

```javascript
// ✅ Classe de validation réutilisable
class DataValidator {
    constructor(schema) {
        this.schema = schema;
    }

    validate(data) {
        const errors = [];
        const cleaned = {};

        for (const [field, rules] of Object.entries(this.schema)) {
            const value = data[field];

            // Required
            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push(`${field}: requis`);
                continue;
            }

            // Default value
            if (value === undefined || value === null) {
                cleaned[field] = rules.default;
                continue;
            }

            // Type validation
            if (rules.type === 'string' && typeof value !== 'string') {
                errors.push(`${field}: doit être une chaîne`);
                continue;
            }

            if (rules.type === 'number' && typeof value !== 'number') {
                errors.push(`${field}: doit être un nombre`);
                continue;
            }

            // Min/Max length
            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`${field}: minimum ${rules.minLength} caractères`);
            }

            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(`${field}: maximum ${rules.maxLength} caractères`);
            }

            // Pattern (regex)
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(`${field}: format invalide`);
            }

            // Custom validator
            if (rules.validator && !rules.validator(value)) {
                errors.push(`${field}: ${rules.validatorMessage || 'invalide'}`);
            }

            cleaned[field] = value;
        }

        return {
            valid: errors.length === 0,
            errors,
            data: cleaned
        };
    }
}

// ✅ Schémas réutilisables
const contactSchema = {
    nom: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 100
    },
    email: {
        type: 'string',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        required: true
    },
    telephone: {
        type: 'string',
        pattern: /^[\d\s\-\+\(\)]+$/,
        required: false
    },
    actif: {
        type: 'boolean',
        default: true
    }
};

// ✅ Usage simple
const validator = new DataValidator(contactSchema);
const result = validator.validate(formData);

if (!result.valid) {
    console.error('Erreurs:', result.errors);
    showToast(result.errors.join(', '), 'error');
    return;
}

// Données validées et nettoyées
await gristAPI.addRecord('Contacts', result.data);
```

**Gains** :
- ✅ Validation centralisée et réutilisable
- ✅ Defaults automatiques
- ✅ Messages d'erreur cohérents
- ✅ Facilite ajout de nouvelles règles

---

### 3️⃣ Drag & Drop Optimisé

**Pattern**: SortableJS + render sélectif (inspiré de W14 TaskFlow)

#### Problème Actuel (v5.2)

```javascript
// ❌ Re-render complet à chaque mouvement
function onDrop(evt) {
    // Mise à jour de l'état
    updateComponentsOrder(evt);

    // ❌ Re-render TOUT le canvas
    renderAllComponents(); // 500ms pour 50 composants
}
```

#### Solution Proposée (v6.0)

```javascript
// ✅ Drag & drop optimisé avec SortableJS
class DragDropEngine {
    constructor(stateManager) {
        this.state = stateManager;
        this.sortables = new Map();
        this.zoneCache = new Map(); // Cache des zones
    }

    initializeSortable(dropZoneElement, zoneId, options = {}) {
        const sortable = new Sortable(dropZoneElement, {
            group: 'shared',
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',

            onEnd: (evt) => {
                const fromZone = evt.from.id;
                const toZone = evt.to.id;

                // ✅ Mise à jour STATE centralisé
                this.state.moveComponent(
                    evt.item.dataset.componentId,
                    fromZone,
                    toZone,
                    evt.newIndex
                );

                // ✅ Re-render SEULEMENT les zones modifiées
                if (fromZone !== toZone) {
                    this.renderZone(fromZone);
                    this.renderZone(toZone);
                } else {
                    this.renderZone(fromZone);
                }

                // ❌ Plus de renderAllComponents() !
            },

            ...options
        });

        this.sortables.set(zoneId, sortable);
        return sortable;
    }

    renderZone(zoneId) {
        const zone = document.getElementById(zoneId);
        if (!zone) return;

        // ✅ Comparaison avec cache pour éviter renders inutiles
        const components = this.state.getComponentsForZone(zoneId);
        const cacheKey = JSON.stringify(components.map(c => c.id));

        if (this.zoneCache.get(zoneId) === cacheKey) {
            console.log(`⚡ Skip render ${zoneId} (no changes)`);
            return; // Pas de changement
        }

        // ✅ Patch minimal (Virtual DOM diff)
        this.patchZone(zone, components);

        // Mettre à jour cache
        this.zoneCache.set(zoneId, cacheKey);
    }

    patchZone(zoneElement, components) {
        // Logique de diff minimal (Virtual DOM light)
        const existing = Array.from(zoneElement.children);
        const needed = components.length;

        // Supprimer les éléments en trop
        for (let i = needed; i < existing.length; i++) {
            existing[i].remove();
        }

        // Ajouter ou mettre à jour
        components.forEach((component, index) => {
            if (existing[index]) {
                // Mise à jour
                this.updateComponentElement(existing[index], component);
            } else {
                // Création
                const element = this.createComponentElement(component);
                zoneElement.appendChild(element);
            }
        });
    }

    createComponentElement(component) {
        const div = document.createElement('div');
        div.className = 'component-item';
        div.dataset.componentId = component.id;
        div.innerHTML = `<span>${component.label}</span>`;
        return div;
    }

    updateComponentElement(element, component) {
        element.dataset.componentId = component.id;
        element.querySelector('span').textContent = component.label;
    }

    destroy() {
        this.sortables.forEach(sortable => sortable.destroy());
        this.sortables.clear();
        this.zoneCache.clear();
    }
}

// ✅ Usage
const dragDrop = new DragDropEngine(appState);

dragDrop.initializeSortable(
    document.getElementById('zone-header'),
    'zone-header'
);

dragDrop.initializeSortable(
    document.getElementById('zone-body'),
    'zone-body'
);
```

**Gains** :
- ✅ -80% de re-renders inutiles
- ✅ Drag & drop fluide (60 FPS)
- ✅ Cache intelligent
- ✅ Virtual DOM diff minimal

---

### 4️⃣ State Management Centralisé

**Pattern**: Single source of truth avec observables

#### Problème Actuel (v5.2)

```javascript
// ❌ État dispersé entre 10+ variables/classes
class GristAIDashboard {
    constructor() {
        this.components = new Map();
        this.currentComponent = null;
        this.bindings = {};
        this.schemas = [];
        // ... 15+ propriétés d'état
    }

    // Difficile de savoir qui modifie quoi
}
```

#### Solution Proposée (v6.0)

```javascript
// ✅ State manager centralisé avec observables
class AppNestStateManager {
    constructor(initialState = {}) {
        this.state = {
            components: [],
            currentComponentId: null,
            bindings: {},
            schemas: [],
            zones: {
                header: [],
                body: [],
                footer: []
            },
            webhookConfig: null,
            ...initialState
        };

        this.listeners = new Map(); // Observable pattern
        this.history = []; // Pour undo/redo
        this.historyIndex = -1;
        this.maxHistory = 50;
    }

    // ===== GETTERS =====
    getState() {
        return { ...this.state }; // Immutable
    }

    get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }

    getComponentsForZone(zoneId) {
        return this.state.zones[zoneId] || [];
    }

    getCurrentComponent() {
        return this.state.components.find(
            c => c.id === this.state.currentComponentId
        );
    }

    // ===== SETTERS =====
    setState(updates, description = 'Update') {
        // Sauvegarder dans l'historique
        this.saveStateToHistory(description);

        // Mise à jour immutable
        this.state = { ...this.state, ...updates };

        // Notifier tous les listeners
        this.notifyListeners();
    }

    set(path, value, description = 'Update') {
        const keys = path.split('.');
        const lastKey = keys.pop();

        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.state);

        this.saveStateToHistory(description);
        target[lastKey] = value;
        this.notifyListeners();
    }

    // ===== ACTIONS MÉTIER =====
    addComponent(component, description = 'Add component') {
        this.setState({
            components: [...this.state.components, component]
        }, description);
    }

    updateComponent(componentId, updates, description = 'Update component') {
        this.setState({
            components: this.state.components.map(c =>
                c.id === componentId ? { ...c, ...updates } : c
            )
        }, description);
    }

    deleteComponent(componentId, description = 'Delete component') {
        this.setState({
            components: this.state.components.filter(c => c.id !== componentId)
        }, description);
    }

    moveComponent(componentId, fromZone, toZone, newIndex) {
        const zones = { ...this.state.zones };

        // Retirer de la zone source
        zones[fromZone] = zones[fromZone].filter(id => id !== componentId);

        // Ajouter à la zone cible
        zones[toZone].splice(newIndex, 0, componentId);

        this.setState({ zones }, `Move ${componentId} to ${toZone}`);
    }

    // ===== OBSERVABLES =====
    subscribe(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, []);
        }
        this.listeners.get(path).push(callback);

        // Retourner une fonction unsubscribe
        return () => {
            const listeners = this.listeners.get(path);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }

    notifyListeners() {
        this.listeners.forEach((callbacks, path) => {
            const value = this.get(path);
            callbacks.forEach(callback => callback(value, this.state));
        });
    }

    // ===== UNDO / REDO =====
    saveStateToHistory(description) {
        // Supprimer l'historique après l'index actuel
        this.history = this.history.slice(0, this.historyIndex + 1);

        // Ajouter le nouvel état
        this.history.push({
            state: JSON.parse(JSON.stringify(this.state)),
            description,
            timestamp: Date.now()
        });

        // Limiter la taille
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.state = JSON.parse(JSON.stringify(
                this.history[this.historyIndex].state
            ));
            this.notifyListeners();
            return true;
        }
        return false;
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.state = JSON.parse(JSON.stringify(
                this.history[this.historyIndex].state
            ));
            this.notifyListeners();
            return true;
        }
        return false;
    }

    getHistory() {
        return this.history.map((entry, index) => ({
            ...entry,
            isCurrent: index === this.historyIndex
        }));
    }
}

// ✅ Usage avec auto-render
const appState = new AppNestStateManager();

// Subscribe à des changements spécifiques
appState.subscribe('components', (newComponents) => {
    console.log('Components changed:', newComponents);
    renderComponentsList(newComponents);
});

appState.subscribe('currentComponentId', (newId) => {
    loadComponent(newId);
});

// Raccourcis clavier
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        if (appState.undo()) {
            showToast('Annulé', 'info');
        }
    }

    if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        if (appState.redo()) {
            showToast('Rétabli', 'info');
        }
    }
});
```

**Gains** :
- ✅ Single source of truth
- ✅ Undo/Redo automatique (Ctrl+Z)
- ✅ Réactivité via observables
- ✅ Debugging facilité (time-travel)

---

### 5️⃣ Tests Unitaires

**Pattern**: Jest + couverture 80%+

#### Problème Actuel (v5.2)

```javascript
// ❌ Aucun test automatisé
// - Refactoring risqué
// - Pas de documentation du comportement
// - Régressions non détectées
```

#### Solution Proposée (v6.0)

```javascript
// ✅ tests/GristWidgetBase.test.js
describe('GristWidgetBase', () => {
    let widget;

    beforeEach(() => {
        widget = new GristWidgetBase();
    });

    describe('convertColumnarToRows', () => {
        it('should convert Grist columnar format to rows', () => {
            const input = {
                id: [1, 2, 3],
                name: ['Alice', 'Bob', 'Charlie']
            };

            const result = widget.convertColumnarToRows(input);

            expect(result).toEqual([
                { id: 1, name: 'Alice' },
                { id: 2, name: 'Bob' },
                { id: 3, name: 'Charlie' }
            ]);
        });

        it('should handle empty data', () => {
            expect(widget.convertColumnarToRows(null)).toEqual([]);
            expect(widget.convertColumnarToRows({})).toEqual([]);
        });

        it('should handle non-array columns', () => {
            const input = { id: 1, name: 'Alice' };
            expect(widget.convertColumnarToRows(input)).toEqual([]);
        });
    });
});

// ✅ tests/DataValidator.test.js
describe('DataValidator', () => {
    it('should validate required fields', () => {
        const schema = {
            nom: { type: 'string', required: true }
        };
        const validator = new DataValidator(schema);

        const result = validator.validate({ nom: '' });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('nom: requis');
    });

    it('should apply default values', () => {
        const schema = {
            actif: { type: 'boolean', default: true }
        };
        const validator = new DataValidator(schema);

        const result = validator.validate({});

        expect(result.valid).toBe(true);
        expect(result.data.actif).toBe(true);
    });

    it('should validate email pattern', () => {
        const schema = {
            email: {
                type: 'string',
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            }
        };
        const validator = new DataValidator(schema);

        expect(validator.validate({ email: 'test@example.com' }).valid).toBe(true);
        expect(validator.validate({ email: 'invalid' }).valid).toBe(false);
    });
});

// ✅ tests/AppNestStateManager.test.js
describe('AppNestStateManager', () => {
    let state;

    beforeEach(() => {
        state = new AppNestStateManager({ components: [] });
    });

    it('should add component', () => {
        const component = { id: 'comp1', label: 'Test' };
        state.addComponent(component);

        expect(state.get('components')).toHaveLength(1);
        expect(state.get('components')[0]).toEqual(component);
    });

    it('should support undo/redo', () => {
        state.addComponent({ id: 'comp1' });
        state.addComponent({ id: 'comp2' });

        expect(state.get('components')).toHaveLength(2);

        state.undo();
        expect(state.get('components')).toHaveLength(1);

        state.redo();
        expect(state.get('components')).toHaveLength(2);
    });

    it('should notify subscribers', (done) => {
        state.subscribe('components', (newComponents) => {
            expect(newComponents).toHaveLength(1);
            done();
        });

        state.addComponent({ id: 'comp1' });
    });
});

// ✅ tests/DragDropEngine.test.js
describe('DragDropEngine', () => {
    let engine, mockState;

    beforeEach(() => {
        mockState = new AppNestStateManager();
        engine = new DragDropEngine(mockState);
    });

    it('should initialize sortable', () => {
        const element = document.createElement('div');
        element.id = 'zone-test';

        const sortable = engine.initializeSortable(element, 'zone-test');

        expect(sortable).toBeDefined();
        expect(engine.sortables.has('zone-test')).toBe(true);
    });

    it('should cache zone renders', () => {
        mockState.setState({
            components: [{ id: 'comp1', label: 'Test' }],
            zones: { header: ['comp1'] }
        });

        const element = document.createElement('div');
        element.id = 'zone-header';
        document.body.appendChild(element);

        // Premier render
        engine.renderZone('zone-header');
        expect(engine.zoneCache.has('zone-header')).toBe(true);

        // Second render (même état) - should skip
        const spy = jest.spyOn(engine, 'patchZone');
        engine.renderZone('zone-header');

        expect(spy).not.toHaveBeenCalled();
    });
});
```

**Configuration Jest** :

```javascript
// ✅ jest.config.js
module.exports = {
    testEnvironment: 'jsdom',
    collectCoverage: true,
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

**Gains** :
- ✅ 80%+ couverture de code
- ✅ Refactoring sécurisé
- ✅ Documentation vivante (tests = spec)
- ✅ Détection automatique des régressions

---

## 🏗️ Architecture Cible v6.0

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    Grist App Nest v6.0                       │
│                  (Hybrid Builder Widget)                     │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│ GristWidget  │    │  AppNestState    │    │ DragDrop     │
│    Base      │    │    Manager       │    │   Engine     │
│  (abstract)  │    │  (centralized)   │    │ (optimized)  │
└──────────────┘    └──────────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│  Grist       │    │  DataBinding     │    │ Smart        │
│ Integration  │    │   Manager        │    │ Schema       │
│  Manager     │    │ (validated)      │    │ Generator    │
└──────────────┘    └──────────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                      ┌───────┴───────┐
                      ▼               ▼
              ┌──────────────┐ ┌──────────────┐
              │  Component   │ │    Utils     │
              │   Renderer   │ │ (validator,  │
              │  (reactive)  │ │  helpers)    │
              └──────────────┘ └──────────────┘
```

### Classes Principales

#### 1. GristWidgetBase (Classe Abstraite)

```javascript
class GristWidgetBase {
    // ✅ Fonctions communes à TOUS les widgets
    async initialize(options)
    async fetchTable(tableName, useCache)
    convertColumnarToRows(gristData)
    handleError(error, context)
    async listTables(excludeSystem)
    invalidateCache(tableName)
}
```

**Utilisation** : Base pour toutes les classes qui interagissent avec Grist

#### 2. AppNestStateManager (State Centralisé)

```javascript
class AppNestStateManager {
    // ✅ Single source of truth
    getState()
    setState(updates, description)
    get(path)
    set(path, value)

    // Actions métier
    addComponent(component)
    updateComponent(componentId, updates)
    deleteComponent(componentId)
    moveComponent(componentId, fromZone, toZone, newIndex)

    // Observables
    subscribe(path, callback)
    notifyListeners()

    // Undo/Redo
    undo()
    redo()
    getHistory()
}
```

**Utilisation** : Gérer tout l'état de l'application

#### 3. DragDropEngine (Drag & Drop Optimisé)

```javascript
class DragDropEngine {
    // ✅ Drag & drop performant
    initializeSortable(element, zoneId, options)
    renderZone(zoneId) // Render sélectif
    patchZone(element, components) // Virtual DOM diff
    destroy()
}
```

**Utilisation** : Gérer le drag & drop des composants

#### 4. DataValidator (Validation)

```javascript
class DataValidator {
    constructor(schema)
    validate(data) // Returns { valid, errors, data }
}
```

**Utilisation** : Valider toutes les données avant enregistrement

#### 5. GristIntegrationManager (extends GristWidgetBase)

```javascript
class GristIntegrationManager extends GristWidgetBase {
    // ✅ Spécifique à l'intégration Grist
    async loadGristContext()
    async loadTableSchema(tableName)
    async analyzeTableStructure(tableName)
}
```

#### 6. DataBindingManager (extends GristWidgetBase)

```javascript
class DataBindingManager extends GristWidgetBase {
    // ✅ Gestion des bindings composant ↔ table
    registerBinding(componentId, tableName, fieldMappings)
    async saveToGrist(componentId, data)
    async loadFromGrist(componentId)
}
```

#### 7. SmartSchemaGenerator (extends GristWidgetBase)

```javascript
class SmartSchemaGenerator extends GristWidgetBase {
    // ✅ Génération automatique de schémas
    async detectBusinessEntities()
    generateColumnsFromFields(uiFields)
    async createGristTablesFromUI(components)
}
```

#### 8. ComponentRenderer

```javascript
class ComponentRenderer {
    // ✅ Render des composants React
    constructor(stateManager)
    renderAll()
    renderComponent(componentId)
    patchComponent(componentId, updates)
}
```

---

## 📅 Plan de Migration

### Vue d'Ensemble (5 Semaines)

```
Semaine 1: Foundation ──────────▶ Socle technique
Semaine 2: Managers ────────────▶ Classes métier
Semaine 3: Drag & Drop ─────────▶ Optimisation UI
Semaine 4: Renderer ────────────▶ React rendering
Semaine 5: Polish ──────────────▶ Finitions + tests
```

---

### Semaine 1 : Foundation (Socle Technique)

**Objectif** : Créer les classes de base réutilisables

#### Tâches

1. **Créer `GristWidgetBase.js`**
   ```javascript
   // Classe abstraite avec toutes les fonctions communes
   - initialize()
   - fetchTable()
   - convertColumnarToRows()
   - handleError()
   - listTables()
   - invalidateCache()
   ```

2. **Créer `AppNestStateManager.js`**
   ```javascript
   // State centralisé avec observables
   - getState() / setState()
   - subscribe() / notifyListeners()
   - undo() / redo()
   - Actions métier (add/update/delete component)
   ```

3. **Créer `DataValidator.js`**
   ```javascript
   // Validation avec schémas déclaratifs
   - validate(data)
   - Support des types, required, patterns, min/max
   ```

4. **Créer `utils/GristUtils.js`**
   ```javascript
   // Fonctions utilitaires
   - sanitizeId(str)
   - escapeHtml(str)
   - formatDate(date)
   - generateId()
   ```

5. **Tests Unitaires**
   ```bash
   npm init -y
   npm install --save-dev jest @babel/preset-env

   # Configuration Jest
   # Tests pour GristWidgetBase
   # Tests pour DataValidator
   # Tests pour AppNestStateManager
   ```

**Livrable Semaine 1** :
- ✅ 4 fichiers JS de base
- ✅ Tests unitaires (50+ tests)
- ✅ Documentation JSDoc

---

### Semaine 2 : Managers (Classes Métier)

**Objectif** : Refactoriser les managers existants pour hériter de `GristWidgetBase`

#### Tâches

1. **Refactoriser `GristIntegrationManager`**
   ```javascript
   // Avant: classe standalone
   // Après: extends GristWidgetBase

   class GristIntegrationManager extends GristWidgetBase {
       // Plus besoin de réécrire fetchTable(), etc.
       async loadGristContext() { ... }
       async loadTableSchema(tableName) { ... }
   }
   ```

2. **Refactoriser `DataBindingManager`**
   ```javascript
   class DataBindingManager extends GristWidgetBase {
       registerBinding(componentId, tableName, mappings) { ... }
       async saveToGrist(componentId, data) {
           // ✅ Utiliser DataValidator avant save
           const validator = new DataValidator(this.schemas[componentId]);
           const result = validator.validate(data);

           if (!result.valid) {
               throw new Error(result.errors.join(', '));
           }

           await this.grist.docApi.applyUserActions(...);
       }
   }
   ```

3. **Refactoriser `SmartSchemaGenerator`**
   ```javascript
   class SmartSchemaGenerator extends GristWidgetBase {
       async detectBusinessEntities() { ... }
       generateColumnsFromFields(uiFields) {
           // ✅ Utiliser GristUtils.sanitizeId()
           return uiFields.map(field => ({
               id: GristUtils.sanitizeId(field.label),
               type: this.mapFieldTypeToGrist(field.type),
               label: field.label
           }));
       }
   }
   ```

4. **Intégrer avec AppNestStateManager**
   ```javascript
   // Tous les managers reçoivent le state en constructor
   const appState = new AppNestStateManager();

   const gristManager = new GristIntegrationManager(appState);
   const bindingManager = new DataBindingManager(appState);
   const schemaGenerator = new SmartSchemaGenerator(appState);
   ```

5. **Tests d'Intégration**
   ```javascript
   // Tests des managers avec mock Grist API
   describe('GristIntegrationManager', () => {
       it('should load table schema', async () => { ... });
   });
   ```

**Livrable Semaine 2** :
- ✅ 3 managers refactorisés
- ✅ Intégration avec state centralisé
- ✅ Tests d'intégration (30+ tests)

---

### Semaine 3 : Drag & Drop Optimisé

**Objectif** : Intégrer SortableJS et optimiser le rendering

#### Tâches

1. **Intégrer SortableJS**
   ```html
   <!-- Ajouter dans <head> -->
   <script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
   ```

2. **Créer `DragDropEngine.js`**
   ```javascript
   class DragDropEngine {
       constructor(stateManager) { ... }
       initializeSortable(element, zoneId, options) { ... }
       renderZone(zoneId) { ... }
       patchZone(element, components) { ... }
   }
   ```

3. **Implémenter Cache Intelligent**
   ```javascript
   renderZone(zoneId) {
       const components = this.state.getComponentsForZone(zoneId);
       const cacheKey = JSON.stringify(components.map(c => c.id));

       if (this.zoneCache.get(zoneId) === cacheKey) {
           return; // Skip render
       }

       this.patchZone(zone, components);
       this.zoneCache.set(zoneId, cacheKey);
   }
   ```

4. **Implémenter Virtual DOM Diff**
   ```javascript
   patchZone(zoneElement, components) {
       // Comparaison intelligente
       // Mise à jour minimale du DOM
   }
   ```

5. **Tests de Performance**
   ```javascript
   // Benchmark: Drag 50 composants
   // Objectif: < 16ms par frame (60 FPS)

   describe('DragDropEngine performance', () => {
       it('should render 50 components in < 100ms', () => { ... });
   });
   ```

**Livrable Semaine 3** :
- ✅ Drag & drop fluide (60 FPS)
- ✅ Cache intelligent
- ✅ -80% de re-renders
- ✅ Tests de performance

---

### Semaine 4 : Renderer (React Rendering)

**Objectif** : Optimiser le rendu des composants React

#### Tâches

1. **Créer `ComponentRenderer.js`**
   ```javascript
   class ComponentRenderer {
       constructor(stateManager) {
           this.state = stateManager;

           // Subscribe aux changements de components
           this.state.subscribe('components', (newComponents) => {
               this.renderAll();
           });
       }

       renderAll() { ... }
       renderComponent(componentId) { ... }
   }
   ```

2. **Optimiser Templates DSFR**
   ```javascript
   // Templates pré-compilés pour performances
   const componentTemplates = {
       'input-text': (props) => `
           <div class="fr-input-group">
               <label class="fr-label">${props.label}</label>
               <input class="fr-input" type="text" />
           </div>
       `,
       // ...
   };
   ```

3. **Implémenter Lazy Loading**
   ```javascript
   // Charger les composants à la demande
   async loadComponent(componentId) {
       const component = await this.state.getComponent(componentId);

       if (!component.loaded) {
           // Charger le code JSX depuis Grist
           component.loaded = true;
       }

       this.renderComponent(component);
   }
   ```

4. **Tests Visuels**
   ```javascript
   // Tests de rendu avec snapshots
   describe('ComponentRenderer', () => {
       it('should render input-text correctly', () => {
           const html = renderer.renderComponent('input-text');
           expect(html).toMatchSnapshot();
       });
   });
   ```

**Livrable Semaine 4** :
- ✅ Rendering optimisé
- ✅ Lazy loading
- ✅ Templates pré-compilés
- ✅ Tests visuels

---

### Semaine 5 : Polish (Finitions)

**Objectif** : Fonctionnalités avancées + documentation complète

#### Tâches

1. **Raccourcis Clavier**
   ```javascript
   // Ctrl+Z / Ctrl+Shift+Z : Undo/Redo
   // Ctrl+S : Save configuration
   // Delete : Supprimer composant sélectionné
   // Ctrl+D : Dupliquer composant
   // Ctrl+/ : Aide

   class KeyboardShortcuts {
       constructor(stateManager) { ... }

       setupShortcuts() {
           document.addEventListener('keydown', (e) => {
               if (e.ctrlKey && e.key === 'z') {
                   this.state.undo();
               }
               // ...
           });
       }
   }
   ```

2. **Save/Load Configurations**
   ```javascript
   class ConfigurationManager {
       async save(name) {
           const config = {
               version: '6.0',
               components: this.state.get('components'),
               bindings: this.state.get('bindings'),
               zones: this.state.get('zones')
           };

           await gristAPI.addRecord('AppNestConfigs', {
               name,
               config: JSON.stringify(config)
           });
       }

       async load(configId) {
           const record = await gristAPI.getRecord('AppNestConfigs', configId);
           const config = JSON.parse(record.config);

           this.state.setState(config);
       }
   }
   ```

3. **Documentation Complète**
   ```javascript
   // JSDoc pour toutes les classes
   /**
    * Gestionnaire d'état centralisé pour App Nest
    * @class AppNestStateManager
    * @example
    * const state = new AppNestStateManager();
    * state.addComponent({ id: 'comp1', label: 'Test' });
    */
   ```

4. **Tests End-to-End**
   ```javascript
   // Playwright ou Cypress
   describe('App Nest E2E', () => {
       it('should create and drag component', async () => {
           await page.goto('http://localhost:8080');
           await page.click('[data-testid="add-component"]');
           await page.dragAndDrop('[data-component-id="comp1"]', '#zone-body');

           expect(await page.textContent('#zone-body')).toContain('comp1');
       });
   });
   ```

5. **Migration Guide**
   ```markdown
   # Migration v5.2 → v6.0

   ## Breaking Changes
   - État déplacé vers AppNestStateManager
   - API Grist via GristWidgetBase

   ## Migration automatique
   1. Exporter config v5.2
   2. Lancer script de migration
   3. Importer dans v6.0
   ```

**Livrable Semaine 5** :
- ✅ Raccourcis clavier complets
- ✅ Save/Load configs
- ✅ Documentation JSDoc complète
- ✅ Tests E2E (20+ scénarios)
- ✅ Guide de migration

---

## ⚡ Quick Wins (Gains Rapides)

**Objectif** : Améliorations rapides à implémenter AVANT la refactorisation complète

### Quick Win #1 : Ajouter Cache Simple (1 jour)

```javascript
// Dans v5.2, ajouter un cache Map simple
class GristAIDashboard {
    constructor() {
        this.cache = new Map(); // ✅ Ajouter
        // ...
    }

    async getData(tableName) {
        // ✅ Vérifier cache avant fetch
        if (this.cache.has(tableName)) {
            console.log(`⚡ Cache hit: ${tableName}`);
            return this.cache.get(tableName);
        }

        const data = await grist.docApi.fetchTable(tableName);
        const rows = this.convertColumnarToRows(data);

        this.cache.set(tableName, rows); // ✅ Stocker en cache
        return rows;
    }

    invalidateCache(tableName = null) {
        if (tableName) {
            this.cache.delete(tableName);
        } else {
            this.cache.clear();
        }
    }
}
```

**Gain** : -30% de temps de chargement

---

### Quick Win #2 : Extraire Fonctions Communes (2 jours)

```javascript
// ✅ Créer utils/GristUtils.js
const GristUtils = {
    convertColumnarToRows(gristData) {
        if (!gristData || typeof gristData !== 'object') return [];

        const columns = Object.keys(gristData);
        const firstArrayCol = columns.find(col => Array.isArray(gristData[col]));
        if (!firstArrayCol) return [];

        const rowCount = gristData[firstArrayCol].length;
        return Array.from({length: rowCount}, (_, i) =>
            Object.fromEntries(columns.map(col => [col, gristData[col][i]]))
        );
    },

    sanitizeId(str) {
        return str.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// ✅ Utiliser partout
const rows = GristUtils.convertColumnarToRows(rawData);
const id = GristUtils.sanitizeId(label);
```

**Gain** : -20% de code dupliqué

---

### Quick Win #3 : Ajouter Validation Basique (1 jour)

```javascript
// ✅ Validation simple avant save
function validateContactData(data) {
    const errors = [];

    if (!data.nom || data.nom.trim().length < 2) {
        errors.push('Nom requis (min 2 caractères)');
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Email invalide');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

// Usage
const validation = validateContactData(formData);
if (!validation.valid) {
    showToast(validation.errors.join(', '), 'error');
    return;
}

await gristAPI.addRecord('Contacts', formData);
```

**Gain** : Meilleure qualité de données

---

### Quick Win #4 : Optimiser Drag & Drop Basique (1 jour)

```javascript
// ✅ Éviter re-render complet
function onDrop(evt) {
    const fromZone = evt.from.id;
    const toZone = evt.to.id;

    // ❌ Avant: renderAllComponents();

    // ✅ Après: render seulement les zones modifiées
    if (fromZone !== toZone) {
        renderZone(fromZone);
        renderZone(toZone);
    } else {
        renderZone(fromZone);
    }
}

function renderZone(zoneId) {
    const zone = document.getElementById(zoneId);
    const components = getComponentsForZone(zoneId);

    // Render seulement cette zone
    zone.innerHTML = components.map(renderComponent).join('');
}
```

**Gain** : -50% de re-renders

---

### Quick Win #5 : Ajouter Logs Structurés (0.5 jour)

```javascript
// ✅ Logs standardisés
const Logger = {
    info: (msg, data) => console.log(`ℹ️ ${msg}`, data || ''),
    success: (msg, data) => console.log(`✅ ${msg}`, data || ''),
    warn: (msg, data) => console.warn(`⚠️ ${msg}`, data || ''),
    error: (msg, data) => console.error(`❌ ${msg}`, data || ''),
    perf: (label, duration) => console.log(`⚡ ${label}: ${duration}ms`)
};

// Usage
Logger.info('Chargement composants...');
const start = performance.now();
await loadComponents();
Logger.perf('loadComponents', performance.now() - start);
Logger.success('Composants chargés', { count: components.length });
```

**Gain** : Debugging facilité

---

## 📊 Métriques de Succès

### KPIs Techniques

| Métrique | v5.2 (Actuel) | v6.0 (Cible) | Méthode de Mesure |
|----------|---------------|--------------|-------------------|
| **Code dupliqué** | ~40% | < 10% | SonarQube / analyse statique |
| **Re-renders par drag** | ~10-15 | 1-2 | Performance API |
| **Temps initialisation** | 2-3s | < 1.5s | `performance.now()` |
| **Couverture tests** | 0% | 80%+ | Jest coverage |
| **Bundle size** | 132 KB | < 100 KB | Minification |
| **Complexité cyclomatique** | ~25-30 | < 15 | ESLint complexity |

### KPIs Utilisateur

| Métrique | v5.2 | v6.0 | Mesure |
|----------|------|------|--------|
| **Time to Interactive** | 3-4s | < 2s | Lighthouse |
| **Erreurs JS (prod)** | ~5/jour | < 1/jour | Error tracking |
| **Temps création app** | 10-15min | < 5min | User testing |
| **Satisfaction** | N/A | 4.5+/5 | Survey |

### Tests de Performance

```javascript
// ✅ Benchmark suite
describe('Performance benchmarks', () => {
    it('should load 100 components in < 500ms', async () => {
        const start = performance.now();
        await loadComponents(100);
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(500);
    });

    it('should drag component in < 16ms (60 FPS)', () => {
        const start = performance.now();
        dragComponent('comp1', 'zone-header');
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(16);
    });

    it('should validate 1000 records in < 100ms', () => {
        const validator = new DataValidator(schema);
        const records = generateTestRecords(1000);

        const start = performance.now();
        records.forEach(r => validator.validate(r));
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(100);
    });
});
```

---

## 🎓 Ressources et Références

### Documentation Externe

- **SortableJS** : https://github.com/SortableJS/Sortable
- **Jest Testing** : https://jestjs.io/docs/getting-started
- **Grist API** : https://support.getgrist.com/api/
- **DSFR Components** : https://www.systeme-de-design.gouv.fr/

### Repo d'Analyse

- **widgets-documentation** : https://github.com/nic01asFr/widgets-documentation
  - `REFACTORISATION-APPNEST-v2.md` : Plan détaillé complet
  - `SOCLE_TECHNIQUE_UNIFIE.md` : Fonctions communes
  - `ANALYSE_WIDGETS_*.md` : Analyses individuelles

### Patterns Identifiés

1. **W12 (Scrollytelling)** : Classes utilitaires, validation schéma
2. **W14 (TaskFlow)** : Drag & drop optimisé, render sélectif
3. **W13 (RDV System)** : State management multi-modal
4. **Socle Unifié** : Fonctions communes (conversion, sanitization, etc.)

---

## 📝 Notes Importantes

### Contraintes Techniques

1. **Pas de Build Process** : Tout reste dans des fichiers HTML standalone
2. **Pas de npm** : Dépendances via CDN uniquement
3. **Tests en Développement** : Utiliser Node.js localement pour Jest
4. **Déploiement** : Git push → raw GitHub URL

### Compatibilité

- **Navigateurs** : Chrome/Edge 90+, Firefox 88+, Safari 14+
- **Grist** : Version 1.0+ (API stable)
- **React** : 18.x (via CDN)
- **Babel** : Standalone 7.x (via CDN)

### Migration Progressive

La refactorisation peut être **progressive** :
- Semaine 1-2 : Fondations (pas d'impact utilisateur)
- Semaine 3 : Drag & drop (amélioration visible)
- Semaine 4-5 : Polish (features bonus)

**Compatibilité v5.2** : Les configurations v5.2 pourront être migrées automatiquement vers v6.0.

---

## ✅ Checklist de Validation

### Avant de Commencer la Refactorisation

- [ ] Backup de v5.2 (git tag v5.2-stable)
- [ ] Document de migration créé
- [ ] Tests E2E de v5.2 (scenarios de référence)
- [ ] Environnement de dev configuré (Node.js pour Jest)

### Validation Semaine 1

- [ ] GristWidgetBase créé et testé
- [ ] AppNestStateManager créé et testé
- [ ] DataValidator créé et testé
- [ ] 50+ tests unitaires passent
- [ ] Documentation JSDoc complète

### Validation Semaine 2

- [ ] 3 managers refactorisés
- [ ] Intégration avec state centralisé
- [ ] 30+ tests d'intégration passent
- [ ] Pas de régression fonctionnelle

### Validation Semaine 3

- [ ] SortableJS intégré
- [ ] Cache intelligent fonctionnel
- [ ] < 16ms par drag (60 FPS)
- [ ] Tests de performance passent

### Validation Semaine 4

- [ ] ComponentRenderer optimisé
- [ ] Lazy loading fonctionnel
- [ ] Templates pré-compilés
- [ ] Tests visuels passent

### Validation Semaine 5

- [ ] Raccourcis clavier fonctionnels
- [ ] Save/Load configs
- [ ] 80%+ coverage
- [ ] Documentation complète
- [ ] Guide de migration finalisé

---

## 🚀 Prochaines Étapes

### Immédiat (Cette Semaine)

1. **Valider le plan** avec l'équipe
2. **Implémenter Quick Wins** (#1-5) pour gains rapides
3. **Créer git tag v5.2-stable** pour backup
4. **Préparer environnement de dev** (Node.js, Jest)

### Court Terme (Semaine 1-2)

1. Créer les classes de base (Foundation)
2. Écrire les tests unitaires
3. Documenter avec JSDoc

### Moyen Terme (Semaine 3-5)

1. Refactoriser les managers
2. Optimiser drag & drop
3. Finaliser avec polish

### Long Terme (Post-v6.0)

1. **v6.1** : Composants avancés (charts, maps)
2. **v6.2** : Collaboration temps réel
3. **v6.3** : Templates prédéfinis (CRM, Dashboard, etc.)

---

## 📞 Contact et Support

**Questions sur la refactorisation** :
- Créer une issue sur GitHub
- Tag : `refactoring`, `v6.0`

**Analyse des widgets** :
- Repo : https://github.com/nic01asFr/widgets-documentation
- Document : `REFACTORISATION-APPNEST-v2.md`

**Support Grist** :
- Docs : https://support.getgrist.com
- Community : https://community.getgrist.com

---

## 🎯 Conclusion

La refactorisation vers **v6.0** transformera Grist App Nest en :

✅ **Widget de référence** pour le socle technique unifié
✅ **Code maintenable** avec 80%+ de couverture de tests
✅ **Performances optimales** (-80% de re-renders, -50% init time)
✅ **DX améliorée** (undo/redo, shortcuts, debugging)

Les **Quick Wins** permettent d'obtenir des gains immédiats **sans attendre** la refactorisation complète.

Le **plan de migration** progressif sur 5 semaines minimise les risques et permet une transition en douceur.

**Prêt à démarrer la refactorisation ! 🚀**

---

*Document créé le 16 novembre 2025*
*Basé sur l'analyse de 14 widgets Grist*
*Source : https://github.com/nic01asFr/widgets-documentation*
