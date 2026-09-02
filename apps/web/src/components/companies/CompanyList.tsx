import { Card } from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import type { Context } from '@/types/models'

type CompanyListProps = {
  companies: Context[]
}

export function CompanyList({ companies }: CompanyListProps) {
  const t = strings.companies

  if (companies.length === 0) {
    return (
      <p className="text-sm text-fg-muted">{t.empty}</p>
    )
  }

  return (
    <div className="grid gap-3">
      {companies.map((ctx) => (
        <Card key={ctx.id} className="p-4">
          <p className="font-display font-semibold text-fg">{ctx.name}</p>
          {ctx.company ? (
            <p className="mt-1 text-sm text-fg-muted">
              {ctx.company.name}
              {ctx.company.document
                ? ` · CNPJ ${ctx.company.document}`
                : null}
            </p>
          ) : null}
        </Card>
      ))}
    </div>
  )
}
