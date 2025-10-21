# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Grist Dynamic Dashboard System** - A revolutionary system that transforms Grist (spreadsheet-database hybrid) into a modern application development platform by storing and dynamically loading React components from Grist tables.

- **Current Version**: v3.3 (production ready), v3.4+ in development
- **Tech Stack**: React 18, Babel Standalone, Grist Plugin API
- **Deployment**: Standalone HTML files served via raw GitHub URLs as Grist custom widgets
- **Language**: Documentation is primarily in French

## Architecture

### Core Concept

React components are stored as JSX code in Grist tables and loaded/rendered dynamically:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Grist Tables  │    │  Widget HTML    │    │  React Runtime  │
│   (columnar)    │───▶│  (v3.3+)        │───▶│  (components)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Files

- **`Optimal_solution.html`**: v3.3 production widget (columnar format support)
- **`Grist_App_Nest_v5*.html`**: Latest v5.x development versions
- **`index.html`**: Legacy v2.x (deprecated)
- **Documentation**: `README.md`, `TECHNICAL.md`, `DEPLOYMENT.md`, `MIGRATION.md`

### Data Flow

1. **Grist Storage**: JSX components stored in `Templates` table
2. **Data Fetching**: Widget fetches Grist's columnar format `{id: [1,2,3], name: ['a','b','c']}`
3. **Conversion**: Automatic transformation to `[{id: 1, name: 'a'}, {id: 2, name: 'b'}]`
4. **JSX Processing**: Babel transforms JSX → JavaScript in-browser
5. **React Rendering**: Components rendered in isolated iframes

### Grist Tables Structure

**Templates Table** (required for custom components):
- `template_id` (Text): Unique component identifier
- `template_name` (Text): Display name in navigation
- `component_type` (Text): "functional" or "class"
- `component_code` (Text): Complete JSX component code

**Business Tables** (examples):
- `Clients`: name, email, company, status
- `Ventes`: client_id, produit, montant, date

## Development Workflow

### There is NO Traditional Build Process

This project uses **standalone HTML files** with embedded JavaScript. There are:
- ❌ No `npm install` or `yarn install`
- ❌ No build commands (`npm run build`)
- ❌ No testing framework commands
- ❌ No linting commands
- ❌ No package.json or node_modules

### How to Develop

1. **Edit HTML Files Directly**
   ```bash
   # Edit the main widget file
   vi Optimal_solution.html
   # or the latest version
   vi Grist_App_Nest_v5_2.html
   ```

2. **Test Deployment**
   - Commit and push changes to GitHub
   - Access via raw GitHub URL in Grist custom widget
   - Production URL format: `https://raw.githubusercontent.com/nic01asFr/grist-dynamic-dashboard/main/[filename].html`

3. **Component Development**
   - Create components directly in Grist `Templates` table
   - Use unified JSX format (v3.0+)
   - Test by reloading widget in Grist

4. **Git Workflow**
   ```bash
   git add [modified-html-file]
   git commit -m "Description of changes"
   git push
   ```

### Testing

Testing is done **live in Grist**:
1. Deploy widget to raw GitHub URL
2. Load in Grist document with test data
3. Verify components render correctly
4. Check browser console (F12) for errors
5. Use demo document: `https://grist.numerique.gouv.fr/doc/5AL4y3QrB12BJdf48m7sr4`

## Component Development

### Standard Component Format (v3.3+)

Components must be written as functional React components with the variable name `Component`:

```javascript
const Component = () => {
  const [data, setData] = useState({});

  useEffect(() => {
    const loadData = async () => {
      const clients = await gristAPI.getData('Clients');
      setData({ clients: clients.length });
    };
    loadData();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>
      <p>Total clients: {data.clients}</p>
    </div>
  );
};
```

### Unified Grist API

Available in all components via `gristAPI`:

```javascript
// Data Operations
await gristAPI.getData(tableName)           // Fetch with automatic columnar conversion
await gristAPI.addRecord(table, data)       // Create record
await gristAPI.updateRecord(table, id, data) // Update record
await gristAPI.deleteRecord(table, id)      // Delete record

// Navigation
gristAPI.navigate(componentId)              // Navigate to another component
```

### Important Constraints

1. **Component Variable**: Must be named `Component` (not MyComponent, etc.)
2. **Hooks Available**: `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef` from React
3. **Styling**: Use inline styles (CSS-in-JS), not external CSS classes
4. **Data Format**: Always returns arrays of objects (columnar conversion automatic)

## Critical Technical Details

### Columnar Format Conversion

Grist natively returns data in columnar format. The v3.3+ system automatically converts:

```javascript
// Grist format (columnar)
{ id: [1, 2, 3], name: ['Alice', 'Bob', 'Charlie'] }

// Auto-converted to (what components receive)
[
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' }
]
```

### Version Migration

- **v2.x → v3.3**: Complete format change (HTML/CSS/JS → unified JSX)
- **Migration Script**: Available in `MIGRATION.md`
- **Breaking Changes**: API simplified from `window.grist.fetchTable()` to `gristAPI.getData()`

