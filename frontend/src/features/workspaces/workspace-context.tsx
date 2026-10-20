import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchCurrentWorkspaceUser,
  fetchMyBanks,
  parseJwt,
  type UserProfile,
  type WorkspaceBank,
} from './api'
import { useAuth } from '@/features/auth/auth-context'
import { getAccessToken } from '@/lib/api'

interface WorkspaceContextValue {
  user: UserProfile | null
  banks: WorkspaceBank[]
  activeBankId: string | null
  setActiveBankId: (id: string | null) => void
  isLoading: boolean
  refreshUser: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

const STORAGE_KEY = 'inspect_active_bank_id'

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [banks, setBanks] = useState<WorkspaceBank[]>([])
  const [activeBankId, setActiveBankIdState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY)
  })
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const updated = await fetchCurrentWorkspaceUser()
      setUser(updated)
    } catch (err) {
      console.error('Failed to refresh workspace user', err)
    }
  }, [])

  const setActiveBankId = useCallback((id: string | null) => {
    setActiveBankIdState(id)
    if (id) {
      localStorage.setItem(STORAGE_KEY, id)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    if (status === 'authenticated') {
      setIsLoading(true)

      Promise.allSettled([fetchCurrentWorkspaceUser(), fetchMyBanks()]).then(
        ([userResult, banksResult]) => {
          if (cancelled) return

          // 1. Resolve User
          if (userResult.status === 'fulfilled') {
            setUser(userResult.value)
          } else {
            // Fallback to JWT payload if user endpoint fails
            const token = getAccessToken()
            const payload = token ? parseJwt(token) : null
            if (payload) {
              setUser({
                id: payload.sub,
                email: payload.email,
                firstName: '',
                lastName: '',
                role: payload.role,
                status: 'ACTIVE',
                createdAt: '',
                updatedAt: '',
              })
            } else {
              setUser(null)
            }
          }

          // 2. Resolve Banks
          if (banksResult.status === 'fulfilled') {
            const bankList = banksResult.value
            setBanks(bankList)

            if (bankList.length > 0) {
              const savedId = localStorage.getItem(STORAGE_KEY)
              const hasSaved = savedId && bankList.some((b) => b.id === savedId)
              const chosenId = hasSaved ? savedId : bankList[0].id
              setActiveBankIdState(chosenId)
              localStorage.setItem(STORAGE_KEY, chosenId)
            } else {
              setActiveBankIdState(null)
              localStorage.removeItem(STORAGE_KEY)
            }
          } else {
            setBanks([])
            setActiveBankIdState(null)
          }

          setIsLoading(false)
        },
      )
    } else if (status === 'unauthenticated') {
      setUser(null)
      setBanks([])
      setActiveBankIdState(null)
      localStorage.removeItem(STORAGE_KEY)
      setIsLoading(false)
    }

    return () => {
      cancelled = true
    }
  }, [status])

  return (
    <WorkspaceContext.Provider
      value={{
        user,
        banks,
        activeBankId,
        setActiveBankId,
        isLoading,
        refreshUser,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
