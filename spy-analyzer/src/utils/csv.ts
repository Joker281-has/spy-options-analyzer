/**
 * CSV parsing and export utilities
 */

import { Contract } from '../types/contract';

/**
 * Parse CSV string to contracts
 */
export function parseCSV(csvString: string): Contract[] {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const contracts: Contract[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const contract = csvLineToContract(headers, values);
    
    if (contract) {
      contracts.push(contract);
    }
  }

  return contracts;
}

/**
 * Convert CSV line to contract object
 */
function csvLineToContract(headers: string[], values: string[]): Contract | null {
  try {
    const getColumn = (name: string) => {
      const index = headers.indexOf(name);
      return index >= 0 ? values[index] : null;
    };

    const strike = parseFloat(getColumn('strike') || '0');
    const type = (getColumn('type') || 'CALL').toUpperCase() as 'CALL' | 'PUT';
    const bid = parseFloat(getColumn('bid') || '0');
    const ask = parseFloat(getColumn('ask') || '0');
    const delta = parseFloat(getColumn('delta') || '0');
    const iv = parseFloat(getColumn('iv') || '0');
    const volume = parseInt(getColumn('volume') || '0');
    const openInterest = parseInt(getColumn('open_interest') || '0');
    const expiration = getColumn('expiration') || new Date().toISOString().split('T')[0];

    if (!strike || !bid || !ask) {
      return null;
    }

    return {
      strike,
      type,
      bid,
      ask,
      delta,
      iv,
      volume,
      openInterest,
      expiration,
      timestamp: new Date().toISOString(),
      symbol: `SPY ${expiration} ${strike} ${type}`
    };
  } catch (error) {
    console.error('Error parsing CSV line:', error);
    return null;
  }
}

/**
 * Export contracts to CSV format
 */
export function exportToCSV(contracts: Contract[]): string {
  const headers = [
    'Strike',
    'Type',
    'Bid',
    'Ask',
    'Delta',
    'IV',
    'Volume',
    'Open Interest',
    'Expiration',
    'Timestamp'
  ];

  const rows = contracts.map(c => [
    c.strike,
    c.type,
    c.bid.toFixed(2),
    c.ask.toFixed(2),
    c.delta.toFixed(2),
    (c.iv * 100).toFixed(2),
    c.volume,
    c.openInterest,
    c.expiration,
    c.timestamp
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  return csv;
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string = 'spy-options.csv'): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Validate CSV format
 */
export function validateCSV(csvString: string): { valid: boolean; error?: string } {
  const lines = csvString.trim().split('\n');
  
  if (lines.length < 2) {
    return { valid: false, error: 'CSV must have header and at least one data row' };
  }

  const headers = lines[0].toLowerCase();
  const requiredFields = ['strike', 'type', 'bid', 'ask'];
  
  for (const field of requiredFields) {
    if (!headers.includes(field)) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  return { valid: true };
}
