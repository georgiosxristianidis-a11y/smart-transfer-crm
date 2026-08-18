import { html, localDateKey } from './shared/utils.js';
import { FlightService } from './shared/flight.service.js';
import { ImportService } from './shared/import.service.js';

function safeViewTransition(fn) {
  if (typeof document !== 'undefined' && document.startViewTransition) {
    try {
      const vt = document.startViewTransition(fn);
      if (vt && vt.finished) {
        vt.finished.catch(() => {});
      }
    } catch {
      fn();
    }
  } else {
    fn();
  }
}

export class TripsView {
  constructor(tripsStore) {
    this.store = tripsStore;
    this.selectedSource = 'hotel';
    this.selectedAddPayment = 'cash';
    this.currentFilter = 'all'; // 'all' | 'active' | 'unpaid' | 'completed'
    this.searchQuery = '';
    this.importParsedTrips = [];
    this.importMode = 'append'; // 'append' | 'replace'

    this.initDOM();
    this.bindEvents();

    // Subscribe to store updates with safe view transition
    this.store.subscribe((trips) => {
      safeViewTransition(() => this.render(trips));
    });
  }

  initDOM() {
    this.els = {
      hero: document.getElementById('next-trip-hero'),
      list: document.getElementById('trips-list'),
      btnAdd: document.getElementById('btn-add-trip'),
      btnExport: document.getElementById('btn-export-csv'),
      btnHud: document.getElementById('btn-driver-hud'),
      
      // Single Add Modal elements
      modal: document.getElementById('modal-add-trip'),
      form: document.getElementById('form-trip'),
      btnCancel: document.getElementById('btn-cancel-trip'),
      btnCancelX: document.getElementById('btn-cancel-trip-x'),
      inpClient: document.getElementById('trip-client'),
      inpPhone: document.getElementById('trip-phone'),
      inpDate: document.getElementById('trip-date'),
      inpTime: document.getElementById('trip-time'),
      inpPickup: document.getElementById('trip-pickup'),
      inpDropoff: document.getElementById('trip-dropoff'),
      inpPax: document.getElementById('trip-pax'),
      inpRoom: document.getElementById('trip-room'),
      inpPrice: document.getElementById('trip-price'),
      sourcePills: document.querySelectorAll('.source-pill'),
      locationChips: document.querySelectorAll('.chip-btn'),
      paymentPills: document.querySelectorAll('#add-trip-payment-pills .payment-pill'),

      // Import Modal elements
      btnOpenImport: document.getElementById('btn-import-csv'),
      modalImport: document.getElementById('modal-import-trips'),
      btnCloseImport: document.getElementById('btn-close-import-modal'),
      btnCancelImport: document.getElementById('btn-cancel-import'),
      btnConfirmImport: document.getElementById('btn-confirm-import'),
      tabBtnPaste: document.getElementById('tab-btn-paste'),
      tabBtnFile: document.getElementById('tab-btn-file'),
      panelPaste: document.getElementById('import-panel-paste'),
      panelFile: document.getElementById('import-panel-file'),
      txtImportInput: document.getElementById('import-text-input'),
      btnPasteClipboard: document.getElementById('btn-paste-clipboard'),
      btnLoadSample: document.getElementById('btn-load-sample'),
      btnLoadSampleFile: document.getElementById('btn-load-sample-file'),
      dropzone: document.getElementById('import-dropzone'),
      btnBrowseFile: document.getElementById('btn-browse-file'),
      fileInput: document.getElementById('import-file-input'),
      inpImportDate: document.getElementById('import-target-date'),
      inpImportPrice: document.getElementById('import-default-price'),
      segImportMode: document.getElementById('seg-import-mode'),
      importPreviewTitle: document.getElementById('import-preview-title'),
      importFormatBadge: document.getElementById('import-format-badge'),
      importPreviewContainer: document.getElementById('import-preview-container'),

      // CRM Search & Filters
      inpSearch: document.getElementById('inp-trips-search'),
      btnClearSearch: document.getElementById('btn-clear-search'),
      filterPillsContainer: document.getElementById('crm-filter-pills'),
      cntFilterAll: document.getElementById('cnt-filter-all'),
      cntFilterActive: document.getElementById('cnt-filter-active'),
      cntFilterUnpaid: document.getElementById('cnt-filter-unpaid'),
      cntFilterCompleted: document.getElementById('cnt-filter-completed'),
      
      // HUD Modal elements
      modalHud: document.getElementById('modal-driver-hud'),
      btnCloseHud: document.getElementById('btn-close-hud'),
      hudContent: document.getElementById('hud-content')
    };
    
    if (this.els.inpDate) {
      this.els.inpDate.value = localDateKey();
    }
    if (this.els.inpImportDate) {
      this.els.inpImportDate.value = localDateKey();
    }
  }

