import { Image, type ImageProps } from 'react-native';

const MARK = require('../../../assets/logo/mark-256.png');

export type LogoProps = { size?: number } & Omit<ImageProps, 'source'>;

/**
 * A marca do app (moeda + seta) — mesmo símbolo do ícone do celular.
 * Usada na tela de login. O arquivo vem de `assets/logo/`, gerado a
 * partir de `assets/logo/mark.svg`.
 */
export function Logo({ size = 72, style, ...props }: LogoProps) {
  return (
    <Image
      source={MARK}
      accessibilityRole="image"
      style={[{ width: size, height: size }, style]}
      {...props}
    />
  );
}
