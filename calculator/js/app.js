import { CalculatorStore } from './calculator.store.js';
import { CalculatorView } from './calculator.view.js';
import { TripsStore } from './trips.store.js';
import { TripsView } from './trips.view.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Stores
  const calcStore = new CalculatorStore();
  const tripsStore = new TripsStore();

  // Initialize Views
  const calcView = new CalculatorView(calcStore);
  const tripsView = new TripsView(tripsStore);

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
    // When trips update, we could update analytics
    // E.g., pass the actual completed revenue to calcStore or override something
    const today = new Date();
    const actualRev = tripsStore.getCompletedRevenueForMonth(today.getFullYear(), today.getMonth());
    
    // For now, we just log it. The UI already has predictions vs actuals if we map it properly.
    console.log(`Actual completed revenue for current month: €${actualRev}`);
  });

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
