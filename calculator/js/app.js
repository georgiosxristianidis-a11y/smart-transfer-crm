import { CalculatorStore } from './calculator.store.js';
import { CalculatorView } from './calculator.view.js';

// Initialize PWA App
document.addEventListener('DOMContentLoaded', () => {
  const store = new CalculatorStore();
  const view = new CalculatorView(store);
  
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('SW registered!', reg))
        .catch(err => console.log('SW registration failed', err));
    });
  }
});
