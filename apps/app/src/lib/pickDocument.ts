import * as DocumentPicker from 'expo-document-picker';
import { suspendBiometricLock } from '@/lib/biometricSuspend';

/**
 * No Android, `DocumentPicker.getDocumentAsync` às vezes nunca resolve
 * nem rejeita quando o seletor é fechado de um jeito inesperado
 * (expo/expo#21578) — a tela fica travada em silêncio pra sempre,
 * esperando uma promise que não vem. Depois desse tempo, desiste e
 * rejeita, pra quem chamou poder avisar o usuário e deixar tentar de
 * novo em vez de ficar preso sem feedback nenhum.
 */
const PICK_TIMEOUT_MS = 90_000;

/**
 * Wrapper de `DocumentPicker.getDocumentAsync`: suspende a trava
 * biométrica antes de abrir (o seletor tira o foco do app sem o usuário
 * ter saído de verdade) e aplica o timeout acima.
 */
export async function pickDocument(
  options: DocumentPicker.DocumentPickerOptions,
): Promise<DocumentPicker.DocumentPickerResult> {
  suspendBiometricLock();

  return Promise.race([
    DocumentPicker.getDocumentAsync(options),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('document-picker-timeout')), PICK_TIMEOUT_MS);
    }),
  ]);
}
