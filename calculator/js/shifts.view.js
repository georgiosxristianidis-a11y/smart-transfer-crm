import { html } from './shared/utils.js';
import { SHIFT_STATUS } from './shifts.store.js';

/**
 * Trips that count toward the norm shown on screen. With a shift running,
 * only that shift's own completed trips count — a night shift crossing
 * midnight is one continuous count, not two. With no shift open, behaviour
 * is exactly what it was before this card: today's date.
 */
export function selectNormTrips(trips, openShift, todayStr) {
  const list = Array.isArray(trips) ? trips : [];
  if (openShift) {
    return list.filter(t => t.shiftId === openShift.id && t.status === 'completed');
  }
  return list.filter(t => t.date === todayStr && t.status === 'completed');
}

/** "H ч MM мин" elapsed since a shift's local `startedAt` stamp ("YYYY-MM-DDTHH:MM"). */
export function formatElapsed(startedAt, now = new Date()) {
  if (typeof startedAt !== 'string' || !startedAt) return '';
  const started = new Date(startedAt);
  if (isNaN(started.getTime())) return '';
  let diffMin = Math.floor((now.getTime() - started.getTime()) / 60000);
  if (diffMin < 0) diffMin = 0;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `${h} ч ${String(m).padStart(2, '0')} мин`;
}

/** "HH:MM" out of a shift's local `startedAt` stamp, for the bar's meta line. */
export function formatStartTime(startedAt) {
  if (typeof startedAt !== 'string' || startedAt.length < 16) return '';
  return startedAt.slice(11, 16);
}

/** "H ч MM мин" duration between two local stamps ("YYYY-MM-DDTHH:MM"). */
export function formatShiftDuration(startedAt, endedAt) {
  if (typeof startedAt !== 'string' || !startedAt || typeof endedAt !== 'string' || !endedAt) return '';
  const started = new Date(startedAt);
  const ended = new Date(endedAt);
  if (isNaN(started.getTime()) || isNaN(ended.getTime())) return '';
  let diffMin = Math.floor((ended.getTime() - started.getTime()) / 60000);
  if (diffMin < 0) diffMin = 0;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `${h} ч ${String(m).padStart(2, '0')} мин`;
}

/** "HH:MM – HH:MM" range from startedAt and endedAt stamps. */
export function formatShiftTimeRange(startedAt, endedAt) {
  const start = formatStartTime(startedAt);
  const end = formatStartTime(endedAt);
  if (start && end) return `${start} – ${end}`;
  if (start) return `с ${start}`;
  return '';
}

/** Distance formatted as "+N км" or "—" if null. */
export function formatShiftDistance(distance) {
  if (distance === null || distance === undefined || isNaN(Number(distance))) return '—';
  return `+${distance} км`;
}