### Browser Console Debugging

Essential logs to check:
```
🔍 Données brutes pour [TableName]: [raw data]
✅ Données converties pour [TableName]: [converted data]
🔄 Chargement composant: [componentId]
```

## Common Development Patterns

### Dashboard with Metrics

```javascript
const Component = () => {
  const [metrics, setMetrics] = useState({ clients: 0, ventes: 0, ca: 0 });

  useEffect(() => {
    const loadMetrics = async () => {
      const clients = await gristAPI.getData('Clients');
      const ventes = await gristAPI.getData('Ventes');
      const ca = ventes.reduce((sum, v) => sum + (v.montant || 0), 0);
      setMetrics({ clients: clients.length, ventes: ventes.length, ca });
    };
    loadMetrics();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div>Clients: {metrics.clients}</div>
        <div>Ventes: {metrics.ventes}</div>
        <div>CA: {metrics.ca}€</div>
      </div>
    </div>
  );
};
```

### CRUD with Forms

```javascript
const Component = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({});

  const loadItems = async () => {
    const data = await gristAPI.getData('Items');
    setItems(data);
  };

  const saveItem = async () => {
    await gristAPI.addRecord('Items', formData);
    setFormData({});
    await loadItems();
  };

  useEffect(() => { loadItems(); }, []);

  return (
    <div style={{ padding: '20px' }}>
      <input
        value={formData.name || ''}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      <button onClick={saveItem}>Save</button>
      {items.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
  );
};
```

## File Structure Understanding

```
Grist-App-Nest/
├── Optimal_solution.html          # v3.3 production widget (recommended)
├── Grist_App_Nest_v5_2.html      # Latest v5.x development
├── Grist_App_Nest_v5_1.html      # Previous v5.x
├── Grist_App_Nest_v5.html        # First v5.x
├── index.html                     # Legacy v2.x (deprecated)
├── README.md                      # Complete user guide
├── TECHNICAL.md                   # Deep technical architecture
├── QUICKSTART.md                  # 30-second installation guide
├── DEPLOYMENT.md                  # Production deployment guide
├── MIGRATION.md                   # v2.x → v3.3 migration guide
├── GRIST_TEMPLATES.md             # Component template examples
├── ROADMAP.md                     # Future development plans
├── CHANGELOG.md                   # Version history
├── DEMO.md                        # Demo instructions
└── TEST.md                        # Testing guidelines
```

## Deployment Process

### Production Deployment

1. **Prepare Changes**
   - Edit HTML widget file
   - Test locally if possible (limited - needs Grist context)

2. **Commit & Push**
   ```bash
   git add Optimal_solution.html
   git commit -m "✨ Description of changes"
   git push origin main
   ```

3. **Update Grist Widget**
   - Widget URL: `https://raw.githubusercontent.com/nic01asFr/grist-dynamic-dashboard/main/Optimal_solution.html`
   - Access Level: "Read table" minimum
   - Widget refreshes automatically on reload

### Version Management

- **Stable versions**: Commit to named files (e.g., `Optimal_solution.html`)
- **Development versions**: Use version numbers (e.g., `Grist_App_Nest_v5_2.html`)
- **Migration path**: Always test on copy of Grist document first

## Key Differences from Traditional Web Projects

1. **No Package Manager**: All dependencies loaded from CDN (React, Babel)
2. **No Build Step**: Babel transforms JSX in-browser at runtime
3. **Storage in Database**: Components stored in Grist tables, not file system
4. **Live Editing**: Edit components directly in Grist UI
5. **Deployment = Git Push**: No CI/CD, just raw file serving
6. **Testing = Live Testing**: No unit tests, integration tests done in Grist

## Performance Considerations

- **Load Time**: Target < 2 seconds
- **Columnar Conversion**: < 50ms for 1000 records
- **Rendering**: 60 FPS target for complex UIs
- **Widget Size**: ~38KB for v3.3

## Common Issues & Solutions

### Issue: "Component is not defined"
**Solution**: Ensure component variable is named exactly `Component`

### Issue: "templates is not iterable"
**Solution**: Upgrade to v3.3+ which handles columnar format

### Issue: ".map is not a function"
**Solution**: v3.3+ auto-converts columnar to arrays

### Issue: Components not loading
**Solution**: Check browser console, verify Templates table structure

## Documentation Cross-Reference

- **Getting Started**: See `QUICKSTART.md` (30-second setup)
- **Full API Reference**: See `TECHNICAL.md` (detailed API docs)
- **Migration from v2.x**: See `MIGRATION.md` (complete migration guide)
- **Component Examples**: See `GRIST_TEMPLATES.md` (template patterns)
- **Future Features**: See `ROADMAP.md` (development roadmap)

## Support & Resources

- **Demo Document**: https://grist.numerique.gouv.fr/doc/5AL4y3QrB12BJdf48m7sr4
- **Grist Docs**: https://docs.getgrist.com
- **Issues**: GitHub Issues for bug reports and feature requests
- **Community**: Grist community forums for general questions
