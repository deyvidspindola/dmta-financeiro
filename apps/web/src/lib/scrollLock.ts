/**
 * Trava de scroll do body com contador — cada modal aberto soma uma trava,
 * e o body só volta a rolar quando a última é solta. Guardar/restaurar o
 * `overflow` anterior (como era) quebra com modal dentro de modal: na
 * desmontagem o de fora restaura primeiro e o de dentro devolve o
 * `hidden`, deixando a tela sem scroll até recarregar.
 */
let locks = 0

export function lockBodyScroll(): () => void {
  locks += 1
  if (locks === 1) document.body.style.overflow = 'hidden'

  let released = false
  return () => {
    if (released) return
    released = true
    locks = Math.max(0, locks - 1)
    if (locks === 0) document.body.style.removeProperty('overflow')
  }
}
