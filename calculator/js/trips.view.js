import { html } from './shared/utils.js';
import { FlightService } from './shared/flight.service.js';

export class TripsView {
  constructor(tripsStore) {
    this.store = tripsStore;
    this.initDOM();
    this.bindEvents();
    
    // View Transitions for initial load and store updates
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
      hero: document.getElementById('next-trip-hero'),
      list: document.getElementById('trips-list'),
      btnAdd: document.getElementById('btn-add-trip'),
      btnExport: document.getElementById('btn-export-csv'),
      btnHud: document.getElementById('btn-driver-hud'),
      modal: document.getElementById('modal-add-trip'),
      form: document.getElementById('form-trip'),
      btnCancel: document.getElementById('btn-cancel-trip'),
      
      // HUD Modal elements
      modalHud: document.getElementById('modal-driver-hud'),
      btnCloseHud: document.getElementById('btn-close-hud'),
      hudContent: document.getElementById('hud-content'),
      
      inpClient: document.getElementById('trip-client'),
      inpDate: document.getElementById('trip-date'),
      inpTime: document.getElementById('trip-time'),
      inpPickup: document.getElementById('trip-pickup'),
      inpDropoff: document.getElementById('trip-dropoff'),
      inpPrice: document.getElementById('trip-price'),
    };
    
