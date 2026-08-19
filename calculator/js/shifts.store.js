import { DB } from './shared/db.js';
import { localDateKey, localStamp } from './shared/utils.js';

/**
 * A shift is the driver's working day as a record, not as a guess.
 *
 * Before this store existed, "today" was recomputed from `trip.date === todayStr`,
 * so a shift that crossed midnight fell apart into two days and the norm progress
 * lied. A shift now has its own start, end and odometer, and trips point at it
 * through `trip.shiftId`.
 *
 * Invariant: at most one shift is `open` at any time. Nothing auto-opens or
 * auto-closes — a shift starts and ends because a person said so.
 */

export const SHIFT_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed'
};

const VALID_STATUSES = new Set(Object.values(SHIFT_STATUS));

/** Odometer and norm: a non-negative finite number, or null when not recorded. */
function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (!isFinite(num) || num < 0) return null;
  return num;
}

export class ShiftsStore {
  constructor() {
    this.db = new DB();
    this.shifts = [];
    this.listeners = [];
    this.ready = this.loadInitialData();
  }

  async loadInitialData() {
    try {
      const rows = await this.db.getAllShifts();
      this.shifts = rows.map(r => this._normalizeShift(r));
      this._sort();
      this.notify();
    } catch (e) {
      console.error('Failed to load shifts', e);
    }
  }

  /** Newest first: history is read from the top, the open shift sits there. */
  _sort() {
    this.shifts.sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
  }

  subscribe(listener) {
    this.listeners.push(listener);
    listener(this.shifts);
  }

  notify() {
    this.listeners.forEach(l => l(this.shifts));
  }

  generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'shift-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
  }

  /**
   * Single shape definition for a shift. Every path that writes one goes
   * through here, so a field cannot exist on one route and be missing on another.
   */
  _normalizeShift(raw = {}, now = new Date()) {
    const startedAt = typeof raw.startedAt === 'string' && raw.startedAt ? raw.startedAt : localStamp(now);
    const endedAt = typeof raw.endedAt === 'string' && raw.endedAt ? raw.endedAt : null;
    const status = VALID_STATUSES.has(raw.status)
      ? raw.status
      : (endedAt ? SHIFT_STATUS.CLOSED : SHIFT_STATUS.OPEN);

    return {
      id: raw.id || this.generateId(),
      // Local date of the *start*, so a night shift keeps one date, not two.
      date: raw.date || startedAt.slice(0, 10) || localDateKey(now),
      startedAt,
      endedAt,
      status,
      odoStart: toNullableNumber(raw.odoStart),
      odoEnd: toNullableNumber(raw.odoEnd),
      // Trips target as it stood when the shift opened — the norm may change later,
      // and a finished shift must not be re-judged against a target it never had.
      normTarget: toNullableNumber(raw.normTarget),
      notes: raw.notes || '',
      createdAt: raw.createdAt || Date.now()
    };
  }

  getOpenShift() {
    return this.shifts.find(s => s.status === SHIFT_STATUS.OPEN) || null;
  }

  getShiftById(id) {
    return this.shifts.find(s => s.id === id) || null;
  }

  getShiftsForDate(dateKey) {
    return this.shifts.filter(s => s.date === dateKey);
  }

  /**
   * Opens a shift. Throws if one is already open — two open shifts would make
   * `trip.shiftId` ambiguous, and silently reusing the old one hides the bug.
   */
  async openShift(data = {}, now = new Date()) {
    await this.ready;

    const alreadyOpen = this.getOpenShift();
    if (alreadyOpen) {
      throw new Error(`openShift: shift ${alreadyOpen.id} is still open (started ${alreadyOpen.startedAt})`);
    }

    const shift = this._normalizeShift({
      ...data,
      endedAt: null,
      odoEnd: null,
      status: SHIFT_STATUS.OPEN
    }, now);

    this.shifts.push(shift);
    this._sort();
    await this.db.saveShift(shift);
    this.db.requestPersistence();
    this.notify();
    return shift;
  }

  /**
   * Closes a shift. The odometer cannot run backwards — a lower `odoEnd` is a
   * typo, and a typo in mileage quietly distorts fuel cost per kilometre.
   */
  async closeShift(id, data = {}, now = new Date()) {
    await this.ready;

    const shift = this.getShiftById(id);
    if (!shift) throw new Error(`closeShift: unknown shift ${id}`);
    if (shift.status === SHIFT_STATUS.CLOSED) {
      throw new Error(`closeShift: shift ${id} is already closed`);
    }

    const odoEnd = toNullableNumber(data.odoEnd);
    if (odoEnd !== null && shift.odoStart !== null && odoEnd < shift.odoStart) {
      throw new Error(`closeShift: odoEnd ${odoEnd} is below odoStart ${shift.odoStart}`);
    }

    shift.endedAt = typeof data.endedAt === 'string' && data.endedAt ? data.endedAt : localStamp(now);
    shift.status = SHIFT_STATUS.CLOSED;
    shift.odoEnd = odoEnd;
    if (typeof data.notes === 'string') shift.notes = data.notes;

    await this.db.saveShift(shift);
    this.notify();
    return shift;
  }

  /** Patches the recordable facts of a shift; id, status and timestamps stay put. */
  async updateShift(id, patch = {}) {
    const shift = this.getShiftById(id);
    if (!shift) throw new Error(`updateShift: unknown shift ${id}`);

    if ('odoStart' in patch) shift.odoStart = toNullableNumber(patch.odoStart);
    if ('odoEnd' in patch) shift.odoEnd = toNullableNumber(patch.odoEnd);
    if ('normTarget' in patch) shift.normTarget = toNullableNumber(patch.normTarget);
    if (typeof patch.notes === 'string') shift.notes = patch.notes;

    if (shift.odoEnd !== null && shift.odoStart !== null && shift.odoEnd < shift.odoStart) {
      throw new Error(`updateShift: odoEnd ${shift.odoEnd} is below odoStart ${shift.odoStart}`);
    }

    await this.db.saveShift(shift);
    this.notify();
    return shift;
  }

  async deleteShift(id) {
    this.shifts = this.shifts.filter(s => s.id !== id);
    await this.db.deleteShift(id);
    this.notify();
  }

  /** Distance covered, or null when either end of the odometer is missing. */
  getShiftDistance(id) {
    const shift = this.getShiftById(id);
    if (!shift || shift.odoStart === null || shift.odoEnd === null) return null;
    return shift.odoEnd - shift.odoStart;
  }

  /* --- Backup module surface — do not use in view code paths. --- */

  getAllShiftsSnapshot() {
    return this.shifts.map(s => ({ ...s }));
  }

  async replaceAllShifts(list) {
    if (!Array.isArray(list)) throw new Error('replaceAllShifts: array required');

    const existing = await this.db.getAllShifts();
    for (const s of existing) {
      await this.db.deleteShift(s.id);
    }
    const normalized = list.map(s => this._normalizeShift(s));
    for (const s of normalized) {
      await this.db.saveShift(s);
    }
    this.shifts = normalized;
    this._sort();
    this.notify();
  }
}
