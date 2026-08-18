import { DB } from './shared/db.js';
import { localDateKey, parseLocalDate } from './shared/utils.js';

export class TripsStore {
  constructor() {
    this.db = new DB();
    this.trips = [];
    this.listeners = [];
    this.ready = this.loadInitialData();
  }

  async loadInitialData() {
    try {
      this.trips = await this.db.getAllTrips();
      this.trips.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
      this.notify();
    } catch (e) {
      console.error('Failed to load trips', e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    listener(this.trips);
  }

  notify() {
    this.listeners.forEach(l => l(this.trips));
  }

  generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'trip-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
  }

  async addTrip(tripData) {
    const trip = {
      id: tripData.id || this.generateId(),
      clientName: tripData.clientName || 'Без имени',
      phone: tripData.phone || '',
      flightCode: tripData.flightCode || '',
      date: tripData.date || localDateKey(), // YYYY-MM-DD
      time: tripData.time || '12:00', // HH:MM
      pickup: tripData.pickup || '',
      dropoff: tripData.dropoff || '',
      price: parseFloat(tripData.price) || 0,
      status: tripData.status || 'pending',
      paymentStatus: tripData.paymentStatus || 'unpaid', // 'unpaid' | 'paid' | 'cash' | 'card' | 'hotel'
      pax: parseInt(tripData.pax, 10) || 1,
      roomNumber: tripData.roomNumber || '',
      notes: tripData.notes || '',
      source: tripData.source || 'hotel', // 'hotel' | 'web' | 'ads' | 'walkin' | 'b2b'
      createdAt: tripData.createdAt || Date.now()
    };

    this.trips.push(trip);
    this.trips.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    
    await this.db.saveTrip(trip);
    this.db.requestPersistence();
    this.notify();
    return trip;
  }

  /**
   * Bulk import trips from backup snapshot.
   * @param {Array} tripsList 
   */
  async importTrips(tripsList) {
    if (!Array.isArray(tripsList)) return false;
    
    await this.db.clearTrips();
    this.trips = [];

    for (const item of tripsList) {
      if (!item || typeof item !== 'object') continue;
      const trip = {
        id: item.id || this.generateId(),
        clientName: item.clientName || 'Без имени',
        phone: item.phone || '',
        flightCode: item.flightCode || '',
        date: item.date || localDateKey(),
        time: item.time || '12:00',
        pickup: item.pickup || '',
        dropoff: item.dropoff || '',
        price: parseFloat(item.price) || 0,
        status: item.status || 'pending',
        paymentStatus: item.paymentStatus || 'unpaid',
        pax: parseInt(item.pax, 10) || 1,
        roomNumber: item.roomNumber || '',
        notes: item.notes || '',
        source: item.source || 'hotel',
        createdAt: item.createdAt || Date.now()
      };
      this.trips.push(trip);
      await this.db.saveTrip(trip);
    }

    this.trips.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    this.notify();
    return true;
  }

  /**
   * Batch import trips from CSV/WhatsApp parser.
   * @param {Array} newTrips 
   * @param {Object} [options]
   * @param {string} [options.mode] - 'append' (default) | 'replace'
   * @param {string} [options.targetDate] - if replace mode, deletes existing trips for targetDate
   */
  async importTripsBatch(newTrips, options = {}) {
    if (!Array.isArray(newTrips) || newTrips.length === 0) return 0;
    const mode = options.mode || 'append';
    const targetDate = options.targetDate;

    if (mode === 'replace' && targetDate) {
      const toDelete = this.trips.filter(t => t.date === targetDate);
      for (const t of toDelete) {
        await this.db.deleteTrip(t.id);
      }
      this.trips = this.trips.filter(t => t.date !== targetDate);
    }

    const saved = [];
    for (const raw of newTrips) {
      const trip = {
        id: raw.id || this.generateId(),
        clientName: raw.clientName || 'Без имени',
        phone: raw.phone || '',
        flightCode: raw.flightCode || '',
        date: raw.date || targetDate || localDateKey(),
        time: raw.time || '12:00',
        pickup: raw.pickup || '',
        dropoff: raw.dropoff || '',
        price: parseFloat(raw.price) || 0,
        status: raw.status || 'pending',
        paymentStatus: raw.paymentStatus || 'unpaid',
        pax: parseInt(raw.pax, 10) || 1,
        roomNumber: raw.roomNumber || '',
        notes: raw.notes || '',
        source: raw.source || 'hotel',
        createdAt: raw.createdAt || Date.now()
      };
      this.trips.push(trip);
      await this.db.saveTrip(trip);
      saved.push(trip);
    }

    this.trips.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    this.db.requestPersistence();
    this.notify();
    return saved.length;
  }

  /**
   * Identifies any trips that conflict in schedule (<45 mins apart on the same date).
   */
  getConflicts() {
    const activeTrips = this.trips.filter(t => t.status !== 'completed');
    const conflictSet = new Set();

    for (let i = 0; i < activeTrips.length; i++) {
      for (let j = i + 1; j < activeTrips.length; j++) {
        const t1 = activeTrips[i];
        const t2 = activeTrips[j];
        if (t1.date === t2.date) {
          const d1 = new Date(`${t1.date}T${t1.time}`);
          const d2 = new Date(`${t2.date}T${t2.time}`);
          const diffMins = Math.abs(d2 - d1) / (1000 * 60);
          if (diffMins < 45) {
            conflictSet.add(t1.id);
            conflictSet.add(t2.id);
          }
        }
      }
    }
    return conflictSet;
  }

  async updateTripPaymentStatus(id, newPaymentStatus) {
    const trip = this.trips.find(t => t.id === id);
    if (trip) {
      trip.paymentStatus = newPaymentStatus;
      await this.db.saveTrip(trip);
      this.notify();
    }
  }

  async updateTripStatus(id, newStatus) {
    const trip = this.trips.find(t => t.id === id);
    if (trip) {
      trip.status = newStatus;
      await this.db.saveTrip(trip);
      this.notify();
    }
  }

  async deleteTrip(id) {
    this.trips = this.trips.filter(t => t.id !== id);
    await this.db.deleteTrip(id);
    this.notify();
  }

  getCompletedRevenueForMonth(year, month) {
    return this.trips
      .filter(t => t.status === 'completed')
      .filter(t => {
        const d = parseLocalDate(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, t) => sum + t.price, 0);
  }

  /**
   * Returns the nearest upcoming active (non-completed) trip whose datetime >= now.
   * Uses local time to avoid UTC date-shift (AUDIT-03).
   * Past pending trips (forgotten from yesterday) are intentionally excluded.
   *
   * @param {Date} [now] - Optional reference time for testing; defaults to current local time.
   * @returns {Object|null}
   */
  getNextUpcomingTrip(now = new Date()) {
    const nowMs = now.getTime();
    const upcoming = this.trips.filter(t => {
      if (t.status === 'completed') return false;
      // Parse as local time by appending no timezone — avoids UTC midnight shift
      const tripMs = new Date(`${t.date}T${t.time}`).getTime();
      return tripMs >= nowMs;
    });
    // trips are already sorted ascending by date+time in addTrip/loadInitialData
    return upcoming.length > 0 ? upcoming[0] : null;
  }

  generateGCalLink(trip) {
    const text = encodeURIComponent(`Трансфер: ${trip.clientName}`);
    const details = encodeURIComponent(`Маршрут: ${trip.pickup} -> ${trip.dropoff}\nЦена: ${trip.price}€\nОплата: ${trip.paymentStatus || 'unpaid'}\nТел: ${trip.phone || '-'}`);
    const location = encodeURIComponent(trip.pickup);
    
    // Format dates to YYYYMMDDTHHMMSSZ (UTC). For simplicity, we create local dates and convert to UTC string.
    const time = trip.time && trip.time.trim() ? trip.time.trim() : '12:00';
    const start = new Date(`${trip.date}T${time}`);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // assume 1 hour duration
    
    const fmt = (d) => {
      if (!d || isNaN(d.getTime())) return '';
      return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    };
    const dates = start && !isNaN(start.getTime()) ? `${fmt(start)}/${fmt(end)}` : '';
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
  }

  getAllTripsSnapshot() {
    return this.trips.map(t => ({ ...t }));
  }

  async replaceAllTrips(list) {
    if (!Array.isArray(list)) throw new Error('replaceAllTrips: array required');
    const existing = await this.db.getAllTrips();
    for (const t of existing) {
      await this.db.deleteTrip(t.id);
    }
    for (const t of list) {
      await this.db.saveTrip(t);
    }
    this.trips = list.map(t => ({ ...t }));
    this.trips.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    this.notify();
  }

  exportCSV() {
    const headers = ['Дата', 'Время', 'Клиент', 'Телефон', 'Откуда', 'Куда', 'Пассажиры', 'Цена (€)', 'Оплата', 'Рейс', 'Номер/Комната', 'Статус', 'Источник', 'Примечания'];
    const rows = this.trips.map(t => [
      t.date,
      t.time,
      `"${(t.clientName || '').replace(/"/g, '""')}"`,
      `"${(t.phone || '').replace(/"/g, '""')}"`,
      `"${(t.pickup || '').replace(/"/g, '""')}"`,
      `"${(t.dropoff || '').replace(/"/g, '""')}"`,
      t.pax || 1,
      t.price,
      `"${(t.paymentStatus || 'unpaid').replace(/"/g, '""')}"`,
      `"${(t.flightCode || '').replace(/"/g, '""')}"`,
      `"${(t.roomNumber || '').replace(/"/g, '""')}"`,
      t.status,
      t.source || 'hotel',
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `trips_crm_export_${localDateKey()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
