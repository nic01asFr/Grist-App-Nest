/**
 * Grist Integration Manager
 *
 * Manages auto-initialization of demo data:
 * - Checks if tables exist
 * - Creates schema if needed
 * - Populates with demo data
 */

import GristSchemaManager from './GristSchemaManager';
import Logger from './Logger';
import type {
  ConfigRecord,
  PageRecord,
  TemplateRecord,
  ClientRecord,
  ProductRecord,
  SaleRecord,
} from './types';

class GristIntegrationManager extends GristSchemaManager {
  /**
   * Check and initialize demo data if document is empty
   */
  async checkAndInitializeDemoData(): Promise<boolean> {
    Logger.log('ℹ️', 'Checking for demo data...');

    const hasConfig = await this.tableExists('Config');
    const hasPages = await this.tableExists('Pages');
    const hasTemplates = await this.tableExists('Templates');
    const hasClients = await this.tableExists('Clients');
    const hasProduits = await this.tableExists('Produits');

    if (!hasConfig || !hasPages || !hasTemplates || !hasClients || !hasProduits) {
      Logger.log('📦', 'Demo data not found, initializing...');
      await this.initializeDemoData();
      return true;
    } else {
      Logger.log('✅', 'Demo data already exists');
      return false;
    }
  }

  /**
   * Initialize complete demo data
   */
  private async initializeDemoData(): Promise<void> {
    Logger.log('🎬', 'Initializing demo data');

    try {
      // 1. Create complete schema with relations
      await this.createCompleteSchema();

      // 2. Populate tables in correct order (respecting FK constraints)
      await this.populateConfig();
      await this.populatePages();
      await this.populateTemplates();
      await this.populateClients();
      await this.populateProduits();
      await this.populateVentes(); // Depends on Clients & Produits

      Logger.success('🎉 Demo data initialization complete');
    } catch (error) {
      Logger.error('Error initializing demo data:', error);
      throw error;
    }
  }

  // ===== CONFIG DATA =====

  private async populateConfig(): Promise<void> {
    const config: Partial<ConfigRecord>[] = [
      {
        config_key: 'app_name',
        config_value: 'Grist App Nest',
        config_type: 'text',
        description: 'Application name',
      },
      {
        config_key: 'app_logo',
        config_value: '🪺',
        config_type: 'text',
        description: 'Application logo emoji',
      },
      {
        config_key: 'default_page',
        config_value: 'home',
        config_type: 'text',
        description: 'Default page ID to load',
      },
      {
        config_key: 'pages_order',
        config_value: '["home","clients","products","sales"]',
        config_type: 'json',
        description: 'Order of pages in navbar',
      },
    ];

    await this.addRecords('Config', config);
    Logger.success('Config populated');
  }

  // ===== PAGES DATA (will be populated dynamically in the future) =====

  private async populatePages(): Promise<void> {
    // Pages will be created by the application
    // For now we just log that we're ready
    Logger.info('Pages table ready (will be populated by app)');
  }

  // ===== TEMPLATES DATA (will be populated dynamically in the future) =====

  private async populateTemplates(): Promise<void> {
    // Templates will be created by the application
    // For now we just log that we're ready
    Logger.info('Templates table ready (will be populated by app)');
  }

  // ===== CLIENTS DATA =====

  private async populateClients(): Promise<void> {
    const clients: Partial<ClientRecord>[] = [
      {
        nom: 'Jean Dupont',
        email: 'jean.dupont@example.com',
        entreprise: 'Tech Corp',
        statut: 'Actif',
      },
      {
        nom: 'Marie Martin',
        email: 'marie.martin@example.com',
        entreprise: 'Innovation SA',
        statut: 'Actif',
      },
      {
        nom: 'Pierre Bernard',
        email: 'pierre.bernard@example.com',
        entreprise: 'Digital Plus',
        statut: 'Actif',
      },
      {
        nom: 'Sophie Dubois',
        email: 'sophie.dubois@example.com',
        entreprise: 'Cloud Services',
        statut: 'Inactif',
      },
      {
        nom: 'Luc Petit',
        email: 'luc.petit@example.com',
        entreprise: 'Data Systems',
        statut: 'Actif',
      },
    ];

    await this.addRecords('Clients', clients);
    Logger.success(`Clients populated: ${clients.length} records`);
  }

