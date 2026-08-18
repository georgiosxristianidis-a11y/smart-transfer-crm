/**
 * Smart Import Service Module for Taxi & Transfer CRM.
 * Parses CSV, TSV, semicolon-delimited files, and free-form WhatsApp / hotel dispatch messages.
 * Complies with GIO Security, XSS protection, and strict data normalization standards.
 */

import { FlightService } from './flight.service.js';
import { localDateKey } from './utils.js';

export class ImportService {
  /**
   * Main entry point: auto-detects format (CSV/TSV or WhatsApp/free-form text) and extracts trips.
   * 
   * @param {string} rawInput 
   * @param {Object} options 
   * @param {string} [options.defaultDate] - Target date YYYY-MM-DD (defaults to local today)
   * @param {number} [options.defaultPrice] - Fallback price if none detected (defaults to 45)
   * @param {string} [options.defaultSource] - 'hotel' | 'b2b' | 'web' | 'walkin' | 'ads'
   * @returns {{ trips: Array, errors: Array, detectedFormat: string, totalCount: number }}
   */
  static parse(rawInput, options = {}) {
    if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
      return { trips: [], errors: ['Пустой ввод для импорта'], detectedFormat: 'none', totalCount: 0 };
    }

    const defaultDate = options.defaultDate || localDateKey();
    const defaultPrice = Number(options.defaultPrice) > 0 ? Number(options.defaultPrice) : 45;
    const defaultSource = options.defaultSource || 'hotel';

    // Normalize newlines and strip BOM
    const cleanInput = rawInput.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = cleanInput.split('\n').map(l => l.trim()).filter(Boolean);

    if (lines.length === 0) {
      return { trips: [], errors: ['Нет доступных строк для парсинга'], detectedFormat: 'none', totalCount: 0 };
    }

    // Determine format: Check if input looks like delimited tabular data (CSV/TSV)
    const delimiter = this.detectDelimiter(lines);
    if (delimiter) {
      return this.parseDelimited(lines, delimiter, { defaultDate, defaultPrice, defaultSource });
    }

