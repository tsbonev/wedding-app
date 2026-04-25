<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NTabs, NTabPane, NText } from 'naive-ui'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useGuestStore } from '@/stores/useGuestStore'
import TableCard from '@/components/seating/TableCard.vue'
import AerialTableView from '@/components/seating/AerialTableView.vue'
import UnassignedGuestList from '@/components/seating/UnassignedGuestList.vue'
import AddTableModal from '@/components/seating/AddTableModal.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

const seatingStore = useSeatingStore()
const guestStore = useGuestStore()

const activeTab = ref<'tables' | 'floorplan'>('tables')
const showAddModal = ref(false)

const unassigned = computed(() => guestStore.unassignedGuests)
const sortedTables = computed(() =>
  [...seatingStore.tables].sort((a, b) => a.name.localeCompare(b.name))
)
</script>

<template>
  <div>
    <n-tabs v-model:value="activeTab" type="line">
      <template #suffix>
        <n-button v-if="activeTab === 'tables'" type="primary" size="small" @click="showAddModal = true">
          + Add Table
        </n-button>
      </template>

      <!-- ── Tables tab ─────────────────────────────────────────────────────── -->
      <n-tab-pane name="tables" tab="Tables">
        <EmptyState
          v-if="seatingStore.tables.length === 0"
          icon="🪑" title="No tables yet"
          description="Click '+ Add Table' to start laying out your seating."
        />
        <div v-else class="tables-grid">
          <TableCard
            v-for="table in sortedTables" :key="table.id"
            :table="table"
            :unassigned-guests="unassigned"
            @delete="seatingStore.deleteTable($event)"
          />
        </div>
      </n-tab-pane>

      <!-- ── Floor Plan tab ─────────────────────────────────────────────────── -->
      <n-tab-pane name="floorplan" tab="Floor Plan">
        <n-text depth="3" style="font-size: 12px; display: block; margin-bottom: 12px;">
          Click a table to select it, then drag to reposition. Click a corner handle to rotate 45°. Drag guests from the panel onto seats.
        </n-text>
        <div style="display: flex; gap: 16px; align-items: flex-start;">
          <div class="seating-canvas" :style="{ minHeight: seatingStore.tables.length ? '1000px' : '200px' }">
            <EmptyState
              v-if="seatingStore.tables.length === 0"
              icon="💺" title="No tables yet"
              description="Switch to the Tables tab to add tables."
            />
            <AerialTableView
              v-for="table in seatingStore.tables" :key="table.id"
              :table="table"
            />
          </div>
          <UnassignedGuestList :guests="unassigned" />
        </div>
      </n-tab-pane>
    </n-tabs>

    <AddTableModal :show="showAddModal" @close="showAddModal = false" />
  </div>
</template>

<style scoped>
.tables-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 8px;
}
.seating-canvas {
  flex: 1;
  position: relative;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
</style>