  // ===== PRODUITS DATA =====

  private async populateProduits(): Promise<void> {
    const produits: Partial<ProductRecord>[] = [
      {
        nom: 'Ordinateur Portable Pro',
        prix: 1299,
        stock: 15,
        categorie: 'Informatique',
        description: 'Laptop haute performance pour professionnels',
      },
      {
        nom: 'Souris Sans Fil',
        prix: 29,
        stock: 45,
        categorie: 'Accessoires',
        description: 'Souris ergonomique sans fil',
      },
      {
        nom: 'Clavier Mécanique',
        prix: 89,
        stock: 23,
        categorie: 'Accessoires',
        description: 'Clavier mécanique RGB pour gaming',
      },
      {
        nom: 'Écran 27 pouces',
        prix: 399,
        stock: 8,
        categorie: 'Informatique',
        description: 'Écran 4K 27 pouces',
      },
      {
        nom: 'Webcam HD',
        prix: 79,
        stock: 32,
        categorie: 'Accessoires',
        description: 'Webcam Full HD 1080p',
      },
      {
        nom: 'Casque Audio',
        prix: 149,
        stock: 18,
        categorie: 'Audio',
        description: 'Casque audio sans fil avec réduction de bruit',
      },
    ];

    await this.addRecords('Produits', produits);
    Logger.success(`Produits populated: ${produits.length} records`);
  }

  // ===== VENTES DATA =====

  private async populateVentes(): Promise<void> {
    // First, fetch clients and products to get their IDs
    const clients = await this.fetchTable<ClientRecord>('Clients');
    const produits = await this.fetchTable<ProductRecord>('Produits');

    if (clients.length === 0 || produits.length === 0) {
      Logger.warn('Cannot populate Ventes: Clients or Produits are empty');
      return;
    }

    // Find IDs by name (since we know the demo data)
    const jeanId = clients.find((c) => c.nom === 'Jean Dupont')?.id;
    const marieId = clients.find((c) => c.nom === 'Marie Martin')?.id;
    const pierreId = clients.find((c) => c.nom === 'Pierre Bernard')?.id;
    const lucId = clients.find((c) => c.nom === 'Luc Petit')?.id;

    const laptopId = produits.find((p) => p.nom === 'Ordinateur Portable Pro')?.id;
    const ecranId = produits.find((p) => p.nom === 'Écran 27 pouces')?.id;
    const clavierid = produits.find((p) => p.nom === 'Clavier Mécanique')?.id;
    const sourisId = produits.find((p) => p.nom === 'Souris Sans Fil')?.id;
    const casqueId = produits.find((p) => p.nom === 'Casque Audio')?.id;
    const webcamId = produits.find((p) => p.nom === 'Webcam HD')?.id;

    if (!jeanId || !laptopId) {
      Logger.warn('Cannot find demo client or product IDs');
      return;
    }

    const ventes: Partial<SaleRecord>[] = [
      {
        client_id: jeanId,
        produit_id: laptopId,
        quantite: 1,
        prix_unitaire: 1299,
        date: '2025-11-10',
      },
      {
        client_id: marieId,
        produit_id: ecranId,
        quantite: 1,
        prix_unitaire: 399,
        date: '2025-11-12',
      },
      {
        client_id: pierreId,
        produit_id: clavierid,
        quantite: 1,
        prix_unitaire: 89,
        date: '2025-11-13',
      },
      {
        client_id: jeanId,
        produit_id: sourisId,
        quantite: 2,
        prix_unitaire: 29,
        date: '2025-11-14',
      },
      {
        client_id: lucId,
        produit_id: casqueId,
        quantite: 1,
        prix_unitaire: 149,
        date: '2025-11-15',
      },
      {
        client_id: marieId,
        produit_id: webcamId,
        quantite: 1,
        prix_unitaire: 79,
        date: '2025-11-15',
      },
    ];

    await this.addRecords('Ventes', ventes);
    Logger.success(`Ventes populated: ${ventes.length} records`);
  }
}

export default GristIntegrationManager;
