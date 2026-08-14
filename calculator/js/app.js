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

  // Live header stats & Shift Norm Elements (NAV-05)
  const elTodayRev = document.getElementById('hdr-today-rev');
  const elTodayTrips = document.getElementById('hdr-today-trips');
  const elNormTarget = document.getElementById('hdr-norm-target');
  const elMonthRev = document.getElementById('hdr-month-rev');
  const elShiftFraction = document.getElementById('shift-norm-fraction');
  const elShiftFill = document.getElementById('shift-norm-fill');
  const elShiftProgress = document.getElementById('shift-norm-progressbar');

  let currentTrips = [];

  function updateNormAndStats() {
    // Use local date, not UTC — toISOString() returns UTC and shifts date by -3h before 03:00 local
    const now = new Date();
    const todayStr = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-');
    const trips = currentTrips;
    const todayTrips = trips.filter(t => t.date === todayStr && t.status === 'completed');
    const monthTrips = trips.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && t.status === 'completed';
    });
    const todayRev = todayTrips.reduce((s, t) => s + t.price, 0);
    const monthRev = monthTrips.reduce((s, t) => s + t.price, 0);
    const norm = (calcStore.state && calcStore.state.tripsPerDay) ? calcStore.state.tripsPerDay : 13;
    const completedCount = todayTrips.length;
    const pct = Math.min(100, Math.round((completedCount / (norm || 1)) * 100));

    if (elTodayRev) elTodayRev.textContent = todayRev.toFixed(0);
    if (elTodayTrips) elTodayTrips.textContent = completedCount;
    if (elNormTarget) elNormTarget.textContent = norm;
    if (elMonthRev) elMonthRev.textContent = monthRev.toFixed(0);

    if (elShiftFraction) {
      if (completedCount >= norm && norm > 0) {
        elShiftFraction.textContent = `${completedCount} из ${norm} (норма выполнена!)`;
      } else {
        elShiftFraction.textContent = `${completedCount} из ${norm} поездок`;
      }
    }
    if (elShiftFill) {
      elShiftFill.style.width = `${pct}%`;
      if (completedCount >= norm && norm > 0) {
        elShiftFill.classList.add('goal-reached');
      } else {
        elShiftFill.classList.remove('goal-reached');
      }
    }
    if (elShiftProgress) {
      elShiftProgress.setAttribute('aria-valuenow', completedCount);
      elShiftProgress.setAttribute('aria-valuemax', norm);
    }
  }

  // Cross-store sync logic
  tripsStore.subscribe(trips => {
    currentTrips = trips || [];
    updateNormAndStats();
  });

  calcStore.subscribe(() => {
    updateNormAndStats();
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
