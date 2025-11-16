/**
 * Grist Schema Manager
 *
 * Manages database schema creation in 3 steps:
 * 1. Create empty tables
 * 2. Add columns (Text, Numeric, Int, Date, Choice, etc.)
 * 3. Add Ref columns (relations between tables)
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
      // Step 1: Create all empty tables
      await this.createAllTables();

      // Step 2: Add columns to each table
      await this.addAllColumns();

      // Step 3: Add Ref columns (relations)
      await this.addAllRelations();

      Logger.success('Complete schema created successfully');
    } catch (error) {
      Logger.error('Error creating schema:', error);
      throw error;
    }
  }

  /**
   * Step 1: Create all empty tables (no columns yet)
   */
  private async createAllTables(): Promise<void> {
    Logger.log('📋', 'Step 1: Creating empty tables');

    const tables = [
      'Config', // No dependencies
      'Pages', // No dependencies
      'Templates', // No dependencies
      'Clients', // No dependencies
      'Produits', // No dependencies
      'PageTemplates', // Will depend on Pages & Templates
      'Ventes', // Will depend on Clients & Produits
    ];

    for (const tableName of tables) {
      if (!(await this.tableExists(tableName))) {
        await window.grist.docApi.applyUserActions([['AddTable', tableName, []]]);
        Logger.success(`Table created: ${tableName}`);
      } else {
        Logger.info(`Table already exists: ${tableName}`);
      }
    }
  }

  /**
   * Step 2: Add columns to all tables (non-Ref columns)
   */
  private async addAllColumns(): Promise<void> {
    Logger.log('📝', 'Step 2: Adding columns');

    await this.addConfigColumns();
    await this.addPagesColumns();
    await this.addTemplatesColumns();
    await this.addClientsColumns();
    await this.addProduitsColumns();
    await this.addPageTemplatesColumns(); // Non-Ref columns only
    await this.addVentesColumns(); // Non-Ref columns only
  }

  /**
   * Step 3: Add Ref columns (relations between tables)
   */
  private async addAllRelations(): Promise<void> {
    Logger.log('🔗', 'Step 3: Adding relations (Ref columns)');

    await this.addPageTemplatesRelations();
    await this.addVentesRelations();
  }

  // ===== CONFIG TABLE =====

  private async addConfigColumns(): Promise<void> {
    const columns: ColumnDefinition[] = [
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

    for (const col of columns) {
      await this.addColumn('Config', col);
    }
  }

  // ===== PAGES TABLE =====

  private async addPagesColumns(): Promise<void> {
    const columns: ColumnDefinition[] = [
      { id: 'page_id', type: 'Text' },
      { id: 'page_name', type: 'Text' },
      { id: 'icon', type: 'Text' },
      { id: 'order', type: 'Int' },
      { id: 'component_code', type: 'Text' },
      { id: 'created_at', type: 'DateTime' },
    ];

    for (const col of columns) {
      await this.addColumn('Pages', col);
    }
  }

  // ===== TEMPLATES TABLE =====

  private async addTemplatesColumns(): Promise<void> {
    const columns: ColumnDefinition[] = [
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

    for (const col of columns) {
      await this.addColumn('Templates', col);
    }
  }

  // ===== CLIENTS TABLE =====

  private async addClientsColumns(): Promise<void> {
    const columns: ColumnDefinition[] = [
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

    for (const col of columns) {
      await this.addColumn('Clients', col);
    }
  }

  // ===== PRODUITS TABLE =====

  private async addProduitsColumns(): Promise<void> {
    const columns: ColumnDefinition[] = [
      { id: 'nom', type: 'Text' },
      { id: 'prix', type: 'Numeric' },
      { id: 'stock', type: 'Int' },
      {
        id: 'categorie',
        type: 'Choice',
        widgetOptions: JSON.stringify({
          choices: ['Informatique', 'Accessoires', 'Audio'],
        }),
      },
      { id: 'description', type: 'Text' },
      { id: 'created_at', type: 'DateTime' },
      { id: 'updated_at', type: 'DateTime' },
    ];

    for (const col of columns) {
      await this.addColumn('Produits', col);
    }
  }

  // ===== PAGE_TEMPLATES TABLE (liaison) =====

  private async addPageTemplatesColumns(): Promise<void> {
    const columns: ColumnDefinition[] = [
      { id: 'order', type: 'Int' },
      { id: 'config', type: 'Text' },
    ];

    for (const col of columns) {
      await this.addColumn('PageTemplates', col);
    }
  }

  private async addPageTemplatesRelations(): Promise<void> {
    const relations: ColumnDefinition[] = [
      {
        id: 'page_id',
        type: 'Ref:Pages',
        visibleCol: 'page_name',
      },
      {
        id: 'template_id',
        type: 'Ref:Templates',
        visibleCol: 'template_name',
      },
    ];

    for (const col of relations) {
      await this.addColumn('PageTemplates', col);
    }
  }

  // ===== VENTES TABLE =====

  private async addVentesColumns(): Promise<void> {
    const columns: ColumnDefinition[] = [
      { id: 'quantite', type: 'Int' },
      { id: 'prix_unitaire', type: 'Numeric' },
      {
        id: 'montant_total',
        type: 'Numeric',
        formula: '$quantite * $prix_unitaire',
      },
      { id: 'date', type: 'Date' },
      { id: 'created_at', type: 'DateTime' },
      { id: 'notes', type: 'Text' },
    ];

    for (const col of columns) {
      await this.addColumn('Ventes', col);
    }
  }

  private async addVentesRelations(): Promise<void> {
    const relations: ColumnDefinition[] = [
      {
        id: 'client_id',
        type: 'Ref:Clients',
        visibleCol: 'nom',
      },
      {
        id: 'produit_id',
        type: 'Ref:Produits',
        visibleCol: 'nom',
      },
    ];

    for (const col of relations) {
      await this.addColumn('Ventes', col);
    }
  }
}

export default GristSchemaManager;
