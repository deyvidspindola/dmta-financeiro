<?php

declare(strict_types=1);

namespace App\Livewire\Admin\User;

use App\Models\User;
use App\UseCases\Admin\User\UpdateUser;
use Illuminate\Contracts\View\View;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Livewire\Component;
use TallStackUi\Traits\Interactions;

/**
 * Formulário de edição de usuário.
 *
 * Exemplo canônico de CRUD (parte "Edit"): valida, autoriza via Policy
 * e delega a persistência a UpdateUser. Senha só muda se preenchida.
 * Exclusão fica na listagem (Index).
 *
 * Pode falhar se o e-mail colidir com outro usuário.
 *
 * @package App\Livewire\Admin\User
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 18/08/2026
 */
final class Edit extends Component
{
    use Interactions;

    public User $user;

    public string $name = '';

    public string $email = '';

    public string $password = '';

    public string $password_confirmation = '';

    public function mount(User $user): void
    {
        $this->authorize('update', $user);
        $this->user = $user;
        $this->name = $user->name;
        $this->email = $user->email;
    }

    /** Abre dialog de confirmação. Não persiste. */
    public function confirmSave(): void
    {
        $this->dialog()
            ->question(__('ui.crud.form.save_title'), __('ui.crud.form.save_message'))
            ->confirm(__('ui.crud.form.save_confirm'), 'save')
            ->cancel(__('ui.crud.form.save_dismiss'))
            ->send();
    }

    public function save(UpdateUser $useCase): void
    {
        $data = $this->validate($this->rules());
        $useCase->execute($this->user, $data);
        $this->toast()->success(__('users.form.updated'))->send();
        $this->redirect(route('admin.users.index'), navigate: true);
    }

    public function render(): View
    {
        $heading = __('users.form.edit_heading');

        return view('admin.users.edit', [
            'cancelHref' => route('admin.users.index'),
        ])->layout('layouts.admin', [
            'title' => $heading,
            'heading' => $heading,
        ]);
    }

    /** @return array<string, mixed> */
    private function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->user->id)],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ];
    }
}
