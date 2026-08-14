import { formatCurrency, formatNumber, html } from './shared/utils.js';

export class CalculatorView {
  constructor(store) {
    this.store = store;
    this.chart = null;
    this.initDOM();
    this.bindEvents();
    
    this.store.subscribe((data) => this.render(data));
  }

  initDOM() {
    this.els = {
      dailyNet: document.getElementById('val-daily-net'),
      tipsDay: document.getElementById('val-tips-day'),
      safetyDay: document.getElementById('val-safety-day'),
      yearRev: document.getElementById('val-year-rev'),
      yearProfit: document.getElementById('val-year-profit'),
      
      inpCheck: document.getElementById('inp-check'),
      lblCheck: document.getElementById('lbl-check'),
      inpTrips: document.getElementById('inp-trips'),
      lblTrips: document.getElementById('lbl-trips'),
      inpSeason: document.getElementById('inp-season'),
      lblSeason: document.getElementById('lbl-season'),
      inpTips: document.getElementById('inp-tips'),
      lblTips: document.getElementById('lbl-tips'),
      
      togPort: document.getElementById('tog-port'),
      togIns: document.getElementById('tog-ins'),
      togWash: document.getElementById('tog-wash'),
      
      segOwners: document.getElementById('seg-owners'),
      segDrivers: document.getElementById('seg-drivers')
    };

    this.tabs = document.querySelectorAll('.tab-content');
    this.navs = document.querySelectorAll('.nav-item');
    // ctx is grabbed lazily in renderChart so hidden canvas doesn't crash
    this.ctx = null;
  }

  bindEvents() {
    this.bindSlider(this.els.inpCheck, this.els.lblCheck, 'checkGross', '€');
    this.bindSlider(this.els.inpTrips, this.els.lblTrips, 'tripsPerDay', '');
    this.bindSlider(this.els.inpSeason, this.els.lblSeason, 'seasonDays', '');
    this.bindSlider(this.els.inpTips, this.els.lblTips, 'tipsPerTrip', '€');

    this.bindToggle(this.els.togPort, 'portFeesEnabled');
    this.bindToggle(this.els.togIns, 'insuranceTaxi');
    this.bindToggle(this.els.togWash, 'washPremium');

    this.bindSegment(this.els.segOwners, 'ownersCount');
    this.bindSegment(this.els.segDrivers, 'hiredDrivers');

  }

  bindSlider(input, label, stateKey, prefix = '') {
    input.value = this.store.state[stateKey];
    label.textContent = prefix + this.store.state[stateKey];
    input.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      label.textContent = prefix + val;
      this.store.update({ [stateKey]: val });
    });
  }

  bindToggle(checkbox, stateKey) {
    checkbox.checked = this.store.state[stateKey];
    checkbox.addEventListener('change', (e) => {
      this.store.update({ [stateKey]: e.target.checked });
    });
  }

  bindSegment(container, stateKey) {
    const btns = container.querySelectorAll('.seg-btn');
    const initVal = this.store.state[stateKey];
    btns.forEach(btn => {
      if (parseInt(btn.dataset.val) === initVal) btn.classList.add('active');
      else btn.classList.remove('active');
      
      btn.addEventListener('click', (e) => {
        btns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.store.update({ [stateKey]: parseInt(e.currentTarget.dataset.val) });
      });
    });
  }

  render(data) {
    const m = data.metrics;
    
    this.els.dailyNet.textContent = formatCurrency(m.dailyNetPerOwner);
    
    const dailyTipsPerOwner = m.tipsCashPerOwner / data.state.seasonDays;
    const dailySafety = m.safetyNet / data.state.seasonDays;
    
    this.els.tipsDay.textContent = formatCurrency(dailyTipsPerOwner);
    this.els.safetyDay.textContent = formatCurrency(dailySafety);
    
    this.els.yearRev.textContent = formatCurrency(m.netRevenue);
    this.els.yearProfit.textContent = formatCurrency(m.netProfitPerOwnerYear);
    
    this.renderChart(m);
  }

  renderChart(metrics) {
    const data = [
      metrics.fuelCost,
      metrics.totalMaintenance,
      metrics.fixedAdmin,
      metrics.hiredLaborCost,
      metrics.safetyNet,
      metrics.netProfitYear
    ];

    // Grab canvas context lazily — canvas may be in hidden tab at boot
    if (!this.ctx) {
      const canvas = document.getElementById('expensesChart');
      if (!canvas) return;
      this.ctx = canvas.getContext('2d');
    }
    
    if (this.chart) {
      this.chart.data.datasets[0].data = data;
      this.chart.update();
      return;
    }

    this.chart = new Chart(this.ctx, {
      type: 'doughnut',
      data: {
        labels: ['Топливо', 'Износ (ТО)', 'Фиксы (Налоги/Страх)', 'Наемные водители', 'Резерв', 'Чистая Прибыль'],
        datasets: [{
          data: data,
          backgroundColor: [
            '#FF4D88', // Elite Pink (Fuel)
            '#FB7185', // Soft Coral (Maintenance)
            '#A78BFA', // Violet Mist (Admin / Insurance)
            '#818CF8', // Indigo Light (Drivers)
            '#6366F1', // Indigo Deep (Safety Net)
            '#2DD4BF'  // Neo-Teal / Mint (Net Profit)
          ],
          borderWidth: 3,
          borderColor: 'rgba(12, 8, 28, 0.95)',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: { position: 'right', labels: { color: '#B0B6C4', font: { family: "'JetBrains Mono', monospace", size: 9 } } }
        }
      }
    });
  }
}
