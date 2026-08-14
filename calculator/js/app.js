import { CalculatorStore } from './calculator.store.js';
import { CalculatorView } from './calculator.view.js';
import { TripsStore } from './trips.store.js';
import { TripsView } from './trips.view.js';
import { FuelStore } from './fuel.store.js';
import { FuelView } from './fuel.view.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Stores
  const calcStore = new CalculatorStore();
  const tripsStore = new TripsStore();
  const fuelStore = new FuelStore();

  // Initialize Views
  const calcView = new CalculatorView(calcStore);
  const tripsView = new TripsView(tripsStore);
  const fuelView = new FuelView(fuelStore);

  // Live header stats
  const elTodayRev = document.getElementById('hdr-today-rev');
  const elTodayTrips = document.getElementById('hdr-today-trips');
  const elMonthRev = document.getElementById('hdr-month-rev');

  function updateHeaderStats(trips) {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const todayTrips = trips.filter(t => t.date === todayStr && t.status === 'completed');
    const monthTrips = trips.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && t.status === 'completed';
    });
    const todayRev = todayTrips.reduce((s, t) => s + t.price, 0);
    const monthRev = monthTrips.reduce((s, t) => s + t.price, 0);
    if (elTodayRev) elTodayRev.textContent = todayRev.toFixed(0);
    if (elTodayTrips) elTodayTrips.textContent = todayTrips.length;
    if (elMonthRev) elMonthRev.textContent = monthRev.toFixed(0);
  }

  // Cross-store sync logic
  tripsStore.subscribe(trips => {
    updateHeaderStats(trips);
  });

  // Persistent Top-Right 3-Lines Settings Button
  const btnGlobalSettings = document.getElementById('btn-global-settings');
  const modalSettings = document.getElementById('modal-calc-settings');
  if (btnGlobalSettings && modalSettings) {
    btnGlobalSettings.addEventListener('click', () => {
      if (navigator.vibrate) navigator.vibrate(30);
      modalSettings.classList.remove('hidden');
    });
  }

  // Tab Navigation Logic
  const navs = document.querySelectorAll('.nav-item');
  const tabs = document.querySelectorAll('.tab-content');

  navs.forEach(nav => {
    nav.addEventListener('click', (e) => {
      // Capture synchronously — currentTarget is null inside async VT callback
      const clickedNav = e.currentTarget;
      const targetId = clickedNav.dataset.target;

      const switchTabs = () => {
        navs.forEach(n => n.classList.remove('active'));
        tabs.forEach(t => t.classList.remove('active'));
        clickedNav.classList.add('active');
        const tabEl = document.getElementById(targetId);
        if (tabEl) tabEl.classList.add('active');
      };

      if (document.startViewTransition) {
        document.startViewTransition(switchTabs);
      } else {
        switchTabs();
      }
    });
  });
});
