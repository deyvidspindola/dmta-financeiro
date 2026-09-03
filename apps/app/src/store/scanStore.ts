import { create } from 'zustand';

/**
 * Ponte efêmera entre a tela de scanner (`app/scan-boleto`) e o
 * formulário que consome o resultado (hoje: Boletos). O scanner grava
 * `pending` e volta; a tela destino consome no foco e limpa. Não
 * persiste — é só um "carrego isso de volta com você".
 */
export type ScanResult = {
  /** Código de barras do boleto (44 díg.), quando foi um boleto. */
  barcode: string | null;
  /** "Pix Copia e Cola" cru, quando foi um QR PIX. */
  pixCode: string | null;
  description: string | null;
  amount: number | null;
  /** Vencimento ISO `YYYY-MM-DD`. */
  dueDate: string | null;
};

interface ScanState {
  pending: ScanResult | null;
  setResult: (result: ScanResult) => void;
  consume: () => ScanResult | null;
}

export const useScanStore = create<ScanState>((set, get) => ({
  pending: null,
  setResult: (result) => set({ pending: result }),
  consume: () => {
    const { pending } = get();
    if (pending) set({ pending: null });
    return pending;
  },
}));
