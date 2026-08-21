<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Encerra a sessão do usuário autenticado na área /admin.
 *
 * Só delega ao guard de sessão e invalida o token CSRF. Não decide regra
 * de negócio, não registra auditoria — controller nunca tem `if` de
 * negócio (ver CONVENTIONS.md).
 *
 * @package App\Http\Controllers\Auth
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 18/08/2026
 */
final class LogoutController extends Controller
{
    /**
     * Faz logout e volta para a tela de login.
     */
    public function __invoke(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
