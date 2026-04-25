<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NButton, NTabs, NTabPane, NRadioGroup, NRadioButton, NSwitch, NButtonGroup } from 'naive-ui'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useGuestStore } from '@/stores/useGuestStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'
import type { Guest } from '@/types'
import TableCard from '@/components/seating/TableCard.vue'
import AerialTableView from '@/components/seating/AerialTableView.vue'
import UnassignedGuestList from '@/components/seating/UnassignedGuestList.vue'
import RelationArcs from '@/components/seating/RelationArcs.vue'
import AddTableModal from '@/components/seating/AddTableModal.vue'
import GuestFormModal from '@/components/guest/GuestFormModal.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

const seatingStore = useSeatingStore()
const guestStore = useGuestStore()
const configStore = useAppConfigStore()

const showAddModal = ref(false)

const unassigned = computed(() => guestStore.unassignedGuests)
const sortedTables = computed(() =>
  [...seatingStore.tables].sort((a, b) => a.name.localeCompare(b.name))
)

watch(() => seatingStore.tables, () => {
  if (configStore.seatingActiveTab === 'floorplan') {
    configStore.fitCanvasToTables(seatingStore.tables)
  }
}, { deep: true })

// ── Guest Editing ────────────────────────────────────────────────────────────

const showGuestModal = ref(false)
const editingGuest = ref<Guest | undefined>(undefined)

function handleEditGuest(guestId: string) {
  const guest = guestStore.getById(guestId)
  if (guest) {
    editingGuest.value = guest
    showGuestModal.value = true
  }
}

function onMouseMove(event: MouseEvent | DragEvent) {
  const canvas = document.querySelector('.seating-canvas')
  if (canvas) {
    const rect = canvas.getBoundingClientRect()
    // mousePosX/Y are used for the linking mode arc, so they should be in canvas-local coordinates
    // When zoomed and panned, we need to transform the client coordinates
    configStore.mousePosX = (event.clientX - rect.left) / configStore.zoomLevel
    configStore.mousePosY = (event.clientY - rect.top) / configStore.zoomLevel
  }
}

const viewportEl = ref<HTMLElement | null>(null)

