const { withGradleProperties } = require('expo/config-plugins');

/**
 * Enxuga o APK/instalado do Android.
 *
 * - `reactNativeArchitectures=arm64-v8a`: só a ABI de celular moderno, em
 *   vez das 4 do build universal (arm64, armv7, x86, x86_64). É o maior
 *   corte — as libs nativas (Hermes, Reanimated, gesture-handler...) param
 *   de ser empacotadas 4×. Trade-off: o APK não roda em emulador x86 nem
 *   em aparelho 32-bit (inexistente na prática desde ~2019). **Só é
 *   aplicado em build da EAS** (`EAS_BUILD`): num `expo run:android` local
 *   as 4 ABIs continuam, senão o app não sobe no emulador x86_64.
 * - Minify (R8) + shrink de recursos no release: tira código/asset morto.
 *   O shrink de recursos exige o minify ligado — no SDK 57 a flag do
 *   minify virou `android.enableMinifyInReleaseBuilds` (era
 *   `android.enableProguardInReleaseBuilds`, que o template não lê mais).
 *   Só afeta o buildType `release`, então é inócuo no debug local.
 *
 * Muda o fingerprint do runtime (`runtimeVersion: fingerprint`), então o
 * primeiro build depois disso precisa ser instalado na mão; os OTA
 * seguintes voltam ao normal. O fingerprint da EAS é auto-consistente
 * (cálculo e build veem `EAS_BUILD`); local diverge de propósito e não
 * publica OTA.
 *
 * @param {import('expo/config').ExpoConfig} config
 */
module.exports = function withAndroidLeanApk(config) {
  return withGradleProperties(config, (cfg) => {
    const props = {
      'android.enableMinifyInReleaseBuilds': 'true',
      'android.enableShrinkResourcesInReleaseBuilds': 'true',
      // Explícito nos dois casos pra não deixar valor velho num
      // gradle.properties já gerado (prebuild sem --clean).
      reactNativeArchitectures: process.env.EAS_BUILD
        ? 'arm64-v8a'
        : 'armeabi-v7a,arm64-v8a,x86,x86_64',
    };

    for (const [key, value] of Object.entries(props)) {
      cfg.modResults = cfg.modResults.filter(
        (item) => !(item.type === 'property' && item.key === key),
      );
      cfg.modResults.push({ type: 'property', key, value });
    }

    return cfg;
  });
};
