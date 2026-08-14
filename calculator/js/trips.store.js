import { DB } from './shared/db.js';

export class TripsStore {
  constructor() {
    this.db = new DB();
    this.trips = [];
    this.listeners = [];
    this.loadInitialData();
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
    return 'trip-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  async addTrip(tripData) {
    const trip = {
      id: tripData.id || this.generateId(),
      clientName: tripData.clientName || 'Без имени',
      date: tripData.date, // YYYY-MM-DD
      time: tripData.time, // HH:MM
      pickup: tripData.pickup || '',
      dropoff: tripData.dropoff || '',
      price: parseFloat(tripData.price) || 0,
      status: tripData.status || 'pending',
      createdAt: Date.now()
    };

    this.trips.push(trip);
    this.trips.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    
    await this.db.saveTrip(trip);
    this.notify();
    return trip;
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
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, t) => sum + t.price, 0);
  }

  /**
   * Returns the nearest upcoming active (non-completed) trip.
   */
  getNextUpcomingTrip() {
    const activeTrips = this.trips.filter(t => t.status !== 'completed');
    if (activeTrips.length === 0) return null;
    return activeTrips[0];
  }

  generateGCalLink(trip) {
    const text = encodeURIComponent(`Трансфер: ${trip.clientName}`);
    const details = encodeURIComponent(`Маршрут: ${trip.pickup} -> ${trip.dropoff}\nЦена: ${trip.price}€`);
    const location = encodeURIComponent(trip.pickup);
    
    // Format dates to YYYYMMDDTHHMMSSZ (UTC). For simplicity, we create local dates and convert to UTC string.
    const start = new Date(`${trip.date}T${trip.time}`);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // assume 1 hour duration
    
    const fmt = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const dates = `${fmt(start)}/${fmt(end)}`;
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
  }

  exportCSV() {
    const headers = ['Дата', 'Время', 'Клиент', 'Откуда', 'Куда', 'Цена (€)', 'Статус'];
    const rows = this.trips.map(t => [
      t.date,
      t.time,
      `"${t.clientName.replace(/"/g, '""')}"`,
      `"${t.pickup.replace(/"/g, '""')}"`,
      `"${t.dropoff.replace(/"/g, '""')}"`,
      t.price,
      t.status
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `trips_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
