# 🏗️ Architecture Grist App Nest - 3 Niveaux de Composants

> **Analyse et proposition d'implémentation optimale**

---

## 🎯 Vision Architecturale

Grist App Nest utilise une **architecture à 3 niveaux de composants React imbriqués** :

```
┌─────────────────────────────────────────────────────────────────┐
│  NIVEAU 1 : DASHBOARD PRINCIPAL (Composant Principal)          │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃  Header + Navbar                                         ┃  │
│  ┃  [🏠 Accueil] [👥 Clients] [📦 Produits] [💰 Ventes]   ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  NIVEAU 2 : PAGE ACTIVE (Composant Intermédiaire)        │ │
│  │  ╔═══════════════════════════════════════════════════╗   │ │
│  │  ║  Page "Clients"                                   ║   │ │
│  │  ║  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ ║   │ │
│  │  ║  │ NIVEAU 3:    │  │ NIVEAU 3:    │  │ NIVEAU 3:│ ║   │ │
│  │  ║  │ StatsCard    │  │ StatsCard    │  │ StatsCard│ ║   │ │
│  │  ║  │ (Template)   │  │ (Template)   │  │ (Template)│ ║  │ │
│  │  ║  └──────────────┘  └──────────────┘  └──────────┘ ║   │ │
│  │  ║  ┌─────────────────────────────────────────────┐  ║   │ │
│  │  ║  │ NIVEAU 3: ClientsTable (Template)          │  ║   │ │
│  │  ║  └─────────────────────────────────────────────┘  ║   │ │
│  │  ╚═══════════════════════════════════════════════════╝   │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Hiérarchie des Composants

### Niveau 1️⃣ : **Dashboard Principal** (Composant Principal)

**Rôle** : Conteneur principal de l'application

**Responsabilités** :
- ✅ Affiche le Header avec logo et titre
- ✅ Affiche la Navbar avec les liens vers les Pages
- ✅ Gère la navigation entre les Pages
- ✅ Maintient l'état global de l'application

**Unique** : Il n'y a qu'**un seul** Dashboard par application

**Code** :
```jsx
const Dashboard = () => {
    const [currentPage, setCurrentPage] = useState('home');
    const [pages, setPages] = useState([]);

    useEffect(() => {
        // Charge toutes les pages depuis Grist
        const loadPages = async () => {
            const pagesData = await gristAPI.getData('Pages');
            setPages(pagesData);
        };
        loadPages();
    }, []);

    return (
        <div className="dashboard">
            <Header>
                <h1>🪺 Grist App Nest</h1>
                <Navbar>
                    {pages.map(page => (
                        <NavButton
                            key={page.page_id}
                            active={currentPage === page.page_id}
                            onClick={() => setCurrentPage(page.page_id)}
                        >
                            {page.icon} {page.page_name}
                        </NavButton>
                    ))}
                </Navbar>
            </Header>

            <PageContainer>
                <PageRenderer pageId={currentPage} />
            </PageContainer>
        </div>
    );
};
```

---

### Niveau 2️⃣ : **Pages** (Composants Intermédiaires)

**Rôle** : Vues/écrans de l'application affichés dans la navbar

**Responsabilités** :
- ✅ Définit la structure/layout de la vue
- ✅ Utilise plusieurs Templates (Niveau 3)
- ✅ Gère l'état spécifique à la page
- ✅ Coordonne les interactions entre Templates

**Multiples** : Une application a plusieurs Pages (Accueil, Clients, Produits, etc.)

**Exemples de Pages** :
- 🏠 **Accueil** : Dashboard avec métriques globales
- 👥 **Clients** : Gestion des clients
- 📦 **Produits** : Catalogue produits
- 💰 **Ventes** : Historique et stats des ventes
- 📊 **Analytics** : Graphiques et rapports

**Code exemple - Page Clients** :
```jsx
const PageClients = () => {
    const [clients, setClients] = useState([]);
    const [stats, setStats] = useState({});

    useEffect(() => {
        const loadData = async () => {
            const clientsData = await gristAPI.getData('Clients');
            setClients(clientsData);

            // Calcul des stats
            const total = clientsData.length;
            const actifs = clientsData.filter(c => c.statut === 'Actif').length;
            setStats({ total, actifs, inactifs: total - actifs });
        };
        loadData();
    }, []);

    // Charge les templates de base
    const StatsCard = await gristAPI.getChildComponent('stats_card');
    const DataTable = await gristAPI.getChildComponent('data_table');

    return (
        <div className="page-clients">
            {/* Header de la page */}
            <PageHeader
                title="Gestion des Clients"
                icon="👥"
            />

            {/* Row de statistiques utilisant le template StatsCard */}
            <div className="stats-row">
                <StatsCard
                    title="Total Clients"
                    value={stats.total}
                    icon="👥"
                    color="blue"
                />
                <StatsCard
                    title="Actifs"
                    value={stats.actifs}
                    icon="✅"
                    color="green"
                />
                <StatsCard
                    title="Inactifs"
                    value={stats.inactifs}
                    icon="⏸️"
                    color="gray"
                />
            </div>

            {/* Table des clients utilisant le template DataTable */}
            <DataTable
                data={clients}
                columns={[
                    { key: 'nom', label: 'Nom' },
                    { key: 'email', label: 'Email' },
                    { key: 'entreprise', label: 'Entreprise' },
                    { key: 'statut', label: 'Statut', render: (val) => (
                        <StatusBadge status={val} />
                    )}
                ]}
                onRowClick={(client) => showClientDetails(client)}
            />
        </div>
    );
};
```

---

### Niveau 3️⃣ : **Templates** (Composants de Base)

**Rôle** : Composants React réutilisables (briques de base)

**Responsabilités** :
- ✅ Affiche un élément d'interface spécifique
- ✅ Réutilisable dans plusieurs Pages
- ✅ Configurable via props
- ✅ Autonome et isolé

**Réutilisables** : Les Templates sont utilisés par plusieurs Pages

**Exemples de Templates** :
- 📊 **StatsCard** : Carte de métrique avec icône et valeur
- 📋 **DataTable** : Table de données avec tri et filtres
- 📈 **LineChart** : Graphique en ligne
- 🥧 **PieChart** : Graphique circulaire
- 📝 **Form** : Formulaire avec validation
- 🔘 **Button** : Bouton personnalisé
- 🏷️ **Badge** : Badge de statut
- 📤 **Modal** : Fenêtre modale

**Code exemple - Template StatsCard** :
```jsx
const StatsCard = ({ title, value, icon, color, trend }) => {
    const colors = {
        blue: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        green: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        red: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        orange: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        gray: 'linear-gradient(135deg, #a8a8a8 0%, #636363 100%)'
    };

    return (
        <div
            className="stats-card"
            style={{
                background: colors[color] || colors.blue,
                borderRadius: '12px',
                padding: '24px',
                color: 'white',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}
        >
            <div className="icon" style={{ fontSize: '2rem', marginBottom: '12px' }}>
                {icon}
            </div>
            <div className="value" style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                {value}
            </div>
            <div className="title" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                {title}
            </div>
            {trend && (
                <div className="trend" style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                    {trend > 0 ? '📈' : '📉'} {Math.abs(trend)}%
                </div>
            )}
        </div>
    );
};
```

**Code exemple - Template DataTable** :
```jsx
const DataTable = ({ data, columns, onRowClick }) => {
    const [sortKey, setSortKey] = useState(null);
    const [sortOrder, setSortOrder] = useState('asc');

    const sortedData = useMemo(() => {
        if (!sortKey) return data;

        return [...data].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortKey, sortOrder]);

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    return (
        <table className="data-table">
            <thead>
                <tr>
                    {columns.map(col => (
                        <th
                            key={col.key}
                            onClick={() => handleSort(col.key)}
                            style={{ cursor: 'pointer' }}
                        >
                            {col.label}
                            {sortKey === col.key && (
                                <span>{sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>
                            )}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {sortedData.map((row, index) => (
                    <tr
                        key={index}
                        onClick={() => onRowClick && onRowClick(row)}
                        style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                    >
                        {columns.map(col => (
                            <td key={col.key}>
                                {col.render ? col.render(row[col.key], row) : row[col.key]}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
```

---

## 🗄️ Structure de Données Grist

### Option 1 : Tables Séparées (Recommandée)

#### Table `Pages` (Niveau 2)
```
┌──────────┬────────────┬──────┬─────────────────┬────────────────────┐
│ page_id  │ page_name  │ icon │ component_code  │ templates_used     │
├──────────┼────────────┼──────┼─────────────────┼────────────────────┤
│ home     │ Accueil    │ 🏠   │ const Page=...  │ ["stats_card",..] │
│ clients  │ Clients    │ 👥   │ const Page=...  │ ["stats_card",..] │
│ products │ Produits   │ 📦   │ const Page=...  │ ["data_table",..] │
│ sales    │ Ventes     │ 💰   │ const Page=...  │ ["line_chart",..] │
└──────────┴────────────┴──────┴─────────────────┴────────────────────┘
```

#### Table `Templates` (Niveau 3)
```
┌─────────────┬──────────────┬───────────────┬─────────────────────┐
│ template_id │ template_name│ category      │ component_code      │
├─────────────┼──────────────┼───────────────┼─────────────────────┤
│ stats_card  │ StatsCard    │ display       │ const Component=... │
│ data_table  │ DataTable    │ display       │ const Component=... │
│ line_chart  │ LineChart    │ charts        │ const Component=... │
│ pie_chart   │ PieChart     │ charts        │ const Component=... │
│ form_input  │ FormInput    │ forms         │ const Component=... │
└─────────────┴──────────────┴───────────────┴─────────────────────┘
```

#### Table `Config` (Niveau 1)
```
┌──────────────┬───────────────┬──────────────┬────────────────────┐
│ config_key   │ config_value  │ config_type  │ description        │
├──────────────┼───────────────┼──────────────┼────────────────────┤
│ pages_order  │ [home,...]    │ json         │ Ordre navbar       │
│ default_page │ home          │ text         │ Page par défaut    │
│ app_name     │ My App        │ text         │ Nom application    │
│ app_logo     │ 🪺            │ text         │ Logo               │
└──────────────┴───────────────┴──────────────┴────────────────────┘
```

### Option 2 : Table Unique avec Hiérarchie

#### Table `Components` (Tous niveaux)
```
┌──────────────┬───────────┬──────────┬───────────┬──────────┬─────────┐
│ component_id │ name      │ level    │ parent_id │ order    │ code    │
├──────────────┼───────────┼──────────┼───────────┼──────────┼─────────┤
│ dashboard    │ Dashboard │ 1        │ null      │ 0        │ const...│
│ page_home    │ Accueil   │ 2        │ dashboard │ 1        │ const...│
│ page_clients │ Clients   │ 2        │ dashboard │ 2        │ const...│
│ tpl_stats    │ StatsCard │ 3        │ null      │ 0        │ const...│
│ tpl_table    │ DataTable │ 3        │ null      │ 0        │ const...│
└──────────────┴───────────┴──────────┴───────────┴──────────┴─────────┘
```

**Recommandation** : **Option 1** (tables séparées) pour plus de clarté et facilité de maintenance.

---

## 🔧 API gristAPI Étendue

### Nouvelle API pour Composants Imbriqués

```javascript
window.gristAPI = {
    // ===== CRUD DONNÉES (existant) =====
    getData: async (tableName) => { ... },
    addRecord: async (tableName, record) => { ... },
    updateRecord: async (tableName, recordId, updates) => { ... },
    deleteRecord: async (tableName, recordId) => { ... },

    // ===== NAVIGATION (existant) =====
    navigate: (pageId) => { ... },

    // ===== NOUVEAUX : COMPOSANTS IMBRIQUÉS =====

    /**
     * Charge et retourne un composant React enfant (Template)
     * @param {string} templateId - ID du template à charger
     * @returns {React.Component} - Composant React prêt à utiliser
     */
    getChildComponent: async (templateId) => {
        const template = await getData('Templates', { template_id: templateId });
        if (!template) {
            console.warn(`Template ${templateId} not found`);
            return null;
        }

        // Compile le template en composant React
        return compileReactComponent(template.component_code);
    },

    /**
     * Charge une page et ses dépendances
     * @param {string} pageId - ID de la page
     * @returns {Object} - Page avec templates chargés
     */
    getPage: async (pageId) => {
        const page = await getData('Pages', { page_id: pageId });
        if (!page) return null;

        // Pré-charge tous les templates utilisés par la page
        const templates = {};
        if (page.templates_used) {
            for (const templateId of JSON.parse(page.templates_used)) {
                templates[templateId] = await getChildComponent(templateId);
            }
        }

        return { ...page, templates };
    },

    /**
     * Liste toutes les pages pour la navbar
     * @returns {Array} - Liste des pages
     */
    getPages: async () => {
        const pages = await getData('Pages');
        const config = await getData('Config', { config_key: 'pages_order' });

        // Trie selon l'ordre configuré
        if (config && config.config_value) {
            const order = JSON.parse(config.config_value);
            return pages.sort((a, b) =>
                order.indexOf(a.page_id) - order.indexOf(b.page_id)
            );
        }

        return pages;
    },

    /**
     * Liste tous les templates disponibles
     * @param {string} category - Filtrer par catégorie (optionnel)
     * @returns {Array} - Liste des templates
     */
    getTemplates: async (category = null) => {
        const templates = await getData('Templates');
        if (category) {
            return templates.filter(t => t.category === category);
        }
        return templates;
    }
};
```

---

## 🚀 Flux de Rendu Complet

### Étape 1 : Initialisation Dashboard

```javascript
// app.init()
async init() {
    // 1. Init Grist
    await grist.ready({ requiredAccess: 'full' });

    // 2. Setup gristAPI global
    this.setupGlobalGristAPI();

    // 3. Auto-init demo data si nécessaire
    await this.gristManager.checkAndInitializeDemoData();

    // 4. Charge et rend le Dashboard principal
    await this.renderDashboard();
}
```

### Étape 2 : Rendu Dashboard (Niveau 1)

```javascript
async renderDashboard() {
    // Charge toutes les pages
    const pages = await gristAPI.getPages();

    // Compile le composant Dashboard
    const Dashboard = this.compileDashboardComponent(pages);

    // Rend avec React 18
    const root = ReactDOM.createRoot(document.getElementById('app'));
    root.render(<Dashboard />);
}
```

### Étape 3 : Navigation vers Page (Niveau 2)

```javascript
// User clique sur "Clients" dans navbar
async navigateToPage(pageId) {
    // 1. Charge la page et ses templates
    const pageData = await gristAPI.getPage(pageId);

    // 2. Compile le composant Page avec accès aux templates
    const PageComponent = this.compilePageComponent(
        pageData.component_code,
        pageData.templates
    );

    // 3. Rend la page dans le container
    const container = document.getElementById('page-container');
    const root = ReactDOM.createRoot(container);
    root.render(<PageComponent />);
}
```

### Étape 4 : Rendu Templates dans Page (Niveau 3)

```javascript
// Dans le code de la Page
const PageClients = () => {
    // Les templates sont disponibles via gristAPI
    const StatsCard = gristAPI.getChildComponent('stats_card');
    const DataTable = gristAPI.getChildComponent('data_table');

    return (
        <div>
            <StatsCard title="Total" value={150} />
            <DataTable data={clients} />
        </div>
    );
};
```

---

## 📦 Templates de Base Essentiels

### Bibliothèque de Templates Recommandés

#### 📊 Display Components
1. **StatsCard** : Carte métrique avec icône
2. **InfoCard** : Carte d'information
3. **MetricTile** : Tuile métrique simple
4. **ProgressBar** : Barre de progression
5. **StatusBadge** : Badge de statut

#### 📋 Data Components
6. **DataTable** : Table avec tri/filtre
7. **DataGrid** : Grille de données
8. **ListView** : Liste scrollable
9. **TreeView** : Arborescence

#### 📈 Chart Components
10. **LineChart** : Graphique linéaire
11. **BarChart** : Graphique en barres
12. **PieChart** : Graphique circulaire
13. **AreaChart** : Graphique en aires
14. **ScatterPlot** : Nuage de points

#### 📝 Form Components
15. **FormInput** : Champ de saisie
16. **FormSelect** : Liste déroulante
17. **FormCheckbox** : Case à cocher
18. **FormRadio** : Bouton radio
19. **FormTextarea** : Zone de texte
20. **FormDatePicker** : Sélecteur de date

#### 🎨 UI Components
21. **Button** : Bouton personnalisé
22. **Modal** : Fenêtre modale
23. **Dropdown** : Menu déroulant
24. **Tabs** : Onglets
25. **Accordion** : Accordéon
26. **Tooltip** : Info-bulle
27. **Alert** : Message d'alerte
28. **Loader** : Indicateur de chargement

---

## 🎯 Exemple Complet d'Application

### Dashboard Principal (Niveau 1)

```jsx
const Dashboard = () => {
    const [currentPage, setCurrentPage] = useState('home');
    const [pages, setPages] = useState([]);

    useEffect(() => {
        loadPages();
    }, []);

    const loadPages = async () => {
        const pagesData = await gristAPI.getPages();
        setPages(pagesData);
    };

    return (
        <div className="dashboard">
            <header className="header">
                <div className="logo">🪺 Mon Application</div>
                <nav className="navbar">
                    {pages.map(page => (
                        <button
                            key={page.page_id}
                            className={`nav-btn ${currentPage === page.page_id ? 'active' : ''}`}
                            onClick={() => setCurrentPage(page.page_id)}
                        >
                            <span className="icon">{page.icon}</span>
                            <span className="label">{page.page_name}</span>
                        </button>
                    ))}
                </nav>
            </header>

            <main className="page-container">
                <PageRenderer pageId={currentPage} />
            </main>
        </div>
    );
};
```

### Page Accueil (Niveau 2)

```jsx
const PageHome = () => {
    const [metrics, setMetrics] = useState({});

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        const clients = await gristAPI.getData('Clients');
        const products = await gristAPI.getData('Produits');
        const sales = await gristAPI.getData('Ventes');

        const revenue = sales.reduce((sum, s) => sum + s.montant, 0);

        setMetrics({
            clients: clients.length,
            products: products.length,
            sales: sales.length,
            revenue: revenue
        });
    };

    // Charge les templates nécessaires
    const StatsCard = await gristAPI.getChildComponent('stats_card');
    const LineChart = await gristAPI.getChildComponent('line_chart');

    return (
        <div className="page-home">
            <h1>🏠 Tableau de Bord</h1>

            {/* Stats Row */}
            <div className="stats-row">
                <StatsCard
                    title="Clients"
                    value={metrics.clients}
                    icon="👥"
                    color="blue"
                    trend={12}
                />
                <StatsCard
                    title="Produits"
                    value={metrics.products}
                    icon="📦"
                    color="green"
                    trend={5}
                />
                <StatsCard
                    title="Ventes"
                    value={metrics.sales}
                    icon="💰"
                    color="orange"
                    trend={-3}
                />
                <StatsCard
                    title="Chiffre d'Affaires"
                    value={`${metrics.revenue}€`}
                    icon="💵"
                    color="purple"
                    trend={18}
                />
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                <LineChart
                    title="Évolution des Ventes"
                    data={salesData}
                    xKey="date"
                    yKey="montant"
                />
            </div>
        </div>
    );
};
```

---

## ✅ Proposition d'Implémentation Optimale

### Phase 1 : Structure de Données (Grist)

1. ✅ Créer table `Pages` avec colonnes :
   - `page_id` (Text, unique)
   - `page_name` (Text)
   - `icon` (Text)
   - `order` (Numeric)
   - `component_code` (Text, code JSX de la page)
   - `templates_used` (Text, JSON array des template IDs)

2. ✅ Créer table `Templates` avec colonnes :
   - `template_id` (Text, unique)
   - `template_name` (Text)
   - `category` (Text: display, data, charts, forms, ui)
   - `component_code` (Text, code JSX du template)
   - `props_schema` (Text, JSON schema des props attendues)

3. ✅ Créer table `Config` avec colonnes :
   - `config_key` (Text, unique)
   - `config_value` (Text, peut contenir JSON)
   - `config_type` (Text: text, number, boolean, json)

### Phase 2 : API gristAPI Étendue

1. ✅ Ajouter `getChildComponent(templateId)`
2. ✅ Ajouter `getPage(pageId)`
3. ✅ Ajouter `getPages()`
4. ✅ Ajouter `getTemplates(category?)`

### Phase 3 : Système de Rendu à 3 Niveaux

1. ✅ Implémenter `DashboardRenderer` (Niveau 1)
   - Gère la navbar
   - Gère la navigation entre pages

2. ✅ Implémenter `PageRenderer` (Niveau 2)
   - Charge et compile le code de la page
   - Injecte les templates disponibles
   - Rend la page avec React 18

3. ✅ Implémenter `TemplateCompiler` (Niveau 3)
   - Compile les templates en composants React
   - Cache les templates compilés
   - Gère les erreurs de compilation

### Phase 4 : Templates de Base

1. ✅ Créer 10 templates essentiels :
   - StatsCard
   - DataTable
   - LineChart
   - PieChart
   - FormInput
   - Button
   - Modal
   - Badge
   - Loader
   - Alert

### Phase 5 : Pages de Démo

1. ✅ Créer 4 pages de démo :
   - 🏠 Accueil : Dashboard avec métriques
   - 👥 Clients : Liste clients avec DataTable
   - 📦 Produits : Catalogue avec cards
   - 💰 Ventes : Historique avec charts

---

## 🎉 Résultat Final

Une architecture **modulaire, scalable et professionnelle** avec :

✅ **3 niveaux clairement séparés** (Dashboard → Pages → Templates)
✅ **Composants réutilisables** (Templates utilisables dans plusieurs Pages)
✅ **Navigation intuitive** (Navbar générée dynamiquement)
✅ **API étendue** (getChildComponent, getPage, etc.)
✅ **Démonstration complète** (4 pages + 10 templates)
✅ **Stockage dans Grist** (tout dans les tables)
✅ **Auto-initialisation** (demo data si document vide)

**Architecture professionnelle prête pour production ! 🚀**
