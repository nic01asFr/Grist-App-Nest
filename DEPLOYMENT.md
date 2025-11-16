# 🚀 Guide de Déploiement - Grist App Nest v6.0

## 📦 Widget Standalone

Le widget est disponible en **fichier HTML unique** (586 KB) avec tout le code inline :
- ✅ JavaScript (React 18, Recharts, Zustand) - minifié
- ✅ CSS (Tailwind + animations) - minifié
- ✅ Seule dépendance externe : Grist Plugin API

## 🔧 Build Local

### Option 1 : Build complet
```bash
pnpm build:standalone
```

Génère deux fichiers :
- `dist/grist-app-nest.html` → Pour GitHub Pages
- `grist-app-nest.html` → Pour Raw GitHub URL

### Option 2 : Build standard
```bash
pnpm build
```
Génère uniquement `dist/` (sans inline).

## 🌐 Déploiement Production

### 🔵 Option A : GitHub Pages (Recommandé)

**URL finale** : `https://nic01asFr.github.io/Grist-App-Nest/grist-app-nest.html`

#### Déploiement Automatique (CI/CD)
Le workflow `.github/workflows/deploy.yml` s'exécute automatiquement au push sur `main` :

```yaml
1. TypeCheck (tsc --noEmit)
2. Lint (eslint)
3. Build standalone (pnpm build:standalone)
4. Deploy sur GitHub Pages
```

**Activer GitHub Pages** :
1. Aller dans `Settings` → `Pages`
2. Source : `Deploy from a branch`
3. Branch : `gh-pages` (créé automatiquement par le workflow)
4. Le widget sera accessible à l'URL ci-dessus

#### Déploiement Manuel
```bash
pnpm build:standalone
pnpm deploy
```

### 🟢 Option B : Raw GitHub URL

**URL finale** : `https://raw.githubusercontent.com/nic01asFr/Grist-App-Nest/main/grist-app-nest.html`

**Workflow** :
1. Build standalone :
   ```bash
   pnpm build:standalone
   ```

2. Commit le fichier racine :
   ```bash
   git add grist-app-nest.html
   git commit -m "Update widget"
   git push
   ```

3. Le widget est immédiatement accessible via l'URL raw

**Avantages** :
- ✅ Déploiement immédiat (pas de build GitHub)
- ✅ Pas besoin d'activer GitHub Pages
- ✅ URL directe et simple

**Inconvénients** :
- ⚠️ Fichier binaire (586KB) dans le repo
- ⚠️ Pas de cache CDN optimal
- ⚠️ Headers CORS potentiels

## 📋 Configuration dans Grist

### 1. Créer un Custom Widget

1. Ouvrir votre document Grist
2. Cliquer sur **Add New** → **Add Widget to Page**
3. Sélectionner **Custom Widget**

### 2. Configurer le Widget

**URL** (choisir une option) :
```
GitHub Pages:
https://nic01asFr.github.io/Grist-App-Nest/grist-app-nest.html

Raw GitHub:
https://raw.githubusercontent.com/nic01asFr/Grist-App-Nest/main/grist-app-nest.html
```

**Access Level** :
- ✅ Sélectionner : **Full document access**
- ⚠️ Requis pour créer tables et relations

### 3. Premier Lancement

Au premier lancement, le widget :
1. 🔌 Se connecte à Grist via l'API
2. 🗄️ Vérifie l'existence des tables
3. 📊 Crée le schéma relationnel (7 tables)
4. 📦 Peuple avec données de démo
5. ✅ Affiche le dashboard

**Temps d'initialisation** : ~2-5 secondes

## 🧪 Test en Local

### Développement
```bash
pnpm dev
```
- Ouvre `http://localhost:3000`
- ⚠️ Grist API non disponible (erreur attendue)
- Permet de tester l'UI uniquement

### Preview de Production
```bash
pnpm build
pnpm preview
```
- Ouvre `http://localhost:4173`
- Build de production (minifié)

