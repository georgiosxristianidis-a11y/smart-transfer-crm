/**
 * Lightweight IndexedDB wrapper for PWA offline storage.
 * Follows 'Offline-first' GIO protocol.
 * Schema Version: 3 (Trips + Fuel + Shifts stores, Persistent storage support)
 */

const DB_NAME = 'UnitCalcDB';
const DB_VERSION = 3;
const STORE_TRIPS = 'trips';
const STORE_FUEL = 'fuel';
const STORE_SHIFTS = 'shifts';

export class DB {
  constructor() {
    if (DB._instance) {
      return DB._instance;
    }
    this.db = null;
    this.initPromise = this._init();
    this.isPersisted = false;
    DB._instance = this;
  }

  static resetInstanceForTesting() {
    if (DB._instance) {
      DB._instance.close();
      DB._instance = null;
    }
  }

  close() {
    if (this.db) {
      try {
        this.db.close();
      } catch (e) {
        console.warn('[DB] Error while closing connection:', e);
      }
      this.db = null;
    }
    this.initPromise = null;
  }

  _init() {
    if (this.initPromise) {
      return this.initPromise;
    }
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        // Fallback for Node.js tests or unsupported browsers
        resolve(null);
        return;
      }

      const idb = window.indexedDB;
      const request = idb.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.initPromise = null;
        reject(request.error);
      };

      // Fires when another tab holds the old version open. Without this the
      // upgrade hangs silently and every read below rejects with no clue why.
      request.onblocked = () => {
        console.warn(`[DB] Upgrade to v${DB_VERSION} blocked — another tab holds an older connection open.`);
      };

      request.onsuccess = () => {
        this.db = request.result;

        // When another tab or worker initiates a version upgrade, close this connection
        // immediately so the upgrade can proceed without being blocked.
        this.db.onversionchange = () => {
          console.warn(`[DB] Upgrade requested elsewhere; closing connection to ${DB_NAME}.`);
          this.close();
        };

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
        // v3: shifts. Created additively — v2 trips and fuel rows are untouched.
        if (!db.objectStoreNames.contains(STORE_SHIFTS)) {
          const shifts = db.createObjectStore(STORE_SHIFTS, { keyPath: 'id' });
          shifts.createIndex('by_date', 'date', { unique: false });
          shifts.createIndex('by_status', 'status', { unique: false });
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
    if (!this.initPromise) {
      this.initPromise = this._init();
    }
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

  /* --- SHIFTS STORE --- */

  async getAllShifts() {
    if (!this.db && typeof window === 'undefined') return [];

    const store = await this._getStore(STORE_SHIFTS, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveShift(shift) {
    if (!this.db && typeof window === 'undefined') return shift;

    const store = await this._getStore(STORE_SHIFTS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(shift);
      request.onsuccess = () => resolve(shift);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteShift(id) {
    if (!this.db && typeof window === 'undefined') return true;

    const store = await this._getStore(STORE_SHIFTS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async clearShifts() {
    if (!this.db && typeof window === 'undefined') return true;

    const store = await this._getStore(STORE_SHIFTS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new DB();

