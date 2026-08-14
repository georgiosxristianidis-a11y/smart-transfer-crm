/**
 * Flight Service & Radar Integration Module.
 * Parses flight codes, calculates ETA, formats live radar URLs, and navigation shortcuts.
 */

export class FlightService {
  /**
   * Matches common IATA airline flight designators:
   * e.g., 'U2 4531', 'U24531', 'A3 312', 'FR 8214', 'LH 1234', 'BA 632', 'W6 4412', 'XQ 123'
   */
  static extractFlightCode(text) {
    if (!text || typeof text !== 'string') return null;
    const regex = /\b([A-Z0-9]{2})\s?([0-9]{3,4})\b/i;
    const match = text.match(regex);
    if (match) {
      return `${match[1].toUpperCase()}${match[2]}`;
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
    const flightCode = trip.flightCode || this.extractFlightCode(trip.clientName) || this.extractFlightCode(trip.pickup);
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
