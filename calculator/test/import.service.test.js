import test from 'node:test';
import assert from 'node:assert';
import { ImportService } from '../js/shared/import.service.js';

test('ImportService: CSV with comma delimiter and headers', () => {
  const csv = `Date,Time,Client,Phone,Pickup,Dropoff,Price,Payment,Flight,Room,Pax
2026-08-18,08:30,Schmidt,+49170123456,HER Airport,Nana Princess,60,Paid,EW2450,302,3
2026-08-18,11:15,Muller,+49170999999,Nana Princess,HER Airport,55,Cash,,214,2
2026-08-18,14:00,Papadopoulos,+306912345678,Port Heraklion,Elounda Beach,90,Hotel,GQ200,,4`;

  const res = ImportService.parse(csv);
  assert.strictEqual(res.totalCount, 3);
  assert.strictEqual(res.errors.length, 0);
  assert.strictEqual(res.trips[0].clientName, 'Schmidt');
  assert.strictEqual(res.trips[0].time, '08:30');
  assert.strictEqual(res.trips[0].paymentStatus, 'paid');
  assert.strictEqual(res.trips[0].flightCode, 'EW2450');
  assert.strictEqual(res.trips[0].roomNumber, '302');
  assert.strictEqual(res.trips[0].pax, 3);
  assert.strictEqual(res.trips[0].phone, '+49170123456');

  assert.strictEqual(res.trips[1].paymentStatus, 'cash');
  assert.strictEqual(res.trips[2].paymentStatus, 'hotel');
});

test('ImportService: CSV with semicolon delimiter and Russian headers', () => {
  const csv = `Дата;Время;Клиент;Телефон;Откуда;Куда;Цена;Оплата;Рейс;Номер;Пассажиры
18.08.2026;09:00;Иванов Иван;+7 999 123-45-67;HER Airport;Aldemar Knossos;45€;Наличные;A3312;105;2
18.08.2026;15:30;Петров;+306900000000;Elounda;HER Airport;80 евро;Карта;W64412;201;1`;

  const res = ImportService.parse(csv);
  assert.strictEqual(res.totalCount, 2);
  assert.strictEqual(res.trips[0].date, '2026-08-18');
  assert.strictEqual(res.trips[0].clientName, 'Иванов Иван');
  assert.strictEqual(res.trips[0].price, 45);
  assert.strictEqual(res.trips[0].paymentStatus, 'cash');
  assert.strictEqual(res.trips[0].flightCode, 'A3312');
  assert.strictEqual(res.trips[0].phone, '+79991234567');

  assert.strictEqual(res.trips[1].price, 80);
  assert.strictEqual(res.trips[1].paymentStatus, 'card');
});

test('ImportService: TSV / Tab-delimited data', () => {
  const tsv = `Date\tTime\tClient\tPickup\tDropoff\tPrice\tPayment
2026-08-18\t10:00\tJohn Doe\tHER\tChersonissos\t40\tPaid
2026-08-18\t12:30\tJane Smith\tHER\tStalis\t35\tCash`;

  const res = ImportService.parse(tsv);
  assert.strictEqual(res.totalCount, 2);
  assert.strictEqual(res.trips[0].clientName, 'John Doe');
  assert.strictEqual(res.trips[0].price, 40);
  assert.strictEqual(res.trips[0].paymentStatus, 'paid');
});

