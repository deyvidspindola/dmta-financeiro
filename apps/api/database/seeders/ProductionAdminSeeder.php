<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\DTOs\CreateContextData;
use App\Enums\ContextType;
use App\Models\User;
use App\UseCases\Context\CreateContext;
use Illuminate\Database\Seeder;
use RuntimeException;

/**
 * Cria (ou atualiza a senha de) o usuário administrador real em produção,
 * a partir de ADMIN_EMAIL/ADMIN_PASSWORD (config/bootstrap_admin.php) —
 * nunca hardcoded, ao contrário do DatabaseSeeder padrão do template,
 * que é só para ambiente local (Docker/CI) e nunca deve rodar aqui.
 *
 * Existe porque o acesso SSH direto ao servidor ficou instável (tanto o
 * do desenvolvedor quanto o do usuário), enquanto o SSH usado pelo
 * GitHub Actions continuou funcionando — ver .github/workflows/
 * seed-admin.yml, que roda este seeder remotamente sem depender de
 * ninguém estar com SSH liberado no momento.
 *
 * Idempotente: pode rodar de novo com segurança (updateOrCreate no
 * usuário); só cria o contexto PF "Pessoal" se o usuário ainda não
 * tiver um, pra não duplicar nem sobrescrever dado real já cadastrado.
 *
 * Uso: `php artisan db:seed --class=ProductionAdminSeeder --force`
 *
 * @package Database\Seeders
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 */
class ProductionAdminSeeder extends Seeder
{
    /**
     * Cria/atualiza o usuário administrador e garante um contexto PF.
     *
     * @throws RuntimeException Se ADMIN_EMAIL/ADMIN_PASSWORD não estiverem definidos.
     */
    public function run(): void
    {
        $email = config('bootstrap_admin.email');
        $password = config('bootstrap_admin.password');

        if (! $email || ! $password) {
            throw new RuntimeException(
                'Defina ADMIN_EMAIL e ADMIN_PASSWORD antes de rodar este seeder.',
            );
        }

        $user = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => config('bootstrap_admin.name'),
                'password' => $password,
                'email_verified_at' => now(),
            ],
        );

        if ($user->contexts()->where('type', ContextType::Pf->value)->exists()) {
            return;
        }

        app(CreateContext::class)->execute(new CreateContextData(
            userId: $user->id,
            type: ContextType::Pf,
            name: 'Pessoal',
        ));
    }
}
