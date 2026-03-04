import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

// Initialize the database directory if it doesn't exist
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Ensure the uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.sqlite');

let db = null;

export async function getDb() {
  if (db) {
    return db;
  }

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await initializeDb(db);

  return db;
}

async function initializeDb(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      pdf_file TEXT NOT NULL,
      rating INTEGER NOT NULL,
      mini_summary TEXT NOT NULL,
      summary TEXT,
      keywords TEXT NOT NULL,
      summary_pdf_file TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add summary_pdf_file column if it doesn't exist (for existing databases)
  try {
    const columns = await db.all("PRAGMA table_info(documents)");
    const hasSummaryPdf = columns.some(col => col.name === 'summary_pdf_file');
    if (!hasSummaryPdf) {
      await db.exec(`ALTER TABLE documents ADD COLUMN summary_pdf_file TEXT`);
      console.log("Added summary_pdf_file column to documents table");
    }
  } catch (err) {
    console.error("Error checking/updating table schema:", err);
  }
}
