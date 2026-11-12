import { Select, type SelectOption, type SelectProps } from './select'

export type { SelectOption }

export interface SearchableSelectProps
  extends Omit<SelectProps, 'searchable' | 'clearable'> {
  searchable?: boolean | 'auto'
  clearable?: boolean
}

/**
 * Search-enabled preset built directly on the unified {@link Select} component.
 */
export function SearchableSelect({
  searchable = true,
  clearable = true,
  ...props
}: SearchableSelectProps) {
  return <Select searchable={searchable} clearable={clearable} {...props} />
}
