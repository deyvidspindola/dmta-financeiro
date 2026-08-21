<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\StatementEntry;
use App\UseCases\Transaction\TransferBetweenAccounts;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de uma transferência recém-criada — envolve as duas
 * pernas ({@see TransferBetweenAccounts}).
 *
 * @package App\Http\Resources
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class TransferResource extends JsonResource
{
    /**
     * @param  array{from: StatementEntry, to: StatementEntry}  $resource
     */
    public function __construct(array $resource)
    {
        parent::__construct($resource);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'from' => new StatementEntryResource($this->resource['from']),
            'to' => new StatementEntryResource($this->resource['to']),
        ];
    }
}
