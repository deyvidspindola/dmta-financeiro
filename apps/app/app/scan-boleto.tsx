import { useCallback, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { Button, Screen, Text } from '@/components/ui';
import { t } from '@/i18n';
import { parseBoleto } from '@/lib/boleto';
import { parsePixCode } from '@/lib/pixBrCode';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { useScanStore } from '@/store/scanStore';

/**
 * Boleto usa código de barras ITF (2 de 5 intercalado, 44 dígitos) —
 * `itf14` cobre isso no MLKit/AVFoundation. Os demais tipos cobrem o QR
 * do PIX e variações de código impresso. `autofocus="on"` é essencial:
 * sem foco o código longo e fino do boleto nunca resolve.
 */
const BARCODE_TYPES = ['qr', 'code128', 'itf14', 'ean13', 'pdf417', 'code39'] as const;

export default function ScanBoletoScreen() {
  const router = useRouter();
  const sessionRoute = useSessionRoute();
  const [permission, requestPermission] = useCameraPermissions();
  const setResult = useScanStore((s) => s.setResult);
  const handled = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState('');

  const accept = useCallback(
    (raw: string): boolean => {
      const value = raw.trim();
      if (!value) return false;

      const pix = parsePixCode(value);
      if (pix) {
        handled.current = true;
        setResult({
          barcode: null,
          pixCode: pix.raw,
          description: pix.merchant,
          amount: pix.amount,
          dueDate: null,
        });
        router.back();
        return true;
      }

      const boleto = parseBoleto(value);
      if (boleto) {
        handled.current = true;
        setResult({
          barcode: boleto.barcode,
          pixCode: null,
          description: null,
          amount: boleto.amount,
          dueDate: boleto.dueDate,
        });
        router.back();
        return true;
      }

      return false;
    },
    [router, setResult],
  );

  const onScan = useCallback(
    (scan: BarcodeScanningResult) => {
      if (handled.current) return;
      const raw = scan.data?.trim();
      if (!raw) return;
      if (!accept(raw)) setError(t.scanBoleto.notRecognized);
    },
    [accept],
  );

  if (sessionRoute !== '/(tabs)') return <Redirect href={sessionRoute} />;

  if (!permission) {
    return (
      <Screen>
        <Text variant="muted">{t.common.loading}</Text>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <View className="flex-1 justify-center gap-4">
          <Text variant="title">{t.scanBoleto.title}</Text>
          <Text variant="muted">{t.scanBoleto.permissionHint}</Text>
          <Button label={t.scanBoleto.grant} onPress={() => void requestPermission()} />
          <Button label={t.common.close} variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        autofocus="on"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
        onBarcodeScanned={onScan}
      />

      <View className="absolute inset-x-0 top-0 gap-1 px-5 pb-4 pt-16">
        <Text className="text-center text-base font-semibold text-white">{t.scanBoleto.aim}</Text>
        <Text className="text-center text-xs text-white/70">{t.scanBoleto.aimHint}</Text>
        {error ? <Text className="text-center text-sm text-white/90">{error}</Text> : null}
      </View>

      <View className="absolute inset-x-0 bottom-0 gap-3 px-5 pb-12">
        {manualOpen ? (
          <View className="gap-2 rounded-2xl bg-black/70 p-3">
            <TextInput
              value={manual}
              onChangeText={(v) => {
                setManual(v);
                setError(null);
              }}
              placeholder={t.scanBoleto.typePlaceholder}
              placeholderTextColor="#9aa8a3"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              multiline
              className="min-h-12 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-base text-white"
            />
            <Button
              label={t.scanBoleto.typeSubmit}
              onPress={() => {
                if (!accept(manual)) setError(t.scanBoleto.typeInvalid);
              }}
            />
          </View>
        ) : null}

        <View className="flex-row items-center justify-center gap-3">
          <Pressable
            onPress={() => setTorch((v) => !v)}
            className={`flex-row items-center gap-1.5 rounded-xl px-4 py-3 ${
              torch ? 'bg-white' : 'bg-white/15'
            } active:opacity-80`}
          >
            <Feather name="zap" size={16} color={torch ? '#000' : '#fff'} />
            <Text className={torch ? 'font-medium text-black' : 'font-medium text-white'}>
              {t.scanBoleto.torch}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setManualOpen((v) => !v)}
            className="rounded-xl bg-white/15 px-4 py-3 active:bg-white/25"
          >
            <Text className="font-medium text-white">{t.scanBoleto.typeInstead}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            className="rounded-xl bg-white/15 px-4 py-3 active:bg-white/25"
          >
            <Text className="font-medium text-white">{t.common.cancel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
