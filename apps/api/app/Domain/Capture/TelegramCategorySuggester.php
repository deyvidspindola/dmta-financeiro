<?php

declare(strict_types=1);

namespace App\Domain\Capture;

use App\Models\Category;
use App\Models\StatementEntry;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * A "inteligência" do bot na hora de escolher a categoria: ordena as
 * categorias do contexto pela chance de serem a certa pra aquela
 * descrição — combinando (1) palavra da descrição batendo no nome da
 * categoria e (2) como o dono categorizou lançamentos parecidos antes
 * (os próprios `StatementEntry` são a memória, não há tabela de
 * aprendizado separada).
 *
 * @package App\Domain\Capture
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   07/09/2026
 *
 * @updated 07/09/2026
 */
final class TelegramCategorySuggester
{
    private const STOP_WORDS = ['gastei', 'paguei', 'comprei', 'recebi', 'ganhei', 'de', 'do', 'da', 'no', 'na', 'em', 'com', 'para', 'pra', 'por', 'um', 'uma', 'reais'];

    /**
     * Categorias do contexto/tipo, mais prováveis primeiro.
     *
     * @return list<array{id: int, name: string, strong: bool}>
     */
    public function rank(string $description, int $contextId, string $type): array
    {
        $tokens = $this->tokens($description);

        /** @var Collection<int, Category> $categories */
        $categories = Category::query()
            ->where('context_id', $contextId)
            ->where('type', $type)
            ->orderBy('name')
            ->get();

        $history = $this->historyCounts($tokens, $contextId, $type);

        $scored = $categories->map(function (Category $category) use ($tokens, $history): array {
            $nameHit = $this->nameMatches($category->name, $tokens);
            $past = $history[$category->id] ?? 0;

            return [
                'id' => $category->id,
                'name' => $category->name,
                'score' => ($nameHit ? 10 : 0) + $past,
                'strong' => $nameHit || $past >= 3,
            ];
        })->sortByDesc('score')->values();

        // "strong" só na categoria do topo, e só se ela está claramente
        // na frente da segunda opção.
        $top = $scored->first();
        $second = $scored->get(1);
        $winnerId = ($top !== null && $top['score'] > 0
            && ($second === null || $top['score'] >= $second['score'] * 2))
            ? $top['id']
            : null;

        return $scored->map(fn (array $c): array => [
            'id' => $c['id'],
            'name' => $c['name'],
            'strong' => $c['strong'] && $c['id'] === $winnerId,
        ])->all();
    }

    /** @return list<string> */
    private function tokens(string $description): array
    {
        $words = preg_split('/\s+/', Str::of($description)->lower()->ascii()->toString()) ?: [];

        return array_values(array_filter(
            $words,
            fn (string $w): bool => mb_strlen($w) >= 3 && ! in_array($w, self::STOP_WORDS, true) && ! is_numeric($w),
        ));
    }

    /**
     * @param  list<string>  $tokens
     * @return array<int, int> category_id => nº de lançamentos passados com descrição parecida
     */
    private function historyCounts(array $tokens, int $contextId, string $type): array
    {
        if ($tokens === []) {
            return [];
        }

        return StatementEntry::query()
            ->where('context_id', $contextId)
            ->where('type', $type)
            ->whereNotNull('category_id')
            ->where(function ($query) use ($tokens): void {
                foreach ($tokens as $token) {
                    $query->orWhere('description', 'like', '%'.$token.'%');
                }
            })
            ->selectRaw('category_id, count(*) as total')
            ->groupBy('category_id')
            ->pluck('total', 'category_id')
            ->map(fn ($v): int => (int) $v)
            ->all();
    }

    /** @param  list<string>  $tokens */
    private function nameMatches(string $name, array $tokens): bool
    {
        $normalized = Str::of($name)->lower()->ascii()->toString();

        foreach ($tokens as $token) {
            if (str_contains($normalized, $token) || str_contains($token, $normalized)) {
                return true;
            }
        }

        return false;
    }
}
