import type { GuestGroup } from '@/types'

export function getGroupColor(
  groupId: string | null | undefined,
  getById: (id: string) => GuestGroup | undefined,
): string | null {
  if (!groupId) return null
  return getById(groupId)?.color ?? null
}
