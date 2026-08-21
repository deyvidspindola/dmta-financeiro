<?php

declare(strict_types=1);

namespace App\Livewire\Admin;

use App\Models\User;
use Illuminate\Contracts\View\View;
use Livewire\Component;

/**
 * Painel inicial da área /admin após o login.
 *
 * Exemplo canônico de tela "de leitura simples": localiza alguns números
 * de exemplo direto do Model (sem justificar um UseCase só para contar
 * registros) e delega toda a formatação para a view. Quando o projeto
 * derivado tiver métricas de negócio de verdade, troque esta consulta
 * direta por um UseCase em app/UseCases/Admin/.
 *
 * @package App\Livewire\Admin
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 18/08/2026
 */
final class Dashboard extends Component
{
    /**
     * Renderiza o painel com cards de exemplo.
     */
    public function render(): View
    {
        $heading = __('admin.dashboard.heading');

        return view('admin.dashboard', [
            'usersCount' => User::query()->count(),
            'environment' => config('app.env'),
            'laravelVersion' => app()->version(),
            'phpVersion' => PHP_VERSION,
        ])->layout('layouts.admin', [
            'title' => $heading,
            'heading' => $heading,
        ]);
    }
}