    if (this.els.inpDate) {
      this.els.inpDate.value = new Date().toISOString().split('T')[0];
    }
  }

  bindEvents() {
    if (this.els.btnAdd) {
      this.els.btnAdd.addEventListener('click', () => {
        this.els.modal.classList.remove('hidden');
      });
    }

    if (this.els.btnCancel) {
      this.els.btnCancel.addEventListener('click', () => {
        this.els.modal.classList.add('hidden');
      });
    }

    if (this.els.btnExport) {
      this.els.btnExport.addEventListener('click', () => {
        this.store.exportCSV();
      });
    }

    // Driver HUD open / close
    if (this.els.btnHud) {
      this.els.btnHud.addEventListener('click', () => {
        this.openDriverHud();
      });
    }

    if (this.els.btnCloseHud) {
      this.els.btnCloseHud.addEventListener('click', () => {
        this.closeDriverHud();
      });
    }

    if (this.els.form) {
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
    }

    this.bindSwipeGestures();
  }

  openDriverHud() {
    const nextTrip = this.store.getNextUpcomingTrip();
    if (!nextTrip) {
      alert('Нет активных трансферов для отображения в HUD!');
      return;
    }
    this.renderHudContent(nextTrip);
    this.els.modalHud.classList.remove('hidden');
  }

  closeDriverHud() {
    this.els.modalHud.classList.add('hidden');
  }

  renderHudContent(t) {
    const flight = FlightService.resolveFlightStatus(t);
    const navUrl = FlightService.getGoogleMapsNavUrl(t.dropoff, t.pickup);
    const flightBadge = flight ? html`
      <div class="hud-flight-tag status-${flight.status}">
        <span class="flight-pulse-dot"></span>
        <span class="flight-tag-code">${flight.flightCode}</span>
        <span class="flight-tag-lbl">${flight.label}</span>
      </div>
    ` : '';

    this.els.hudContent.innerHTML = html`
      <div class="hud-main-card">
        <div class="hud-time-row">
          <div class="hud-time-val">${t.time}</div>
          <div class="hud-date-val">${t.date}</div>
        </div>

        ${flightBadge}

        <div class="hud-route-block">
          <div class="hud-label">ОТКУДА</div>
          <div class="hud-address">${t.pickup}</div>
          <div class="hud-divider">↓</div>
          <div class="hud-label">КУДА (ФИНИШ)</div>
          <div class="hud-address-dest">${t.dropoff}</div>
        </div>

        <div class="hud-client-row">
          <div class="hud-client-name">${t.clientName}</div>
          <div class="hud-price-val">€${t.price}</div>
        </div>

        <div class="hud-actions-grid">
          <a href="${navUrl}" target="_blank" class="hud-btn hud-btn-nav" id="hud-nav-btn">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            НАВИГАТОР
          </a>
          <button class="hud-btn hud-btn-done" id="hud-complete-btn">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            ЗАВЕРШИТЬ
          </button>
        </div>
      </div>
    `.value;

    const btnComplete = document.getElementById('hud-complete-btn');
    if (btnComplete) {
      btnComplete.addEventListener('click', async () => {
        if (navigator.vibrate) navigator.vibrate(80);
        await this.store.updateTripStatus(t.id, 'completed');
        this.closeDriverHud();
      });
    }
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
      const tId = tripId;
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

  renderNextTripHero(nextTrip) {
    if (!this.els.hero) return;
    if (!nextTrip) {
      this.els.hero.innerHTML = '';
      this.els.hero.style.display = 'none';
      return;
    }

    this.els.hero.style.display = 'block';
    const flight = FlightService.resolveFlightStatus(nextTrip);
    const navUrl = FlightService.getGoogleMapsNavUrl(nextTrip.dropoff, nextTrip.pickup);
    const gcalLink = this.store.generateGCalLink(nextTrip);

    const flightBadge = flight ? html`
      <a href="${flight.radarUrl}" target="_blank" class="flight-radar-badge status-${flight.status}" title="Открыть на Flightradar24">
        <span class="flight-pulse-dot"></span>
        <span class="flight-code">${flight.flightCode}</span>
        <span class="flight-label">${flight.label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
    ` : '';

    this.els.hero.innerHTML = html`
      <div class="hero-focus-card">
        <div class="hero-focus-top">
          <div class="hero-focus-badge">
            <span class="hero-badge-dot"></span>
            СЛЕДУЮЩИЙ ТРАНСФЕР
          </div>
          <div class="hero-focus-time">
            <span class="focus-time-large">${nextTrip.time}</span>
            <span class="focus-date-sub">${nextTrip.date}</span>
          </div>
        </div>

        <div class="hero-focus-main">
          <div class="hero-focus-client">${nextTrip.clientName}</div>
          <div class="hero-focus-route">
            <span class="route-point">${nextTrip.pickup}</span>
            <svg class="route-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            <span class="route-point bold">${nextTrip.dropoff}</span>
          </div>
          ${flightBadge}
        </div>

        <div class="hero-focus-actions">
          <a href="${navUrl}" target="_blank" class="btn btn-hero-nav" title="Маршрут в Google Maps">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            Навигатор
          </a>
          <button class="btn btn-hero-hud" id="hero-open-hud-btn" title="Развернуть на весь экран">
            🚗 HUD
          </button>
          <a href="${gcalLink}" target="_blank" class="btn btn-hero-icon" title="В Календарь">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </a>
        </div>
      </div>
    `.value;

    const btnHeroHud = document.getElementById('hero-open-hud-btn');
    if (btnHeroHud) {
      btnHeroHud.addEventListener('click', () => this.openDriverHud());
    }
  }

  render(trips) {
    const nextTrip = this.store.getNextUpcomingTrip();
    this.renderNextTripHero(nextTrip);

    if (trips.length === 0) {
      this.els.list.innerHTML = '<div class="empty-state">Поездок пока нет. Добавьте первую!</div>';
      return;
    }

    this.els.list.innerHTML = trips.map(t => {
      const isCompleted = t.status === 'completed';
      const statusClass = isCompleted ? 'completed' : '';
      const gcalLink = this.store.generateGCalLink(t);
      const vtId = t.id.replace(/[^a-zA-Z0-9]/g, '');
      const flight = FlightService.resolveFlightStatus(t);

      const flightBadge = flight ? html`
        <a href="${flight.radarUrl}" target="_blank" class="flight-mini-badge status-${flight.status}" title="Flightradar24">
          <span class="flight-pulse-dot"></span>
          <span>${flight.flightCode}</span>
          <span class="flight-mini-lbl">${flight.label}</span>
        </a>
      ` : '';

      const actionBtn = isCompleted
        ? html`<span class="trip-done-badge">Завершено</span>`
        : html`<a href="${gcalLink}" target="_blank" class="trip-gcal-btn" title="Добавить в Google Calendar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </a>`;

      return html`
        <div class="swipe-container" style="view-transition-name: trip-${vtId};">
          <div class="swipe-actions-bg swipe-bg-complete" id="bg-c-${t.id}" style="opacity:0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Завершить
          </div>
          <div class="swipe-actions-bg swipe-bg-delete" id="bg-d-${t.id}" style="opacity:0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Удалить
          </div>
          
          <div class="swipe-content ${statusClass}" data-id="${t.id}" id="swp-${t.id}">
            <div class="trip-meta">
              <div class="trip-datetime">
                <span class="trip-date">${t.date}</span>
                <span class="trip-time-badge">${t.time}</span>
              </div>
              ${flightBadge}
            </div>
            <div class="trip-body">
              <div class="trip-client">${t.clientName}</div>
              <div class="trip-route">
                <span class="trip-point">${t.pickup}</span>
                <svg class="trip-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                <span class="trip-point">${t.dropoff}</span>
              </div>
            </div>
            <div class="trip-footer">
              <span class="trip-price">€${t.price}</span>
              ${actionBtn}
            </div>
          </div>
        </div>
      `.value;
    }).join('');
  }
}
