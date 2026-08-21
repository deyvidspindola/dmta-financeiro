<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

/**
 * Provider padrão do Laravel para bindings e bootstrap da aplicação.
 *
 * Vazio no template de propósito — cada projeto derivado registra aqui
 * só o que for específico dele (bindings de interface, observers, etc.).
 * Não é lugar para regra de negócio.
 *
 * @package App\Providers
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 18/08/2026
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Registra serviços da aplicação.
     */
    public function register(): void
    {
        //
    }

    /**
     * Executa rotinas de bootstrap da aplicação.
     */
    public function boot(): void
    {
        //
    }
}
