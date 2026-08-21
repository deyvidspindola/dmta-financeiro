<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\UseCases\Search\SearchGlobally;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Endpoint de dados do command palette (Ctrl+K) da área /admin.
 *
 * Consumido via `fetch` pelo JS do TallStackUI (não é uma request
 * Livewire) — recebe `?search=termo` e devolve um array JSON simples
 * (nunca envelopado em `{data: [...]}`, é o formato que o componente
 * espera). Ver App\UseCases\Search\SearchGlobally pra onde a lógica
 * de fato mora.
 *
 * @package App\Http\Controllers\Admin
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 18/08/2026
 */
final class SearchController extends Controller
{
    public function __invoke(Request $request, SearchGlobally $useCase): JsonResponse
    {
        $results = $useCase->execute((string) $request->query('search', ''));

        return response()->json($results);
    }
}
