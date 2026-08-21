<?php

declare(strict_types=1);

namespace App\Livewire\Admin;

use App\UseCases\Admin\Profile\RemoveAvatar;
use App\UseCases\Admin\Profile\UpdateAvatar;
use App\UseCases\Admin\Profile\UpdatePassword;
use App\UseCases\Admin\Profile\UpdateProfile;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Livewire\Component;
use Livewire\WithFileUploads;
use TallStackUi\Traits\Interactions;

/**
 * Tela "Meu perfil" (/admin/perfil): dados de acesso do próprio usuário
 * autenticado.
 *
 * Três formulários independentes na mesma tela — dados (nome/e-mail),
 * senha e foto —, cada um salvando com seu próprio botão e delegando a
 * um UseCase diferente. Independentes de propósito: trocar a foto não
 * deveria exigir confirmar a senha atual, por exemplo.
 *
 * Não gerencia dados de OUTRO usuário — para isso existe
 * App\Livewire\Admin\User\Edit (tela do admin sobre outro usuário).
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
final class Profile extends Component
{
    use Interactions, WithFileUploads;

    public string $name = '';

    public string $email = '';

    public string $current_password = '';

    public string $password = '';

    public string $password_confirmation = '';

    /** Upload temporário (Livewire) da foto nova, antes de ser salva. */
    public mixed $avatar = null;

    public function mount(): void
    {
        $user = Auth::user();
        $this->name = $user->name;
        $this->email = $user->email;
    }

    /** Salva nome e e-mail. Não toca em senha nem em foto. */
    public function saveProfile(UpdateProfile $useCase): void
    {
        $data = $this->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore(Auth::id())],
        ]);

        $useCase->execute(Auth::user(), $data);
        $this->toast()->success(__('profile.form.updated'))->send();
    }

    /**
     * Troca a senha. Exige a senha atual — {@see UpdatePassword} confia
     * que a validação já conferiu isso via a regra `current_password`.
     */
    public function savePassword(UpdatePassword $useCase): void
    {
        $this->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $useCase->execute(Auth::user(), $this->password);
        $this->reset(['current_password', 'password', 'password_confirmation']);
        $this->toast()->success(__('profile.password.updated'))->send();
    }

    /** Envia a foto escolhida — salva assim que o input muda, sem botão. */
    public function updatedAvatar(UpdateAvatar $useCase): void
    {
        $this->validate(['avatar' => ['required', 'image', 'max:2048']]);

        $useCase->execute(Auth::user(), $this->avatar);
        $this->reset('avatar');
        $this->toast()->success(__('profile.avatar.updated'))->send();
    }

    /** Abre dialog de confirmação. Não remove nada ainda. */
    public function confirmRemoveAvatar(): void
    {
        $this->dialog()
            ->question(__('profile.avatar.remove_title'), __('profile.avatar.remove_message'))
            ->confirm(__('profile.avatar.remove_confirm'), 'removeAvatar')
            ->cancel(__('profile.avatar.remove_cancel'))
            ->send();
    }

    /** Remove a foto atual, voltando ao avatar de iniciais. */
    public function removeAvatar(RemoveAvatar $useCase): void
    {
        $useCase->execute(Auth::user());
        $this->toast()->success(__('profile.avatar.removed'))->send();
    }

    public function render(): View
    {
        $heading = __('profile.heading');

        return view('admin.profile', [
            'user' => Auth::user(),
        ])->layout('layouts.admin', [
            'title' => $heading,
            'heading' => $heading,
        ]);
    }
}
