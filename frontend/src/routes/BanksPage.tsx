import { Bank as BankIcon, CircleNotch, WarningCircle, X, Plus } from '@phosphor-icons/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModuleEmptyState } from '@/components/layout/ModuleEmptyState'
import { fetchBanks, createBank, type CreateBankDto } from '@/features/banks/api'
import { useWorkspace } from '@/features/workspaces/workspace-context'
import { Button } from '@/components/ui/button'
import { BankDetails } from '@/features/banks/components/BankDetails'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api'

function getSuggestedBankCode(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ''
  const stopWords = new Set([
    'AND', '&', 'THE', 'OF', 'FOR', 'DE', 'DU', 'EL', 'AL',
    'BANK', 'BANQUE', 'بنك', 'مصرف',
  ])
  const tokens = trimmed.split(/[\s\-_,.]+/).filter(Boolean)
  const latinTokens = tokens
    .filter(t => /^[a-zA-Z0-9]+$/.test(t))
    .filter(t => !stopWords.has(t.toUpperCase()))

  if (latinTokens.length >= 2) {
    return latinTokens.map(t => t[0].toUpperCase()).join('').slice(0, 8)
  }
  if (latinTokens.length === 1) {
    return latinTokens[0].toUpperCase().slice(0, 6)
  }
  const anyLatin = trimmed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  if (anyLatin.length >= 2) {
    return anyLatin.slice(0, 6)
  }
  return ''
}