  bindEvents() {
    // Single Add Modal open / close
    if (this.els.btnAdd) {
      this.els.btnAdd.addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(30);
        this.els.modal.classList.remove('hidden');
      });
    }

    const closeModal = () => {
      this.els.modal.classList.add('hidden');
    };

    if (this.els.btnCancel) this.els.btnCancel.addEventListener('click', closeModal);
    if (this.els.btnCancelX) this.els.btnCancelX.addEventListener('click', closeModal);

    if (this.els.btnExport) {
      this.els.btnExport.addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(30);
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

    // Payment Tag Picker in Single Add Modal
    if (this.els.paymentPills) {
      this.els.paymentPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
          this.els.paymentPills.forEach(p => p.classList.remove('active'));
          e.currentTarget.classList.add('active');
          this.selectedAddPayment = e.currentTarget.dataset.pay;
          if (navigator.vibrate) navigator.vibrate(30);
        });
      });
    }

    // Submit single trip
    if (this.els.form) {
      this.els.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.store.addTrip({
          clientName: this.els.inpClient.value,
          phone: this.els.inpPhone ? this.els.inpPhone.value : '',
          date: this.els.inpDate.value,
          time: this.els.inpTime.value,
          pickup: this.els.inpPickup.value,
          dropoff: this.els.inpDropoff.value,
          pax: this.els.inpPax ? this.els.inpPax.value : 1,
          roomNumber: this.els.inpRoom ? this.els.inpRoom.value : '',
          price: this.els.inpPrice.value,
          paymentStatus: this.selectedAddPayment || 'cash',
          source: this.selectedSource
        });
        this.els.form.reset();
        this.els.inpDate.value = localDateKey();
        this.els.modal.classList.add('hidden');
      });
    }

    // ─── CRM SEARCH & FILTER EVENTS ───
    if (this.els.inpSearch) {
      this.els.inpSearch.addEventListener('input', (e) => {
        this.searchQuery = (e.target.value || '').trim().toLowerCase();
        if (this.els.btnClearSearch) {
          this.els.btnClearSearch.classList.toggle('hidden', !this.searchQuery);
        }
        this.render(this.store.trips);
      });
    }

    if (this.els.btnClearSearch) {
      this.els.btnClearSearch.addEventListener('click', () => {
        if (this.els.inpSearch) this.els.inpSearch.value = '';
        this.searchQuery = '';
        this.els.btnClearSearch.classList.add('hidden');
        this.render(this.store.trips);
      });
    }

    if (this.els.filterPillsContainer) {
      this.els.filterPillsContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.crm-filter-pill');
        if (!pill) return;
        if (navigator.vibrate) navigator.vibrate(30);
        
        this.els.filterPillsContainer.querySelectorAll('.crm-filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentFilter = pill.dataset.filter || 'all';
        this.render(this.store.trips);
      });
    }

    // ─── PAYMENT STATUS 1-TAP TOGGLE ON CARD ───
    this.els.list.addEventListener('click', async (e) => {
      const payBadge = e.target.closest('.payment-badge');
      if (!payBadge) return;
      e.stopPropagation();

      const tripId = payBadge.dataset.id;
      const current = payBadge.dataset.current;
      const cycle = ['unpaid', 'cash', 'paid', 'card', 'hotel'];
      const nextIdx = (cycle.indexOf(current) + 1) % cycle.length;
      const nextStatus = cycle[nextIdx];

      if (navigator.vibrate) navigator.vibrate(40);
      await this.store.updateTripPaymentStatus(tripId, nextStatus);
    });

    // ─── BATCH IMPORT MODAL EVENTS ───
    this.bindImportModalEvents();
    this.bindSwipeGestures();
  }

  bindImportModalEvents() {
    if (this.els.btnOpenImport) {
      this.els.btnOpenImport.addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(30);
        if (this.els.modalImport) this.els.modalImport.classList.remove('hidden');
        this.updateImportPreview();
      });
    }

    const closeImport = () => {
      if (this.els.modalImport) this.els.modalImport.classList.add('hidden');
    };

    if (this.els.btnCloseImport) this.els.btnCloseImport.addEventListener('click', closeImport);
    if (this.els.btnCancelImport) this.els.btnCancelImport.addEventListener('click', closeImport);

    // Tab switching
    if (this.els.tabBtnPaste && this.els.tabBtnFile) {
      this.els.tabBtnPaste.addEventListener('click', () => {
        this.els.tabBtnPaste.classList.add('active');
        this.els.tabBtnFile.classList.remove('active');
        this.els.panelPaste.classList.remove('hidden');
        this.els.panelFile.classList.add('hidden');
      });

      this.els.tabBtnFile.addEventListener('click', () => {
        this.els.tabBtnFile.classList.add('active');
        this.els.tabBtnPaste.classList.remove('active');
        this.els.panelFile.classList.remove('hidden');
        this.els.panelPaste.classList.add('hidden');
      });
    }

    // Paste from clipboard
    if (this.els.btnPasteClipboard) {
      this.els.btnPasteClipboard.addEventListener('click', async () => {
        if (navigator.vibrate) navigator.vibrate(30);
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            if (text && this.els.txtImportInput) {
              this.els.txtImportInput.value = text;
              this.updateImportPreview();
            }
          } else {
            alert('Буфер обмена недоступен через браузер. Вставьте текст вручную (Ctrl+V).');
          }
        } catch (e) {
          alert('Не удалось прочитать буфер обмена: ' + e.message);
        }
      });
    }

    // Load sample Brazil 2002 World Cup squad orders
    if (this.els.btnLoadSample) {
      this.els.btnLoadSample.addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(30);
        const sampleText = `Заказы на трансферы (Сборная Бразилии 2002 — Penta Campeões) 18.08.2026:
1) 08:00 HER Airport -> Elounda Beach, Ronaldo Nazario (Fenomeno) +5511987654321 x4, Room 909, 120€ Paid, FL: GQ200
2) 08:45 HER Airport -> Elounda Resort, Ronaldinho Gaucho +5521998877665 x3, Room 1010, 110 EUR Paid, FL: A3 312
3) 09:30 HER Airport -> Nana Princess, Rivaldo Ferreira +5581987651234 x2, Room 1011, 95€ картой, FL: LH 1234
4) 10:15 Port Heraklion -> Creta Maris, Cafu (Capitao) +5511976543210 x4, Room 202, 85€ Cash, FL: OA310
5) 11:00 HER Airport -> Hersonissos Center, Roberto Carlos +5511965432109 x2, Room 303, 65€ Paid, FL: EW2450
6) 11:45 CHQ Chania -> Agios Nikolaos Port, Kaka +5511954321098 x3, Room 404, 140 EUR Paid, FL: FR 8214
7) 12:30 Port Souda -> Rethymno Old Town, Lucio +5561943210987 x2, Room 505, 90€ Hotel, FL: GQ210
8) 13:15 HER Airport -> Malia Beach, Gilberto Silva +5531932109876 x2, Room 606, 55€ нал, FL: U24531
9) 14:00 HER Airport -> Aldemar Royal, Marcos (GK) +5511921098765 x2, Room 101, 60€ Paid, FL: W64412
10) 14:45 Port Heraklion -> Elounda Resort, Dida (GK) +5571910987654 x2, Room 1212, 80€ картой, FL: A3 312
11) 15:30 HER Airport -> Stalis Beach, Kleberson +5541909876543 x2, Room 808, 50€ нал, FL: GQ200
12) 16:15 Creta Maris -> HER Airport, Denilson +5511898765432 x2, Room 707, 60€ Paid, FL: BA632
13) 17:00 Elounda Beach -> HER Airport, Edmilson +5511887654321 x2, Room 502, 90€ Hotel, FL: LH 1234
14) 17:45 Agios Nikolaos -> HER Airport, Juninho Paulista +5511876543210 x2, Room 401, 85€ Cash, FL: OA310
15) 18:30 HER Airport -> Elounda Beach, Luiz Felipe Scolari (Felipao) +5551865432109 x4, Room 999, 130€ Hotel, FL: TK1845`;

        if (this.els.txtImportInput) {
          this.els.txtImportInput.value = sampleText;
          this.updateImportPreview();
        }
      });
    }

    // Load sample Brazil 2002 World Cup squad CSV
    if (this.els.btnLoadSampleFile) {
      this.els.btnLoadSampleFile.addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(30);
        const sampleCSV = `Дата,Время,Имя клиента,Телефон,Откуда,Куда,Рейс,Номер комнаты,Кол-во пасс.,Цена,Статус оплаты,Источник
2026-08-18,08:00,Ronaldo Nazario (Fenomeno),+5511987654321,HER Airport,Elounda Beach,GQ200,909,4,120,paid,hotel
2026-08-18,08:45,Ronaldinho Gaucho,+5521998877665,HER Airport,Elounda Resort,A3 312,1010,3,110,paid,hotel
2026-08-18,09:30,Rivaldo Ferreira,+5581987651234,HER Airport,Nana Princess,LH 1234,1011,2,95,card,hotel
2026-08-18,10:15,Cafu (Capitao),+5511976543210,Port Heraklion,Creta Maris,OA310,202,4,85,cash,hotel
2026-08-18,11:00,Roberto Carlos,+5511965432109,HER Airport,Hersonissos Center,EW2450,303,2,65,paid,web
2026-08-18,11:45,Kaka,+5511954321098,CHQ Chania,Agios Nikolaos Port,FR 8214,404,3,140,paid,b2b
2026-08-18,12:30,Lucio,+5561943210987,Port Souda,Rethymno Old Town,GQ210,505,2,90,hotel,hotel
2026-08-18,13:15,Gilberto Silva,+5531932109876,HER Airport,Malia Beach,U24531,606,2,55,cash,walkin
2026-08-18,14:00,Marcos (GK),+5511921098765,HER Airport,Aldemar Royal,W64412,101,2,60,paid,hotel
2026-08-18,14:45,Dida (GK),+5571910987654,Port Heraklion,Elounda Resort,A3 312,1212,2,80,card,hotel
2026-08-18,15:30,Kleberson,+5541909876543,HER Airport,Stalis Beach,GQ200,808,2,50,cash,ads
2026-08-18,16:15,Denilson,+5511898765432,Creta Maris,HER Airport,BA632,707,2,60,paid,hotel
2026-08-18,17:00,Edmilson,+5511887654321,Elounda Beach,HER Airport,LH 1234,502,2,90,hotel,hotel
2026-08-18,17:45,Juninho Paulista,+5511876543210,Agios Nikolaos,HER Airport,OA310,401,2,85,cash,hotel
2026-08-18,18:30,Luiz Felipe Scolari (Felipao),+5551865432109,HER Airport,Elounda Beach,TK1845,999,4,130,hotel,hotel`;

        if (this.els.txtImportInput) {
          this.els.txtImportInput.value = sampleCSV;
        }
        if (this.els.dropzone) {
          const titleEl = this.els.dropzone.querySelector('.dropzone-title');
          const subEl = this.els.dropzone.querySelector('.dropzone-sub');
          if (titleEl) titleEl.textContent = 'Выбран образец: brazil_2002_transfers.csv';
          if (subEl) subEl.textContent = '15 трансферов (Сборная Бразилии 2002) — готово к импорту';
        }
        this.updateImportPreview();
      });
    }

    // Reactive input in textarea
    if (this.els.txtImportInput) {
      this.els.txtImportInput.addEventListener('input', () => this.updateImportPreview());
      this.els.txtImportInput.addEventListener('change', () => this.updateImportPreview());
    }

    // Settings changes
    if (this.els.inpImportDate) {
      this.els.inpImportDate.addEventListener('change', () => this.updateImportPreview());
    }
    if (this.els.inpImportPrice) {
      this.els.inpImportPrice.addEventListener('input', () => this.updateImportPreview());
    }

    if (this.els.segImportMode) {
      this.els.segImportMode.addEventListener('click', (e) => {
        const btn = e.target.closest('.seg-btn');
        if (!btn) return;
        this.els.segImportMode.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.importMode = btn.dataset.val || 'append';
        if (navigator.vibrate) navigator.vibrate(30);
      });
    }

    // File Drop & Select
    if (this.els.fileInput) {
      this.els.fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
          this.handleImportFile(file);
          e.target.value = '';
        }
      });
    }

    if (this.els.dropzone) {
      this.els.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.els.dropzone.classList.add('dragover');
      });

      this.els.dropzone.addEventListener('dragleave', () => {
        this.els.dropzone.classList.remove('dragover');
      });

      this.els.dropzone.addEventListener('drop', async (e) => {
        e.preventDefault();
        this.els.dropzone.classList.remove('dragover');
        const file = e.dataTransfer?.files?.[0];
        if (file) this.handleImportFile(file);
      });
    }

    // Preview table delete row delegation
    if (this.els.importPreviewContainer) {
      this.els.importPreviewContainer.addEventListener('click', (e) => {
        const delBtn = e.target.closest('.btn-preview-delete');
        if (!delBtn) return;
        const rowIdx = parseInt(delBtn.dataset.index, 10);
        if (!isNaN(rowIdx) && this.importParsedTrips[rowIdx]) {
          this.importParsedTrips.splice(rowIdx, 1);
          this.renderImportPreviewTable(this.importParsedTrips, 'Пользовательский ввод');
        }
      });
    }

    // Commit batch import
    if (this.els.btnConfirmImport) {
      this.els.btnConfirmImport.addEventListener('click', async () => {
        if (this.importParsedTrips.length === 0) return;
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

        const targetDate = this.els.inpImportDate ? this.els.inpImportDate.value : localDateKey();
        const savedCount = await this.store.importTripsBatch(this.importParsedTrips, {
          mode: this.importMode,
          targetDate
        });

        alert(`Успешно импортировано рейсов: ${savedCount}!`);
        if (this.els.txtImportInput) this.els.txtImportInput.value = '';
        if (this.els.fileInput) this.els.fileInput.value = '';
        if (this.els.dropzone) {
          const titleEl = this.els.dropzone.querySelector('.dropzone-title');
          const subEl = this.els.dropzone.querySelector('.dropzone-sub');
          if (titleEl) titleEl.textContent = 'Перетащите CSV / TSV файл сюда';
          if (subEl) subEl.textContent = 'или нажмите для выбора с телефона / компьютера';
        }
        this.importParsedTrips = [];
        closeImport();
      });
    }
  }

  async handleImportFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      if (this.els.txtImportInput) {
        this.els.txtImportInput.value = text;
      }
      if (this.els.dropzone) {
        const titleEl = this.els.dropzone.querySelector('.dropzone-title');
        const subEl = this.els.dropzone.querySelector('.dropzone-sub');
        if (titleEl) titleEl.textContent = `Выбран файл: ${file.name}`;
        if (subEl) subEl.textContent = `${(file.size / 1024).toFixed(1)} KB — готово к импорту`;
      }
      this.updateImportPreview();
    } catch (e) {
      alert('Ошибка при чтении файла: ' + e.message);
    }
  }

  updateImportPreview() {
    const raw = this.els.txtImportInput ? this.els.txtImportInput.value : '';
    const defaultDate = this.els.inpImportDate ? this.els.inpImportDate.value : localDateKey();
    const defaultPrice = this.els.inpImportPrice ? parseFloat(this.els.inpImportPrice.value) || 45 : 45;

    const res = ImportService.parse(raw, {
      defaultDate,
      defaultPrice,
      defaultSource: this.selectedSource
    });

    this.importParsedTrips = res.trips || [];
    this.renderImportPreviewTable(this.importParsedTrips, res.detectedFormat);
  }

  renderImportPreviewTable(trips, formatName) {
    if (!this.els.importPreviewContainer) return;

    if (this.els.importFormatBadge) {
      if (trips.length > 0 && formatName && formatName !== 'none') {
        this.els.importFormatBadge.textContent = formatName;
        this.els.importFormatBadge.classList.remove('hidden');
      } else {
        this.els.importFormatBadge.classList.add('hidden');
      }
    }

    if (this.els.importPreviewTitle) {
      this.els.importPreviewTitle.textContent = `Предпросмотр (${trips.length} рейсов)`;
    }

    if (this.els.btnConfirmImport) {
      this.els.btnConfirmImport.disabled = trips.length === 0;
      this.els.btnConfirmImport.textContent = `Импортировать (${trips.length} рейсов)`;
    }

    if (trips.length === 0) {
      this.els.importPreviewContainer.innerHTML = '<div class="import-empty-preview">Введите текст или выберите файл для распознавания рейсов</div>';
      return;
    }

    const rows = trips.map((t, idx) => {
      const flightBadge = t.flightCode ? html`<span class="trip-pax-badge">${t.flightCode}</span>` : '-';
      const roomBadge = t.roomNumber ? html`<span class="trip-room-badge">№${t.roomNumber}</span>` : '-';
      const phoneVal = t.phone ? t.phone : '-';
      
      let payClass = 'unpaid';
      let payLabel = 'Не опл.';
      if (t.paymentStatus === 'paid') { payClass = 'paid'; payLabel = 'Оплачено'; }
      else if (t.paymentStatus === 'cash') { payClass = 'cash'; payLabel = 'Наличные'; }
      else if (t.paymentStatus === 'card') { payClass = 'card'; payLabel = 'Карта'; }
      else if (t.paymentStatus === 'hotel') { payClass = 'hotel'; payLabel = 'Отель'; }

      return html`
        <tr>
          <td><strong>${t.time}</strong></td>
          <td>${t.clientName}</td>
          <td>${phoneVal}</td>
          <td>${t.pickup} → ${t.dropoff}</td>
          <td>${t.pax || 1} чел</td>
          <td><strong>€${t.price}</strong></td>
          <td><span class="payment-badge payment-badge-${payClass}" style="cursor:default;">${payLabel}</span></td>
          <td>${flightBadge}</td>
          <td>${roomBadge}</td>
          <td>
            <button type="button" class="btn-preview-delete" data-index="${idx}" title="Удалить строку">✕</button>
          </td>
        </tr>
      `;
    });

    this.els.importPreviewContainer.innerHTML = html`
      <table class="import-preview-table">
        <thead>
          <tr>
            <th>Время</th>
            <th>Клиент</th>
            <th>Телефон</th>
            <th>Маршрут</th>
            <th>Пасс.</th>
            <th>Цена</th>
            <th>Оплата</th>
            <th>Рейс</th>
            <th>Комната</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `.value;
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

  getPaymentBadgeHTML(t) {
    const status = t.paymentStatus || 'unpaid';
    let label = 'Не опл.';
    let icon = '';

    switch (status) {
      case 'paid':
        label = 'Оплачено';
        icon = html`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
        break;
      case 'cash':
        label = 'Наличные';
        icon = html`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>`;
        break;
      case 'card':
        label = 'Карта';
        icon = html`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`;
        break;
      case 'hotel':
        label = 'Счет отелю';
        icon = html`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></svg>`;
        break;
      default:
        label = 'Не оплачено';
        icon = html`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    }

    return html`
      <button type="button" class="payment-badge payment-badge-${status}" data-id="${t.id}" data-current="${status}" title="Нажмите для смены статуса оплаты">
        ${icon}
        <span>${label}</span>
      </button>
    `;
  }

  getWhatsAppUrl(t) {
    if (!t.phone) return '';
    const cleanPhone = t.phone.replace(/\D/g, '');
    if (cleanPhone.length < 7) return '';
    const msg = encodeURIComponent(`Здравствуйте, ${t.clientName}! Я ваш водитель Smart Transfer. Трансфер в ${t.time} (${t.pickup} → ${t.dropoff}).`);
    return `https://wa.me/${cleanPhone}?text=${msg}`;
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

  getFilteredTrips(trips) {
    let result = trips;

    // Filter by tab
    if (this.currentFilter === 'active') {
      result = result.filter(t => t.status !== 'completed');
    } else if (this.currentFilter === 'unpaid') {
      result = result.filter(t => t.status !== 'completed' && (!t.paymentStatus || t.paymentStatus === 'unpaid'));
    } else if (this.currentFilter === 'completed') {
      result = result.filter(t => t.status === 'completed');
    }

    // Filter by search query
    if (this.searchQuery) {
      const q = this.searchQuery;
      result = result.filter(t => {
        return (t.clientName && t.clientName.toLowerCase().includes(q))
          || (t.pickup && t.pickup.toLowerCase().includes(q))
          || (t.dropoff && t.dropoff.toLowerCase().includes(q))
          || (t.flightCode && t.flightCode.toLowerCase().includes(q))
          || (t.roomNumber && t.roomNumber.toLowerCase().includes(q))
          || (t.phone && t.phone.toLowerCase().includes(q))
          || (t.notes && t.notes.toLowerCase().includes(q));
      });
    }

    return result;
  }

  render(trips) {
    const nextTrip = this.store.getNextUpcomingTrip();
    this.renderNextTripHero(nextTrip);

    // Update filter counts
    const allCount = trips.length;
    const activeCount = trips.filter(t => t.status !== 'completed').length;
    const unpaidCount = trips.filter(t => t.status !== 'completed' && (!t.paymentStatus || t.paymentStatus === 'unpaid')).length;
    const completedCount = trips.filter(t => t.status === 'completed').length;

    if (this.els.cntFilterAll) this.els.cntFilterAll.textContent = allCount;
    if (this.els.cntFilterActive) this.els.cntFilterActive.textContent = activeCount;
    if (this.els.cntFilterUnpaid) this.els.cntFilterUnpaid.textContent = unpaidCount;
    if (this.els.cntFilterCompleted) this.els.cntFilterCompleted.textContent = completedCount;

    const filtered = this.getFilteredTrips(trips);

    if (filtered.length === 0) {
      if (this.searchQuery || this.currentFilter !== 'all') {
        this.els.list.innerHTML = '<div class="empty-state">Нет рейсов, подходящих под выбранный фильтр или поиск</div>';
      } else {
        this.els.list.innerHTML = '<div class="empty-state">Поездок пока нет. Добавьте первую или импортируйте список!</div>';
      }
      return;
    }

    const conflictSet = this.store.getConflicts();

    this.els.list.innerHTML = filtered.map(t => {
      const isCompleted = t.status === 'completed';
      const statusClass = isCompleted ? 'completed' : '';
      const gcalLink = this.store.generateGCalLink(t);
      const vtId = t.id.replace(/[^a-zA-Z0-9]/g, '');
      const flight = FlightService.resolveFlightStatus(t);
      const hasConflict = conflictSet.has(t.id);
      const waUrl = this.getWhatsAppUrl(t);
      const telUrl = t.phone ? `tel:${t.phone}` : '';

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

      const paxBadge = (t.pax && t.pax > 1) ? html`
        <span class="trip-pax-badge" title="Пассажиров: ${t.pax}">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          ${t.pax}
        </span>
      ` : '';

      const roomBadge = t.roomNumber ? html`
        <span class="trip-room-badge" title="Номер комнаты / Ваучер">
          №${t.roomNumber}
        </span>
      ` : '';

      const phoneActions = t.phone ? html`
        <div class="trip-phone-actions">
          ${waUrl ? html`
            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="trip-phone-link" title="Написать клиенту в WhatsApp">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              WA
            </a>
          ` : ''}
          ${telUrl ? html`
            <a href="${telUrl}" class="trip-phone-link" style="color:var(--text-primary); border-color:var(--stitch-border-mid);" title="Позвонить клиенту">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </a>
          ` : ''}
        </div>
      ` : '';

      const paymentBadge = this.getPaymentBadgeHTML(t);

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
                ${paxBadge}
                ${roomBadge}
                ${flightBadge}
                ${sourceBadge}
              </div>
            </div>
            <div class="trip-body">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <div class="trip-client">${t.clientName}</div>
                ${phoneActions}
              </div>
              <div class="trip-route">
                <span class="trip-point">${t.pickup}</span>
                <svg class="trip-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                <span class="trip-point">${t.dropoff}</span>
              </div>
            </div>
            <div class="trip-footer">
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="trip-price">€${t.price}</span>
                ${paymentBadge}
              </div>
              ${actionBtn}
            </div>
          </div>
        </div>
      `.value;
    }).join('');
  }
}
