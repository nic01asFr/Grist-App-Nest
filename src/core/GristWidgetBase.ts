/**
 * Grist Widget Base Class
 *
 * Provides base functionality for Grist widgets:
 * - Grist API initialization
 * - Data fetching with intelligent caching
 * - Columnar to array conversion
 * - Table operations
 */

import Logger from './Logger';
import type {
  GristRecord,
  GristColumnarData,
  GristTableData,
  ColumnDefinition,
  CacheEntry,
} from './types';

// Declare global grist object
declare global {
  interface Window {
    grist: any;
  }
}

class GristWidgetBase {
  protected cache: Map<string, CacheEntry<GristRecord[]>> = new Map();
  protected initialized = false;
  protected defaultCacheTTL = 60000; // 60 seconds

  /**
   * Initialize Grist API
   */
  async initialize(options: { access?: string } = {}): Promise<void> {
    if (this.initialized) {
      Logger.warn('GristWidgetBase already initialized');
      return;
    }

    Logger.log('⚙️', 'Initializing Grist Widget Base');

    const access = options.access || 'read table';

    try {
      await window.grist.ready({ requiredAccess: access });
      this.initialized = true;
      Logger.success('Grist Widget Base initialized');
    } catch (error) {
      Logger.error('Failed to initialize Grist API', error);
      throw error;
    }
  }

  /**
   * Fetch table data with caching
   */
  async fetchTable<T extends GristRecord = GristRecord>(
    tableName: string,
    useCache = true
  ): Promise<T[]> {
    // Check cache first
    if (useCache && this.cache.has(tableName)) {
      const cached = this.cache.get(tableName)!;
      const now = Date.now();

      if (!cached.ttl || now - cached.timestamp < cached.ttl) {
        Logger.log('💾', `Cache hit for table: ${tableName}`);
        return cached.data as T[];
      } else {
        Logger.log('🗑️', `Cache expired for table: ${tableName}`);
        this.cache.delete(tableName);
      }
    }

    try {
      const result: GristTableData = await window.grist.docApi.fetchTable(tableName);
      Logger.log('🔍', `Fetched table: ${tableName}`, result);

      // Convert columnar format to array
      const data = this.convertColumnarToArray<T>(result);

      // Cache the result
      if (useCache) {
        this.cache.set(tableName, {
          data: data as GristRecord[],
          timestamp: Date.now(),
          ttl: this.defaultCacheTTL,
        });
      }

      return data;
    } catch (error) {
      Logger.warn(`Table ${tableName} not found or error:`, error);
      return [];
    }
  }

  /**
   * Convert Grist columnar format to array of objects
   */
  protected convertColumnarToArray<T extends GristRecord>(
    columnarData: GristTableData
  ): T[] {
    // Already an array
    if (Array.isArray(columnarData)) {
      return columnarData as T[];
    }

    // Not an object
    if (!columnarData || typeof columnarData !== 'object') {
      return [];
    }

    const data = columnarData as GristColumnarData;
    const columns = Object.keys(data);
    const isColumnar = columns.some((col) => Array.isArray(data[col]));

    if (!isColumnar) {
      return [];
    }

    // Find first array column to determine row count
    const firstArrayCol = columns.find((col) => Array.isArray(data[col]));
    if (!firstArrayCol) {
      return [];
    }

    const rowCount = (data[firstArrayCol] as unknown[]).length;
    const rows: T[] = [];

    for (let i = 0; i < rowCount; i++) {
      const row: any = {};

      columns.forEach((col) => {
        const value = data[col];
        row[col] = Array.isArray(value) ? value[i] : value;
      });

      rows.push(row as T);
    }

    Logger.success(`Converted ${rowCount} rows from columnar format`);
    return rows;
  }

  /**
   * List all tables in the document
   */
  async listTables(): Promise<string[]> {
    try {
      const tables = await window.grist.docApi.listTables();
      Logger.log('📋', `Found ${tables.length} tables`, tables);
      return tables;
    } catch (error) {
      Logger.error('Error listing tables:', error);
      return [];
    }
  }

  /**
   * Create a new table
   */
  async createTable(tableName: string, columns: ColumnDefinition[] = []): Promise<void> {
    try {
      const colDefs = columns.map((col) => ({
        id: col.id,
        type: col.type,
      }));

      await window.grist.docApi.applyUserActions([['AddTable', tableName, colDefs]]);

      Logger.success(`Table created: ${tableName}`);
    } catch (error) {
      Logger.error(`Error creating table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Add a column to an existing table
   */
  async addColumn(tableName: string, column: ColumnDefinition): Promise<void> {
    try {
      const colInfo: any = { type: column.type };

      if (column.label) colInfo.label = column.label;
      if (column.formula) colInfo.formula = column.formula;
      if (column.widgetOptions) colInfo.widgetOptions = column.widgetOptions;
      if (column.visibleCol) colInfo.visibleCol = column.visibleCol;

      await window.grist.docApi.applyUserActions([
        ['AddColumn', tableName, column.id, colInfo],
      ]);

      Logger.success(`Column added: ${tableName}.${column.id}`);
    } catch (error) {
      Logger.error(`Error adding column ${tableName}.${column.id}:`, error);
      throw error;
    }
  }

  /**
   * Add multiple records at once
   */
  async addRecords(tableName: string, records: Partial<GristRecord>[]): Promise<void> {
    try {
      const actions = records.map((record) => ['AddRecord', tableName, null, record]);
      await window.grist.docApi.applyUserActions(actions);

      Logger.success(`Added ${records.length} records to ${tableName}`);
    } catch (error) {
      Logger.error(`Error adding records to ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache for a table or all tables
   */
  invalidateCache(tableName?: string): void {
    if (tableName) {
      this.cache.delete(tableName);
      Logger.log('🗑️', `Cache invalidated for: ${tableName}`);
    } else {
      this.cache.clear();
      Logger.log('🗑️', 'All cache cleared');
    }
  }

  /**
   * Check if a table exists
   */
  async tableExists(tableName: string): Promise<boolean> {
    try {
      await window.grist.docApi.fetchTable(tableName);
      return true;
    } catch {
      return false;
    }
  }
}

export default GristWidgetBase;
