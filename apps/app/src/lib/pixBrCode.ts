/**
 * Parser do "PIX Copia e Cola" / QR Code estático ou dinâmico (padrão
 * EMV® MPM do BACEN). Formato TLV: cada campo é `ID`(2) + `tamanho`(2) +
 * `valor`. Campos podem ser aninhados (ex.: 26 = conta PIX).
 */

export type ParsedPix = {
  /** Chave PIX (quando presente no payload estático). */
  key: string | null;
  /** Nome do recebedor (campo 59). */
  merchant: string | null;
  /** Valor em reais (campo 54), ou `null` quando o pagador define. */
  amount: number | null;
  /** Identificador da transação (txid, campo 62.05). */
  txid: string | null;
  /** Payload original — guardado pra referência/dedup. */
  raw: string;
};

type Tlv = Record<string, string>;

function readTlv(payload: string): Tlv {
  const out: Tlv = {};
  let i = 0;
  while (i + 4 <= payload.length) {
    const id = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    if (!Number.isFinite(len)) break;
    const value = payload.slice(i + 4, i + 4 + len);
    if (value.length < len) break;
    out[id] = value;
    i += 4 + len;
  }
  return out;
}

/** `null` se não parece um BR Code PIX. */
export function parsePixCode(raw: string): ParsedPix | null {
  const payload = raw.trim();
  // BR Code começa com "000201" (payload format indicator = 01).
  if (!/^000201/.test(payload) || !/(BR\.GOV\.BCB\.PIX|br\.gov\.bcb\.pix)/.test(payload)) {
    return null;
  }

  const root = readTlv(payload);

  let key: string | null = null;
  for (const id of ['26', '27', '28', '29', '30', '31']) {
    if (!root[id]) continue;
    const nested = readTlv(root[id]);
    if (nested['00']?.toLowerCase() === 'br.gov.bcb.pix' && nested['01']) {
      key = nested['01'];
      break;
    }
  }

  const amountRaw = root['54'];
  const amount = amountRaw && Number.isFinite(Number(amountRaw)) ? Number(amountRaw) : null;

  const additional = root['62'] ? readTlv(root['62']) : {};

  return {
    key,
    merchant: root['59']?.trim() || null,
    amount: amount && amount > 0 ? amount : null,
    txid: additional['05']?.trim() || null,
    raw: payload,
  };
}
