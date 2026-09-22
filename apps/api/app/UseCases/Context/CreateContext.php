<?php

declare(strict_types=1);

namespace App\UseCases\Context;

use App\DTOs\CreateContextData;
use App\Enums\ContextType;
use App\Exceptions\Domain\DuplicatePfContextException;
use App\Exceptions\Domain\MissingCompanyForContextException;
use App\Models\Category;
use App\Models\Company;
use App\Models\Context;
use App\Support\DefaultCategories;
use App\UseCases\User\ResetUserData;

/**
 * Cria um contexto (PF ou empresa) para um usuário.
 *
 * Não permite um segundo contexto `pf` para o mesmo usuário, nem um
 * contexto `company` sem empresa vinculada. Não cria a {@see Company}
 * — isso é responsabilidade de quem chama, antes de invocar este caso de uso.
 *
 * Todo contexto novo já nasce com {@see DefaultCategories} — pedido do
 * dono (22/09/2026) pra nunca cair numa tela de categorias vazia, nem
 * logo após o cadastro nem depois de "excluir tudo e começar de novo"
 * ({@see ResetUserData}, que recria o contexto PF por
 * aqui).
 *
 * @package App\UseCases\Context
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 22/09/2026
 */
final class CreateContext
{
    /**
     * @throws DuplicatePfContextException Se o usuário já tem contexto PF.
     * @throws MissingCompanyForContextException Se `company` sem `companyId`.
     */
    public function execute(CreateContextData $data): Context
    {
        if ($data->type === ContextType::Company && $data->companyId === null) {
            throw new MissingCompanyForContextException;
        }

        if ($data->type === ContextType::Pf) {
            $exists = Context::query()
                ->where('user_id', $data->userId)
                ->where('type', ContextType::Pf->value)
                ->exists();

            if ($exists) {
                throw new DuplicatePfContextException;
            }
        }

        $context = Context::create([
            'user_id' => $data->userId,
            'company_id' => $data->companyId,
            'type' => $data->type->value,
            'name' => $data->name,
        ]);

        $this->seedDefaultCategories($context);

        return $context;
    }

    private function seedDefaultCategories(Context $context): void
    {
        foreach (DefaultCategories::list() as $category) {
            Category::create([
                'context_id' => $context->id,
                'name' => $category['name'],
                'type' => $category['type'],
                'color' => $category['color'],
                'icon' => $category['icon'],
            ]);
        }
    }
}
