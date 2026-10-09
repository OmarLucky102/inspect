import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchCurrentWorkspaceUser, fetchMyBanks, type UserProfile, type WorkspaceBank } from './api'
import { useAuth } from '@/features/auth/auth-context'

interface WorkspaceContextValue {
  user: UserProfile | null
  banks: WorkspaceBank[]
  activeBankId: string | null
  setActiveBankId: (id: string | null) => void
  isLoading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [banks, setBanks] = useState<WorkspaceBank[]>([])
  const [activeBankId, setActiveBankId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (status === 'authenticated') {
      setIsLoading(true)
      Promise.all([fetchCurrentWorkspaceUser(), fetchMyBanks()])
        .then(([profile, bankList]) => {
          if (!cancelled) {
            setUser(profile)
            setBanks(bankList)
            // If user has banks, auto-select the first one if none selected
            if (bankList.length > 0 && !activeBankId) {
              setActiveBankId(bankList[0].id)
            }
            setIsLoading(false)
          }
        })
        .catch(() => {
          if (!cancelled) {
            setUser(null)
            setBanks([])
            setIsLoading(false)
          }
        })
    } else if (status === 'unauthenticated') {
      setUser(null)
      setBanks([])
      setActiveBankId(null)
      setIsLoading(false)
    }
    return () => {
      cancelled = true
    }
  }, [status])

  return (
    <WorkspaceContext.Provider value={{ user, banks, activeBankId, setActiveBankId, isLoading }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
