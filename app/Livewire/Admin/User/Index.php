<?php

declare(strict_types=1);

namespace App\Livewire\Admin\User;

use App\Models\User;
use App\UseCases\Admin\User\DeleteUser;
use App\UseCases\Admin\User\ListUsers;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\HtmlString;
use Livewire\Attributes\Url;
use Livewire\Component;
use Livewire\WithPagination;
use TallStackUi\Traits\Interactions;

/**
 * Listagem de usuários: busca, ordenação e exclusão.
 *
 * Exemplo canônico de CRUD (parte "Index"): localiza, autoriza via
 * Policy, delega a leitura a ListUsers e a exclusão a DeleteUser. Não
 * decide regra de negócio — zero `if` de negócio aqui.
 *
 * Pode falhar se a Policy negar o delete ou se houver restrição de
 * integridade no banco.
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
final class Index extends Component
{
    use Interactions;
    use WithPagination;

    #[Url(except: '')]
    public string $search = '';

    /** @var array{column: string, direction: string} */
    #[Url]
    public array $sort = ['column' => 'name', 'direction' => 'asc'];

    public function mount(): void
    {
        $this->authorize('viewAny', User::class);
    }

    public function updatingSearch(): void
    {
        $this->resetPage();
    }

    public function confirmDelete(int $userId): void
    {
        $this->dialog()
            ->question(__('users.index.delete_title'), __('users.index.delete_message'))
            ->confirm(__('users.index.delete_confirm'), 'delete', $userId)
            ->cancel(__('users.index.delete_cancel'))
            ->send();
    }

    public function delete(int $userId, DeleteUser $useCase): void
    {
        $user = User::query()->findOrFail($userId);
        $this->authorize('delete', $user);
        $useCase->execute($user);
        $this->dialog()
            ->success(__('ui.dialog.success'), __('users.index.deleted'))
            ->send();
    }

    public function render(ListUsers $useCase): View
    {
        $heading = __('users.index.heading');

        return view('admin.users.index', [
            'rows' => $useCase->execute($this->search, $this->sort['column'], $this->sort['direction']),
            'filtered' => $this->search !== '',
        ])->layout('layouts.admin', [
            'title' => $heading,
            'heading' => $heading,
            'actions' => new HtmlString(Blade::render(
                '<x-ui.button size="sm" :href="$href">{{ $label }}</x-ui.button>',
                ['href' => route('admin.users.create'), 'label' => __('users.index.new')],
            )),
        ]);
    }
}
