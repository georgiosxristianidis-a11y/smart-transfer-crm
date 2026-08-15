/**
 * Core Reactive Store (Athlete Pro pattern)
 */
import { SCHEMA_VERSION } from './shared/schema.js';

export class CalculatorStore {
  constructor() {
    this.state = {
      // Inputs
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
    };

    this.listeners = [];
    this.loadFromStorage();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    listener(this.getCalculations());
  }

  update(updates) {
    this.state = { ...this.state, ...updates };
    this.saveToStorage();
    this.notify();
  }

  notify() {
    const calc = this.getCalculations();
    this.listeners.forEach(listener => listener(calc));
  }

  loadFromStorage() {
    // For tests running in Node where localStorage is mocked or undefined
    if (typeof window === 'undefined' || !window.localStorage) return;
    const saved = localStorage.getItem('taxi_calc_state');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      const merged = this._applyPersisted(parsed);
      if (merged) this.state = { ...this.state, ...merged };
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
    this.state = { ...this.state, ...nextState };
    this.saveToStorage();
    this.notify();
  }

  getCalculations() {
    const s = this.state;
    
    const totalTrips = s.tripsPerDay * s.seasonDays;
    const checkNet = s.checkGross / 1.13;
    
    const totalPortFees = s.portFeesEnabled ? totalTrips * s.portFee : 0;
    
    const grossRevenue = totalTrips * s.checkGross;
    const netRevenue = (totalTrips * checkNet) - totalPortFees;
    
    const effectiveKmPerTrip = s.kmPerTrip * s.emptyLegRatio;
    const totalKm = totalTrips * effectiveKmPerTrip;
    
    const litersNeeded = (totalKm / 100) * 8.7;
    const fuelCost = litersNeeded * s.fuelPrice;
    
    const oilCost = (totalKm / s.oilInterval) * s.oilCost;
    const clutchCost = (totalKm / s.clutchInterval) * s.clutchCost;
    const tiresCost = (totalKm / s.tiresInterval) * s.tiresCost;
    const totalMaintenance = oilCost + clutchCost + tiresCost;
    
    const insuranceCost = s.insuranceTaxi ? s.insuranceTaxiCost : s.insuranceBasicCost;
    const washCost = s.washPremium ? s.washPremiumCost : s.washBasicCost;
    const totalEfka = s.efkaPerOwner * s.ownersCount;
    const fixedAdmin = insuranceCost + washCost + totalEfka + s.accountant;
    
    const hiredLaborCost = s.hiredDrivers * s.hiredDriverAnnual;
    
    const safetyNet = netRevenue * 0.05;
    
    const totalExpenses = fuelCost + totalMaintenance + fixedAdmin + hiredLaborCost + safetyNet;
    
    const netProfitYear = netRevenue - totalExpenses;
    
    const dailyNet = netProfitYear / s.seasonDays;
    
    const netProfitPerOwnerYear = netProfitYear / s.ownersCount;
    const dailyNetPerOwner = dailyNet / s.ownersCount;
    
    const totalTipsCash = totalTrips * s.tipsPerTrip;
    const tipsCashPerOwner = totalTipsCash / s.ownersCount;

    return {
      state: s,
      metrics: {
        totalTrips,
        totalKm,
        grossRevenue,
        netRevenue,
        fuelCost,
        totalMaintenance,
        fixedAdmin,
        hiredLaborCost,
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
