/**
 * Grist Schema Manager
 *
 * Manages database schema creation in 2 steps:
 * 1. Create tables WITH columns (non-Ref columns)
 * 2. Add Ref columns (relations between tables)
 */

import GristWidgetBase from './GristWidgetBase';
import Logger from './Logger';
import type { ColumnDefinition } from './types';

class GristSchemaManager extends GristWidgetBase {
  /**
   * Create all tables with complete schema and relations
   */
  async createCompleteSchema(): Promise<void> {
    Logger.log('🗄️', 'Creating complete schema with relations');

    try {
      // Step 1: Create all tables WITH their columns (non-Ref)
      await this.createAllTablesWithColumns();

      // Step 2: Add Ref columns (relations)
      await this.addAllRelations();

      Logger.success('Complete schema created successfully');
    } catch (error) {
      Logger.error('Error creating schema:', error);
      throw error;
    }
  }

  /**
   * Step 1: Create all tables WITH their columns (non-Ref columns)
   */
  private async createAllTablesWithColumns(): Promise<void> {
    Logger.log('📋', 'Step 1: Creating tables with columns');

    // Config table
    if (!(await this.tableExists('Config'))) {
      await this.createTable('Config', this.getConfigColumns());
      Logger.success('Table created: Config');
    } else {
      Logger.info('Table already exists: Config');
    }

    // Pages table
    if (!(await this.tableExists('Pages'))) {
      await this.createTable('Pages', this.getPagesColumns());
      Logger.success('Table created: Pages');
    } else {
      Logger.info('Table already exists: Pages');
    }

    // Templates table
    if (!(await this.tableExists('Templates'))) {
      await this.createTable('Templates', this.getTemplatesColumns());
      Logger.success('Table created: Templates');
    } else {
      Logger.info('Table already exists: Templates');
    }

    // Clients table
    if (!(await this.tableExists('Clients'))) {
      await this.createTable('Clients', this.getClientsColumns());
      Logger.success('Table created: Clients');
    } else {
      Logger.info('Table already exists: Clients');
    }

    // Produits table
    if (!(await this.tableExists('Produits'))) {
      await this.createTable('Produits', this.getProduitsColumns());
      Logger.success('Table created: Produits');
    } else {
      Logger.info('Table already exists: Produits');
    }

    // PageTemplates table (without Ref columns yet)
    if (!(await this.tableExists('PageTemplates'))) {
      await this.createTable('PageTemplates', this.getPageTemplatesColumns());
      Logger.success('Table created: PageTemplates');
    } else {
      Logger.info('Table already exists: PageTemplates');
    }

    // Ventes table (without Ref columns yet)
    if (!(await this.tableExists('Ventes'))) {
      await this.createTable('Ventes', this.getVentesColumns());
      Logger.success('Table created: Ventes');
    } else {
      Logger.info('Table already exists: Ventes');
    }
  }

  /**
   * Step 2: Add Ref columns (relations between tables)
   */
  private async addAllRelations(): Promise<void> {
    Logger.log('🔗', 'Step 2: Adding relations (Ref columns)');

    await this.addPageTemplatesRelations();
    await this.addVentesRelations();
  }

  // ===== COLUMN DEFINITIONS =====

  private getConfigColumns(): ColumnDefinition[] {
    return [
      { id: 'config_key', type: 'Text' },
      { id: 'config_value', type: 'Text' },
      {
        id: 'config_type',
        type: 'Choice',
        widgetOptions: JSON.stringify({
          choices: ['text', 'number', 'boolean', 'json'],
        }),
      },
      { id: 'description', type: 'Text' },
      { id: 'updated_at', type: 'DateTime' },
    ];
  }

  private getPagesColumns(): ColumnDefinition[] {
    return [
      { id: 'page_id', type: 'Text' },
      { id: 'page_name', type: 'Text' },
      { id: 'icon', type: 'Text' },
      { id: 'order', type: 'Int' },
      { id: 'component_code', type: 'Text' },
      { id: 'created_at', type: 'DateTime' },
    ];
  }

  private getTemplatesColumns(): ColumnDefinition[] {
    return [
      { id: 'template_id', type: 'Text' },
      { id: 'template_name', type: 'Text' },
      {
        id: 'category',
        type: 'Choice',
        widgetOptions: JSON.stringify({
          choices: ['display', 'data', 'charts', 'forms', 'ui'],
        }),
      },
      { id: 'description', type: 'Text' },
      { id: 'component_code', type: 'Text' },
      { id: 'props_schema', type: 'Text' },
      { id: 'created_at', type: 'DateTime' },
    ];
  }

  private getClientsColumns(): ColumnDefinition[] {
    return [
      { id: 'nom', type: 'Text' },
      { id: 'email', type: 'Text' },
      { id: 'entreprise', type: 'Text' },
      {
        id: 'statut',
        type: 'Choice',
        widgetOptions: JSON.stringify({
          choices: ['Actif', 'Inactif'],
        }),
      },
      { id: 'created_at', type: 'DateTime' },
      { id: 'updated_at', type: 'DateTime' },
    ];
  }

  private getProduitsColumns(): ColumnDefinition[] {
    return [
      { id: 'nom', type: 'Text' },
      { id: 'prix', type: 'Numeric' },
      { id: 'stock', type: 'Int' },
      {
        id: 'categorie',
        type: 'Choice',
        widgetOptions: JSON.stringify({
          choices: ['Informatique', 'Accessoires', 'Audio', 'Autre'],
        }),
      },
      { id: 'description', type: 'Text' },
      { id: 'created_at', type: 'DateTime' },
    ];
  }

  private getPageTemplatesColumns(): ColumnDefinition[] {
    // Only non-Ref columns here
    return [
      { id: 'order', type: 'Int' },
      { id: 'config', type: 'Text' }, // JSON config
    ];
  }

  private getVentesColumns(): ColumnDefinition[] {
    // Only non-Ref columns here
    return [
      { id: 'date', type: 'Date' },
      { id: 'quantite', type: 'Int' },
      { id: 'prix_unitaire', type: 'Numeric' },
      { id: 'montant_total', type: 'Numeric' },
    ];
  }

  // ===== REF RELATIONS =====

  private async addPageTemplatesRelations(): Promise<void> {
    const relations: ColumnDefinition[] = [
      { id: 'page_id', type: 'Ref:Pages', visibleCol: 'page_name' },
      { id: 'template_id', type: 'Ref:Templates', visibleCol: 'template_name' },
    ];

    for (const col of relations) {
      await this.addColumn('PageTemplates', col);
    }

    Logger.success('Relations added: PageTemplates');
  }

  private async addVentesRelations(): Promise<void> {
    const relations: ColumnDefinition[] = [
      { id: 'client_id', type: 'Ref:Clients', visibleCol: 'nom' },
      { id: 'produit_id', type: 'Ref:Produits', visibleCol: 'nom' },
    ];

    for (const col of relations) {
      await this.addColumn('Ventes', col);
    }

    Logger.success('Relations added: Ventes');
  }
}

export default GristSchemaManager;
