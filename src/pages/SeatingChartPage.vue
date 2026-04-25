<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NSpace, NText, NRadioGroup, NRadioButton } from 'naive-ui'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useGuestStore } from '@/stores/useGuestStore'
import { useMenuStore } from '@/stores/useMenuStore'
import TableCard from '@/components/seating/TableCard.vue'
import AerialTableView from '@/components/seating/AerialTableView.vue'
import UnassignedGuestList from '@/components/seating/UnassignedGuestList.vue'
import AddTableModal from '@/components/seating/AddTableModal.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

const seatingStore = useSeatingStore()
const guestStore = useGuestStore()
const menuStore = useMenuStore()

const showAddModal = ref(false)
const viewMode = ref<'manage' | 'aerial' | 'print'>('manage')

const unassigned = computed(() => guestStore.unassignedGuests)

// ── Print helpers ─────────────────────────────────────────────────────────────

function guestName(id: string | null) {
  if (!id) return null
  const g = guestStore.getById(id)
  return g ? `${g.firstName} ${g.lastName}` : null
}

function mealLabel(guestId: string | null) {
  if (!guestId) return null
  const g = guestStore.getById(guestId)
  if (!g?.mealChoiceId) return null
  const opt = menuStore.menuOptions.find((o) => o.id === g.mealChoiceId)
  return opt ? `${opt.emoji} ${opt.label}` : null
}

function tableDimsLabel(tableId: string) {
  const t = seatingStore.getById(tableId)
  if (!t) return ''
  if (t.shape === 'rectangular' && t.lengthCm && t.widthCm) return `${t.lengthCm} × ${t.widthCm} cm`
  return t.shape === 'round' ? 'Round' : 'Rectangular'
}

function occupiedCount(tableId: string) {
  return seatingStore.getById(tableId)?.seats.filter((s) => s.guestId).length ?? 0
}

function printPage() { window.print() }
</script>

<template>
  <div>
    <!-- ── Header ─────────────────────────────────────────────────────────────── -->
    <n-space justify="space-between" align="center" style="margin-bottom: 16px;" class="no-print">
      <h2 style="margin: 0;">Seating Chart</h2>
      <n-space align="center">
        <n-radio-group v-model:value="viewMode" size="small">
          <n-radio-button value="manage">Manage</n-radio-button>
          <n-radio-button value="aerial">Aerial</n-radio-button>
          <n-radio-button value="print">Print</n-radio-button>
        </n-radio-group>
        <n-button v-if="viewMode !== 'print'" type="primary" @click="showAddModal = true">+ Add Table</n-button>
        <n-button v-else type="primary" @click="printPage()">🖨️ Print / Save PDF</n-button>
      </n-space>
    </n-space>

    <!-- ── Manage view ────────────────────────────────────────────────────────── -->
    <template v-if="viewMode === 'manage'">
      <n-text depth="3" style="font-size: 12px; display: block; margin-bottom: 12px;" class="no-print">
        Drag guests from the panel onto seats. Drag table cards to reposition.
      </n-text>
      <div style="display: flex; gap: 16px; align-items: flex-start;">
        <div class="seating-canvas" :style="{ minHeight: seatingStore.tables.length ? '1000px' : '200px' }">
          <EmptyState
            v-if="seatingStore.tables.length === 0"
            icon="💺" title="No tables yet"
            description="Click 'Add Table' to start laying out your seating."
          />
          <TableCard
            v-for="table in seatingStore.tables" :key="table.id"
            :table="table" :unassigned-guests="unassigned"
            @delete="seatingStore.deleteTable($event)"
          />
        </div>
        <UnassignedGuestList :guests="unassigned" />
      </div>
    </template>

    <!-- ── Aerial view ────────────────────────────────────────────────────────── -->
    <template v-else-if="viewMode === 'aerial'">
      <n-text depth="3" style="font-size: 12px; display: block; margin-bottom: 12px;" class="no-print">
        Drag guests from the panel onto seats. Double-click a guest circle to unassign. Drag between seats to swap.
      </n-text>
      <div style="display: flex; gap: 16px; align-items: flex-start;">
        <div class="seating-canvas" :style="{ minHeight: seatingStore.tables.length ? '1000px' : '200px' }">
          <EmptyState
            v-if="seatingStore.tables.length === 0"
            icon="💺" title="No tables yet"
            description="Click 'Add Table' to start laying out your seating."
          />
          <AerialTableView
            v-for="table in seatingStore.tables" :key="table.id"
            :table="table"
            @delete="seatingStore.deleteTable($event)"
          />
        </div>
        <UnassignedGuestList :guests="unassigned" />
      </div>
    </template>

    <!-- ── Print view ─────────────────────────────────────────────────────────── -->
    <template v-else>
      <div class="print-grid">
        <EmptyState
          v-if="seatingStore.tables.length === 0"
          icon="💺" title="No tables yet"
          description="Add tables in Manage view."
          class="no-print"
        />
        <div
          v-for="table in seatingStore.tables" :key="table.id"
          class="print-card"
        >
          <div class="print-card-header">
            <span class="print-table-name">{{ table.name }}</span>
            <span class="print-table-meta">
              {{ table.shape === 'round' ? 'Round' : 'Rectangular' }} ·
              {{ table.capacity }} seats
              <template v-if="table.shape === 'rectangular' && table.lengthCm && table.widthCm">
                · {{ tableDimsLabel(table.id) }}
              </template>
            </span>
          </div>
          <ol class="print-seat-list">
            <li v-for="seat in table.seats" :key="seat.index" class="print-seat-item">
              <template v-if="seat.guestId">
                <span class="print-guest-name">{{ guestName(seat.guestId) }}</span>
                <span v-if="mealLabel(seat.guestId)" class="print-meal">{{ mealLabel(seat.guestId) }}</span>
              </template>
              <span v-else class="print-empty">—</span>
            </li>
          </ol>
          <div class="print-card-footer">
            {{ occupiedCount(table.id) }} / {{ table.capacity }} occupied
          </div>
        </div>
      </div>
    </template>

    <AddTableModal :show="showAddModal" @close="showAddModal = false" />
  </div>
</template>

<style scoped>
.seating-canvas {
  flex: 1;
  position: relative;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

/* Print grid */
.print-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.print-card {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
  break-inside: avoid;
  page-break-inside: avoid;
}
.print-card-header {
  background: #f3f4f6;
  padding: 10px 14px;
  border-bottom: 1px solid #e5e7eb;
}
.print-table-name {
  font-size: 15px;
  font-weight: 700;
  display: block;
}
.print-table-meta {
  font-size: 11px;
  color: #6b7280;
  display: block;
  margin-top: 2px;
}
.print-seat-list {
  list-style: decimal;
  margin: 0;
  padding: 10px 14px 10px 34px;
}
.print-seat-item {
  padding: 4px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.print-seat-item:last-child { border-bottom: none; }
.print-guest-name { flex: 1; }
.print-meal { font-size: 11px; color: #6b7280; flex-shrink: 0; }
.print-empty { color: #d1d5db; }
.print-card-footer {
  padding: 6px 14px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  font-size: 11px;
  color: #9ca3af;
}
</style>

<!-- Global print styles — not scoped so they reach the app layout -->
<style>
@media print {
  .no-print { display: none !important; }
  .n-layout-sider { display: none !important; }
  .n-layout-content { padding: 0 !important; }
  .print-card { break-inside: avoid; }
}
</style>
