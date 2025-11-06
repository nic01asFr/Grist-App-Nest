# Tests du Workflow App Nest Creator

## URL Webhook

```
https://n8n.colaig.fr/webhook/appnest-analyse
```

## Exemples de Requêtes

### Exemple 1 : Gestion de Stock

```bash
curl -X POST https://n8n.colaig.fr/webhook/appnest-analyse \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "Je veux une application de gestion de stock avec produits, fournisseurs et commandes"
  }'
```

**Résultat attendu** :
- 3 tables : Produits, Fournisseurs, Commandes
- 4 composants : Dashboard, Gestion Produits, Gestion Fournisseurs, Gestion Commandes

---

### Exemple 2 : CRM Simple

```bash
curl -X POST https://n8n.colaig.fr/webhook/appnest-analyse \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "Un CRM simple pour gérer mes clients, contacts et opportunités commerciales"
  }'
```

**Résultat attendu** :
- 3 tables : Clients, Contacts, Opportunités
- 4 composants : Dashboard, Gestion Clients, Gestion Contacts, Pipeline Opportunités

---

### Exemple 3 : Gestion RH

```bash
curl -X POST https://n8n.colaig.fr/webhook/appnest-analyse \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "Application RH pour gérer employés, contrats, congés et évaluations annuelles"
  }'
```

**Résultat attendu** :
- 4 tables : Employés, Contrats, Congés, Évaluations
- 5 composants : Dashboard RH, Gestion Employés, Gestion Congés, Suivi Évaluations, Contrats

---

### Exemple 4 : Gestion Patrimoniale Immobilière

```bash
curl -X POST https://n8n.colaig.fr/webhook/appnest-analyse \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "Application de gestion patrimoniale immobilière pour gérer sites, bâtiments et interventions de maintenance"
  }'
```

**Résultat attendu** :
- 5-8 tables : Sites, Bâtiments, Locaux, Équipements, Interventions, Prestataires, Documents, Budget
- 6 composants : Dashboard, Gestion Sites, Gestion Bâtiments, Gestion Interventions, Suivi Budget, Documents

---

### Exemple 5 : Gestion de Projets

```bash
curl -X POST https://n8n.colaig.fr/webhook/appnest-analyse \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "Je veux suivre mes projets avec tâches, équipes, jalons et livrables"
  }'
```

**Résultat attendu** :
- 4 tables : Projets, Tâches, Équipes, Jalons
- 5 composants : Dashboard Projets, Gestion Tâches, Suivi Équipes, Timeline, Livrables

---

## Test avec Python

```python
import requests
import json

url = "https://n8n.colaig.fr/webhook/appnest-analyse"

payload = {
    "user_input": "Je veux une application de gestion de stock avec produits, fournisseurs et commandes"
}

headers = {
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)

print("Status Code:", response.status_code)
print("\nResponse:")
print(json.dumps(response.json(), indent=2, ensure_ascii=False))
```

---

## Test avec JavaScript (Node.js)

```javascript
const axios = require('axios');

const url = 'https://n8n.colaig.fr/webhook/appnest-analyse';

const payload = {
  user_input: 'Je veux une application de gestion de stock avec produits, fournisseurs et commandes'
};

axios.post(url, payload, {
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Status Code:', response.status);
  console.log('\nResponse:');
  console.log(JSON.stringify(response.data, null, 2));
})
.catch(error => {
  console.error('Error:', error.message);
  if (error.response) {
    console.error('Response:', error.response.data);
  }
});
```

---

## Test avec Postman

1. **Méthode** : POST
2. **URL** : `https://n8n.colaig.fr/webhook/appnest-analyse`
3. **Headers** :
   - `Content-Type`: `application/json`
4. **Body** (raw, JSON) :
   ```json
   {
     "user_input": "Je veux une application de gestion de stock avec produits, fournisseurs et commandes"
   }
   ```

---

## Format de Réponse Attendu (Workflow 1)

