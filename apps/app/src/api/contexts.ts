import { http, unwrapData } from '@/api/http';
import { mapContext } from '@/api/mappers';
import type { Context } from '@/types/models';

export async function listContexts(): Promise<Context[]> {
  const payload = await http.get<
    Parameters<typeof mapContext>[0][] | { data: Parameters<typeof mapContext>[0][] }
  >('/contexts');
  return unwrapData(payload).map(mapContext);
}

export type CreateCompanyInput = {
  /** Nome do contexto (ex.: "Minha Empresa") — pode diferir da razão social. */
  name: string;
  companyName: string;
  companyDocument?: string | null;
};

/** Cria a empresa e o contexto PJ juntos — não existe empresa "solta" sem contexto (D-03). */
export async function createCompany(input: CreateCompanyInput): Promise<Context> {
  const payload = await http.post<
    Parameters<typeof mapContext>[0] | { data: Parameters<typeof mapContext>[0] }
  >('/contexts', {
    type: 'company',
    name: input.name,
    company_name: input.companyName,
    company_document: input.companyDocument || undefined,
  });
  return mapContext(unwrapData(payload));
}
