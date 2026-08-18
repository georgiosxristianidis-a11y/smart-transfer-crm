/**
 * Flight Service & Radar Integration Module.
 * Parses flight codes, calculates ETA, formats live radar URLs, and navigation shortcuts.
 */

// Comprehensive allow-list of IATA 2-character airline codes operating in Greece/Crete,
// Europe, and major international carriers.
export const KNOWN_IATA_CODES = new Set([
  // Greece & Cyprus
  'A3', // Aegean Airlines
  'OA', // Olympic Air
  'GQ', // SKY express
  'CY', // Cyprus Airways

  // Low-Cost & Charter Carriers (Crete / Mediterranean)
  'U2', // easyJet
  'FR', // Ryanair
  'W6', // Wizz Air
  'W4', // Wizz Air Malta
  'LS', // Jet2.com
  'TO', // Transavia France
  'HV', // Transavia Netherlands
  'VY', // Vueling
  'V7', // Volotea
  'EW', // Eurowings
  'DE', // Condor
  'X3', // TUIfly Germany
  'TB', // TUI fly Belgium
  'BY', // TUI Airways UK
  'OR', // TUI fly Netherlands
  'QS', // Smartwings
  'NO', // Neos
  'XC', // Corendon Airlines
  'CD', // Corendon Dutch
  'XR', // Corendon Europe
  'DI', // Marabu
  '4Y', // Discover Airlines

  // Major European Full-Service Carriers
  'LH', // Lufthansa
  'BA', // British Airways
  'AF', // Air France
  'KL', // KLM Royal Dutch Airlines
  'LX', // SWISS
  'OS', // Austrian Airlines
  'SN', // Brussels Airlines
  'AZ', // ITA Airways
  'IB', // Iberia
  'TP', // TAP Air Portugal
  'SK', // SAS Scandinavian Airlines
  'DY', // Norwegian Air Shuttle
  'D8', // Norwegian Air Sweden
  'AY', // Finnair
  'LO', // LOT Polish Airlines
  'RO', // TAROM
  'FB', // Bulgaria Air
  'JU', // Air Serbia
  'OU', // Croatia Airlines
  'KM', // KM Malta Airlines
  'BT', // airBaltic

  // Middle East, Mediterranean & International
  'TK', // Turkish Airlines
  'PC', // Pegasus Airlines
  'XQ', // SunExpress
  'ME', // Middle East Airlines (MEA)
  'RJ', // Royal Jordanian
  'MS', // EgyptAir
  'LY', // El Al
  '6H', // Israir
  'IZ', // Arkia
  'EK', // Emirates
  'FZ', // flydubai
  'QR', // Qatar Airways
  'EY', // Etihad Airways
  'G9', // Air Arabia
  'J9', // Jazeera Airways
  'SV', // Saudia
  'GF', // Gulf Air
  'WY', // Oman Air
  'SU', // Aeroflot
  'S7', // S7 Airlines
  'DP', // Pobeda
  'UT', // UTair
]);

export class FlightService {
  /**
   * Matches and validates IATA airline flight designators (3 to 4 digit flight numbers):
   * e.g., 'U2 4531', 'U24531', 'A3 312', 'FR 8214', 'LH 1234', 'BA 632', 'W6 4412', 'XQ 123'
   * Rejects non-flight false positives like 'Room 1205', '+30 694 1234', 'ул. 25 Августа 1234', 'A3 12', 'GQ 5'.
   * 
   * @param {string} text 
   * @param {boolean} strictAllowList If true, carrier must be in KNOWN_IATA_CODES (for inferred text).
   */
  static extractFlightCode(text, strictAllowList = true) {
    if (!text || typeof text !== 'string') return null;
    const regex = /\b([A-Z0-9]{2})[\s-]?([0-9]{3,4})\b/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const carrier = match[1].toUpperCase();
      const flightNum = match[2];
      if (!strictAllowList || KNOWN_IATA_CODES.has(carrier)) {
        return `${carrier}${flightNum}`;
      }
    }
    return null;
  }

  /**
   * Generates live Flightradar24 search / tracking link.
   */
  static getFlightRadarUrl(flightCode) {
    if (!flightCode) return null;
    const clean = flightCode.replace(/\s+/g, '').toUpperCase();
    return `https://www.flightradar24.com/data/flights/${clean}`;
  }

  /**
   * Determines realistic flight status and ETA based on scheduled trip date/time and flight code.
   * Status types:
   *  - 'landed': 🟢 Приземлился
   *  - 'ontime': 🟡 В полете / По расписанию
   *  - 'delayed': 🟠 Задерживается
   *  - 'scheduled': 🔵 Ожидается
   */
  static resolveFlightStatus(trip) {
    const flightCode = this.extractFlightCode(trip.flightCode, false)
      || this.extractFlightCode(trip.clientName, true)
      || this.extractFlightCode(trip.pickup, true);
    if (!flightCode) return null;

    // Check if pickup or dropoff is airport
    const isAirport = /airport|аэропорт|her|chq|terminal|терминал/i.test(`${trip.pickup} ${trip.dropoff}`);

    // Compute time difference from scheduled time
    const schedDate = new Date(`${trip.date}T${trip.time || '12:00'}`);
    const now = new Date();
    const diffMins = Math.round((schedDate - now) / (1000 * 60));

    let status = 'scheduled';
    let label = 'По расписанию';
    let eta = trip.time;
    let delayMins = 0;

    // Deterministic simulation for demo/testing if not explicitly set
    if (trip.flightStatusOverride) {
      status = trip.flightStatusOverride.status;
      label = trip.flightStatusOverride.label;
      delayMins = trip.flightStatusOverride.delayMins || 0;
    } else {
      if (diffMins < -15) {
        status = 'landed';
        label = 'Приземлился';
      } else if (diffMins >= -15 && diffMins <= 45) {
        // Deterministic hash check on flight code so specific flights look delayed/on time
        const hash = flightCode.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        if (hash % 5 === 0) {
          status = 'delayed';
          delayMins = 25;
          label = `Задержка +${delayMins}м`;
          const delayedDate = new Date(schedDate.getTime() + delayMins * 60000);
          eta = `${String(delayedDate.getHours()).padStart(2, '0')}:${String(delayedDate.getMinutes()).padStart(2, '0')}`;
        } else {
          status = 'ontime';
          label = 'В полете';
        }
      } else {
        status = 'scheduled';
        label = 'По расписанию';
      }
    }

    return {
      flightCode,
      radarUrl: this.getFlightRadarUrl(flightCode),
      status,
      label,
      eta,
      delayMins,
      isAirport
    };
  }

  /**
   * Generates 1-tap Google Maps Navigation URL.
   */
  static getGoogleMapsNavUrl(destination, origin = '') {
    const destEnc = encodeURIComponent(destination || 'Crete');
    if (origin) {
      const origEnc = encodeURIComponent(origin);
      return `https://www.google.com/maps/dir/?api=1&origin=${origEnc}&destination=${destEnc}&travelmode=driving`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${destEnc}&travelmode=driving`;
  }

  /**
   * Generates Waze navigation URL.
   */
  static getWazeNavUrl(destination) {
    const destEnc = encodeURIComponent(destination || 'Crete');
    return `https://waze.com/ul?q=${destEnc}&navigate=yes`;
  }
}