function onCanvasMouseDown(event: MouseEvent) {
  // Only pan if left-clicking directly on the canvas (not on a table)
  if (event.button !== 0) return
  if ((event.target as HTMLElement).closest('.aerial-wrapper, .relation-arcs-container')) return

  const startX = event.clientX
  const startY = event.clientY
  const startPanX = configStore.panX
  const startPanY = configStore.panY

  function onMouseMove(e: MouseEvent) {
    configStore.panX = startPanX + (e.clientX - startX)
    configStore.panY = startPanY + (e.clientY - startY)
  }

  function onMouseUp() {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onCanvasWheel(event: WheelEvent) {
  event.preventDefault()
  
  const delta = -event.deltaY
  const factor = Math.pow(1.1, delta / 100)
  
  const newZoom = Math.min(2, Math.max(0.2, configStore.zoomLevel * factor))
  
  if (newZoom === configStore.zoomLevel) return

  // To zoom towards the mouse:
  // 1. Get mouse position relative to viewport
  if (!viewportEl.value) return
  const rect = viewportEl.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // 2. Calculate mouse position relative to canvas content before zoom
  const contentX = (mouseX - configStore.panX) / configStore.zoomLevel
  const contentY = (mouseY - configStore.panY) / configStore.zoomLevel

  // 3. Update zoom
  configStore.zoomLevel = newZoom

  // 4. Update pan to keep contentX/Y under the mouse
  configStore.panX = mouseX - contentX * configStore.zoomLevel
  configStore.panY = mouseY - contentY * configStore.zoomLevel
}

function zoomIn() {
  configStore.zoomLevel = Math.min(2, configStore.zoomLevel + 0.1)
}

function zoomOut() {
  configStore.zoomLevel = Math.max(0.2, configStore.zoomLevel - 0.1)
}

function centerCanvas() {
  if (!viewportEl.value) return
  const vw = viewportEl.value.clientWidth
  const vh = viewportEl.value.clientHeight
  const cw = configStore.canvasWidth * configStore.zoomLevel
  const ch = configStore.canvasHeight * configStore.zoomLevel
  
  configStore.panX = (vw - cw) / 2
  configStore.panY = (vh - ch) / 2
}

watch(() => configStore.isLinkingMode, (val) => {
  if (!val) {
    configStore.activeLinkingSource = null
  }
})

watch(() => configStore.seatingActiveTab, (newTab) => {
  if (newTab === 'floorplan') {
    configStore.fitCanvasToTables(seatingStore.tables)
  }
})
</script>

<template>
  <div @mousemove="onMouseMove" @dragover="onMouseMove">
    <n-tabs v-model:value="configStore.seatingActiveTab" type="line">
      <template #suffix>
        <div style="display: flex; gap: 8px; align-items: center;">
          <n-button 
            v-if="configStore.seatingActiveTab === 'tables'"
            size="small" 
            :type="configStore.isGuestSidebarOpen ? 'primary' : 'default'"
            @click="configStore.isGuestSidebarOpen = !configStore.isGuestSidebarOpen"
          >
            {{ configStore.isGuestSidebarOpen ? 'Hide' : 'Show' }} Unassigned
          </n-button>
          <n-button v-if="configStore.seatingActiveTab === 'tables' || configStore.seatingActiveTab === 'floorplan'" type="primary" size="small" @click="showAddModal = true">
            + Add Table
          </n-button>
        </div>
      </template>

      <!-- ── Tables tab ─────────────────────────────────────────────────────── -->
      <n-tab-pane name="tables" tab="Tables">
        <div style="position: relative; overflow: hidden; border-radius: 8px;">
          <div style="display: flex; gap: 16px; align-items: flex-start; padding-right: 0;">
            <div style="flex: 1;">
              <EmptyState
                v-if="seatingStore.tables.length === 0"
                icon="🪑" title="No tables yet"
                description="Click '+ Add Table' to start laying out your seating."
              />
              <div v-else class="tables-grid">
                <TableCard
                  v-for="table in sortedTables" :key="table.id"
                  :table="table"
                  @delete="seatingStore.deleteTable($event)"
                  @edit-guest="handleEditGuest"
                />
              </div>
            </div>
          </div>
          <UnassignedGuestList :guests="unassigned" @edit-guest="handleEditGuest" />
        </div>
      </n-tab-pane>

      <!-- ── Floor Plan tab ─────────────────────────────────────────────────── -->
      <n-tab-pane name="floorplan" tab="Floor Plan">
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center; background: white; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <n-button
                :type="configStore.isLinkingMode ? 'primary' : 'default'"
                size="small"
                @click="configStore.isLinkingMode = !configStore.isLinkingMode"
              >
                {{ configStore.isLinkingMode ? 'Disable' : 'Enable' }} Linking Mode
              </n-button>
              
              <template v-if="configStore.isLinkingMode">
                <n-radio-group v-model:value="configStore.linkingModeType" size="small">
                  <n-radio-button value="partner">Partner Mode</n-radio-button>
                  <n-radio-button value="child">Child Mode</n-radio-button>
                </n-radio-group>
              </template>
            </div>

            <div style="display: flex; gap: 16px; align-items: center; border-left: 1px solid #e2e8f0; padding-left: 16px;">
              <div style="display: flex; gap: 8px; align-items: center;">
                <span style="font-size: 13px; color: #64748b;">Partners</span>
                <n-switch v-model:value="configStore.showRelationLines" size="small" />
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <span style="font-size: 13px; color: #64748b;">Parental</span>
                <n-switch v-model:value="configStore.showParentalLines" size="small" />
              </div>
            </div>

            <div style="font-size: 13px; color: #64748b; flex: 1;">
              <template v-if="configStore.isLinkingMode">
                {{ configStore.linkingModeType === 'partner' ? 'Drag onto someone to make them partners.' : 'Drag a child guest onto their parent.' }}
              </template>
              <template v-else>
                Enable linking mode to set relations by dragging.
              </template>
            </div>

          <div style="border-left: 1px solid #e2e8f0; padding-left: 16px; display: flex; gap: 8px;">
            <n-button 
              size="small" 
              :type="configStore.isGuestSidebarOpen ? 'primary' : 'default'"
              @click="configStore.isGuestSidebarOpen = !configStore.isGuestSidebarOpen"
            >
              {{ configStore.isGuestSidebarOpen ? 'Hide' : 'Show' }} Unassigned
            </n-button>
          </div>
          </div>
          <div style="position: relative; overflow: hidden; border-radius: 8px;">
            <div 
              ref="viewportEl"
              class="canvas-viewport"
              @mousedown="onCanvasMouseDown"
              @wheel="onCanvasWheel"
            >
              <div 
                class="seating-canvas" 
                :style="{ 
                  width: configStore.canvasWidth + 'px',
                  height: configStore.canvasHeight + 'px',
                  transform: `translate(${configStore.panX}px, ${configStore.panY}px) scale(${configStore.zoomLevel})`,
                  transformOrigin: '0 0'
                }"
              >
                <EmptyState
                  v-if="seatingStore.tables.length === 0"
                  icon="🪑" title="No tables yet"
                  description="Switch to the Tables tab to add tables."
                />
                <RelationArcs />
                <AerialTableView
                  v-for="table in seatingStore.tables" :key="table.id"
                  :table="table"
                  @edit-guest="handleEditGuest"
                />
              </div>

              <!-- Canvas Controls -->
              <div class="canvas-controls top-left">
                <n-button-group vertical size="small">
                  <n-button @click="zoomIn">
                    <template #icon>➕</template>
                  </n-button>
                  <n-button @click="zoomOut">
                    <template #icon>➖</template>
                  </n-button>
                </n-button-group>
                <div class="zoom-indicator">{{ Math.round(configStore.zoomLevel * 100) }}%</div>
              </div>

              <div class="canvas-controls top-center">
                <n-button size="small" @click="centerCanvas">
                  Center Canvas
                </n-button>
              </div>
            </div>
            <UnassignedGuestList :guests="unassigned" @edit-guest="handleEditGuest" />
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>

    <AddTableModal :show="showAddModal" @close="showAddModal = false" />
    <GuestFormModal
      :show="showGuestModal"
      :guest="editingGuest"
      @close="showGuestModal = false; editingGuest = undefined"
    />
  </div>
</template>

<style scoped>
.tables-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 8px;
  flex: 1;
}
.canvas-viewport {
  flex: 1;
  position: relative;
  height: 800px;
  background: #f1f5f9;
  overflow: hidden;
  cursor: grab;
  user-select: none;
}
.canvas-viewport:active {
  cursor: grabbing;
}
.seating-canvas {
  position: absolute;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}
.canvas-controls {
  position: absolute;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.canvas-controls.top-left {
  top: 16px;
  left: 16px;
}
.canvas-controls.top-center {
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
}
.zoom-indicator {
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  font-size: 11px;
  text-align: center;
  color: #64748b;
  font-weight: 600;
}
</style>
