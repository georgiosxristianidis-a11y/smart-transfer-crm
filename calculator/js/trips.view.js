import { html, localDateKey } from './shared/utils.js';
import { FlightService } from './shared/flight.service.js';

export class TripsView {
  constructor(tripsStore) {
    this.store = tripsStore;
    this.selectedSource = 'hotel';
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
      btnCancelX: document.getElementById('btn-cancel-trip-x'),
      
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

      // Source Tag Chips in Modal
      sourcePills: document.querySelectorAll('.source-pill'),
      locationChips: document.querySelectorAll('.chip-btn')
    };
    
    if (this.els.inpDate) {
      this.els.inpDate.value = localDateKey();
    }
  }

  bindEvents() {
    if (this.els.btnAdd) {
      this.els.btnAdd.addEventListener('click', () => {
        this.els.modal.classList.remove('hidden');
      });
    }

    const closeModal = () => {
      this.els.modal.classList.add('hidden');
    };

    if (this.els.btnCancel) {
      this.els.btnCancel.addEventListener('click', closeModal);
    }
    if (this.els.btnCancelX) {
      this.els.btnCancelX.addEventListener('click', closeModal);
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

    // Quick location chips
    if (this.els.locationChips) {
      this.els.locationChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
          const val = e.currentTarget.dataset.val;
          if (navigator.vibrate) navigator.vibrate(30);
          
          if (!this.els.inpPickup.value) {
            this.els.inpPickup.value = val;
          } else {
            this.els.inpDropoff.value = val;
          }
        });
      });
    }

    // Source Tag Picker
    if (this.els.sourcePills) {
      this.els.sourcePills.forEach(pill => {
        pill.addEventListener('click', (e) => {
          this.els.sourcePills.forEach(p => p.classList.remove('active'));
          e.currentTarget.classList.add('active');
          this.selectedSource = e.currentTarget.dataset.source;
          if (navigator.vibrate) navigator.vibrate(30);
        });
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
          price: this.els.inpPrice.value,
          source: this.selectedSource
        });
        this.els.form.reset();
        this.els.inpDate.value = localDateKey();
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
      <a href="${flight.radarUrl}" target="_blank" rel="noopener noreferrer" class="hud-flight-tag status-${flight.status}">
        <span class="flight-pulse-dot"></span>
        <span class="flight-tag-code">${flight.flightCode}</span>
        <span class="flight-tag-lbl">${flight.label}</span>
      </a>
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
          <div class="hud-divider">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
          </div>
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

      // Vertical scroll check
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

    this.els.list.addEventListener('pointerup', async () => {
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

  getSourceIconSVG(source) {
    switch (source) {
      case 'hotel':
        return html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><line x1="9" y1="13" x2="9.01" y2="13"/><line x1="15" y1="13" x2="15.01" y2="13"/></svg> Гостиница`;
      case 'web':
        return html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Web`;
      case 'ads':
        return html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> Реклама`;
      case 'walkin':
        return html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Прямой`;
      case 'b2b':
        return html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> B2B`;
      default:
        return html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg> Заказ`;
    }
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
      <div class="flight-radar-row">
        <a href="${flight.radarUrl}" target="_blank" rel="noopener noreferrer" class="flight-radar-badge status-${flight.status}" title="Открыть на Flightradar24">
          <span class="flight-pulse-dot"></span>
          <span class="flight-code">${flight.flightCode}</span>
          <span class="flight-label">${flight.label}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      </div>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
            HUD
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

    const conflictSet = this.store.getConflicts();

    this.els.list.innerHTML = trips.map(t => {
      const isCompleted = t.status === 'completed';
      const statusClass = isCompleted ? 'completed' : '';
      const gcalLink = this.store.generateGCalLink(t);
      const vtId = t.id.replace(/[^a-zA-Z0-9]/g, '');
      const flight = FlightService.resolveFlightStatus(t);
      const hasConflict = conflictSet.has(t.id);

      const flightBadge = flight ? html`
        <a href="${flight.radarUrl}" target="_blank" rel="noopener noreferrer" class="flight-mini-badge status-${flight.status}" title="Flightradar24">
          <span class="flight-pulse-dot"></span>
          <span>${flight.flightCode}</span>
          <span class="flight-mini-lbl">${flight.label}</span>
        </a>
      ` : '';

      const conflictBadge = hasConflict ? html`
        <div class="conflict-badge" title="Интервал с другим рейсом менее 45 минут">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          &lt;45м
        </div>
      ` : '';

      const sourceBadge = t.source ? html`
        <div class="source-tag source-tag-${t.source}">
          ${this.getSourceIconSVG(t.source)}
        </div>
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
              <div class="trip-meta-right">
                ${conflictBadge}
                ${flightBadge}
                ${sourceBadge}
              </div>
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
