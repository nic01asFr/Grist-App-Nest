/**
 * Core TypeScript Types and Interfaces
 */

// ===== GRIST DATA TYPES =====

export interface GristRecord {
  id: number;
  [key: string]: unknown;
}

export interface GristColumnarData {
  [columnName: string]: unknown[] | unknown;
}

export type GristTableData = GristRecord[] | GristColumnarData;

// ===== TABLE SCHEMA =====

export type ColumnType =
  | 'Text'
  | 'Numeric'
  | 'Int'
  | 'Date'
  | 'DateTime'
  | 'Bool'
  | 'Toggle'
  | 'Choice'
  | `Ref:${string}`;

export interface ColumnDefinition {
  id: string;
  type: ColumnType;
  label?: string;
  formula?: string;
  widgetOptions?: string; // JSON string
  visibleCol?: string; // For Ref columns
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
}

// ===== CRM APPLICATION RECORDS =====

export interface CompanyRecord extends GristRecord {
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContactRecord extends GristRecord {
  company_id: number; // Ref:Companies
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OpportunityRecord extends GristRecord {
  company_id: number; // Ref:Companies
  contact_id?: number; // Ref:Contacts
  title: string;
  amount?: number;
  stage?: string;
  probability?: number;
  expected_close_date?: string;
  actual_close_date?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityRecord extends GristRecord {
  company_id?: number; // Ref:Companies
  contact_id?: number; // Ref:Contacts
  opportunity_id?: number; // Ref:Opportunities
  type: string;
  subject: string;
  description?: string;
  scheduled_date?: string;
  completed?: boolean;
  created_at?: string;
}

export interface TemplateRecord extends GristRecord {
  template_id: string;
  template_name: string;
  category: 'pages' | 'widgets' | 'layouts' | 'charts' | 'forms' | 'base' | 'composite' | 'functional';
  description?: string;
  component_code: string; // JSX code as string
  props_schema?: string; // JSON schema
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AppConfigRecord extends GristRecord {
  config_key: string;
  config_value: string;
  config_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
}

// ===== COMPONENT PROPS =====

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray';
  trend?: number;
}

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn[];
  onRowClick?: (row: T) => void;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

// ===== CACHING =====

export interface CacheEntry<T = GristRecord[]> {
  data: T;
  timestamp: number;
  ttl: number;
}

// ===== LOGGING =====

export type LogLevel = 'log' | 'info' | 'success' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  icon: string;
  message: string;
  data?: unknown;
}

// ===== GRIST API =====

export interface GristAPI {
  // Data operations
  getData: <T extends GristRecord = GristRecord>(tableName: string) => Promise<T[]>;
  addRecord: (tableName: string, record: Partial<GristRecord>) => Promise<number>;
  updateRecord: (tableName: string, recordId: number, updates: Partial<GristRecord>) => Promise<void>;
  deleteRecord: (tableName: string, recordId: number) => Promise<void>;

  // Navigation
  navigate: (pageId: string) => void;

  // Component loading
  getTemplate: (templateId: string) => Promise<TemplateRecord | null>;
  getTemplates: (category?: string) => Promise<TemplateRecord[]>;
  getChildComponent: (templateId: string) => Promise<React.ComponentType<any>>;
}

export interface PageData {
  template: TemplateRecord;
  component: React.ComponentType<any>;
}

// ===== BACKWARD COMPATIBILITY (old schema types) =====

// These are kept for compatibility with existing pages/components
// They map to the new CRM types or are deprecated

export interface PageRecord extends GristRecord {
  page_id: string;
  page_name: string;
  icon: string;
  order: number;
  component_code: string;
  created_at?: string;
}

export type ConfigRecord = AppConfigRecord; // Alias
export type ClientRecord = ContactRecord; // Alias (clients → contacts)
export type ProductRecord = OpportunityRecord; // Deprecated, use OpportunityRecord
export type SaleRecord = ActivityRecord; // Deprecated, use ActivityRecord

// ===== GLOBAL WINDOW =====

declare global {
  interface Window {
    grist: any;
    gristAPI: GristAPI;
    Babel: any;
    React: any;
    ReactDOM: any;
  }
}

export {};
