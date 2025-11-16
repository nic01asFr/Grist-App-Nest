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

    const hasCompanies = await this.tableExists('Companies');
    const hasContacts = await this.tableExists('Contacts');
    const hasOpportunities = await this.tableExists('Opportunities');
    const hasActivities = await this.tableExists('Activities');
    const hasTemplates = await this.tableExists('Templates');
    const hasAppConfig = await this.tableExists('AppConfig');

    if (!hasCompanies || !hasContacts || !hasOpportunities || !hasActivities || !hasTemplates || !hasAppConfig) {
      Logger.log('📦', 'CRM tables not found, initializing...');
      await this.initializeDemoData();
      return true;
    } else {
      Logger.log('✅', 'CRM data already exists');
      return false;
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

  private async populateTemplates(): Promise<void> {
    const now = new Date().toISOString();

    const templates: Partial<TemplateRecord>[] = [
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
  const [metrics, setMetrics] = useState({ companies: 0, contacts: 0, opportunities: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>Dashboard CRM</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Entreprises</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', marginTop: '8px' }}>{metrics.companies}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Contacts</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', marginTop: '8px' }}>{metrics.contacts}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Opportunités</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', marginTop: '8px' }}>{metrics.opportunities}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Chiffre d'affaires</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', marginTop: '8px' }}>
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(metrics.revenue)}
          </div>
        </div>
      </div>

      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Bienvenue dans votre CRM</h2>
        <p style={{ color: '#666', lineHeight: '1.6' }}>
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
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await gristAPI.getData('Companies');
        setCompanies(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading companies:', error);
        setLoading(false);
      }
    };
    loadCompanies();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Entreprises</h1>
        <div style={{ color: '#666' }}>{companies.length} entreprises</div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#495057' }}>Nom</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#495057' }}>Secteur</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#495057' }}>Taille</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#495057' }}>Ville</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#495057' }}>Pays</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company, index) => (
              <tr
                key={company.id}
                style={{
                  borderBottom: '1px solid #e9ecef',
                  background: index % 2 === 0 ? 'white' : '#f8f9fa',
                  transition: 'background 0.2s'
                }}
              >
                <td style={{ padding: '16px', fontWeight: '500' }}>{company.name}</td>
                <td style={{ padding: '16px', color: '#666' }}>{company.industry || '-'}</td>
                <td style={{ padding: '16px', color: '#666' }}>{company.size || '-'}</td>
                <td style={{ padding: '16px', color: '#666' }}>{company.city || '-'}</td>
                <td style={{ padding: '16px', color: '#666' }}>{company.country || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [contactsData, companiesData] = await Promise.all([
          gristAPI.getData('Contacts'),
          gristAPI.getData('Companies')
        ]);
        setContacts(contactsData);
        setCompanies(companiesData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading contacts:', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getCompanyName = useCallback((companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : '-';
  }, [companies]);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  const getStatusColor = (status) => {
    const colors = {
      'Active': '#28a745',
      'Lead': '#ffc107',
      'Inactive': '#6c757d'
    };
    return colors[status] || '#6c757d';
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Contacts</h1>
        <div style={{ color: '#666' }}>{contacts.length} contacts</div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#495057' }}>Nom</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#495057' }}>Email</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#495057' }}>Entreprise</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#495057' }}>Position</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#495057' }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact, index) => (
              <tr
                key={contact.id}
                style={{
                  borderBottom: '1px solid #e9ecef',
                  background: index % 2 === 0 ? 'white' : '#f8f9fa'
                }}
              >
                <td style={{ padding: '16px', fontWeight: '500' }}>
                  {contact.first_name} {contact.last_name}
                </td>
                <td style={{ padding: '16px', color: '#666', fontSize: '14px' }}>{contact.email}</td>
                <td style={{ padding: '16px', color: '#666' }}>{getCompanyName(contact.company_id)}</td>
                <td style={{ padding: '16px', color: '#666' }}>{contact.position || '-'}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: getStatusColor(contact.status) + '20',
                    color: getStatusColor(contact.status)
                  }}>
                    {contact.status || '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  const [opportunities, setOpportunities] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [oppsData, companiesData] = await Promise.all([
          gristAPI.getData('Opportunities'),
          gristAPI.getData('Companies')
        ]);
        setOpportunities(oppsData);
        setCompanies(companiesData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading opportunities:', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getCompanyName = useCallback((companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : '-';
  }, [companies]);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  const getStageColor = (stage) => {
    const colors = {
      'Prospecting': '#6c757d',
      'Qualification': '#17a2b8',
      'Proposal': '#ffc107',
      'Negotiation': '#fd7e14',
      'Closed Won': '#28a745',
      'Closed Lost': '#dc3545'
    };
    return colors[stage] || '#6c757d';
  };

  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
  const avgProbability = opportunities.length > 0
    ? Math.round(opportunities.reduce((sum, opp) => sum + (opp.probability || 0), 0) / opportunities.length)
    : 0;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Opportunités</h1>
        <div style={{ display: 'flex', gap: '24px', color: '#666' }}>
          <div>
            <span style={{ fontSize: '14px' }}>Valeur totale: </span>
            <span style={{ fontWeight: 'bold', color: '#000' }}>
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalValue)}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '14px' }}>Probabilité moy: </span>
            <span style={{ fontWeight: 'bold', color: '#000' }}>{avgProbability}%</span>
          </div>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#495057' }}>Titre</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#495057' }}>Entreprise</th>
              <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', fontSize: '14px', color: '#495057' }}>Montant</th>
              <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', fontSize: '14px', color: '#495057' }}>Probabilité</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#495057' }}>Statut</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#495057' }}>Clôture prévue</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opp, index) => (
              <tr
                key={opp.id}
                style={{
                  borderBottom: '1px solid #e9ecef',
                  background: index % 2 === 0 ? 'white' : '#f8f9fa'
                }}
              >
                <td style={{ padding: '16px', fontWeight: '500' }}>{opp.title}</td>
                <td style={{ padding: '16px', color: '#666' }}>{getCompanyName(opp.company_id)}</td>
                <td style={{ padding: '16px', textAlign: 'right', fontWeight: '500' }}>
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(opp.amount || 0)}
                </td>
                <td style={{ padding: '16px', textAlign: 'center', color: '#666' }}>{opp.probability}%</td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: getStageColor(opp.stage) + '20',
                    color: getStageColor(opp.stage)
                  }}>
                    {opp.stage}
                  </span>
                </td>
                <td style={{ padding: '16px', color: '#666', fontSize: '14px' }}>
                  {opp.expected_close_date ? new Date(opp.expected_close_date).toLocaleDateString('fr-FR') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  const [activities, setActivities] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [activitiesData, companiesData, contactsData] = await Promise.all([
          gristAPI.getData('Activities'),
          gristAPI.getData('Companies'),
          gristAPI.getData('Contacts')
        ]);

        // Sort by scheduled date (most recent first)
        activitiesData.sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date));

        setActivities(activitiesData);
        setCompanies(companiesData);
        setContacts(contactsData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading activities:', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getCompanyName = useCallback((companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : '';
  }, [companies]);

  const getContactName = useCallback((contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? \`\${contact.first_name} \${contact.last_name}\` : '';
  }, [contacts]);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  const getTypeIcon = (type) => {
    const icons = {
      'Call': '📞',
      'Email': '📧',
      'Meeting': '🤝',
      'Task': '✅',
      'Note': '📝'
    };
    return icons[type] || '📋';
  };

  const getTypeColor = (type) => {
    const colors = {
      'Call': '#17a2b8',
      'Email': '#6f42c1',
      'Meeting': '#fd7e14',
      'Task': '#20c997',
      'Note': '#6c757d'
    };
    return colors[type] || '#6c757d';
  };

  const completedCount = activities.filter(a => a.completed).length;
  const pendingCount = activities.length - completedCount;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Activités</h1>
        <div style={{ display: 'flex', gap: '24px', color: '#666' }}>
          <div><span style={{ fontWeight: 'bold', color: '#28a745' }}>{completedCount}</span> terminées</div>
          <div><span style={{ fontWeight: 'bold', color: '#ffc107' }}>{pendingCount}</span> en cours</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activities.map((activity) => (
          <div
            key={activity.id}
            style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              padding: '20px',
              borderLeft: \`4px solid \${getTypeColor(activity.type)}\`,
              opacity: activity.completed ? 0.7 : 1
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>{getTypeIcon(activity.type)}</span>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{activity.subject}</h3>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {getCompanyName(activity.company_id)}
                    {activity.contact_id && \` • \${getContactName(activity.contact_id)}\`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: getTypeColor(activity.type) + '20',
                  color: getTypeColor(activity.type)
                }}>
                  {activity.type}
                </span>
                {activity.completed && (
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: '#28a74520',
                    color: '#28a745'
                  }}>
                    ✓ Terminé
                  </span>
                )}
              </div>
            </div>

            {activity.description && (
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px', lineHeight: '1.5' }}>
                {activity.description}
              </p>
            )}

            <div style={{ fontSize: '13px', color: '#999' }}>
              {new Date(activity.scheduled_date).toLocaleString('fr-FR', {
                dateStyle: 'long',
                timeStyle: 'short'
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
        `.trim(),
      },
    ];

    await this.addRecords('Templates', templates);
    Logger.success(`Templates populated: ${templates.length} page components`);
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
