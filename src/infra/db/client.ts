import * as SQLite from "expo-sqlite";
import { runMigrations } from "./runner";

const db = SQLite.openDatabaseSync("ringcare.db");

db.execSync("PRAGMA journal_mode = WAL;");
db.execSync("PRAGMA foreign_keys = ON;");

runMigrations(db);

export { db };
