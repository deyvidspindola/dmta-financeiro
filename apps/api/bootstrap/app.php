<?php

use App\Exceptions\Domain\DomainException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Sanctum\Http\Middleware\CheckForAnyAbility;
use Sentry\Laravel\Integration as SentryIntegration;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // O esqueleto do Laravel 13 não registra os aliases de ability do
        // Sanctum sozinho — usados pra separar o token "pendente" de MFA
        // (D-10) do token de acesso normal em routes/api.php.
        $middleware->alias(['ability' => CheckForAnyAbility::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Violação de regra de negócio (app/Exceptions/Domain/*) é erro do
        // cliente, não do servidor — 422, igual a uma falha de validação,
        // nunca 500. E não vai pro Sentry: "lançamento duplicado", "fatura
        // já paga", "captura já processada" são fluxo normal, não incidente.
        $exceptions->dontReport(DomainException::class);
        $exceptions->render(fn (DomainException $e) => new JsonResponse(['message' => $e->getMessage()], 422));

        // Sentry desde o primeiro bloco de código (F0), mesmo sem DSN
        // configurado ainda — sem SENTRY_LARAVEL_DSN no .env o SDK só não
        // envia nada, não quebra. Configurar o DSN é ligar o monitoramento,
        // não escrever código novo.
        SentryIntegration::handles($exceptions);
    })->create();
