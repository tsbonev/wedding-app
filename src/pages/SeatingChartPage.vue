<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { NButton, NTabs, NTabPane, NRadioGroup, NRadioButton, NSwitch, NButtonGroup, useMessage } from 'naive-ui'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useGuestStore } from '@/stores/useGuestStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'
import { useI18nStore } from '@/stores/useI18nStore'
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
const groupStore = useGroupStore()
const configStore = useAppConfigStore()
const i18n = useI18nStore()
const message = useMessage()

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

async function handlePrint() {
  if (configStore.seatingActiveTab === 'floorplan') {
    const canvasEl = document.querySelector('.seating-canvas') as HTMLElement
    if (!canvasEl) return

    const msg = message.loading(i18n.t('exporting_pdf') || 'Exporting PDF...', { duration: 0 })
    
    try {
      // 1. Prepare for capture
      const originalZoom = configStore.zoomLevel
      const originalPanX = configStore.panX
      const originalPanY = configStore.panY
      
      // Fit to content first to find the bounds
      configStore.fitCanvasToTables(seatingStore.tables)
      
      // Use zoom level 2 for better quality if needed, but 1 is usually enough for A4
      configStore.zoomLevel = 1
      configStore.panX = 0
      configStore.panY = 0
      
      // Wait for DOM and relations to update
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 500))

      // 2. Capture
      const canvas = await html2canvas(canvasEl, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher scale for better PDF quality
        logging: false,
        useCORS: true,
        allowTaint: true
      })

      // 3. Create PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      
      const finalWidth = imgWidth * ratio
      const finalHeight = imgHeight * ratio
      
      // Center on page
      const x = (pdfWidth - finalWidth) / 2
      const y = (pdfHeight - finalHeight) / 2

      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight)

      pdf.save(`wedding-floor-plan-${new Date().toISOString().slice(0, 10)}.pdf`)
      
      // 4. Restore
      configStore.zoomLevel = originalZoom
      configStore.panX = originalPanX
      configStore.panY = originalPanY
      
      msg.destroy()
      message.success(i18n.t('export_success') || 'Export successful!')
    } catch (error) {
      console.error('PDF Export failed:', error)
      msg.destroy()
      message.error(i18n.t('export_failed') || 'Export failed. Please try again.')
    }
  } else {
    window.print()
  }
}
</script>

