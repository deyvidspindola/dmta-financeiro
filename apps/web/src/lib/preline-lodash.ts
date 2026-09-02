/**
 * O Advanced Datepicker do Preline usa `_.mergeWith` via global `_` (lodash).
 * Precisa existir em `window` antes de carregar `preline/plugins/datepicker`.
 */
import _ from 'lodash'

;(window as Window & { _: typeof _ })._ = _
