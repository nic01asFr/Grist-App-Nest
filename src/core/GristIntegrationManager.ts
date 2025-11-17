/**
 * Grist Integration Manager
 *
 * Manages auto-initialization of CRM demo data:
 * - Checks if tables exist
 * - Creates complete schema if needed
 * - Populates with realistic relational demo data
 */

import GristSchemaManager from './GristSchemaManager';
import Logger from './Logger';
import type {
  AppConfigRecord,
  CompanyRecord,
  ContactRecord,
  OpportunityRecord,
  ActivityRecord,
  TemplateRecord,
} from './types';

class GristIntegrationManager extends GristSchemaManager {
  /**
   * Check and initialize CRM demo data if document is empty
   */
  async checkAndInitializeDemoData(): Promise<boolean> {
    Logger.log('ℹ️', 'Checking for CRM demo data...');

    // Check if tables exist
    const hasCompanies = await this.tableExists('Companies');
    const hasContacts = await this.tableExists('Contacts');
    const hasOpportunities = await this.tableExists('Opportunities');
    const hasActivities = await this.tableExists('Activities');
    const hasTemplates = await this.tableExists('Templates');
    const hasAppConfig = await this.tableExists('AppConfig');

    // If ANY table is missing, do full initialization
    if (!hasCompanies || !hasContacts || !hasOpportunities || !hasActivities || !hasTemplates || !hasAppConfig) {
      Logger.log('📦', 'Some CRM tables not found, initializing...');
      await this.initializeDemoData();
      return true;
    }

    // All tables exist, check if Templates table has data (critical table)
    Logger.log('🔍', 'All tables exist, checking if they contain data...');
    const templates = await this.fetchTable<TemplateRecord>('Templates');

    if (templates.length === 0) {
      Logger.log('⚠️', 'Tables exist but Templates is empty, reinitializing data...');
      await this.populateAllData();
      return true;
    }

    // Check if migration to new component architecture is needed
    const hasBaseComponents = templates.some((t) => t.category === 'base');
    const hasCompositeComponents = templates.some((t) => t.category === 'composite');
    const hasFunctionalComponents = templates.some((t) => t.category === 'functional');

    // Check if page templates use refactored code (looking for getChildComponent usage)
    const pageTemplates = templates.filter((t) => t.category === 'pages');
    const pagesUseComposition = pageTemplates.some(
      (t) => t.component_code?.includes('getChildComponent')
    );

    const needsMigration =
      !hasBaseComponents ||
      !hasCompositeComponents ||
      !hasFunctionalComponents ||
      !pagesUseComposition;

    if (needsMigration) {
      Logger.log('🔄', 'Migrating to new component architecture...');
      await this.migrateToComponentArchitecture(templates);
      this.invalidateCache();
      Logger.log('✅', 'Migration complete');
      return true;
    }

    Logger.log('✅', 'CRM data already exists and is up to date');
    return false;
  }

  /**
   * Migrate to component architecture by adding missing templates and updating existing pages
   */
  private async migrateToComponentArchitecture(existingTemplates: TemplateRecord[]): Promise<void> {
    Logger.log('📦', 'Migrating to new component architecture...');

    try {
      const now = new Date().toISOString();
      const allTemplates = this.getAllTemplateDefinitions(now);

      // Create maps for efficient lookup
      const existingMap = new Map(existingTemplates.map((t) => [t.template_id, t]));
      const newTemplatesMap = new Map(allTemplates.filter(t => t.template_id).map((t) => [t.template_id, t]));

      // 1. Add completely new templates (base, composite, functional components)
      const templatesToAdd = allTemplates.filter(
        (t) => t.template_id && !existingMap.has(t.template_id)
      );

      if (templatesToAdd.length > 0) {
        Logger.log('➕', `Adding ${templatesToAdd.length} new templates...`);
        await this.addRecords('Templates', templatesToAdd);
        Logger.success(`Added ${templatesToAdd.length} new templates`);
      }

      // 2. Update existing page templates with refactored code
      const pageTemplateIds = ['page-dashboard', 'page-companies', 'page-contacts', 'page-opportunities', 'page-activities'];
      const templatesToUpdate: Array<{ id: number; updates: Partial<TemplateRecord> }> = [];

      for (const pageId of pageTemplateIds) {
        const existing = existingMap.get(pageId);
        const newDef = newTemplatesMap.get(pageId);

        if (existing && newDef) {
          // Check if code needs updating (compare trimmed code to avoid whitespace differences)
          const existingCode = existing.component_code?.trim() || '';
          const newCode = newDef.component_code?.trim() || '';

          if (existingCode !== newCode) {
            templatesToUpdate.push({
              id: existing.id,
              updates: {
                component_code: newDef.component_code,
                description: newDef.description,
                updated_at: now,
              },
            });
          }
        }
      }

      if (templatesToUpdate.length > 0) {
        Logger.log('🔄', `Updating ${templatesToUpdate.length} existing page templates with refactored code...`);
        for (const { id, updates } of templatesToUpdate) {
          await window.grist.docApi.applyUserActions([
            ['UpdateRecord', 'Templates', id, updates],
          ]);
        }
        Logger.success(`Updated ${templatesToUpdate.length} page templates`);
      } else {
        Logger.log('ℹ️', 'No page templates need updating');
      }
    } catch (error) {
      Logger.error('Error migrating to component architecture:', error);
      throw error;
    }
  }

  /**
   * Populate all data (without recreating schema)
   */
  private async populateAllData(): Promise<void> {
    Logger.log('📝', 'Populating data into existing tables');

    try {
      await this.populateAppConfig();
      await this.populateTemplates();
      await this.populateCompanies();
      await this.populateContacts(); // Depends on Companies
      await this.populateOpportunities(); // Depends on Companies & Contacts
      await this.populateActivities(); // Depends on Companies, Contacts & Opportunities

      // CRITICAL: Invalidate all cache so Dashboard gets fresh data
      this.invalidateCache();
      Logger.log('🗑️', 'Cache cleared after data population');

      Logger.success('Data population complete');
    } catch (error) {
      Logger.error('Error populating data:', error);
      throw error;
    }
  }

  /**
   * Initialize complete CRM demo data
   */
  private async initializeDemoData(): Promise<void> {
    Logger.log('🎬', 'Initializing CRM demo data');

    try {
      // 1. Create complete schema with relations
      await this.createCompleteSchema();

      // 2. Populate tables in correct order (respecting FK constraints)
      await this.populateAppConfig();
      await this.populateTemplates();
      await this.populateCompanies();
      await this.populateContacts(); // Depends on Companies
      await this.populateOpportunities(); // Depends on Companies & Contacts
      await this.populateActivities(); // Depends on Companies, Contacts & Opportunities

      // CRITICAL: Invalidate all cache so Dashboard gets fresh data
      this.invalidateCache();
      Logger.log('🗑️', 'Cache cleared after initialization');

      Logger.success('🎉 CRM demo data initialization complete');
    } catch (error) {
      Logger.error('Error initializing CRM demo data:', error);
      throw error;
    }
  }

  // ===== APP CONFIG DATA =====

  private async populateAppConfig(): Promise<void> {
    const config: Partial<AppConfigRecord>[] = [
      {
        config_key: 'app_name',
        config_value: 'Grist CRM App Nest',
        config_type: 'string',
        description: 'Application name',
      },
      {
        config_key: 'app_logo',
        config_value: '🪺',
        config_type: 'string',
        description: 'Application logo emoji',
      },
      {
        config_key: 'default_page',
        config_value: 'page-dashboard',
        config_type: 'string',
        description: 'Default page template_id to load',
      },
      {
        config_key: 'theme',
        config_value: 'light',
        config_type: 'string',
        description: 'Application theme',
      },
    ];

    await this.addRecords('AppConfig', config);
    Logger.success('AppConfig populated');
  }

  // ===== TEMPLATES DATA =====

