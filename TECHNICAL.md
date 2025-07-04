# 🔧 Guide Technique Détaillé

## 🏗️ **Architecture Système v3.3**

### **Vue d'Ensemble**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Grist Tables  │    │  Widget HTML    │    │  React Runtime  │
│   (columnar)    │───▶│  (v3.3)         │───▶│  (components)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
   ┌────▼────┐             ┌────▼────┐             ┌────▼────┐
   │Templates│             │Processor│             │ Render  │
   │Components│             │ Babel   │             │ Browser │
   └─────────┘             └─────────┘             └─────────┘
```

### **Flux de Données**
1. **Grist Storage** : Composants JSX stockés dans tables
2. **Data Fetching** : API récupère format columnar
3. **Conversion** : Transformation columnar → array d'objets
4. **JSX Processing** : Babel transforme JSX → JavaScript
5. **React Rendering** : Rendu dans iframe sécurisée

---

## 📊 **Format Columnar - Deep Dive**

### **Format Grist Natif**
```javascript
// Ce que Grist retourne
{
  id: [1, 2, 3, 4],
  name: ['Alice', 'Bob', 'Charlie', 'David'],
  email: ['alice@test.com', 'bob@test.com', 'charlie@test.com', 'david@test.com'],
  status: ['active', 'prospect', 'active', 'inactive']
}
```

### **Conversion Algorithme**
```javascript
function convertColumnarToRows(columnarData) {
  const columns = Object.keys(columnarData);
  const isColumnar = columns.some(col => Array.isArray(columnarData[col]));
  
  if (!isColumnar) return [];
  
  const firstArrayCol = columns.find(col => Array.isArray(columnarData[col]));
  const rowCount = columnarData[firstArrayCol]?.length || 0;
  const rows = [];
  
  for (let i = 0; i < rowCount; i++) {
    const row = {};
    columns.forEach(col => {
      row[col] = Array.isArray(columnarData[col]) 
        ? columnarData[col][i] 
        : columnarData[col]; // Valeur scalaire
    });
    rows.push(row);
  }
  
  return rows;
}
```

### **Performance Optimisations**
- **Lazy Evaluation** : Conversion seulement si nécessaire
- **Memoization** : Cache des conversions fréquentes
- **Batch Processing** : Traitement par chunks pour gros volumes
- **Memory Management** : Libération automatique des références

---

## ⚛️ **React Integration - Deep Dive**

### **Babel Configuration**
```javascript
const transformedCode = Babel.transform(jsxCode, {
  presets: ['react'],
  plugins: [
    'proposal-class-properties',
    'transform-arrow-functions',
    'transform-destructuring'
  ]
}).code;
```

### **Component Execution Context**
```javascript
const componentFunction = new Function(
  'React',           // React 18 library
  'ReactDOM',        // ReactDOM for rendering
  'gristAPI',        // Unified Grist API
  'container',       // DOM container
  `
    // Available hooks
    const { useState, useEffect, useCallback, useMemo, useRef } = React;
    const { render, createPortal } = ReactDOM;
    
    // User component code (transformed)
    ${transformedCode}
    
    // Render with error boundaries
    try {
      if (typeof Component !== 'undefined') {
        render(React.createElement(Component), container);
      } else {
        throw new Error('Component variable not defined');
      }
    } catch (error) {
      render(
        React.createElement('div', {
          style: { color: 'red', padding: '20px' }
        }, 'Error: ' + error.message),
        container
      );
    }
  `
);
```

### **State Management**
```javascript
// Component-level state (recommended)
const [localState, setLocalState] = useState(initialValue);

// Global state sharing between components
window.sharedState = window.sharedState || {};