```json
{
  "conversation_id": "conv_20250106123456",
  "business_domain": "gestion_stocks",
  "schema": {
    "entities": [
      {
        "entity_name": "Produits",
        "entity_type": "ressource",
        "table_name": "Produits",
        "description": "Articles en stock",
        "estimated_records": 500,
        "columns": [
          {
            "column_name": "produit_id",
            "column_type": "Text",
            "is_primary": true,
            "is_required": true,
            "description": "Identifiant unique"
          },
          {
            "column_name": "nom",
            "column_type": "Text",
            "is_required": true,
            "description": "Nom du produit"
          },
          {
            "column_name": "reference",
            "column_type": "Text",
            "is_required": true,
            "description": "Référence produit"
          },
          {
            "column_name": "prix_unitaire",
            "column_type": "Numeric",
            "is_required": true,
            "description": "Prix unitaire HT"
          },
          {
            "column_name": "stock_actuel",
            "column_type": "Numeric",
            "is_required": true,
            "description": "Quantité en stock"
          },
          {
            "column_name": "stock_minimum",
            "column_type": "Numeric",
            "is_required": false,
            "description": "Seuil d'alerte stock bas"
          },
          {
            "column_name": "fournisseur_id",
            "column_type": "Reference:Fournisseurs",
            "is_required": false,
            "description": "Fournisseur principal"
          },
          {
            "column_name": "actif",
            "column_type": "Choice",
            "is_required": true,
            "description": "Produit actif"
          }
        ],
        "relationships": [
          {
            "type": "N-1",
            "target": "Fournisseurs",
            "via": "fournisseur_id"
          }
        ]
      },
      {
        "entity_name": "Fournisseurs",
        "entity_type": "ressource",
        "table_name": "Fournisseurs",
        "columns": [...]
      },
      {
        "entity_name": "Commandes",
        "entity_type": "dossier",
        "table_name": "Commandes",
        "columns": [...]
      }
    ],
    "total_tables": 3,
    "total_columns": 27,
    "constraints_check": {
      "max_columns_per_table": "OK (<50)",
      "max_tables": "OK (<10)"
    }
  },
  "use_cases": [
    {
      "uc_id": "UC001",
      "actor": "gestionnaire_stock",
      "action": "consulter_produits",
      "description": "Visualiser liste produits avec stock actuel",
      "frequency": "quotidienne",
      "priority": "haute",
      "data_required": ["Produits"]
    },
    {
      "uc_id": "UC002",
      "actor": "gestionnaire_stock",
      "action": "gerer_fournisseurs",
      "description": "CRUD sur fournisseurs",
      "frequency": "hebdomadaire",
      "priority": "moyenne",
      "data_required": ["Fournisseurs"]
    },
    {
      "uc_id": "UC003",
      "actor": "gestionnaire_stock",
      "action": "passer_commande",
      "description": "Créer nouvelle commande fournisseur",
      "frequency": "quotidienne",
      "priority": "haute",
      "data_required": ["Commandes", "Produits", "Fournisseurs"]
    }
  ],
  "components_to_generate": [
    {
      "id": "dashboard",
      "name": "Tableau de bord",
      "priority": 1,
      "type": "dashboard"
    },
    {
      "id": "gestion_produits",
      "name": "Gestion Produits",
      "priority": 2,
      "type": "crud",
      "entity": "Produits"
    },
    {
      "id": "gestion_fournisseurs",
      "name": "Gestion Fournisseurs",
      "priority": 3,
      "type": "crud",
      "entity": "Fournisseurs"
    },
    {
      "id": "gestion_commandes",
      "name": "Gestion Commandes",
      "priority": 4,
      "type": "crud",
      "entity": "Commandes"
    }
  ],
  "summary": {
    "entities": 3,
    "columns": 27,
    "components": 4,
    "use_cases": 3
  }
}
```

---

## Vérifications

### ✅ Workflow 1 fonctionne si :

1. **Status Code** : 200
2. **conversation_id** : Présent (format `conv_YYYYMMDDHHMMSS`)
3. **business_domain** : Identifié correctement (ex: "gestion_stocks")
4. **schema.entities** : Array avec 2-8 entités
5. **schema.total_tables** : Nombre correct
6. **use_cases** : Array avec 2-10 use cases
7. **components_to_generate** : Array avec 2-6 composants

### ❌ Erreurs possibles :

1. **400 Bad Request** : Application non faisable (contraintes App Nest dépassées)
   - > 10 tables
   - Complexité trop élevée
   - Temps réel requis

2. **500 Internal Server Error** : Erreur dans le workflow
   - Vérifier logs N8N
   - Vérifier credentials Albert API
   - Vérifier prompts agents

3. **Timeout** : Workflow trop long
   - Augmenter timeout webhook N8N
   - Vérifier performance API Albert

---

## Workflow Complet (si Workflow 2 appelé manuellement)

Pour tester le workflow complet (génération de tous les composants) :

1. **Récupérer l'output du Workflow 1**
2. **Dans N8N** :
   - Aller dans Workflow 2
   - Cliquer "Execute Workflow" manuellement
   - Coller l'output du Workflow 1 comme input

3. **Attendre 3-4 minutes** (génération + validation de tous composants)

4. **Réponse finale attendue** :

