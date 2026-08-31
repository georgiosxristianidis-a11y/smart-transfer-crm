/**
 * Core reactive store: pure state and business logic, zero DOM.
 */
import { SCHEMA_VERSION } from './shared/schema.js';

/**
 * Licence regimes. They price differently, so the model has to know which one.
 * ΕΔΧ ΤΑΞΙ  — metered; the meter sets the price, no legal floor per ride.
 * ΕΙΧ με οδηγό — contract hire; on the islands a contract carries a legal
 *                minimum (ΥΑ 89095/2026). Below it the ride is fineable, not cheap.
 */
export const LICENSE_MODES = {
  edx: { minFare: 0 },
  eix: { minFare: 82 },
};

const DEFAULT_STATE = {
  // Inputs
  licenseMode: 'edx',
  checkGross: 45,
  tripsPerDay: 13,
  seasonDays: 122,
  ownersCount: 2, // 2 or 3
  hiredDrivers: 0,
  
  // Cost & Specs
  fuelPrice: 1.78,
  kmPerTrip: 50,
  emptyLegRatio: 1.3, // +30%
  
  // Toggles
  portFeesEnabled: true,
  portFee: 2,
  insuranceTaxi: true,
  washPremium: true,
  hotelCommissionEnabled: false,
  hotelCommissionRate: 0.10,
  
  // Tips
  tipsPerTrip: 5,
  
  // Fixed Expenses (Annual)
  insuranceTaxiCost: 4800,
  insuranceBasicCost: 1200,
  washPremiumCost: 200 * 12,
  washBasicCost: 40 * 12,
  efkaPerOwner: 250 * 12,
  accountant: 1800,
  
  // Driver Costs
  hiredDriverAnnual: 19500,
  
  // Wear and Tear
  oilInterval: 15000,
  oilCost: 250,
  clutchInterval: 60000,
  clutchCost: 1200,
  tiresInterval: 40000,
  tiresCost: 800,

  // Model Constants & Unit Economics (CALC-01)
  fuelConsumptionPer100km: 8.7,
  vatRate: 1.13,
  inputVatRate: 1.24,
  safetyNetRatio: 0.05,
};

const NUMERIC_RANGES = {
  checkGross: { min: 0, max: 100000 },
  tripsPerDay: { min: 0, max: 500 },
  seasonDays: { min: 1, max: 366 },
  ownersCount: { min: 1, max: 10 },
  hiredDrivers: { min: 0, max: 50 },
  fuelPrice: { min: 0, max: 100 },
  kmPerTrip: { min: 0, max: 10000 },
  emptyLegRatio: { min: 1, max: 10 },
  portFee: { min: 0, max: 1000 },
  hotelCommissionRate: { min: 0, max: 1.0 },
  tipsPerTrip: { min: 0, max: 1000 },
  insuranceTaxiCost: { min: 0, max: 100000 },
  insuranceBasicCost: { min: 0, max: 100000 },
  washPremiumCost: { min: 0, max: 100000 },
  washBasicCost: { min: 0, max: 100000 },
  efkaPerOwner: { min: 0, max: 100000 },
  accountant: { min: 0, max: 100000 },
  hiredDriverAnnual: { min: 0, max: 500000 },
  oilInterval: { min: 100, max: 1000000 },
  oilCost: { min: 0, max: 50000 },
  clutchInterval: { min: 100, max: 1000000 },
  clutchCost: { min: 0, max: 50000 },
  tiresInterval: { min: 100, max: 1000000 },
  tiresCost: { min: 0, max: 50000 },
  fuelConsumptionPer100km: { min: 0.1, max: 100 },
  vatRate: { min: 1.0, max: 2.0 },
  inputVatRate: { min: 1.0, max: 2.0 },
  safetyNetRatio: { min: 0, max: 1.0 },
};

export class CalculatorStore {
  constructor() {
    this.state = { ...DEFAULT_STATE };
    this.listeners = [];
    this.loadFromStorage();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    listener(this.getCalculations());
  }

  update(updates) {
    this.state = { ...this.state, ...this._sanitizeState(updates) };
    this.saveToStorage();
    this.notify();
  }

  notify() {
    const calc = this.getCalculations();
    this.listeners.forEach(listener => listener(calc));
  }

