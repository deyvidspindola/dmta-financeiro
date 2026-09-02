import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contextsApi } from '@/api'
import { CompanyForm } from '@/components/companies/CompanyForm'
import { CompanyList } from '@/components/companies/CompanyList'
import type { CompanyFormValues } from '@/components/companies/schemas'
import { Button, Modal, PageHeader } from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/authStore'
import { toastSuccess } from '@/store/toastStore'

const t = strings.companies

export function CompaniesPage() {
  const queryClient = useQueryClient()
  const setContexts = useAuthStore((s) => s.setContexts)
  const setActiveScope = useAuthStore((s) => s.setActiveScope)
  const contexts = useAuthStore((s) => s.contexts)
  const [open, setOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: (values: CompanyFormValues) =>
      contextsApi.createCompanyContext({
        name: values.name,
        company_name: values.company_name,
        company_document: values.company_document?.replace(/\D/g, '') || null,
      }),
    onSuccess: async (created) => {
      const next = await contextsApi.listContexts()
      setContexts(next)
      setActiveScope(created.id)
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(t.created)
      setOpen(false)
    },
  })

  const companies = contexts.filter((c) => c.type === 'pj')

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader
        title={t.title}
        description={t.hint}
        actions={
          <Button onClick={() => setOpen(true)}>{t.create}</Button>
        }
      />

      <CompanyList companies={companies} />

      {open ? (
        <Modal title={t.create} onClose={() => setOpen(false)}>
          <CompanyForm
            isPending={mutation.isPending}
            error={
              mutation.isError ? getErrorMessage(mutation.error) : null
            }
            onCancel={() => setOpen(false)}
            onSubmit={(values) => mutation.mutate(values)}
          />
        </Modal>
      ) : null}
    </div>
  )
}
