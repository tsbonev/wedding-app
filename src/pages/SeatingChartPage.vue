<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NSpace, NText } from 'naive-ui'
import { useSeatingStore } from '@/stores/useSeatingStore'
import { useGuestStore } from '@/stores/useGuestStore'
import TableCard from '@/components/seating/TableCard.vue'
import UnassignedGuestList from '@/components/seating/UnassignedGuestList.vue'
import AddTableModal from '@/components/seating/AddTableModal.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

const seatingStore = useSeatingStore()
const guestStore = useGuestStore()
const showAddModal = ref(false)

const unassigned = computed(() => guestStore.unassignedGuests)
</script>

<template>
  <div>
    <n-space justify="space-between" align="center" style="margin-bottom: 16px;">
      <h2 style="margin: 0;">Seating Chart</h2>
      <n-button type="primary" @click="showAddModal = true">+ Add Table</n-button>
    </n-space>

    <n-text depth="3" style="font-size: 12px; display: block; margin-bottom: 12px;">
      Drag guests from the right panel onto seats. Drag table cards to reposition.
    </n-text>

    <div style="display: flex; gap: 16px; align-items: flex-start;">
      <!-- canvas -->
      <div
        class="seating-canvas"
        :style="{ minHeight: seatingStore.tables.length ? '600px' : '200px' }"
      >
        <EmptyState
          v-if="seatingStore.tables.length === 0"
          icon="💺"
          title="No tables yet"
          description="Click 'Add Table' to start laying out your seating."
        />
        <TableCard
          v-for="table in seatingStore.tables"
          :key="table.id"
          :table="table"
          :unassigned-guests="unassigned"
          @delete="seatingStore.deleteTable($event)"
        />
      </div>

      <!-- unassigned sidebar -->
      <UnassignedGuestList :guests="unassigned" />
    </div>

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
  overflow: hidden;
}
</style>