  _sanitizeState(incoming) {
    if (!incoming || typeof incoming !== 'object') return {};
    const sanitized = {};
    for (const key of Object.keys(DEFAULT_STATE)) {
      if (key in incoming) {
        const val = incoming[key];
        const expectedType = typeof DEFAULT_STATE[key];
        if (key === 'licenseMode') {
          // Enum, not free text: an unknown regime would mean an unknown floor.
          if (typeof val === 'string' && Object.prototype.hasOwnProperty.call(LICENSE_MODES, val)) {
            sanitized[key] = val;
          }
        } else if (expectedType === 'number') {
          const num = Number(val);
          const range = NUMERIC_RANGES[key];
          if (!isNaN(num) && isFinite(num)) {
            if (range) {
              if (num >= range.min && num <= range.max) {
                sanitized[key] = num;
              } else {
                sanitized[key] = DEFAULT_STATE[key];
              }
            } else {
              sanitized[key] = num;
            }
          } else {
            sanitized[key] = DEFAULT_STATE[key];
          }
        } else if (expectedType === 'boolean') {
          sanitized[key] = Boolean(val);
        } else if (expectedType === typeof val) {
          sanitized[key] = val;
        }
      }
    }
    return sanitized;
  }

  loadFromStorage() {
    // For tests running in Node where localStorage is mocked or undefined
    if (typeof window === 'undefined' || !window.localStorage) return;
    const saved = localStorage.getItem('taxi_calc_state');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      const merged = this._applyPersisted(parsed);
      if (merged) {
        const validated = this._sanitizeState(merged);
        this.state = { ...DEFAULT_STATE, ...validated };
      }
    } catch (e) {
      console.error('Failed to parse local storage', e);
    }
  }

  // Returns the field payload to merge, or null if the payload must be rejected.
  _applyPersisted(parsed) {
    if (parsed == null || typeof parsed !== 'object') return null;
    // Legacy (no schemaVersion): treat as v1 bare-state.
    if (parsed.schemaVersion === undefined) return parsed;
    if (parsed.schemaVersion > SCHEMA_VERSION) {
      console.error(
        `taxi_calc_state schemaVersion ${parsed.schemaVersion} > current ${SCHEMA_VERSION}. Ignored.`
      );
      return null;
    }
    return (parsed.state && typeof parsed.state === 'object') ? parsed.state : null;
  }

  saveToStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const envelope = { schemaVersion: SCHEMA_VERSION, state: this.state };
    localStorage.setItem('taxi_calc_state', JSON.stringify(envelope));
  }

  // Backup module surface — do not use in view/store code paths.
  getStateSnapshot() { return { ...this.state }; }
  replaceState(nextState) {
    if (!nextState || typeof nextState !== 'object') throw new Error('replaceState: object required');
    const validated = this._sanitizeState(nextState);
    this.state = { ...DEFAULT_STATE, ...validated };
    this.saveToStorage();
    this.notify();
  }

  exportState() {
    return { ...this.state };
  }

  importState(newState) {
    const validated = this._sanitizeState(newState);
    this.state = { ...DEFAULT_STATE, ...validated };
    this.saveToStorage();
    this.notify();
    return true;
  }

  getCalculations() {
    const s = this.state;
    
    const seasonDays = (s.seasonDays && s.seasonDays >= NUMERIC_RANGES.seasonDays.min)
      ? s.seasonDays
      : DEFAULT_STATE.seasonDays;
    const ownersCount = (s.ownersCount && s.ownersCount >= NUMERIC_RANGES.ownersCount.min)
      ? s.ownersCount
      : DEFAULT_STATE.ownersCount;
    const vatRate = (s.vatRate && s.vatRate >= NUMERIC_RANGES.vatRate.min)
      ? s.vatRate
      : DEFAULT_STATE.vatRate;
    const inputVatRate = (s.inputVatRate && s.inputVatRate >= NUMERIC_RANGES.inputVatRate.min)
      ? s.inputVatRate
      : DEFAULT_STATE.inputVatRate;
    const fuelConsumption = (s.fuelConsumptionPer100km && s.fuelConsumptionPer100km >= NUMERIC_RANGES.fuelConsumptionPer100km.min)
      ? s.fuelConsumptionPer100km
      : DEFAULT_STATE.fuelConsumptionPer100km;
    const safetyNetRatio = (s.safetyNetRatio !== undefined && s.safetyNetRatio !== null && isFinite(s.safetyNetRatio) && s.safetyNetRatio >= 0)
      ? s.safetyNetRatio
      : DEFAULT_STATE.safetyNetRatio;

    const oilInterval = (s.oilInterval && s.oilInterval >= NUMERIC_RANGES.oilInterval.min)
      ? s.oilInterval
      : DEFAULT_STATE.oilInterval;
    const clutchInterval = (s.clutchInterval && s.clutchInterval >= NUMERIC_RANGES.clutchInterval.min)
      ? s.clutchInterval
      : DEFAULT_STATE.clutchInterval;
    const tiresInterval = (s.tiresInterval && s.tiresInterval >= NUMERIC_RANGES.tiresInterval.min)
      ? s.tiresInterval
      : DEFAULT_STATE.tiresInterval;

    const totalTrips = s.tripsPerDay * seasonDays;
    const checkNet = s.checkGross / vatRate;

    // Flag, never clamp: the owner's number stays the owner's number.
    const regime = LICENSE_MODES[s.licenseMode] || LICENSE_MODES.edx;
    const minFare = regime.minFare;
    const fareBelowMinimum = s.checkGross < minFare;
    
    const totalPortFees = s.portFeesEnabled ? totalTrips * s.portFee : 0;
    
    const grossRevenue = totalTrips * s.checkGross;
    const outputVatYear = grossRevenue - (totalTrips * checkNet);
    const netRevenue = (totalTrips * checkNet) - totalPortFees;
    
    const effectiveKmPerTrip = s.kmPerTrip * s.emptyLegRatio;
    const totalKm = totalTrips * effectiveKmPerTrip;
    
    const litersNeeded = (totalKm / 100) * fuelConsumption;
    const fuelCost = litersNeeded * s.fuelPrice;
    const inputVatFuel = fuelCost - (fuelCost / inputVatRate);
    
    const oilCost = (totalKm / oilInterval) * s.oilCost;
    const clutchCost = (totalKm / clutchInterval) * s.clutchCost;
    const tiresCost = (totalKm / tiresInterval) * s.tiresCost;
    const totalMaintenance = oilCost + clutchCost + tiresCost;
    const inputVatMaintenance = totalMaintenance - (totalMaintenance / inputVatRate);
    
    const insuranceCost = s.insuranceTaxi ? s.insuranceTaxiCost : s.insuranceBasicCost;
    const washCost = s.washPremium ? s.washPremiumCost : s.washBasicCost;
    const inputVatWash = washCost - (washCost / inputVatRate);
    const inputVatAccountant = s.accountant - (s.accountant / inputVatRate);
    const inputVatNonRefundable = inputVatFuel + inputVatMaintenance + inputVatWash + inputVatAccountant;

    const totalEfka = s.efkaPerOwner * ownersCount;
    const fixedAdmin = insuranceCost + washCost + totalEfka + s.accountant;
    
    const hiredLaborCost = s.hiredDrivers * s.hiredDriverAnnual;
    
    const hotelCommissionRate = (s.hotelCommissionRate !== undefined && s.hotelCommissionRate !== null && isFinite(s.hotelCommissionRate) && s.hotelCommissionRate >= NUMERIC_RANGES.hotelCommissionRate.min && s.hotelCommissionRate <= NUMERIC_RANGES.hotelCommissionRate.max)
      ? s.hotelCommissionRate
      : DEFAULT_STATE.hotelCommissionRate;
    const hotelCommissionPerTrip = s.hotelCommissionEnabled ? (s.checkGross * hotelCommissionRate) : 0;
    const hotelCommissionCost = totalTrips * hotelCommissionPerTrip;

    const safetyNet = netRevenue * safetyNetRatio;
    
    const totalExpenses = fuelCost + totalMaintenance + fixedAdmin + hiredLaborCost + hotelCommissionCost + safetyNet;
    
    const netProfitYear = netRevenue - totalExpenses;
    
    const dailyNet = netProfitYear / seasonDays;
    
    const netProfitPerOwnerYear = netProfitYear / ownersCount;
    const dailyNetPerOwner = dailyNet / ownersCount;
    
    const totalTipsCash = totalTrips * s.tipsPerTrip;
    const tipsCashPerOwner = totalTipsCash / ownersCount;

    return {
      state: s,
      metrics: {
        minFare,
        fareBelowMinimum,
        totalTrips,
        totalKm,
        grossRevenue,
        outputVatYear,
        netRevenue,
        fuelCost,
        inputVatFuel,
        totalMaintenance,
        inputVatMaintenance,
        washCost,
        inputVatWash,
        fixedAdmin,
        inputVatAccountant,
        inputVatNonRefundable,
        hiredLaborCost,
        hotelCommissionPerTrip,
        hotelCommissionCost,
        safetyNet,
        totalExpenses,
        netProfitYear,
        dailyNet,
        netProfitPerOwnerYear,
        dailyNetPerOwner,
        totalTipsCash,
        tipsCashPerOwner
      }
    };
  }
}
