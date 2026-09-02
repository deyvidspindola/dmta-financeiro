import { strings } from './pt-BR';

export { strings } from './pt-BR';
export type { Strings } from './pt-BR';

/** Atalho: `t.auth.title`. Mesmo objeto de `strings`, nome curto pras telas. */
export const t = strings;

/** Interpola `{chave}` num template. `format(t.homePlaceholder.greeting, { name })`. */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}
