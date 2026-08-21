<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Seeder padrão do template — cria o usuário admin de desenvolvimento.
 *
 * A senha `password` e o e-mail `admin@example.com` são fixos de propósito,
 * só para ambiente local (Docker/CI). NUNCA rode este seeder em produção —
 * troque a senha imediatamente se isso acontecer por engano.
 *
 * @package Database\Seeders
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 18/08/2026
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Cria o usuário admin de teste local.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrador',
                // Senha fixa apenas para desenvolvimento local — nunca em produção.
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );
    }
}
