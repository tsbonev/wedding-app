<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useGuestStore } from '@/stores/useGuestStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'

const guestStore = useGuestStore()
const groupStore = useGroupStore()
const seatingStore = useSeatingStore()
const configStore = useAppConfigStore()

const guestPositions = ref<Map<string, { x: number; y: number; tableId: string | null; rotation: number }>>(new Map())

function updatePositions() {
  const newPositions = new Map<string, { x: number; y: number; tableId: string | null; rotation: number }>()
  const tokens = document.querySelectorAll('.seat-token[data-guest-id]')
  
  const canvas = document.querySelector('.seating-canvas')
  if (!canvas) return
  
  const canvasRect = canvas.getBoundingClientRect()

  tokens.forEach((token) => {
    const guestId = (token as HTMLElement).dataset.guestId
    if (guestId) {
      const rect = token.getBoundingClientRect()
      const guest = guestStore.getById(guestId)
      const table = guest?.tableId ? seatingStore.getById(guest.tableId) : null
      
      newPositions.set(guestId, {
        x: rect.left - canvasRect.left + rect.width / 2,
        y: rect.top - canvasRect.top + rect.height / 2,
        tableId: guest?.tableId ?? null,
        rotation: table?.rotation ?? 0
      })
    }
  })
  guestPositions.value = newPositions
}

let animationFrame: number
function loop() {
  updatePositions()
  animationFrame = requestAnimationFrame(loop)
}

onMounted(() => {
  loop()
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrame)
})

const plusOneArcs = computed(() => {
  const arcs: { d: string; color: string; id: string }[] = []
  const processed = new Set<string>()
  const onlySameTable = configStore.showPlusOneLinesOnlySameTable ?? false

  guestStore.guests.forEach((guest) => {
    if (guest.plusOneOf && !processed.has(guest.id)) {
      const mainGuest = guestStore.getById(guest.plusOneOf)
      if (mainGuest) {
        if (onlySameTable && guest.tableId !== mainGuest.tableId) return
        if (onlySameTable && !guest.tableId) return // Not on any table

        const pos1 = guestPositions.value.get(guest.id)
        const pos2 = guestPositions.value.get(mainGuest.id)

        if (pos1 && pos2) {
          const dx = pos2.x - pos1.x
          const dy = pos2.y - pos1.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist > 5) {
            // Arc logic: A rx ry x-axis-rotation large-arc-flag sweep-flag x y
            const rx = dist * 0.55
            const ry = dist * 0.55

            // Determine table center for directional logic
            let hasTable = false

            if (pos1.tableId) {
              const table = seatingStore.getById(pos1.tableId)
              if (table) {
                hasTable = true
              }
            }

            // Offset points from the center of the token to the edge
            const radius = 20 // seat token is 40x40, so radius is 20
            
            const getAnchorPoint = (pos: { x: number; y: number; tableId: string | null; rotation: number }) => {
              if (hasTable && pos.tableId) {
                const table = seatingStore.getById(pos.tableId)
                if (table) {
                  const isRect = table.shape === 'rectangular'
                  const rad = table.rotation * (Math.PI / 180)
                  
                  // Table center in global coordinates
                  const rectBodyWidth = Math.ceil(table.capacity / 2) * 44 + 16
                  const tCX = table.aerialPosX + rectBodyWidth / 2
                  const tCY = table.aerialPosY + 26 // center of 52px height

                  // Vector from table center to guest
                  const dx = pos.x - tCX
                  const dy = pos.y - tCY
                  
                  if (isRect) {
                    // Rotate the vector into table-local space
                    const localY = dx * Math.sin(-rad) + dy * Math.cos(-rad)
                    
                    const dirLocalY = localY > 0 ? 1 : -1
                    
                    // Rotate (0, dirLocalY) back to global space
                    const dirX = -dirLocalY * Math.sin(rad)
                    const dirY = dirLocalY * Math.cos(rad)
                    
                    return {
                      x: pos.x + dirX * radius,
                      y: pos.y + dirY * radius
                    }
                  } else {
                    // For round tables, the direction from center is correct
                    const mag = Math.sqrt(dx * dx + dy * dy)
                    if (mag > 0.1) {
                      return {
                        x: pos.x + (dx / mag) * radius,
                        y: pos.y + (dy / mag) * radius
                      }
                    }
                  }
                }
              }
              // Fallback
              const rad = (pos.rotation - 90) * (Math.PI / 180)
              return {
                x: pos.x + Math.cos(rad) * radius,
                y: pos.y + Math.sin(rad) * radius
              }
            }

            const start = getAnchorPoint(pos1)
            const end = getAnchorPoint(pos2)
            const startX = start.x
            const startY = start.y
            const endX = end.x
            const endY = end.y

            // Determine sweep flag to arc AWAY from the table center
            let sweepFlag = 1
            if (hasTable) {
              const table = seatingStore.getById(pos1.tableId!)
              if (table) {
                const rectBodyWidth = Math.ceil(table.capacity / 2) * 44 + 16
                const tCX = table.aerialPosX + rectBodyWidth / 2
                const tCY = table.aerialPosY + 26
                
                // Midpoint of the two anchor points
                const midX = (start.x + end.x) / 2
                const midY = (start.y + end.y) / 2
                
                // Vector from table center to midpoint
                const toMidX = midX - tCX
                const toMidY = midY - tCY
                
                // Vector from start to end anchor point
                const dxArc = end.x - start.x
                const dyArc = end.y - start.y
                
                // Determinant of (end-start) and (mid-tableCenter) vectors
                const crossProduct = dxArc * toMidY - dyArc * toMidX
                sweepFlag = crossProduct > 0 ? 0 : 1
              }
            }
            
            const d = `M ${startX} ${startY} A ${rx} ${ry} 0 0 ${sweepFlag} ${endX} ${endY}`
            
            let color = '#94a3b8' // default slate
            if (mainGuest.groupId) {
              color = groupStore.getById(mainGuest.groupId)?.color ?? color
            }

            arcs.push({
              id: `${guest.id}-${mainGuest.id}`,
              d,
              color
            })
          }
        }
      }
      processed.add(guest.id)
      processed.add(guest.plusOneOf)
    }
  })

  return arcs
})
</script>

<template>
  <svg class="plus-one-arcs-svg">
    <path
      v-for="arc in plusOneArcs"
      :key="arc.id"
      :d="arc.d"
      :stroke="arc.color"
      :color="arc.color"
      fill="none"
      stroke-width="3.5"
      stroke-dasharray="6 3"
      class="arc-path"
    />
  </svg>
</template>

<style scoped>
.plus-one-arcs-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}
.arc-path {
  transition: stroke 0.3s ease;
  opacity: 0.8;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
}
</style>
