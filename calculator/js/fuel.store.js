import { SCHEMA_VERSION } from './shared/schema.js';

export class FuelStore {
  constructor() {
    this.storageKey = 'smart_transfer_fuel_logs_v1';
    this.logs = this.loadLocalLogs();
    this.listeners = [];
  }

  loadLocalLogs() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Legacy bare array
          if (Array.isArray(parsed)) return parsed;
          if (parsed && typeof parsed === 'object') {
            if (parsed.schemaVersion === undefined) return Array.isArray(parsed.logs) ? parsed.logs : [];
            if (parsed.schemaVersion > SCHEMA_VERSION) {
              console.error(
                `${this.storageKey} schemaVersion ${parsed.schemaVersion} > current ${SCHEMA_VERSION}. Ignored.`
              );
              return [];
            }
            return Array.isArray(parsed.logs) ? parsed.logs : [];
          }
        }
      }
    } catch (e) {
      console.warn('Failed to read fuel logs from localStorage', e);
    }
    // Default demo data if empty
    return [
      { id: 'fuel-1', date: new Date().toISOString().split('T')[0], time: '08:30', amount: 50, liters: 26.3, odo: 142500, station: 'BP Heraklion' },
      { id: 'fuel-2', date: '2026-08-10', time: '19:15', amount: 90, liters: 47.4, odo: 141950, station: 'Shell Airport' }
    ];
  }

  saveLocalLogs() {
    try {
      if (typeof localStorage !== 'undefined') {
        const envelope = { schemaVersion: SCHEMA_VERSION, logs: this.logs };
        localStorage.setItem(this.storageKey, JSON.stringify(envelope));
      }
    } catch (e) {
      console.warn('Failed to save fuel logs', e);
    }
  }

  getAllLogsSnapshot() {
    return this.logs.map(l => ({ ...l }));
  }

  replaceAllLogs(list) {
    if (!Array.isArray(list)) throw new Error('replaceAllLogs: array required');
    this.logs = list.map(l => ({ ...l }));
    this.saveLocalLogs();
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    listener(this.getMetrics());
  }

  notify() {
    const metrics = this.getMetrics();
    this.listeners.forEach(l => l(metrics));
  }

  addFuelLog(amount, liters = null, station = 'Заправка') {
    const cost = parseFloat(amount) || 0;
    if (cost <= 0) return;

    // Approximate liters if not given (assume average €1.90/L in Greece)
    const lit = liters ? parseFloat(liters) : parseFloat((cost / 1.90).toFixed(1));
    const now = new Date();

    const log = {
      id: 'fuel-' + Date.now(),
      date: now.toISOString().split('T')[0],
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      amount: cost,
      liters: lit,
      station: station
    };

    this.logs.unshift(log);
    this.saveLocalLogs();
    this.notify();
    return log;
  }

  deleteFuelLog(id) {
    this.logs = this.logs.filter(l => l.id !== id);
    this.saveLocalLogs();
    this.notify();
  }

  getMetrics() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Past 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let todayAmount = 0;
    let todayLiters = 0;
    let weekAmount = 0;
    let weekLiters = 0;
    let monthAmount = 0;
    let monthLiters = 0;

    this.logs.forEach(log => {
      const logDate = new Date(log.date);
      if (log.date === todayStr) {
        todayAmount += log.amount;
        todayLiters += log.liters;
      }
      if (logDate >= sevenDaysAgo) {
        weekAmount += log.amount;
        weekLiters += log.liters;
      }
      if (logDate.getFullYear() === currentYear && logDate.getMonth() === currentMonth) {
        monthAmount += log.amount;
        monthLiters += log.liters;
      }
    });

    return {
      logs: this.logs,
      todayAmount,
      todayLiters: parseFloat(todayLiters.toFixed(1)),
      weekAmount,
      weekLiters: parseFloat(weekLiters.toFixed(1)),
      monthAmount,
      monthLiters: parseFloat(monthLiters.toFixed(1))
    };
  }
}
