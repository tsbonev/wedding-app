import { computed, h } from 'vue'
import type { Ref } from 'vue'
import { NSpace, NTag, NTooltip } from 'naive-ui'
import type { DataTableRowKey, DropdownOption } from 'naive-ui'
import { useGuestStore } from '@/stores/useGuestStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useMenuStore } from '@/stores/useMenuStore'
import { useI18nStore } from '@/stores/useI18nStore'
import type { RSVPStatus } from '@/types'

export function useMassEdit(checkedRowKeys: Ref<DataTableRowKey[]>) {
  const guestStore = useGuestStore()
  const groupStore = useGroupStore()
  const menuStore = useMenuStore()
  const i18n = useI18nStore()

  const massEditOptions = computed(() => [
    {
      label: i18n.t('rsvp_status'),
      key: 'rsvp',
      children: [
        { label: i18n.t('confirmed'), key: 'rsvp-confirmed' },
        { label: i18n.t('pending'), key: 'rsvp-pending' },
        { label: i18n.t('declined'), key: 'rsvp-declined' },
      ],
    },
    {
      label: i18n.t('group'),
      key: 'group',
      children: [
        { label: `— ${i18n.t('none')} —`, key: 'group-none' },
        ...groupStore.groups.map(g => ({ label: g.name, key: `group-${g.id}`, color: g.color })),
      ],
    },
    {
      label: i18n.t('selected_menu'),
      key: 'menu',
      children: [
        { label: `— ${i18n.t('none')} —`, key: 'menu-none' },
        ...menuStore.menuOptions.map(o => ({ label: `${o.emoji} ${o.label}`, key: `menu-${o.id}` })),
      ],
    },
  ])

  function renderMassEditLabel(option: DropdownOption) {
    if (String(option.key).startsWith('group-') && option.color) {
      const content = h(NSpace, { align: 'center', size: 'small', style: 'flex-wrap:nowrap;overflow:hidden' }, {
        default: () => [
          h(NTag, {
            color: { color: String(option.color), textColor: '#fff' },
            bordered: false,
            size: 'small',
            style: 'width:12px;height:12px;padding:0;border-radius:50%;flex-shrink:0',
          }),
          h('span', { style: 'text-overflow:ellipsis;overflow:hidden;white-space:nowrap' }, String(option.label)),
        ],
      })
      return h(NTooltip, { trigger: 'hover', placement: 'right' }, {
        trigger: () => content,
        default: () => String(option.label),
      })
    }
    return String(option.label)
  }

  function handleMassEdit(key: string) {
    const ids = checkedRowKeys.value as string[]
    if (ids.length === 0) return

    if (key.startsWith('rsvp-')) {
      guestStore.bulkUpdateGuests(ids, { rsvpStatus: key.replace('rsvp-', '') as RSVPStatus })
    } else if (key.startsWith('group-')) {
      const groupId = key.replace('group-', '')
      guestStore.bulkUpdateGuests(ids, { groupId: groupId === 'none' ? null : groupId })
    } else if (key.startsWith('menu-')) {
      const mealId = key.replace('menu-', '')
      guestStore.bulkUpdateGuests(ids, { mealChoiceId: mealId === 'none' ? null : mealId })
    }
    checkedRowKeys.value = []
  }

  return { massEditOptions, renderMassEditLabel, handleMassEdit }
}
