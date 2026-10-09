import type { Icon } from '@phosphor-icons/react'
import {
  Bank,
  ClipboardText,
  ListChecks,
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
// organization (banks), identity (users).
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
      { label: 'Checklists', to: '/checklists', icon: ListChecks },
      { label: 'Banks', to: '/banks', icon: Bank },
    ],
  },
  {
    title: 'System',
    items: [{ label: 'Users', to: '/users', icon: UsersThree }],
  },
]
