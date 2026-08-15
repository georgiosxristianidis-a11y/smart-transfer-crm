export const SCHEMA_VERSION = 1;

export class UnknownSchemaVersionError extends Error {
  constructor(from) {
    super(`Unknown schemaVersion ${from} (current ${SCHEMA_VERSION}). Refusing to load.`);
    this.name = 'UnknownSchemaVersionError';
    this.from = from;
  }
}

export function migrate(payload, from, to = SCHEMA_VERSION) {
  if (from === to) return payload;
  if (from > to) throw new UnknownSchemaVersionError(from);
  throw new Error(`No migration path from v${from} to v${to}`);
}
