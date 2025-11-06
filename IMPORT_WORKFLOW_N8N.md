# Guide d'Import et Configuration - Workflow N8N App Nest Creator

## 📋 Vue d'ensemble

Ce guide explique comment importer et configurer le workflow N8N complet pour créer automatiquement des applications App Nest de gestion patrimoniale immobilière.

**Fichier workflow:** `workflow_appnest_creator_complete.json`

**Version:** Workflow simplifié (7 agents principaux)
- ✅ Agent 1: Conversation Manager
- ✅ Agent 2: Intent Analyzer
- ✅ Agent 3: Validation Coordinator
- ✅ Agent 4: Entity Classifier
- ✅ Agent 10: Code Generator (CRITIQUE)
- ✅ Agent 11: Syntax Validator (CRITIQUE)
- ✅ Agent 13: App Assembler

**Durée d'exécution:** ~3 minutes par application

---

## 🚀 ÉTAPE 1: Importer le Workflow dans N8N

### 1.1 Accéder à N8N

```bash
# Si N8N self-hosted
http://localhost:5678

# Si N8N Cloud
https://app.n8n.cloud
```

### 1.2 Importer le Fichier JSON

1. Dans N8N, cliquer sur **Workflows** (menu gauche)
2. Cliquer sur **Import from File**
3. Sélectionner `workflow_appnest_creator_complete.json`
4. Cliquer **Import**

Le workflow sera créé avec le nom: **"App Nest Creator - Patrimoine Immobilier"**

### 1.3 Vérifier l'Import

Après import, vous devriez voir:
- ✅ 35+ nodes dans le workflow
- ✅ Structure en cascade (gauche → droite)
- ⚠️ Erreurs rouges sur certains nodes (normal - credentials manquantes)

---

## 🔑 ÉTAPE 2: Configurer les Credentials Albert API

### 2.1 Comprendre la Configuration

Le workflow utilise l'**API Albert** (API française LLM) au format compatible OpenAI.

**Configuration requise:**
- **Type:** OpenAI API (compatible)
- **Credential Name:** "Header Albert API"
- **Model:** albert-code
- **Base URL:** URL de votre instance Albert API

### 2.2 Créer Credential Albert API

1. Dans N8N, aller à **Settings** → **Credentials**
2. Cliquer **Add Credential**
3. Rechercher **"OpenAI"**
4. Configurer:

```json
{
  "name": "Header Albert API",
  "type": "openAiApi",
  "data": {
    "apiKey": "YOUR_ALBERT_API_KEY",
    "baseURL": "https://your-albert-instance.com/v1"
  }
}
```

**Notes:**
- Si Albert API utilise authentification différente, adapter le type de credential
- L'API doit être compatible format OpenAI (endpoints `/v1/chat/completions`)

### 2.3 Configurer Credential Grist API

1. Créer nouveau credential **HTTP Header Auth**
2. Configurer:

```json
{
  "name": "Grist API Header",
  "type": "httpHeaderAuth",
  "data": {
    "name": "Authorization",
    "value": "Bearer YOUR_GRIST_API_KEY"
  }
}
```

**Obtenir Grist API Key:**
1. Aller sur https://grist.numerique.gouv.fr/account
2. Section **API**
3. Créer nouvelle clé
4. Copier la clé

---

## ⚙️ ÉTAPE 3: Configurer les Variables Workflow

### 3.1 Variables Obligatoires

Le workflow nécessite ces variables globales:

1. Dans le workflow, aller à **Settings** (icône engrenage en haut)
2. Section **Variables**
3. Ajouter ces variables:

```json
{
  "GRIST_API_KEY": "YOUR_GRIST_API_KEY",
  "GRIST_DOC_URL": "https://grist.numerique.gouv.fr",
  "WIDGET_URL": "https://raw.githubusercontent.com/nic01asFr/grist-dynamic-dashboard/main/Grist_App_Nest_v5_2.html"
}
```

