import type { Icon } from '@phosphor-icons/react'
import {
  Bank,
  Car,
  ClipboardText,
  IdentificationBadge,
  Palette,
  Shapes,
  SlidersHorizontal,
  SquaresFour,
  Sun,
  UsersThree,
} from '@phosphor-icons/react'

export interface NavSubItem {
  labelKey: string
  defaultLabel: string
  to: string
  icon: Icon
}

export interface NavItem {
  label: string
  to: string
  icon: Icon
  end?: boolean
  children?: NavSubItem[]
}

export interface NavSection {
  title: string
  items: NavItem[]
}

// Maps to backend domains: inspection (requests/checklists/representatives),
// organization (banks), identity (users), vehicle (lookups/settings).
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operate',
    items: [
      { label: 'Dashboard', to: '/', icon: SquaresFour, end: true },
      { label: 'Requests', to: '/requests', icon: ClipboardText },
      { label: 'Representatives', to: '/representatives', icon: IdentificationBadge },
    ],
  },
  {
    title: 'Configure',
    items: [
      { label: 'Banks', to: '/banks', icon: Bank },
      {
        label: 'Vehicle Settings',
        to: '/vehicle-settings',
        icon: Car,
        children: [
          {
            labelKey: 'vehicleSettings.makesAndModels',
            defaultLabel: 'Makes & Models',
            to: '/vehicle-settings/makes',
            icon: Car,
          },
          {
            labelKey: 'vehicleSettings.trims',
            defaultLabel: 'Vehicle Trims',
            to: '/vehicle-settings/trims',
            icon: SlidersHorizontal,
          },
          {
            labelKey: 'vehicleSettings.categories',
            defaultLabel: 'Categories',
            to: '/vehicle-settings/categories',
            icon: Shapes,
          },
          {
            labelKey: 'vehicleSettings.sunroofs',
            defaultLabel: 'Sunroof Specs',
            to: '/vehicle-settings/sunroofs',
            icon: Sun,
          },
          {
            labelKey: 'vehicleSettings.colorPalette',
            defaultLabel: 'Color Palette',
            to: '/vehicle-settings/colors',
            icon: Palette,
          },
        ],
      },
    ],
  },
  {
    title: 'System',
    items: [{ label: 'Users', to: '/users', icon: UsersThree }],
  },
]