export function BanksPage() {
  const { t } = useTranslation()
  const { user, activeBankId } = useWorkspace()
  const queryClient = useQueryClient()
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
  const [formData, setFormData] = useState<CreateBankDto>({ name: '', code: '', email: '', phone: '' })
  const [isCodeManual, setIsCodeManual] = useState(false)

  const handleNameChange = (name: string) => {
    if (!isCodeManual) {
      const suggested = getSuggestedBankCode(name)
      setFormData(prev => ({ ...prev, name, code: suggested }))
    } else {
      setFormData(prev => ({ ...prev, name }))
    }
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['banks'],
    queryFn: fetchBanks,
    enabled: user?.role === 'SUPER_ADMIN',
  })

  const createMutation = useMutation({
    mutationFn: createBank,
    onSuccess: () => {
      toast.success(t('banks.createSuccess', 'Bank created successfully'))
      queryClient.invalidateQueries({ queryKey: ['banks'] })
      setIsCreating(false)
      setFormData({ name: '', code: '', email: '', phone: '' })
      setIsCodeManual(false)
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, t('banks.createError', 'Failed to create bank')))
    }
  })

  if (user?.role !== 'SUPER_ADMIN') {
    if (!activeBankId) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-ink-mute">
          <WarningCircle className="size-12 mb-4 text-red-500" />
          <p>{t('requests.selectBankFirst', 'You do not belong to any bank workspace.')}</p>
        </div>
      )
    }

    return (
      <div className="max-w-4xl mx-auto">
        <BankDetails bankId={activeBankId} onClose={() => {}} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <CircleNotch className="size-8 animate-spin text-ink-mute" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500 mb-4">{t('banks.banksLoadError', 'Failed to load banks.')}</p>
        <button onClick={() => refetch()} className="text-sm font-medium underline cursor-pointer">
          {t('common.retry', 'Try again')}
        </button>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <ModuleEmptyState
        kicker={t('titles.banksMeta', 'ORGANIZATION · WORKSPACES')}
        title={t('banks.title', 'Bank workspaces and memberships.')}
        body={t('banks.subtitle', 'Banks, membership roles and inspection scopes will live here, backed by the organization module and bank-membership guard.')}
        icon={BankIcon}
        actionLabel={t('banks.newBank', 'New Bank')}
        onAction={() => setIsCreating(true)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-hairline bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-hairline bg-paper/50 flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-ink">{t('banks.title', 'Banks (Workspaces)')}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-ink-mute bg-bone px-2 py-1 rounded">
              {data.length} {t('banks.total', 'TOTAL')}
            </span>
            <Button size="sm" onClick={() => setIsCreating(true)} className="gap-1.5 cursor-pointer">
              <Plus className="size-4" /> {t('banks.newBank', 'New Bank')}
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-bone text-ink-mute font-medium border-b border-hairline">
              <tr>
                <th className="px-5 py-3 text-start">{t('banks.thCode', 'Code')}</th>
                <th className="px-5 py-3 text-start">{t('banks.thName', 'Name')}</th>
                <th className="px-5 py-3 text-start">{t('banks.thContact', 'Contact')}</th>
                <th className="px-5 py-3 text-end">{t('banks.thActions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {data.map((b) => (
                <tr key={b.id} className="hover:bg-paper/50 transition-colors">
                  <td className="px-5 py-3 font-mono font-medium text-ink">{b.code}</td>
                  <td className="px-5 py-3 text-ink">{b.name}</td>
                  <td className="px-5 py-3 text-ink-soft">
                    {b.email || b.phone || '—'}
                  </td>
                  <td className="px-5 py-3 text-end">
                    <Button variant="outline" size="sm" onClick={() => setSelectedBankId(b.id)} className="cursor-pointer text-xs">
                      {t('banks.manage', 'Manage')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isCreating && (
        <div className="rounded-xl border border-hairline bg-white shadow-sm overflow-hidden relative p-6">
          <button 
            className="absolute top-4 end-4 text-ink-mute hover:text-ink cursor-pointer modal-close"
            onClick={() => setIsCreating(false)}
          >
            <X className="size-5" />
          </button>
          <h3 className="font-semibold text-lg mb-4">{t('banks.createModalTitle', 'Create New Bank Workspace')}</h3>
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              const payload: CreateBankDto = { name: formData.name.trim() }
              if (formData.code?.trim()) payload.code = formData.code.trim().toUpperCase()
              if (formData.email?.trim()) payload.email = formData.email.trim()
              if (formData.phone?.trim()) payload.phone = formData.phone.trim()
              createMutation.mutate(payload)
            }}
            className="space-y-4 max-w-md"
          >
            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">{t('banks.nameLabel', 'Bank Name *')}</label>
              <input 
                required
                className="w-full rounded-md border border-hairline px-3 py-2 text-sm"
                value={formData.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder={t('banks.namePlaceholder', 'e.g. Commercial International Bank')}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-ink-mute">
                  {t('banks.codeLabel', 'Bank Code (Workspace Identifier)')}
                </label>
                <span className="text-[10px] text-ink-mute bg-bone px-1.5 py-0.5 rounded">
                  {formData.code ? t('banks.codeAutoFilled', 'Auto-generated') : t('banks.codeAutoBlank', 'Auto-generated if left blank')}
                </span>
              </div>
              <input 
                className="w-full rounded-md border border-hairline px-3 py-2 text-sm ltr-force text-start font-mono"
                dir="ltr"
                value={formData.code || ''}
                onChange={e => {
                  setIsCodeManual(true)
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }}
                placeholder={t('banks.codePlaceholderAuto', 'Auto-generated (e.g. CIB / BNK-001)')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">{t('banks.emailLabel', 'Contact Email')}</label>
              <input 
                type="email"
                dir="ltr"
                className="w-full rounded-md border border-hairline px-3 py-2 text-sm ltr-force text-start"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('banks.emailPlaceholder', 'e.g. bank@example.com')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">{t('banks.phoneLabel', 'Phone Number')}</label>
              <input 
                dir="ltr"
                className="w-full rounded-md border border-hairline px-3 py-2 text-sm ltr-force text-start"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t('banks.phonePlaceholder', 'e.g. 0212345678')}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="cursor-pointer">
                {createMutation.isPending ? t('common.loading', 'Creating...') : t('banks.createButton', 'Create Bank Workspace')}
              </Button>
            </div>
          </form>
        </div>
      )}

      {selectedBankId && (
        <BankDetails 
          bankId={selectedBankId} 
          onClose={() => setSelectedBankId(null)} 
        />
      )}
    </div>
  )
}
