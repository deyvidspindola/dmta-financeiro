import { http } from '@/api/http';
import type {
  BillImportPreview,
  BillImportSummary,
  CardInvoiceImportPreview,
  CardInvoiceImportSummary,
  StatementImportPreview,
  StatementImportSummary,
} from '@/types/models';

/** Arquivo no formato React Native (uri, name, type) ao invés de File do DOM. */
export interface DocumentPickerAsset {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
}

function appendLines(body: FormData, lines?: number[]): void {
  if (!lines) return;
  for (const line of lines) {
    body.append('lines[]', String(line));
  }
}

/**
 * Converte DocumentPickerAsset num Blob de verdade pro FormData. O SDK
 * 57 trocou o `fetch` global pelo `expo/fetch` (WinterCG) — o FormData
 * dele só aceita `string | Blob | {bytes()}`, não mais o objeto clássico
 * `{uri, name, type}` do React Native puro (rejeitado em runtime com
 * "Unsupported FormDataPart implementation"). Ler a URI local via
 * `fetch` + `.blob()` é o mesmo truque de sempre pra virar Blob de
 * verdade, e continua funcionando com o `fetch` novo.
 */
async function assetToBlob(asset: DocumentPickerAsset): Promise<Blob> {
  const response = await fetch(asset.uri);
  return response.blob();
}

// ────────────────────────────────────────────────────────────────────────────
// Bills (Boletos)
// ────────────────────────────────────────────────────────────────────────────

export async function downloadBillsImportTemplate(contextId: string): Promise<string> {
  // Retorna a URL do template — o app vai baixar via expo-file-system se precisar
  return `/contexts/${contextId}/bills/import/template`;
}

export async function previewBillsCsv(
  contextId: string,
  file: DocumentPickerAsset,
): Promise<BillImportPreview> {
  const body = new FormData();
  body.append('file', await assetToBlob(file), file.name);
  return http.postForm<BillImportPreview>(`/contexts/${contextId}/bills/import/preview`, body);
}

export async function importBillsCsv(
  contextId: string,
  file: DocumentPickerAsset,
  lines?: number[],
): Promise<BillImportSummary> {
  const body = new FormData();
  body.append('file', await assetToBlob(file), file.name);
  appendLines(body, lines);
  return http.postForm<BillImportSummary>(`/contexts/${contextId}/bills/import`, body);
}

// ────────────────────────────────────────────────────────────────────────────
// Statement (Extrato)
// ────────────────────────────────────────────────────────────────────────────

export async function downloadStatementImportTemplate(
  contextId: string,
  accountId: string,
): Promise<string> {
  return `/contexts/${contextId}/accounts/${accountId}/statement-imports/template`;
}

export async function previewStatement(
  contextId: string,
  accountId: string,
  file: DocumentPickerAsset,
  password?: string,
): Promise<StatementImportPreview> {
  const body = new FormData();
  body.append('file', await assetToBlob(file), file.name);
  if (password) body.append('password', password);
  return http.postForm<StatementImportPreview>(
    `/contexts/${contextId}/accounts/${accountId}/statement-imports/preview`,
    body,
  );
}

export async function importStatement(
  contextId: string,
  accountId: string,
  file: DocumentPickerAsset,
  lines?: number[],
  password?: string,
): Promise<StatementImportSummary> {
  const body = new FormData();
  body.append('file', await assetToBlob(file), file.name);
  appendLines(body, lines);
  if (password) body.append('password', password);
  return http.postForm<StatementImportSummary>(
    `/contexts/${contextId}/accounts/${accountId}/statement-imports`,
    body,
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Card Invoice (Fatura de Cartão)
// ────────────────────────────────────────────────────────────────────────────

export async function downloadInvoiceTemplate(
  contextId: string,
  creditCardId: string,
): Promise<string> {
  return `/contexts/${contextId}/credit-cards/${creditCardId}/invoice-import/template`;
}

export async function previewInvoice(
  contextId: string,
  creditCardId: string,
  file: DocumentPickerAsset,
  password?: string,
): Promise<CardInvoiceImportPreview> {
  const body = new FormData();
  body.append('file', await assetToBlob(file), file.name);
  if (password) body.append('password', password);
  return http.postForm<CardInvoiceImportPreview>(
    `/contexts/${contextId}/credit-cards/${creditCardId}/invoice-import/preview`,
    body,
  );
}

export async function importInvoice(
  contextId: string,
  creditCardId: string,
  file: DocumentPickerAsset,
  lines?: number[],
  password?: string,
): Promise<CardInvoiceImportSummary> {
  const body = new FormData();
  body.append('file', await assetToBlob(file), file.name);
  appendLines(body, lines);
  if (password) body.append('password', password);
  return http.postForm<CardInvoiceImportSummary>(
    `/contexts/${contextId}/credit-cards/${creditCardId}/invoice-import`,
    body,
  );
}
