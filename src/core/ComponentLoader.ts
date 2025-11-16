/**
 * Component Loader
 *
 * Loads and compiles React components from JSX code stored in Grist Templates table.
 * Uses Babel standalone to transform JSX to executable JavaScript.
 */

import type { TemplateRecord } from './types';
import Logger from './Logger';

declare global {
  interface Window {
    Babel: any;
    React: any;
    ReactDOM: any;
  }
}

class ComponentLoader {
  private compiledCache: Map<string, React.ComponentType<any>> = new Map();

  /**
   * Load and compile a component from template
   */
  async loadComponent(template: TemplateRecord): Promise<React.ComponentType<any>> {
    // Check cache first
    if (this.compiledCache.has(template.template_id)) {
      Logger.debug(`Component loaded from cache: ${template.template_id}`);
      return this.compiledCache.get(template.template_id)!;
    }

    try {
      const component = this.compileJSX(template.component_code, template.template_id);
      this.compiledCache.set(template.template_id, component);
      Logger.success(`Component compiled: ${template.template_name}`);
      return component;
    } catch (error) {
      Logger.error(`Error compiling component ${template.template_id}:`, error);
      throw error;
    }
  }

  /**
   * Compile JSX code to React component
   */
  private compileJSX(jsxCode: string, componentId: string): React.ComponentType<any> {
    if (!window.Babel) {
      throw new Error('Babel is not loaded. Include Babel standalone in your HTML.');
    }

    try {
      // Transform JSX to JavaScript using Babel
      const transformed = window.Babel.transform(jsxCode, {
        presets: ['react'],
        filename: `${componentId}.jsx`,
      }).code;

      // Create a function scope with React and hooks
      const componentFactory = new Function(
        'React',
        'useState',
        'useEffect',
        'useCallback',
        'useMemo',
        'useRef',
        'gristAPI',
        `
        ${transformed}
        return Component;
        `
      );

      // Import hooks from React
      const { useState, useEffect, useCallback, useMemo, useRef } = window.React;

      // Get gristAPI from window
      const gristAPI = (window as any).gristAPI;

      if (!gristAPI) {
        throw new Error('gristAPI not found on window. Make sure it is initialized.');
      }

      // Execute and get component
      const Component = componentFactory(
        window.React,
        useState,
        useEffect,
        useCallback,
        useMemo,
        useRef,
        gristAPI
      );

      if (!Component) {
        throw new Error('Component not returned from code');
      }

      return Component;
    } catch (error) {
      Logger.error(`Babel compilation error for ${componentId}:`, error);
      throw new Error(`Failed to compile component: ${(error as Error).message}`);
    }
  }

  /**
   * Clear compilation cache
   */
  clearCache(): void {
    this.compiledCache.clear();
    Logger.info('Component cache cleared');
  }

  /**
   * Clear specific component from cache
   */
  clearComponent(templateId: string): void {
    this.compiledCache.delete(templateId);
    Logger.info(`Component removed from cache: ${templateId}`);
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.compiledCache.size;
  }
}

// Singleton instance
export const componentLoader = new ComponentLoader();

export default ComponentLoader;
