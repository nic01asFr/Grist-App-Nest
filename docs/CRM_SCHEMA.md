# Schéma Relationnel - Application CRM

## Vue d'ensemble

Application de gestion de relation client (CRM) avec :
- Gestion des contacts et entreprises
- Suivi des opportunités commerciales
- Gestion des activités (appels, emails, réunions)
- Historique des interactions

## Schéma de données

### Tables principales

#### 1. **Companies** (Entreprises)
```
id (Auto)
name (Text) *
industry (Choice: Technology, Finance, Healthcare, Retail, Other)
size (Choice: 1-10, 11-50, 51-200, 201-1000, 1000+)
website (Text)
phone (Text)
address (Text)
city (Text)
country (Text)
created_at (DateTime)
updated_at (DateTime)
```

#### 2. **Contacts** (Contacts)
```
id (Auto)
company_id (Ref:Companies → name) *
first_name (Text) *
last_name (Text) *
email (Text) *
phone (Text)
position (Text)
status (Choice: Active, Inactive, Lead)
created_at (DateTime)
updated_at (DateTime)
```

#### 3. **Opportunities** (Opportunités)
```
id (Auto)
company_id (Ref:Companies → name) *
contact_id (Ref:Contacts → full_name)
title (Text) *
amount (Numeric)
stage (Choice: Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost)
probability (Int) - 0-100%
expected_close_date (Date)
actual_close_date (Date)
description (Text)
created_at (DateTime)
updated_at (DateTime)
```

#### 4. **Activities** (Activités)
```
id (Auto)
company_id (Ref:Companies → name)
contact_id (Ref:Contacts → full_name)
opportunity_id (Ref:Opportunities → title)
type (Choice: Call, Email, Meeting, Task, Note)
subject (Text) *
description (Text)
scheduled_date (DateTime)
completed (Toggle)
created_at (DateTime)
```

#### 5. **Templates** (Composants)
```
id (Auto)
template_id (Text) - unique identifier
template_name (Text) *
category (Choice: pages, widgets, layouts, charts, forms)
description (Text)
component_code (Text) - JSX code
props_schema (Text) - JSON schema
is_active (Toggle)
created_at (DateTime)
updated_at (DateTime)
```

#### 6. **AppConfig** (Configuration)
```
id (Auto)
config_key (Text) *
config_value (Text)
config_type (Choice: string, number, boolean, json)
description (Text)
```

## Relations

### Hiérarchie
```
Companies (1) ──┬──> Contacts (N)
                └──> Opportunities (N)

Contacts (1) ──> Opportunities (N)

Companies (1) ──> Activities (N)
Contacts (1) ──> Activities (N)
Opportunities (1) ──> Activities (N)
```

### Contraintes
- Un Contact appartient à une Company (obligatoire)
- Une Opportunity appartient à une Company (obligatoire)
- Une Opportunity peut avoir un Contact (optionnel)
- Une Activity peut être liée à Company, Contact et/ou Opportunity

## Composants à stocker dans Templates

### Pages principales
1. **page-dashboard** - Tableau de bord avec métriques
2. **page-companies** - Liste et gestion des entreprises
3. **page-contacts** - Liste et gestion des contacts
4. **page-opportunities** - Pipeline des opportunités
5. **page-activities** - Calendrier et liste des activités

### Widgets réutilisables
1. **widget-stats-card** - Carte de statistique
2. **widget-data-table** - Table de données sortable
3. **widget-pipeline** - Pipeline Kanban
4. **widget-activity-timeline** - Timeline des activités
5. **widget-chart-bar** - Graphique en barres
6. **widget-chart-pie** - Graphique circulaire
7. **widget-form-company** - Formulaire entreprise
8. **widget-form-contact** - Formulaire contact
9. **widget-form-opportunity** - Formulaire opportunité
10. **widget-form-activity** - Formulaire activité

## Données de démo

### Companies (5)
- Acme Corp (Technology, 51-200)
- Global Industries (Finance, 1000+)
- Tech Solutions (Technology, 11-50)
- Health Plus (Healthcare, 201-1000)
- Retail Group (Retail, 1000+)

### Contacts (10)
- 2 contacts par entreprise

### Opportunities (8)
- Mix de stages différents
- Montants variés

### Activities (15)
- Différents types
- Liés aux Companies/Contacts/Opportunities
