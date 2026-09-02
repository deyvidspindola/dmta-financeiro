const { withGradleProperties } = require('expo/config-plugins');

/**
 * Enxuga o APK/instalado do Android compilando só para `arm64-v8a` (a ABI
 * de celular moderno), em vez das 4 do build universal (arm64, armv7,
 * x86, x86_64). É o maior corte de tamanho — as libs nativas (Hermes,
 * Reanimated, gesture-handler...) param de ser empacotadas 4×.
 *
 * Trade-off: o APK não roda em emulador x86 nem em aparelho 32-bit
 * (inexistente na prática desde ~2019). Muda o fingerprint do runtime
 * (`runtimeVersion: fingerprint`), então o primeiro build depois disso
 * precisa ser instalado na mão; os OTA seguintes normalizam.
 *
 * NÃO liga Proguard/R8 nem shrink de recursos — o minify em release quebra
 * builds RN sem um conjunto cuidadoso de keep-rules; o ganho extra não
 * compensa o risco. Se algum dia for necessário, fazer via
 * `expo-build-properties` com teste de build dedicado.
 *
 * @param {import('expo/config').ExpoConfig} config
 */
module.exports = function withAndroidLeanApk(config) {
  return withGradleProperties(config, (cfg) => {
    const key = 'reactNativeArchitectures';

    cfg.modResults = cfg.modResults.filter(
      (item) => !(item.type === 'property' && item.key === key),
    );
    cfg.modResults.push({ type: 'property', key, value: 'arm64-v8a' });

    return cfg;
  });
};
