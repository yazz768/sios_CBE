import { Router } from 'express'
import { getDb } from '../db/database.js'
import { serverEvents } from '../events.js'

const router = Router()

// GET /status — health check
router.get('/status', (_req, res) => {
  res.json({ status: 'ok', app: 'CBE System' })
})

// GET /settings/nama_sekolah — baca nama sekolah (publik, untuk login siswa)
router.get('/settings/nama_sekolah', (_req, res) => {
  const db = getDb()
  const row = db.prepare(`SELECT value FROM app_settings WHERE key = 'nama_sekolah'`).get()
  res.json({ value: row?.value || 'Sios CBE' })
})

// GET /verify/:token — verifikasi token ujian
router.get('/verify/:token', (req, res) => {
  const db = getDb()
  const ujian = db.prepare(`
    SELECT id, judul, mata_pelajaran, durasi_menit, status,
           (SELECT COUNT(*) FROM ujian_soal WHERE ujian_id = ujian.id) AS jumlah_soal
    FROM ujian WHERE token = ?
  `).get(req.params.token)

  if (!ujian) return res.status(404).json({ error: 'Token tidak ditemukan' })
  if (ujian.status !== 'aktif') return res.status(403).json({ error: 'Ujian tidak aktif atau sudah selesai' })

  res.json(ujian)
})

// POST /join — siswa bergabung ke sesi ujian
// Body: { nama, token }
router.post('/join', (req, res) => {
  const { nama, token } = req.body
  if (!nama || !token) return res.status(400).json({ error: 'nama dan token wajib diisi' })

  const db = getDb()
  const ujian = db.prepare(`SELECT id FROM ujian WHERE token = ? AND status = 'aktif'`).get(token)
  if (!ujian) return res.status(404).json({ error: 'Ujian tidak ditemukan atau tidak aktif' })

  try {
    const existing = db.prepare(`SELECT id, submitted_at FROM peserta WHERE nama = ? AND ujian_id = ?`).get(nama, ujian.id)
    if (existing) {
      if (existing.submitted_at) {
        return res.status(409).json({
          error: `Nama "${nama}" sudah mengumpulkan ujian ini. Gunakan nama lengkap yang berbeda atau hubungi guru.`
        })
      }
      // Belum submit — izinkan re-join (berguna jika koneksi sebelumnya terputus)
      return res.json({ peserta_id: existing.id, ujian_id: ujian.id, rejoined: true })
    }
    const result = db.prepare(`INSERT INTO peserta (nama, ujian_id) VALUES (?, ?)`).run(nama, ujian.id)
    res.json({ peserta_id: result.lastInsertRowid, ujian_id: ujian.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function seededShuffle (arr, seed) {
  const result = [...arr]
  let s = Math.abs(seed) || 1
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(s) % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// GET /soal/:token — ambil daftar soal (tanpa kunci jawaban)
// Query param opsional: ?peserta_id=X (digunakan untuk soal acak konsisten per siswa)
router.get('/soal/:token', (req, res) => {
  const db = getDb()
  const ujian = db.prepare(`SELECT id, acak_soal FROM ujian WHERE token = ? AND status = 'aktif'`).get(req.params.token)
  if (!ujian) return res.status(404).json({ error: 'Ujian tidak ditemukan' })

  let soal = db.prepare(`
    SELECT s.id, s.tipe, s.pertanyaan, s.opsi_a, s.opsi_b, s.opsi_c, s.opsi_d, s.gambar_url, us.urutan
    FROM soal s
    JOIN ujian_soal us ON us.soal_id = s.id
    WHERE us.ujian_id = ?
    ORDER BY us.urutan
  `).all(ujian.id)

  const pesertaId = parseInt(req.query.peserta_id) || 0
  if (ujian.acak_soal && pesertaId) {
    soal = seededShuffle(soal, pesertaId)
  }

  res.json(soal)
})

// POST /auto-save — simpan jawaban sementara tanpa submit
// Body: { peserta_id, jawaban: [{ soal_id, jawaban_teks }] }
router.post('/auto-save', (req, res) => {
  const { peserta_id, jawaban } = req.body
  if (!peserta_id || !Array.isArray(jawaban)) {
    return res.status(400).json({ error: 'Data tidak valid' })
  }

  const db = getDb()
  const peserta = db.prepare(`SELECT id, submitted_at FROM peserta WHERE id = ?`).get(peserta_id)
  if (!peserta) return res.status(404).json({ error: 'Peserta tidak ditemukan' })
  if (peserta.submitted_at) return res.status(400).json({ error: 'Ujian sudah disubmit' })

  try {
    const saveTx = db.transaction(() => {
      for (const j of jawaban) {
        db.prepare(`
          INSERT INTO jawaban (peserta_id, soal_id, jawaban_teks)
          VALUES (?, ?, ?)
          ON CONFLICT(peserta_id, soal_id) DO UPDATE SET jawaban_teks = excluded.jawaban_teks
        `).run(peserta_id, j.soal_id, j.jawaban_teks || '')
      }
    })
    saveTx()
    res.json({ success: true, saved_at: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /submit — submit jawaban ujian
// Body: { peserta_id, jawaban: [{ soal_id, jawaban_teks }] }
router.post('/submit', (req, res) => {
  const { peserta_id, jawaban } = req.body
  if (!peserta_id || !Array.isArray(jawaban)) {
    return res.status(400).json({ error: 'Data tidak valid' })
  }

  const db = getDb()
  const peserta = db.prepare(`SELECT id, ujian_id FROM peserta WHERE id = ?`).get(peserta_id)
  if (!peserta) return res.status(404).json({ error: 'Peserta tidak ditemukan' })
  if (db.prepare(`SELECT submitted_at FROM peserta WHERE id = ?`).get(peserta_id).submitted_at) {
    return res.status(400).json({ error: 'Ujian sudah disubmit' })
  }

  const submitTx = db.transaction(() => {
    for (const j of jawaban) {
      db.prepare(`
        INSERT INTO jawaban (peserta_id, soal_id, jawaban_teks)
        VALUES (?, ?, ?)
        ON CONFLICT(peserta_id, soal_id) DO UPDATE SET jawaban_teks = excluded.jawaban_teks
      `).run(peserta_id, j.soal_id, j.jawaban_teks || '')
    }

    // Auto-score PG
    const pgJawaban = db.prepare(`
      SELECT j.id, j.jawaban_teks, s.kunci_jawaban
      FROM jawaban j JOIN soal s ON s.id = j.soal_id
      WHERE j.peserta_id = ? AND s.tipe = 'PG'
    `).all(peserta_id)

    for (const j of pgJawaban) {
      const benar = j.jawaban_teks === j.kunci_jawaban ? 1 : 0
      db.prepare(`UPDATE jawaban SET nilai = ?, dinilai = 1 WHERE id = ?`).run(benar, j.id)
    }

    db.prepare(`UPDATE peserta SET submitted_at = CURRENT_TIMESTAMP WHERE id = ?`).run(peserta_id)
  })

  try {
    submitTx()
    const nama = db.prepare(`SELECT nama FROM peserta WHERE id = ?`).get(peserta_id)?.nama
    serverEvents.emit('student:submitted', { nama, ujian_id: peserta.ujian_id })
    res.json({ message: 'Jawaban berhasil disimpan', success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
