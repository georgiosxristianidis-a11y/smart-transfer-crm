import { formatCurrency, html } from './shared/utils.js';

export class FuelView {
  constructor(fuelStore) {
    this.store = fuelStore;
    this.currentPeriod = 'month'; // 'day' | 'week' | 'month'
    this.initDOM();
    this.bindEvents();
    
    this.store.subscribe((metrics) => this.render(metrics));
  }

  initDOM() {
    this.els = {
      container: document.getElementById('tab-fuel'),
      heroAmount: document.getElementById('fuel-hero-amount'),
      heroLiters: document.getElementById('fuel-hero-liters'),
      heroPeriodLabel: document.getElementById('fuel-hero-period-lbl'),
      periodBtns: document.querySelectorAll('.fuel-period-btn'),
      
      btnQuick20: document.getElementById('btn-fuel-quick-20'),
      btnQuick50: document.getElementById('btn-fuel-quick-50'),
      btnQuick90: document.getElementById('btn-fuel-quick-90'),
      btnCustom: document.getElementById('btn-fuel-custom'),
      
      logsList: document.getElementById('fuel-logs-list')
    };
  }

  bindEvents() {
    // Period switcher (Day / Week / Month)
    if (this.els.periodBtns) {
      this.els.periodBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.els.periodBtns.forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
          this.currentPeriod = e.currentTarget.dataset.period;
          if (navigator.vibrate) navigator.vibrate(30);
          this.render(this.store.getMetrics());
        });
      });
    }

    // Quick add buttons
    if (this.els.btnQuick20) {
      this.els.btnQuick20.addEventListener('click', () => this.handleQuickAdd(20));
    }
    if (this.els.btnQuick50) {
      this.els.btnQuick50.addEventListener('click', () => this.handleQuickAdd(50));
    }
    if (this.els.btnQuick90) {
      this.els.btnQuick90.addEventListener('click', () => this.handleQuickAdd(90, 'Полный бак'));
    }
    if (this.els.btnCustom) {
      this.els.btnCustom.addEventListener('click', () => {
        const val = prompt('Введите сумму заправки (€):', '40');
        if (val) {
          const num = parseFloat(val);
          if (num > 0) this.handleQuickAdd(num, 'Заправка');
        }
      });
    }
  }

  handleQuickAdd(amount, station = 'Заправка') {
    if (navigator.vibrate) navigator.vibrate(50);
    this.store.addFuelLog(amount, null, station);
  }

  render(metrics) {
    if (!this.els.heroAmount) return;

    let displayAmount = metrics.monthAmount;
    let displayLiters = metrics.monthLiters;
    let periodName = 'ЗА ТЕКУЩИЙ МЕСЯЦ';

    if (this.currentPeriod === 'day') {
      displayAmount = metrics.todayAmount;
      displayLiters = metrics.todayLiters;
      periodName = 'СЕГОДНЯ';
    } else if (this.currentPeriod === 'week') {
      displayAmount = metrics.weekAmount;
      displayLiters = metrics.weekLiters;
      periodName = 'ЗА ПОСЛЕДНИЕ 7 ДНЕЙ';
    }

    this.els.heroAmount.textContent = `€${Math.round(displayAmount)}`;
    if (this.els.heroLiters) {
      this.els.heroLiters.textContent = `${displayLiters} L`;
    }
    if (this.els.heroPeriodLabel) {
      this.els.heroPeriodLabel.textContent = periodName;
    }

    this.renderLogs(metrics.logs);
  }

  renderLogs(logs) {
    if (!this.els.logsList) return;

    if (!logs || logs.length === 0) {
      this.els.logsList.innerHTML = '<div class="empty-state">Нет записей о заправках</div>';
      return;
    }

    this.els.logsList.innerHTML = logs.slice(0, 8).map(log => html`
      <div class="fuel-log-item">
        <div class="fuel-log-left">
          <div class="fuel-icon-chip">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/>
              <path d="M15 11h2a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2v0a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1"/>
              <rect x="6" y="6" width="6" height="5" rx="1"/>
            </svg>
          </div>
          <div>
            <div class="fuel-log-station">${log.station || 'Заправка'}</div>
            <div class="fuel-log-meta">${log.date} · ${log.time}</div>
          </div>
        </div>
        <div class="fuel-log-right">
          <div class="fuel-log-price">-€${log.amount}</div>
          <div class="fuel-log-liters">${log.liters} л</div>
          <button class="fuel-delete-btn" data-id="${log.id}" title="Удалить">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `.value).join('');

    // Bind delete buttons
    this.els.logsList.querySelectorAll('.fuel-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm('Удалить эту запись заправки?')) {
          this.store.deleteFuelLog(id);
        }
      });
    });
  }
}
