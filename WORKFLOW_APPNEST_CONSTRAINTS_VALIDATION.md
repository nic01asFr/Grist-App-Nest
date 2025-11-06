# Validation des Contraintes App Nest dans le Workflow

## 🎯 Objectif

Garantir que **100%** du code JSX généré par le workflow respecte les **5 contraintes obligatoires** du système App Nest, sans quoi les composants ne fonctionneront pas.

---

## ⚠️ Les 5 Contraintes Obligatoires

### Contrainte 1: Nom du Composant

**Règle:** Le composant DOIT être nommé exactement `Component` (avec C majuscule).

#### ❌ Code INCORRECT (ne fonctionnera pas)
```javascript
const Dashboard = () => {
  return <div>Hello</div>;
};

const MyComponent = () => {
  return <div>Hello</div>;
};

const ProduitsList = () => {
  return <div>Hello</div>;
};
```

#### ✅ Code CORRECT
```javascript
const Component = () => {
  return <div>Hello</div>;
};
```

**Raison technique:** Le widget `Optimal_solution.html` recherche explicitement la variable `Component` pour l'instancier:
```javascript
// Dans Optimal_solution.html
const Component = eval(Babel.transform(componentCode, {
  presets: ['react']
}).code);

ReactDOM.render(<Component />, container);
```

Si la variable s'appelle `Dashboard`, `ReactDOM.render(<Component />)` échouera avec:
```
Error: Component is not defined
```

---

### Contrainte 2: Pas d'Imports ES6

**Règle:** Aucun `import` ou `require` autorisé. Tout doit être autonome.

#### ❌ Code INCORRECT
```javascript
import React from 'react';
import { useState, useEffect } from 'react';
import Button from './components/Button';
import axios from 'axios';

const Component = () => {
  const [data, setData] = useState([]);
  return <Button>Click</Button>;
};
```

#### ✅ Code CORRECT
```javascript
const Component = () => {
  const [data, setData] = useState([]);

  return (
    <button style={{ padding: '0.5rem 1rem' }}>
      Click
    </button>
  );
};
```

**Raison technique:** Le code est transformé par Babel en standalone, puis exécuté via `eval()`. Il n'y a pas de système de modules disponible. Les hooks React (useState, useEffect, etc.) sont injectés globalement par le widget.

**Hooks disponibles globalement:**
- `useState`
- `useEffect`
- `useCallback`
- `useMemo`
- `useRef`

**API disponible globalement:**
- `gristAPI.getData()`
- `gristAPI.addRecord()`
- `gristAPI.updateRecord()`
- `gristAPI.deleteRecord()`
- `gristAPI.navigate()`

---

### Contrainte 3: Styles Inline Uniquement

**Règle:** Utiliser `style={{...}}` ou définir des objets de style. PAS de `className` avec CSS externe.

#### ❌ Code INCORRECT
```javascript
const Component = () => {
  return (
    <div className="container">
      <button className="btn btn-primary">Click</button>
      <Card className="dashboard-card" />
    </div>
  );
};
```

#### ✅ Code CORRECT (Style inline)
```javascript
const Component = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px' }}>
      <button style={{
        backgroundColor: '#000091',
        color: '#ffffff',
        padding: '0.5rem 1rem',
        border: 'none',
        borderRadius: '0.25rem',
        cursor: 'pointer'
      }}>
        Click
      </button>
    </div>
  );
};
```

#### ✅ Code CORRECT (CSS-in-JS avec objets)
```javascript
const Component = () => {
  const containerStyle = {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const buttonStyle = {
    backgroundColor: '#000091',
    color: '#ffffff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    fontFamily: 'Marianne, sans-serif'
  };

  return (
    <div style={containerStyle}>
      <button style={buttonStyle}>Click</button>
    </div>
  );
};
```

**Raison technique:** Le widget n'inclut pas de fichiers CSS externes. Seuls les styles inline sont interprétés par le navigateur.

