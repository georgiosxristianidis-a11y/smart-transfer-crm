/**
 * Lightweight IndexedDB wrapper for PWA offline storage.
 * Follows 'Offline-first' GIO protocol.
 */

const DB_NAME = 'UnitCalcDB';
const DB_VERSION = 1;
const STORE_TRIPS = 'trips';

export class DB {
  constructor() {
    this.db = null;
    this.initPromise = this._init();
  }

  _init() {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        // Fallback for Node.js tests or unsupported browsers
        resolve(null);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_TRIPS)) {
          db.createObjectStore(STORE_TRIPS, { keyPath: 'id' });
        }
      };
    });
  }

  async _getStore(mode = 'readonly') {
    await this.initPromise;
    if (!this.db) throw new Error('IndexedDB not supported or running in test env');
    const tx = this.db.transaction(STORE_TRIPS, mode);
    return tx.objectStore(STORE_TRIPS);
  }

  async getAllTrips() {
    if (!this.db && typeof window === 'undefined') return []; // Test fallback
    
    const store = await this.getStore('readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveTrip(trip) {
    if (!this.db && typeof window === 'undefined') return trip;
    
    const store = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(trip);
      request.onsuccess = () => resolve(trip);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTrip(id) {
    if (!this.db && typeof window === 'undefined') return true;

    const store = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async getStore(mode) {
      return await this._getStore(mode);
  }
}
