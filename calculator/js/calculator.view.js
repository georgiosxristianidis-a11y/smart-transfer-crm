import { formatCurrency } from './shared/utils.js';

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
      chartCenterProfit: document.getElementById('chart-center-profit'),
      
      inpCheck: document.getElementById('inp-check'),
      lblCheck: document.getElementById('lbl-check'),
      inpTrips: document.getElementById('inp-trips'),
      lblTrips: document.getElementById('lbl-trips'),
      inpSeason: document.getElementById('inp-season'),
      lblSeason: document.getElementById('lbl-season'),
      inpTips: document.getElementById('inp-tips'),
      lblTips: document.getElementById('lbl-tips'),
      
      // VisionOS Stepper Elements
      btnOwnerDec: document.getElementById('btn-owner-dec'),
      btnOwnerInc: document.getElementById('btn-owner-inc'),
      valOwnersCount: document.getElementById('val-owners-count'),

      // Settings Modal & 3-Dots Button
      btnCalcSettings: document.getElementById('btn-calc-settings'),
      modalCalcSettings: document.getElementById('modal-calc-settings'),
      btnCloseCalcSettings: document.getElementById('btn-close-calc-settings'),
      btnDoneCalcSettings: document.getElementById('btn-done-calc-settings'),

      warnMinFare: document.getElementById('warn-min-fare'),
      segLicense: document.getElementById('seg-license'),

      togPort: document.getElementById('tog-port'),
      togIns: document.getElementById('tog-ins'),
      togWash: document.getElementById('tog-wash'),
      segDrivers: document.getElementById('seg-drivers')
    };

    this.ctx = null;
  }

  bindEvents() {
    this.bindSlider(this.els.inpCheck, this.els.lblCheck, 'checkGross', '€');
    this.bindSlider(this.els.inpTrips, this.els.lblTrips, 'tripsPerDay', '');
    this.bindSlider(this.els.inpSeason, this.els.lblSeason, 'seasonDays', '');
    this.bindSlider(this.els.inpTips, this.els.lblTips, 'tipsPerTrip', '€');

    // Stepper bindings (Min 1, Max 3, Default 2)
    this.bindOwnersStepper();

    // 3-Dots Settings Modal bindings
    this.bindSettingsModal();

    if (this.els.togPort) this.bindToggle(this.els.togPort, 'portFeesEnabled');
    if (this.els.togIns) this.bindToggle(this.els.togIns, 'insuranceTaxi');
    if (this.els.togWash) this.bindToggle(this.els.togWash, 'washPremium');
    if (this.els.segDrivers) this.bindSegment(this.els.segDrivers, 'hiredDrivers');
    if (this.els.segLicense) this.bindSegment(this.els.segLicense, 'licenseMode', (v) => v);
  }

  bindOwnersStepper() {
    if (!this.els.btnOwnerDec || !this.els.btnOwnerInc || !this.els.valOwnersCount) return;

    const updateStepperUI = (val) => {
      this.els.valOwnersCount.textContent = val;
      this.els.btnOwnerDec.disabled = val <= 1;
      this.els.btnOwnerInc.disabled = val >= 3;
      this.els.btnOwnerDec.style.opacity = val <= 1 ? '0.35' : '1';
      this.els.btnOwnerInc.style.opacity = val >= 3 ? '0.35' : '1';
    };

    const initialVal = this.store.state.ownersCount || 2;
    updateStepperUI(initialVal);

    this.els.btnOwnerDec.addEventListener('click', () => {
      let curr = this.store.state.ownersCount || 2;
      if (curr > 1) {
        if (navigator.vibrate) navigator.vibrate(40);
        curr--;
        updateStepperUI(curr);
        this.store.update({ ownersCount: curr });
      }
    });

    this.els.btnOwnerInc.addEventListener('click', () => {
      let curr = this.store.state.ownersCount || 2;
      if (curr < 3) {
        if (navigator.vibrate) navigator.vibrate(40);
        curr++;
        updateStepperUI(curr);
        this.store.update({ ownersCount: curr });
      }
    });
  }

  bindSettingsModal() {
    if (this.els.btnCalcSettings && this.els.modalCalcSettings) {
      this.els.btnCalcSettings.addEventListener('click', () => {
        this.els.modalCalcSettings.classList.remove('hidden');
      });
    }

    const closeModal = () => {
      if (this.els.modalCalcSettings) {
        this.els.modalCalcSettings.classList.add('hidden');
      }
    };

    if (this.els.btnCloseCalcSettings) {
      this.els.btnCloseCalcSettings.addEventListener('click', closeModal);
    }
    if (this.els.btnDoneCalcSettings) {
      this.els.btnDoneCalcSettings.addEventListener('click', closeModal);
    }
  }

  bindSlider(input, label, stateKey, prefix = '') {
    if (!input || !label) return;
    input.value = this.store.state[stateKey];
    label.textContent = prefix + this.store.state[stateKey];
    input.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      label.textContent = prefix + val;
      this.store.update({ [stateKey]: val });
    });
  }

  bindToggle(checkbox, stateKey) {
    if (!checkbox) return;
    checkbox.checked = this.store.state[stateKey];
    checkbox.addEventListener('change', (e) => {
      this.store.update({ [stateKey]: e.target.checked });
    });
  }

  // `parse` maps the data-val attribute onto the store's type — numeric by default,
  // identity for enum fields such as licenseMode.
  bindSegment(container, stateKey, parse = (v) => parseInt(v)) {
    if (!container) return;
    const btns = container.querySelectorAll('.seg-btn');
    const initVal = this.store.state[stateKey];
    btns.forEach(btn => {
      if (parse(btn.dataset.val) === initVal) btn.classList.add('active');
      else btn.classList.remove('active');

      btn.addEventListener('click', (e) => {
        btns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.store.update({ [stateKey]: parse(e.currentTarget.dataset.val) });
      });
    });
  }

  render(data) {
    const m = data.metrics;
    
    if (this.els.dailyNet) this.els.dailyNet.textContent = formatCurrency(m.dailyNetPerOwner);
    
    const dailyTipsPerOwner = m.tipsCashPerOwner / data.state.seasonDays;
    const dailySafety = m.safetyNet / data.state.seasonDays;
    
    if (this.els.tipsDay) this.els.tipsDay.textContent = formatCurrency(dailyTipsPerOwner);
    if (this.els.safetyDay) this.els.safetyDay.textContent = formatCurrency(dailySafety);
    
    if (this.els.yearRev) this.els.yearRev.textContent = formatCurrency(m.netRevenue);
    if (this.els.yearProfit) this.els.yearProfit.textContent = formatCurrency(m.netProfitPerOwnerYear);
    if (this.els.chartCenterProfit) this.els.chartCenterProfit.textContent = formatCurrency(m.netProfitYear);

    if (this.els.warnMinFare) {
      this.els.warnMinFare.classList.toggle('is-hidden', !m.fareBelowMinimum);
    }

    this.renderChart(m);
  }

  createCanvasGradients(ctx) {
    // 6 luminous neon gradient pairs
    const pairs = [
      ['#FF4D88', '#FF75A0'], // Fuel (Elite Pink)
      ['#FB7185', '#FDA4AF'], // Maintenance (Soft Coral)
      ['#A78BFA', '#DDD6FE'], // Fixed Admin (Violet Pearl)
      ['#818CF8', '#C7D2FE'], // Drivers (Indigo Light)
      ['#6366F1', '#818CF8'], // Safety Net (Indigo Deep)
      ['#2DD4BF', '#99F6E4']  // Net Profit (Neo-Mint Glow)
    ];

    return pairs.map(([start, end]) => {
      const grad = ctx.createLinearGradient(0, 0, 200, 200);
      grad.addColorStop(0, start);
      grad.addColorStop(1, end);
      return grad;
    });
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

    const gradients = this.createCanvasGradients(this.ctx);

    if (typeof Chart === 'undefined') return;

    this.chart = new Chart(this.ctx, {
      type: 'doughnut',
      data: {
        labels: ['Топливо', 'Износ (ТО)', 'Фиксы (Налоги/Страх)', 'Наемные водители', 'Резерв', 'Чистая Прибыль'],
        datasets: [{
          data: data,
          backgroundColor: gradients,
          borderWidth: 3,
          borderColor: 'rgba(12, 8, 28, 0.95)',
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '74%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#B0B6C4',
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { family: "'JetBrains Mono', monospace", size: 10 }
            }
          }
        }
      }
    });
  }
}
