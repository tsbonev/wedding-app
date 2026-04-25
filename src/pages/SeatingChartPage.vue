<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NTabs, NTabPane } from 'naive-ui'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useGuestStore } from '@/stores/useGuestStore'
import { useAppConfigStore } from '@/stores/useAppConfigStore'
import TableCard from '@/components/seating/TableCard.vue'
import AerialTableView from '@/components/seating/AerialTableView.vue'
import UnassignedGuestList from '@/components/seating/UnassignedGuestList.vue'
import PlusOneArcs from '@/components/seating/PlusOneArcs.vue'
import AddTableModal from '@/components/seating/AddTableModal.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

const seatingStore = useSeatingStore()
const guestStore = useGuestStore()
const configStore = useAppConfigStore()

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
        <div style="display: flex; gap: 16px; align-items: flex-start;">
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
              />
            </div>
          </div>
          <UnassignedGuestList :guests="unassigned" />
        </div>
      </n-tab-pane>

      <!-- ── Floor Plan tab ─────────────────────────────────────────────────── -->
      <n-tab-pane name="floorplan" tab="Floor Plan">
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
            <PlusOneArcs v-if="configStore.showPlusOneLines ?? true" />
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
  flex: 1;
}
.seating-canvas {
  flex: 1;
  position: relative;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
</style>
