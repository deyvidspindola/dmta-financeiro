<?php

declare(strict_types=1);

namespace App\UseCases\Admin\Profile;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Substitui a foto de perfil do usuário autenticado.
 *
 * Guarda o arquivo novo no disco "public" (pasta "avatars/") e apaga o
 * anterior, se houver — nunca deixa arquivo órfão no storage.
 *
 * @package App\UseCases\Admin\Profile
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 18/08/2026
 */
final class UpdateAvatar
{
    public function execute(User $user, UploadedFile $file): User
    {
        $previous = $user->avatar_path;

        $user->avatar_path = $file->store('avatars', 'public');
        $user->save();

        if ($previous) {
            Storage::disk('public')->delete($previous);
        }

        return $user->refresh();
    }
}
