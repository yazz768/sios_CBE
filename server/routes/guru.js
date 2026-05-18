import { Router } from 'express'
import { getDb } from '../db/database.js'

const router = Router()

// Middleware: hanya izinkan akses dari localhost
function localhostOnly (req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || ''
  const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
  if (!isLocal) return res.status(403).json({ error: 'Akses ditolak: hanya dari localhost' })
  next()
}

router.use(localhostOnly)

// ─── SOAL CRUD ────────────────────────────────────────────────

// GET /guru/soal — list semua soal
router.get('/soal', (_req, res) => {
  const db = getDb()
  const soal = db.prepare(`SELECT * FROM soal ORDER BY created_at DESC`).all()
  res.json(soal)
})

// POST /guru/soal — tambah soal baru
router.post('/soal', (req, res) => {
  const { tipe, mata_pelajaran, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, kunci_jawaban, panduan_penilaian, gambar_url } = req.body
  if (!tipe || !pertanyaan) return res.status(400).json({ error: 'tipe dan pertanyaan wajib diisi' })

  const db = getDb()
  const result = db.prepare(`
    INSERT INTO soal (tipe, mata_pelajaran, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, kunci_jawaban, panduan_penilaian, gambar_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(tipe, mata_pelajaran || '', pertanyaan, opsi_a || null, opsi_b || null, opsi_c || null, opsi_d || null, kunci_jawaban || null, panduan_penilaian || null, gambar_url || null)

  res.status(201).json({ id: result.lastInsertRowid })
})

// PUT /guru/soal/:id — update soal
router.put('/soal/:id', (req, res) => {
  const { tipe, mata_pelajaran, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, kunci_jawaban, panduan_penilaian, gambar_url } = req.body
  const db = getDb()
  db.prepare(`
    UPDATE soal SET tipe=?, mata_pelajaran=?, pertanyaan=?, opsi_a=?, opsi_b=?, opsi_c=?, opsi_d=?, kunci_jawaban=?, panduan_penilaian=?, gambar_url=?
    WHERE id=?
  `).run(tipe, mata_pelajaran || '', pertanyaan, opsi_a || null, opsi_b || null, opsi_c || null, opsi_d || null, kunci_jawaban || null, panduan_penilaian || null, gambar_url || null, req.params.id)

  res.json({ success: true })
})

// DELETE /guru/soal/:id — hapus soal
router.delete('/soal/:id', (req, res) => {
  const db = getDb()
  db.prepare(`DELETE FROM soal WHERE id = ?`).run(req.params.id)
  res.json({ success: true })
})

// ─── UJIAN ───────────────────────────────────────────────────

// GET /guru/ujian — list semua ujian
router.get('/ujian', (_req, res) => {
  const db = getDb()
  const ujian = db.prepare(`
    SELECT u.*,
      COUNT(DISTINCT us.soal_id) AS jumlah_soal,
      COUNT(DISTINCT p.id) AS jumlah_peserta
    FROM ujian u
    LEFT JOIN ujian_soal us ON us.ujian_id = u.id
    LEFT JOIN peserta p ON p.ujian_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all()
  res.json(ujian)
})

// POST /guru/ujian — buat ujian baru
// Body: { judul, mata_pelajaran, durasi_menit, soal_ids: number[], acak_soal?: boolean }
router.post('/ujian', (req, res) => {
  const { judul, mata_pelajaran, durasi_menit, soal_ids, acak_soal } = req.body
  if (!judul || !mata_pelajaran || !durasi_menit || !Array.isArray(soal_ids) || soal_ids.length === 0) {
    return res.status(400).json({ error: 'Data tidak lengkap. judul, mata_pelajaran, durasi_menit, soal_ids wajib diisi' })
  }

  const db = getDb()
  const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

  function generateToken () {
    let token
    do {
      token = Array.from({ length: 6 }, () => CHARSET[Math.floor(Math.random() * CHARSET.length)]).join('')
    } while (db.prepare(`SELECT id FROM ujian WHERE token = ?`).get(token))
    return token
  }

  const token = generateToken()

  const createTx = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO ujian (judul, mata_pelajaran, durasi_menit, token, status, acak_soal)
      VALUES (?, ?, ?, ?, 'aktif', ?)
    `).run(judul, mata_pelajaran, durasi_menit, token, acak_soal ? 1 : 0)

    const ujianId = result.lastInsertRowid
    const insertSoal = db.prepare(`INSERT INTO ujian_soal (ujian_id, soal_id, urutan) VALUES (?, ?, ?)`)
    soal_ids.forEach((soalId, idx) => insertSoal.run(ujianId, soalId, idx + 1))

    return { id: ujianId, token }
  })

  try {
    const data = createTx()
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /guru/ujian/:id/status — ubah status ujian
router.patch('/ujian/:id/status', (req, res) => {
  const { status } = req.body
  if (!['draft', 'aktif', 'selesai'].includes(status)) {
    return res.status(400).json({ error: 'Status tidak valid' })
  }
  const db = getDb()
  db.prepare(`UPDATE ujian SET status = ? WHERE id = ?`).run(status, req.params.id)
  res.json({ success: true })
})

// GET /guru/monitor/:token — status peserta real-time
router.get('/monitor/:token', (req, res) => {
  const db = getDb()
  const ujian = db.prepare(`SELECT id, judul, status FROM ujian WHERE token = ?`).get(req.params.token)
  if (!ujian) return res.status(404).json({ error: 'Ujian tidak ditemukan' })

  const peserta = db.prepare(`
    SELECT id, nama, joined_at, submitted_at
    FROM peserta WHERE ujian_id = ?
    ORDER BY joined_at ASC
  `).all(ujian.id)

  res.json({ ujian, peserta })
})

// GET /guru/hasil/:token — hasil ujian lengkap
router.get('/hasil/:token', (req, res) => {
  const db = getDb()
  const ujian = db.prepare(`SELECT * FROM ujian WHERE token = ?`).get(req.params.token)
  if (!ujian) return res.status(404).json({ error: 'Ujian tidak ditemukan' })

  const peserta = db.prepare(`
    SELECT p.id, p.nama, p.submitted_at,
      COALESCE(SUM(CASE WHEN s.tipe = 'PG' THEN j.nilai ELSE 0 END), 0) AS nilai_pg_raw,
      COALESCE(SUM(CASE WHEN s.tipe = 'Essay' THEN j.nilai ELSE 0 END), 0) AS nilai_essay_raw,
      COUNT(CASE WHEN s.tipe = 'PG' THEN 1 END) AS total_pg,
      COUNT(CASE WHEN s.tipe = 'Essay' THEN 1 END) AS total_essay,
      COUNT(CASE WHEN s.tipe = 'Essay' AND j.dinilai = 0 AND j.id IS NOT NULL THEN 1 END) AS pending_essay
    FROM peserta p
    LEFT JOIN jawaban j ON j.peserta_id = p.id
    LEFT JOIN soal s ON s.id = j.soal_id
    WHERE p.ujian_id = ?
    GROUP BY p.id ORDER BY p.nama
  `).all(ujian.id)

  res.json({ ujian, peserta })
})

// GET /guru/hasil/:token/peserta/:pesertaId — detail jawaban satu peserta
router.get('/hasil/:token/peserta/:pesertaId', (req, res) => {
  const db = getDb()
  const detail = db.prepare(`
    SELECT s.id AS soal_id, s.tipe, s.pertanyaan, s.kunci_jawaban, s.panduan_penilaian,
      j.id AS jawaban_id, j.jawaban_teks, j.nilai, j.dinilai
    FROM soal s
    JOIN ujian_soal us ON us.soal_id = s.id
    JOIN ujian u ON u.id = us.ujian_id
    LEFT JOIN jawaban j ON j.soal_id = s.id AND j.peserta_id = ?
    WHERE u.token = ?
    ORDER BY us.urutan
  `).all(req.params.pesertaId, req.params.token)

  res.json(detail)
})

// POST /guru/nilai-essay — input nilai essay manual
// Body: { jawaban_id, nilai }
router.post('/nilai-essay', (req, res) => {
  const { jawaban_id, nilai } = req.body
  if (jawaban_id === undefined || nilai === undefined) {
    return res.status(400).json({ error: 'jawaban_id dan nilai wajib diisi' })
  }
  const db = getDb()
  db.prepare(`UPDATE jawaban SET nilai = ?, dinilai = 1 WHERE id = ?`).run(nilai, jawaban_id)
  res.json({ success: true })
})

// GET /guru/settings — baca semua settings aplikasi
router.get('/settings', (_req, res) => {
  const db = getDb()
  const rows = db.prepare(`SELECT key, value FROM app_settings`).all()
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]))
  res.json(settings)
})

// POST /guru/settings — update satu setting
// Body: { key, value }
router.post('/settings', (req, res) => {
  const { key, value } = req.body
  if (!key || value === undefined) return res.status(400).json({ error: 'key dan value wajib diisi' })
  const db = getDb()
  db.prepare(`INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(key, String(value))
  res.json({ success: true })
})

export default router
