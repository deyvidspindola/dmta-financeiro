<?php

declare(strict_types=1);

namespace App\Livewire\Admin\User;

use App\Models\User;
use App\UseCases\Admin\User\CreateUser;
use Illuminate\Contracts\View\View;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Livewire\Component;
use TallStackUi\Traits\Interactions;

/**
 * Formulário de criação de usuário.
 *
 * Exemplo canônico de CRUD (parte "Create"): valida, autoriza via
 * Policy e delega a persistência a CreateUser. Não envia e-mail de
 * boas-vindas nem convite.
 *
 * Pode falhar se o e-mail já existir.
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
final class Create extends Component
{
    use Interactions;

    public string $name = '';

    public string $email = '';

    public string $password = '';

    public string $password_confirmation = '';

    public function mount(): void
    {
        $this->authorize('create', User::class);
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

    /** @throws ValidationException */
    public function save(CreateUser $useCase): void
    {
        $data = $this->validate($this->rules());
        $useCase->execute($data);
        $this->toast()->success(__('users.form.created'))->send();
        $this->redirect(route('admin.users.index'), navigate: true);
    }

    public function render(): View
    {
        $heading = __('users.form.create_heading');

        return view('admin.users.create', [
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
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'confirmed', Password::defaults()],
        ];
    }
}
