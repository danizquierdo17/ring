import type { SQLiteDatabase } from "expo-sqlite";
import { migration001 } from "./migrations/001_init";
import { migration002 } from "./migrations/002_add_settings";
import { migration003 } from "./migrations/003_add_luna";
import { migration004 } from "./migrations/004_add_language";
import { migration005 } from "./migrations/005_add_theme";

const SCHEMA_MIGRATIONS_BOOTSTRAP = `
  CREATE TABLE IF NOT EXISTS SchemaMigrations (
    version    INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export function runMigrations(db: SQLiteDatabase): void {
  db.execSync(SCHEMA_MIGRATIONS_BOOTSTRAP);

  const row = db.getFirstSync<{ v: number | null }>(
    "SELECT MAX(version) AS v FROM SchemaMigrations"
  );
  const currentVersion = row?.v ?? 0;

  if (currentVersion < 1) {
    db.withTransactionSync(() => {
      db.execSync(migration001);
      db.runSync("INSERT INTO SchemaMigrations (version) VALUES (?)", 1);
    });
  }

  if (currentVersion < 2) {
    db.withTransactionSync(() => {
      db.execSync(migration002);
      db.runSync("INSERT INTO SchemaMigrations (version) VALUES (?)", 2);
    });
  }

  if (currentVersion < 3) {
    db.withTransactionSync(() => {
      db.execSync(migration003);
      db.runSync("INSERT INTO SchemaMigrations (version) VALUES (?)", 3);
    });
  }

  if (currentVersion < 4) {
    db.withTransactionSync(() => {
      db.execSync(migration004);
      db.runSync("INSERT INTO SchemaMigrations (version) VALUES (?)", 4);
    });
  }

  if (currentVersion < 5) {
    db.withTransactionSync(() => {
      db.execSync(migration005);
      db.runSync("INSERT INTO SchemaMigrations (version) VALUES (?)", 5);
    });
  }
}
