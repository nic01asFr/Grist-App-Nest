/**
 * Grist Schema Manager - CRM Application
 *
 * Creates a relational database schema for a CRM application:
 * - Companies (enterprises)
 * - Contacts (people at companies)
 * - Opportunities (sales opportunities)
 * - Activities (interactions/tasks)
 * - Templates (UI components stored as JSX)
 * - AppConfig (application configuration)
 *
 * Process:
 * 1. Create tables WITH columns (non-Ref)
 * 2. Add Ref columns (foreign keys with labels)
 */

import GristWidgetBase from './GristWidgetBase';
import Logger from './Logger';
import type { ColumnDefinition } from './types';

class GristSchemaManager extends GristWidgetBase {
  /**
   * Create complete CRM schema
   */
  async createCompleteSchema(): Promise<void> {
    Logger.log('🗄️', 'Creating CRM schema with relations');

    try {
      // Step 1: Create tables WITH their columns (non-Ref)
      await this.createAllTablesWithColumns();

      // Step 2: Add Ref columns (foreign keys)
      await this.addAllRelations();

      Logger.success('CRM schema created successfully');
    } catch (error) {
      Logger.error('Error creating schema:', error);
      throw error;
    }
  }

  /**
   * Step 1: Create all tables WITH their base columns
   */
  private async createAllTablesWithColumns(): Promise<void> {
    Logger.log('📋', 'Step 1: Creating tables with columns');

    // Core tables (no dependencies)
    const coreTables = [
      { name: 'Companies', columns: this.getCompaniesColumns() },
      { name: 'Templates', columns: this.getTemplatesColumns() },
      { name: 'AppConfig', columns: this.getAppConfigColumns() },
    ];

    for (const { name, columns } of coreTables) {
      if (!(await this.tableExists(name))) {
        await this.createTable(name, columns);
        Logger.success(`Table created: ${name} (${columns.length} columns)`);
      } else {
        Logger.info(`Table already exists: ${name}`);
      }
    }

    // Dependent tables (will have Ref columns added in step 2)
    const dependentTables = [
      { name: 'Contacts', columns: this.getContactsColumns() },
      { name: 'Opportunities', columns: this.getOpportunitiesColumns() },
      { name: 'Activities', columns: this.getActivitiesColumns() },
    ];

    for (const { name, columns } of dependentTables) {
      if (!(await this.tableExists(name))) {
        await this.createTable(name, columns);
        Logger.success(`Table created: ${name} (${columns.length} base columns)`);
      } else {
        Logger.info(`Table already exists: ${name}`);
      }
    }
  }

  /**
   * Step 2: Add Ref columns (foreign keys with labels)
   */
  private async addAllRelations(): Promise<void> {
    Logger.log('🔗', 'Step 2: Adding foreign key relations');

    // Contacts → Companies
    await this.addContactsRelations();

    // Opportunities → Companies + Contacts
    await this.addOpportunitiesRelations();

    // Activities → Companies + Contacts + Opportunities
    await this.addActivitiesRelations();

    Logger.success('All relations added');
  }

  // ===== COLUMN DEFINITIONS =====

  /**
   * Companies table (enterprises)
   */
  private getCompaniesColumns(): ColumnDefinition[] {
    return [
      { id: 'name', type: 'Text', label: 'Company Name' },
      {
        id: 'industry',
        type: 'Choice',
        label: 'Industry',
        widgetOptions: JSON.stringify({
          choices: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Other'],
        }),
      },
      {
        id: 'size',
        type: 'Choice',
        label: 'Company Size',
        widgetOptions: JSON.stringify({
          choices: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
        }),
      },
      { id: 'website', type: 'Text', label: 'Website' },
      { id: 'phone', type: 'Text', label: 'Phone' },
      { id: 'address', type: 'Text', label: 'Address' },
      { id: 'city', type: 'Text', label: 'City' },
      { id: 'country', type: 'Text', label: 'Country' },
      { id: 'created_at', type: 'DateTime', label: 'Created At' },
      { id: 'updated_at', type: 'DateTime', label: 'Updated At' },
    ];
  }

  /**
   * Contacts table (people) - base columns only
   */
  private getContactsColumns(): ColumnDefinition[] {
    return [
      { id: 'first_name', type: 'Text', label: 'First Name' },
      { id: 'last_name', type: 'Text', label: 'Last Name' },
      {
        id: 'full_name',
        type: 'Text',
        label: 'Full Name',
        formula: '$first_name + " " + $last_name',
      },
      { id: 'email', type: 'Text', label: 'Email' },
      { id: 'phone', type: 'Text', label: 'Phone' },
      { id: 'position', type: 'Text', label: 'Position' },
      {
        id: 'status',
        type: 'Choice',
        label: 'Status',
        widgetOptions: JSON.stringify({
          choices: ['Active', 'Inactive', 'Lead'],
        }),
      },
      { id: 'created_at', type: 'DateTime', label: 'Created At' },
      { id: 'updated_at', type: 'DateTime', label: 'Updated At' },
    ];
  }

