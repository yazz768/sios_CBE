import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Exam lockdown
  startExam: () => ipcRenderer.invoke('exam:start'),
  endExam: () => ipcRenderer.invoke('exam:end'),

  // Paksa fokus kembali ke window saat blur saat exam aktif
  focusWindow: () => ipcRenderer.invoke('app:focusWindow'),

  // Info server guru (IP lokal + port)
  getServerInfo: () => ipcRenderer.invoke('app:getServerInfo'),

  // Backup database
  backupDb: () => ipcRenderer.invoke('db:backup'),

  // Export PDF laporan
  exportPDF: (payload) => ipcRenderer.invoke('app:exportPDF', payload),

  // Pilih gambar untuk soal
  selectImage: () => ipcRenderer.invoke('soal:selectImage'),


  // Notifikasi saat siswa submit — returns fungsi untuk unsubscribe
  onStudentSubmit: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('student:submitted', handler)
    return () => ipcRenderer.removeListener('student:submitted', handler)
  },

  // Platform info
  platform: process.platform
})
