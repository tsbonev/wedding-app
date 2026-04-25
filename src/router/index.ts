import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', component: () => import('@/pages/DashboardPage.vue') },
    { path: '/guests', component: () => import('@/pages/GuestListPage.vue') },
    { path: '/guests/:id', component: () => import('@/pages/GuestDetailPage.vue') },
    { path: '/seating', component: () => import('@/pages/SeatingChartPage.vue') },
    { path: '/meals', component: () => import('@/pages/MealPreferencesPage.vue') },
    { path: '/rooms', component: () => import('@/pages/HotelRoomsPage.vue') },
    { path: '/rooms/:id', component: () => import('@/pages/RoomDetailPage.vue') },
    { path: '/settings', component: () => import('@/pages/SettingsPage.vue') },
    { path: '/export', component: () => import('@/pages/ExportImportPage.vue') },
  ],
})

export default router