  /**
   * Opportunities table (sales opportunities) - base columns only
   */
  private getOpportunitiesColumns(): ColumnDefinition[] {
    return [
      { id: 'title', type: 'Text', label: 'Opportunity Title' },
      { id: 'amount', type: 'Numeric', label: 'Amount' },
      {
        id: 'stage',
        type: 'Choice',
        label: 'Stage',
        widgetOptions: JSON.stringify({
          choices: [
            'Prospecting',
            'Qualification',
            'Proposal',
            'Negotiation',
            'Closed Won',
            'Closed Lost',
          ],
        }),
      },
      { id: 'probability', type: 'Int', label: 'Probability (%)' },
      { id: 'expected_close_date', type: 'Date', label: 'Expected Close Date' },
      { id: 'actual_close_date', type: 'Date', label: 'Actual Close Date' },
      { id: 'description', type: 'Text', label: 'Description' },
      { id: 'created_at', type: 'DateTime', label: 'Created At' },
      { id: 'updated_at', type: 'DateTime', label: 'Updated At' },
    ];
  }

  /**
   * Activities table (interactions) - base columns only
   */
  private getActivitiesColumns(): ColumnDefinition[] {
    return [
      {
        id: 'type',
        type: 'Choice',
        label: 'Activity Type',
        widgetOptions: JSON.stringify({
          choices: ['Call', 'Email', 'Meeting', 'Task', 'Note'],
        }),
      },
      { id: 'subject', type: 'Text', label: 'Subject' },
      { id: 'description', type: 'Text', label: 'Description' },
      { id: 'scheduled_date', type: 'DateTime', label: 'Scheduled Date' },
      { id: 'completed', type: 'Bool', label: 'Completed' },
      { id: 'created_at', type: 'DateTime', label: 'Created At' },
    ];
  }

  /**
   * Templates table (UI components as JSX)
   */
  private getTemplatesColumns(): ColumnDefinition[] {
    return [
      { id: 'template_id', type: 'Text', label: 'Template ID' },
      { id: 'template_name', type: 'Text', label: 'Name' },
      {
        id: 'category',
        type: 'Choice',
        label: 'Category',
        widgetOptions: JSON.stringify({
          choices: ['pages', 'widgets', 'layouts', 'charts', 'forms'],
        }),
      },
      { id: 'description', type: 'Text', label: 'Description' },
      { id: 'component_code', type: 'Text', label: 'JSX Code' },
      { id: 'props_schema', type: 'Text', label: 'Props Schema (JSON)' },
      { id: 'is_active', type: 'Bool', label: 'Active' },
      { id: 'created_at', type: 'DateTime', label: 'Created At' },
      { id: 'updated_at', type: 'DateTime', label: 'Updated At' },
    ];
  }

  /**
   * AppConfig table (application configuration)
   */
  private getAppConfigColumns(): ColumnDefinition[] {
    return [
      { id: 'config_key', type: 'Text', label: 'Key' },
      { id: 'config_value', type: 'Text', label: 'Value' },
      {
        id: 'config_type',
        type: 'Choice',
        label: 'Type',
        widgetOptions: JSON.stringify({
          choices: ['string', 'number', 'boolean', 'json'],
        }),
      },
      { id: 'description', type: 'Text', label: 'Description' },
    ];
  }

  // ===== FOREIGN KEY RELATIONS =====

  /**
   * Add foreign keys to Contacts table
   */
  private async addContactsRelations(): Promise<void> {
    const relations: ColumnDefinition[] = [
      {
        id: 'company_id',
        type: 'Ref:Companies',
        label: 'Company',
        visibleCol: 'name',
      },
    ];

    for (const col of relations) {
      await this.addColumn('Contacts', col);
    }

    Logger.success('Relations added: Contacts → Companies');
  }

  /**
   * Add foreign keys to Opportunities table
   */
  private async addOpportunitiesRelations(): Promise<void> {
    const relations: ColumnDefinition[] = [
      {
        id: 'company_id',
        type: 'Ref:Companies',
        label: 'Company',
        visibleCol: 'name',
      },
      {
        id: 'contact_id',
        type: 'Ref:Contacts',
        label: 'Contact',
        visibleCol: 'full_name',
      },
    ];

    for (const col of relations) {
      await this.addColumn('Opportunities', col);
    }

    Logger.success('Relations added: Opportunities → Companies, Contacts');
  }

  /**
   * Add foreign keys to Activities table
   */
  private async addActivitiesRelations(): Promise<void> {
    const relations: ColumnDefinition[] = [
      {
        id: 'company_id',
        type: 'Ref:Companies',
        label: 'Company',
        visibleCol: 'name',
      },
      {
        id: 'contact_id',
        type: 'Ref:Contacts',
        label: 'Contact',
        visibleCol: 'full_name',
      },
      {
        id: 'opportunity_id',
        type: 'Ref:Opportunities',
        label: 'Opportunity',
        visibleCol: 'title',
      },
    ];

    for (const col of relations) {
      await this.addColumn('Activities', col);
    }

    Logger.success('Relations added: Activities → Companies, Contacts, Opportunities');
  }
}

export default GristSchemaManager;