test('ImportService: WhatsApp unstructured text block (15 hotel orders scenario)', () => {
  const whatsappMsg = `Заказы на сегодня 18.08.2026:
1) 08:00 HER Airport -> Nana Princess, Schmidt x3, Room 402, 65€ Cash, FL: GQ200
2) 09:15 Creta Maris -> HER Airport, Miller x2, 45 EUR Paid
3) 10:30 Port Heraklion -> Elounda, Papadopoulos, +306912345678, 90€ Hotel, Room 112
4) 11:45 HER -> Aldemar Royal, Johnson x4, 50€ нал, рейс A3 312
5) 13:00 Stalis -> HER, Wilson, 40€ картой
6) 14:15 HER -> Hersonissos Palace, Dubois x1, 45€ Paid, U2 4531
7) 15:30 Gouves -> HER Airport, Weber x2, 35€ Cash
8) 16:45 HER Airport -> Out of the Blue Capsis, Rossi x3, 60€ Hotel
9) 17:30 Malia Beach -> HER, Fischer x2, 50€ Paid
10) 18:45 HER -> Stella Island, Martin x2, 50€ Cash, FL: LH 1234
11) 19:30 Anissaras -> HER, Becker x4, 45€ Paid
12) 20:15 HER -> Grecotel Amirandes, Laurent x3, 45€ Cash
13) 21:00 Sissi -> HER Airport, Wagner x2, 60€ Hotel
14) 22:15 HER -> Elounda Peninsula, Hansen x2, 95€ Paid, FR 8214
15) 23:30 HER Airport -> Lyttos Beach, Novak x4, 45€ Cash, Room 501`;

  const res = ImportService.parse(whatsappMsg, { defaultDate: '2026-08-18' });
  assert.strictEqual(res.totalCount, 15, 'Should parse all 15 orders correctly');
  assert.strictEqual(res.errors.length, 0, 'No errors in parsing standard hotel list');

  // Check details of first order
  const t1 = res.trips[0];
  assert.strictEqual(t1.time, '08:00');
  assert.strictEqual(t1.pickup, 'HER Airport');
  assert.strictEqual(t1.dropoff, 'Nana Princess');
  assert.strictEqual(t1.clientName, 'Schmidt');
  assert.strictEqual(t1.pax, 3);
  assert.strictEqual(t1.roomNumber, '402');
  assert.strictEqual(t1.price, 65);
  assert.strictEqual(t1.paymentStatus, 'cash');
  assert.strictEqual(t1.flightCode, 'GQ200');

  // Check 3rd order with phone and hotel status
  const t3 = res.trips[2];
  assert.strictEqual(t3.time, '10:30');
  assert.strictEqual(t3.clientName, 'Papadopoulos');
  assert.strictEqual(t3.phone, '+306912345678');
  assert.strictEqual(t3.paymentStatus, 'hotel');
  assert.strictEqual(t3.roomNumber, '112');

  // Check 14th order with airline flight code
  const t14 = res.trips[13];
  assert.strictEqual(t14.time, '22:15');
  assert.strictEqual(t14.flightCode, 'FR8214');
  assert.strictEqual(t14.paymentStatus, 'paid');
});

test('ImportService: Brazil 2002 World Cup CSV and WhatsApp samples', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const url = await import('node:url');

  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const csvPath = path.join(__dirname, '..', 'samples', 'brazil_2002_transfers.csv');
  const txtPath = path.join(__dirname, '..', 'samples', 'brazil_2002_whatsapp.txt');

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const txtContent = fs.readFileSync(txtPath, 'utf-8');

  // Test CSV parsing
  const csvRes = ImportService.parse(csvContent);
  assert.strictEqual(csvRes.totalCount, 15);
  assert.strictEqual(csvRes.errors.length, 0);
  assert.strictEqual(csvRes.trips[0].clientName, 'Ronaldo Nazario (Fenomeno)');
  assert.strictEqual(csvRes.trips[0].flightCode, 'GQ200');
  assert.strictEqual(csvRes.trips[0].roomNumber, '909');
  assert.strictEqual(csvRes.trips[0].phone, '+5511987654321');
  assert.strictEqual(csvRes.trips[0].price, 120);
  assert.strictEqual(csvRes.trips[0].paymentStatus, 'paid');

  // Test WhatsApp message parsing
  const txtRes = ImportService.parse(txtContent);
  assert.strictEqual(txtRes.totalCount, 15);
  assert.strictEqual(txtRes.errors.length, 0);
  assert.strictEqual(txtRes.trips[1].clientName, 'Ronaldinho Gaucho');
  assert.strictEqual(txtRes.trips[1].flightCode, 'A3312');
  assert.strictEqual(txtRes.trips[1].paymentStatus, 'paid');
});

test('ImportService: Empty or invalid input handling', () => {
  const res1 = ImportService.parse('');
  assert.strictEqual(res1.totalCount, 0);

  const res2 = ImportService.parse(null);
  assert.strictEqual(res2.totalCount, 0);

  const res3 = ImportService.parse('Random non-matching text without any time or routes');
  assert.strictEqual(res3.totalCount, 0);
  assert.ok(res3.errors.length > 0);
});

