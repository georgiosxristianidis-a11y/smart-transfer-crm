import { CalculatorStore } from './calculator.store.js';
import { CalculatorView } from './calculator.view.js';
import { TripsStore } from './trips.store.js';
import { TripsView } from './trips.view.js';
import { FuelStore } from './fuel.store.js';
import { FuelView } from './fuel.view.js';
import { ShiftsStore } from './shifts.store.js';
import { ShiftsView, selectNormTrips } from './shifts.view.js';
import { BackupService } from './shared/backup.service.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Stores
  const calcStore = new CalculatorStore();
  const tripsStore = new TripsStore();
  const fuelStore = new FuelStore();
  const shiftsStore = new ShiftsStore();

  // Initialize Views
  new CalculatorView(calcStore);
  new TripsView(tripsStore, shiftsStore);
  new FuelView(fuelStore);
  new ShiftsView(shiftsStore, calcStore);

  // Backup & Restore handlers (AUDIT-05)
  const lblLastBackup = document.getElementById('lbl-last-backup');
  const btnExportBackup = document.getElementById('btn-export-backup');
  const btnTriggerImport = document.getElementById('btn-trigger-import');
  const inputBackupFile = document.getElementById('input-backup-file');

  const refreshBackupLabel = () => {
    if (lblLastBackup) {
      lblLastBackup.textContent = `Последний бэкап: ${BackupService.getLastBackupDate()}`;
    }
  };
  refreshBackupLabel();

  if (btnExportBackup) {
    btnExportBackup.addEventListener('click', () => {
      if (navigator.vibrate) navigator.vibrate(30);
      const snapshot = BackupService.exportBackup({ tripsStore, fuelStore, calcStore, shiftsStore });
      BackupService.downloadBackupFile(snapshot);
      refreshBackupLabel();
    });
  }

  if (btnTriggerImport && inputBackupFile) {
    btnTriggerImport.addEventListener('click', () => {
      if (navigator.vibrate) navigator.vibrate(30);
      inputBackupFile.click();
    });

    inputBackupFile.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const res = await BackupService.importBackup(json, { tripsStore, fuelStore, calcStore, shiftsStore });
        refreshBackupLabel();
        alert(`Данные успешно восстановлены!\nПоездок: ${res.stats.tripsCount}, Заправок: ${res.stats.fuelLogsCount}`);
      } catch (err) {
        alert('Ошибка при импорте резервной копии: ' + err.message);
      } finally {
        inputBackupFile.value = '';
      }
    });
  }

  // Live header stats & Shift Norm Elements (NAV-05)
  const elTodayRev = document.getElementById('hdr-today-rev');
  const elTodayRevLabel = document.getElementById('hdr-today-rev-label');
  const elTodayTrips = document.getElementById('hdr-today-trips');
  const elNormTarget = document.getElementById('hdr-norm-target');
  const elMonthRev = document.getElementById('hdr-month-rev');
  const elShiftFraction = document.getElementById('shift-norm-fraction');
  const elShiftFill = document.getElementById('shift-norm-fill');
  const elShiftProgress = document.getElementById('shift-norm-progressbar');

  let currentTrips = [];

  function updateNormAndStats() {
    // Use local date, not UTC — toISOString() returns UTC and shifts date by -3h before 03:00 local
    const now = new Date();
    const todayStr = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-');
    const trips = currentTrips;
    // DATA-11: with a shift open, the norm counts that shift's own trips —
    // a night shift crossing midnight no longer resets at 00:00. With no
    // shift open, this is exactly the prior by-date behaviour.
    const openShift = shiftsStore.getOpenShift();
    const normTrips = selectNormTrips(trips, openShift, todayStr);
    const monthTrips = trips.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && t.status === 'completed';
    });
    const todayRev = normTrips.reduce((s, t) => s + t.price, 0);
    const monthRev = monthTrips.reduce((s, t) => s + t.price, 0);
    const norm = (openShift && openShift.normTarget)
      ? openShift.normTarget
      : ((calcStore.state && calcStore.state.tripsPerDay) ? calcStore.state.tripsPerDay : 13);
    const completedCount = normTrips.length;
    const pct = Math.min(100, Math.round((completedCount / (norm || 1)) * 100));

    if (elTodayRev) elTodayRev.textContent = todayRev.toFixed(0);
    // The number under this label is the shift's money once a shift runs, and a
    // night shift reading "Сегодня €" at 00:30 would be showing yesterday's work.
    if (elTodayRevLabel) elTodayRevLabel.textContent = openShift ? 'Смена €' : 'Сегодня €';
    if (elTodayTrips) elTodayTrips.textContent = completedCount;
    if (elNormTarget) elNormTarget.textContent = norm;
    if (elMonthRev) elMonthRev.textContent = monthRev.toFixed(0);

    if (elShiftFraction) {
      if (completedCount >= norm && norm > 0) {
        elShiftFraction.textContent = `${completedCount} из ${norm} (норма выполнена!)`;
      } else {
        elShiftFraction.textContent = `${completedCount} из ${norm} поездок`;
      }
    }
    if (elShiftFill) {
      elShiftFill.style.width = `${pct}%`;
      if (completedCount >= norm && norm > 0) {
        elShiftFill.classList.add('goal-reached');
      } else {
        elShiftFill.classList.remove('goal-reached');
      }
    }
    if (elShiftProgress) {
      elShiftProgress.setAttribute('aria-valuenow', completedCount);
      elShiftProgress.setAttribute('aria-valuemax', norm);
    }
  }

  // Cross-store sync logic
  tripsStore.subscribe(trips => {
    currentTrips = trips || [];
    updateNormAndStats();
  });

  calcStore.subscribe(() => {
    updateNormAndStats();
  });

  shiftsStore.subscribe(() => {
    updateNormAndStats();
  });

  // Persistent Top-Right 3-Lines Settings Button
  const btnGlobalSettings = document.getElementById('btn-global-settings');
  const modalSettings = document.getElementById('modal-calc-settings');
  if (btnGlobalSettings && modalSettings) {
    btnGlobalSettings.addEventListener('click', () => {
      if (navigator.vibrate) navigator.vibrate(30);
      modalSettings.classList.remove('hidden');
    });
  }

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
        try {
          const vt = document.startViewTransition(switchTabs);
          if (vt && vt.finished) {
            vt.finished.catch(() => {});
          }
        } catch {
          switchTabs();
        }
      } else {
        switchTabs();
      }
    });
  });

  // Print button handler (AUDIT-06)
  const btnPrint = document.getElementById('btn-print');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  // Register Service Worker (AUDIT-06)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.error('[SW] Registration failed:', err);
    });
  }
});
