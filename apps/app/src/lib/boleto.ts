/**
 * Leitura de boleto: código de barras (44 dígitos) ou linha digitável
 * (47 dígitos p/ boleto bancário, 48 p/ arrecadação/concessionária).
 * Extrai valor e vencimento quando dá — o resto (beneficiário) fica pro
 * usuário completar no formulário.
 */

export type ParsedBoleto = {
  /** Código de barras normalizado (44 dígitos) — vai pro campo `barcode`. */
  barcode: string;
  /** Valor em reais, ou `null` quando o boleto é "valor a definir". */
  amount: number | null;
  /** Vencimento ISO `YYYY-MM-DD`, ou `null` (arrecadação nem sempre tem). */
  dueDate: string | null;
};

/** 07/10/1997 — base do fator de vencimento FEBRABAN. */
const FACTOR_BASE = Date.UTC(1997, 9, 7);
const DAY_MS = 86_400_000;
/**
 * Em 22/02/2025 o fator estourou 9999 e voltou pra 1000. A FEBRABAN
 * definiu que o novo "1000" continua a contagem como se fosse 10000 —
 * ou seja, fator do novo ciclo = fator + 9000 dias sobre a base.
 */
const FACTOR_NEW_CYCLE_OFFSET = 9000;

function onlyDigits(raw: string): string {
  return raw.replace(/\D+/g, '');
}

function dueDateFromFactor(factor: number, now: number = Date.now()): string | null {
  if (factor <= 0) return null;
  // O mesmo fator de 4 dígitos serve pro ciclo antigo e pro novo. Um
  // boleto que se escaneia está vencendo perto de hoje (atrasado ou a
  // vencer) — então fica com a interpretação mais próxima de agora, em
  // vez de assumir cegamente um dos ciclos por um corte de data fixo
  // (que datava errado todo boleto atrasado de antes de 22/02/2025).
  const oldCycle = FACTOR_BASE + factor * DAY_MS;
  const newCycle = FACTOR_BASE + (factor + FACTOR_NEW_CYCLE_OFFSET) * DAY_MS;
  const ms =
    Math.abs(oldCycle - now) <= Math.abs(newCycle - now) ? oldCycle : newCycle;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate(),
  ).padStart(2, '0')}`;
}

function amountFromCents(digits: string): number | null {
  const cents = Number(digits);
  if (!Number.isFinite(cents) || cents === 0) return null;
  return cents / 100;
}

/** Linha digitável de boleto bancário (47) → código de barras (44). */
function bankLineToBarcode(line: string): string {
  const field1 = line.slice(0, 9);
  const field2 = line.slice(10, 20);
  const field3 = line.slice(21, 31);
  const dvGeral = line.slice(32, 33);
  const factorValue = line.slice(33, 47);
  return field1.slice(0, 4) + dvGeral + factorValue + field1.slice(4, 9) + field2 + field3;
}

/** Linha digitável de arrecadação (48) → código de barras (44): tira o DV de cada bloco de 12. */
function collectionLineToBarcode(line: string): string {
  let barcode = '';
  for (let i = 0; i < 4; i++) {
    barcode += line.slice(i * 12, i * 12 + 11);
  }
  return barcode;
}

function parseBankBarcode(barcode: string): ParsedBoleto {
  return {
    barcode,
    dueDate: dueDateFromFactor(Number(barcode.slice(5, 9))),
    amount: amountFromCents(barcode.slice(9, 19)),
  };
}

function parseCollectionBarcode(barcode: string): ParsedBoleto {
  // Identificador de valor efetivo na posição 2: 6/7 = valor em reais (10 dígitos, pos 4-14).
  return {
    barcode,
    dueDate: null,
    amount: amountFromCents(barcode.slice(4, 15)),
  };
}

/** Interpreta o que veio do scanner (barra ou linha digitável). `null` se não parece boleto. */
export function parseBoleto(raw: string): ParsedBoleto | null {
  const digits = onlyDigits(raw);

  if (digits.length === 44) {
    return digits.startsWith('8') ? parseCollectionBarcode(digits) : parseBankBarcode(digits);
  }
  if (digits.length === 47) {
    return parseBankBarcode(bankLineToBarcode(digits));
  }
  if (digits.length === 48) {
    return parseCollectionBarcode(collectionLineToBarcode(digits));
  }
  return null;
}
