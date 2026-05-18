interface ElectronAPI {
  startExam: () => Promise<void>
  endExam: () => Promise<void>
  focusWindow: () => Promise<void>
  getServerInfo: () => Promise<{ ip: string; port: number }>
  platform: string
}

declare interface Window {
  electronAPI?: ElectronAPI
}
