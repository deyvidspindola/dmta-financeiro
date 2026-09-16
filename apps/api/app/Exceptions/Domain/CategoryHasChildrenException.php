<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada ao tentar mudar a categoria-mãe de uma categoria que já tem
 * subcategoria própria — o modelo só suporta 2 níveis (D-12); virar filha
 * de outra categoria enquanto mantém filhas próprias criaria um 3º nível
 * que a listagem (raiz + filhas diretas) não sabe renderizar.
 *
 * @package App\Exceptions\Domain
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   16/09/2026
 *
 * @updated 16/09/2026
 */
final class CategoryHasChildrenException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Esta categoria tem subcategorias — mova ou apague-as antes de mudar a categoria-mãe.');
    }
}
