<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NMenu } from 'naive-ui'

const route = useRoute()
const router = useRouter()

const menuOptions = [
  { label: '📊 Dashboard', key: '/dashboard' },
  { label: '👥 Guests', key: '/guests' },
  { label: '🍽️ Meals', key: '/meals' },
  { label: '💺 Seating', key: '/seating' },
  { label: '🏨 Rooms', key: '/rooms' },
  { label: '⚙️ Settings', key: '/settings' },
  { label: '📤 Export / Import', key: '/export' },
]

const activeKey = computed(() => '/' + route.path.split('/')[1])

function handleSelect(key: string) {
  router.push(key)
}
</script>

<template>
  <n-menu
    :value="activeKey"
    :options="menuOptions"
    @update:value="handleSelect"
  />
</template>