// Event emitter for component communication
window.eventBus = {
  emit: (event, data) => window.dispatchEvent(new CustomEvent(event, { detail: data })),
  on: (event, callback) => window.addEventListener(event, callback),
  off: (event, callback) => window.removeEventListener(event, callback)
};
```

---

## 🔌 **API Grist Unifiée**

### **Interface Complète**
```javascript
const gristAPI = {
  // === DATA OPERATIONS ===
  
  // Get data with automatic columnar conversion
  getData: async (tableName, options = {}) => {
    const { sort, limit, filter } = options;
    const rawData = await grist.docApi.fetchTable(tableName);
    const convertedData = convertColumnarToRows(rawData);
    
    // Apply options
    let result = convertedData;
    if (filter) result = result.filter(filter);
    if (sort) result = result.sort(sort);
    if (limit) result = result.slice(0, limit);
    
    return result;
  },
  
  // Add record with validation
  addRecord: async (tableName, record) => {
    const validation = await validateRecord(tableName, record);
    if (!validation.valid) throw new Error(validation.error);
    
    return await grist.docApi.applyUserActions([
      ['AddRecord', tableName, null, record]
    ]);
  },
  
  // Update record with optimistic updates
  updateRecord: async (tableName, recordId, updates) => {
    // Optimistic update
    updateLocalCache(tableName, recordId, updates);
    
    try {
      return await grist.docApi.applyUserActions([
        ['UpdateRecord', tableName, recordId, updates]
      ]);
    } catch (error) {
      // Rollback on error
      rollbackLocalCache(tableName, recordId);
      throw error;
    }
  },
  
  // Delete with confirmation
  deleteRecord: async (tableName, recordId, confirm = true) => {
    if (confirm && !window.confirm('Supprimer cet enregistrement ?')) {
      return false;
    }
    
    return await grist.docApi.applyUserActions([
      ['RemoveRecord', tableName, recordId]
    ]);
  },
  
  // === NAVIGATION ===
  
  // Navigate between components
  navigate: (componentId, params = {}) => {
    window.dashboard.loadComponent(componentId, params);
    
    // Update URL hash for deep linking
    window.location.hash = componentId;
    
    // Store navigation history
    window.navigationHistory = window.navigationHistory || [];
    window.navigationHistory.push({ componentId, params, timestamp: Date.now() });
  },
  
  // Navigation history
  back: () => {
    const history = window.navigationHistory || [];
    if (history.length > 1) {
      history.pop(); // Remove current
      const previous = history[history.length - 1];
      gristAPI.navigate(previous.componentId, previous.params);
    }
  },
  
  // === UTILITY FUNCTIONS ===
  
  // Get table schema
  getSchema: async (tableName) => {
    const columns = await grist.docApi.getTable(tableName);
    return columns.map(col => ({
      id: col.id,
      label: col.label,
      type: col.type,
      formula: col.formula || null
    }));
  },
  
  // Bulk operations
  bulkAdd: async (tableName, records) => {
    const actions = records.map(record => ['AddRecord', tableName, null, record]);
    return await grist.docApi.applyUserActions(actions);
  },
  
  bulkUpdate: async (tableName, updates) => {
    const actions = updates.map(({ id, data }) => ['UpdateRecord', tableName, id, data]);
    return await grist.docApi.applyUserActions(actions);
  },
  
  // Search across tables
  search: async (query, tables = []) => {
    const results = {};
    for (const table of tables) {
      const data = await gristAPI.getData(table);
      results[table] = data.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(query.toLowerCase())
        )
      );
    }
    return results;
  }
};
```

### **Error Handling Avancée**
```javascript
// Global error handler
window.gristErrorHandler = (error, context) => {
  console.error(`Grist API Error [${context}]:`, error);
  
  // User-friendly messages
  const userMessage = {
    'Permission denied': 'Accès insuffisant à cette table',
    'Table not found': 'Table introuvable',
    'Network error': 'Problème de connexion'
  }[error.type] || 'Erreur inattendue';
  
  // Show toast notification
  showToast(userMessage, 'error');
  
  // Send to monitoring
  if (window.errorTracking) {
    window.errorTracking.capture(error, { context, userAgent: navigator.userAgent });
  }
};
```

---

## 🎨 **Component Patterns**

### **Pattern 1 : Dashboard avec Métriques**
```javascript
const Component = () => {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [clients, ventes, projets] = await Promise.all([
        gristAPI.getData('Clients'),
        gristAPI.getData('Ventes'),
        gristAPI.getData('Projets')
      ]);
      
      setMetrics({
        clients: clients.length,
        ventes: ventes.length,
        ca: ventes.reduce((sum, v) => sum + (v.montant || 0), 0),
        projetsActifs: projets.filter(p => p.status === 'actif').length
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => { loadMetrics(); }, [loadMetrics]);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={loadMetrics} />;
  
  return (
    <div className="dashboard">
      <MetricCard title="Clients" value={metrics.clients} icon="👥" />
      <MetricCard title="Ventes" value={metrics.ventes} icon="💰" />
      <MetricCard title="CA" value={`${metrics.ca}€`} icon="📈" />
      <MetricCard title="Projets Actifs" value={metrics.projetsActifs} icon="🚀" />
    </div>
  );
};
```

### **Pattern 2 : CRUD avec Formulaire**
```javascript
const Component = () => {
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  
  const loadItems = useCallback(async () => {
    const data = await gristAPI.getData('Items');
    setItems(data);
  }, []);
  
  const saveItem = async () => {
    try {
      if (editingItem) {
        await gristAPI.updateRecord('Items', editingItem.id, formData);
      } else {
        await gristAPI.addRecord('Items', formData);
      }
      await loadItems();
      setEditingItem(null);
      setFormData({});
    } catch (error) {
      alert('Erreur sauvegarde: ' + error.message);
    }
  };
  
  const deleteItem = async (item) => {
    if (await gristAPI.deleteRecord('Items', item.id)) {
      await loadItems();
    }
  };
  
  useEffect(() => { loadItems(); }, [loadItems]);
  
  return (
    <div className="crud-component">
      <ItemForm 
        data={formData}
        onChange={setFormData}
        onSave={saveItem}
        editing={!!editingItem}
      />
      <ItemList 
        items={items}
        onEdit={setEditingItem}
        onDelete={deleteItem}
      />
    </div>
  );
};
```

### **Pattern 3 : Graphiques Dynamiques**
```javascript
const Component = () => {
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState('bar');
  
  useEffect(() => {
    const loadChartData = async () => {
      const ventes = await gristAPI.getData('Ventes');
      
      // Aggregate by month
      const monthlyData = ventes.reduce((acc, vente) => {
        const month = new Date(vente.date).toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'short' 
        });
        acc[month] = (acc[month] || 0) + vente.montant;
        return acc;
      }, {});
      
      setChartData(Object.entries(monthlyData).map(([month, total]) => ({
        month,
        total
      })));
    };
    
    loadChartData();
  }, []);
  
  return (
    <div className="chart-component">
      <div className="chart-controls">
        <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
          <option value="bar">Barres</option>
          <option value="line">Ligne</option>
          <option value="pie">Camembert</option>
        </select>
      </div>
      <SimpleChart data={chartData} type={chartType} />
    </div>
  );
};
```

---

## 🛡️ **Sécurité et Validation**

### **Validation des Données**
```javascript
const validators = {
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  required: (value) => value != null && value !== '',
  number: (value) => !isNaN(parseFloat(value)),
  date: (value) => !isNaN(Date.parse(value))
};

