import { AlertConfig, TradeSignal } from '../types';
import toast from 'react-hot-toast';

export class AlertEngine {
  private static readonly STORAGE_KEY = 'spy-alerts';
  private static alerts: AlertConfig[] = [];

  /**
   * Load alerts from localStorage
   */
  static loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.alerts = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load alerts:', e);
    }
  }

  /**
   * Save alerts to localStorage
   */
  static saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.alerts));
    } catch (e) {
      console.error('Failed to save alerts:', e);
    }
  }

  /**
   * Create new alert configuration
   */
  static createAlert(config: Omit<AlertConfig, 'id'>): AlertConfig {
    const alert: AlertConfig = {
      ...config,
      id: `alert-${Date.now()}`,
    };
    this.alerts.push(alert);
    this.saveToStorage();
    toast.success(`Alert "${config.name}" created`);
    return alert;
  }

  /**
   * Get all alerts
   */
  static getAllAlerts(): AlertConfig[] {
    return [...this.alerts];
  }

  /**
   * Update alert
   */
  static updateAlert(id: string, updates: Partial<AlertConfig>): void {
    const index = this.alerts.findIndex(a => a.id === id);
    if (index !== -1) {
      this.alerts[index] = { ...this.alerts[index], ...updates };
      this.saveToStorage();
      toast.success('Alert updated');
    }
  }

  /**
   * Delete alert
   */
  static deleteAlert(id: string): void {
    this.alerts = this.alerts.filter(a => a.id !== id);
    this.saveToStorage();
    toast.success('Alert deleted');
  }

  /**
   * Check if signal matches any alert conditions
   */
  static checkSignal(signal: TradeSignal): AlertConfig | null {
    const enabledAlerts = this.alerts.filter(a => a.enabled);

    for (const alert of enabledAlerts) {
      if (this.matchesConditions(signal, alert.conditions)) {
        return alert;
      }
    }

    return null;
  }

  /**
   * Test if signal matches alert conditions
   */
  private static matchesConditions(
    signal: TradeSignal,
    conditions: AlertConfig['conditions']
  ): boolean {
    const delta = Math.abs(signal.contract.delta);

    if (conditions.deltaMin && delta < conditions.deltaMin) return false;
    if (conditions.deltaMax && delta > conditions.deltaMax) return false;
    if (conditions.ivMin && signal.contract.iv * 100 < conditions.ivMin) return false;
    if (conditions.ivMax && signal.contract.iv * 100 > conditions.ivMax) return false;

    const daysToExp = this.calculateDaysToExp(signal.contract.exp);
    if (conditions.expDaysMax && daysToExp > conditions.expDaysMax) return false;

    return true;
  }

  /**
   * Trigger alert for a signal
   */
  static async triggerAlert(signal: TradeSignal, alert: AlertConfig): Promise<void> {
    const message = `
🎯 Trade Signal Alert: ${alert.name}
📊 ${signal.contract.symbol}
⭐ Score: ${signal.score.toFixed(0)}/100
💡 ${signal.reason}
    `;

    // Browser notification
    if (alert.notifyBrowser && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('SPY Trading Assistant', {
        body: message,
        icon: '📈',
        badge: '🎯',
      });
    }

    // Toast notification
    toast.success(message);

    // Email notification (requires backend)
    if (alert.notifyEmail) {
      await this.sendEmailAlert(alert.notifyEmail, signal, message);
    }
  }

  /**
   * Send email alert (optional backend endpoint)
   */
  private static async sendEmailAlert(
    email: string,
    signal: TradeSignal,
    message: string
  ): Promise<void> {
    try {
      // This would call your backend endpoint
      // await fetch('/.netlify/functions/sendEmail', {
      //   method: 'POST',
      //   body: JSON.stringify({ email, signal, message })
      // });
      console.log('Email would be sent to:', email);
    } catch (e) {
      console.error('Failed to send email alert:', e);
    }
  }

  /**
   * Request browser notification permission
   */
  static requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return Notification.requestPermission();
    }
    return Promise.resolve('denied');
  }

  private static calculateDaysToExp(expDate: string): number {
    const exp = new Date(expDate);
    const today = new Date();
    const diffMs = exp.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }
}
