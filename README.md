# 🪺 Grist App Nest v6.0

Plateforme de gestion dynamique basée sur Grist - Architecture moderne avec React 18 + TypeScript + Vite

## 📋 Vue d'ensemble

Grist App Nest transforme Grist (base de données collaborative) en plateforme d'application moderne avec :
- **Architecture à 3 niveaux** : Dashboard → Pages → Templates
- **Build moderne** : Vite + React 18 + TypeScript + Tailwind CSS
- **Widget standalone** : Bundle HTML unique pour Grist Custom Widgets
- **Schéma relationnel** : Création automatique de tables avec relations Ref

## 🏗️ Architecture

### Niveau 1 - Dashboard (Container principal)
```
Dashboard.tsx
├── Header (Logo + Titre + User)
├── Navbar (Génération dynamique depuis table Pages)
└── Main (Rendu de la page active)
```

### Niveau 2 - Pages (4 pages métier)
- **PageHome** : Dashboard global avec métriques
- **PageClients** : Gestion clients avec stats et table
- **PageProducts** : Catalogue produits avec graphiques
- **PageSales** : Ventes avec analytics temporels

### Niveau 3 - Templates (10 composants réutilisables)

#### Display
- `StatsCard` : Carte métrique avec icône et trend

#### Data
- `DataTable` : Table sortable avec colonnes personnalisables

#### Charts (Recharts)
- `LineChart` : Séries temporelles
- `PieChart` : Distribution circulaire
- `BarChart` : Comparaisons en barres

#### Forms
- `FormInput` : Input universel (text, number, select, textarea, date)

#### UI
- `Button` : Bouton avec variants (primary, secondary, success, error)
- `Modal` : Dialog avec header/footer
- `Badge` : Badge de statut coloré
- `Loader` : Indicateur de chargement (spinner, dots, pulse)

## 🗄️ Schéma de base de données

Le widget crée automatiquement 7 tables relationnelles :

### Tables de configuration
- **Config** : Configuration applicative (clé/valeur)
- **Pages** : Pages affichées dans la navbar
- **Templates** : Templates de composants (futurs)

### Tables métier
- **Clients** : nom, email, entreprise, statut
- **Produits** : nom, prix, stock, catégorie, description
- **Ventes** : client_id (Ref), produit_id (Ref), quantité, prix, montant

### Tables de liaison
- **PageTemplates** : page_id (Ref), template_id (Ref), order, config

## 🚀 Installation et Build

### Prérequis
- Node.js 18+
- pnpm (ou npm/yarn)

### Installation
```bash
pnpm install
```

### Développement
```bash
pnpm dev
# Ouvre http://localhost:3000
```

### Build
```bash
# Build standard (dist/)
pnpm build

# Build standalone (grist-app-nest.html)
pnpm build:standalone
```

### Build Standalone
Le script `scripts/build-standalone.js` génère un fichier HTML unique avec :
- ✅ JavaScript inline
- ✅ CSS inline
- ✅ Tous les assets intégrés
- 📦 ~574KB minifié (Gzip: ~157KB)

## 📁 Structure du projet

```
Grist-App-Nest/
├── src/
│   ├── core/                      # Classes de base
│   │   ├── types.ts              # Types TypeScript
│   │   ├── Logger.ts             # Logger structuré
│   │   ├── GristWidgetBase.ts    # Base Grist API
│   │   ├── GristSchemaManager.ts # Création schema
│   │   └── GristIntegrationManager.ts # Init demo data
│   │
│   ├── api/                       # API Layer
│   │   ├── gristAPI.ts           # API globale (window.gristAPI)
│   │   └── hooks/
│   │       └── useGristData.ts   # Hook React pour fetching
│   │
│   ├── templates/                 # Level 3 Components
│   │   ├── display/              # StatsCard
│   │   ├── data/                 # DataTable
│   │   ├── charts/               # LineChart, PieChart, BarChart
│   │   ├── forms/                # FormInput
│   │   └── ui/                   # Button, Modal, Badge, Loader
│   │
│   ├── pages/                     # Level 2 Components
│   │   ├── PageHome.tsx
│   │   ├── PageClients.tsx
│   │   ├── PageProducts.tsx
│   │   └── PageSales.tsx
│   │
│   ├── components/                # Level 1 Components
│   │   └── Dashboard.tsx         # Main container
│   │
│   ├── styles/
│   │   └── index.css             # Tailwind + custom animations
│   │
│   ├── App.tsx                    # Root component
│   └── main.tsx                   # Entry point
│
├── docs/                          # Documentation
│   ├── ARCHITECTURE_3_NIVEAUX.md
│   ├── SCHEMA_RELATIONNEL.md
│   └── GITHUB_RECOMMENDATIONS.md
│
├── vite.config.ts                 # Vite config
├── tsconfig.json                  # TypeScript config
├── tailwind.config.js             # Tailwind config
├── package.json
└── README.md
```