## 🔍 Vérification du Widget

### Checklist pré-déploiement
- [ ] `pnpm typecheck` → Pas d'erreurs TypeScript
- [ ] `pnpm lint` → Pas d'erreurs ESLint
- [ ] `pnpm build` → Build réussi
- [ ] `pnpm build:standalone` → Fichier généré
- [ ] Taille < 1MB (actuellement 586KB)
- [ ] Test dans Grist → Tables créées
- [ ] Test dans Grist → Navigation fonctionne
- [ ] Test dans Grist → Données affichées

### Debugging

**Console du navigateur (F12)** :
```javascript
// Logs importants à vérifier
🔌 Connexion à Grist...
🗄️ Vérification des données...
✅ Données existantes détectées
  OU
📦 Données de démo créées avec succès !

// API disponible
window.gristAPI.getData('Clients')
window.gristAPI.navigate('products')
```

## 📊 Monitoring

### Logs de build
Le workflow GitHub Actions affiche :
```
✓ TypeCheck passed
✓ Lint passed
✓ Build standalone (586.26 KB)
✓ Deployed to GitHub Pages
```

### Métriques importantes
- **Bundle Size** : 586 KB (target: < 1MB)
- **Gzip Size** : ~157 KB
- **Tables créées** : 7 (Config, Pages, Templates, Clients, Produits, PageTemplates, Ventes)
- **Records démo** : 27 (4 pages + 5 clients + 6 produits + 6 ventes + 4 configs + 2 page-templates)

## 🔄 Mise à Jour du Widget

### Workflow de mise à jour

1. **Développer localement** :
   ```bash
   pnpm dev
   # Faire les modifications
   ```

2. **Tester** :
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm build:standalone
   ```

3. **Commit & Push** :
   ```bash
   git add .
   git commit -m "Description des changements"
   git push origin main
   ```

4. **Déploiement automatique** :
   - GitHub Actions build le widget
   - Déploie sur GitHub Pages
   - Widget mis à jour dans ~2-3 minutes

5. **Recharger dans Grist** :
   - Refresh de la page Grist
   - Le widget recharge avec la nouvelle version

## 🚨 Troubleshooting

### Problème : Widget ne charge pas

**Symptômes** : Écran blanc ou erreur CORS

**Solutions** :
1. Vérifier l'URL du widget
2. Vérifier que GitHub Pages est activé
3. Essayer l'URL alternative (Raw GitHub)
4. Vérifier la console du navigateur (F12)

### Problème : Tables non créées

**Symptômes** : Erreur "Table not found"

**Solutions** :
1. Vérifier Access Level = "Full document access"
2. Recharger le widget
3. Vérifier les logs console
4. Créer manuellement les tables si nécessaire

### Problème : Build échoue

**Symptômes** : Erreur TypeScript ou ESLint

**Solutions** :
```bash
# Fix automatique ESLint
pnpm lint:fix

# Vérifier les types
pnpm typecheck

# Rebuild from scratch
rm -rf node_modules dist
pnpm install
pnpm build
```

## 📚 Ressources

### Documentation
- [README.md](./README.md) - Guide complet
- [ARCHITECTURE_3_NIVEAUX.md](./docs/ARCHITECTURE_3_NIVEAUX.md) - Architecture détaillée
- [SCHEMA_RELATIONNEL.md](./docs/SCHEMA_RELATIONNEL.md) - Base de données

### URLs importantes
- **GitHub Repo** : https://github.com/nic01asFr/Grist-App-Nest
- **GitHub Pages** : https://nic01asFr.github.io/Grist-App-Nest/grist-app-nest.html
- **Raw GitHub** : https://raw.githubusercontent.com/nic01asFr/Grist-App-Nest/main/grist-app-nest.html
- **Grist Docs** : https://docs.getgrist.com

---

**Widget prêt à l'emploi !** 🎉
