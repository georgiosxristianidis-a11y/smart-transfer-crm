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

  // Cross-store sync logic
  tripsStore.subscribe(trips => {
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
      const switchTabs = () => {
        navs.forEach(n => n.classList.remove('active'));
        tabs.forEach(t => t.classList.remove('active'));
        
        const targetId = e.currentTarget.dataset.target;
        e.currentTarget.classList.add('active');
        document.getElementById(targetId).classList.add('active');
      };

      if (document.startViewTransition) {
        document.startViewTransition(switchTabs);
      } else {
        switchTabs();
      }
    });
  });
});
