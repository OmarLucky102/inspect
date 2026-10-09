import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/auth-context'
import { getApiErrorMessage } from '@/lib/api'

/** Shared sign-out mutation (header + any future surface). */
export function useLogout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      toast.success('Signed out.')
      void navigate('/login', { replace: true })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Sign out failed.'))
    },
  })

  return mutation
}
