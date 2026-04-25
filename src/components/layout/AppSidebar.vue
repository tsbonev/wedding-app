<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NMenu } from 'naive-ui'
import type { MenuOption } from 'naive-ui'

const route = useRoute()
const router = useRouter()

const menuOptions: MenuOption[] = [
  { label: 'Dashboard', key: '/dashboard', icon: () => h('span', '📊') },
  { label: 'Guests', key: '/guests', icon: () => h('span', '👥') },
  { label: 'Meals', key: '/meals', icon: () => h('span', '🍽️') },
  { label: 'Seating', key: '/seating', icon: () => h('span', '🪑') },
  { label: 'Rooms', key: '/rooms', icon: () => h('span', '🏨') },
  { label: 'Settings', key: '/settings', icon: () => h('span', '⚙️') },
  { label: 'Export / Import', key: '/export', icon: () => h('span', '📤') },
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