<template>
  <div @mousemove="onMouseMove" @dragover="onMouseMove">
    <h2 style="margin-top: 10px;">{{ i18n.t('seating') }}</h2>
      <!-- Print-only header -->
      <div class="print-header">
        <h1 v-if="configStore.coupleName">{{ configStore.coupleName }}</h1>
        <div class="print-meta">
          <span v-if="configStore.weddingDate"><strong>{{ i18n.t('date') }}:</strong> {{ configStore.weddingDate }}</span>
          <span v-if="configStore.venue"><strong>{{ i18n.t('venue_label') }}:</strong> {{ configStore.venue }}</span>
        </div>
      </div>

    <n-tabs v-model:value="configStore.seatingActiveTab" type="line">
      <template #suffix>
        <div style="display: flex; gap: 8px; align-items: center;">
          <n-button 
            v-if="configStore.seatingActiveTab === 'tables'"
            size="small" 
            :type="configStore.isGuestSidebarOpen ? 'primary' : 'default'"
            class="no-print"
            @click="configStore.isGuestSidebarOpen = !configStore.isGuestSidebarOpen"
          >
            {{ configStore.isGuestSidebarOpen ? i18n.t('hide') : i18n.t('show') }} {{ i18n.t('unassigned') }}
          </n-button>
          <n-button v-if="configStore.seatingActiveTab === 'tables' || configStore.seatingActiveTab === 'floorplan'" type="primary" size="small" class="no-print" @click="showAddModal = true">
            + {{ i18n.t('add_table') }}
          </n-button>
          <n-button
            v-if="configStore.seatingActiveTab === 'tables' || configStore.seatingActiveTab === 'floorplan'"
            type="info"
            size="small"
            secondary
            class="no-print"
            @click="handlePrint"
          >
            🖨️ {{ configStore.seatingActiveTab === 'floorplan' ? i18n.t('export_pdf') : i18n.t('print') }}
          </n-button>
        </div>
      </template>

      <!-- ── Tables tab ─────────────────────────────────────────────────────── -->
      <n-tab-pane name="tables" :tab="i18n.t('table')">
        <div style="position: relative; overflow: hidden; border-radius: 8px;">
          <div style="display: flex; gap: 16px; align-items: flex-start; padding-right: 0;">
            <div style="flex: 1;">
              <EmptyState
                v-if="seatingStore.tables.length === 0"
                icon="🪑" :title="i18n.t('no_tables_yet')"
                :description="i18n.t('add_table_instruction')"
              />
              <div v-else class="tables-grid">
                <TableCard
                  v-for="table in sortedTables" :key="table.id"
                  :table="table"
                  @delete="seatingStore.deleteTable($event)"
                  @edit-guest="handleEditGuest"
                />
              </div>

              <!-- Print-only legend -->
              <div class="print-legend">
                <div class="print-legend-title">{{ i18n.t('legend') }}</div>
                <div class="print-legend-items">
                  <div v-for="group in groupStore.groups" :key="group.id" class="print-legend-item">
                    <span class="print-legend-dot" :style="{ backgroundColor: group.color }"></span>
                    <span>{{ group.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <UnassignedGuestList :guests="unassigned" @edit-guest="handleEditGuest" />
        </div>
      </n-tab-pane>

      <!-- ── Floor Plan tab ─────────────────────────────────────────────────── -->
      <n-tab-pane name="floorplan" :tab="i18n.t('floor_plan')">
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div class="floorplan-toolbar">
            <div style="display: flex; gap: 8px; align-items: center;">
              <n-button
                :type="configStore.isLinkingMode ? 'primary' : 'default'"
                size="small"
                @click="configStore.isLinkingMode = !configStore.isLinkingMode"
              >
                {{ configStore.isLinkingMode ? i18n.t('disable') : i18n.t('enable') }} {{ i18n.t('linking_mode') }}
              </n-button>

              <template v-if="configStore.isLinkingMode">
                <n-radio-group v-model:value="configStore.linkingModeType" size="small">
                  <n-radio-button value="partner">{{ i18n.t('partner_mode') }}</n-radio-button>
                  <n-radio-button value="child">{{ i18n.t('child_mode') }}</n-radio-button>
                </n-radio-group>
              </template>
            </div>

            <div class="toolbar-section no-print">
              <div style="display: flex; gap: 8px; align-items: center;">
                <span class="toolbar-text">{{ i18n.t('partners') }}</span>
                <n-switch v-model:value="configStore.showRelationLines" size="small" />
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <span class="toolbar-text">{{ i18n.t('parental') }}</span>
                <n-switch v-model:value="configStore.showParentalLines" size="small" />
              </div>
            </div>

            <span class="toolbar-text no-print" style="flex: 1;">
              <template v-if="configStore.isLinkingMode">
                {{ configStore.linkingModeType === 'partner' ? i18n.t('drag_partner') : i18n.t('drag_child') }}
              </template>
              <template v-else>
                {{ i18n.t('enable_linking_instruction') }}
              </template>
            </span>

            <div class="toolbar-section no-print">
              <n-button
                size="small"
                :type="configStore.isGuestSidebarOpen ? 'primary' : 'default'"
                @click="configStore.isGuestSidebarOpen = !configStore.isGuestSidebarOpen"
              >
                {{ configStore.isGuestSidebarOpen ? i18n.t('hide') : i18n.t('show') }} {{ i18n.t('unassigned') }}
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
                :class="{ 'is-printing-floorplan': configStore.seatingActiveTab === 'floorplan' }"
                :style="{ 
                  width: configStore.canvasWidth + 'px',
                  height: configStore.canvasHeight + 'px',
                  transform: `translate(${configStore.panX}px, ${configStore.panY}px) scale(${configStore.zoomLevel})`,
                  transformOrigin: '0 0'
                }"
              >
                <EmptyState
                  v-if="seatingStore.tables.length === 0"
                  icon="🪑" :title="i18n.t('no_tables_yet')"
                  :description="i18n.t('floor_plan_instruction')"
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
                  {{ i18n.t('center_canvas') }}
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

@media print {
  /* Default A4 portrait for Tables view */
  @page {
    size: A4 portrait;
    margin: 1cm;
  }
  
  .print-header {
    display: block !important;
    text-align: center;
    margin-bottom: 20px;
    border-bottom: 2px solid #eee;
    padding-bottom: 10px;
  }
  .print-header h1 {
    margin: 0 0 5px 0;
    font-size: 24px;
    color: #334155;
  }
  .print-meta {
    display: flex;
    justify-content: center;
    gap: 20px;
    font-size: 14px;
    color: #64748b;
  }

  .unassigned-list,
  :deep(.unassigned-list),
  .n-tabs-nav,
  :deep(.n-tabs-nav) {
    display: none !important;
  }

  .tables-grid {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 10px !important;
    padding: 0 !important;
    width: 100% !important;
  }

  .print-legend {
    display: block !important;
    margin-top: 30px;
    padding-top: 15px;
    border-top: 1px solid #eee;
  }
  .print-legend-title {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 8px;
    color: #334155;
  }
  .print-legend-items {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
  .print-legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #475569;
  }
  .print-legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  /* Floor Plan specific print styles */
  .is-printing-floorplan {
    transform: none !important;
    position: relative !important;
    width: 100% !important;
    height: auto !important;
    min-height: 1000px !important;
    background: white !important;
    display: block !important;
    border: none !important;
    box-shadow: none !important;
  }

  /* Specific A4 landscape for Floor Plan */
  :deep(.is-printing-floorplan) {
    page: floorplan;
  }
  @page floorplan {
    size: A4 landscape;
    margin: 0.5cm;
  }

  .canvas-viewport {
    overflow: visible !important;
    height: auto !important;
    display: block !important;
    background: white !important;
  }

  .canvas-controls, .no-print {
    display: none !important;
  }

  body, #app, .n-config-provider {
    background: white !important;
  }

  /* Ensure the container of tables-grid doesn't have restrictive styles */
  :deep(.n-tabs-pane-wrapper), 
  :deep(.n-tab-pane) {
    padding: 0 !important;
    margin: 0 !important;
  }
}
.floorplan-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  background: var(--bg-surface);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}
.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 16px;
  border-left: 1px solid var(--border-color);
}
.toolbar-text {
  color: var(--text-subtle);
}
.canvas-viewport {
  flex: 1;
  position: relative;
  height: 800px;
  background: var(--bg-subtle);
  overflow: hidden;
  cursor: grab;
  user-select: none;
}
.canvas-viewport:active {
  cursor: grabbing;
}
.seating-canvas {
  position: absolute;
  background: var(--bg-muted);
  border: 1px solid var(--border-color);
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
  background: var(--bg-surface);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  font-size: 11px;
  text-align: center;
  color: var(--text-subtle);
  font-weight: 600;
}
.print-header,
.print-legend {
  display: none;
}
</style>
