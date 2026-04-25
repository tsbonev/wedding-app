<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NTabs, NTabPane, NRadioGroup, NRadioButton, NSwitch } from 'naive-ui'
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

const activeTab = ref<'tables' | 'floorplan'>('tables')
const showAddModal = ref(false)

const unassigned = computed(() => guestStore.unassignedGuests)
const sortedTables = computed(() =>
  [...seatingStore.tables].sort((a, b) => a.name.localeCompare(b.name))
)

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
                @edit-guest="handleEditGuest"
              />
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
          </div>
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
                @edit-guest="handleEditGuest"
              />
              <RelationArcs />
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
.seating-canvas {
  flex: 1;
  position: relative;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
</style>
