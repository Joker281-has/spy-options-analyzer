/**
 * Storage utilities for managing contracts and user data
 */

import { Contract } from '../types/contract';

const STORAGE_KEY_CONTRACTS = 'capturedContracts';

declare global {
  interface Window {
    chrome?: any;
  }
}

/**
 * Get contracts from chrome.storage or localStorage
 */
export async function getStoredContracts(): Promise<Contract[]> {
  return new Promise((resolve) => {
    // Try Chrome API first
    if (typeof window !== 'undefined' && window.chrome?.storage) {
      window.chrome.storage.local.get([STORAGE_KEY_CONTRACTS], (result: any) => {
        const contracts = result[STORAGE_KEY_CONTRACTS] || [];
        resolve(contracts);
      });
    } else {
      // Fallback to localStorage
      const stored = localStorage.getItem(STORAGE_KEY_CONTRACTS);
      resolve(stored ? JSON.parse(stored) : []);
    }
  });
}

/**
 * Save contracts to storage
 */
export async function saveContracts(contracts: Contract[]): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.chrome?.storage) {
      window.chrome.storage.local.set({ [STORAGE_KEY_CONTRACTS]: contracts }, resolve);
    } else {
      localStorage.setItem(STORAGE_KEY_CONTRACTS, JSON.stringify(contracts));
      resolve();
    }
  });
}

/**
 * Clear all contracts
 */
export async function clearContracts(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.chrome?.storage) {
      window.chrome.storage.local.remove([STORAGE_KEY_CONTRACTS], resolve);
    } else {
      localStorage.removeItem(STORAGE_KEY_CONTRACTS);
      resolve();
    }
  });
}

/**
 * Listen for storage changes
 */
export function onStorageChange(callback: (contracts: Contract[]) => void): void {
  if (typeof window !== 'undefined' && window.chrome?.storage) {
    window.chrome.storage.onChanged.addListener((changes: any, namespace: string) => {
      if (namespace === 'local' && changes[STORAGE_KEY_CONTRACTS]) {
        callback(changes[STORAGE_KEY_CONTRACTS].newValue || []);
      }
    });
  }
}

/**
 * Import contracts from JSON
 */
export function parseJsonContracts(jsonString: string): Contract[] {
  try {
    const data = JSON.parse(jsonString);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return [];
  }
}

/**
 * Deduplicate contracts based on strike + type + expiration
 */
export function deduplicateContracts(contracts: Contract[]): Contract[] {
  const map = new Map<string, Contract>();
  
  contracts.forEach((contract) => {
    const key = `${contract.strike}-${contract.type}-${contract.expiration}`;
    // Keep the most recent
    if (!map.has(key) || new Date(contract.timestamp) > new Date(map.get(key)!.timestamp)) {
      map.set(key, contract);
    }
  });
  
  return Array.from(map.values());
}
