import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/*
 * Preline UI é headless: os plugins são inicializados varrendo o DOM. Numa
 * SPA, cada troca de rota traz markup novo — por isso re-inicializamos a cada
 * navegação (`usePrelineInit`). Cada `import` abaixo registra um plugin na
 * coleção e publica `window.HSStaticMethods`.
 *
 * Importamos só os plugins em uso — o `import 'preline'` cheio arrasta
 * datatables.net, dropzone, nouislider e vanilla-calendar-pro (~380 kB). Ao
 * adotar um componente novo (select, datepicker...), adicione o import aqui.
 *
 * NÃO cobre markup que aparece DEPOIS da rota montar (modal aberto por estado,
 * lista async) — nesses casos chame `reinitPreline()` na mão.
 */
import 'preline/plugins/dropdown'
import 'preline/plugins/overlay'
import 'preline/plugins/tabs'
import 'preline/plugins/tooltip'
import 'preline/plugins/accordion'
import 'preline/plugins/collapse'
// Datepicker: wrapper próprio em DatePickerField (vanilla-calendar-pro).
// Não importar preline/plugins/datepicker — problemático em modal.

type HSWindow = Window & {
  HSStaticMethods?: { autoInit: (collection?: string | string[]) => void }
}

/** Re-varre o DOM e liga os plugins Preline em markup novo. */
export function reinitPreline(): void {
  ;(window as HSWindow).HSStaticMethods?.autoInit()
}

/** Liga os plugins Preline a cada mudança de rota. Use uma vez, no layout raiz. */
export function usePrelineInit(): void {
  const { pathname } = useLocation()

  useEffect(() => {
    // setTimeout: espera o React pintar o markup da nova rota antes de varrer.
    const id = window.setTimeout(reinitPreline, 100)
    return () => window.clearTimeout(id)
  }, [pathname])
}
