# Schéma Métier - Gestion Patrimoniale Immobilière pour Collectivités

## 🏛️ Contexte

Application de gestion du patrimoine immobilier pour administrations et collectivités locales françaises, conforme:
- 🇫🇷 **Réglementation française** (Code général de la propriété des personnes publiques)
- ✅ **RGPD** (protection des données)
- ✅ **RGAA AAA** (accessibilité)
- ✅ **DSFR** (design système de l'État)

---

## 📊 Entités Métier

### 1. Sites (ressource)

**Description:** Emplacements géographiques regroupant des bâtiments

**Attributs:**
- `site_id` (Text, unique) - Identifiant unique (ex: "SITE-MAIRIE-001")
- `nom` (Text, required) - Nom du site
- `adresse` (Text, required) - Adresse complète
- `code_postal` (Text, required) - Code postal
- `commune` (Text, required) - Commune
- `type_site` (Choice, required) - Type: "Bâtiment administratif", "École", "Crèche", "Gymnase", "Piscine", "Bibliothèque", "Autre"
- `surface_totale_m2` (Numeric) - Surface totale du site en m²
- `responsable` (Text) - Responsable du site
- `telephone` (Text) - Téléphone contact
- `email` (Text) - Email contact
- `actif` (Bool) - Site actif ou désaffecté

**Relations:**
- 1 Site → N Bâtiments

---

### 2. Bâtiments (ressource)

**Description:** Bâtiments constituant le patrimoine

**Attributs:**
- `batiment_id` (Text, unique) - Identifiant unique (ex: "BAT-MAIRIE-A")
- `site_id` (Ref:Sites) - Site parent
- `nom` (Text, required) - Nom/Désignation du bâtiment
- `type_batiment` (Choice, required) - Type: "Bureau", "Technique", "Stockage", "Accueil public", "Logement de fonction", "Autre"
- `annee_construction` (Int) - Année de construction
- `surface_utile_m2` (Numeric, required) - Surface utile en m²
- `nb_niveaux` (Int) - Nombre de niveaux
- `classement_patrimoine` (Choice) - Classement: "Monument historique", "Inscription", "Non classé"
- `etat_general` (Choice, required) - État: "Excellent", "Bon", "Moyen", "Dégradé", "Mauvais"
- `valeur_assurance_euros` (Numeric) - Valeur d'assurance
- `DPE_note` (Choice) - Diagnostic Performance Énergétique: "A", "B", "C", "D", "E", "F", "G", "Non réalisé"
- `accessibilite_PMR` (Bool) - Accessible PMR (Personnes à Mobilité Réduite)
- `amiante` (Bool) - Présence d'amiante
- `plomb` (Bool) - Présence de plomb
- `date_dernier_diagnostic` (Date) - Date dernier diagnostic technique

**Relations:**
- 1 Bâtiment → N Locaux
- 1 Bâtiment → N Interventions

**Contraintes métier:**
- `annee_construction` >= 1800 et <= année courante
- `surface_utile_m2` > 0
- `valeur_assurance_euros` >= 0
- Si `amiante` = true OU `plomb` = true → `date_dernier_diagnostic` obligatoire

---

### 3. Locaux (ressource)

**Description:** Pièces/espaces au sein des bâtiments

**Attributs:**
- `local_id` (Text, unique) - Identifiant unique (ex: "LOC-MAIRIE-A-101")
- `batiment_id` (Ref:Bâtiments) - Bâtiment parent
- `designation` (Text, required) - Désignation du local
- `etage` (Int) - Étage (0 = RDC, -1 = sous-sol)
- `surface_m2` (Numeric, required) - Surface en m²
- `type_local` (Choice, required) - Type: "Bureau", "Salle de réunion", "Accueil", "Archives", "Technique", "Sanitaires", "Circulation", "Autre"
- `occupation` (Choice, required) - Occupation: "Occupé", "Vacant", "En travaux", "Hors service"
- `service_affectation` (Text) - Service affecté
- `nb_postes_travail` (Int) - Nombre de postes de travail (si bureau)

**Relations:**
- 1 Local → N Équipements

**Contraintes métier:**
- `surface_m2` > 0
- `nb_postes_travail` >= 0

---

### 4. Équipements (ressource)

**Description:** Équipements techniques dans les bâtiments/locaux

**Attributs:**
- `equipement_id` (Text, unique) - Identifiant unique
- `local_id` (Ref:Locaux, nullable) - Local (si équipement localisé)
- `batiment_id` (Ref:Bâtiments) - Bâtiment
- `designation` (Text, required) - Désignation de l'équipement
- `categorie` (Choice, required) - Catégorie: "Chauffage", "Climatisation", "Ventilation", "Électricité", "Plomberie", "Ascenseur", "Sécurité incendie", "Contrôle d'accès", "Informatique", "Autre"
- `marque` (Text) - Marque
- `modele` (Text) - Modèle
- `numero_serie` (Text) - Numéro de série
- `date_installation` (Date) - Date d'installation
- `date_fin_garantie` (Date) - Date fin de garantie
- `periodicite_maintenance_mois` (Int) - Périodicité maintenance en mois
- `date_derniere_maintenance` (Date) - Date dernière maintenance
- `date_prochaine_maintenance` (Date, calculated) - Calculée: `date_derniere_maintenance` + `periodicite_maintenance_mois`
- `etat` (Choice, required) - État: "En service", "En panne", "En maintenance", "Hors service", "Remplacé"
- `cout_achat_euros` (Numeric) - Coût d'achat

**Relations:**
- 1 Équipement → N Interventions

**Contraintes métier:**
- Si `date_installation` renseignée → `date_fin_garantie` >= `date_installation`
- `date_prochaine_maintenance` = `date_derniere_maintenance` + INTERVAL `periodicite_maintenance_mois` MONTHS
- Alerte si `date_prochaine_maintenance` < DATE_COURANTE + 30 jours

---

### 5. Interventions (dossier avec workflow)

**Description:** Interventions (maintenance, travaux, réparations)

**Workflow:** `Planifiée` → `En cours` → `Terminée` / `Annulée`

**Transitions autorisées:**
- Planifiée → En cours
- En cours → Terminée
- Planifiée → Annulée
- ❌ Terminée → En cours (interdit)
- ❌ Annulée → En cours (interdit)

**Attributs:**
- `intervention_id` (Text, unique) - Identifiant unique
- `batiment_id` (Ref:Bâtiments, required) - Bâtiment concerné
- `equipement_id` (Ref:Équipements, nullable) - Équipement concerné (si applicable)
- `type_intervention` (Choice, required) - Type: "Maintenance préventive", "Maintenance corrective", "Réparation", "Travaux", "Diagnostic", "Contrôle réglementaire"
- `priorite` (Choice, required) - Priorité: "Urgente", "Haute", "Normale", "Basse"
- `description` (Text, required) - Description de l'intervention
- `statut` (Choice, required) - Statut workflow: "Planifiée", "En cours", "Terminée", "Annulée"
- `date_creation` (Date, default: NOW()) - Date de création
- `date_prevue` (Date, required) - Date prévue d'intervention
- `date_debut_reelle` (Date) - Date début réelle
- `date_fin_reelle` (Date) - Date fin réelle
- `prestataire_id` (Ref:Prestataires, nullable) - Prestataire
- `agent_responsable` (Text) - Agent responsable du suivi
- `cout_prevu_euros` (Numeric) - Coût prévu
- `cout_reel_euros` (Numeric) - Coût réel
- `observations` (Text) - Observations / Compte-rendu

**Relations:**
- 1 Intervention → N Documents (pièces jointes)

**Contraintes métier:**
- `date_prevue` >= `date_creation`
- Si `statut` = "En cours" → `date_debut_reelle` obligatoire
- Si `statut` = "Terminée" → `date_fin_reelle` obligatoire ET `date_fin_reelle` >= `date_debut_reelle`
- Si `statut` = "Terminée" → `cout_reel_euros` obligatoire
- Si `priorite` = "Urgente" → intervention dans les 24h

---

### 6. Prestataires (agent/ressource)

**Description:** Prestataires externes (entreprises, artisans)

**Attributs:**
- `prestataire_id` (Text, unique) - Identifiant unique
- `raison_sociale` (Text, required) - Raison sociale
- `siret` (Text, unique, required) - SIRET (14 chiffres)
- `categorie` (Choice, required) - Catégorie: "Électricité", "Plomberie", "Chauffage", "Climatisation", "Bâtiment", "Nettoyage", "Sécurité", "Espaces verts", "Autre"
- `adresse` (Text) - Adresse
- `code_postal` (Text) - Code postal
- `ville` (Text) - Ville
- `telephone` (Text, required) - Téléphone
- `email` (Text) - Email
- `contact_principal` (Text) - Nom contact principal
- `actif` (Bool) - Prestataire actif
- `certifications` (Text) - Certifications (ex: Qualibat, RGE)
- `date_dernier_contrat` (Date) - Date du dernier contrat
- `evaluation` (Choice) - Évaluation: "Excellent", "Bon", "Moyen", "Insuffisant"

**Contraintes métier:**
- `siret` doit être 14 chiffres exactement
- Si `actif` = false → ne peut pas être assigné à nouvelles interventions

---

### 7. Documents (ressource)

**Description:** Documents attachés (plans, diagnostics, factures, photos)

**Attributs:**
- `document_id` (Text, unique) - Identifiant unique
- `intervention_id` (Ref:Interventions, nullable) - Intervention liée
- `batiment_id` (Ref:Bâtiments, nullable) - Bâtiment lié
- `type_document` (Choice, required) - Type: "Plan", "Diagnostic technique", "Facture", "Devis", "Photo", "Rapport", "Contrat", "Autorisation administrative", "Autre"
- `titre` (Text, required) - Titre du document
- `description` (Text) - Description
- `date_document` (Date, required) - Date du document
- `date_upload` (Date, default: NOW()) - Date d'upload
- `url_fichier` (Text) - URL du fichier (si stocké externement)
- `format` (Text) - Format: "PDF", "JPG", "PNG", "XLSX", "DOCX", etc.
- `taille_ko` (Int) - Taille en Ko
- `uploader_par` (Text) - Nom de l'agent ayant uploadé

**Contraintes métier:**
- Au moins un des champs `intervention_id` OU `batiment_id` doit être renseigné
- `date_upload` >= `date_document`

---

### 8. Budget_Patrimoine (dossier)

**Description:** Budget annuel patrimoine immobilier

**Attributs:**
- `budget_id` (Text, unique) - Identifiant unique
- `annee` (Int, unique, required) - Année budgétaire
- `budget_maintenance_euros` (Numeric, required) - Budget maintenance
- `budget_travaux_euros` (Numeric, required) - Budget travaux
- `budget_energie_euros` (Numeric, required) - Budget énergie
- `budget_assurances_euros` (Numeric, required) - Budget assurances
- `budget_total_euros` (Numeric, calculated) - Budget total = somme des 4 budgets
- `depense_maintenance_euros` (Numeric, default: 0) - Dépenses maintenance cumulées
- `depense_travaux_euros` (Numeric, default: 0) - Dépenses travaux cumulées
- `depense_energie_euros` (Numeric, default: 0) - Dépenses énergie cumulées
- `depense_assurances_euros` (Numeric, default: 0) - Dépenses assurances cumulées
- `depense_totale_euros` (Numeric, calculated) - Dépense totale = somme des 4 dépenses
- `taux_execution` (Numeric, calculated) - % = (`depense_totale_euros` / `budget_total_euros`) * 100

**Contraintes métier:**
- `budget_total_euros` = `budget_maintenance_euros` + `budget_travaux_euros` + `budget_energie_euros` + `budget_assurances_euros`
- `depense_totale_euros` = `depense_maintenance_euros` + `depense_travaux_euros` + `depense_energie_euros` + `depense_assurances_euros`
- Tous les budgets >= 0
- Alerte si `taux_execution` > 90%

---

## 🔗 Schéma de Relations

```
Sites (1) ──────┐
                │
                ▼ (N)
            Bâtiments (1) ──────┐
                │               │
                ▼ (N)           ▼ (N)
             Locaux (1)     Interventions (N) ──┐
                │               │               │
                ▼ (N)           ▼ (1)           │
            Équipements     Prestataires        │
                │                               │
                └───────────┐                   │
                            ▼ (N)               ▼ (N)
                        Interventions ──────▶ Documents

Budget_Patrimoine (standalone, suivi annuel)
```

---

## 📋 Use Cases Principaux

### UC001 - Consulter Patrimoine
**Acteur:** Gestionnaire patrimoine
**Fréquence:** Quotidienne
**Description:** Visualiser l'état du patrimoine (sites, bâtiments, état général)
**Données:** Sites, Bâtiments, Équipements

### UC002 - Planifier Intervention
**Acteur:** Gestionnaire patrimoine
**Fréquence:** Hebdomadaire
**Description:** Planifier une intervention (maintenance, travaux)
**Données:** Interventions, Bâtiments, Équipements, Prestataires

### UC003 - Suivre Interventions
**Acteur:** Gestionnaire patrimoine
**Fréquence:** Quotidienne
**Description:** Suivre l'avancement des interventions en cours
**Données:** Interventions (statut workflow)

### UC004 - Gérer Équipements
**Acteur:** Technicien
**Fréquence:** Hebdomadaire
**Description:** Gérer les équipements (maintenance préventive, alertes)
**Données:** Équipements, dates maintenance

### UC005 - Consulter Budget
**Acteur:** Directeur technique
**Fréquence:** Mensuelle
**Description:** Suivre l'exécution budgétaire
**Données:** Budget_Patrimoine, Interventions (coûts)

### UC006 - Gestion Documentaire
**Acteur:** Gestionnaire patrimoine
**Fréquence:** Variable
**Description:** Gérer les documents (plans, diagnostics, factures)
**Données:** Documents, Bâtiments, Interventions

---

## 🎨 Patterns UI Recommandés

### 1. Dashboard Principal (pattern: dashboard)
**Composants:**
- Metrics cards: Nombre de sites, bâtiments, interventions en cours
- Alertes: Maintenance urgente, budget > 90%, DPE dégradés
- Graphiques: Répartition bâtiments par état, interventions par type

### 2. Gestion Sites/Bâtiments (pattern: crud_list)
**Composants:**
- Liste avec recherche/filtres
- Formulaires CRUD
- Vues hiérarchiques (Site → Bâtiments → Locaux)

### 3. Gestion Interventions (pattern: workflow_form)
**Composants:**
- Kanban par statut (Planifiée | En cours | Terminée)
- Formulaires avec workflow
- Timeline des interventions

### 4. Gestion Équipements (pattern: crud_list + alerts)
**Composants:**
- Liste avec alertes maintenance
- Filtres par catégorie
- Calendrier maintenance

### 5. Suivi Budget (pattern: dashboard + reporting)
**Composants:**
- Graphiques budget vs réalisé
- Jauge taux d'exécution
- Tableau détaillé par poste

### 6. Documenthèque (pattern: file_management)
**Composants:**
- Liste documents avec filtres
- Upload/téléchargement
- Prévisualisation

---

## 📊 Volumétrie Estimée

| Entité | Records estimés |
|--------|-----------------|
| Sites | 10-50 |
| Bâtiments | 50-200 |
| Locaux | 200-1000 |
| Équipements | 500-2000 |
| Interventions | 1000-5000 |
| Prestataires | 20-100 |
| Documents | 500-5000 |
| Budget_Patrimoine | 5-10 (années) |

**Total:** ~2,300 - 13,360 records → ✅ Compatible App Nest (limite 50,000 par table)

---

## 🔒 Contraintes Réglementaires

### RGPD
- Données personnelles limitées (agents, contacts prestataires)
- Durée conservation: documents 10 ans, interventions 5 ans
- Droit d'accès et rectification

### Accessibilité (RGAA AAA)
- Navigation clavier complète
- Lecteurs d'écran compatibles
- Contrastes AAA (ratio 7:1)
- Formulaires labellisés

### Code général de la propriété des personnes publiques
- Inventaire obligatoire du patrimoine
- Traçabilité des interventions
- Conservation documentation technique

---

## 🎯 Indicateurs Clés (KPI)

1. **Taux d'occupation** = (Locaux occupés / Total locaux) × 100
2. **Âge moyen du patrimoine** = Moyenne(Année courante - annee_construction)
3. **Taux interventions préventives** = (Maintenance préventive / Total interventions) × 100
4. **Taux exécution budgétaire** = (Dépenses / Budget) × 100
5. **Nombre bâtiments DPE F/G** = COUNT(Bâtiments WHERE DPE IN ('F', 'G'))
6. **Délai moyen intervention** = Moyenne(date_fin_reelle - date_debut_reelle)

---

**Document créé le:** 2025-01-06
**Révision:** 1.0
**Auteur:** Claude Code - Workflow N8N Generator
**Status:** ✅ Schéma métier complet validé
