/**
 * Backup and Data Integrity Service
 * Follows 'Offline-first' & Contract-First GIO protocol.
 * Connects shared/backup.js with Browser UI & Storage persistence.
 */

import { exportAll, importAll } from './backup.js';
import { localDateKey } from './utils.js';

const LAST_BACKUP_KEY = 'smart_transfer_last_backup_ts';

export class BackupService {
  /**
   * Generates a complete backup snapshot of the application state.
   */
  static exportBackup({ tripsStore, fuelStore, calcStore, shiftsStore }) {
    const jsonStr = exportAll({
      calculatorStore: calcStore,
      tripsStore: tripsStore,
      fuelStore: fuelStore,
      shiftsStore: shiftsStore
    });
    return JSON.parse(jsonStr);
  }

  /**
   * Triggers download of the backup file in browser.
   */
  static downloadBackupFile(backupObj) {
    if (typeof window === 'undefined' || !window.document) return;

    const jsonStr = typeof backupObj === 'string' ? backupObj : JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const nowStr = localDateKey();
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smart_transfer_backup_${nowStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.recordBackupTimestamp();
  }

  /**
   * Imports a backup snapshot into all application stores.
   */
  static async importBackup(backupData, { tripsStore, fuelStore, calcStore, shiftsStore }) {
    const env = await importAll(backupData, {
      calculatorStore: calcStore,
      tripsStore: tripsStore,
      fuelStore: fuelStore,
      shiftsStore: shiftsStore
    });

    this.recordBackupTimestamp();

    return {
      success: true,
      stats: {
        tripsCount: (env.trips || []).length,
        fuelLogsCount: (env.fuelLogs || []).length,
        shiftsCount: (env.shifts || []).length
      }
    };
  }

  static recordBackupTimestamp() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
      }
    } catch (e) {
      console.warn('Failed to record backup timestamp', e);
    }
  }

  static getLastBackupDate() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(LAST_BACKUP_KEY);
        if (saved) {
          const d = new Date(saved);
          return `${d.toLocaleDateString('ru-RU')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
      }
    } catch (e) {
      console.warn('Failed to read last backup date', e);
    }
    return 'никогда';
  }
}
