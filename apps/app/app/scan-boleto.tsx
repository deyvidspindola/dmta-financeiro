import { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Button, Screen, Text } from '@/components/ui';
import { t } from '@/i18n';
import { parseBoleto } from '@/lib/boleto';
import { parsePixCode } from '@/lib/pixBrCode';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { useScanStore } from '@/store/scanStore';

const BARCODE_TYPES = ['qr', 'code128', 'itf14', 'ean13'] as const;

export default function ScanBoletoScreen() {
  const router = useRouter();
  const sessionRoute = useSessionRoute();
  const [permission, requestPermission] = useCameraPermissions();
  const setResult = useScanStore((s) => s.setResult);
  const handled = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const onScan = useCallback(
    (scan: BarcodeScanningResult) => {
      if (handled.current) return;
      const raw = scan.data?.trim();
      if (!raw) return;

      const pix = parsePixCode(raw);
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
        return;
      }

      const boleto = parseBoleto(raw);
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
        return;
      }

      setError(t.scanBoleto.notRecognized);
    },
    [router, setResult],
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
        barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
        onBarcodeScanned={onScan}
      />
      <View className="absolute inset-x-0 top-0 gap-2 px-5 pb-4 pt-16">
        <Text className="text-center text-base font-semibold text-white">{t.scanBoleto.aim}</Text>
        {error ? <Text className="text-center text-sm text-white/90">{error}</Text> : null}
      </View>
      <View className="absolute inset-x-0 bottom-0 items-center px-5 pb-12">
        <Pressable
          onPress={() => router.back()}
          className="rounded-xl bg-white/15 px-6 py-3 active:bg-white/25"
        >
          <Text className="font-medium text-white">{t.common.cancel}</Text>
        </Pressable>
      </View>
    </View>
  );
}