```json
{
  "success": true,
  "conversation_id": "conv_20250106123456",
  "message": "Application gestion_stocks créée avec succès !",
  "application": {
    "templates_table": [
      {
        "template_id": "dashboard",
        "template_name": "Tableau de bord",
        "component_type": "functional",
        "component_code": "const Component = () => { const [metrics, setMetrics] = useState({});\n\n  useEffect(() => {\n    const loadMetrics = async () => {\n      const produits = await gristAPI.getData('Produits');\n      const fournisseurs = await gristAPI.getData('Fournisseurs');\n      const commandes = await gristAPI.getData('Commandes');\n\n      if (Array.isArray(produits) && Array.isArray(fournisseurs) && Array.isArray(commandes)) {\n        setMetrics({\n          produits: produits.length,\n          fournisseurs: fournisseurs.length,\n          commandes: commandes.length,\n          stockBas: produits.filter(p => p.stock_actuel <= p.stock_minimum).length\n        });\n      }\n    };\n    loadMetrics();\n  }, []);\n\n  return (\n    <div style={{padding: '20px', fontFamily: 'Marianne, sans-serif'}}>\n      <h1>Tableau de bord - Gestion Stock</h1>\n      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '20px'}}>\n        <div style={{backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>\n          <h3 style={{margin: 0, color: '#666'}}>Produits</h3>\n          <p style={{fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0', color: '#000091'}}>{metrics.produits || 0}</p>\n        </div>\n        <div style={{backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>\n          <h3 style={{margin: 0, color: '#666'}}>Fournisseurs</h3>\n          <p style={{fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0', color: '#000091'}}>{metrics.fournisseurs || 0}</p>\n        </div>\n        <div style={{backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>\n          <h3 style={{margin: 0, color: '#666'}}>Commandes</h3>\n          <p style={{fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0', color: '#000091'}}>{metrics.commandes || 0}</p>\n        </div>\n        <div style={{backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>\n          <h3 style={{margin: 0, color: '#666'}}>⚠️ Stock Bas</h3>\n          <p style={{fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0', color: '#d32f2f'}}>{metrics.stockBas || 0}</p>\n        </div>\n      </div>\n    </div>\n  );\n};"
      },
      {
        "template_id": "gestion_produits",
        "template_name": "Gestion Produits",
        "component_type": "functional",
        "component_code": "const Component = () => { ... };"
      },
      {
        "template_id": "gestion_fournisseurs",
        "template_name": "Gestion Fournisseurs",
        "component_type": "functional",
        "component_code": "const Component = () => { ... };"
      },
      {
        "template_id": "gestion_commandes",
        "template_name": "Gestion Commandes",
        "component_type": "functional",
        "component_code": "const Component = () => { ... };"
      }
    ],
    "navigation": {
      "default_component": "dashboard",
      "menu_structure": [
        {"id": "dashboard", "label": "Tableau de bord", "icon": "📊", "order": 1},
        {"id": "gestion_produits", "label": "Gestion Produits", "icon": "📦", "order": 2},
        {"id": "gestion_fournisseurs", "label": "Gestion Fournisseurs", "icon": "🏭", "order": 3},
        {"id": "gestion_commandes", "label": "Gestion Commandes", "icon": "🛒", "order": 4}
      ]
    },
    "grist_document_structure": {
      "tables": ["Produits", "Fournisseurs", "Commandes"],
      "widget_configuration": {
        "url": "https://raw.githubusercontent.com/nic01asFr/grist-dynamic-dashboard/main/Grist_App_Nest_v5_2.html",
        "access_level": "full"
      }
    }
  },
  "metadata": {
    "domain": "gestion_stocks",
    "total_components": 4,
    "total_tables": 3,
    "total_columns": 27,
    "generated_at": "2025-01-06T12:34:56.789Z"
  },
  "next_steps": [
    "1. Créer un nouveau document Grist",
    "2. Créer la table 'Templates' avec les colonnes: template_id, template_name, component_type, component_code",
    "3. Importer les 4 composants dans la table Templates",
    "4. Créer les 3 tables métier selon le schéma fourni",
    "5. Ajouter un Custom Widget avec l'URL: https://raw.githubusercontent.com/nic01asFr/grist-dynamic-dashboard/main/Grist_App_Nest_v5_2.html",
    "6. Définir Access Level du widget: full",
    "7. L'application se chargera automatiquement"
  ],
  "widget_url": "https://raw.githubusercontent.com/nic01asFr/grist-dynamic-dashboard/main/Grist_App_Nest_v5_2.html"
}
```

---

## Monitoring

Pour suivre l'exécution dans N8N :

1. **Aller dans "Executions"**
2. **Trouver l'exécution en cours** (par timestamp)
3. **Voir le statut** :
   - ✅ Success : Workflow terminé avec succès
   - ⏳ Running : En cours d'exécution
   - ❌ Error : Erreur (cliquer pour voir détails)
4. **Voir les variables N8N** :
   - Cliquer sur "Variables" dans l'exécution
   - Voir toutes les données intermédiaires

---

## Logs

Les Code Nodes loggent dans la console N8N :

```
✅ Composant dashboard validé et stocké (1/4)
✅ Composant gestion_produits validé et stocké (2/4)
✅ Composant gestion_fournisseurs validé et stocké (3/4)
✅ Composant gestion_commandes validé et stocké (4/4)
✅ Tous les composants traités: 4/4
```

Si erreur :
```
❌ Composant gestion_produits INVALIDE: ['Component naming incorrect']
```

---

## Support

En cas de problème :
1. Vérifier logs N8N
2. Vérifier variables N8N (`schema_full`, `validated_components`)
3. Vérifier credentials "Header Albert API"
4. Consulter `WORKFLOWS_README.md` pour troubleshooting détaillé
