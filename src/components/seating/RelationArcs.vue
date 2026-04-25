<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, nextTick } from 'vue'
import { NTooltip } from 'naive-ui'
import { useGuestStore } from '@/stores/useGuestStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'

const guestStore = useGuestStore()
const groupStore = useGroupStore()
const seatingStore = useSeatingStore()
const configStore = useAppConfigStore()
const hoveredArcId = ref<string | null>(null)

const showTooltip = ref(false)
const tooltipX = ref(0)
const tooltipY = ref(0)
const tooltipContent = ref('')

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

  // Also include unassigned guests if they are being dragged
  const allGuestElements = document.querySelectorAll('[data-guest-id]')
  allGuestElements.forEach((el) => {
    const guestId = (el as HTMLElement).dataset.guestId
    if (guestId && !newPositions.has(guestId)) {
      const rect = el.getBoundingClientRect()
      newPositions.set(guestId, {
        x: rect.left - canvasRect.left + rect.width / 2,
        y: rect.top - canvasRect.top + rect.height / 2,
        tableId: null,
        rotation: 0
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

const relationArcs = computed(() => {
  const arcs: { d: string; color: string; id: string; label: string }[] = []
  const processedPartnerPairs = new Set<string>()
  const onlySameTable = configStore.showRelationLinesOnlySameTable ?? false
  const showPartners = configStore.showRelationLines ?? true
  const showParental = configStore.showParentalLines ?? true

  guestStore.guests.forEach((guest) => {
    // 1. Partner Arcs
    if (showPartners && guest.partnerId && !processedPartnerPairs.has(guest.id)) {
      const partner = guestStore.getById(guest.partnerId)
      if (partner) {
        if (!onlySameTable || (guest.tableId && guest.tableId === partner.tableId)) {
          const pos1 = guestPositions.value.get(guest.id)
          const pos2 = guestPositions.value.get(partner.id)

          if (pos1 && pos2) {
            const arc = createArc(guest.id, partner.id, pos1, pos2)
            if (arc) {
              arcs.push({
                ...arc,
                label: `Partners: ${guest.firstName} ${guest.lastName} & ${partner.firstName} ${partner.lastName}`
              })
            }
          }
        }
        processedPartnerPairs.add(guest.id)
        processedPartnerPairs.add(partner.id)
      }
    }

    // 2. Child-Parent Arcs
    if (showParental && guest.isChild && guest.parentId) {
      const parent = guestStore.getById(guest.parentId)
      if (parent) {
        if (!onlySameTable || (guest.tableId && guest.tableId === parent.tableId)) {
          const pos1 = guestPositions.value.get(guest.id)
          const pos2 = guestPositions.value.get(parent.id)

          if (pos1 && pos2) {
            const arc = createArc(guest.id, parent.id, pos1, pos2)
            if (arc) {
              arcs.push({
                ...arc,
                label: `${guest.firstName} ${guest.lastName} is child of ${parent.firstName} ${parent.lastName}`
              })
            }
          }
        }
      }
    }
  })

  return arcs
})

const pendingArc = computed(() => {
  if (!configStore.activeLinkingSource) return null
  const sourcePos = guestPositions.value.get(configStore.activeLinkingSource)
  if (!sourcePos) return null

  const start = { x: sourcePos.x, y: sourcePos.y }
  const end = { x: configStore.mousePosX, y: configStore.mousePosY }

  const dx = end.x - start.x
  const dy = end.y - start.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < 10) return null

  // Simple arc towards cursor
  const rx = dist * 0.55
  const ry = dist * 0.55
  const d = `M ${start.x} ${start.y} A ${rx} ${ry} 0 0 1 ${end.x} ${end.y}`

  let color = '#3b82f6' // Default blue for pending
  const guest = guestStore.getById(configStore.activeLinkingSource)
  if (guest?.groupId) {
    color = groupStore.getById(guest.groupId)?.color ?? color
  }

  return { d, color }
})

function onArcClick(event: MouseEvent, label: string) {
  tooltipX.value = event.clientX
  tooltipY.value = event.clientY
  tooltipContent.value = label
  showTooltip.value = false
  nextTick(() => {
    showTooltip.value = true
  })
}

function onMouseLeave() {
  hoveredArcId.value = null
  showTooltip.value = false
}

function createArc(id1: string, id2: string, pos1: any, pos2: any) {
  const dx = pos2.x - pos1.x
  const dy = pos2.y - pos1.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  
  if (dist <= 5) return null

  // Arc logic: A rx ry x-axis-rotation large-arc-flag sweep-flag x y
  const rx = dist * 0.55
  const ry = dist * 0.55

  // Determine table center for directional logic
  let hasTable = false
  if (pos1.tableId) {
    const table = seatingStore.getById(pos1.tableId)
    if (table) hasTable = true
  }

  // Offset points from the center of the token to the edge
  const radius = 20 // seat token is 40x40, so radius is 20
  
  const getAnchorPoint = (pos: { x: number; y: number; tableId: string | null; rotation: number }) => {
    if (hasTable && pos.tableId) {
      const table = seatingStore.getById(pos.tableId)
      if (table) {
        const isRect = table.shape === 'rectangular'
        const rad = table.rotation * (Math.PI / 180)
        
        const rectBodyWidth = Math.ceil(table.capacity / 2) * 44 + 16
        const tCX = table.aerialPosX + rectBodyWidth / 2
        const tCY = table.aerialPosY + 26

        const dx = pos.x - tCX
        const dy = pos.y - tCY
        
        if (isRect) {
          const localY = dx * Math.sin(-rad) + dy * Math.cos(-rad)
          const dirLocalY = localY > 0 ? 1 : -1
          const dirX = -dirLocalY * Math.sin(rad)
          const dirY = dirLocalY * Math.cos(rad)
          return { x: pos.x + dirX * radius, y: pos.y + dirY * radius }
        } else {
          const mag = Math.sqrt(dx * dx + dy * dy)
          if (mag > 0.1) {
            return { x: pos.x + (dx / mag) * radius, y: pos.y + (dy / mag) * radius }
          }
        }
      }
    }
    const rad = (pos.rotation - 90) * (Math.PI / 180)
    return { x: pos.x + Math.cos(rad) * radius, y: pos.y + Math.sin(rad) * radius }
  }

  const start = getAnchorPoint(pos1)
  const end = getAnchorPoint(pos2)
  const startX = start.x
  const startY = start.y
  const endX = end.x
  const endY = end.y

  let sweepFlag = 1
  if (hasTable) {
    const table = seatingStore.getById(pos1.tableId!)
    if (table) {
      const rectBodyWidth = Math.ceil(table.capacity / 2) * 44 + 16
      const tCX = table.aerialPosX + rectBodyWidth / 2
      const tCY = table.aerialPosY + 26
      const midX = (start.x + end.x) / 2
      const midY = (start.y + end.y) / 2
      const toMidX = midX - tCX
      const toMidY = midY - tCY
      const dxArc = end.x - start.x
      const dyArc = end.y - start.y
      const crossProduct = dxArc * toMidY - dyArc * toMidX
      sweepFlag = crossProduct > 0 ? 0 : 1
    }
  }
  
  const d = `M ${startX} ${startY} A ${rx} ${ry} 0 0 ${sweepFlag} ${endX} ${endY}`
  
  let color = '#94a3b8'
  const guest1 = guestStore.getById(id1)
  if (guest1?.groupId) {
    color = groupStore.getById(guest1.groupId)?.color ?? color
  }

  return { id: `${id1}-${id2}`, d, color }
}
</script>

<template>
  <div class="relation-arcs-container">
    <svg class="relation-arcs-svg">
      <g
        v-for="arc in relationArcs"
        :key="arc.id"
        class="arc-group"
        @mouseenter="hoveredArcId = arc.id"
        @mouseleave="onMouseLeave"
        @click="onArcClick($event, arc.label)"
      >
        <!-- Thick transparent overlay for easier hovering -->
        <path
          :d="arc.d"
          stroke="transparent"
          fill="none"
          stroke-width="20"
          class="arc-hover-overlay"
        />
        <!-- Visible dashed line -->
        <path
          :d="arc.d"
          :stroke="arc.color"
          :color="arc.color"
          fill="none"
          :stroke-width="hoveredArcId === arc.id ? 6 : 3.5"
          stroke-dasharray="6 3"
          class="arc-path"
          :class="{ 'is-hovered': hoveredArcId === arc.id, 'has-hover': hoveredArcId !== null && hoveredArcId !== arc.id }"
        />
      </g>

      <!-- Pending arc for linking mode -->
      <path
        v-if="pendingArc"
        :d="pendingArc.d"
        :stroke="pendingArc.color"
        fill="none"
        stroke-width="3"
        stroke-dasharray="5 5"
        style="opacity: 0.6; pointer-events: none;"
      />
    </svg>

    <n-tooltip
      v-model:show="showTooltip"
      trigger="manual"
      :x="tooltipX"
      :y="tooltipY"
      placement="top"
    >
      {{ tooltipContent }}
    </n-tooltip>
  </div>
</template>

<style scoped>
.relation-arcs-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}
.relation-arcs-svg {
  width: 100%;
  height: 100%;
}
.arc-group {
  pointer-events: stroke;
  cursor: pointer;
}
.arc-hover-overlay {
  pointer-events: stroke;
}
.arc-path {
  transition: stroke 0.3s ease, stroke-width 0.2s ease, opacity 0.2s ease;
  opacity: 0.8;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
  pointer-events: none; /* Let the group handle mouse events */
}
.arc-path.has-hover {
  opacity: 0.2;
}
.arc-path.is-hovered {
  opacity: 1;
}
</style>
