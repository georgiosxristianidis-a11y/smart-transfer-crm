import { html } from './shared/utils.js';

export class TripsView {
  constructor(tripsStore) {
    this.store = tripsStore;
    this.initDOM();
    this.bindEvents();
    
    // View Transitions for initial load
    this.store.subscribe((trips) => {
      if (document.startViewTransition) {
        document.startViewTransition(() => this.render(trips));
      } else {
        this.render(trips);
      }
    });
  }

  initDOM() {
    this.els = {
      list: document.getElementById('trips-list'),
      btnAdd: document.getElementById('btn-add-trip'),
      btnExport: document.getElementById('btn-export-csv'),
      modal: document.getElementById('modal-add-trip'),
      form: document.getElementById('form-trip'),
      btnCancel: document.getElementById('btn-cancel-trip'),
      
      inpClient: document.getElementById('trip-client'),
      inpDate: document.getElementById('trip-date'),
      inpTime: document.getElementById('trip-time'),
      inpPickup: document.getElementById('trip-pickup'),
      inpDropoff: document.getElementById('trip-dropoff'),
      inpPrice: document.getElementById('trip-price'),
    };
    
    this.els.inpDate.value = new Date().toISOString().split('T')[0];
  }

  bindEvents() {
    this.els.btnAdd.addEventListener('click', () => {
      this.els.modal.classList.remove('hidden');
    });

    this.els.btnCancel.addEventListener('click', () => {
      this.els.modal.classList.add('hidden');
    });

    this.els.btnExport.addEventListener('click', () => {
      this.store.exportCSV();
    });

    this.els.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.store.addTrip({
        clientName: this.els.inpClient.value,
        date: this.els.inpDate.value,
        time: this.els.inpTime.value,
        pickup: this.els.inpPickup.value,
        dropoff: this.els.inpDropoff.value,
        price: this.els.inpPrice.value
      });
      this.els.form.reset();
      this.els.inpDate.value = new Date().toISOString().split('T')[0];
      this.els.modal.classList.add('hidden');
    });

    this.bindSwipeGestures();
  }

  bindSwipeGestures() {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let draggingElement = null;
    let tripId = null;
    let isScrolling = false;

    const resetSwipe = () => {
      if (draggingElement) {
        draggingElement.style.transform = '';
        draggingElement.classList.remove('dragging');
        
        const bgC = document.getElementById('bg-c-' + tripId);
        const bgD = document.getElementById('bg-d-' + tripId);
        if (bgC) bgC.style.opacity = 0;
        if (bgD) bgD.style.opacity = 0;
      }
      draggingElement = null;
      tripId = null;
      isScrolling = false;
    };

    this.els.list.addEventListener('pointerdown', (e) => {
      const target = e.target.closest('.swipe-content');
      if (!target) return;
      
      draggingElement = target;
      tripId = target.dataset.id;
      startX = e.clientX;
      startY = e.clientY;
      currentX = 0;
      isScrolling = false;
      draggingElement.classList.add('dragging');
      draggingElement.setPointerCapture(e.pointerId);
    });

    this.els.list.addEventListener('pointermove', (e) => {
      if (!draggingElement) return;

      const diffX = e.clientX - startX;
      const diffY = e.clientY - startY;

      // Если скроллим вертикально - отменяем свайп
      if (!isScrolling && Math.abs(diffY) > Math.abs(diffX)) {
        isScrolling = true;
        resetSwipe();
        return;
      }

      if (isScrolling) return;

      currentX = diffX;
      
      // Limit swipe distance
      const maxSwipe = 120;
      let visualX = currentX;
      if (visualX > maxSwipe) visualX = maxSwipe + (visualX - maxSwipe) * 0.2;
      if (visualX < -maxSwipe) visualX = -maxSwipe + (visualX + maxSwipe) * 0.2;

      draggingElement.style.transform = `translateX(${visualX}px)`;

      const bgC = document.getElementById('bg-c-' + tripId);
      const bgD = document.getElementById('bg-d-' + tripId);
      
      if (visualX > 0) {
        if (bgC) bgC.style.opacity = Math.min(1, visualX / 80);
        if (bgD) bgD.style.opacity = 0;
      } else {
        if (bgD) bgD.style.opacity = Math.min(1, Math.abs(visualX) / 80);
        if (bgC) bgC.style.opacity = 0;
      }
    });

    this.els.list.addEventListener('pointerup', async (e) => {
      if (!draggingElement) return;
      
      const swipeThreshold = 80;
      const tId = tripId; // save locally before reset
      const finalX = currentX;
      resetSwipe();

      if (finalX > swipeThreshold) {
        if (navigator.vibrate) navigator.vibrate(50);
        await this.store.updateTripStatus(tId, 'completed');
      } else if (finalX < -swipeThreshold) {
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        if (confirm('Удалить поездку?')) {
          await this.store.deleteTrip(tId);
        }
      }
    });
  }

  render(trips) {
    if (trips.length === 0) {
      this.els.list.innerHTML = '<div class="empty-state">Поездок пока нет. Добавьте первую!</div>';
      return;
    }

    this.els.list.innerHTML = trips.map(t => {
      const isCompleted = t.status === 'completed';
      const statusClass = isCompleted ? 'completed' : '';
      const gcalLink = this.store.generateGCalLink(t);
      // clean ID for CSS view-transition-name
      const vtId = t.id.replace(/[^a-zA-Z0-9]/g, '');
      
      return html`
        <div class="swipe-container" style="view-transition-name: trip-${vtId};">
          <div class="swipe-actions-bg swipe-bg-complete" id="bg-c-${t.id}" style="opacity:0">✓ Завершить</div>
          <div class="swipe-actions-bg swipe-bg-delete" id="bg-d-${t.id}" style="opacity:0">✕ Удалить</div>
          
          <div class="swipe-content ${statusClass}" data-id="${t.id}" id="swp-${t.id}">
            <div class="trip-info">
              <div class="trip-time">${t.date} ${t.time}</div>
              <div class="trip-client">${t.clientName} <span style="font-weight:normal; color:#888;">(€${t.price})</span></div>
              <div class="trip-route">${t.pickup} ➔ ${t.dropoff}</div>
            </div>
            <div class="trip-actions no-print">
              ${!isCompleted ? html`<a href="${gcalLink}" target="_blank" class="btn btn-outline" style="text-decoration:none; padding:4px 8px; font-size:12px;" title="В календарь">📅</a>` : html`<span style="color:var(--brand-accent); font-size:12px; margin-right:10px;">Завершено</span>`}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}
