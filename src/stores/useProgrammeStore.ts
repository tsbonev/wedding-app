import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ProgrammeEvent } from '@/types'

export const useProgrammeStore = defineStore('programme', () => {
  const events = ref<ProgrammeEvent[]>([])

  const sortedEvents = computed(() => {
    return [...events.value].sort((a, b) => a.time.localeCompare(b.time))
  })

  function addEvent(event: Omit<ProgrammeEvent, 'id'>) {
    events.value.push({
      ...event,
      id: crypto.randomUUID()
    })
  }

  function updateEvent(id: string, updatedEvent: Partial<Omit<ProgrammeEvent, 'id'>>) {
    const index = events.value.findIndex(e => e.id === id)
    if (index !== -1) {
      events.value[index] = { ...events.value[index], ...updatedEvent }
    }
  }

  function removeEvent(id: string) {
    events.value = events.value.filter(e => e.id !== id)
  }

  function setEvents(newEvents: ProgrammeEvent[]) {
    events.value = newEvents
  }

  return {
    events,
    sortedEvents,
    addEvent,
    updateEvent,
    removeEvent,
    setEvents
  }
}, { persist: true })