## 🎯 Utilisation dans Grist

### 1. Build du widget
```bash
pnpm build:standalone
```

### 2. Déploiement
Deux options :

**A. GitHub Pages** (recommandé)
```bash
pnpm deploy
```
URL: `https://USERNAME.github.io/REPO/grist-app-nest.html`

**B. Raw GitHub**
```
https://raw.githubusercontent.com/USERNAME/REPO/main/grist-app-nest.html
```

### 3. Configuration dans Grist
1. Ouvrir votre document Grist
2. Ajouter → Custom Widget
3. URL: `[URL du widget]`
4. Access Level: **Full document access**
5. Le widget initialise automatiquement les tables et données de démo

## 🔧 API Globale (window.gristAPI)

### Opérations données
```typescript
// Fetch data
const clients = await gristAPI.getData<ClientRecord>('Clients');

// Add record
const id = await gristAPI.addRecord('Clients', {
  nom: 'Jean Dupont',
  email: 'jean@example.com',
  statut: 'Actif'
});

// Update record
await gristAPI.updateRecord('Clients', id, { statut: 'Inactif' });

// Delete record
await gristAPI.deleteRecord('Clients', id);
```

### Navigation
```typescript
// Navigate to page
gristAPI.navigate('clients');

// Get all pages
const pages = await gristAPI.getPages();

// Get templates (filtered)
const chartTemplates = await gristAPI.getTemplates('charts');
```

## 🎨 Développement de composants

### Hook useGristData
```typescript
import { useGristData } from '@api/hooks/useGristData';
import type { ClientRecord } from '@core/types';

function MyComponent() {
  const { data, loading, error, refresh } = useGristData<ClientRecord>('Clients');

  if (loading) return <Loader />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map(client => (
        <div key={client.id}>{client.nom}</div>
      ))}
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### Utilisation des templates
```typescript
import { StatsCard, DataTable, LineChart } from '@templates';

function Dashboard() {
  return (
    <div>
      <StatsCard
        title="Total Clients"
        value={125}
        icon="👥"
        color="blue"
        trend={12}
      />

      <DataTable
        data={clients}
        columns={[
          { key: 'nom', label: 'Nom' },
          { key: 'email', label: 'Email' }
        ]}
      />

      <LineChart
        data={salesData}
        xKey="date"
        yKeys={[
          { key: 'montant', label: 'CA', color: '#10b981' }
        ]}
      />
    </div>
  );
}
```

## 📊 Données de démo

Au premier lancement, le widget crée automatiquement :
- 4 pages (Accueil, Clients, Produits, Ventes)
- 5 clients
- 6 produits (Informatique, Accessoires, Audio)
- 6 ventes avec relations

## 🔒 Schéma de création des tables

Le widget utilise un processus en 3 étapes pour garantir l'intégrité :

1. **Création des tables vides**
   ```typescript
   await createAllTables(); // Config, Pages, Templates, Clients, Produits, Ventes
   ```

2. **Ajout des colonnes**
   ```typescript
   await addAllColumns(); // Text, Numeric, Int, Date, Choice, DateTime
   ```

3. **Déclaration des relations**
   ```typescript
   await addAllRelations(); // Ref:Clients, Ref:Produits
   ```

## 🧪 Tests et Qualité

### Linting
```bash
pnpm lint
```

### Format
```bash
pnpm format
```

### Type checking
```bash
pnpm build  # TypeScript compilation incluse
```

## 📦 Bundle Size

| Fichier | Taille | Gzip |
|---------|--------|------|
| index.html | 0.6 KB | 0.4 KB |
| index.css | 22.5 KB | 4.8 KB |
| index.js | 574.5 KB | 157.0 KB |
| **Total** | **597.6 KB** | **162.2 KB** |

Inclut : React 18, React DOM, Recharts, Zustand

## 🚀 Prochaines étapes

- [ ] Mode édition des pages dans Grist
- [ ] Templates dynamiques depuis table Templates
- [ ] Export PDF/Excel des données
- [ ] Thèmes personnalisables
- [ ] Mode responsive mobile
- [ ] Tests unitaires (Vitest)

## 📝 Changelog

### v6.0 (2025-11-16)
- ✨ Architecture complète React 18 + TypeScript + Vite
- ✨ 10 templates réutilisables
- ✨ 4 pages métier fonctionnelles
- ✨ Dashboard avec navbar dynamique
- ✨ Schéma relationnel avec 7 tables
- ✨ Build standalone HTML unique
- ✨ API globale window.gristAPI
- ✨ Hook useGristData pour fetching React

## 📄 Licence

MIT

## 👥 Contributeurs

Nicolas François (@nic01asFr)

---

**Powered by Grist** 🪺
