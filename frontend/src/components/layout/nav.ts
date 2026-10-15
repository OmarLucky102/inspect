import type { Icon } from '@phosphor-icons/react'
import {
  Bank,
  Car,
  ClipboardText,
  SquaresFour,
  UsersThree,
} from '@phosphor-icons/react'

export interface NavItem {
  label: string
  to: string
  icon: Icon
  end?: boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

// Maps to backend domains: inspection (requests/checklists),
// organization (banks), identity (users), vehicle (lookups/settings).
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operate',
    items: [
      { label: 'Dashboard', to: '/', icon: SquaresFour, end: true },
      { label: 'Requests', to: '/requests', icon: ClipboardText },
    ],
  },
  {
    title: 'Configure',
    items: [
      { label: 'Banks', to: '/banks', icon: Bank },
      { label: 'Vehicle Settings', to: '/vehicle-settings', icon: Car },
    ],
  },
  {
    title: 'System',
    items: [{ label: 'Users', to: '/users', icon: UsersThree }],
  },
]
