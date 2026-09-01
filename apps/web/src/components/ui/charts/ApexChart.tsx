import type { ComponentType } from 'react'
import type { Props } from 'react-apexcharts'
import * as ApexMod from 'react-apexcharts'

/*
 * Camada fina que isola o `import` do react-apexcharts num módulo próprio
 * — o `React.lazy` carrega ESTE arquivo (default = função React), evitando
 * o problema de interop CJS de `lazy(() => import('react-apexcharts'))`.
 *
 * O react-apexcharts v1 é CJS (`exports.default = Charts`); conforme o
 * bundler, o default chega direto ou aninhado — desembrulhamos aqui.
 */
const mod = ApexMod as unknown as {
  default?: ComponentType<Props> & { default?: ComponentType<Props> }
}
const ReactApexChart: ComponentType<Props> =
  mod.default?.default ?? mod.default ?? (ApexMod as unknown as ComponentType<Props>)

export default function ApexChart(props: Props) {
  return <ReactApexChart {...props} />
}
