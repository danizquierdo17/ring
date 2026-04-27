import type { SQLiteDatabase } from "expo-sqlite";
import { runMigrations } from "./runner";

/**
 * Inicializa la BD: PRAGMAs críticos + migraciones.
 * Se llama desde SQLiteProvider.onInit — nunca directamente.
 */
export function initializeDatabase(db: SQLiteDatabase): void {
  db.execSync("PRAGMA journal_mode = WAL;");
  db.execSync("PRAGMA foreign_keys = ON;");
  runMigrations(db);
}