**Pour DSFR (Système de Design de l'État):**
Convertir les classes DSFR en styles inline équivalents:

```javascript
// ❌ DSFR avec classes
<button className="fr-btn fr-btn--primary">Valider</button>

// ✅ DSFR en styles inline
<button style={{
  backgroundColor: '#000091',
  color: '#ffffff',
  padding: '0.5rem 1rem',
  fontSize: '1rem',
  fontFamily: 'Marianne, sans-serif',
  fontWeight: 500,
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer'
}}>
  Valider
</button>
```

---

### Contrainte 4: Hooks Autorisés Limités

**Règle:** Uniquement `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`.

#### ❌ Code INCORRECT
```javascript
const Component = () => {
  const theme = useContext(ThemeContext); // ❌ useContext non autorisé
  const [state, dispatch] = useReducer(reducer, initialState); // ❌ useReducer non autorisé
  const deferredValue = useDeferredValue(value); // ❌ useDeferredValue non autorisé

  return <div>{theme.color}</div>;
};
```

#### ✅ Code CORRECT
```javascript
const Component = () => {
  const [data, setData] = useState([]); // ✅ OK
  const [loading, setLoading] = useState(false); // ✅ OK

  const loadData = useCallback(async () => { // ✅ OK
    setLoading(true);
    const result = await gristAPI.getData('Produits');
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => { // ✅ OK
    loadData();
  }, [loadData]);

  const filteredData = useMemo(() => { // ✅ OK
    return data.filter(item => item.actif);
  }, [data]);

  const inputRef = useRef(null); // ✅ OK

  return (
    <div>
      <input ref={inputRef} />
      {loading ? 'Loading...' : filteredData.length}
    </div>
  );
};
```

**Raison technique:** Le widget injecte uniquement ces 5 hooks dans le contexte global. Les autres hooks React ne sont pas disponibles.

---

### Contrainte 5: Validation des Données

**Règle:** Toujours valider avec `Array.isArray()` avant `.map()`, `.filter()`, etc.

#### ❌ Code INCORRECT (risque de crash)
```javascript
const Component = () => {
  const [produits, setProduits] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await gristAPI.getData('Produits');
      setProduits(data); // ⚠️ Et si data n'est pas un array?
    };
    load();
  }, []);

  return (
    <div>
      {produits.map(p => ( // 💥 Crash si produits n'est pas un array
        <div key={p.id}>{p.nom}</div>
      ))}
    </div>
  );
};
```

**Erreur possible:**
```
TypeError: produits.map is not a function
```

#### ✅ Code CORRECT (validation robuste)
```javascript
const Component = () => {
  const [produits, setProduits] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await gristAPI.getData('Produits');

      // ✅ Validation avant setState
      if (Array.isArray(data)) {
        setProduits(data);
      } else {
        console.error('Données invalides:', data);
        setProduits([]);
      }
    };
    load();
  }, []);

  return (
    <div>
      {Array.isArray(produits) && produits.map(p => ( // ✅ Double validation
        <div key={p.id}>{p.nom}</div>
      ))}
    </div>
  );
};
```

**Raison technique:** Grist peut retourner des données dans différents formats selon les erreurs:
- Format columnar natif: `{id: [1,2,3], nom: ['A', 'B', 'C']}`
- Format row-based: `[{id: 1, nom: 'A'}, {id: 2, nom: 'B'}]`
- Erreur: `{error: "Table not found"}`
- Vide: `null` ou `undefined`

Le widget `Optimal_solution.html` convertit normalement columnar → row-based, mais en cas d'erreur réseau ou de configuration, la validation est cruciale.

---

## 🧪 Tests de Validation Automatiques

### Test Suite pour Agent 11 (Syntax Validator)

Agent 11 doit exécuter ces tests sur chaque composant généré:

```javascript
function validateAppNestConstraints(componentCode) {
  const errors = [];
  const warnings = [];

  // TEST 1: Nom du composant
  if (!componentCode.includes('const Component = ')) {
    errors.push({
      constraint: 'component_naming',
      message: 'Le composant DOIT être nommé "Component"',
      severity: 'CRITICAL',
      fix: 'Remplacer "const XYZ = ()" par "const Component = ()"'
    });
  }

  // TEST 2: Pas d'imports
  const importRegex = /import\s+.+\s+from\s+['"]/g;
  const requireRegex = /require\s*\(['"]/g;

  if (importRegex.test(componentCode) || requireRegex.test(componentCode)) {
    errors.push({
      constraint: 'no_imports',
      message: 'Imports ES6 interdits',
      severity: 'CRITICAL',
      fix: 'Supprimer tous les imports. Hooks disponibles globalement.'
    });
  }

  // TEST 3: Styles inline
  const classNameRegex = /className\s*=\s*["'`]/g;

  if (classNameRegex.test(componentCode)) {
    errors.push({
      constraint: 'inline_styles',
      message: 'className interdit, utiliser style={{}}',
      severity: 'CRITICAL',
      fix: 'Convertir toutes les classes en styles inline'
    });
  }

  // TEST 4: Hooks autorisés uniquement
  const forbiddenHooks = [
    'useContext', 'useReducer', 'useImperativeHandle',
    'useLayoutEffect', 'useDebugValue', 'useDeferredValue',
    'useTransition', 'useId', 'useSyncExternalStore'
  ];

  forbiddenHooks.forEach(hook => {
    if (componentCode.includes(hook)) {
      errors.push({
        constraint: 'allowed_hooks',
        message: `Hook ${hook} non autorisé`,
        severity: 'CRITICAL',
        fix: `Utiliser uniquement: useState, useEffect, useCallback, useMemo, useRef`
      });
    }
  });

  // TEST 5: Validation Array.isArray
  const hasGetData = componentCode.includes('gristAPI.getData');
  const hasArrayValidation = componentCode.includes('Array.isArray');

  if (hasGetData && !hasArrayValidation) {
    warnings.push({
      constraint: 'array_validation',
      message: 'Recommandé: valider avec Array.isArray() avant .map()',
      severity: 'WARNING',
      fix: 'Ajouter: if (Array.isArray(data)) { ... }'
    });
  }

  // TEST 6: Babel peut transformer le JSX
  let babelTransformOk = false;
  try {
    Babel.transform(componentCode, { presets: ['react'] });
    babelTransformOk = true;
  } catch (e) {
    errors.push({
      constraint: 'jsx_syntax',
      message: 'Erreur de syntaxe JSX',
      severity: 'CRITICAL',
      fix: `Erreur Babel: ${e.message}`
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    babel_transform_ok: babelTransformOk
  };
}
```

**Output JSON de Agent 11:**
```json
{
  "validation_results": [
    {
      "component_id": "dashboard",
      "valid": true,
      "errors": [],
      "warnings": [],
      "babel_transform_ok": true,
      "constraints_checklist": {
        "component_naming": "✅ OK",
        "no_imports": "✅ OK",
        "inline_styles": "✅ OK",
        "allowed_hooks": "✅ OK (useState, useEffect)",
        "array_validation": "⚠️ WARNING (recommandé)"
      }
    },
    {
      "component_id": "produits",
      "valid": false,
      "errors": [
        {
          "constraint": "component_naming",
          "message": "Le composant DOIT être nommé 'Component'",
          "severity": "CRITICAL",
          "fix": "Remplacer 'const ProduitsList = ()' par 'const Component = ()'"
        }
      ],
      "warnings": [],
      "babel_transform_ok": true,
      "constraints_checklist": {
        "component_naming": "❌ FAIL",
        "no_imports": "✅ OK",
        "inline_styles": "✅ OK",
        "allowed_hooks": "✅ OK",
        "array_validation": "✅ OK"
      }
    }
  ],
  "overall_status": "INVALID",
  "invalid_components": ["produits"],
  "action_required": "Revenir à Agent 10 pour corriger 'produits'"
}
```

---

## 🔧 Prompt Optimisé pour Agent 10 (Code Generator)

### Prompt Système

```markdown
Tu es Agent 10: Code Generator pour App Nest.

Ta mission: générer du code JSX React respectant STRICTEMENT les 5 contraintes App Nest.

## CONTRAINTES OBLIGATOIRES (CRITIQUE - NON NÉGOCIABLE)

### 1. NOM DU COMPOSANT
✅ CORRECT:
const Component = () => {
  return <div>Hello</div>;
};

❌ INCORRECT (ne fonctionnera pas):
const Dashboard = () => { ... }
const MyComponent = () => { ... }

### 2. PAS D'IMPORTS
✅ CORRECT:
const Component = () => {
  const [data, setData] = useState([]);
  useEffect(() => { ... }, []);
  return <div>{data.length}</div>;
};

❌ INCORRECT:
import React from 'react';
import { useState } from 'react';
const Component = () => { ... }

Hooks disponibles GLOBALEMENT: useState, useEffect, useCallback, useMemo, useRef

### 3. STYLES INLINE UNIQUEMENT
✅ CORRECT:
<button style={{
  backgroundColor: '#000091',
  color: '#fff',
  padding: '0.5rem 1rem'
}}>
  Click
</button>

❌ INCORRECT:
<button className="btn btn-primary">Click</button>

### 4. HOOKS AUTORISÉS
✅ AUTORISÉS: useState, useEffect, useCallback, useMemo, useRef
❌ INTERDITS: useContext, useReducer, useLayoutEffect, etc.

### 5. VALIDATION DES DONNÉES
✅ CORRECT:
const data = await gristAPI.getData('Table');
if (Array.isArray(data)) {
  setItems(data);
} else {
  console.error('Données invalides');
  setItems([]);
}

❌ INCORRECT:
const data = await gristAPI.getData('Table');
setItems(data); // ⚠️ Et si data n'est pas un array?

## API gristAPI DISPONIBLE

```javascript
// Récupérer données (retourne Array d'objets)
const produits = await gristAPI.getData('Produits');
// → [{id: 1, nom: 'A'}, {id: 2, nom: 'B'}]

// Créer record
const newId = await gristAPI.addRecord('Produits', {
  nom: 'Nouveau produit',
  prix: 10.50
});

// Mettre à jour record
await gristAPI.updateRecord('Produits', 123, {
  prix: 12.00
});

// Supprimer record
await gristAPI.deleteRecord('Produits', 123);

// Naviguer vers autre composant
gristAPI.navigate('dashboard');
```

## DSFR (Design Système État Français)

Convertir classes DSFR en styles inline:

```javascript
// ❌ Classes DSFR (interdit)
<button className="fr-btn fr-btn--primary">Valider</button>

// ✅ Styles DSFR inline
<button style={{
  backgroundColor: '#000091',
  color: '#ffffff',
  padding: '0.5rem 1rem',
  fontSize: '1rem',
  fontFamily: 'Marianne, sans-serif',
  fontWeight: 500,
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer'
}}>
  Valider
</button>
```

**Palette DSFR:**
- Bleu France: #000091
- Rouge Marianne: #c9191e
- Gris: #666666
- Police: Marianne, sans-serif

## FORMAT OUTPUT

```json
{
  "components": [
    {
      "component_id": "dashboard",
      "template_name": "Tableau de bord",
      "component_type": "functional",
      "component_code": "const Component = () => { ... };"
    }
  ],
  "constraints_respected": [
    "✅ Component nommé Component",
    "✅ Pas d'imports",
    "✅ Styles inline",
    "✅ Hooks autorisés uniquement",
    "✅ Validation Array.isArray()"
  ]
}
```

## INPUT

Tu vas recevoir la liste des composants à générer avec leurs spécifications:

{{json.validated_components}}

Génère le code JSX pour chaque composant en respectant SCRUPULEUSEMENT les 5 contraintes.
```

---

### Prompt Utilisateur (Dynamique)

```json
{
  "validated_components": [
    {
      "component_id": "dashboard",
      "template_name": "Tableau de bord",
      "pattern": "dashboard",
      "data_sources": ["Produits", "Commandes"],
      "dsfr_components": ["DsfrCard", "DsfrGrid"],
      "features": ["metrics", "quick_actions"]
    },
    {
      "component_id": "produits",
      "template_name": "Gestion Produits",
      "pattern": "crud_list",
      "data_source": "Produits",
      "dsfr_components": ["DsfrTable", "DsfrInput", "DsfrButton"],
      "features": ["search", "filter", "add", "edit", "delete"]
    }
  ],
  "grist_schema": {
    "tables": [
      {
        "table_name": "Produits",
        "columns": [
          {"col_id": "reference", "type": "Text"},
          {"col_id": "designation", "type": "Text"},
          {"col_id": "prix_unitaire", "type": "Numeric"},
          {"col_id": "stock_actuel", "type": "Int"}
        ]
      },
      {
        "table_name": "Commandes",
        "columns": [
          {"col_id": "numero", "type": "Text"},
          {"col_id": "date", "type": "Date"},
          {"col_id": "statut", "type": "Choice", "choices": ["brouillon", "validee", "livree"]},
          {"col_id": "montant_total", "type": "Numeric"}
        ]
      }
    ]
  }
}
```

---

## 🎯 Checklist de Validation (Agent 11)

Agent 11 doit vérifier chaque composant avec cette checklist:

```json
{
  "component_id": "dashboard",
  "validation_checklist": {
    "1_component_naming": {
      "test": "Code contient 'const Component = ()'",
      "regex": "const\\s+Component\\s*=\\s*\\(",
      "status": "✅ PASS",
      "critical": true
    },
    "2_no_imports": {
      "test": "Aucun import ou require détecté",
      "regex": "(import\\s+.+\\s+from|require\\s*\\()",
      "status": "✅ PASS",
      "critical": true
    },
    "3_inline_styles": {
      "test": "Aucun className détecté",
      "regex": "className\\s*=",
      "status": "✅ PASS",
      "critical": true
    },
    "4_allowed_hooks": {
      "test": "Uniquement hooks autorisés",
      "forbidden": ["useContext", "useReducer", "useLayoutEffect"],
      "status": "✅ PASS",
      "critical": true
    },
    "5_array_validation": {
      "test": "Array.isArray() présent si gristAPI.getData() utilisé",
      "status": "⚠️ WARNING",
      "critical": false
    },
    "6_babel_transform": {
      "test": "Babel peut transformer le JSX",
      "status": "✅ PASS",
      "critical": true
    }
  },
  "overall_status": "VALID",
  "critical_errors": 0,
  "warnings": 1,
  "ready_for_optimization": true
}
```

**Si critical_errors > 0:** Retourner à Agent 10 avec les erreurs détaillées.

---

## 🔄 Workflow de Correction

Si Agent 11 détecte des erreurs:

```
Agent 11 (Validation FAIL)
    ↓
Edit Fields (Extraire erreurs)
    ↓
Decision Node
    ├─ retry_count < 3 → Retour Agent 10 avec corrections
    └─ retry_count >= 3 → Alerte humain
```

**Message de retour à Agent 10:**
```json
{
  "action": "CORRECTION_REQUIRED",
  "component_id": "produits",
  "errors": [
    {
      "constraint": "component_naming",
      "current": "const ProduitsList = ()",
      "expected": "const Component = ()",
      "fix": "Renommer ProduitsList en Component"
    }
  ],
  "original_code": "const ProduitsList = () => { ... }",
  "retry_count": 1
}
```

**Prompt de correction pour Agent 10:**
```
CORRECTION NÉCESSAIRE

Composant: produits
Erreur détectée par validation:

❌ Contrainte violée: component_naming
❌ Code actuel: const ProduitsList = ()
✅ Code attendu: const Component = ()

Voici le code à corriger:
```javascript
const ProduitsList = () => {
  // ... code existant
};
```

Génère le code corrigé en respectant STRICTEMENT la contrainte:
Le composant DOIT être nommé "Component", pas "ProduitsList".

Tentative: 1/3
```

---

## 📊 Métriques de Qualité

Agent 11 doit reporter ces métriques:

```json
{
  "quality_metrics": {
    "total_components": 5,
    "valid_components": 4,
    "invalid_components": 1,
    "success_rate": "80%",
    "constraints_compliance": {
      "component_naming": "100%",
      "no_imports": "100%",
      "inline_styles": "80%",
      "allowed_hooks": "100%",
      "array_validation": "60%"
    },
    "corrections_needed": 1,
    "retry_count": 1
  }
}
```

**Seuil de qualité:** Success rate >= 95% pour passer à Agent 12.

---

## 🚨 Erreurs Fréquentes et Solutions

### Erreur 1: Composant mal nommé

**Symptôme:**
```
Error: Component is not defined
```

**Cause:** Code généré:
```javascript
const Dashboard = () => { ... }
```

**Solution:** Correction automatique par regex:
```javascript
code = code.replace(/const\s+\w+\s*=\s*\(/g, 'const Component = (');
```

---

### Erreur 2: Imports détectés

**Symptôme:**
```
Error: Cannot use import statement outside a module
```

**Cause:** Code généré:
```javascript
import { useState } from 'react';
const Component = () => { ... }
```

**Solution:** Suppression automatique des imports:
```javascript
code = code.replace(/import\s+.+\s+from\s+['"]. +['"];?\n?/g, '');
code = code.replace(/const\s+\{.+\}\s*=\s*require\(.+\);?\n?/g, '');
```

---

### Erreur 3: className utilisé

**Symptôme:** Styles non appliqués

**Cause:** Code généré:
```javascript
<button className="btn-primary">Click</button>
```

**Solution:** Alerte critique, retour à Agent 10 (conversion manuelle nécessaire):
```
❌ ERREUR CRITIQUE: className détecté
⚠️ Conversion automatique impossible (nécessite mapping DSFR → inline)
→ Retour à Agent 10 pour régénération
```

---

### Erreur 4: Hook non autorisé

**Symptôme:**
```
Error: useContext is not defined
```

**Cause:** Code généré:
```javascript
const theme = useContext(ThemeContext);
```

**Solution:** Alerte critique, retour à Agent 10:
```
❌ ERREUR CRITIQUE: Hook useContext non autorisé
✅ Hooks autorisés: useState, useEffect, useCallback, useMemo, useRef
→ Refactoriser pour utiliser useState au lieu de useContext
```

---

### Erreur 5: Pas de validation Array

**Symptôme:**
```
TypeError: data.map is not a function
```

**Cause:** Code généré:
```javascript
const data = await gristAPI.getData('Produits');
setProduits(data);
return <div>{produits.map(...)}</div>;
```

**Solution:** Warning (non bloquant) + ajout recommandé:
```javascript
const data = await gristAPI.getData('Produits');
if (Array.isArray(data)) {
  setProduits(data);
} else {
  console.error('Données invalides');
  setProduits([]);
}
```

---

## 🎓 Conclusion

Pour garantir que le workflow génère du code App Nest fonctionnel:

### Actions OBLIGATOIRES 🔴

1. **Enrichir le prompt Agent 10** avec exemples ✅/❌ de chaque contrainte
2. **Implémenter validation stricte dans Agent 11** avec la fonction `validateAppNestConstraints()`
3. **Ajouter workflow de correction** avec retry (max 3 tentatives)
4. **Bloquer la progression** si contraintes critiques violées

### Métriques de Succès

- ✅ **100%** des composants nommés `Component`
- ✅ **0** imports détectés
- ✅ **0** className détectés
- ✅ **0** hooks interdits utilisés
- ✅ **>80%** validation Array.isArray() (recommandé)
- ✅ **100%** transformation Babel réussie

### Tests de Non-Régression

Créer une suite de tests avec des composants d'exemple:
- ✅ Dashboard basique (3 metrics cards)
- ✅ CRUD complet (list + form + search)
- ✅ Workflow avec états (brouillon → validé → livré)
- ✅ Formulaire complexe (validation + relations)
- ✅ Reporting avec graphiques

Chaque composant doit passer les 6 tests de validation avant déploiement.

---

**Document créé le:** 2025-01-06
**Révision:** 1.0
**Auteur:** Claude Code Analysis