### 3.2 Vérifier Configuration Variables

Après configuration, tester dans un node **Code**:

```javascript
// Test variables
console.log('GRIST_API_KEY:', $vars.GRIST_API_KEY ? 'OK' : 'MANQUANT');
console.log('GRIST_DOC_URL:', $vars.GRIST_DOC_URL);
console.log('WIDGET_URL:', $vars.WIDGET_URL);

return {
  variables_configured: true,
  grist_url: $vars.GRIST_DOC_URL
};
```

---

## 🔗 ÉTAPE 4: Connecter les Credentials aux Nodes

### 4.1 Nodes Albert API

Pour chaque node **"Albert API - Agent X"**:

1. Ouvrir le node
2. Section **Credentials**
3. Sélectionner **"Header Albert API"** (créée à l'étape 2)
4. **Save**

**Liste des nodes à configurer:**
- Albert API - Agent 1
- Albert API - Agent 2
- Albert API - Agent 3
- Albert API - Agent 4
- Albert API - Agent 10
- Albert API - Agent 11
- Albert API - Agent 13

### 4.2 Node HTTP Request (Grist)

Pour le node **"Create Grist Document"**:

1. Ouvrir le node
2. Section **Authentication**
3. Type: **Predefined Credential Type**
4. Credential Type: **HTTP Header Auth**
5. Sélectionner **"Grist API Header"**
6. **Save**

---

## ✅ ÉTAPE 5: Activer et Tester le Workflow

### 5.1 Activer le Workflow

1. En haut à droite, toggle **Inactive** → **Active**
2. Le workflow devient vert (actif)

Le webhook sera disponible à:
```
https://your-n8n-instance.com/webhook/app-nest-creator
```

### 5.2 Obtenir l'URL du Webhook

1. Cliquer sur le node **"Webhook Trigger"**
2. Section **Webhook URLs**
3. Copier **Production URL**

**Format:** `https://your-n8n.com/webhook/app-nest-creator`

### 5.3 Test Simple

**Commande cURL:**

```bash
curl -X POST https://your-n8n.com/webhook/app-nest-creator \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "Je veux une application simple pour gérer une liste de bâtiments avec leur nom, adresse et état"
  }'
```

**Résultat attendu (après ~3 min):**

```json
{
  "success": true,
  "message": "Application App Nest créée avec succès !",
  "document_id": "AbCdEf123456",
  "document_url": "https://grist.numerique.gouv.fr/doc/AbCdEf123456",
  "tables_created": 8,
  "components_created": 6,
  "widget_url": "https://raw.githubusercontent.com/...",
  "instructions": "1. Ouvrir le document Grist..."
}
```

### 5.4 Test Complet (Patrimoine)

```bash
curl -X POST https://your-n8n.com/webhook/app-nest-creator \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "Je veux une application complète de gestion patrimoniale immobilière pour ma collectivité. Nous devons gérer nos sites, bâtiments, locaux, équipements avec suivi des interventions de maintenance et du budget. Il faut un tableau de bord avec indicateurs clés, la gestion CRUD de toutes les entités, un workflow pour les interventions (planifiée, en cours, terminée) et un suivi budgétaire. Conformité RGPD, RGAA et DSFR obligatoire."
  }'
```

---

## 🔍 ÉTAPE 6: Déboguer et Monitorer

### 6.1 Voir les Exécutions

1. Dans N8N, aller à **Executions** (menu gauche)
2. Liste de toutes les exécutions
3. Cliquer sur une exécution pour voir le détail

### 6.2 Logs par Node

Pour chaque node exécuté:
- ✅ Vert: Succès
- 🔴 Rouge: Erreur
- 🟡 Orange: Warning

Cliquer sur un node pour voir:
- **Input:** Données reçues
- **Output:** Données produites
- **Logs:** Console.log du node

### 6.3 Erreurs Fréquentes

#### Erreur: "Authentication failed"

**Cause:** Credential Albert API incorrecte

**Solution:**
1. Vérifier API key
2. Tester manuellement l'API Albert:
```bash
curl -X POST https://your-albert-instance.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "albert-code",
    "messages": [{"role": "user", "content": "Test"}]
  }'
```

#### Erreur: "Variable GRIST_API_KEY not found"

**Cause:** Variables workflow non définies

**Solution:**
1. Workflow Settings → Variables
2. Ajouter toutes les variables requises
3. **Save Workflow**

#### Erreur: "Failed to parse JSON"

**Cause:** Agent retourne texte non-JSON

**Solution:**
1. Vérifier prompt agent (doit finir par "Réponds UNIQUEMENT avec ce JSON")
2. Augmenter température si besoin (0.1 → 0.2)
3. Ajouter node **Code** pour parser JSON manuellement

---

## 🎯 ÉTAPE 7: Optimisations et Ajustements

### 7.1 Ajuster Température LLM

Pour chaque node **Albert API**:
- **Agent 1-3** (analyse): température 0.3 (créatif)
- **Agent 4** (classification): température 0.2 (précis)
- **Agent 10** (code): température 0.3 (créatif)
- **Agent 11** (validation): température 0.1 (strict)

### 7.2 Ajuster Max Tokens

Si réponses tronquées:
- Agent 1-3: 2000 → 2500
- Agent 4: 3500 → 4000
- Agent 10: 4096 (max recommandé)

### 7.3 Ajouter Retry sur Erreurs

Pour nodes critiques (Albert API):

1. Ouvrir node
2. Section **Settings**
3. Activer:
   - **Continue On Fail:** ✅
   - **Retry On Fail:** ✅
   - **Max Tries:** 3
   - **Wait Between Tries:** 2000ms

---

## 📊 ÉTAPE 8: Étendre le Workflow (Agents 5-9, 12, 14-21)

Le workflow actuel contient 7 agents principaux. Pour un workflow complet de production avec 21 agents:

### 8.1 Agents à Ajouter (Phase 2-3)

**Phase 2: Architecture Données**
- Agent 5: Schema Designer
- Agent 6: Relationship Optimizer

**Phase 3: Patterns UI**
- Agent 7: Pattern Detector
- Agent 8: Component Selector
- Agent 9: Compatibility Validator

### 8.2 Agents à Ajouter (Phase 4-7)

**Phase 4: Optimisation**
- Agent 12: Performance Optimizer

**Phase 5: QA**
- Agent 14: Integration Manager
- Agent 15: Quality Assurance

**Phase 6: Déploiement**
- Agent 16: Deployment Manager
- Agent 17: Rollback Coordinator
- Agent 18: Testing Coordinator

**Phase 7: Monitoring**
- Agent 19: Monitor
- Agent 20: Feedback Analyzer
- Agent 21: Improvement Planner

### 8.3 Template pour Ajouter un Agent

Pour chaque agent manquant:

1. **Dupliquer Agent 2** (bon template)
2. **Renommer:** "Agent X: [Nom]"
3. **Modifier prompt:** Utiliser prompt de `N8N_WORKFLOW_CONFIGURATION.md`
4. **Connecter:**
   - Input: Edit Fields précédent
   - Output: Edit Fields suivant
   - LLM: Albert API
5. **Positionner:** X=position précédente + 200, Y=300

---

## 📈 ÉTAPE 9: Métriques et Monitoring

### 9.1 Tableau de Bord N8N

N8N fournit métriques natives:
- Nombre d'exécutions
- Taux de succès/échec
- Temps d'exécution moyen
- Consommation ressources

### 9.2 Métriques Personnalisées

Ajouter node **Code** final pour logger:

```javascript
const execution_metrics = {
  workflow_id: $workflow.id,
  execution_id: $execution.id,
  duration_seconds: ($execution.data.finishedAt - $execution.data.startedAt) / 1000,
  tokens_estimated: 27000, // Mettre calcul réel
  cost_estimated: 0.45,
  success: true
};

// Logger dans système externe (optionnel)
console.log('METRICS:', JSON.stringify(execution_metrics));

return execution_metrics;
```

### 9.3 Alertes sur Erreurs

Configurer **Workflow Settings** → **Error Workflow**:
- Déclenché automatiquement si erreur
- Peut envoyer email/Slack/webhook
- Utile pour monitoring production

---

## ✅ Checklist de Vérification

### Avant Production

- [ ] Workflow importé dans N8N
- [ ] Credential "Header Albert API" configurée
- [ ] Credential "Grist API Header" configurée
- [ ] Variables workflow définies (GRIST_API_KEY, etc.)
- [ ] Tous les nodes Albert API connectés aux credentials
- [ ] Node HTTP Request Grist configuré
- [ ] Workflow activé (toggle vert)
- [ ] Webhook URL récupérée
- [ ] Test simple réussi (application 1 table)
- [ ] Test complet réussi (patrimoine 8 tables)
- [ ] Exécutions visibles dans Executions panel
- [ ] Logs vérifiés (pas d'erreurs critiques)
- [ ] Document Grist créé et accessible
- [ ] Widget App Nest fonctionne dans Grist

### Performance

- [ ] Temps exécution < 5 min
- [ ] Taux succès > 95%
- [ ] Composants générés conformes App Nest
- [ ] Code validé par Agent 11
- [ ] Application finale fonctionnelle

---

## 🆘 Support et Dépannage

### Documentation

- **Configuration Agents:** `N8N_WORKFLOW_CONFIGURATION.md`
- **Déploiement Complet:** `GUIDE_DEPLOIEMENT_COMPLET.md`
- **Contraintes App Nest:** `WORKFLOW_APPNEST_CONSTRAINTS_VALIDATION.md`

### Erreurs Communes

| Erreur | Cause | Solution |
|--------|-------|----------|
| Authentication failed | API key invalide | Vérifier credentials |
| Variable not found | Variables non définies | Workflow Settings → Variables |
| JSON parse error | Agent retourne texte | Améliorer prompt agent |
| Timeout | Agent trop lent | Augmenter timeout (Settings) |
| Code non-conforme | Agent 10 génère mal | Enrichir prompt avec exemples |

### Tester Albert API Manuellement

```bash
# Test basique
curl -X POST https://your-albert-instance.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "albert-code",
    "messages": [
      {
        "role": "system",
        "content": "Tu es un assistant IA."
      },
      {
        "role": "user",
        "content": "Réponds UNIQUEMENT avec ce JSON: {\"test\": true}"
      }
    ],
    "temperature": 0.3,
    "max_tokens": 1000
  }'
```

**Résultat attendu:**
```json
{
  "id": "...",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "{\"test\": true}"
      }
    }
  ]
}
```

---

## 🎉 Succès !

Si tous les tests passent, vous avez un workflow N8N fonctionnel capable de générer automatiquement des applications App Nest !

**Capacités:**
- ✅ Générer applications de gestion patrimoniale
- ✅ Créer documents Grist automatiquement
- ✅ Code React conforme App Nest
- ✅ Standards RGPD/RGAA/DSFR respectés
- ✅ Coût optimisé (~$0.45/app)
- ✅ Temps < 5 minutes

**Prochaines étapes:**
1. Générer 5-10 applications de test
2. Valider qualité du code généré
3. Ajuster prompts si nécessaire
4. Étendre workflow (21 agents complets)
5. Mettre en production

---

**Document créé le:** 2025-01-06
**Révision:** 1.0
**Auteur:** Claude Code - Import Guide
**Workflow Version:** Simplifié (7 agents)
**Status:** ✅ Prêt pour import
