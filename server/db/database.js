import Database from 'better-sqlite3'
import path from 'node:path'

let db = null

export function initDb (userDataPath) {
  const dbPath = path.join(userDataPath, 'cbe_system.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  createSchema()
  runMigrations()
}

export function getDb () {
  if (!db) throw new Error('Database belum diinisialisasi. Panggil initDb() terlebih dahulu.')
  return db
}

function runMigrations () {
  // Tambah kolom baru yang mungkin belum ada di DB lama
  try { db.exec(`ALTER TABLE soal ADD COLUMN gambar_url TEXT`) } catch (_) {}
  try { db.exec(`ALTER TABLE ujian ADD COLUMN acak_soal INTEGER DEFAULT 0`) } catch (_) {}
}

function createSchema () {
  db.exec(`
    CREATE TABLE IF NOT EXISTS soal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipe TEXT NOT NULL CHECK(tipe IN ('PG', 'Essay')),
      mata_pelajaran TEXT NOT NULL DEFAULT '',
      pertanyaan TEXT NOT NULL,
      opsi_a TEXT,
      opsi_b TEXT,
      opsi_c TEXT,
      opsi_d TEXT,
      kunci_jawaban TEXT,
      panduan_penilaian TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ujian (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judul TEXT NOT NULL,
      mata_pelajaran TEXT NOT NULL,
      durasi_menit INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'aktif' CHECK(status IN ('draft', 'aktif', 'selesai')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ujian_soal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ujian_id INTEGER NOT NULL REFERENCES ujian(id) ON DELETE CASCADE,
      soal_id INTEGER NOT NULL REFERENCES soal(id) ON DELETE CASCADE,
      urutan INTEGER NOT NULL,
      UNIQUE(ujian_id, soal_id)
    );

    CREATE TABLE IF NOT EXISTS peserta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      ujian_id INTEGER NOT NULL REFERENCES ujian(id) ON DELETE CASCADE,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      submitted_at DATETIME,
      UNIQUE(nama, ujian_id)
    );

    CREATE TABLE IF NOT EXISTS jawaban (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      peserta_id INTEGER NOT NULL REFERENCES peserta(id) ON DELETE CASCADE,
      soal_id INTEGER NOT NULL REFERENCES soal(id) ON DELETE CASCADE,
      jawaban_teks TEXT,
      nilai REAL DEFAULT 0,
      dinilai INTEGER DEFAULT 0,
      UNIQUE(peserta_id, soal_id)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  // Seed default settings jika belum ada
  db.prepare(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('nama_sekolah', 'Sios CBE')`).run()
}