const validateRecord = (tableName, record) => {
  const rules = getValidationRules(tableName);
  const errors = [];
  
  for (const [field, value] of Object.entries(record)) {
    const fieldRules = rules[field] || [];
    for (const rule of fieldRules) {
      if (!validators[rule](value)) {
        errors.push(`${field}: validation ${rule} failed`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
```

### **Sanitization**
```javascript
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
  return input;
};
```

---

## 📊 **Performance Monitoring**

### **Métriques Collectées**
```javascript
const performanceMonitor = {
  componentLoadTime: new Map(),
  dataFetchTime: new Map(),
  renderTime: new Map(),
  
  startTimer: (operation, id) => {
    const key = `${operation}_${id}`;
    performanceMonitor[operation].set(key, performance.now());
  },
  
  endTimer: (operation, id) => {
    const key = `${operation}_${id}`;
    const startTime = performanceMonitor[operation].get(key);
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`${operation} ${id}: ${duration.toFixed(2)}ms`);
      
      // Send to analytics
      if (window.analytics) {
        window.analytics.track('performance', {
          operation,
          id,
          duration
        });
      }
    }
  }
};
```

### **Memory Management**
```javascript
const memoryManager = {
  componentCache: new WeakMap(),
  
  cleanup: () => {
    // Clear unused component references
    document.querySelectorAll('.component-container').forEach(container => {
      if (!container.isConnected) {
        memoryManager.componentCache.delete(container);
      }
    });
    
    // Force garbage collection in development
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }
  }
};

// Auto cleanup every 5 minutes
setInterval(memoryManager.cleanup, 5 * 60 * 1000);
```

---

## 🧪 **Testing et Debugging**

### **Test Utilities**
```javascript
const testUtils = {
  // Mock Grist API for testing
  mockGristAPI: (mockData) => {
    window.gristAPI = {
      getData: async (table) => mockData[table] || [],
      addRecord: async (table, record) => ({ id: Date.now(), ...record }),
      updateRecord: async () => true,
      deleteRecord: async () => true,
      navigate: (id) => console.log('Navigate to:', id)
    };
  },
  
  // Component testing helpers
  renderComponent: (componentCode, mockData = {}) => {
    testUtils.mockGristAPI(mockData);
    
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    // Render component
    const transformedCode = Babel.transform(componentCode, {
      presets: ['react']
    }).code;
    
    const componentFunction = new Function(
      'React', 'ReactDOM', 'gristAPI', 'container',
      transformedCode
    );
    
    componentFunction(React, ReactDOM, window.gristAPI, container);
    
    return container;
  },
  
  // Performance testing
  measurePerformance: (fn, iterations = 100) => {
    const times = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      times.push(performance.now() - start);
    }
    
    return {
      average: times.reduce((a, b) => a + b) / times.length,
      min: Math.min(...times),
      max: Math.max(...times)
    };
  }
};
```

### **Debug Console**
```javascript
// Available in browser console
window.debugGrist = {
  // Inspect current state
  getState: () => ({
    components: Array.from(window.dashboard.components.keys()),
    currentComponent: window.dashboard.currentComponent,
    isReady: window.dashboard.isReady
  }),
  
  // Reload specific component
  reloadComponent: (id) => window.dashboard.loadComponent(id),
  
  // Test data conversion
  testConversion: (data) => window.dashboard.gristAPI.getData(data),
  
  // Performance stats
  getPerformanceStats: () => ({
    componentLoadTime: Array.from(performanceMonitor.componentLoadTime.entries()),
    memoryUsage: performance.memory
  })
};
```

---

## 🚀 **Extensions et Plugins**

### **Plugin Architecture**
```javascript
const pluginSystem = {
  plugins: new Map(),
  
  register: (name, plugin) => {
    if (plugin.install && typeof plugin.install === 'function') {
      plugin.install(gristAPI);
      pluginSystem.plugins.set(name, plugin);
      console.log(`Plugin ${name} installed`);
    }
  },
  
  unregister: (name) => {
    const plugin = pluginSystem.plugins.get(name);
    if (plugin && plugin.uninstall) {
      plugin.uninstall();
    }
    pluginSystem.plugins.delete(name);
  }
};

// Example plugin
const chartPlugin = {
  install: (api) => {
    api.createChart = (data, options) => {
      // Chart creation logic
    };
  },
  
  uninstall: () => {
    delete gristAPI.createChart;
  }
};

pluginSystem.register('charts', chartPlugin);
```

**Cette architecture technique permet une extension et une maintenance faciles du système, tout en gardant les performances optimales et la sécurité.**