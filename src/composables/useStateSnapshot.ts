import { toRaw } from 'vue'
import type { WeddingSnapshot, AppConfig } from '@/types'
import { useGuestStore } from '@/stores/useGuestStore'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useRoomStore } from '@/stores/useRoomStore'
import { useMenuStore } from '@/stores/useMenuStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'

export function useStateSnapshot() {
  function exportSnapshot(): void {
    const guestStore = useGuestStore()
    const seatingStore = useSeatingStore()
    const roomStore = useRoomStore()
    const menuStore = useMenuStore()
    const configStore = useAppConfigStore()

    const config: AppConfig = {
      coupleName: toRaw(configStore.coupleName),
      weddingDate: toRaw(configStore.weddingDate),
      venue: toRaw(configStore.venue),
    }

    const snapshot: WeddingSnapshot = {
      version: 1,
      exportedAt: new Date().toISOString(),
      config,
      guests: toRaw(guestStore.guests),
      tables: toRaw(seatingStore.tables),
      rooms: toRaw(roomStore.rooms),
      menuOptions: toRaw(menuStore.menuOptions),
    }

    const json = JSON.stringify(snapshot, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wedding-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importSnapshot(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const snapshot = JSON.parse(e.target?.result as string) as WeddingSnapshot
          if (
            typeof snapshot.version !== 'number' ||
            !snapshot.guests || !snapshot.tables || !snapshot.rooms || !snapshot.menuOptions
          ) {
            resolve('Invalid snapshot file: missing required fields.')
            return
          }

          const guestStore = useGuestStore()
          const seatingStore = useSeatingStore()
          const roomStore = useRoomStore()
          const menuStore = useMenuStore()
          const configStore = useAppConfigStore()

          if (snapshot.config) {
            configStore.coupleName = snapshot.config.coupleName ?? ''
            configStore.weddingDate = snapshot.config.weddingDate ?? null
            configStore.venue = snapshot.config.venue ?? ''
          }
          menuStore.bulkReplace(snapshot.menuOptions)
          guestStore.bulkReplace(snapshot.guests)
          seatingStore.bulkReplace(snapshot.tables)
          roomStore.bulkReplace(snapshot.rooms)

          resolve(null)
        } catch {
          resolve('Failed to parse file. Make sure it is a valid wedding JSON export.')
        }
      }
      reader.readAsText(file)
    })
  }

  return { exportSnapshot, importSnapshot }
}