  /**
   * Get all template definitions (for initial population or migration)
   */
  private getAllTemplateDefinitions(now: string): Partial<TemplateRecord>[] {
    return [
      // ========================================
      // BASE COMPONENTS (DSFR Design System)
      // ========================================

      // ===== BASE: Button =====
      {
        template_id: 'base-button',
        template_name: 'DSFR Button',
        category: 'base',
        description: 'DSFR Button component with variants and sizes',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = ({
  label = 'Button',
  onClick = () => {},
  variant = 'primary',
  size = 'md',
  icon = null,
  disabled = false,
  type = 'button'
}) => {
  const variantStyles = {
    primary: {
      background: '#000091',
      color: 'white',
      border: 'none',
      hover: '#1212ff'
    },
    secondary: {
      background: '#e3e3fd',
      color: '#000091',
      border: 'none',
      hover: '#c9c9fb'
    },
    tertiary: {
      background: 'transparent',
      color: '#000091',
      border: '1px solid #000091',
      hover: '#f5f5fe'
    },
    error: {
      background: '#e1000f',
      color: 'white',
      border: 'none',
      hover: '#c9000d'
    }
  };

  const sizeStyles = {
    sm: { padding: '8px 16px', fontSize: '14px' },
    md: { padding: '12px 24px', fontSize: '16px' },
    lg: { padding: '16px 32px', fontSize: '18px' }
  };

  const style = variantStyles[variant];
  const sizing = sizeStyles[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: style.background,
        color: style.color,
        border: style.border,
        padding: sizing.padding,
        fontSize: sizing.fontSize,
        fontFamily: "'Marianne', Arial, sans-serif",
        fontWeight: '500',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px'
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = style.hover;
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = style.background;
      }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
};
        `.trim(),
      },

      // ===== BASE: Input =====
      {
        template_id: 'base-input',
        template_name: 'DSFR Input',
        category: 'base',
        description: 'DSFR Input component with validation',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = ({
  label = '',
  value = '',
  onChange = () => {},
  type = 'text',
  placeholder = '',
  required = false,
  error = '',
  hint = '',
  disabled = false,
  id = ''
}) => {
  const inputId = id || \`input-\${Math.random().toString(36).substr(2, 9)}\`;

  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            marginBottom: '8px',
            fontFamily: "'Marianne', Arial, sans-serif",
            fontSize: '14px',
            fontWeight: '500',
            color: '#161616'
          }}
        >
          {label}
          {required && <span style={{ color: '#e1000f', marginLeft: '4px' }}>*</span>}
        </label>
      )}

      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          fontFamily: "'Marianne', Arial, sans-serif",
          border: error ? '2px solid #e1000f' : '1px solid #3a3a3a',
          borderRadius: '4px',
          background: disabled ? '#f6f6f6' : 'white',
          color: '#161616',
          outline: 'none',
          transition: 'border-color 0.2s'
        }}
        onFocus={(e) => {
          if (!error) e.currentTarget.style.borderColor = '#000091';
        }}
        onBlur={(e) => {
          if (!error) e.currentTarget.style.borderColor = '#3a3a3a';
        }}
      />

      {hint && !error && (
        <div style={{
          marginTop: '4px',
          fontSize: '12px',
          color: '#666',
          fontFamily: "'Marianne', Arial, sans-serif"
        }}>
          {hint}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '4px',
          fontSize: '12px',
          color: '#e1000f',
          fontFamily: "'Marianne', Arial, sans-serif",
          fontWeight: '500'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};
        `.trim(),
      },

      // ===== BASE: Card =====
      {
        template_id: 'base-card',
        template_name: 'DSFR Card',
        category: 'base',
        description: 'DSFR Card component',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = ({
  title = '',
  children = null,
  footer = null,
  variant = 'default'
}) => {
  const variantStyles = {
    default: { border: '1px solid #e5e5e5', background: 'white' },
    primary: { border: '1px solid #000091', background: '#f5f5fe' },
    success: { border: '1px solid #18753c', background: '#f5fef5' },
    error: { border: '1px solid #e1000f', background: '#fef5f5' }
  };

  const style = variantStyles[variant];

  return (
    <div style={{
      border: style.border,
      background: style.background,
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      fontFamily: "'Marianne', Arial, sans-serif"
    }}>
      {title && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e5e5',
          fontWeight: '600',
          fontSize: '18px',
          color: '#161616'
        }}>
          {title}
        </div>
      )}

      <div style={{ padding: '20px' }}>
        {children}
      </div>

      {footer && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #e5e5e5',
          background: '#f6f6f6'
        }}>
          {footer}
        </div>
      )}
    </div>
  );
};
        `.trim(),
      },

      // ===== BASE: Badge =====
      {
        template_id: 'base-badge',
        template_name: 'DSFR Badge',
        category: 'base',
        description: 'DSFR Badge component',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = ({
  label = '',
  variant = 'info',
  size = 'md'
}) => {
  const variantStyles = {
    success: { background: '#18753c', color: 'white' },
    error: { background: '#e1000f', color: 'white' },
    warning: { background: '#fc5d00', color: 'white' },
    info: { background: '#0063cb', color: 'white' },
    new: { background: '#6a6af4', color: 'white' },
    default: { background: '#e5e5e5', color: '#161616' }
  };

  const sizeStyles = {
    sm: { padding: '2px 8px', fontSize: '11px' },
    md: { padding: '4px 12px', fontSize: '13px' },
    lg: { padding: '6px 16px', fontSize: '15px' }
  };

  const style = variantStyles[variant] || variantStyles.default;
  const sizing = sizeStyles[size];

  return (
    <span style={{
      display: 'inline-block',
      background: style.background,
      color: style.color,
      padding: sizing.padding,
      fontSize: sizing.fontSize,
      fontFamily: "'Marianne', Arial, sans-serif",
      fontWeight: '500',
      borderRadius: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      {label}
    </span>
  );
};
        `.trim(),
      },

      // ===== BASE: Alert =====
      {
        template_id: 'base-alert',
        template_name: 'DSFR Alert',
        category: 'base',
        description: 'DSFR Alert component',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = ({
  message = '',
  type = 'info',
  title = '',
  closable = false,
  onClose = () => {}
}) => {
  const [visible, setVisible] = useState(true);

  const typeStyles = {
    success: {
      background: '#f5fef5',
      border: '#18753c',
      icon: '✅',
      color: '#18753c'
    },
    error: {
      background: '#fef5f5',
      border: '#e1000f',
      icon: '❌',
      color: '#e1000f'
    },
    warning: {
      background: '#fef9f5',
      border: '#fc5d00',
      icon: '⚠️',
      color: '#fc5d00'
    },
    info: {
      background: '#f5f9fe',
      border: '#0063cb',
      icon: 'ℹ️',
      color: '#0063cb'
    }
  };

  const style = typeStyles[type];

  const handleClose = () => {
    setVisible(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <div style={{
      background: style.background,
      border: \`1px solid \${style.border}\`,
      borderLeft: \`4px solid \${style.border}\`,
      borderRadius: '4px',
      padding: '16px',
      marginBottom: '16px',
      fontFamily: "'Marianne', Arial, sans-serif",
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ fontSize: '20px' }}>{style.icon}</div>
        <div style={{ flex: 1 }}>
          {title && (
            <div style={{
              fontWeight: '600',
              color: style.color,
              marginBottom: '4px',
              fontSize: '16px'
            }}>
              {title}
            </div>
          )}
          <div style={{ color: '#161616', fontSize: '14px', lineHeight: '1.5' }}>
            {message}
          </div>
        </div>
        {closable && (
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#666',
              padding: '0',
              lineHeight: '1'
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
        `.trim(),
      },

      // ===== BASE: Select =====
      {
        template_id: 'base-select',
        template_name: 'DSFR Select',
        category: 'base',
        description: 'DSFR Select component',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = ({
  label = '',
  value = '',
  onChange = () => {},
  options = [],
  required = false,
  error = '',
  hint = '',
  disabled = false,
  placeholder = 'Sélectionnez...'
}) => {
  const selectId = \`select-\${Math.random().toString(36).substr(2, 9)}\`;

  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{
            display: 'block',
            marginBottom: '8px',
            fontFamily: "'Marianne', Arial, sans-serif",
            fontSize: '14px',
            fontWeight: '500',
            color: '#161616'
          }}
        >
          {label}
          {required && <span style={{ color: '#e1000f', marginLeft: '4px' }}>*</span>}
        </label>
      )}

      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          fontFamily: "'Marianne', Arial, sans-serif",
          border: error ? '2px solid #e1000f' : '1px solid #3a3a3a',
          borderRadius: '4px',
          background: disabled ? '#f6f6f6' : 'white',
          color: '#161616',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'border-color 0.2s'
        }}
        onFocus={(e) => {
          if (!error) e.currentTarget.style.borderColor = '#000091';
        }}
        onBlur={(e) => {
          if (!error) e.currentTarget.style.borderColor = '#3a3a3a';
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {hint && !error && (
        <div style={{
          marginTop: '4px',
          fontSize: '12px',
          color: '#666',
          fontFamily: "'Marianne', Arial, sans-serif"
        }}>
          {hint}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '4px',
          fontSize: '12px',
          color: '#e1000f',
          fontFamily: "'Marianne', Arial, sans-serif",
          fontWeight: '500'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};
        `.trim(),
      },

      // ===== BASE: Table =====
      {
        template_id: 'base-table',
        template_name: 'DSFR Table',
        category: 'base',
        description: 'DSFR Table component',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = ({
  columns = [],
  data = [],
  onRowClick = null,
  striped = true,
  caption = ''
}) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      fontFamily: "'Marianne', Arial, sans-serif"
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
        {caption && (
          <caption style={{
            padding: '16px',
            textAlign: 'left',
            fontWeight: '600',
            fontSize: '16px',
            color: '#161616',
            background: '#f6f6f6'
          }}>
            {caption}
          </caption>
        )}
        <thead>
          <tr style={{
            background: '#f6f6f6',
            borderBottom: '2px solid #e5e5e5'
          }}>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  padding: '16px',
                  textAlign: col.align || 'left',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#161616',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '32px',
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '14px'
                }}
              >
                Aucune donnée disponible
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{
                  borderBottom: '1px solid #e5e5e5',
                  background: striped && rowIdx % 2 === 1 ? '#f9f9f9' : 'white',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) e.currentTarget.style.background = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  if (onRowClick) {
                    e.currentTarget.style.background = striped && rowIdx % 2 === 1 ? '#f9f9f9' : 'white';
                  }
                }}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    style={{
                      padding: '16px',
                      textAlign: col.align || 'left',
                      fontSize: '14px',
                      color: '#161616'
                    }}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
        `.trim(),
      },

      // ===== BASE: Modal =====
      {
        template_id: 'base-modal',
        template_name: 'DSFR Modal',
        category: 'base',
        description: 'DSFR Modal component',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = ({
  isOpen = false,
  onClose = () => {},
  title = '',
  children = null,
  footer = null,
  size = 'md'
}) => {
  const sizeStyles = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '600px' },
    lg: { maxWidth: '900px' },
    xl: { maxWidth: '1200px' }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        fontFamily: "'Marianne', Arial, sans-serif"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          width: '100%',
          ...sizeStyles[size],
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e5e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: '#161616'
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px',
              color: '#666',
              padding: '0',
              lineHeight: '1',
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e5e5',
            background: '#f6f6f6',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
        `.trim(),
      },

      // ========================================
      // COMPOSITE COMPONENTS (Business Logic)
      // ========================================

      // ===== COMPOSITE: Metric Card =====
      {
        template_id: 'metric-card',
        template_name: 'Metric Card',
        category: 'composite',
        description: 'Dashboard metric card with icon and value',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = ({ label, value, icon, gradient }) => {
  const [Card, setCard] = useState(null);

  useEffect(() => {
    const loadCard = async () => {
      const CardComponent = await gristAPI.getChildComponent('base-card');
      setCard(() => CardComponent);
    };
    loadCard();
  }, []);

  if (!Card) return <div>Chargement...</div>;

  return (
    <Card variant="default">
      <div style={{
        background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '24px',
        borderRadius: '8px',
        fontFamily: "'Marianne', Arial, sans-serif"
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {icon && <div style={{ fontSize: '32px' }}>{icon}</div>}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
              {label}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {value}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
        `.trim(),
      },

      // ===== COMPOSITE: Company Card =====
      {
        template_id: 'company-card',
        template_name: 'Company Card',
        category: 'composite',
        description: 'Detailed company card with contacts and opportunities count',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = ({ company }) => {
  const [Card, setCard] = useState(null);
  const [Badge, setBadge] = useState(null);
  const [Button, setButton] = useState(null);
  const [contactsCount, setContactsCount] = useState(0);
  const [oppsCount, setOppsCount] = useState(0);

  useEffect(() => {
    const loadComponents = async () => {
      const [CardComp, BadgeComp, ButtonComp] = await Promise.all([
        gristAPI.getChildComponent('base-card'),
        gristAPI.getChildComponent('base-badge'),
        gristAPI.getChildComponent('base-button')
      ]);
      setCard(() => CardComp);
      setBadge(() => BadgeComp);
      setButton(() => ButtonComp);
    };
    loadComponents();
  }, []);

  useEffect(() => {
    const loadRelatedData = async () => {
      if (!company) return;
      const [contacts, opps] = await Promise.all([
        gristAPI.getData('Contacts'),
        gristAPI.getData('Opportunities')
      ]);
      setContactsCount(contacts.filter(c => c.company_id === company.id).length);
      setOppsCount(opps.filter(o => o.company_id === company.id).length);
    };
    loadRelatedData();
  }, [company]);

  if (!Card || !Badge || !Button || !company) {
    return <div>Chargement...</div>;
  }

  return (
    <Card
      title={company.name}
      footer={
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button label="Éditer" variant="primary" size="sm" />
          <Button label="Supprimer" variant="error" size="sm" />
        </div>
      }
    >
      <div style={{ fontFamily: "'Marianne', Arial, sans-serif" }}>
        {company.industry && (
          <div style={{ marginBottom: '12px' }}>
            <Badge label={company.industry} variant="info" />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Taille</div>
            <div style={{ fontWeight: '500' }}>{company.size || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Pays</div>
            <div style={{ fontWeight: '500' }}>{company.country || '-'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', background: '#f6f6f6', borderRadius: '4px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#000091' }}>
              {contactsCount}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Contacts</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#000091' }}>
              {oppsCount}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Opportunités</div>
          </div>
        </div>

        {company.website && (
          <div style={{ marginTop: '12px', fontSize: '14px' }}>
            <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: '#000091' }}>
              {company.website}
            </a>
          </div>
        )}
      </div>
    </Card>
  );
};
        `.trim(),
      },

      // ===== COMPOSITE: Contact Card =====
      {
        template_id: 'contact-card',
        template_name: 'Contact Card',
        category: 'composite',
        description: 'Detailed contact card with company information',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = ({ contact }) => {
  const [Card, setCard] = useState(null);
  const [Badge, setBadge] = useState(null);
  const [Button, setButton] = useState(null);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    const loadComponents = async () => {
      const [CardComp, BadgeComp, ButtonComp] = await Promise.all([
        gristAPI.getChildComponent('base-card'),
        gristAPI.getChildComponent('base-badge'),
        gristAPI.getChildComponent('base-button')
      ]);
      setCard(() => CardComp);
      setBadge(() => BadgeComp);
      setButton(() => ButtonComp);
    };
    loadComponents();
  }, []);

  useEffect(() => {
    const loadCompany = async () => {
      if (!contact || !contact.company_id) return;
      const companies = await gristAPI.getData('Companies');
      const comp = companies.find(c => c.id === contact.company_id);
      setCompany(comp);
    };
    loadCompany();
  }, [contact]);

  if (!Card || !Badge || !Button || !contact) {
    return <div>Chargement...</div>;
  }

  const getStatusVariant = (status) => {
    const map = { 'Active': 'success', 'Inactive': 'default', 'Lead': 'info' };
    return map[status] || 'default';
  };

  return (
    <Card
      title={\`\${contact.first_name} \${contact.last_name}\`}
      footer={
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button label="Éditer" variant="primary" size="sm" />
          <Button label="Supprimer" variant="error" size="sm" />
        </div>
      }
    >
      <div style={{ fontFamily: "'Marianne', Arial, sans-serif" }}>
        {contact.status && (
          <div style={{ marginBottom: '12px' }}>
            <Badge label={contact.status} variant={getStatusVariant(contact.status)} />
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Email</div>
          <div style={{ fontWeight: '500' }}>
            <a href={\`mailto:\${contact.email}\`} style={{ color: '#000091' }}>
              {contact.email}
            </a>
          </div>
        </div>

        {contact.phone && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Téléphone</div>
            <div style={{ fontWeight: '500' }}>{contact.phone}</div>
          </div>
        )}

        {contact.position && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Poste</div>
            <div style={{ fontWeight: '500' }}>{contact.position}</div>
          </div>
        )}

        {company && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#f6f6f6', borderRadius: '4px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Entreprise</div>
            <div style={{ fontWeight: '600', color: '#000091' }}>{company.name}</div>
            {company.industry && <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{company.industry}</div>}
          </div>
        )}
      </div>
    </Card>
  );
};
        `.trim(),
      },

      // ===== COMPOSITE: Opportunity Card =====
      {
        template_id: 'opportunity-card',
        template_name: 'Opportunity Card',
        category: 'composite',
        description: 'Detailed opportunity card with company and contact info',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = ({ opportunity }) => {
  const [Card, setCard] = useState(null);
  const [Badge, setBadge] = useState(null);
  const [company, setCompany] = useState(null);
  const [contact, setContact] = useState(null);

  useEffect(() => {
    const loadComponents = async () => {
      const [CardComp, BadgeComp] = await Promise.all([
        gristAPI.getChildComponent('base-card'),
        gristAPI.getChildComponent('base-badge')
      ]);
      setCard(() => CardComp);
      setBadge(() => BadgeComp);
    };
    loadComponents();
  }, []);

  useEffect(() => {
    const loadRelatedData = async () => {
      if (!opportunity) return;
      const [companies, contacts] = await Promise.all([
        gristAPI.getData('Companies'),
        gristAPI.getData('Contacts')
      ]);
      if (opportunity.company_id) {
        setCompany(companies.find(c => c.id === opportunity.company_id));
      }
      if (opportunity.contact_id) {
        setContact(contacts.find(c => c.id === opportunity.contact_id));
      }
    };
    loadRelatedData();
  }, [opportunity]);

  if (!Card || !Badge || !opportunity) {
    return <div>Chargement...</div>;
  }

  const getStageVariant = (stage) => {
    const map = {
      'Prospecting': 'default',
      'Qualification': 'info',
      'Proposal': 'warning',
      'Negotiation': 'warning',
      'Closed Won': 'success',
      'Closed Lost': 'error'
    };
    return map[stage] || 'default';
  };

  return (
    <Card title={opportunity.title}>
      <div style={{ fontFamily: "'Marianne', Arial, sans-serif" }}>
        <div style={{ marginBottom: '16px' }}>
          <Badge label={opportunity.stage} variant={getStageVariant(opportunity.stage)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Montant</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#000091' }}>
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(opportunity.amount || 0)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Probabilité</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#000091' }}>
              {opportunity.probability}%
            </div>
          </div>
        </div>

        {opportunity.expected_close_date && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Clôture prévue</div>
            <div style={{ fontWeight: '500' }}>
              {new Date(opportunity.expected_close_date).toLocaleDateString('fr-FR')}
            </div>
          </div>
        )}

        {company && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#f6f6f6', borderRadius: '4px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Entreprise</div>
            <div style={{ fontWeight: '600' }}>{company.name}</div>
            {contact && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Contact: {contact.first_name} {contact.last_name}
              </div>
            )}
          </div>
        )}

        {opportunity.description && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Description</div>
            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{opportunity.description}</div>
          </div>
        )}
      </div>
    </Card>
  );
};
        `.trim(),
      },

      // ===== COMPOSITE: Activity Card =====
      {
        template_id: 'activity-card',
        template_name: 'Activity Card',
        category: 'composite',
        description: 'Detailed activity card with related entities',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = ({ activity }) => {
  const [Card, setCard] = useState(null);
  const [Badge, setBadge] = useState(null);
  const [company, setCompany] = useState(null);
  const [contact, setContact] = useState(null);
  const [opportunity, setOpportunity] = useState(null);

  useEffect(() => {
    const loadComponents = async () => {
      const [CardComp, BadgeComp] = await Promise.all([
        gristAPI.getChildComponent('base-card'),
        gristAPI.getChildComponent('base-badge')
      ]);
      setCard(() => CardComp);
      setBadge(() => BadgeComp);
    };
    loadComponents();
  }, []);

  useEffect(() => {
    const loadRelatedData = async () => {
      if (!activity) return;
      const [companies, contacts, opps] = await Promise.all([
        gristAPI.getData('Companies'),
        gristAPI.getData('Contacts'),
        gristAPI.getData('Opportunities')
      ]);
      if (activity.company_id) {
        setCompany(companies.find(c => c.id === activity.company_id));
      }
      if (activity.contact_id) {
        setContact(contacts.find(c => c.id === activity.contact_id));
      }
      if (activity.opportunity_id) {
        setOpportunity(opps.find(o => o.id === activity.opportunity_id));
      }
    };
    loadRelatedData();
  }, [activity]);

  if (!Card || !Badge || !activity) {
    return <div>Chargement...</div>;
  }

  const getTypeVariant = (type) => {
    const map = {
      'Call': 'info',
      'Email': 'info',
      'Meeting': 'warning',
      'Task': 'default'
    };
    return map[type] || 'default';
  };

  return (
    <Card title={activity.subject}>
      <div style={{ fontFamily: "'Marianne', Arial, sans-serif" }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <Badge label={activity.type} variant={getTypeVariant(activity.type)} />
          {activity.completed && <Badge label="Terminée" variant="success" />}
        </div>

        {activity.scheduled_date && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Date prévue</div>
            <div style={{ fontWeight: '500' }}>
              {new Date(activity.scheduled_date).toLocaleDateString('fr-FR')}
            </div>
          </div>
        )}

        {activity.description && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Description</div>
            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{activity.description}</div>
          </div>
        )}

        <div style={{ marginTop: '16px', padding: '12px', background: '#f6f6f6', borderRadius: '4px' }}>
          {company && (
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Entreprise: </span>
              <span style={{ fontWeight: '500' }}>{company.name}</span>
            </div>
          )}
          {contact && (
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Contact: </span>
              <span style={{ fontWeight: '500' }}>{contact.first_name} {contact.last_name}</span>
            </div>
          )}
          {opportunity && (
            <div>
              <span style={{ fontSize: '12px', color: '#666' }}>Opportunité: </span>
              <span style={{ fontWeight: '500' }}>{opportunity.title}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
        `.trim(),
      },

      // ===== COMPOSITE: Company List =====
      {
        template_id: 'company-list',
        template_name: 'Company List',
        category: 'composite',
        description: 'Table of companies using DSFR table component',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = ({ onRowClick = null }) => {
  const [Table, setTable] = useState(null);
  const [Badge, setBadge] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComponents = async () => {
      const [TableComp, BadgeComp] = await Promise.all([
        gristAPI.getChildComponent('base-table'),
        gristAPI.getChildComponent('base-badge')
      ]);
      setTable(() => TableComp);
      setBadge(() => BadgeComp);
    };
    loadComponents();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const data = await gristAPI.getData('Companies');
      setCompanies(data);
      setLoading(false);
    };
    loadData();
  }, []);

  if (!Table || !Badge || loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Chargement...</div>;
  }

  const columns = [
    { key: 'name', label: 'Nom', align: 'left' },
    {
      key: 'industry',
      label: 'Secteur',
      align: 'left',
      render: (value) => value ? <Badge label={value} variant="info" size="sm" /> : '-'
    },
    { key: 'size', label: 'Taille', align: 'left' },
    { key: 'country', label: 'Pays', align: 'left' },
    { key: 'city', label: 'Ville', align: 'left' }
  ];

  return (
    <Table
      columns={columns}
      data={companies}
      onRowClick={onRowClick}
      striped={true}
      caption={\`\${companies.length} entreprises\`}
    />
  );
};
        `.trim(),
      },

      // ===== COMPOSITE: Contact List =====
      {
        template_id: 'contact-list',
        template_name: 'Contact List',
        category: 'composite',
        description: 'Table of contacts using DSFR table component',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = ({ onRowClick = null }) => {
  const [Table, setTable] = useState(null);
  const [Badge, setBadge] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComponents = async () => {
      const [TableComp, BadgeComp] = await Promise.all([
        gristAPI.getChildComponent('base-table'),
        gristAPI.getChildComponent('base-badge')
      ]);
      setTable(() => TableComp);
      setBadge(() => BadgeComp);
    };
    loadComponents();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const [contactsData, companiesData] = await Promise.all([
        gristAPI.getData('Contacts'),
        gristAPI.getData('Companies')
      ]);
      setContacts(contactsData);
      setCompanies(companiesData);
      setLoading(false);
    };
    loadData();
  }, []);

  if (!Table || !Badge || loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Chargement...</div>;
  }

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : '-';
  };

  const getStatusVariant = (status) => {
    const map = { 'Active': 'success', 'Inactive': 'default', 'Lead': 'info' };
    return map[status] || 'default';
  };

  const columns = [
    {
      key: 'name',
      label: 'Nom',
      align: 'left',
      render: (_, row) => \`\${row.first_name} \${row.last_name}\`
    },
    { key: 'email', label: 'Email', align: 'left' },
    {
      key: 'company_id',
      label: 'Entreprise',
      align: 'left',
      render: (value) => getCompanyName(value)
    },
    { key: 'position', label: 'Poste', align: 'left' },
    {
      key: 'status',
      label: 'Statut',
      align: 'left',
      render: (value) => value ? <Badge label={value} variant={getStatusVariant(value)} size="sm" /> : '-'
    }
  ];

  return (
    <Table
      columns={columns}
      data={contacts}
      onRowClick={onRowClick}
      striped={true}
      caption={\`\${contacts.length} contacts\`}
    />
  );
};
        `.trim(),
      },

      // ===== COMPOSITE: Opportunity List =====
      {
        template_id: 'opportunity-list',
        template_name: 'Opportunity List',
        category: 'composite',
        description: 'Table of opportunities using DSFR table component',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = ({ onRowClick = null }) => {
  const [Table, setTable] = useState(null);
  const [Badge, setBadge] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComponents = async () => {
      const [TableComp, BadgeComp] = await Promise.all([
        gristAPI.getChildComponent('base-table'),
        gristAPI.getChildComponent('base-badge')
      ]);
      setTable(() => TableComp);
      setBadge(() => BadgeComp);
    };
    loadComponents();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const [oppsData, companiesData] = await Promise.all([
        gristAPI.getData('Opportunities'),
        gristAPI.getData('Companies')
      ]);
      setOpportunities(oppsData);
      setCompanies(companiesData);
      setLoading(false);
    };
    loadData();
  }, []);

  if (!Table || !Badge || loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Chargement...</div>;
  }

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : '-';
  };

  const getStageVariant = (stage) => {
    const map = {
      'Prospecting': 'default',
      'Qualification': 'info',
      'Proposal': 'warning',
      'Negotiation': 'warning',
      'Closed Won': 'success',
      'Closed Lost': 'error'
    };
    return map[stage] || 'default';
  };

  const columns = [
    { key: 'title', label: 'Titre', align: 'left' },
    {
      key: 'company_id',
      label: 'Entreprise',
      align: 'left',
      render: (value) => getCompanyName(value)
    },
    {
      key: 'amount',
      label: 'Montant',
      align: 'right',
      render: (value) => new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
      }).format(value || 0)
    },
    {
      key: 'probability',
      label: 'Probabilité',
      align: 'center',
      render: (value) => \`\${value}%\`
    },
    {
      key: 'stage',
      label: 'Statut',
      align: 'left',
      render: (value) => <Badge label={value} variant={getStageVariant(value)} size="sm" />
    },
    {
      key: 'expected_close_date',
      label: 'Clôture prévue',
      align: 'left',
      render: (value) => value ? new Date(value).toLocaleDateString('fr-FR') : '-'
    }
  ];

  return (
    <Table
      columns={columns}
      data={opportunities}
      onRowClick={onRowClick}
      striped={true}
      caption={\`\${opportunities.length} opportunités\`}
    />
  );
};
        `.trim(),
      },

      // ===== COMPOSITE: Activity List =====
      {
        template_id: 'activity-list',
        template_name: 'Activity List',
        category: 'composite',
        description: 'Table of activities using DSFR table component',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = ({ onRowClick = null }) => {
  const [Table, setTable] = useState(null);
  const [Badge, setBadge] = useState(null);
  const [activities, setActivities] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComponents = async () => {
      const [TableComp, BadgeComp] = await Promise.all([
        gristAPI.getChildComponent('base-table'),
        gristAPI.getChildComponent('base-badge')
      ]);
      setTable(() => TableComp);
      setBadge(() => BadgeComp);
    };
    loadComponents();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const [activitiesData, companiesData] = await Promise.all([
        gristAPI.getData('Activities'),
        gristAPI.getData('Companies')
      ]);
      setActivities(activitiesData);
      setCompanies(companiesData);
      setLoading(false);
    };
    loadData();
  }, []);

  if (!Table || !Badge || loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Chargement...</div>;
  }

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : '-';
  };

  const getTypeVariant = (type) => {
    const map = {
      'Call': 'info',
      'Email': 'info',
      'Meeting': 'warning',
      'Task': 'default'
    };
    return map[type] || 'default';
  };

  const columns = [
    { key: 'subject', label: 'Sujet', align: 'left' },
    {
      key: 'type',
      label: 'Type',
      align: 'left',
      render: (value) => <Badge label={value} variant={getTypeVariant(value)} size="sm" />
    },
    {
      key: 'company_id',
      label: 'Entreprise',
      align: 'left',
      render: (value) => value ? getCompanyName(value) : '-'
    },
    {
      key: 'scheduled_date',
      label: 'Date prévue',
      align: 'left',
      render: (value) => value ? new Date(value).toLocaleDateString('fr-FR') : '-'
    },
    {
      key: 'completed',
      label: 'Statut',
      align: 'center',
      render: (value) => value ? <Badge label="Terminée" variant="success" size="sm" /> : <Badge label="En cours" variant="default" size="sm" />
    }
  ];

  return (
    <Table
      columns={columns}
      data={activities}
      onRowClick={onRowClick}
      striped={true}
      caption={\`\${activities.length} activités\`}
    />
  );
};
        `.trim(),
      },

      // ========================================
      // FUNCTIONAL COMPONENTS (Complete Features)
      // ========================================

      // ===== FUNCTIONAL: Dynamic Form =====
      {
        template_id: 'dynamic-form',
        template_name: 'Dynamic Form',
        category: 'functional',
        description: 'Auto-generated form based on entity type with validation',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = ({
  entityType = 'Company',
  mode = 'create',
  initialData = {},
  onSuccess = () => {},
  onCancel = () => {}
}) => {
  const [Input, setInput] = useState(null);
  const [Select, setSelect] = useState(null);
  const [Button, setButton] = useState(null);
  const [Alert, setAlert] = useState(null);
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);

  useEffect(() => {
    const loadComponents = async () => {
      const [InputComp, SelectComp, ButtonComp, AlertComp] = await Promise.all([
        gristAPI.getChildComponent('base-input'),
        gristAPI.getChildComponent('base-select'),
        gristAPI.getChildComponent('base-button'),
        gristAPI.getChildComponent('base-alert')
      ]);
      setInput(() => InputComp);
      setSelect(() => SelectComp);
      setButton(() => ButtonComp);
      setAlert(() => AlertComp);
    };
    loadComponents();
  }, []);

  useEffect(() => {
    const loadReferenceData = async () => {
      const [companiesData, contactsData, oppsData] = await Promise.all([
        gristAPI.getData('Companies'),
        gristAPI.getData('Contacts'),
        gristAPI.getData('Opportunities')
      ]);
      setCompanies(companiesData);
      setContacts(contactsData);
      setOpportunities(oppsData);
    };
    loadReferenceData();
  }, []);

  if (!Input || !Select || !Button || !Alert) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Chargement du formulaire...</div>;
  }

  const entitySchemas = {
    Company: {
      tableName: 'Companies',
      fields: [
        { key: 'name', label: 'Nom', type: 'text', required: true },
        {
          key: 'industry',
          label: 'Secteur',
          type: 'select',
          options: [
            { value: 'Technology', label: 'Technologie' },
            { value: 'Finance', label: 'Finance' },
            { value: 'Healthcare', label: 'Santé' },
            { value: 'Retail', label: 'Commerce' },
            { value: 'Manufacturing', label: 'Industrie' },
            { value: 'Other', label: 'Autre' }
          ]
        },
        {
          key: 'size',
          label: 'Taille',
          type: 'select',
          options: [
            { value: '1-10', label: '1-10 employés' },
            { value: '11-50', label: '11-50 employés' },
            { value: '51-200', label: '51-200 employés' },
            { value: '201-500', label: '201-500 employés' },
            { value: '500+', label: '500+ employés' }
          ]
        },
        { key: 'website', label: 'Site web', type: 'text' },
        { key: 'phone', label: 'Téléphone', type: 'tel' },
        { key: 'address', label: 'Adresse', type: 'text' },
        { key: 'city', label: 'Ville', type: 'text' },
        { key: 'country', label: 'Pays', type: 'text' }
      ]
    },
    Contact: {
      tableName: 'Contacts',
      fields: [
        { key: 'first_name', label: 'Prénom', type: 'text', required: true },
        { key: 'last_name', label: 'Nom', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'email', required: true },
        { key: 'phone', label: 'Téléphone', type: 'tel' },
        {
          key: 'company_id',
          label: 'Entreprise',
          type: 'select',
          options: companies.map(c => ({ value: c.id, label: c.name })),
          required: true
        },
        { key: 'position', label: 'Poste', type: 'text' },
        {
          key: 'status',
          label: 'Statut',
          type: 'select',
          options: [
            { value: 'Active', label: 'Actif' },
            { value: 'Inactive', label: 'Inactif' },
            { value: 'Lead', label: 'Prospect' }
          ]
        }
      ]
    },
    Opportunity: {
      tableName: 'Opportunities',
      fields: [
        { key: 'title', label: 'Titre', type: 'text', required: true },
        {
          key: 'company_id',
          label: 'Entreprise',
          type: 'select',
          options: companies.map(c => ({ value: c.id, label: c.name })),
          required: true
        },
        {
          key: 'contact_id',
          label: 'Contact',
          type: 'select',
          options: contacts.map(c => ({ value: c.id, label: \`\${c.first_name} \${c.last_name}\` }))
        },
        { key: 'amount', label: 'Montant (€)', type: 'number', required: true },
        {
          key: 'stage',
          label: 'Étape',
          type: 'select',
          required: true,
          options: [
            { value: 'Prospecting', label: 'Prospection' },
            { value: 'Qualification', label: 'Qualification' },
            { value: 'Proposal', label: 'Proposition' },
            { value: 'Negotiation', label: 'Négociation' },
            { value: 'Closed Won', label: 'Gagné' },
            { value: 'Closed Lost', label: 'Perdu' }
          ]
        },
        { key: 'probability', label: 'Probabilité (%)', type: 'number', required: true },
        { key: 'expected_close_date', label: 'Date de clôture prévue', type: 'date' },
        { key: 'description', label: 'Description', type: 'text' }
      ]
    },
    Activity: {
      tableName: 'Activities',
      fields: [
        { key: 'subject', label: 'Sujet', type: 'text', required: true },
        {
          key: 'type',
          label: 'Type',
          type: 'select',
          required: true,
          options: [
            { value: 'Call', label: 'Appel' },
            { value: 'Email', label: 'Email' },
            { value: 'Meeting', label: 'Réunion' },
            { value: 'Task', label: 'Tâche' }
          ]
        },
        {
          key: 'company_id',
          label: 'Entreprise',
          type: 'select',
          options: companies.map(c => ({ value: c.id, label: c.name }))
        },
        {
          key: 'contact_id',
          label: 'Contact',
          type: 'select',
          options: contacts.map(c => ({ value: c.id, label: \`\${c.first_name} \${c.last_name}\` }))
        },
        {
          key: 'opportunity_id',
          label: 'Opportunité',
          type: 'select',
          options: opportunities.map(o => ({ value: o.id, label: o.title }))
        },
        { key: 'scheduled_date', label: 'Date prévue', type: 'date' },
        { key: 'description', label: 'Description', type: 'text' }
      ]
    }
  };

  const schema = entitySchemas[entityType];

  const validate = () => {
    const newErrors = {};

    schema.fields.forEach(field => {
      if (field.required && !formData[field.key]) {
        newErrors[field.key] = 'Ce champ est requis';
      }

      if (field.type === 'email' && formData[field.key]) {
        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        if (!emailRegex.test(formData[field.key])) {
          newErrors[field.key] = 'Email invalide';
        }
      }

      if (field.type === 'number' && formData[field.key]) {
        if (isNaN(Number(formData[field.key]))) {
          newErrors[field.key] = 'Doit être un nombre';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setErrorMessage('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      if (mode === 'create') {
        await gristAPI.addRecord(schema.tableName, formData);
        setSuccessMessage(\`\${entityType} créé avec succès!\`);
        setFormData({});
      } else {
        await gristAPI.updateRecord(schema.tableName, initialData.id, formData);
        setSuccessMessage(\`\${entityType} mis à jour avec succès!\`);
      }

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      setErrorMessage(\`Erreur: \${error.message}\`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Marianne', Arial, sans-serif", maxWidth: '600px' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '600', color: '#161616' }}>
        {mode === 'create' ? \`Créer \${entityType}\` : \`Éditer \${entityType}\`}
      </h2>

      {successMessage && (
        <Alert type="success" message={successMessage} />
      )}

      {errorMessage && (
        <Alert type="error" message={errorMessage} closable={true} onClose={() => setErrorMessage('')} />
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        {schema.fields.map(field => {
          if (field.type === 'select') {
            return (
              <Select
                key={field.key}
                label={field.label}
                value={formData[field.key] || ''}
                onChange={(value) => setFormData({ ...formData, [field.key]: value })}
                options={field.options}
                required={field.required}
                error={errors[field.key]}
              />
            );
          }

          return (
            <Input
              key={field.key}
              label={field.label}
              type={field.type}
              value={formData[field.key] || ''}
              onChange={(value) => setFormData({ ...formData, [field.key]: value })}
              required={field.required}
              error={errors[field.key]}
            />
          );
        })}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <Button
            type="submit"
            label={loading ? 'Enregistrement...' : 'Enregistrer'}
            variant="primary"
            disabled={loading}
          />
          <Button
            type="button"
            label="Annuler"
            variant="tertiary"
            onClick={onCancel}
            disabled={loading}
          />
        </div>
      </form>
    </div>
  );
};
        `.trim(),
      },

      // ========================================
      // PAGE COMPONENTS
      // ========================================

      // ===== PAGE: Dashboard =====
      {
        template_id: 'page-dashboard',
        template_name: 'Dashboard',
        category: 'pages',
        description: 'CRM Dashboard with key metrics',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = () => {
  const [MetricCard, setMetricCard] = useState(null);
  const [metrics, setMetrics] = useState({ companies: 0, contacts: 0, opportunities: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComponent = async () => {
      const MetricCardComp = await gristAPI.getChildComponent('metric-card');
      setMetricCard(() => MetricCardComp);
    };
    loadComponent();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const companies = await gristAPI.getData('Companies');
        const contacts = await gristAPI.getData('Contacts');
        const opportunities = await gristAPI.getData('Opportunities');

        const revenue = opportunities
          .filter(o => o.stage === 'Closed Won')
          .reduce((sum, o) => sum + (o.amount || 0), 0);

        setMetrics({
          companies: companies.length,
          contacts: contacts.length,
          opportunities: opportunities.length,
          revenue: revenue
        });
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (!MetricCard || loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Chargement...</div>;
  }

  const revenueFormatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(metrics.revenue);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Marianne', Arial, sans-serif" }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', color: '#161616' }}>
        Dashboard CRM
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <MetricCard
          label="Entreprises"
          value={metrics.companies}
          icon="🏢"
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        />
        <MetricCard
          label="Contacts"
          value={metrics.contacts}
          icon="👥"
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        />
        <MetricCard
          label="Opportunités"
          value={metrics.opportunities}
          icon="💼"
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        />
        <MetricCard
          label="Chiffre d'affaires"
          value={revenueFormatted}
          icon="💰"
          gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
        />
      </div>

      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid #e5e5e5',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#161616' }}>
          Bienvenue dans votre CRM
        </h2>
        <p style={{ color: '#666', lineHeight: '1.6', fontSize: '14px' }}>
          Utilisez la navigation ci-dessus pour accéder aux différentes sections de votre CRM.
          Gérez vos entreprises, contacts, opportunités et activités en toute simplicité.
        </p>
      </div>
    </div>
  );
};
        `.trim(),
      },

      // ===== PAGE: Companies =====
      {
        template_id: 'page-companies',
        template_name: 'Entreprises',
        category: 'pages',
        description: 'Companies list and management',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = () => {
  const [CompanyList, setCompanyList] = useState(null);
  const [Button, setButton] = useState(null);
  const [Modal, setModal] = useState(null);
  const [DynamicForm, setDynamicForm] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadComponents = async () => {
      const [ListComp, ButtonComp, ModalComp, FormComp] = await Promise.all([
        gristAPI.getChildComponent('company-list'),
        gristAPI.getChildComponent('base-button'),
        gristAPI.getChildComponent('base-modal'),
        gristAPI.getChildComponent('dynamic-form')
      ]);
      setCompanyList(() => ListComp);
      setButton(() => ButtonComp);
      setModal(() => ModalComp);
      setDynamicForm(() => FormComp);
    };
    loadComponents();
  }, []);

  const handleSuccess = () => {
    setShowModal(false);
    setRefreshKey(prev => prev + 1);
  };

  if (!CompanyList || !Button || !Modal || !DynamicForm) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Chargement...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Marianne', Arial, sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#161616' }}>Entreprises</h1>
        <Button
          label="Ajouter une entreprise"
          variant="primary"
          icon="+"
          onClick={() => setShowModal(true)}
        />
      </div>

      <CompanyList key={refreshKey} />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Créer une entreprise"
        size="md"
      >
        <DynamicForm
          entityType="Company"
          mode="create"
          onSuccess={handleSuccess}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
};
        `.trim(),
      },

      // ===== PAGE: Contacts =====
      {
        template_id: 'page-contacts',
        template_name: 'Contacts',
        category: 'pages',
        description: 'Contacts list with company associations',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = () => {
  const [ContactList, setContactList] = useState(null);
  const [Button, setButton] = useState(null);
  const [Modal, setModal] = useState(null);
  const [DynamicForm, setDynamicForm] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadComponents = async () => {
      const [ListComp, ButtonComp, ModalComp, FormComp] = await Promise.all([
        gristAPI.getChildComponent('contact-list'),
        gristAPI.getChildComponent('base-button'),
        gristAPI.getChildComponent('base-modal'),
        gristAPI.getChildComponent('dynamic-form')
      ]);
      setContactList(() => ListComp);
      setButton(() => ButtonComp);
      setModal(() => ModalComp);
      setDynamicForm(() => FormComp);
    };
    loadComponents();
  }, []);

  const handleSuccess = () => {
    setShowModal(false);
    setRefreshKey(prev => prev + 1);
  };

  if (!ContactList || !Button || !Modal || !DynamicForm) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Chargement...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Marianne', Arial, sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#161616' }}>Contacts</h1>
        <Button
          label="Ajouter un contact"
          variant="primary"
          icon="+"
          onClick={() => setShowModal(true)}
        />
      </div>

      <ContactList key={refreshKey} />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Créer un contact"
        size="md"
      >
        <DynamicForm
          entityType="Contact"
          mode="create"
          onSuccess={handleSuccess}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
};
        `.trim(),
      },

      // ===== PAGE: Opportunities =====
      {
        template_id: 'page-opportunities',
        template_name: 'Opportunités',
        category: 'pages',
        description: 'Opportunities pipeline view',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = () => {
  const [OpportunityList, setOpportunityList] = useState(null);
  const [Button, setButton] = useState(null);
  const [Modal, setModal] = useState(null);
  const [DynamicForm, setDynamicForm] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadComponents = async () => {
      const [ListComp, ButtonComp, ModalComp, FormComp] = await Promise.all([
        gristAPI.getChildComponent('opportunity-list'),
        gristAPI.getChildComponent('base-button'),
        gristAPI.getChildComponent('base-modal'),
        gristAPI.getChildComponent('dynamic-form')
      ]);
      setOpportunityList(() => ListComp);
      setButton(() => ButtonComp);
      setModal(() => ModalComp);
      setDynamicForm(() => FormComp);
    };
    loadComponents();
  }, []);

  const handleSuccess = () => {
    setShowModal(false);
    setRefreshKey(prev => prev + 1);
  };

  if (!OpportunityList || !Button || !Modal || !DynamicForm) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Chargement...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Marianne', Arial, sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#161616' }}>Opportunités</h1>
        <Button
          label="Ajouter une opportunité"
          variant="primary"
          icon="+"
          onClick={() => setShowModal(true)}
        />
      </div>

      <OpportunityList key={refreshKey} />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Créer une opportunité"
        size="md"
      >
        <DynamicForm
          entityType="Opportunity"
          mode="create"
          onSuccess={handleSuccess}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
};
        `.trim(),
      },

      // ===== PAGE: Activities =====
      {
        template_id: 'page-activities',
        template_name: 'Activités',
        category: 'pages',
        description: 'Activities timeline and list',
        is_active: true,
        created_at: now,
        updated_at: now,
        component_code: `
const Component = () => {
  const [ActivityList, setActivityList] = useState(null);
  const [Button, setButton] = useState(null);
  const [Modal, setModal] = useState(null);
  const [DynamicForm, setDynamicForm] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadComponents = async () => {
      const [ListComp, ButtonComp, ModalComp, FormComp] = await Promise.all([
        gristAPI.getChildComponent('activity-list'),
        gristAPI.getChildComponent('base-button'),
        gristAPI.getChildComponent('base-modal'),
        gristAPI.getChildComponent('dynamic-form')
      ]);
      setActivityList(() => ListComp);
      setButton(() => ButtonComp);
      setModal(() => ModalComp);
      setDynamicForm(() => FormComp);
    };
    loadComponents();
  }, []);

  const handleSuccess = () => {
    setShowModal(false);
    setRefreshKey(prev => prev + 1);
  };

  if (!ActivityList || !Button || !Modal || !DynamicForm) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Chargement...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Marianne', Arial, sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#161616' }}>Activités</h1>
        <Button
          label="Ajouter une activité"
          variant="primary"
          icon="+"
          onClick={() => setShowModal(true)}
        />
      </div>

      <ActivityList key={refreshKey} />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Créer une activité"
        size="md"
      >
        <DynamicForm
          entityType="Activity"
          mode="create"
          onSuccess={handleSuccess}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
};
        `.trim(),
      },
    ];
  }

  /**
   * Populate templates table
   */
  private async populateTemplates(): Promise<void> {
    const now = new Date().toISOString();
    const templates = this.getAllTemplateDefinitions(now);

    await this.addRecords('Templates', templates);
    Logger.success(`Templates populated: ${templates.length} components`);
  }

  // ===== COMPANIES DATA =====

  private async populateCompanies(): Promise<void> {
    const now = new Date().toISOString();

    const companies: Partial<CompanyRecord>[] = [
      {
        name: 'Acme Corp',
        industry: 'Technology',
        size: '51-200',
        website: 'https://acme-corp.example',
        phone: '+33 1 42 86 82 00',
        address: '123 Avenue des Champs-Élysées',
        city: 'Paris',
        country: 'France',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Global Industries',
        industry: 'Finance',
        size: '1000+',
        website: 'https://global-ind.example',
        phone: '+33 1 44 13 22 22',
        address: '45 Rue de la Banque',
        city: 'Paris',
        country: 'France',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Tech Solutions',
        industry: 'Technology',
        size: '11-50',
        website: 'https://tech-sol.example',
        phone: '+33 4 78 89 90 90',
        address: '78 Cours Lafayette',
        city: 'Lyon',
        country: 'France',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Health Plus',
        industry: 'Healthcare',
        size: '201-1000',
        website: 'https://health-plus.example',
        phone: '+33 5 56 44 88 88',
        address: '12 Place de la Victoire',
        city: 'Bordeaux',
        country: 'France',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Retail Group',
        industry: 'Retail',
        size: '1000+',
        website: 'https://retail-group.example',
        phone: '+33 3 20 12 34 56',
        address: '34 Rue Faidherbe',
        city: 'Lille',
        country: 'France',
        created_at: now,
        updated_at: now,
      },
    ];

    await this.addRecords('Companies', companies);
    Logger.success(`Companies populated: ${companies.length} records`);
  }

  // ===== CONTACTS DATA =====

  private async populateContacts(): Promise<void> {
    // Fetch companies to get their IDs
    const companies = await this.fetchTable<CompanyRecord>('Companies');

    if (companies.length === 0) {
      Logger.warn('Cannot populate Contacts: Companies table is empty');
      return;
    }

    const now = new Date().toISOString();

    // Find company IDs
    const acmeId = companies.find((c) => c.name === 'Acme Corp')?.id;
    const globalId = companies.find((c) => c.name === 'Global Industries')?.id;
    const techId = companies.find((c) => c.name === 'Tech Solutions')?.id;
    const healthId = companies.find((c) => c.name === 'Health Plus')?.id;
    const retailId = companies.find((c) => c.name === 'Retail Group')?.id;

    if (!acmeId || !globalId || !techId || !healthId || !retailId) {
      Logger.warn('Cannot find all company IDs');
      return;
    }

    const contacts: Partial<ContactRecord>[] = [
      // Acme Corp contacts
      {
        company_id: acmeId,
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@acme-corp.example',
        phone: '+33 6 12 34 56 78',
        position: 'CTO',
        status: 'Active',
        created_at: now,
        updated_at: now,
      },
      {
        company_id: acmeId,
        first_name: 'Marie',
        last_name: 'Martin',
        email: 'marie.martin@acme-corp.example',
        phone: '+33 6 23 45 67 89',
        position: 'CEO',
        status: 'Active',
        created_at: now,
        updated_at: now,
      },
      // Global Industries contacts
      {
        company_id: globalId,
        first_name: 'Pierre',
        last_name: 'Bernard',
        email: 'pierre.bernard@global-ind.example',
        phone: '+33 6 34 56 78 90',
        position: 'CFO',
        status: 'Active',
        created_at: now,
        updated_at: now,
      },
      {
        company_id: globalId,
        first_name: 'Sophie',
        last_name: 'Dubois',
        email: 'sophie.dubois@global-ind.example',
        phone: '+33 6 45 67 89 01',
        position: 'VP Sales',
        status: 'Active',
        created_at: now,
        updated_at: now,
      },
      // Tech Solutions contacts
      {
        company_id: techId,
        first_name: 'Luc',
        last_name: 'Petit',
        email: 'luc.petit@tech-sol.example',
        phone: '+33 6 56 78 90 12',
        position: 'Lead Developer',
        status: 'Active',
        created_at: now,
        updated_at: now,
      },
      {
        company_id: techId,
        first_name: 'Emma',
        last_name: 'Roux',
        email: 'emma.roux@tech-sol.example',
        phone: '+33 6 67 89 01 23',
        position: 'Product Manager',
        status: 'Active',
        created_at: now,
        updated_at: now,
      },
      // Health Plus contacts
      {
        company_id: healthId,
        first_name: 'Thomas',
        last_name: 'Moreau',
        email: 'thomas.moreau@health-plus.example',
        phone: '+33 6 78 90 12 34',
        position: 'Director',
        status: 'Active',
        created_at: now,
        updated_at: now,
      },
      {
        company_id: healthId,
        first_name: 'Julie',
        last_name: 'Laurent',
        email: 'julie.laurent@health-plus.example',
        phone: '+33 6 89 01 23 45',
        position: 'Head of Operations',
        status: 'Lead',
        created_at: now,
        updated_at: now,
      },
      // Retail Group contacts
      {
        company_id: retailId,
        first_name: 'Nicolas',
        last_name: 'Simon',
        email: 'nicolas.simon@retail-group.example',
        phone: '+33 6 90 12 34 56',
        position: 'Purchasing Manager',
        status: 'Active',
        created_at: now,
        updated_at: now,
      },
      {
        company_id: retailId,
        first_name: 'Camille',
        last_name: 'Michel',
        email: 'camille.michel@retail-group.example',
        phone: '+33 6 01 23 45 67',
        position: 'Store Manager',
        status: 'Inactive',
        created_at: now,
        updated_at: now,
      },
    ];

    await this.addRecords('Contacts', contacts);
    Logger.success(`Contacts populated: ${contacts.length} records`);
  }

  // ===== OPPORTUNITIES DATA =====

  private async populateOpportunities(): Promise<void> {
    // Fetch companies and contacts to get their IDs
    const companies = await this.fetchTable<CompanyRecord>('Companies');
    const contacts = await this.fetchTable<ContactRecord>('Contacts');

    if (companies.length === 0 || contacts.length === 0) {
      Logger.warn('Cannot populate Opportunities: Companies or Contacts table is empty');
      return;
    }

    const now = new Date().toISOString();

    // Find company IDs
    const acmeId = companies.find((c) => c.name === 'Acme Corp')?.id;
    const globalId = companies.find((c) => c.name === 'Global Industries')?.id;
    const techId = companies.find((c) => c.name === 'Tech Solutions')?.id;
    const healthId = companies.find((c) => c.name === 'Health Plus')?.id;
    const retailId = companies.find((c) => c.name === 'Retail Group')?.id;

    // Find contact IDs
    const jeanId = contacts.find((c) => c.email === 'jean.dupont@acme-corp.example')?.id;
    const marieId = contacts.find((c) => c.email === 'marie.martin@acme-corp.example')?.id;
    const pierreId = contacts.find((c) => c.email === 'pierre.bernard@global-ind.example')?.id;
    const sophieId = contacts.find((c) => c.email === 'sophie.dubois@global-ind.example')?.id;
    const lucId = contacts.find((c) => c.email === 'luc.petit@tech-sol.example')?.id;
    const thomasId = contacts.find((c) => c.email === 'thomas.moreau@health-plus.example')?.id;
    const nicolasId = contacts.find((c) => c.email === 'nicolas.simon@retail-group.example')?.id;

    if (!acmeId || !jeanId) {
      Logger.warn('Cannot find all required IDs for Opportunities');
      return;
    }

    const opportunities: Partial<OpportunityRecord>[] = [
      {
        company_id: acmeId,
        contact_id: jeanId,
        title: 'Cloud Infrastructure Migration',
        amount: 150000,
        stage: 'Proposal',
        probability: 60,
        expected_close_date: '2025-12-31',
        description: 'Migration vers infrastructure cloud AWS',
        created_at: now,
        updated_at: now,
      },
      {
        company_id: acmeId,
        contact_id: marieId,
        title: 'Enterprise Software License',
        amount: 75000,
        stage: 'Negotiation',
        probability: 80,
        expected_close_date: '2025-11-30',
        description: 'Licence logicielle pour 200 utilisateurs',
        created_at: now,
        updated_at: now,
      },
      {
        company_id: globalId,
        contact_id: pierreId,
        title: 'Financial System Upgrade',
        amount: 250000,
        stage: 'Qualification',
        probability: 40,
        expected_close_date: '2026-02-28',
        description: 'Mise à niveau du système financier',
        created_at: now,
        updated_at: now,
      },
      {
        company_id: globalId,
        contact_id: sophieId,
        title: 'CRM Implementation',
        amount: 90000,
        stage: 'Closed Won',
        probability: 100,
        expected_close_date: '2025-11-15',
        actual_close_date: '2025-11-14',
        description: 'Implémentation CRM Salesforce',
        created_at: now,
        updated_at: now,
      },
      {
        company_id: techId,
        contact_id: lucId,
        title: 'DevOps Consulting',
        amount: 45000,
        stage: 'Prospecting',
        probability: 20,
        expected_close_date: '2026-01-31',
        description: 'Consulting DevOps et CI/CD',
        created_at: now,
        updated_at: now,
      },
      {
        company_id: healthId,
        contact_id: thomasId,
        title: 'Patient Management System',
        amount: 180000,
        stage: 'Proposal',
        probability: 50,
        expected_close_date: '2025-12-15',
        description: 'Système de gestion des patients',
        created_at: now,
        updated_at: now,
      },
      {
        company_id: retailId,
        contact_id: nicolasId,
        title: 'E-commerce Platform',
        amount: 120000,
        stage: 'Negotiation',
        probability: 70,
        expected_close_date: '2025-11-25',
        description: 'Plateforme e-commerce omnicanale',
        created_at: now,
        updated_at: now,
      },
      {
        company_id: retailId,
        contact_id: nicolasId,
        title: 'Inventory Management System',
        amount: 65000,
        stage: 'Closed Lost',
        probability: 0,
        expected_close_date: '2025-10-31',
        actual_close_date: '2025-11-01',
        description: 'Système de gestion des stocks',
        created_at: now,
        updated_at: now,
      },
    ];

    await this.addRecords('Opportunities', opportunities);
    Logger.success(`Opportunities populated: ${opportunities.length} records`);
  }

  // ===== ACTIVITIES DATA =====

  private async populateActivities(): Promise<void> {
    // Fetch all related records
    const companies = await this.fetchTable<CompanyRecord>('Companies');
    const contacts = await this.fetchTable<ContactRecord>('Contacts');
    const opportunities = await this.fetchTable<OpportunityRecord>('Opportunities');

    if (companies.length === 0 || contacts.length === 0 || opportunities.length === 0) {
      Logger.warn('Cannot populate Activities: Required tables are empty');
      return;
    }

    const now = new Date().toISOString();

    // Find IDs for demo data
    const acmeId = companies.find((c) => c.name === 'Acme Corp')?.id;
    const globalId = companies.find((c) => c.name === 'Global Industries')?.id;
    const techId = companies.find((c) => c.name === 'Tech Solutions')?.id;

    const jeanId = contacts.find((c) => c.email === 'jean.dupont@acme-corp.example')?.id;
    const marieId = contacts.find((c) => c.email === 'marie.martin@acme-corp.example')?.id;
    const pierreId = contacts.find((c) => c.email === 'pierre.bernard@global-ind.example')?.id;
    const sophieId = contacts.find((c) => c.email === 'sophie.dubois@global-ind.example')?.id;
    const lucId = contacts.find((c) => c.email === 'luc.petit@tech-sol.example')?.id;

    const cloudOppId = opportunities.find((o) => o.title === 'Cloud Infrastructure Migration')?.id;
    const licenseOppId = opportunities.find((o) => o.title === 'Enterprise Software License')?.id;
    const financialOppId = opportunities.find((o) => o.title === 'Financial System Upgrade')?.id;
    const crmOppId = opportunities.find((o) => o.title === 'CRM Implementation')?.id;

    if (!acmeId || !jeanId || !cloudOppId) {
      Logger.warn('Cannot find all required IDs for Activities');
      return;
    }

    const activities: Partial<ActivityRecord>[] = [
      // Calls
      {
        company_id: acmeId,
        contact_id: jeanId,
        opportunity_id: cloudOppId,
        type: 'Call',
        subject: 'Initial discovery call',
        description: 'Discussed cloud migration requirements and timeline',
        scheduled_date: '2025-11-10T10:00:00Z',
        completed: true,
        created_at: now,
      },
      {
        company_id: acmeId,
        contact_id: marieId,
        opportunity_id: licenseOppId,
        type: 'Call',
        subject: 'Follow-up on license proposal',
        description: 'Reviewed pricing and terms',
        scheduled_date: '2025-11-15T14:00:00Z',
        completed: true,
        created_at: now,
      },
      {
        company_id: globalId,
        contact_id: pierreId,
        opportunity_id: financialOppId,
        type: 'Call',
        subject: 'Technical requirements call',
        description: 'Discussed integration requirements',
        scheduled_date: '2025-11-20T11:00:00Z',
        completed: false,
        created_at: now,
      },
      // Emails
      {
        company_id: acmeId,
        contact_id: jeanId,
        opportunity_id: cloudOppId,
        type: 'Email',
        subject: 'Cloud migration proposal sent',
        description: 'Sent detailed proposal document',
        scheduled_date: '2025-11-12T09:00:00Z',
        completed: true,
        created_at: now,
      },
      {
        company_id: globalId,
        contact_id: sophieId,
        opportunity_id: crmOppId,
        type: 'Email',
        subject: 'Contract signed - next steps',
        description: 'Contract signed, kickoff meeting scheduled',
        scheduled_date: '2025-11-14T15:30:00Z',
        completed: true,
        created_at: now,
      },
      {
        company_id: techId,
        contact_id: lucId,
        type: 'Email',
        subject: 'Introduction email',
        description: 'Initial outreach about DevOps services',
        scheduled_date: '2025-11-16T10:00:00Z',
        completed: true,
        created_at: now,
      },
      // Meetings
      {
        company_id: acmeId,
        contact_id: jeanId,
        opportunity_id: cloudOppId,
        type: 'Meeting',
        subject: 'Technical workshop',
        description: 'Deep dive into AWS architecture',
        scheduled_date: '2025-11-18T13:00:00Z',
        completed: false,
        created_at: now,
      },
      {
        company_id: acmeId,
        contact_id: marieId,
        opportunity_id: licenseOppId,
        type: 'Meeting',
        subject: 'Executive presentation',
        description: 'Present solution to C-level executives',
        scheduled_date: '2025-11-22T15:00:00Z',
        completed: false,
        created_at: now,
      },
      {
        company_id: globalId,
        contact_id: sophieId,
        opportunity_id: crmOppId,
        type: 'Meeting',
        subject: 'Project kickoff',
        description: 'CRM implementation kickoff meeting',
        scheduled_date: '2025-11-17T10:00:00Z',
        completed: false,
        created_at: now,
      },
      // Tasks
      {
        company_id: acmeId,
        contact_id: jeanId,
        opportunity_id: cloudOppId,
        type: 'Task',
        subject: 'Prepare technical documentation',
        description: 'Create detailed technical architecture document',
        scheduled_date: '2025-11-19T00:00:00Z',
        completed: false,
        created_at: now,
      },
      {
        company_id: globalId,
        contact_id: pierreId,
        opportunity_id: financialOppId,
        type: 'Task',
        subject: 'Review integration specs',
        description: 'Analyze current financial system integration points',
        scheduled_date: '2025-11-21T00:00:00Z',
        completed: false,
        created_at: now,
      },
      // Notes
      {
        company_id: acmeId,
        contact_id: jeanId,
        type: 'Note',
        subject: 'Contact preferences',
        description: 'Prefers email communication, available Tue-Thu afternoons',
        scheduled_date: now,
        completed: true,
        created_at: now,
      },
      {
        company_id: globalId,
        contact_id: sophieId,
        type: 'Note',
        subject: 'Decision maker',
        description: 'Final approval required from CFO Pierre Bernard',
        scheduled_date: now,
        completed: true,
        created_at: now,
      },
      {
        company_id: techId,
        contact_id: lucId,
        type: 'Note',
        subject: 'Tech stack',
        description: 'Using Docker, Kubernetes, Jenkins for CI/CD',
        scheduled_date: now,
        completed: true,
        created_at: now,
      },
      {
        company_id: acmeId,
        type: 'Note',
        subject: 'Company research',
        description: 'Strong presence in European market, expanding to Asia',
        scheduled_date: now,
        completed: true,
        created_at: now,
      },
    ];

    await this.addRecords('Activities', activities);
    Logger.success(`Activities populated: ${activities.length} records`);
  }
}

export default GristIntegrationManager;
