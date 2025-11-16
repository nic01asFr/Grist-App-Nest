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

// ===== ARCHITECTURE COMPONENTS =====

export interface PageRecord extends GristRecord {
  page_id: string;
  page_name: string;
  icon: string;
  order: number;
  component_code: string;
  created_at?: string;
}

export interface TemplateRecord extends GristRecord {
  template_id: string;
  template_name: string;
  category: 'display' | 'data' | 'charts' | 'forms' | 'ui';
  description?: string;
  component_code: string;
  props_schema?: string; // JSON
  created_at?: string;
}

export interface PageTemplateRecord extends GristRecord {
  page_id: number; // Ref to Pages
  template_id: number; // Ref to Templates
  order?: number;
  config?: string; // JSON
}

export interface ConfigRecord extends GristRecord {
  config_key: string;
  config_value: string;
  config_type: 'text' | 'number' | 'boolean' | 'json';
  description?: string;
  updated_at?: string;
}

// ===== BUSINESS DATA =====

export interface ClientRecord extends GristRecord {
  nom: string;
  email: string;
  entreprise?: string;
  statut: 'Actif' | 'Inactif';
  created_at?: string;
  updated_at?: string;
}

export interface ProductRecord extends GristRecord {
  nom: string;
  prix: number;
  stock: number;
  categorie: 'Informatique' | 'Accessoires' | 'Audio';
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SaleRecord extends GristRecord {
  client_id: number; // Ref to Clients
  produit_id: number; // Ref to Products
  quantite: number;
  prix_unitaire: number;
  montant_total?: number; // Computed
  date: string;
  created_at?: string;
  notes?: string;
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
  getChildComponent: (templateId: string) => Promise<React.ComponentType<any> | null>;
  getPage: (pageId: string) => Promise<PageData | null>;
  getPages: () => Promise<PageRecord[]>;
  getTemplates: (category?: string) => Promise<TemplateRecord[]>;
}

export interface PageData {
  page: PageRecord;
  templates: Record<string, React.ComponentType<any>>;
}

// ===== LOGGER =====

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  icon: string;
  message: string;
  data?: unknown;
}

// ===== CACHE =====

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in ms
}

// ===== TEMPLATE PROPS =====

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'gray';
  trend?: number;
}

export interface DataTableColumn<T = any> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: DataTableColumn<T>[];
  onRowClick?: (row: T) => void;
}

export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface LineChartProps {
  data: ChartDataPoint[];
  xKey: string;
  yKey: string;
  title?: string;
  color?: string;
}

export interface PieChartProps {
  data: ChartDataPoint[];
  nameKey: string;
  valueKey: string;
  title?: string;
}

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info';
}