export class ShiftsView {
  constructor(shiftsStore, calcStore) {
    this.store = shiftsStore;
    this.calcStore = calcStore;
    this._tick = null;

    this.initDOM();
    this.bindEvents();

    this.store.subscribe(() => this.render());

    this._onVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        this._stopTimer();
      } else {
        this.render();
        this._startTimer();
      }
    };

    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('visibilitychange', this._onVisibilityChange);
    }

    if (typeof document === 'undefined' || document.visibilityState !== 'hidden') {
      this._startTimer();
    }
  }

  _startTimer() {
    if (!this._tick) {
      // Elapsed time on the bar drifts stale without a live shift; a driver
      // watching it should not have to trigger some other event to refresh it.
      this._tick = setInterval(() => this.render(), 60000);
    }
  }

  _stopTimer() {
    if (this._tick) {
      clearInterval(this._tick);
      this._tick = null;
    }
  }

  destroy() {
    this._stopTimer();
    if (typeof document !== 'undefined' && document.removeEventListener && this._onVisibilityChange) {
      document.removeEventListener('visibilitychange', this._onVisibilityChange);
    }
  }

  initDOM() {
    this.els = {
      bar: document.getElementById('shift-bar'),
      status: document.getElementById('shift-bar-status'),
      meta: document.getElementById('shift-bar-meta'),
      btnOpen: document.getElementById('btn-open-shift'),
      btnClose: document.getElementById('btn-close-shift'),
      shiftsHistoryList: document.getElementById('shifts-history-list'),

      modalOpen: document.getElementById('modal-open-shift'),
      formOpen: document.getElementById('form-open-shift'),
      inpOdoStart: document.getElementById('inp-shift-odo-start'),
      errOpen: document.getElementById('err-open-shift'),
      btnCloseOpenModal: document.getElementById('btn-close-open-shift-modal'),
      btnCancelOpen: document.getElementById('btn-cancel-open-shift'),

      modalClose: document.getElementById('modal-close-shift'),
      formClose: document.getElementById('form-close-shift'),
      inpOdoEnd: document.getElementById('inp-shift-odo-end'),
      errClose: document.getElementById('err-close-shift'),
      btnCloseCloseModal: document.getElementById('btn-close-close-shift-modal'),
      btnCancelClose: document.getElementById('btn-cancel-close-shift')
    };
  }

  bindEvents() {
    if (this.els.btnOpen) {
      this.els.btnOpen.addEventListener('click', () => this.showOpenModal());
    }
    if (this.els.btnClose) {
      this.els.btnClose.addEventListener('click', () => this.showCloseModal());
    }

    if (this.els.btnCloseOpenModal) {
      this.els.btnCloseOpenModal.addEventListener('click', () => this.hideOpenModal());
    }
    if (this.els.btnCancelOpen) {
      this.els.btnCancelOpen.addEventListener('click', () => this.hideOpenModal());
    }
    if (this.els.formOpen) {
      this.els.formOpen.addEventListener('submit', (e) => this.handleOpenSubmit(e));
    }

    if (this.els.btnCloseCloseModal) {
      this.els.btnCloseCloseModal.addEventListener('click', () => this.hideCloseModal());
    }
    if (this.els.btnCancelClose) {
      this.els.btnCancelClose.addEventListener('click', () => this.hideCloseModal());
    }
    if (this.els.formClose) {
      this.els.formClose.addEventListener('submit', (e) => this.handleCloseSubmit(e));
    }
  }

  showOpenModal() {
    if (!this.els.modalOpen) return;
    if (this.els.inpOdoStart) this.els.inpOdoStart.value = '';
    this.setError(this.els.errOpen, '');
    this.els.modalOpen.classList.remove('hidden');
  }

  hideOpenModal() {
    if (this.els.modalOpen) this.els.modalOpen.classList.add('hidden');
  }

  showCloseModal() {
    if (!this.els.modalClose) return;
    if (this.els.inpOdoEnd) this.els.inpOdoEnd.value = '';
    this.setError(this.els.errClose, '');
    this.els.modalClose.classList.remove('hidden');
  }

  hideCloseModal() {
    if (this.els.modalClose) this.els.modalClose.classList.add('hidden');
  }

  setError(el, message) {
    if (!el) return;
    el.textContent = message || '';
    el.classList.toggle('hidden', !message);
  }

  async handleOpenSubmit(e) {
    e.preventDefault();
    const odoStart = this.els.inpOdoStart ? this.els.inpOdoStart.value : '';
    const normTarget = (this.calcStore && this.calcStore.state && this.calcStore.state.tripsPerDay)
      ? this.calcStore.state.tripsPerDay
      : null;

    try {
      await this.store.openShift({ odoStart, normTarget });
      if (navigator.vibrate) navigator.vibrate(30);
      this.hideOpenModal();
    } catch (err) {
      this.setError(this.els.errOpen, err.message);
    }
  }

  async handleCloseSubmit(e) {
    e.preventDefault();
    const open = this.store.getOpenShift();
    if (!open) {
      this.hideCloseModal();
      return;
    }
    const odoEnd = this.els.inpOdoEnd ? this.els.inpOdoEnd.value : '';

    try {
      await this.store.closeShift(open.id, { odoEnd });
      if (navigator.vibrate) navigator.vibrate(30);
      this.hideCloseModal();
    } catch (err) {
      this.setError(this.els.errClose, err.message);
    }
  }

  render() {
    this.renderBar();
    this.renderHistory();
  }

  renderBar() {
    const open = this.store.getOpenShift();

    if (this.els.btnOpen) this.els.btnOpen.classList.toggle('hidden', !!open);
    if (this.els.btnClose) this.els.btnClose.classList.toggle('hidden', !open);

    if (!open) {
      if (this.els.status) this.els.status.textContent = 'Смена не открыта';
      if (this.els.meta) this.els.meta.classList.add('hidden');
      return;
    }

    if (this.els.status) this.els.status.textContent = `Смена с ${formatStartTime(open.startedAt)}`;
    if (this.els.meta) {
      this.els.meta.textContent = formatElapsed(open.startedAt);
      this.els.meta.classList.remove('hidden');
    }
  }

  renderHistory() {
    if (!this.els.shiftsHistoryList) return;
    const closedShifts = (this.store.shifts || []).filter(s => s.status === SHIFT_STATUS.CLOSED);

    if (closedShifts.length === 0) {
      this.els.shiftsHistoryList.innerHTML = '<div class="empty-state">Нет записей о закрытых сменах</div>';
      return;
    }

    this.els.shiftsHistoryList.innerHTML = closedShifts.slice(0, 10).map(s => {
      const dist = this.store.getShiftDistance(s.id);
      const duration = formatShiftDuration(s.startedAt, s.endedAt);
      const timeRange = formatShiftTimeRange(s.startedAt, s.endedAt);
      const kmText = formatShiftDistance(dist);

      let odoText = '';
      if (s.odoStart !== null && s.odoEnd !== null) {
        odoText = `${s.odoStart} → ${s.odoEnd} км`;
      } else if (s.odoStart !== null) {
        odoText = `старт ${s.odoStart} км`;
      } else if (s.odoEnd !== null) {
        odoText = `финиш ${s.odoEnd} км`;
      }

      const metaParts = [s.date];
      if (duration) metaParts.push(duration);
      if (odoText) metaParts.push(odoText);
      const metaLine = metaParts.join(' · ');

      return html`
        <div class="shift-log-item">
          <div class="shift-log-left">
            <div class="shift-icon-chip">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <div class="shift-log-title">Смена ${timeRange}</div>
              <div class="shift-log-meta">${metaLine}</div>
            </div>
          </div>
          <div class="shift-log-right">
            <div class="shift-log-km">${kmText}</div>
            <div class="shift-log-sub">${dist !== null ? 'пробег' : 'без одометра'}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  /** Status enum re-export, so a caller need not import shifts.store separately. */
  static get STATUS() {
    return SHIFT_STATUS;
  }
}
