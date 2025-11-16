/**
 * Global Grist API
 * Exposed as window.gristAPI for use in components
 */

import { GristIntegrationManager } from '@core';
import type { GristAPI, GristRecord, TemplateRecord } from '@core/types';

let gristManager: GristIntegrationManager | null = null;

export function initializeGristAPI(manager: GristIntegrationManager): void {
  gristManager = manager;
}

export const gristAPI: GristAPI = {
  async getData<T extends GristRecord = GristRecord>(tableName: string): Promise<T[]> {
    if (!gristManager) throw new Error('Grist API not initialized');
    return gristManager.fetchTable<T>(tableName, true);
  },

  async addRecord(tableName: string, record: Partial<GristRecord>): Promise<number> {
    if (!gristManager) throw new Error('Grist API not initialized');

    const result = await window.grist.docApi.applyUserActions([
      ['AddRecord', tableName, null, record],
    ]);

    gristManager.invalidateCache(tableName);
    return result[0];
  },

  async updateRecord(
    tableName: string,
    recordId: number,
    updates: Partial<GristRecord>
  ): Promise<void> {
    if (!gristManager) throw new Error('Grist API not initialized');

    await window.grist.docApi.applyUserActions([
      ['UpdateRecord', tableName, recordId, updates],
    ]);

    gristManager.invalidateCache(tableName);
  },

  async deleteRecord(tableName: string, recordId: number): Promise<void> {
    if (!gristManager) throw new Error('Grist API not initialized');

    await window.grist.docApi.applyUserActions([
      ['RemoveRecord', tableName, recordId],
    ]);

    gristManager.invalidateCache(tableName);
  },

  navigate(pageId: string): void {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { pageId } }));
  },

  async getTemplate(templateId: string): Promise<TemplateRecord | null> {
    if (!gristManager) throw new Error('Grist API not initialized');
    const templates = await gristManager.fetchTable<TemplateRecord>('Templates', true);
    return templates.find((t) => t.template_id === templateId) || null;
  },

  async getTemplates(category?: string): Promise<TemplateRecord[]> {
    if (!gristManager) throw new Error('Grist API not initialized');
    const templates = await gristManager.fetchTable<TemplateRecord>('Templates', true);

    if (category) {
      return templates.filter((t) => t.category === category);
    }

    return templates;
  },
};

// Expose globally for components
if (typeof window !== 'undefined') {
  (window as any).gristAPI = gristAPI;
}
