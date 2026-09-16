import { Platform } from 'react-native';
// SDK 57 trocou expo-file-system pra uma API baseada em `File`/`Directory`
// — `documentDirectory`/`downloadAsync` só existem no subpath `/legacy`
// (mantido pela própria Expo pra esse tipo de migração).
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from '@/api/config';
import { authHeaders } from '@/api/http';

/**
 * Baixa um arquivo autenticado do backend e entrega pro usuário — web
 * usa o mesmo truque do `apps/web` (`blob` + `<a download>`), nativo usa
 * `expo-file-system` (baixa pro sandbox do app) + `expo-sharing` (abre o
 * menu de compartilhar/salvar do sistema, já que apps não têm uma pasta
 * de Downloads própria visível ao usuário).
 */
export async function downloadAndShare(path: string, filename: string): Promise<void> {
  const url = `${API_BASE_URL}${path}`;
  const headers = authHeaders();

  if (Platform.OS === 'web') {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(objectUrl);
    return;
  }

  const dest = `${FileSystem.documentDirectory}${filename}`;
  const result = await FileSystem.downloadAsync(url, dest, { headers });
  if (result.status !== 200) throw new Error(`HTTP ${result.status}`);
  await Sharing.shareAsync(result.uri);
}
