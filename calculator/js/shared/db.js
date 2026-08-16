/**
 * Lightweight IndexedDB wrapper for PWA offline storage.
 * Follows 'Offline-first' GIO protocol.
 * Schema Version: 2 (Trips + Fuel stores, Persistent storage support)
 */

const DB_NAME = 'UnitCalcDB';
const DB_VERSION = 2;
const STORE_TRIPS = 'trips';
const STORE_FUEL = 'fuel';

export class DB {
  constructor() {
    this.db = null;
    this.initPromise = this._init();
    this.isPersisted = false;
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
        this.requestPersistence();
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_TRIPS)) {
          db.createObjectStore(STORE_TRIPS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_FUEL)) {
          db.createObjectStore(STORE_FUEL, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Requests browser storage persistence to prevent eviction under disk pressure.
   */
  async requestPersistence() {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) {
          this.isPersisted = await navigator.storage.persist();
        } else {
          this.isPersisted = true;
        }
        return this.isPersisted;
      } catch (e) {
        console.warn('Storage persistence request failed:', e);
        return false;
      }
    }
    return false;
  }

  async _getStore(storeName = STORE_TRIPS, mode = 'readonly') {
    await this.initPromise;
    if (!this.db) throw new Error('IndexedDB not supported or running in test env');
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  async getStore(mode) {
    return await this._getStore(STORE_TRIPS, mode);
  }

  /* --- TRIPS STORE --- */

  async getAllTrips() {
    if (!this.db && typeof window === 'undefined') return []; // Test fallback

    const store = await this._getStore(STORE_TRIPS, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveTrip(trip) {
    if (!this.db && typeof window === 'undefined') return trip;

    const store = await this._getStore(STORE_TRIPS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(trip);
      request.onsuccess = () => resolve(trip);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTrip(id) {
    if (!this.db && typeof window === 'undefined') return true;

    const store = await this._getStore(STORE_TRIPS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async clearTrips() {
    if (!this.db && typeof window === 'undefined') return true;

    const store = await this._getStore(STORE_TRIPS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /* --- FUEL STORE --- */

  async getAllFuelLogs() {
    if (!this.db && typeof window === 'undefined') return [];

    const store = await this._getStore(STORE_FUEL, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveFuelLog(log) {
    if (!this.db && typeof window === 'undefined') return log;

    const store = await this._getStore(STORE_FUEL, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(log);
      request.onsuccess = () => resolve(log);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFuelLog(id) {
    if (!this.db && typeof window === 'undefined') return true;

    const store = await this._getStore(STORE_FUEL, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async clearFuelLogs() {
    if (!this.db && typeof window === 'undefined') return true;

    const store = await this._getStore(STORE_FUEL, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}