    // Otherwise, parse as unstructured text / WhatsApp messages
    return this.parseWhatsAppText(lines, { defaultDate, defaultPrice, defaultSource });
  }

  /**
   * Detects whether lines are delimited by comma, semicolon, tab, or pipe.
   */
  static detectDelimiter(lines) {
    const candidateDelimiters = [';', '\t', ',', '|'];
    const sample = lines.slice(0, Math.min(lines.length, 5));

    for (const delim of candidateDelimiters) {
      const counts = sample.map(line => this.splitDelimitedLine(line, delim).length);
      const isConsistent = counts.every(c => c > 1 && c === counts[0]);
      if (isConsistent && counts[0] >= 3) {
        return delim;
      }
    }
    return null;
  }

  /**
   * Safely splits a delimited line, taking into account quotes.
   */
  static splitDelimitedLine(line, delimiter) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        if (inQuotes && line[i + 1] === char) {
          current += char;
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * Parses CSV / TSV / Semicolon-delimited records.
   */
  static parseDelimited(lines, delimiter, opts) {
    const trips = [];
    const errors = [];
    const firstRow = this.splitDelimitedLine(lines[0], delimiter);

    // Check if first row is a header
    const headerMap = this.mapHeaderColumns(firstRow);
    const hasHeader = Object.keys(headerMap).length >= 2;
    const dataLines = hasHeader ? lines.slice(1) : lines;

    dataLines.forEach((line, idx) => {
      const rowNum = hasHeader ? idx + 2 : idx + 1;
      const cols = this.splitDelimitedLine(line, delimiter);
      if (cols.length < 2) return;

      try {
        let record = {};
        if (hasHeader) {
          record = this.extractFromHeaderMap(cols, headerMap, opts);
        } else {
          record = this.extractFromPosition(cols, opts);
        }

        const normalized = this.normalizeTripRecord(record, opts);
        if (normalized) {
          trips.push(normalized);
        } else {
          errors.push(`Строка ${rowNum}: Недостаточно данных для маршрута`);
        }
      } catch (err) {
        errors.push(`Строка ${rowNum}: ${err.message}`);
      }
    });

    const formatName = delimiter === '\t' ? 'TSV' : delimiter === ';' ? 'CSV (точка с запятой)' : 'CSV (запятая)';
    return { trips, errors, detectedFormat: formatName, totalCount: trips.length };
  }

  /**
   * Maps column headers to standardized keys.
   */
  static mapHeaderColumns(headers) {
    const map = {};
    const patterns = {
      date: /^(date|дата|ημερομην[ιί]α|день)$/i,
      time: /^(time|время|ώρα|час)$/i,
      clientName: /^(client|name|клиент|пассажир|фио|имя|guest|όνομα|guest name)$/i,
      phone: /^(phone|tel|телефон|моб|whatsapp|тел|τηλέφωνο|mobile)$/i,
      pickup: /^(pickup|from|откуда|подача|старт|από|pickup location|origin)$/i,
      dropoff: /^(dropoff|to|куда|финиш|назначение|προς|dropoff location|destination)$/i,
      price: /^(price|cost|цена|сумма|стоимость|чек|τιμή|amount)$/i,
      paymentStatus: /^(payment|paid|оплата|статус оплаты|тип оплаты|πληρωμή|payment status)$/i,
      pax: /^(pax|passengers|пассажиры|человек|чел|кол-во|άτομα|persons)$/i,
      flightCode: /^(flight|flight number|рейс|номер рейса|πτήση|flight code)$/i,
      roomNumber: /^(room|room number|комната|номер|номер комнаты|δωμάτιο|voucher|бронь)$/i,
      notes: /^(notes|note|заметки|инфо|примечания|σχόλια|comments)$/i,
      source: /^(source|источник|канал|πηγή)$/i
    };

    headers.forEach((h, index) => {
      const cleanHeader = h.toLowerCase().replace(/['"_\-]/g, ' ').trim();
      for (const [key, regex] of Object.entries(patterns)) {
        if (regex.test(cleanHeader) && map[key] === undefined) {
          map[key] = index;
          break;
        }
      }
    });

    return map;
  }

  static extractFromHeaderMap(cols, map, opts) {
    const getVal = (key) => (map[key] !== undefined && cols[map[key]] !== undefined ? cols[map[key]].trim() : '');
    return {
      date: getVal('date') || opts.defaultDate,
      time: getVal('time'),
      clientName: getVal('clientName'),
      phone: getVal('phone'),
      pickup: getVal('pickup'),
      dropoff: getVal('dropoff'),
      price: getVal('price'),
      paymentStatus: getVal('paymentStatus'),
      pax: getVal('pax'),
      flightCode: getVal('flightCode'),
      roomNumber: getVal('roomNumber'),
      notes: getVal('notes'),
      source: getVal('source') || opts.defaultSource
    };
  }

  static extractFromPosition(cols, opts) {
    // Heuristic positional extraction when header is absent
    // Common format: Date, Time, Client, Pickup, Dropoff, Price, PaymentStatus
    return {
      date: cols[0] && cols[0].includes('-') ? cols[0] : opts.defaultDate,
      time: cols[1] || '12:00',
      clientName: cols[2] || 'Гость',
      pickup: cols[3] || '',
      dropoff: cols[4] || '',
      price: cols[5] || opts.defaultPrice,
      paymentStatus: cols[6] || 'unpaid',
      source: opts.defaultSource
    };
  }

  /**
   * Parses WhatsApp messages and unstructured lists.
   * Handles patterns like:
   * "1) 08:30 HER Airport -> Nana Princess, Schmidt x3, Room 402, 65€ Cash, FL: GQ210"
   * "14:15 Port Heraklion to Elounda Beach, John Doe +30691234567, 90 EUR Paid"
   */
  static parseWhatsAppText(lines, opts) {
    const trips = [];
    const errors = [];
    let currentDate = opts.defaultDate;

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const clean = line.trim();

      // Skip title / intro headers (e.g. "Заказы на сегодня 18.08.2026:", "Transfers list:")
      if (/^(заказы|расписание|трансферы|сборная|transfers|schedule|orders|today|сегодня|список)/i.test(clean)) {
        const dateHeader = this.extractDate(clean);
        if (dateHeader) currentDate = dateHeader;
        return;
      }

      // Check if line represents a pure date header
      const dateHeader = this.extractDate(clean);
      if (dateHeader && clean.length < 30 && !clean.includes('->') && !clean.includes('—') && !clean.includes('→')) {
        currentDate = dateHeader;
        return;
      }

      // Check if line looks like an order
      const parsed = this.parseWhatsAppLine(clean, currentDate, opts);
      if (parsed) {
        trips.push(parsed);
      } else if (clean.length > 5 && !clean.startsWith('#')) {
        errors.push(`Строка ${lineNum}: Не удалось распознать рейс ("${clean.slice(0, 40)}...")`);
      }
    });

    return {
      trips,
      errors,
      detectedFormat: 'WhatsApp / Текстовый список',
      totalCount: trips.length
    };
  }

  /**
   * Parses a single WhatsApp order line.
   */
  static parseWhatsAppLine(line, currentDate, opts) {
    // Remove leading bullet/numbering e.g. "1.", "1)", "- ", "* "
    let text = line.replace(/^(\d+[\.\)]|\*|-|•)\s*/, '').trim();

    // A transfer order line MUST contain a route separator (->, —, -, to, →)
    const routeSeparators = /\s*(?:->|-->|=>|→|—|\s-\s|\sto\s|\sв\s|\sдо\s|\sπρος\s)\s*/i;
    if (!routeSeparators.test(text)) {
      return null;
    }

    // 1. Extract Time (HH:MM or H:MM)
    const timeMatch = text.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
    if (!timeMatch) return null;
    const time = `${String(timeMatch[1]).padStart(2, '0')}:${timeMatch[2]}`;
    text = text.replace(timeMatch[0], ' ');

    // 2. Extract Pax (Passengers count: "x3", "3 pax", "2 чел", "4 человека")
    let pax = 1;
    const paxMatch = text.match(/\b(\d+)\s*(?:pax|чел|пасс|человек|passengers|pers|άτομα)\b/i) || text.match(/\bx\s*(\d+)\b/i);
    if (paxMatch) {
      pax = parseInt(paxMatch[1], 10);
      text = text.replace(paxMatch[0], ' ');
    }

    // 3. Extract Flight Code
    const flightCode = FlightService.extractFlightCode(text, true, false) || '';
    if (flightCode) {
      text = text.replace(new RegExp(`(fl|flight|рейс|πτήση)?[:\\s]*${flightCode}`, 'gi'), ' ');
    }

    // 4. Extract Room Number
    let roomNumber = '';
    const roomMatch = text.match(/\b(?:room|номер|комната|rm|apt|δωμ)[\s#:]*([A-Za-z0-9\-]+)\b/i);
    if (roomMatch) {
      roomNumber = roomMatch[1];
      text = text.replace(roomMatch[0], ' ');
    }

    // 5. Extract Phone Number
    let phone = '';
    const phoneMatch = text.match(/\+?\d[\d\s\-\(\)]{7,}\d/);
    if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 9) {
      phone = phoneMatch[0].trim();
      text = text.replace(phoneMatch[0], ' ');
    }

    // 6. Extract Price & Payment Status
    let price = opts.defaultPrice;
    let paymentStatus = 'unpaid';

    const priceMatch = text.match(/([€$]\s*(\d+(?:[.,]\d{1,2})?)|\b(\d+(?:[.,]\d{1,2})?)\s*(?:€|\$|eur|евро|euro))\s*(cash|нал|наличные|paid|оплачено|card|карта|hotel|отель|b2b|картой)?/i);
    if (priceMatch) {
      const numStr = priceMatch[2] || priceMatch[3];
      if (numStr) price = parseFloat(numStr.replace(',', '.'));
      if (priceMatch[4]) {
        paymentStatus = this.normalizePaymentStatus(priceMatch[4]);
      }
      text = text.replace(priceMatch[0], ' ');
    }

    if (paymentStatus === 'unpaid') {
      if (/\b(paid|оплачено|онлайн|online|prepaid)\b/i.test(text)) {
        paymentStatus = 'paid';
        text = text.replace(/\b(paid|оплачено|онлайн|online|prepaid)\b/gi, ' ');
      } else if (/\b(cash|нал|наличные|μετρητά)\b/i.test(text)) {
        paymentStatus = 'cash';
        text = text.replace(/\b(cash|нал|наличные|μετρητά)\b/gi, ' ');
      } else if (/\b(card|карта|картой|pos|κάρτα)\b/i.test(text)) {
        paymentStatus = 'card';
        text = text.replace(/\b(card|карта|картой|pos|κάρτα)\b/gi, ' ');
      } else if (/\b(hotel|отель|счет|b2b|voucher|ξενοδοχείο)\b/i.test(text)) {
        paymentStatus = 'hotel';
        text = text.replace(/\b(hotel|отель|счет|b2b|voucher|ξενοδοχείο)\b/gi, ' ');
      }
    }

    // 7. Route Splitting (Pickup -> Dropoff)
    let pickup = '';
    let dropoff = '';
    let clientName = 'Без имени';

    const parts = text.split(/[,;\n]/).map(p => p.trim()).filter(Boolean);
    const routePartIdx = parts.findIndex(p => routeSeparators.test(p));

    if (routePartIdx !== -1) {
      const routeText = parts[routePartIdx];
      const routeSplit = routeText.split(routeSeparators);
      pickup = (routeSplit[0] || '').trim();
      dropoff = (routeSplit[1] || '').trim();

      // The remaining parts usually contain Client Name or Notes
      const nonRouteParts = parts.filter((_, idx) => idx !== routePartIdx);
      if (nonRouteParts.length > 0) {
        clientName = nonRouteParts[0].trim();
      }
    } else {
      // Fallback: Use commas or whole string
      if (parts.length >= 2) {
        pickup = parts[0];
        dropoff = parts[1];
        if (parts.length >= 3) clientName = parts[2];
      } else {
        pickup = text.trim();
        dropoff = 'Отель / Аэропорт';
      }
    }

    return this.normalizeTripRecord({
      date: currentDate,
      time,
      clientName: clientName || 'Гость',
      phone,
      pickup: pickup || 'HER Airport',
      dropoff: dropoff || 'Отель',
      price,
      paymentStatus,
      pax,
      flightCode,
      roomNumber,
      notes: '',
      source: opts.defaultSource
    }, opts);
  }

  /**
   * Normalizes fields of a trip record into the canonical Trip schema.
   */
  static normalizeTripRecord(record, opts = {}) {
    if (!record) return null;

    const date = this.normalizeDate(record.date, opts.defaultDate);
    const time = this.normalizeTime(record.time);
    const clientName = (record.clientName || 'Гость').trim();
    const pickup = (record.pickup || '').trim();
    const dropoff = (record.dropoff || '').trim();

    if (!pickup && !dropoff) return null;

    const price = typeof record.price === 'number' ? record.price : parseFloat(String(record.price).replace(/[^0-9.]/g, '')) || (opts.defaultPrice || 45);
    const pax = Math.min(19, Math.max(1, parseInt(record.pax, 10) || 1));
    const phone = this.cleanPhone(record.phone);
    const paymentStatus = this.normalizePaymentStatus(record.paymentStatus);
    const flightCode = FlightService.extractFlightCode(record.flightCode || `${clientName} ${pickup}`, false, true) || '';
    const roomNumber = (record.roomNumber || '').trim();
    const notes = (record.notes || '').trim();
    const source = record.source || opts.defaultSource || 'hotel';

    return {
      id: 'trip-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10),
      date,
      time,
      clientName,
      phone,
      pickup: pickup || 'HER Airport',
      dropoff: dropoff || 'Elounda',
      price,
      status: 'pending',
      paymentStatus,
      pax,
      flightCode,
      roomNumber,
      notes,
      source,
      createdAt: Date.now()
    };
  }

  static normalizeDate(val, fallback) {
    if (!val || typeof val !== 'string') return fallback || localDateKey();
    const clean = val.trim();

    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

    // DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
    const match = clean.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})$/);
    if (match) {
      return `${match[3]}-${String(match[2]).padStart(2, '0')}-${String(match[1]).padStart(2, '0')}`;
    }

    return fallback || localDateKey();
  }

  static normalizeTime(val) {
    if (!val || typeof val !== 'string') return '12:00';
    const clean = val.trim();
    const match = clean.match(/^([01]?\d|2[0-3])[:.]([0-5]\d)/);
    if (match) {
      return `${String(match[1]).padStart(2, '0')}:${match[2]}`;
    }
    return '12:00';
  }

  static cleanPhone(phone) {
    if (!phone || typeof phone !== 'string') return '';
    // Preserve leading +, strip spaces, parentheses and dashes
    const trimmed = phone.trim();
    const hasPlus = trimmed.startsWith('+');
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length < 5) return '';
    return hasPlus ? `+${digits}` : digits;
  }

  static normalizePaymentStatus(val) {
    if (!val || typeof val !== 'string') return 'unpaid';
    const s = val.toLowerCase().trim();
    if (s.includes('paid') || s.includes('оплач') || s.includes('онлайн') || s.includes('prepaid')) return 'paid';
    if (s.includes('cash') || s.includes('нал') || s.includes('μετρητά')) return 'cash';
    if (s.includes('card') || s.includes('карт') || s.includes('pos') || s.includes('κάρτα')) return 'card';
    if (s.includes('hotel') || s.includes('отел') || s.includes('b2b') || s.includes('счет') || s.includes('voucher')) return 'hotel';
    return 'unpaid';
  }

  static extractDate(text) {
    if (!text || typeof text !== 'string') return null;
    // Match DD.MM.YYYY or YYYY-MM-DD
    const match1 = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (match1) return `${match1[1]}-${match1[2]}-${match1[3]}`;

    const match2 = text.match(/\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b/);
    if (match2) {
      return `${match2[3]}-${String(match2[2]).padStart(2, '0')}-${String(match2[1]).padStart(2, '0')}`;
    }
    return null;
  }
}
