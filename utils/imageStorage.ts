"use client"

interface StoredImage {
  id: string
  dataUrl: string
  timestamp: number
  isSelected?: boolean
  editHistory?: {
    isSelectedForEditing?: boolean
    timestamp: number
    action?: string
  }[]
}

interface AppState {
  images: StoredImage[]
  selectedImageIds: string[]
  selectedImageId: string | null
  lastUpdated: number
  version: string
  sessionId: string
  historyStack?: {
    past: Partial<AppState>[]
    future: Partial<AppState>[]
    currentIndex: number
  }
  userPreferences?: {
    theme?: string
    defaultScanSettings?: Record<string, unknown>
    lastUsedSettings?: Record<string, unknown>
  }
}


interface StorageData {
  appState: AppState
  lastSaved: number
  deviceInfo: {
    userAgent: string
    timestamp: number
  }
}

class ImageStorageManager {
  private dbName = "ScannerAppDB"
  private dbVersion = 2 // Increased version for new schema
  private storeName = "appState"
  private backupStoreName = "appStateBackup"
  private db: IDBDatabase | null = null
  private currentVersion = "1.0.0"
  private sessionId = this.generateSessionId()

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create main store
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" })
          store.createIndex("timestamp", "timestamp", { unique: false })
          store.createIndex("sessionId", "sessionId", { unique: false })
        }

        // Create backup store
        if (!db.objectStoreNames.contains(this.backupStoreName)) {
          const backupStore = db.createObjectStore(this.backupStoreName, { keyPath: "id" })
          backupStore.createIndex("timestamp", "timestamp", { unique: false })
        }
      }
    })
  }

  async saveAppState(appState: AppState): Promise<void> {
    if (!this.db) await this.init()

    const storageData: StorageData = {
      appState: {
        ...appState,
        version: this.currentVersion,
        sessionId: this.sessionId,
        lastUpdated: Date.now(),
      },
      lastSaved: Date.now(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      },
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName, this.backupStoreName], "readwrite")
      const store = transaction.objectStore(this.storeName)
      const backupStore = transaction.objectStore(this.backupStoreName)

      // Save main state
      const mainRequest = store.put({ id: "current", ...storageData })

      // Create backup
      const backupRequest = backupStore.put({
        id: `backup_${Date.now()}`,
        ...storageData,
      })

      let completed = 0
      const checkComplete = () => {
        completed++
        if (completed === 2) resolve()
      }

      mainRequest.onsuccess = checkComplete
      backupRequest.onsuccess = checkComplete
      mainRequest.onerror = () => reject(mainRequest.error)
      backupRequest.onerror = () => reject(backupRequest.error)
    })
  }

  async loadAppState(): Promise<AppState | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readonly")
      const store = transaction.objectStore(this.storeName)
      const request = store.get("current")

      request.onsuccess = () => {
        const result = request.result
        if (result && result.appState) {
          // Validate data integrity
          if (this.validateAppState(result.appState)) {
            resolve(result.appState)
          } else {
            console.warn("Stored app state is invalid, attempting backup recovery")
            this.loadBackupState().then(resolve).catch(reject)
          }
        } else {
          resolve(null)
        }
      }
      request.onerror = () => {
        console.warn("Failed to load main state, attempting backup recovery")
        this.loadBackupState().then(resolve).catch(reject)
      }
    })
  }

  private async loadBackupState(): Promise<AppState | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.backupStoreName], "readonly")
      const store = transaction.objectStore(this.backupStoreName)
      const index = store.index("timestamp")
      const request = index.openCursor(null, "prev") // Get most recent backup

      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          const backupData = cursor.value
          if (backupData.appState && this.validateAppState(backupData.appState)) {
            console.log("Successfully recovered from backup")
            resolve(backupData.appState)
          } else {
            cursor.continue() // Try next backup
          }
        } else {
          resolve(null) // No valid backup found
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

private validateAppState(appState: Partial<AppState>): appState is AppState {
  return (
    !!appState &&
    Array.isArray(appState.images) &&
    Array.isArray(appState.selectedImageIds) &&
    typeof appState.lastUpdated === "number" &&
    typeof appState.version === "string"
  )
}


  // Fallback methods for localStorage
  private fallbackSaveAppState(appState: AppState): void {
    try {
      const storageData: StorageData = {
        appState: {
          ...appState,
          version: this.currentVersion,
          sessionId: this.sessionId,
          lastUpdated: Date.now(),
        },
        lastSaved: Date.now(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        },
      }

      localStorage.setItem("scannerApp_state", JSON.stringify(storageData))

      // Create backup in localStorage too
      const backups = this.getLocalStorageBackups()
      backups.push(storageData)

      // Keep only last 5 backups
      if (backups.length > 5) {
        backups.shift()
      }

      localStorage.setItem("scannerApp_backups", JSON.stringify(backups))
    } catch (error) {
      console.error("Failed to save to localStorage:", error)
    }
  }

  private fallbackLoadAppState(): AppState | null {
    try {
      const stored = localStorage.getItem("scannerApp_state")
      if (stored) {
        const data: StorageData = JSON.parse(stored)
        if (this.validateAppState(data.appState)) {
          return data.appState
        } else {
          // Try backup recovery
          return this.fallbackLoadBackupState()
        }
      }
    } catch (error) {
      console.warn("Failed to load from localStorage, trying backup:", error)
      return this.fallbackLoadBackupState()
    }
    return null
  }

  private fallbackLoadBackupState(): AppState | null {
    try {
      const backups = this.getLocalStorageBackups()
      // Try backups from newest to oldest
      for (let i = backups.length - 1; i >= 0; i--) {
        if (this.validateAppState(backups[i].appState)) {
          console.log("Successfully recovered from localStorage backup")
          return backups[i].appState
        }
      }
    } catch (error) {
      console.error("Failed to recover from localStorage backup:", error)
    }
    return null
  }

  private getLocalStorageBackups(): StorageData[] {
    try {
      const stored = localStorage.getItem("scannerApp_backups")
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  async saveWithFallback(appState: AppState): Promise<void> {
    try {
      await this.saveAppState(appState)
      console.log("Successfully saved app state to IndexedDB")
    } catch (error) {
      console.warn("IndexedDB save failed, using localStorage:", error)
      this.fallbackSaveAppState(appState)
      console.log("Successfully saved app state to localStorage")
    }
  }

  async loadWithFallback(): Promise<AppState | null> {
    try {
      const state = await this.loadAppState()
      if (state) {
        console.log("Successfully loaded app state from IndexedDB")
        return state
      }
    } catch (error) {
      console.warn("IndexedDB load failed, trying localStorage:", error)
    }

    const fallbackState = this.fallbackLoadAppState()
    if (fallbackState) {
      console.log("Successfully loaded app state from localStorage")
    }
    return fallbackState
  }

  async clearAllData(): Promise<void> {
    try {
      if (this.db) {
        const transaction = this.db.transaction([this.storeName, this.backupStoreName], "readwrite")
        await Promise.all([
          new Promise<void>((resolve, reject) => {
            const request = transaction.objectStore(this.storeName).clear()
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          }),
          new Promise<void>((resolve, reject) => {
            const request = transaction.objectStore(this.backupStoreName).clear()
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          }),
        ])
      }
    } catch (error) {
      console.warn("Failed to clear IndexedDB:", error)
    }

    // Clear localStorage as well
    try {
      localStorage.removeItem("scannerApp_state")
      localStorage.removeItem("scannerApp_backups")
    } catch (error) {
      console.warn("Failed to clear localStorage:", error)
    }
  }

  // Get storage usage information
  async getStorageInfo(): Promise<{
    indexedDBSize: number
    localStorageSize: number
    totalBackups: number
    lastSaved: number | null
  }> {
    let indexedDBSize = 0
    let localStorageSize = 0
    let totalBackups = 0
    let lastSaved: number | null = null

    try {
      // Calculate IndexedDB size (approximate)
      if (this.db) {
        const transaction = this.db.transaction([this.storeName, this.backupStoreName], "readonly")
        const mainStore = transaction.objectStore(this.storeName)
        const backupStore = transaction.objectStore(this.backupStoreName)

        const mainData = await new Promise<StorageData & { id: string } | null>((resolve) => {
  const request = mainStore.get("current")
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => resolve(null)
})

if (mainData) {
  indexedDBSize = JSON.stringify(mainData).length
  lastSaved = mainData.lastSaved
}

        const backupCount = await new Promise<number>((resolve) => {
          const request = backupStore.count()
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => resolve(0)
        })

        totalBackups += backupCount
      }
    } catch (error) {
      console.warn("Failed to calculate IndexedDB size:", error)
    }

    try {
      // Calculate localStorage size
      const mainState = localStorage.getItem("scannerApp_state")
      const backupState = localStorage.getItem("scannerApp_backups")

      if (mainState) {
        localStorageSize = mainState.length
        const data = JSON.parse(mainState)
        if (!lastSaved && data.lastSaved) {
          lastSaved = data.lastSaved
        }
      }

      if (backupState) {
        localStorageSize += backupState.length
        const backups = JSON.parse(backupState)
        totalBackups += backups.length
      }
    } catch (error) {
      console.warn("Failed to calculate localStorage size:", error)
    }

    return {
      indexedDBSize,
      localStorageSize,
      totalBackups,
      lastSaved,
    }
  }
}

export const imageStorage = new ImageStorageManager()
export type { StoredImage, AppState }
